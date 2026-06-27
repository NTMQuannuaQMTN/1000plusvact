'use client'

import { useRouter } from 'next/navigation'
import { PARTS, PartKey } from '@/lib/exam/parts'

export function PracticeFilters({ part, module }: { part?: string; module?: string }) {
  const router = useRouter()
  const partKeys = Object.keys(PARTS) as PartKey[]

  const go = (newPart: string, newModule?: string) => {
    const params = new URLSearchParams()
    if (newPart) params.set('part', newPart)
    if (newModule) params.set('module', newModule)
    router.push(`/dashboard/practice${params.size ? `?${params}` : ''}`)
  }

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
      <select
        value={part ?? ''}
        onChange={e => go(e.target.value)}
        className="form-input"
        style={{ fontSize: 13, minWidth: 160 }}
      >
        <option value="">Tất cả môn</option>
        {partKeys.map(k => (
          <option key={k} value={k}>{PARTS[k].label}</option>
        ))}
      </select>

      {part && PARTS[part as PartKey] && (
        <select
          value={module ?? ''}
          onChange={e => go(part, e.target.value)}
          className="form-input"
          style={{ fontSize: 13, minWidth: 180 }}
        >
          <option value="">Tất cả chủ đề</option>
          {Object.entries(PARTS[part as PartKey].modules).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
      )}

      {(part || module) && (
        <button
          onClick={() => go('')}
          className="form-input"
          style={{ fontSize: 13, cursor: 'pointer', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px' }}
        >
          Xóa lọc
        </button>
      )}
    </div>
  )
}
