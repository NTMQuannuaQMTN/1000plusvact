'use client'

import { useState, useTransition } from 'react'
import { updateAnswer } from './actions'

export function AnswerSwitch({ id, answer }: { id: string; answer: string }) {
  const [current, setCurrent] = useState(answer)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const pick = (letter: string) => {
    setCurrent(letter)
    setOpen(false)
    startTransition(() => updateAnswer(id, letter))
  }

  if (open) {
    return (
      <div style={{ display: 'flex', gap: 3 }} onClick={e => e.stopPropagation()}>
        {['A', 'B', 'C', 'D'].map(l => (
          <button key={l} onClick={() => pick(l)} style={{
            width: 26, height: 22, fontSize: 11, fontWeight: 700,
            borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: current === l ? '#16a34a' : '#f3f4f6',
            color: current === l ? '#fff' : '#374151',
            transition: 'background 0.1s',
          }}>{l}</button>
        ))}
        <button onClick={e => { e.stopPropagation(); setOpen(false) }} style={{
          fontSize: 11, padding: '0 6px', borderRadius: 4, border: 'none',
          background: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'inherit',
        }}>✕</button>
      </div>
    )
  }

  return (
    <button
      onClick={e => { e.stopPropagation(); setOpen(true) }}
      disabled={pending}
      title="Click để đổi đáp án"
      style={{
        fontSize: 12, fontWeight: 700,
        color: pending ? '#6b7280' : '#16a34a',
        background: pending ? '#f3f4f6' : '#dcfce7',
        padding: '2px 8px', borderRadius: 4,
        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        transition: 'background 0.15s',
      }}
    >
      {current}
    </button>
  )
}
