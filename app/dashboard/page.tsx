import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/getProfile'
import { BookText, Globe, Calculator, FlaskConical, Trophy, Flame, CheckCircle2, Clock } from 'lucide-react'

const SUBJECTS = [
  { key: 'viet', Icon: BookText,     name: 'Tiếng Việt',        color: '#2563eb', bgColor: '#eff6ff', score: 0, max: 300 },
  { key: 'anh',  Icon: Globe,        name: 'Tiếng Anh',          color: '#16a34a', bgColor: '#f0fdf4', score: 0, max: 300 },
  { key: 'toan', Icon: Calculator,   name: 'Toán',               color: '#d97706', bgColor: '#fffbeb', score: 0, max: 300 },
  { key: 'khoa', Icon: FlaskConical, name: 'Tư duy khoa học',    color: '#7c3aed', bgColor: '#f5f3ff', score: 0, max: 300 },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const profile = await getProfile(user!.id)

  const displayName = profile?.full_name ?? user!.email?.split('@')[0] ?? 'Học sinh'
  const targetScore = profile?.target_score ?? 1000
  const totalScore = SUBJECTS.reduce((s, sub) => s + sub.score, 0)
  const totalMax = 1200
  const progressPct = Math.round((totalScore / totalMax) * 100)
  const targetPct  = Math.round((targetScore  / totalMax) * 100)

  return (
    <div style={{ padding: '32px', maxWidth: 960, margin: '0 auto' }}>

      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)',
        borderRadius: 16,
        padding: '28px 32px',
        marginBottom: 28,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginBottom: 4 }}>
            Chào mừng trở lại 👋
          </p>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
            {displayName}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trophy size={15} color="var(--blue)" />
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>
              Mục tiêu:{' '}
              <strong style={{ color: 'var(--blue)' }}>{targetScore}</strong>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>/1200</span>
            </span>
          </div>
        </div>
        <a href="/dashboard/practice" className="btn-primary" style={{ fontSize: 14, padding: '10px 24px' }}>
          Luyện tập ngay →
        </a>
      </div>

      {/* Quick stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        {[
          { Icon: CheckCircle2, value: '0',       label: 'Câu đã làm',      color: 'var(--blue)' },
          { Icon: Flame,        value: '0 ngày',  label: 'Chuỗi ngày học',  color: '#ef4444' },
          { Icon: Trophy,       value: `${totalScore}/${totalMax}`, label: 'Điểm hiện tại', color: '#d97706' },
          { Icon: Clock,        value: '0',       label: 'Đề đã làm',       color: '#7c3aed' },
        ].map(({ Icon, value, label, color }) => (
          <div key={label} style={{
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '18px 20px',
            boxShadow: 'var(--card-shadow)',
          }}>
            <Icon size={20} color={color} style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 22, fontWeight: 800, color, marginBottom: 2 }}>{value}</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Subject score cards */}
      <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>
        Điểm theo môn
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        {SUBJECTS.map(({ key, Icon, name, color, bgColor, score, max }) => {
          const pct = Math.round((score / max) * 100)
          return (
            <div key={key} style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '20px',
              boxShadow: 'var(--card-shadow)',
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: bgColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14,
              }}>
                <Icon size={22} color={color} />
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>{name}</p>
              <p style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.1, marginBottom: 12 }}>
                {score}
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>/{max}</span>
              </p>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                {pct}% hoàn thành
              </p>
            </div>
          )
        })}
      </div>

      {/* Total score summary */}
      <div style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '24px',
        boxShadow: 'var(--card-shadow)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>Tổng điểm dự đoán</h2>
          <div style={{ display: 'flex', gap: 20 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'var(--blue)', marginRight: 5 }} />
              Điểm hiện tại: <strong style={{ color: 'var(--text)' }}>{totalScore}</strong>
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#d97706', marginRight: 5 }} />
              Mục tiêu: <strong style={{ color: 'var(--text)' }}>{targetScore}</strong>
            </span>
          </div>
        </div>

        {/* Progress track */}
        <div style={{ position: 'relative', height: 24, background: 'var(--border)', borderRadius: 12, overflow: 'visible', marginBottom: 8 }}>
          {/* Current score bar */}
          <div style={{
            position: 'absolute', left: 0, top: 0,
            width: `${progressPct}%`, height: '100%',
            background: 'var(--blue)', borderRadius: 12,
            transition: 'width 0.6s ease',
          }} />
          {/* Target marker */}
          <div style={{
            position: 'absolute',
            left: `${targetPct}%`,
            top: '-4px',
            transform: 'translateX(-50%)',
            width: 3, height: 32,
            background: '#d97706',
            borderRadius: 2,
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
          <span>0</span>
          <span style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 14 }}>{totalScore} / 1200</span>
          <span>1200</span>
        </div>

        {totalScore === 0 && (
          <div style={{
            marginTop: 20,
            padding: '14px 18px',
            background: 'var(--blue-light)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <span style={{ fontSize: 22 }}>💡</span>
            <p style={{ fontSize: 13, color: 'var(--navy)' }}>
              Hãy bắt đầu làm bài luyện tập để xem điểm dự đoán của bạn.{' '}
              <a href="/dashboard/practice" style={{ color: 'var(--blue)', fontWeight: 600 }}>Luyện tập ngay</a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
