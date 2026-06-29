'use client'

import { useState } from 'react'
import { Sparkles, Loader2, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { PassageBlock } from '@/components/PassageBlock'
import { getTaskHint } from '@/lib/exam/parts'

type Question = {
  id: string
  content: string
  passage: string | null
  image_url: string | null
  image_description: string | null
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  answer: string
  part: string
  module: string
}

const OPTIONS = ['A', 'B', 'C', 'D'] as const

export function QuestionCard({ q, index }: { q: Question; index: number }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)

  // AI conversation state
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([])
  const [streaming, setStreaming] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [followUp, setFollowUp] = useState('')

  const hasResponse = messages.length > 0

  async function streamFrom(url: string, body: object) {
    setIsStreaming(true)
    setStreaming('')
    setOpen(true)

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.body) throw new Error('No stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setStreaming(text)
      }
      setMessages(prev => [...prev, { role: 'ai', text }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Có lỗi xảy ra, thử lại nhé.' }])
    } finally {
      setStreaming('')
      setIsStreaming(false)
    }
  }

  const solve = () => {
    streamFrom('/api/explain', {
      content: q.content,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      passage: q.passage,
      imageDescription: q.image_description || undefined,
      studentAnswer: selected || undefined,
      correctAnswer: revealed ? q.answer : undefined,
    })
  }

  const sendFollowUp = () => {
    const text = followUp.trim()
    if (!text || isStreaming) return
    setFollowUp('')
    setMessages(prev => [...prev, { role: 'user', text }])
    const firstAiResponse = messages.find(m => m.role === 'ai')?.text ?? ''
    streamFrom('/api/chat', {
      question: {
        content: q.content,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        passage: q.passage,
        correctAnswer: q.answer,
        studentAnswer: selected || undefined,
      },
      priorExplanation: firstAiResponse,
      followUpQuestion: text,
    })
  }

  const optionKeys = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--card-shadow)',
    }}>
      <div style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 12 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
            background: 'var(--blue-light)', color: 'var(--navy)', flexShrink: 0,
          }}>Câu {index + 1}</span>
        </div>

        {q.passage && <PassageBlock text={q.passage} part={q.part} />}

        {q.image_url && (
          <div style={{ marginBottom: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={q.image_url} alt="Hình ảnh câu hỏi" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }} />
          </div>
        )}
        {!q.image_url && q.image_description && q.image_description.length > 20 && (
          <div style={{
            fontSize: 12, color: '#92400e', background: '#fef3c7',
            border: '1px solid #fde68a', borderRadius: 6, padding: '8px 12px', marginBottom: 14,
          }}>
            📷 {q.image_description}
          </div>
        )}

        {(() => {
          const hint = getTaskHint(q.part, q.module, q.content)
          return hint ? (
            <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, fontStyle: 'italic', marginBottom: 8 }}>
              {hint}
            </p>
          ) : null
        })()}

        <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--navy)', lineHeight: 1.6, marginBottom: 16 }}>
          {q.content}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {OPTIONS.map(letter => {
            const isSelected = selected === letter
            const isCorrect = revealed && letter === q.answer
            const isWrong = revealed && isSelected && letter !== q.answer

            return (
              <button key={letter} onClick={() => { if (!revealed) setSelected(letter) }} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '10px 14px', borderRadius: 8, cursor: revealed ? 'default' : 'pointer',
                border: `1.5px solid ${isCorrect ? '#16a34a' : isWrong ? '#dc2626' : isSelected ? 'var(--blue)' : 'var(--border)'}`,
                background: isCorrect ? '#f0fdf4' : isWrong ? '#fef2f2' : isSelected ? 'var(--blue-light)' : '#fafafa',
                textAlign: 'left', fontFamily: 'inherit', width: '100%',
                transition: 'border-color 0.1s, background 0.1s',
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                  width: 22, height: 22, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isCorrect ? '#16a34a' : isWrong ? '#dc2626' : isSelected ? 'var(--blue)' : 'var(--border)',
                  color: (isCorrect || isWrong || isSelected) ? '#fff' : 'var(--text-muted)',
                }}>
                  {letter}
                </span>
                <span style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>
                  {optionKeys[letter]}
                </span>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {!revealed && (
            <button onClick={() => setRevealed(true)} style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: selected ? 'var(--navy)' : 'var(--bg)',
              color: selected ? '#fff' : 'var(--text-muted)',
              border: `1.5px solid ${selected ? 'var(--navy)' : 'var(--border)'}`,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {selected ? 'Kiểm tra đáp án' : 'Xem đáp án'}
            </button>
          )}

          <button
            onClick={hasResponse ? () => setOpen(o => !o) : solve}
            disabled={isStreaming && !hasResponse}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', border: 'none',
              cursor: isStreaming && !hasResponse ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: isStreaming && !hasResponse ? 0.8 : 1,
            }}
          >
            {isStreaming && !hasResponse
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Đang giải...</>
              : hasResponse
              ? <>{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />} AI giải</>
              : <><Sparkles size={14} /> AI giải</>}
          </button>
        </div>
      </div>

      {/* AI panel */}
      {open && (hasResponse || isStreaming) && (
        <div style={{
          borderTop: '1px solid var(--border)',
          background: 'linear-gradient(to bottom, #faf5ff, #f5f3ff)',
          padding: '18px 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <Sparkles size={14} color="#7c3aed" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed' }}>AI giải (học sinh điểm cao ĐGNL)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((msg, i) =>
              msg.role === 'ai' ? (
                <p key={i} style={{ fontSize: 14, color: '#1e1b4b', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>
                  {msg.text}
                </p>
              ) : (
                <div key={i} style={{
                  alignSelf: 'flex-end', maxWidth: '80%',
                  background: '#ede9fe', border: '1px solid #ddd5fe',
                  borderRadius: '12px 12px 2px 12px', padding: '8px 12px',
                  fontSize: 13, color: '#4c1d95',
                }}>
                  {msg.text}
                </div>
              )
            )}

            {isStreaming && (
              <p style={{ fontSize: 14, color: '#1e1b4b', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>
                {streaming}
                <span style={{
                  display: 'inline-block', width: 8, height: 14,
                  background: '#7c3aed', marginLeft: 2,
                  animation: 'blink 1s infinite', borderRadius: 1,
                  verticalAlign: 'text-bottom',
                }} />
              </p>
            )}
          </div>

          {/* Follow-up input */}
          {hasResponse && !isStreaming && (
            <div style={{
              display: 'flex', gap: 8, marginTop: 14,
              borderTop: '1px solid #ddd5fe', paddingTop: 14,
            }}>
              <input
                value={followUp}
                onChange={e => setFollowUp(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendFollowUp() } }}
                placeholder="Hỏi tiếp về câu này..."
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8,
                  border: '1.5px solid #ddd5fe', fontSize: 13,
                  fontFamily: 'inherit', outline: 'none',
                  background: '#fff', color: '#1e1b4b',
                }}
              />
              <button
                onClick={sendFollowUp}
                disabled={!followUp.trim()}
                style={{
                  width: 36, height: 36, borderRadius: 8, border: 'none', flexShrink: 0,
                  background: followUp.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#e5e7eb',
                  color: '#fff', cursor: followUp.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Send size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  )
}
