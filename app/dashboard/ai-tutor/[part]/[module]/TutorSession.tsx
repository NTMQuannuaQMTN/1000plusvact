'use client'

import { useState, useRef, useEffect } from 'react'
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Sparkles, Loader2, Send, ArrowLeft } from 'lucide-react'
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

type Props = {
  questions: Question[]
  partLabel: string
  moduleLabel: string
  part: string
  module: string
}

type Phase = 'pick' | 'streaming' | 'ai-done' | 'finished'

const OPTIONS = ['A', 'B', 'C', 'D'] as const

const PART_STYLE: Record<string, { color: string; bg: string }> = {
  viet:      { color: '#2563eb', bg: '#eff6ff' },
  anh:       { color: '#16a34a', bg: '#f0fdf4' },
  toan:      { color: '#d97706', bg: '#fffbeb' },
  khoa_hoc:  { color: '#7c3aed', bg: '#f5f3ff' },
}

export function TutorSession({ questions, partLabel, moduleLabel, part }: Props) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('pick')
  const [results, setResults] = useState<Array<{ selected: string | null; correct: boolean }>>([])
  const [aiText, setAiText] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([])
  const [followStreaming, setFollowStreaming] = useState('')
  const [isFollowStreaming, setIsFollowStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const q = questions[idx]
  const style = PART_STYLE[part] ?? { color: '#2563eb', bg: '#eff6ff' }
  const correctCount = results.filter(r => r.correct).length

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiText, chatMessages, followStreaming])

  async function stream(url: string, body: object, onChunk: (t: string) => void): Promise<string> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.body) return ''
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let text = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      text += decoder.decode(value, { stream: true })
      onChunk(text)
    }
    return text
  }

  async function checkAnswer() {
    if (!selected || phase !== 'pick') return
    const isCorrect = selected === q.answer
    setResults(prev => [...prev, { selected, correct: isCorrect }])
    setPhase('streaming')
    setAiText('')
    setChatMessages([])

    const final = await stream(
      '/api/explain',
      {
        content: q.content,
        option_a: q.option_a, option_b: q.option_b,
        option_c: q.option_c, option_d: q.option_d,
        passage: q.passage,
        imageDescription: q.image_url ? undefined : (q.image_description || undefined),
        studentAnswer: selected,
        correctAnswer: q.answer,
      },
      t => setAiText(t),
    )
    setAiText(final)
    setPhase('ai-done')
  }

  async function sendFollowUp() {
    const text = followUp.trim()
    if (!text || isFollowStreaming) return
    setFollowUp('')
    setChatMessages(prev => [...prev, { role: 'user', text }])
    setIsFollowStreaming(true)
    setFollowStreaming('')

    const final = await stream(
      '/api/chat',
      {
        question: {
          content: q.content,
          option_a: q.option_a, option_b: q.option_b,
          option_c: q.option_c, option_d: q.option_d,
          passage: q.passage, correctAnswer: q.answer, studentAnswer: selected,
        },
        priorExplanation: aiText,
        followUpQuestion: text,
      },
      t => setFollowStreaming(t),
    )
    setChatMessages(prev => [...prev, { role: 'ai', text: final }])
    setFollowStreaming('')
    setIsFollowStreaming(false)
  }

  function next() {
    if (idx + 1 < questions.length) {
      setIdx(i => i + 1)
      setSelected(null)
      setPhase('pick')
      setAiText('')
      setChatMessages([])
      setFollowUp('')
      setFollowStreaming('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setPhase('finished')
    }
  }

  function restart() {
    setIdx(0)
    setSelected(null)
    setPhase('pick')
    setResults([])
    setAiText('')
    setChatMessages([])
  }

  // ── Finished screen ──────────────────────────────────────────────────
  if (phase === 'finished') {
    const pct = Math.round((correctCount / questions.length) * 100)
    const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪'
    const verdict = pct >= 80
      ? 'Xuất sắc! Bạn đã nắm vững kỹ năng này.'
      : pct >= 60
      ? 'Khá tốt! Ôn lại những câu sai nhé.'
      : 'Cần cải thiện — thử học lại để tốt hơn!'

    return (
      <div style={{ padding: '32px', maxWidth: 680, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--navy) 0%, #2d4ab7 100%)',
          borderRadius: 20, padding: '36px', color: '#fff', textAlign: 'center', marginBottom: 24,
        }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>{emoji}</div>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>
            {correctCount}/{questions.length} câu đúng
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>
            {pct}% · {moduleLabel}
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{verdict}</p>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
          {results.map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '12px 16px',
              borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
              background: r.correct ? '#f0fdf420' : '#fef2f220',
            }}>
              {r.correct
                ? <CheckCircle2 size={17} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
                : <XCircle size={17} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, color: 'var(--navy)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                  Câu {i + 1}: {questions[i].content}
                </p>
                {!r.correct && (
                  <p style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>
                    Bạn chọn: <strong>{r.selected ?? 'Bỏ qua'}</strong> · Đáp án đúng: <strong>{questions[i].answer}</strong>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={restart} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '11px 24px', borderRadius: 10,
            background: style.bg, color: style.color,
            border: `1.5px solid ${style.color}40`,
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <RotateCcw size={14} /> Học lại
          </button>
          <a href="/dashboard/ai-tutor" style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '11px 24px', borderRadius: 10,
            background: 'var(--navy)', color: '#fff',
            fontSize: 14, fontWeight: 700, textDecoration: 'none',
          }}>
            Chọn kỹ năng khác
          </a>
        </div>
      </div>
    )
  }

  // ── Active session ───────────────────────────────────────────────────
  const isRevealed = phase !== 'pick'
  const optVals: Record<string, string> = {
    A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d,
  }

  return (
    <div style={{ padding: '32px', maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <a href="/dashboard/ai-tutor" style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 10,
        }}>
          <ArrowLeft size={12} /> Chọn kỹ năng khác
        </a>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 2 }}>{moduleLabel}</h1>
            <span style={{ fontSize: 12, fontWeight: 600, color: style.color }}>{partLabel}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)' }}>{idx + 1}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}> / {questions.length}</span>
          </div>
        </div>

        <div style={{ height: 6, background: '#e5e7eb', borderRadius: 999, marginTop: 14, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 999, background: style.color,
            width: `${(idx / questions.length) * 100}%`,
            transition: 'width 0.5s ease',
          }} />
        </div>

        {/* Mini score tracker */}
        {results.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
            {results.map((r, i) => (
              <div key={i} style={{
                width: 18, height: 6, borderRadius: 999,
                background: r.correct ? '#16a34a' : '#dc2626',
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Question card */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
        <div style={{ padding: '24px' }}>

          {q.passage && <PassageBlock text={q.passage} part={q.part} />}

          {q.image_url && (
            <div style={{ marginBottom: 18 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={q.image_url} alt="" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }} />
            </div>
          )}
          {!q.image_url && q.image_description && q.image_description.length > 20 && (
            <div style={{
              fontSize: 12, color: '#92400e', background: '#fef3c7',
              border: '1px solid #fde68a', borderRadius: 6, padding: '8px 12px', marginBottom: 16,
            }}>
              📷 {q.image_description}
            </div>
          )}

          {(() => {
            const hint = getTaskHint(q.part, q.module, q.content, q.passage)
            return hint ? (
              <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, fontStyle: 'italic', marginBottom: 10 }}>
                {hint}
              </p>
            ) : null
          })()}

          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--navy)', lineHeight: 1.7, marginBottom: 20 }}>
            {q.content}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {OPTIONS.map(letter => {
              const isSelected = selected === letter
              const isCorrect = isRevealed && letter === q.answer
              const isWrong = isRevealed && isSelected && letter !== q.answer

              return (
                <button
                  key={letter}
                  onClick={() => { if (phase === 'pick') setSelected(letter) }}
                  disabled={phase !== 'pick'}
                  style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    padding: '12px 16px', borderRadius: 10,
                    cursor: phase === 'pick' ? 'pointer' : 'default',
                    border: `2px solid ${isCorrect ? '#16a34a' : isWrong ? '#dc2626' : isSelected ? style.color : 'var(--border)'}`,
                    background: isCorrect ? '#f0fdf4' : isWrong ? '#fef2f2' : isSelected ? style.bg : '#fafafa',
                    textAlign: 'left', fontFamily: 'inherit', width: '100%',
                    transition: 'all 0.1s',
                  }}
                >
                  <span style={{
                    fontSize: 12, fontWeight: 800, flexShrink: 0, width: 26, height: 26,
                    borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isCorrect ? '#16a34a' : isWrong ? '#dc2626' : isSelected ? style.color : '#e5e7eb',
                    color: (isCorrect || isWrong || isSelected) ? '#fff' : 'var(--text-muted)',
                  }}>
                    {letter}
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--navy)', lineHeight: 1.6, paddingTop: 1, flex: 1 }}>
                    {optVals[letter]}
                  </span>
                  {isCorrect && <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 4 }} />}
                  {isWrong && <XCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 4 }} />}
                </button>
              )
            })}
          </div>

          {phase === 'pick' && (
            <button
              onClick={checkAnswer}
              disabled={!selected}
              style={{
                width: '100%', marginTop: 20, padding: '13px',
                borderRadius: 10, border: 'none', fontFamily: 'inherit',
                fontSize: 15, fontWeight: 700, cursor: selected ? 'pointer' : 'not-allowed',
                background: selected ? style.color : '#e5e7eb',
                color: selected ? '#fff' : 'var(--text-muted)',
                transition: 'background 0.15s',
              }}
            >
              Kiểm tra đáp án
            </button>
          )}
        </div>

        {/* AI explanation */}
        {(phase === 'streaming' || phase === 'ai-done') && (
          <div style={{
            borderTop: '1px solid var(--border)',
            background: 'linear-gradient(to bottom, #faf5ff, #f5f3ff)',
            padding: '22px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Sparkles size={14} color="#7c3aed" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed' }}>AI Gia sư giải thích</span>
              {phase === 'streaming' && (
                <Loader2 size={13} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
              )}
            </div>

            <p style={{ fontSize: 14, color: '#1e1b4b', lineHeight: 1.9, whiteSpace: 'pre-wrap', margin: 0 }}>
              {aiText}
              {phase === 'streaming' && (
                <span style={{
                  display: 'inline-block', width: 8, height: 14,
                  background: '#7c3aed', marginLeft: 2, animation: 'blink 1s infinite',
                  borderRadius: 1, verticalAlign: 'text-bottom',
                }} />
              )}
            </p>

            {/* Follow-up messages */}
            {chatMessages.map((msg, i) =>
              msg.role === 'user' ? (
                <div key={i} style={{
                  marginTop: 12, marginLeft: 'auto', maxWidth: '80%',
                  background: '#ede9fe', border: '1px solid #ddd5fe',
                  borderRadius: '12px 12px 2px 12px', padding: '9px 13px',
                  fontSize: 13, color: '#4c1d95',
                }}>
                  {msg.text}
                </div>
              ) : (
                <p key={i} style={{ fontSize: 14, color: '#1e1b4b', lineHeight: 1.9, whiteSpace: 'pre-wrap', marginTop: 10 }}>
                  {msg.text}
                </p>
              )
            )}
            {followStreaming && (
              <p style={{ fontSize: 14, color: '#1e1b4b', lineHeight: 1.9, whiteSpace: 'pre-wrap', marginTop: 10 }}>
                {followStreaming}
                <span style={{ display: 'inline-block', width: 8, height: 14, background: '#7c3aed', marginLeft: 2, animation: 'blink 1s infinite', borderRadius: 1, verticalAlign: 'text-bottom' }} />
              </p>
            )}

            {/* Follow-up input */}
            {phase === 'ai-done' && !isFollowStreaming && (
              <div style={{ display: 'flex', gap: 8, marginTop: 16, borderTop: '1px solid #ddd5fe', paddingTop: 14 }}>
                <input
                  value={followUp}
                  onChange={e => setFollowUp(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendFollowUp() } }}
                  placeholder="Chưa hiểu? Hỏi tiếp AI..."
                  style={{
                    flex: 1, padding: '9px 12px', borderRadius: 8,
                    border: '1.5px solid #ddd5fe', fontSize: 13,
                    fontFamily: 'inherit', outline: 'none',
                    background: '#fff', color: '#1e1b4b',
                  }}
                />
                <button
                  onClick={sendFollowUp}
                  disabled={!followUp.trim()}
                  style={{
                    width: 38, height: 38, borderRadius: 8, border: 'none', flexShrink: 0,
                    background: followUp.trim() ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e5e7eb',
                    color: '#fff', cursor: followUp.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Send size={14} />
                </button>
              </div>
            )}

            {/* Next / Finish button */}
            {phase === 'ai-done' && !isFollowStreaming && (
              <button
                onClick={next}
                style={{
                  width: '100%', marginTop: 16, padding: '13px', borderRadius: 10,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: style.color, color: '#fff',
                  fontSize: 15, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {idx + 1 < questions.length
                  ? <><ChevronRight size={16} /> Câu tiếp theo ({idx + 2}/{questions.length})</>
                  : 'Xem kết quả'}
              </button>
            )}
          </div>
        )}
      </div>

      <div ref={bottomRef} />
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  )
}
