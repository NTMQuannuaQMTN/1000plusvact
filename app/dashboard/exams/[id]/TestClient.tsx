'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { submitTest } from '../actions'
import { Clock, CheckSquare } from 'lucide-react'

export type TestQuestion = {
  id: string
  content: string
  passage: string | null
  image_url: string | null
  image_description: string | null
  option_a: string; option_b: string; option_c: string; option_d: string
  part: string; module: string; order_num: number
}

type Props = {
  test: { id: string; title: string; year: number | null }
  questions: TestQuestion[]
}

const OPTIONS = ['A', 'B', 'C', 'D'] as const
const OPTION_KEY = { A: 'option_a', B: 'option_b', C: 'option_c', D: 'option_d' } as const

const PART_LABELS: Record<string, string> = {
  viet: 'Tiếng Việt', anh: 'Tiếng Anh', toan: 'Toán', khoa_hoc: 'Tư duy KH',
}
const PART_COLORS: Record<string, string> = {
  viet: '#2563eb', anh: '#16a34a', toan: '#d97706', khoa_hoc: '#7c3aed',
}

export function TestClient({ test, questions }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [elapsed, setElapsed] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const answered = Object.keys(answers).length
  const total = questions.length

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const pick = (questionId: string, letter: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: letter }))
  }

  const scrollTo = (idx: number) => {
    questionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSubmit = () => {
    startTransition(async () => {
      await submitTest(test.id, answers)
    })
  }

  // Group consecutive questions by passage for display
  const grouped: { passage: string | null; questions: (TestQuestion & { localIdx: number })[] }[] = []
  questions.forEach((q, i) => {
    const prev = grouped[grouped.length - 1]
    if (prev && prev.passage === q.passage && q.passage) {
      prev.questions.push({ ...q, localIdx: i })
    } else {
      grouped.push({ passage: q.passage ?? null, questions: [{ ...q, localIdx: i }] })
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* Sticky header */}
      <div style={{
        background: 'var(--navy)', color: '#fff',
        padding: '12px 24px',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 1 }}>Đề thi thử ĐGNL</p>
          <p style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {test.title}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 12px' }}>
          <Clock size={14} />
          <span style={{ fontSize: 14, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{formatTime(elapsed)}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 12px' }}>
          <CheckSquare size={14} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>{answered}/{total}</span>
        </div>

        <button onClick={() => setConfirming(true)} style={{
          padding: '8px 20px', borderRadius: 8,
          background: answered === total ? '#16a34a' : '#f59e0b',
          color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
        }}>
          Nộp bài
        </button>
      </div>

      {/* Answer map */}
      <div style={{
        background: '#fff', borderBottom: '1px solid var(--border)',
        padding: '10px 24px', flexShrink: 0, overflowX: 'auto',
      }}>
        <div style={{ display: 'flex', gap: 4, minWidth: 'fit-content' }}>
          {questions.map((q, i) => {
            const color = PART_COLORS[q.part] ?? 'var(--blue)'
            const isAnswered = !!answers[q.id]
            return (
              <button key={q.id} onClick={() => scrollTo(i)} title={`Câu ${i + 1}`} style={{
                width: 28, height: 28, borderRadius: 5, border: 'none', cursor: 'pointer',
                fontSize: 10, fontWeight: 700, fontFamily: 'inherit',
                background: isAnswered ? color : '#f3f4f6',
                color: isAnswered ? '#fff' : '#9ca3af',
                transition: 'background 0.1s',
              }}>
                {i + 1}
              </button>
            )
          })}
        </div>
      </div>

      {/* Questions */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {grouped.map((group, gi) => (
            <div key={gi}>
              {/* Shared passage */}
              {group.passage && (
                <div style={{
                  fontSize: 13, lineHeight: 1.8, color: 'var(--text)',
                  background: '#f8faff', border: '1px solid #dbeafe',
                  borderLeft: '3px solid var(--blue)',
                  borderRadius: 8, padding: '14px 16px',
                  marginBottom: 0, whiteSpace: 'pre-wrap',
                  marginTop: gi === 0 ? 0 : 24,
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Đọc đoạn văn sau và trả lời câu {group.questions[0].localIdx + 1}
                    {group.questions.length > 1 ? `–${group.questions[group.questions.length - 1].localIdx + 1}` : ''}
                  </p>
                  {group.passage}
                </div>
              )}

              {/* Questions in this group */}
              {group.questions.map(q => (
                <div
                  key={q.id}
                  ref={el => { questionRefs.current[q.localIdx] = el }}
                  style={{
                    background: '#fff', border: '1px solid var(--border)',
                    borderRadius: 12, padding: '20px 22px',
                    marginTop: 12,
                  }}
                >
                  {/* Question header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                      background: PART_COLORS[q.part] + '18',
                      color: PART_COLORS[q.part] ?? 'var(--navy)',
                    }}>
                      Câu {q.localIdx + 1}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {PART_LABELS[q.part]}
                    </span>
                  </div>

                  {/* Image */}
                  {q.image_url && (
                    <div style={{ marginBottom: 14 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={q.image_url} alt="Hình ảnh câu hỏi" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }} />
                    </div>
                  )}
                  {!q.image_url && q.image_description && (
                    <div style={{
                      fontSize: 12, color: '#92400e', background: '#fef3c7',
                      border: '1px solid #fde68a', borderRadius: 6, padding: '8px 12px', marginBottom: 12,
                    }}>
                      📷 {q.image_description}
                    </div>
                  )}

                  {/* Content */}
                  <p style={{ fontSize: 15, color: 'var(--navy)', fontWeight: 500, lineHeight: 1.6, marginBottom: 14 }}>
                    {q.content}
                  </p>

                  {/* Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {OPTIONS.map(letter => {
                      const isSelected = answers[q.id] === letter
                      const color = PART_COLORS[q.part] ?? 'var(--blue)'
                      return (
                        <button key={letter} onClick={() => pick(q.id, letter)} style={{
                          display: 'flex', gap: 10, alignItems: 'flex-start',
                          padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                          border: `1.5px solid ${isSelected ? color : 'var(--border)'}`,
                          background: isSelected ? color + '12' : '#fafafa',
                          textAlign: 'left', fontFamily: 'inherit', width: '100%',
                          transition: 'border-color 0.1s, background 0.1s',
                        }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, flexShrink: 0,
                            width: 22, height: 22, borderRadius: 4,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isSelected ? color : '#e5e7eb',
                            color: isSelected ? '#fff' : '#6b7280',
                          }}>
                            {letter}
                          </span>
                          <span style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>
                            {q[OPTION_KEY[letter]]}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Bottom submit */}
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => setConfirming(true)} style={{
              padding: '12px 40px', borderRadius: 10,
              background: 'var(--navy)', color: '#fff',
              border: 'none', cursor: 'pointer',
              fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
            }}>
              Nộp bài ({answered}/{total} câu đã làm)
            </button>
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      {confirming && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '32px',
            maxWidth: 380, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>Nộp bài?</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>
              Bạn đã làm <strong style={{ color: 'var(--navy)' }}>{answered}/{total}</strong> câu.
            </p>
            {answered < total && (
              <p style={{ fontSize: 13, color: '#d97706', marginBottom: 16 }}>
                ⚠️ Còn {total - answered} câu chưa trả lời. Câu bỏ trống sẽ bị tính sai.
              </p>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setConfirming(false)} style={{
                flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid var(--border)',
                background: 'var(--bg)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>Làm tiếp</button>
              <button onClick={handleSubmit} disabled={pending} style={{
                flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                background: 'var(--navy)', color: '#fff',
                fontSize: 14, fontWeight: 700, cursor: pending ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', opacity: pending ? 0.7 : 1,
              }}>
                {pending ? 'Đang nộp...' : 'Xác nhận nộp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
