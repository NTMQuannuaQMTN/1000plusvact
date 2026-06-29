import { NextRequest } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(request: NextRequest) {
  const { content, option_a, option_b, option_c, option_d, passage, imageDescription, studentAnswer, correctAnswer } =
    await request.json() as {
      content: string
      option_a: string; option_b: string; option_c: string; option_d: string
      passage?: string | null
      imageDescription?: string | null
      studentAnswer?: string | null
      correctAnswer?: string | null
    }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return new Response('GEMINI_API_KEY not configured', { status: 500 })
  if (!content) return new Response('Missing question', { status: 400 })

  const questionBlock = [
    passage ? `Ngữ liệu:\n${passage}\n` : null,
    imageDescription ? `[Hình ảnh đi kèm: ${imageDescription}]` : null,
    `Câu hỏi: ${content}`,
    `A. ${option_a}`,
    `B. ${option_b}`,
    `C. ${option_c}`,
    `D. ${option_d}`,
  ].filter(Boolean).join('\n')

  let situationLine: string
  if (studentAnswer && correctAnswer) {
    const isRight = studentAnswer === correctAnswer
    situationLine = isRight
      ? `Bạn cùng lớp đã chọn ${studentAnswer} và đúng rồi. Xác nhận ngắn gọn rồi giải thích tại sao ${studentAnswer} là đáp án đúng.`
      : `Bạn cùng lớp đã chọn ${studentAnswer} nhưng đáp án đúng là ${correctAnswer}. Giải thích nhẹ nhàng tại sao ${studentAnswer} sai và tại sao ${correctAnswer} mới đúng.`
  } else {
    situationLine = `Bạn cùng lớp nhờ bạn giải câu hỏi dưới đây. Hãy tìm ra đáp án đúng (A, B, C hoặc D), nêu rõ, và giải thích lý do.`
  }

  const prompt = `Bạn là một học sinh đã đạt điểm rất cao trong kỳ thi Đánh giá năng lực ĐHQG TP.HCM (ĐGNL).

${situationLine}

Trả lời tự nhiên, ngắn gọn như nói chuyện với bạn cùng lớp. Viết bằng tiếng Việt, không dùng markdown hay bullet points.

${questionBlock}`

  const ai = new GoogleGenAI({ apiKey })

  const stream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: [{ parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: 2048 } },
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(ctrl) {
      try {
        for await (const chunk of stream) {
          const text = chunk.text
          if (text) ctrl.enqueue(encoder.encode(text))
        }
      } finally {
        ctrl.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
