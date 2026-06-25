import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { PARTS } from '@/lib/exam/parts'

// Allow up to 5 minutes on Vercel Pro / Fluid Compute
export const maxDuration = 300

// ─── Compact output format ────────────────────────────────────────────────────
// Passages are stored once and referenced by index — avoids repeating a 500-char
// passage for every question in a group, cutting output tokens by ~70%.

type CompactQuestion = {
  pi: number | null      // index into passages array; null = no passage
  part?: string          // full-exam mode only
  module?: string        // full-exam mode only
  img: string | null     // image description
  q: string              // question content
  a: string; b: string; c: string; d: string
  ans: string            // "A"|"B"|"C"|"D"|""
  exp: string | null     // explanation
}

type CompactResponse = {
  passages: string[]
  questions: CompactQuestion[]
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const SHARED_NOTES = `
Lưu ý quan trọng:
- Mỗi đoạn văn/ngữ liệu chỉ lưu MỘT lần vào mảng "passages"; các câu hỏi dùng chung đoạn đó thì đặt "pi" = index của đoạn đó.
- "q" chỉ chứa câu hỏi, không lặp lại đoạn văn.
- "img": mô tả chi tiết hình vẽ/sơ đồ nếu có; null nếu không có.
- "ans": một trong "A","B","C","D"; đặt "" nếu không có đáp án.
- "exp": giải thích hoặc null.
- Giữ nguyên toàn bộ nội dung, không tóm tắt.
- Chỉ trả về JSON object, không có text nào khác.`

const PART_DESCRIPTIONS = `
Đề thi ĐGNL TPHCM gồm 4 phần:
- "viet"     : Tiếng Việt — module: doc_hieu, ngu_phap, van_hoc, dien_dat
- "anh"      : Tiếng Anh — module: reading, grammar, writing
- "toan"     : Toán học — module: dai_so, hinh_hoc, giai_tich, xac_suat
- "khoa_hoc" : Tư duy khoa học — module: vat_ly, hoa_hoc, sinh_hoc, xa_hoi`

function buildPrompt(mode: string, partLabel: string, moduleLabel: string): string {
  const schema = mode === 'full'
    ? `{"passages":["đoạn văn 1","..."],"questions":[{"pi":0,"part":"toan","module":"hinh_hoc","img":null,"q":"...","a":"...","b":"...","c":"...","d":"...","ans":"A","exp":null}]}`
    : `{"passages":["đoạn văn 1","..."],"questions":[{"pi":0,"img":null,"q":"...","a":"...","b":"...","c":"...","d":"...","ans":"A","exp":null}]}`

  if (mode === 'full') {
    return `Đây là đề thi ĐGNL TPHCM đầy đủ.
${PART_DESCRIPTIONS}

Trích xuất TẤT CẢ câu hỏi trắc nghiệm. Trả về JSON object theo đúng schema này:

${schema}
${SHARED_NOTES}
- part phải là một trong: "viet","anh","toan","khoa_hoc".
- module phải là key tương ứng với part.`
  }

  return `Đây là tài liệu trắc nghiệm môn ${partLabel}, chủ đề ${moduleLabel}.

Trích xuất TẤT CẢ câu hỏi trắc nghiệm. Trả về JSON object theo đúng schema này:

${schema}
${SHARED_NOTES}`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countPartialQuestions(text: string): number {
  return (text.match(/"q"\s*:/g) ?? []).length
}

function expandCompact(compact: CompactResponse, fixedPart?: string, fixedModule?: string) {
  return compact.questions.map(q => ({
    part:              q.part ?? fixedPart ?? '',
    module:            q.module ?? fixedModule ?? '',
    passage:           q.pi !== null && q.pi !== undefined ? (compact.passages[q.pi] ?? null) : null,
    image_description: q.img ?? null,
    content:           q.q,
    option_a:          q.a,
    option_b:          q.b,
    option_c:          q.c,
    option_d:          q.d,
    answer:            q.ans ?? '',
    explanation:       q.exp ?? null,
  }))
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file     = formData.get('pdf')    as File   | null
  const mode     = formData.get('mode')   as string
  const part     = (formData.get('part')   as string) ?? ''
  const module   = (formData.get('module') as string) ?? ''

  const encoder = new TextEncoder()
  const send = (ctrl: ReadableStreamDefaultController, data: object) =>
    ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

  const stream = new ReadableStream({
    async start(ctrl) {
      try {
        if (!file || file.size === 0) {
          send(ctrl, { phase: 'error', error: 'Vui lòng chọn file PDF.' }); return ctrl.close()
        }
        if (file.type !== 'application/pdf') {
          send(ctrl, { phase: 'error', error: 'Chỉ hỗ trợ file PDF.' }); return ctrl.close()
        }
        if (file.size > 20 * 1024 * 1024) {
          send(ctrl, { phase: 'error', error: 'File quá lớn (tối đa 20MB).' }); return ctrl.close()
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
          send(ctrl, { phase: 'error', error: 'GEMINI_API_KEY chưa được cấu hình.' }); return ctrl.close()
        }

        const fileSizeMB = file.size / 1024 / 1024
        const estimatedSeconds = Math.round(15 + fileSizeMB * 3)

        send(ctrl, { phase: 'reading', progress: 5, estimatedSeconds })

        const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')

        send(ctrl, { phase: 'analyzing', progress: 15, estimatedSeconds })

        const partLabel  = PARTS[part as keyof typeof PARTS]?.label ?? part
        const moduleLabel = PARTS[part as keyof typeof PARTS]?.modules[module] ?? module
        const prompt = buildPrompt(mode, partLabel, moduleLabel)

        const genAI = new GoogleGenerativeAI(apiKey)
        // gemini-1.5-flash: free tier (1500 req/day), stable, confirmed PDF support
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

        const result = await model.generateContentStream([
          { inlineData: { data: base64, mimeType: 'application/pdf' } },
          prompt,
        ])

        let fullText = ''

        for await (const chunk of result.stream) {
          fullText += chunk.text()
          const found = countPartialQuestions(fullText)
          const charProgress = Math.min(72, (fullText.length / 12000) * 72)
          send(ctrl, {
            phase: 'extracting',
            progress: Math.round(15 + charProgress),
            partialCount: found,
            estimatedSeconds,
          })
        }

        send(ctrl, { phase: 'parsing', progress: 93, estimatedSeconds })

        // Strip markdown fences; also handle models that wrap JSON in extra prose
        let clean = fullText
          .replace(/^```(?:json)?\n?/, '')
          .replace(/\n?```$/, '')
          .trim()

        // If the model added prose before/after the JSON object, extract just the object
        const jsonStart = clean.indexOf('{')
        const jsonEnd   = clean.lastIndexOf('}')
        if (jsonStart > 0 || jsonEnd < clean.length - 1) {
          clean = clean.slice(jsonStart, jsonEnd + 1)
        }

        const compact = JSON.parse(clean) as CompactResponse
        const questions = expandCompact(compact, part, module)

        if (!questions.length) {
          send(ctrl, { phase: 'error', error: 'Không tìm thấy câu hỏi nào trong file này.' })
          return ctrl.close()
        }

        send(ctrl, { phase: 'done', progress: 100, questions })
        ctrl.close()
      } catch (err) {
        const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()
        let friendly: string

        if (msg.includes('stream') || msg.includes('parse') || msg.includes('json')) {
          friendly = 'Model AI trả về phản hồi không hợp lệ. Thử lại — nếu vẫn lỗi hãy dùng file nhỏ hơn hoặc đổi model.'
        } else if (msg.includes('quota') || msg.includes('rate') || msg.includes('429')) {
          friendly = 'Đã vượt giới hạn Gemini API miễn phí. Chờ 1 phút rồi thử lại.'
        } else if (msg.includes('404') || msg.includes('not found') || msg.includes('model')) {
          friendly = 'Model AI không hợp lệ hoặc không hỗ trợ PDF. Kiểm tra GEMINI_API_KEY và tên model.'
        } else if (msg.includes('timeout') || msg.includes('deadline')) {
          friendly = 'Quá thời gian chờ. Hãy dùng file nhỏ hơn hoặc nâng cấp plan Vercel.'
        } else if (msg.includes('safety') || msg.includes('blocked')) {
          friendly = 'Gemini từ chối xử lý file này (safety filter). Thử file khác.'
        } else {
          friendly = `Lỗi: ${err instanceof Error ? err.message : String(err)}`
        }

        send(ctrl, { phase: 'error', error: friendly })
        ctrl.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}
