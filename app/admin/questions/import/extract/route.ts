import { NextRequest } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { PARTS } from '@/lib/exam/parts'

// Allow up to 5 minutes on Vercel Pro / Fluid Compute
export const maxDuration = 300

// ─── Compact output format ────────────────────────────────────────────────────
// Passages are stored once and referenced by index — avoids repeating a 500-char
// passage for every question in a group, cutting output tokens by ~70%.

type CompactQuestion = {
  pi: number | null      // index into passages array; null = no passage
  ii: number | null      // index into images array; null = no image/table
  part?: string          // full-exam mode only
  module?: string        // full-exam mode only
  q: string              // question content
  a: string; b: string; c: string; d: string
  ans: string            // "A"|"B"|"C"|"D"|""
}

type CompactResponse = {
  passages: string[]
  images: string[]       // short labels e.g. "[bảng]" or "[hình vẽ]"; questions share by index
  questions: CompactQuestion[]
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const SHARED_NOTES = `
Lưu ý quan trọng:
- CÂU HỎI HỢP LỆ: phải có số thứ tự ĐƠN (Câu X — một số, không phải khoảng) VÀ có đúng 4 đáp án A/B/C/D rõ ràng để chọn.
- TUYỆT ĐỐI KHÔNG tạo question từ các loại text sau — đây là ngữ cảnh, KHÔNG phải câu hỏi:
  (a) Tiêu đề phần/mục: "PHẦN 1. SỬ DỤNG NGÔN NGỮ", "PHẦN 2. TOÁN HỌC", "1.1. TIẾNG VIỆT", "3.1. Tư duy logic", v.v.
  (b) Hướng dẫn cho nhóm câu: "Câu 31 đến 35: Choose a suitable word...", "Câu 36 đến 40: Each sentence has one error...", "Câu 41 đến 45: Which best restates...", "Câu 46 đến 52: Read the following passage...", "Câu 53 đến 60: Read the passage carefully.", v.v.
  (c) Tiêu đề ngữ liệu nhóm: "Dựa vào thông tin/đoạn văn dưới đây để trả lời các câu từ X đến Y", v.v.
- Hướng dẫn nhóm câu (dạng "Câu X đến Y: [instruction]"): lưu nội dung instruction (và đoạn văn đi kèm nếu có) gộp vào passages[] như một entry; đặt pi cho TẤT CẢ câu X..Y trỏ đến index đó.
- Đoạn văn/ngữ liệu chia sẻ: lưu MỘT lần vào "passages"; TẤT CẢ câu thuộc nhóm đều đặt pi = index đó.
- "q" chỉ chứa nội dung câu hỏi cụ thể, không lặp lại đoạn văn/ngữ liệu hay hướng dẫn nhóm.
- Bảng số liệu / hình vẽ / đồ thị / sơ đồ: thêm nhãn ngắn vào "images" (VD: "[bảng]", "[hình vẽ]") và đặt "ii" = index đó. Nhiều câu dùng chung → tất cả cùng "ii". KHÔNG tái tạo bảng/hình thành text. Câu không có hình/bảng: "ii": null.
- "ans": một trong "A","B","C","D"; đặt "" nếu không xác định được.
- Giữ nguyên toàn bộ nội dung câu hỏi và đáp án, không tóm tắt.
- Chỉ trả về JSON object, không có text nào khác.
- KIỂM TRA CUỐI: đếm số phần tử trong mảng questions — phải khớp chính xác với số câu hỏi (Câu X đơn lẻ có A/B/C/D) có trong đề. Nếu sai, rà soát lại để loại bỏ các mục không phải câu hỏi.`

const PART_DESCRIPTIONS = `
Đề thi ĐGNL TPHCM gồm 4 phần:
- "viet"     : Tiếng Việt — module: doc_hieu (đọc hiểu), ngu_phap (ngữ pháp/từ vựng), van_hoc (văn học/thơ ca), dien_dat (diễn đạt/viết)
- "anh"      : Tiếng Anh — module: grammar (ngữ pháp, fill-in-blank, tìm lỗi sai), writing (đặt câu, paraphrase, nối câu), reading (đọc hiểu passage dài)
- "toan"     : Toán học — module: dai_so, hinh_hoc, giai_tich, xac_suat
- "khoa_hoc" : Tư duy khoa học — module: vat_ly, hoa_hoc, sinh_hoc, xa_hoi (logic/phân tích số liệu/xã hội)`

function buildPrompt(mode: string, partLabel: string, moduleLabel: string): string {
  const schema = mode === 'full'
    ? `{"passages":["đoạn văn 1","..."],"images":["[bảng]","[hình vẽ]"],"questions":[{"pi":null,"ii":0,"part":"toan","module":"hinh_hoc","q":"...","a":"...","b":"...","c":"...","d":"...","ans":"A"}]}`
    : `{"passages":["đoạn văn 1","..."],"images":["[bảng]"],"questions":[{"pi":0,"ii":null,"q":"...","a":"...","b":"...","c":"...","d":"...","ans":"A"}]}`

  if (mode === 'full') {
    return `Đây là đề thi ĐGNL TPHCM đầy đủ gồm 120 câu hỏi (Câu 1 đến Câu 120). JSON output phải có đúng 120 questions.
${PART_DESCRIPTIONS}

Trích xuất TẤT CẢ 120 câu hỏi trắc nghiệm. Trả về JSON object theo đúng schema này:

${schema}
${SHARED_NOTES}
- part phải là một trong: "viet","anh","toan","khoa_hoc".
- module phải là key tương ứng với part (xem mô tả ở trên để phân loại đúng).`
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
    image_description: q.ii !== null && q.ii !== undefined ? (compact.images?.[q.ii] ?? '[hình ảnh]') : null,
    image_group:       q.ii ?? null,
    content:           q.q,
    option_a:          q.a,
    option_b:          q.b,
    option_c:          q.c,
    option_d:          q.d,
    answer:            q.ans ?? '',
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

        const ai = new GoogleGenAI({ apiKey })

        // Small thinking budget lets the model self-verify completeness (count questions, check
        // all passages are linked) without the full cost/latency of uncapped reasoning.
        const stream = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents: [{
            parts: [
              { inlineData: { data: base64, mimeType: 'application/pdf' } },
              { text: prompt },
            ],
          }],
          config: {
            thinkingConfig: { thinkingBudget: 8192 },
            maxOutputTokens: 65536,
          },
        })

        let fullText = ''

        for await (const chunk of stream) {
          fullText += chunk.text ?? ''
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
        console.error('[PDF Extract]', err)
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
