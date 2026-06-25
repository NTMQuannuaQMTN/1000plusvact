'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { PARTS } from '@/lib/exam/parts'

export type ExtractedQuestion = {
  // full-exam mode populates these; part-mode leaves them as the selected value
  part?: string
  module?: string
  passage: string | null
  image_description: string | null
  content: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  answer: string
  explanation: string | null
}

export type ImportResult =
  | { ok: true; questions: ExtractedQuestion[]; mode: 'part'; part: string; module: string }
  | { ok: true; questions: ExtractedQuestion[]; mode: 'full'; testTitle: string }
  | { ok: false; error: string }

// ─── helpers ───────────────────────────────────────────────────────────────────

function getModel(apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
}

function parseJson<T>(raw: string): T {
  const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(clean) as T
}

const SHARED_NOTES = `
Lưu ý quan trọng về định dạng:
- passage: nếu nhiều câu hỏi dùng chung một đoạn văn, copy NGUYÊN đoạn đó vào trường "passage" của TỪNG câu trong nhóm; đặt null nếu không có ngữ liệu.
- content: CHỈ chứa câu hỏi, không lặp lại đoạn văn.
- image_description: nếu câu hỏi kèm hình vẽ/sơ đồ/bảng số liệu, mô tả chi tiết hình đó bằng văn bản (ví dụ: "Hình chữ nhật ABCD với hai đường chéo cắt nhau tại E và F nằm giữa E và C"); đặt null nếu không có hình.
- answer: một trong "A","B","C","D"; đặt "" nếu không có trong tài liệu.
- Giữ nguyên toàn bộ nội dung, không tóm tắt.
- Chỉ trả về JSON array, không có text nào khác.`

// ─── Part mode (existing) ───────────────────────────────────────────────────

export async function extractQuestionsFromPdf(formData: FormData): Promise<ImportResult> {
  const file = formData.get('pdf') as File | null
  const part = formData.get('part') as string
  const module = formData.get('module') as string

  if (!file || file.size === 0) return { ok: false, error: 'Vui lòng chọn file PDF.' }
  if (!part || !module) return { ok: false, error: 'Vui lòng chọn môn học và chủ đề.' }
  if (file.type !== 'application/pdf') return { ok: false, error: 'Chỉ hỗ trợ file PDF.' }
  if (file.size > 20 * 1024 * 1024) return { ok: false, error: 'File quá lớn (tối đa 20MB).' }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { ok: false, error: 'GEMINI_API_KEY chưa được cấu hình.' }

  const partLabel = PARTS[part as keyof typeof PARTS]?.label ?? part
  const moduleLabel = PARTS[part as keyof typeof PARTS]?.modules[module] ?? module
  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')

  const prompt = `Đây là tài liệu trắc nghiệm môn ${partLabel}, chủ đề ${moduleLabel}.

Trích xuất TẤT CẢ câu hỏi trắc nghiệm và trả về JSON array:

[
  {
    "passage": "...",
    "image_description": "...",
    "content": "...",
    "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...",
    "answer": "A",
    "explanation": "..."
  }
]
${SHARED_NOTES}`

  try {
    const raw = (await getModel(apiKey).generateContent([
      { inlineData: { data: base64, mimeType: 'application/pdf' } },
      prompt,
    ])).response.text()

    const questions = parseJson<ExtractedQuestion[]>(raw)
    if (!Array.isArray(questions) || !questions.length)
      return { ok: false, error: 'Không tìm thấy câu hỏi nào trong file này.' }

    return { ok: true, questions, mode: 'part', part, module }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.log(err);
    return { ok: false, error: msg.includes('JSON') ? 'AI không thể trích xuất câu hỏi. Hãy thử file khác.' : msg }
  }
}

// ─── Full-exam mode ─────────────────────────────────────────────────────────

const PART_DESCRIPTIONS = `
Đề thi ĐGNL TPHCM gồm 4 phần, phân biệt theo part key:
- "viet"     : Tiếng Việt — module keys: doc_hieu (đọc hiểu), ngu_phap (ngữ pháp & từ vựng), van_hoc (văn học), dien_dat (diễn đạt)
- "anh"      : Tiếng Anh — module keys: reading, grammar, writing
- "toan"     : Toán học — module keys: dai_so (đại số), hinh_hoc (hình học), giai_tich (giải tích), xac_suat (xác suất & thống kê)
- "khoa_hoc" : Tư duy khoa học — module keys: vat_ly (vật lý), hoa_hoc (hóa học), sinh_hoc (sinh học), xa_hoi (khoa học xã hội)`

export async function extractFullExamFromPdf(formData: FormData): Promise<ImportResult> {
  const file = formData.get('pdf') as File | null
  const testTitle = (formData.get('test_title') as string)?.trim()

  if (!file || file.size === 0) return { ok: false, error: 'Vui lòng chọn file PDF.' }
  if (!testTitle) return { ok: false, error: 'Vui lòng nhập tên đề thi.' }
  if (file.type !== 'application/pdf') return { ok: false, error: 'Chỉ hỗ trợ file PDF.' }
  if (file.size > 20 * 1024 * 1024) return { ok: false, error: 'File quá lớn (tối đa 20MB).' }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { ok: false, error: 'GEMINI_API_KEY chưa được cấu hình.' }

  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')

  const prompt = `Đây là một đề thi ĐGNL (Đánh giá năng lực) TPHCM đầy đủ.
${PART_DESCRIPTIONS}

Trích xuất TẤT CẢ câu hỏi trắc nghiệm, xác định part và module cho mỗi câu, trả về JSON array:

[
  {
    "part": "toan",
    "module": "hinh_hoc",
    "passage": "...",
    "image_description": "...",
    "content": "...",
    "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...",
    "answer": "A",
    "explanation": "..."
  }
]
${SHARED_NOTES}
- part phải là một trong: "viet", "anh", "toan", "khoa_hoc".
- module phải là một trong các key tương ứng của part đó (xem bảng trên).`

  try {
    const raw = (await getModel(apiKey).generateContent([
      { inlineData: { data: base64, mimeType: 'application/pdf' } },
      prompt,
    ])).response.text()

    const questions = parseJson<ExtractedQuestion[]>(raw)
    if (!Array.isArray(questions) || !questions.length)
      return { ok: false, error: 'Không tìm thấy câu hỏi nào trong file này.' }

    return { ok: true, questions, mode: 'full', testTitle }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: msg.includes('JSON') ? 'AI không thể trích xuất câu hỏi. Hãy thử file khác.' : msg }
  }
}

// ─── Save ───────────────────────────────────────────────────────────────────

export async function saveImportedQuestions(formData: FormData) {
  const { createClient } = await import('@/lib/supabase/server')
  const { redirect } = await import('next/navigation')
  const { revalidatePath } = await import('next/cache')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const mode = formData.get('mode') as 'part' | 'full'
  const fixedPart = formData.get('part') as string | null
  const fixedModule = formData.get('module') as string | null
  const testTitle = formData.get('test_title') as string | null
  const rawQuestions = formData.get('questions') as string
  const selected = formData.getAll('selected') as string[]

  const questions = JSON.parse(rawQuestions) as ExtractedQuestion[]

  const toInsert = questions
    .filter((_, i) => selected.includes(String(i)))
    .map(q => ({
      part:              mode === 'full' ? q.part! : fixedPart!,
      module:            mode === 'full' ? q.module! : fixedModule!,
      passage:           q.passage ?? null,
      image_url:         (q as ExtractedQuestion & { image_url?: string }).image_url ?? null,
      image_description: q.image_description ?? null,
      content:           q.content,
      option_a:          q.option_a,
      option_b:          q.option_b,
      option_c:          q.option_c,
      option_d:          q.option_d,
      answer:            q.answer || 'A',
      explanation:       q.explanation ?? null,
      difficulty:        'medium',
    }))

  let testId: string | null = null

  if (mode === 'full' && testTitle && toInsert.length > 0) {
    const { data: test } = await supabase
      .from('tests')
      .insert({ title: testTitle, created_by: user?.id })
      .select('id')
      .single()
    testId = test?.id ?? null
  }

  if (toInsert.length > 0) {
    const { data: inserted } = await supabase
      .from('questions')
      .insert(toInsert)
      .select('id')

    if (testId && inserted) {
      await supabase.from('test_questions').insert(
        inserted.map((q, i) => ({ test_id: testId, question_id: q.id, order_num: i + 1 }))
      )
    }
  }

  revalidatePath('/admin/questions')
  revalidatePath('/admin/tests')
  redirect(testId ? `/admin/tests` : `/admin/questions?saved=${toInsert.length}`)
}
