import { createClient } from '@/lib/supabase/server'
import { Users, BookOpen, FileText, ClipboardList, TrendingUp } from 'lucide-react'

const PART_META: Record<string, { label: string; color: string }> = {
  viet:     { label: 'Tiếng Việt',      color: '#2563eb' },
  anh:      { label: 'Tiếng Anh',       color: '#16a34a' },
  toan:     { label: 'Toán',            color: '#d97706' },
  khoa_hoc: { label: 'Tư duy khoa học', color: '#7c3aed' },
}

type PartStats = { correct: number; total: number }

export default async function StatsPage() {
  const supabase = await createClient()

  const [
    { count: studentCount },
    { count: questionCount },
    { count: testCount },
    { count: submissionCount },
    { data: questionsByPart },
    { data: allSubmissions },
    { data: recentSubmissions },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('tests').select('*', { count: 'exact', head: true }),
    supabase.from('test_submissions').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('part, module'),
    supabase.from('test_submissions').select('breakdown'),
    supabase
      .from('test_submissions')
      .select('id, score, total, created_at, profiles!inner(full_name), tests!inner(title)')
      .order('created_at', { ascending: false })
      .limit(15),
  ])

  // Questions by part + module
  const qByPart: Record<string, { total: number; modules: Record<string, number> }> = {}
  for (const q of questionsByPart ?? []) {
    const part = q.part as string
    const mod = q.module as string
    if (!qByPart[part]) qByPart[part] = { total: 0, modules: {} }
    qByPart[part].total++
    qByPart[part].modules[mod] = (qByPart[part].modules[mod] ?? 0) + 1
  }
  const maxQPart = Math.max(...Object.values(qByPart).map(p => p.total), 1)

  // Aggregate performance across all submissions
  const aggregate: Record<string, PartStats> = {}
  for (const sub of allSubmissions ?? []) {
    const bd = sub.breakdown as Record<string, PartStats>
    for (const [part, stats] of Object.entries(bd)) {
      if (!aggregate[part]) aggregate[part] = { correct: 0, total: 0 }
      aggregate[part].correct += stats.correct
      aggregate[part].total += stats.total
    }
  }

  // Activity by day (last 30 days from recent submissions data — approximate)
  const dayCount: Record<string, number> = {}
  for (const sub of allSubmissions ?? []) {
    // allSubmissions only has breakdown; recentSubmissions has dates — use those
  }
  const activityByDay: Record<string, number> = {}
  for (const sub of recentSubmissions ?? []) {
    const day = (sub.created_at as string).slice(0, 10)
    activityByDay[day] = (activityByDay[day] ?? 0) + 1
  }

  return (
    <div style={{ padding: '32px', maxWidth: 1000 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginBottom: 2 }}>Thống kê</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tổng quan hoạt động của hệ thống</p>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { Icon: Users,         value: studentCount ?? 0,    label: 'Học sinh',       color: 'var(--blue)' },
          { Icon: ClipboardList, value: submissionCount ?? 0, label: 'Lượt làm bài',   color: '#7c3aed'     },
          { Icon: BookOpen,      value: questionCount ?? 0,   label: 'Câu hỏi',        color: '#d97706'     },
          { Icon: FileText,      value: testCount ?? 0,       label: 'Đề thi',         color: '#16a34a'     },
        ].map(({ Icon, value, label, color }) => (
          <div key={label} style={{
            background: '#fff', border: '1px solid var(--border)',
            borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--card-shadow)',
          }}>
            <Icon size={20} color={color} style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 28, fontWeight: 900, color, marginBottom: 2 }}>{value}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Questions by subject */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '22px', boxShadow: 'var(--card-shadow)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 18 }}>Câu hỏi theo môn</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Object.entries(PART_META).map(([part, meta]) => {
              const data = qByPart[part]
              const total = data?.total ?? 0
              const barPct = Math.round((total / maxQPart) * 100)
              return (
                <div key={part}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{meta.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>{total}</span>
                  </div>
                  <div style={{ background: '#e5e7eb', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${barPct}%`, background: meta.color, borderRadius: 999 }} />
                  </div>
                  {data?.modules && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {Object.entries(data.modules).map(([mod, cnt]) => `${mod}: ${cnt}`).join(' · ')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Average performance across all students */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '22px', boxShadow: 'var(--card-shadow)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>
            Điểm trung bình toàn hệ thống
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>
            Tổng hợp {submissionCount ?? 0} lượt làm bài
          </p>
          {Object.keys(aggregate).length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>Chưa có dữ liệu</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Object.entries(PART_META).map(([part, meta]) => {
                const stats = aggregate[part]
                if (!stats || stats.total === 0) return null
                const pct = Math.round((stats.correct / stats.total) * 100)
                const estPart = Math.round((stats.correct / stats.total) * 300)
                return (
                  <div key={part}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{meta.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>
                        ~{estPart}/300 <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ background: '#e5e7eb', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: meta.color, borderRadius: 999 }} />
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {stats.correct.toLocaleString()}/{stats.total.toLocaleString()} câu đúng
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent submissions */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={16} color="var(--navy)" />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>Hoạt động gần nhất</h2>
        </div>
        {!recentSubmissions?.length ? (
          <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Chưa có lượt làm bài nào.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                {['Học sinh', 'Đề thi', 'Điểm', 'Thời gian'].map(h => (
                  <th key={h} style={{ padding: '8px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentSubmissions.map((sub, i) => {
                const profile = sub.profiles as unknown as { full_name: string | null }
                const test = sub.tests as unknown as { title: string }
                const pct = sub.total > 0 ? Math.round((sub.score / sub.total) * 100) : 0
                return (
                  <tr key={sub.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>
                      {profile.full_name ?? 'Ẩn danh'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {test.title}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626' }}>
                        {sub.score}/{sub.total}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>({pct}%)</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(sub.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
