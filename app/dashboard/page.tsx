import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/getProfile'
import { BookText, Globe, Calculator, FlaskConical, Trophy, CalendarDays, CheckCircle2, ClipboardList } from 'lucide-react'

const SUBJECTS = [
  { key: 'viet',     Icon: BookText,     name: 'Tiếng Việt',      color: '#2563eb', bgColor: '#eff6ff' },
  { key: 'anh',      Icon: Globe,        name: 'Tiếng Anh',        color: '#16a34a', bgColor: '#f0fdf4' },
  { key: 'toan',     Icon: Calculator,   name: 'Toán',             color: '#d97706', bgColor: '#fffbeb' },
  { key: 'khoa_hoc', Icon: FlaskConical, name: 'Tư duy khoa học', color: '#7c3aed', bgColor: '#f5f3ff' },
]

type PartStats = { correct: number; total: number }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const profile = await getProfile(user!.id)

  const displayName = profile?.full_name ?? user!.email?.split('@')[0] ?? 'Học sinh'
  const targetScore = profile?.target_score ?? 1000

  const { data: submissions } = await supabase
    .from('test_submissions')
    .select('breakdown, total, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  // Aggregate correct/total per part across all submissions
  const aggregate: Record<string, PartStats> = {}
  let totalQuestionsAnswered = 0
  const studyDays = new Set<string>()

  for (const sub of submissions ?? []) {
    const bd = sub.breakdown as Record<string, PartStats>
    totalQuestionsAnswered += (sub.total as number) ?? 0
    studyDays.add((sub.created_at as string).slice(0, 10))
    for (const [part, stats] of Object.entries(bd)) {
      if (!aggregate[part]) aggregate[part] = { correct: 0, total: 0 }
      aggregate[part].correct += stats.correct
      aggregate[part].total += stats.total
    }
  }

  const testsCompleted = submissions?.length ?? 0

  const subjectScores = SUBJECTS.map(s => {
    const stats = aggregate[s.key]
    const correct = stats?.correct ?? 0
    const total = stats?.total ?? 0
    const estimatedScore = total > 0 ? Math.round((correct / total) * 300) : 0
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0
    return { ...s, estimatedScore, correct, total, pct }
  })

  const totalScore = subjectScores.reduce((sum, s) => sum + s.estimatedScore, 0)
  const totalMax = 1200
  const progressPct = Math.round((totalScore / totalMax) * 100)
  const targetPct = Math.round((targetScore / totalMax) * 100)

  return (
    <div style={{ padding: '32px', maxWidth: 960, margin: '0 auto' }}>

      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginBottom: 4 }}>Chào mừng trở lại 👋</p>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>{displayName}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trophy size={15} color="#fbbf24" />
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>
              Mục tiêu:{' '}
              <strong style={{ color: '#fbbf24' }}>{targetScore}</strong>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>/1200</span>
            </span>
          </div>
        </div>
        <a href="/dashboard/practice" className="btn-primary" style={{ fontSize: 14, padding: '10px 24px' }}>
          Luyện tập ngay →
        </a>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { Icon: CheckCircle2,  value: totalQuestionsAnswered.toString(), label: 'Câu đã làm',    color: 'var(--blue)' },
          { Icon: CalendarDays,  value: studyDays.size.toString(),         label: 'Ngày đã học',   color: '#ef4444'     },
          { Icon: Trophy,        value: `${totalScore}`,                   label: 'Điểm ước tính', color: '#d97706'     },
          { Icon: ClipboardList, value: testsCompleted.toString(),         label: 'Đề đã làm',     color: '#7c3aed'     },
        ].map(({ Icon, value, label, color }) => (
          <div key={label} style={{
            background: '#fff', border: '1px solid var(--border)',
            borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--card-shadow)',
          }}>
            <Icon size={20} color={color} style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 22, fontWeight: 800, color, marginBottom: 2 }}>{value}</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Subject score cards */}
      <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>Điểm theo môn</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {subjectScores.map(({ key, Icon, name, color, bgColor, estimatedScore, correct, total, pct }) => (
          <div key={key} style={{
            background: '#fff', border: '1px solid var(--border)',
            borderRadius: 14, padding: '20px', boxShadow: 'var(--card-shadow)',
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10, background: bgColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
            }}>
              <Icon size={22} color={color} />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>{name}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.1, marginBottom: 4 }}>
              {estimatedScore}
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>/300</span>
            </p>
            {total > 0 && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                {correct}/{total} câu đúng
              </p>
            )}
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              {total > 0 ? `${pct}% chính xác` : 'Chưa có dữ liệu'}
            </p>
          </div>
        ))}
      </div>

      {/* Total score progress bar */}
      <div style={{
        background: '#fff', border: '1px solid var(--border)',
        borderRadius: 14, padding: '24px', boxShadow: 'var(--card-shadow)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>Tổng điểm ước tính</h2>
          <div style={{ display: 'flex', gap: 20 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'var(--blue)', marginRight: 5 }} />
              Hiện tại: <strong style={{ color: 'var(--text)' }}>{totalScore}</strong>
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#d97706', marginRight: 5 }} />
              Mục tiêu: <strong style={{ color: 'var(--text)' }}>{targetScore}</strong>
            </span>
          </div>
        </div>

        <div style={{ position: 'relative', height: 24, background: 'var(--border)', borderRadius: 12, overflow: 'visible', marginBottom: 8 }}>
          <div style={{
            position: 'absolute', left: 0, top: 0,
            width: `${progressPct}%`, height: '100%',
            background: 'var(--blue)', borderRadius: 12,
            transition: 'width 0.6s ease',
          }} />
          <div style={{
            position: 'absolute', left: `${targetPct}%`, top: '-4px',
            transform: 'translateX(-50%)',
            width: 3, height: 32, background: '#d97706', borderRadius: 2,
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
          <span>0</span>
          <span style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 14 }}>{totalScore} / 1200</span>
          <span>1200</span>
        </div>

        {totalScore === 0 && (
          <div style={{
            marginTop: 20, padding: '14px 18px',
            background: 'var(--blue-light)', borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 22 }}>💡</span>
            <p style={{ fontSize: 13, color: 'var(--navy)' }}>
              Hãy làm thử một đề để xem điểm dự đoán của bạn.{' '}
              <a href="/dashboard/exams" style={{ color: 'var(--blue)', fontWeight: 600 }}>Xem đề thi</a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
