import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Trophy, School, Target, Calendar, ClipboardList } from 'lucide-react'

type Params = Promise<{ id: string }>

const PART_META: Record<string, { label: string; color: string; bg: string }> = {
  viet:     { label: 'Tiếng Việt',      color: '#2563eb', bg: '#eff6ff' },
  anh:      { label: 'Tiếng Anh',       color: '#16a34a', bg: '#f0fdf4' },
  toan:     { label: 'Toán',            color: '#d97706', bg: '#fffbeb' },
  khoa_hoc: { label: 'Tư duy khoa học', color: '#7c3aed', bg: '#f5f3ff' },
}

type PartStats = { correct: number; total: number; modules?: Record<string, { correct: number; total: number }> }

export default async function StudentDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: profile }, { data: submissions }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase
      .from('test_submissions')
      .select('id, test_id, score, total, breakdown, created_at, tests!inner(title)')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!profile) notFound()

  // Aggregate lifetime breakdown
  const lifetime: Record<string, PartStats> = {}
  for (const sub of submissions ?? []) {
    const bd = sub.breakdown as Record<string, PartStats>
    for (const [part, stats] of Object.entries(bd)) {
      if (!lifetime[part]) lifetime[part] = { correct: 0, total: 0 }
      lifetime[part].correct += stats.correct
      lifetime[part].total += stats.total
    }
  }

  const estimatedTotal = Object.values(lifetime).reduce((sum, { correct, total }) => {
    return sum + (total > 0 ? Math.round((correct / total) * 300) : 0)
  }, 0)

  const target = profile.target_score ?? 1000

  return (
    <div style={{ padding: '32px', maxWidth: 860 }}>
      <div style={{ marginBottom: 24 }}>
        <a href="/admin/students" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Danh sách học sinh
        </a>
      </div>

      {/* Profile header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, #2d4ab7 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 24, color: '#fff',
        display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 800,
        }}>
          {(profile.full_name ?? '?')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            {profile.full_name ?? 'Chưa đặt tên'}
          </h1>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {profile.school && (
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <School size={13} /> {profile.school}
              </span>
            )}
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Target size={13} /> Mục tiêu: {target}/1200
            </span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={13} /> Tham gia {new Date(profile.created_at).toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>Điểm ước tính</p>
          <p style={{ fontSize: 38, fontWeight: 900, lineHeight: 1 }}>
            {estimatedTotal}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>/1200</p>
          {estimatedTotal > 0 && (
            <p style={{ fontSize: 11, marginTop: 4, color: estimatedTotal >= target ? '#86efac' : '#fde68a', fontWeight: 700 }}>
              {estimatedTotal >= target ? '✓ Đạt mục tiêu' : `Còn ${target - estimatedTotal} điểm`}
            </p>
          )}
        </div>
      </div>

      {/* Subject breakdown */}
      {Object.keys(lifetime).length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 14 }}>Kết quả theo môn</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
            {Object.entries(PART_META).map(([part, meta]) => {
              const stats = lifetime[part]
              if (!stats) return null
              const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
              const partScore = Math.round(pct / 100 * 300)
              return (
                <div key={part} style={{
                  background: '#fff', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '16px 18px', boxShadow: 'var(--card-shadow)',
                }}>
                  <div style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 999,
                    background: meta.bg, color: meta.color,
                    fontSize: 11, fontWeight: 700, marginBottom: 10,
                  }}>
                    {meta.label}
                  </div>
                  <p style={{ fontSize: 24, fontWeight: 800, color: meta.color, marginBottom: 2 }}>
                    {partScore}<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>/300</span>
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    {stats.correct}/{stats.total} câu đúng
                  </p>
                  <div style={{ background: '#e5e7eb', borderRadius: 999, height: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: meta.color, borderRadius: 999 }} />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{pct}% chính xác</p>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Submission history */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 14 }}>
        Lịch sử làm bài
        <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
          ({submissions?.length ?? 0} lần)
        </span>
      </h2>

      {!submissions?.length ? (
        <div style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 12,
          padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13,
        }}>
          <ClipboardList size={28} color="var(--border)" style={{ marginBottom: 10 }} />
          <p>Học sinh chưa làm bài thi nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {submissions.map(sub => {
            const test = sub.tests as unknown as { title: string }
            const bd = sub.breakdown as Record<string, PartStats>
            const estScore = Object.values(bd).reduce((s, { correct, total }) => {
              return s + (total > 0 ? Math.round((correct / total) * 300) : 0)
            }, 0)
            const pct = sub.total > 0 ? Math.round((sub.score / sub.total) * 100) : 0
            return (
              <div key={sub.id} style={{
                background: '#fff', border: '1px solid var(--border)', borderRadius: 12,
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
                boxShadow: 'var(--card-shadow)',
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)', marginBottom: 3 }}>
                    {test.title}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(sub.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Câu đúng</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>
                      {sub.score}/{sub.total}
                      <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>({pct}%)</span>
                    </p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Điểm ước tính</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: estScore >= target ? '#16a34a' : '#d97706' }}>
                      {estScore}/1200
                    </p>
                  </div>
                  <a href={`/dashboard/exams/${sub.test_id}/result/${sub.id}`} style={{
                    padding: '6px 14px', borderRadius: 7,
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    fontSize: 12, fontWeight: 600, color: 'var(--navy)', textDecoration: 'none',
                  }}>
                    Xem chi tiết
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
