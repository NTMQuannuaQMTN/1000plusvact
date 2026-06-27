import { createClient } from '@/lib/supabase/server'
import { Users } from 'lucide-react'

const PART_LABELS: Record<string, string> = {
  viet: 'Văn', anh: 'Anh', toan: 'Toán', khoa_hoc: 'KH',
}
const PART_COLORS: Record<string, string> = {
  viet: '#2563eb', anh: '#16a34a', toan: '#d97706', khoa_hoc: '#7c3aed',
}

type PartStats = { correct: number; total: number }

function estimateScore(breakdown: Record<string, PartStats>) {
  return Object.values(breakdown).reduce((sum, { correct, total }) => {
    return sum + (total > 0 ? Math.round((correct / total) * 300) : 0)
  }, 0)
}

export default async function StudentsPage() {
  const supabase = await createClient()

  const [{ data: students }, { data: submissions }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, school, target_score, created_at')
      .eq('role', 'student')
      .order('created_at', { ascending: false }),
    supabase
      .from('test_submissions')
      .select('user_id, score, total, breakdown, created_at'),
  ])

  // Aggregate per student
  const subsByUser: Record<string, {
    count: number
    breakdown: Record<string, PartStats>
    lastActive: string
  }> = {}

  for (const sub of submissions ?? []) {
    const uid = sub.user_id as string
    if (!subsByUser[uid]) subsByUser[uid] = { count: 0, breakdown: {}, lastActive: '' }
    subsByUser[uid].count++
    if (sub.created_at > subsByUser[uid].lastActive) subsByUser[uid].lastActive = sub.created_at as string
    const bd = sub.breakdown as Record<string, PartStats>
    for (const [part, stats] of Object.entries(bd)) {
      if (!subsByUser[uid].breakdown[part]) subsByUser[uid].breakdown[part] = { correct: 0, total: 0 }
      subsByUser[uid].breakdown[part].correct += stats.correct
      subsByUser[uid].breakdown[part].total += stats.total
    }
  }

  const rows = (students ?? [])
    .map(s => ({
      ...s,
      sub: subsByUser[s.id] ?? null,
      score: subsByUser[s.id] ? estimateScore(subsByUser[s.id].breakdown) : 0,
    }))
    .sort((a, b) => {
      const da = a.sub?.lastActive ?? ''
      const db = b.sub?.lastActive ?? ''
      return db.localeCompare(da)
    })

  const totalActive = rows.filter(r => r.sub && r.sub.count > 0).length

  return (
    <div style={{ padding: '32px', maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginBottom: 2 }}>Học sinh</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {rows.length} đã đăng ký · {totalActive} đã làm bài
          </p>
        </div>
      </div>

      {!rows.length ? (
        <div style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 14,
          padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14,
        }}>
          <Users size={36} color="var(--border)" style={{ marginBottom: 12 }} />
          <p>Chưa có học sinh nào đăng ký.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['Học sinh', 'Trường', 'Điểm ước tính', 'Mục tiêu', 'Đề đã làm', 'Hoạt động'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => {
                const isAboveTarget = s.score > 0 && s.score >= (s.target_score ?? 1000)
                return (
                  <tr key={s.id} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          background: 'var(--blue-light)', color: 'var(--navy)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 700,
                        }}>
                          {(s.full_name ?? '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <a href={`/admin/students/${s.id}`} style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>
                            {s.full_name ?? 'Chưa đặt tên'}
                          </a>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                            Tham gia {new Date(s.created_at).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                      {s.school ?? '—'}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {s.score > 0 ? (
                        <div>
                          <span style={{ fontSize: 15, fontWeight: 700, color: isAboveTarget ? '#16a34a' : '#d97706' }}>
                            {s.score}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/1200</span>
                          {/* Mini bars per subject */}
                          <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
                            {Object.entries(PART_LABELS).map(([part, abbr]) => {
                              const stats = s.sub?.breakdown[part]
                              const pct = stats?.total ? Math.round((stats.correct / stats.total) * 100) : 0
                              return (
                                <div key={part} title={`${abbr}: ${pct}%`} style={{ flex: 1 }}>
                                  <div style={{ height: 4, borderRadius: 2, background: '#e5e7eb' }}>
                                    <div style={{ height: '100%', width: `${pct}%`, background: PART_COLORS[part], borderRadius: 2 }} />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Chưa có</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                      {s.target_score ?? 1000}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: 13, fontWeight: 700,
                        color: (s.sub?.count ?? 0) > 0 ? 'var(--navy)' : 'var(--text-muted)',
                      }}>
                        {s.sub?.count ?? 0}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                      {s.sub?.lastActive
                        ? new Date(s.sub.lastActive).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : <span style={{ fontStyle: 'italic' }}>Chưa làm bài</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
