import { createClient } from '@/lib/supabase/server'
import { PARTS, PartKey } from '@/lib/exam/parts'
import { ChevronRight } from 'lucide-react'

const PART_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  viet:      { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  anh:       { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  toan:      { color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  khoa_hoc:  { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
}

export default async function AITutorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: submissions }, { data: qRows }] = await Promise.all([
    supabase.from('test_submissions').select('breakdown').eq('user_id', user!.id),
    supabase.from('questions').select('part, module'),
  ])

  // Aggregate module performance from all submissions
  const moduleStats: Record<string, Record<string, { correct: number; total: number }>> = {}
  for (const sub of submissions ?? []) {
    const bd = sub.breakdown as Record<string, {
      correct: number; total: number
      modules?: Record<string, { correct: number; total: number }>
    }>
    for (const [part, pd] of Object.entries(bd ?? {})) {
      if (!moduleStats[part]) moduleStats[part] = {}
      for (const [mod, md] of Object.entries(pd.modules ?? {})) {
        if (!moduleStats[part][mod]) moduleStats[part][mod] = { correct: 0, total: 0 }
        moduleStats[part][mod].correct += md.correct
        moduleStats[part][mod].total += md.total
      }
    }
  }

  // Question counts per module
  const qCounts: Record<string, Record<string, number>> = {}
  for (const q of qRows ?? []) {
    if (!qCounts[q.part]) qCounts[q.part] = {}
    qCounts[q.part][q.module] = (qCounts[q.part][q.module] ?? 0) + 1
  }

  const partKeys = Object.keys(PARTS) as PartKey[]
  const totalModules = partKeys.flatMap(p => Object.keys(PARTS[p].modules)).length
  const masteredModules = partKeys.flatMap(p =>
    Object.keys(PARTS[p].modules).filter(m => {
      const s = moduleStats[p]?.[m]
      return s && s.total > 0 && (s.correct / s.total) >= 0.8
    })
  ).length

  return (
    <div style={{ padding: '32px', maxWidth: 860 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>AI Gia sư</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Chọn kỹ năng cần luyện. AI sẽ hỏi từng câu, kiểm tra đáp án và giải thích chi tiết.
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 16px', fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>Đã nắm vững:</span>
          <strong style={{ color: 'var(--navy)' }}>{masteredModules}/{totalModules} kỹ năng</strong>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {partKeys.map(part => {
          const style = PART_STYLE[part]
          const modules = PARTS[part].modules
          const available = Object.entries(modules).filter(([mod]) => (qCounts[part]?.[mod] ?? 0) > 0)
          if (!available.length) return null

          return (
            <div key={part}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{
                  fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 999,
                  background: style.bg, color: style.color, border: `1px solid ${style.border}`,
                }}>
                  {PARTS[part].label}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: 12 }}>
                {available.map(([mod, label]) => {
                  const count = qCounts[part]?.[mod] ?? 0
                  const stats = moduleStats[part]?.[mod]
                  const pct = stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null
                  const mastered = pct !== null && pct >= 80

                  return (
                    <a
                      key={mod}
                      href={`/dashboard/ai-tutor/${part}/${mod}`}
                      style={{
                        display: 'flex', flexDirection: 'column', gap: 10,
                        padding: '16px 18px', borderRadius: 13,
                        border: `1.5px solid ${mastered ? style.color + '60' : style.border}`,
                        background: mastered ? style.bg : '#fff',
                        textDecoration: 'none', boxShadow: 'var(--card-shadow)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', lineHeight: 1.35, flex: 1 }}>
                          {label}
                        </span>
                        <ChevronRight size={14} color={style.color} style={{ flexShrink: 0, marginTop: 1 }} />
                      </div>

                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {count} câu hỏi
                      </div>

                      {pct !== null ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: style.color }}>{pct}% đúng</span>
                            {mastered && <span style={{ fontSize: 10, color: style.color, fontWeight: 700 }}>✓ Đã nắm</span>}
                          </div>
                          <div style={{ height: 4, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: style.color, borderRadius: 999 }} />
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa học</span>
                      )}
                    </a>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
