'use client'

import { Trash2 } from 'lucide-react'

type Props = {
  action: (formData: FormData) => Promise<void>
  id: string
  confirmMessage?: string
  label?: string
}

export function DeleteButton({ action, id, confirmMessage = 'Xóa mục này?', label = 'Xóa' }: Props) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        onClick={e => { if (!confirm(confirmMessage)) e.preventDefault() }}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '5px 10px', borderRadius: 6,
          background: '#fff0f0', border: '1px solid #fca5a5',
          fontSize: 12, color: '#dc2626', cursor: 'pointer',
          fontFamily: 'inherit', fontWeight: 600,
        }}
      >
        <Trash2 size={12} /> {label}
      </button>
    </form>
  )
}
