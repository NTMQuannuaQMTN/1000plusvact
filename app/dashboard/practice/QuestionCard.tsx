'use client'

import { useState } from 'react'
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

type Question = {
  id: string
  content: string
  passage: string | null
  image_url: string | null
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
  const [aiText, setAiText] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)

  const solve = async () => {
    if (loading) return
    setOpen(true)
    setLoading(true)
    setAiText('')

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: q.content,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          passage: q.passage,
        }),
      })

      if (!res.body) throw new Error('No stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setAiText(prev => prev + decoder.decode(value, { stream: true }))
      }
    } catch {
      setAiText('Có lỗi xảy ra, thử lại nhé.')
    } finally {
      setLoading(false)
    }
  }

  const optionKeys = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--card-shadow)',
    }}>
      {/* Question body */}
      <div style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 12 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
            background: 'var(--blue-light)', color: 'var(--navy)', flexShrink: 0,
          }}>Câu {index + 1}</span>
        </div>

        {/* Passage */}
        {q.passage && (
          <div style={{
            fontSize: 13, lineHeight: 1.7, color: 'var(--text)',
            background: '#f8faff', border: '1px solid var(--border)',
            borderLeft: '3px solid var(--blue)',
            borderRadius: 6, padding: '12px 14px', marginBottom: 14, whiteSpace: 'pre-wrap',
          }}>
            {q.passage}
          </div>
        )}

        {/* Image */}
        {q.image_url && (
          <div style={{ marginBottom: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={q.image_url} alt="Hình ảnh câu hỏi" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }} />
          </div>
        )}

        {/* Content */}
        <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--navy)', lineHeight: 1.6, marginBottom: 16 }}>
          {q.content}
        </p>

        {/* Options */}
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

        {/* Action row */}
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

          <button onClick={aiText ? () => setOpen(o => !o) : solve} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', opacity: loading ? 0.8 : 1,
          }}>
            {loading
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Đang giải...</>
              : aiText
              ? <>{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />} AI giải</>
              : <><Sparkles size={14} /> AI giải</>}
          </button>
        </div>
      </div>

      {/* AI answer panel */}
      {open && (aiText || loading) && (
        <div style={{
          borderTop: '1px solid var(--border)',
          background: 'linear-gradient(to bottom, #faf5ff, #f5f3ff)',
          padding: '18px 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <Sparkles size={14} color="#7c3aed" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed' }}>AI giải (học sinh điểm cao ĐGNL)</span>
          </div>
          <p style={{ fontSize: 14, color: '#1e1b4b', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {aiText}
            {loading && <span style={{ display: 'inline-block', width: 8, height: 14, background: '#7c3aed', marginLeft: 2, animation: 'blink 1s infinite', borderRadius: 1 }} />}
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  )
}
