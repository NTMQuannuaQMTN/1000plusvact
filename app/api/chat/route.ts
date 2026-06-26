import { NextRequest } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(request: NextRequest) {
  const { question, priorExplanation, followUpQuestion } =
    await request.json() as {
      question: {
        content: string
        option_a: string; option_b: string; option_c: string; option_d: string
        passage?: string | null
        correctAnswer?: string | null
        studentAnswer?: string | null
      }
      priorExplanation: string
      followUpQuestion: string
    }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return new Response('GEMINI_API_KEY not configured', { status: 500 })
  if (!followUpQuestion) return new Response('Missing follow-up question', { status: 400 })

  const questionBlock = [
    question.passage ? `Ngữ liệu:\n${question.passage}\n` : null,
    `Câu hỏi: ${question.content}`,
    `A. ${question.option_a}`,
    `B. ${question.option_b}`,
    `C. ${question.option_c}`,
    `D. ${question.option_d}`,
    question.correctAnswer ? `\nĐáp án đúng: ${question.correctAnswer}` : null,
  ].filter(Boolean).join('\n')

  const prompt = `Bạn là một học sinh đã đạt điểm rất cao trong kỳ thi Đánh giá năng lực ĐHQG TP.HCM (ĐGNL).

Bạn vừa giải thích câu hỏi sau cho bạn cùng lớp:

${questionBlock}

Giải thích trước đó của bạn:
"${priorExplanation}"

Bạn cùng lớp hỏi tiếp: "${followUpQuestion}"

Trả lời câu hỏi tiếp theo này ngắn gọn, tự nhiên bằng tiếng Việt. Không dùng markdown hay bullet points.`

  const ai = new GoogleGenAI({ apiKey })

  const stream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: [{ parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: 1024 } },
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
