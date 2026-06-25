import { NextRequest } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(request: NextRequest) {
  const { content, option_a, option_b, option_c, option_d, answer, passage } =
    await request.json() as {
      content: string
      option_a: string; option_b: string; option_c: string; option_d: string
      answer: string
      passage?: string | null
    }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return new Response('GEMINI_API_KEY not configured', { status: 500 })
  if (!content || !answer) return new Response('Missing question or answer', { status: 400 })

  const questionBlock = [
    passage ? `Ngữ liệu:\n${passage}\n` : null,
    `Câu hỏi: ${content}`,
    `A. ${option_a}`,
    `B. ${option_b}`,
    `C. ${option_c}`,
    `D. ${option_d}`,
  ].filter(Boolean).join('\n')

  const prompt = `Bạn là một học sinh đã đạt điểm rất cao trong kỳ thi Đánh giá năng lực ĐHQG TP.HCM. Một bạn cùng lớp hỏi bạn tại sao đáp án ${answer} lại đúng trong câu hỏi dưới đây.

Hãy giải thích tự nhiên, ngắn gọn, dễ hiểu — như đang nói chuyện thật sự, không dùng markdown, không liệt kê bullet points. Chỉ viết bằng tiếng Việt.

${questionBlock}

Đáp án đúng: ${answer}`

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
