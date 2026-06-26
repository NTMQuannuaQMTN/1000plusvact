import { createClient } from '@/lib/supabase/server'
import { ClipboardList, Clock, BookOpen, CheckCircle2, RotateCcw } from 'lucide-react'

export default async function ExamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: tests }, { data: mySubmissions }] = await Promise.all([
    supabase
      .from('tests')
      .select('id, title, description, year, test_questions(count)')
      .order('created_at', { ascending: false }),
    supabase
      .from('test_submissions')
      .select('id, test_id, score, total, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
  ])

  // Best score + latest submission id per test
  const submissionsByTest: Record<string, { bestScore: number; bestTotal: number; latestId: string; count: number }> = {}
  for (const sub of mySubmissions ?? []) {
    const tid = sub.test_id as string
    const score = sub.score as number
    const total = sub.total as number
    if (!submissionsByTest[tid]) {
      submissionsByTest[tid] = { bestScore: score, bestTotal: total, latestId: sub.id as string, count: 0 }
    } else {
      if (score > submissionsByTest[tid].bestScore) {
        submissionsByTest[tid].bestScore = score
        submissionsByTest[tid].bestTotal = total
      }
    }
    submissionsByTest[tid].count++
  }

  return (
    <div style={{ padding: '32px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>Đề thi thử</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Làm đề thi đầy đủ, nhận điểm chẩn đoán theo từng môn.
        </p>
      </div>

      {!tests?.length ? (
        <div style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 14,
          padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14,
        }}>
          Chưa có đề thi nào. Admin cần tạo và import đề thi trước.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tests.map(test => {
            const qCount = Array.isArray(test.test_questions) ? (test.test_questions[0] as { count: number })?.count ?? 0 : 0
            const mins = Math.round(qCount * 1.25)
            const prev = submissionsByTest[test.id]
            const bestPct = prev ? Math.round((prev.bestScore / prev.bestTotal) * 100) : null

            return (
              <div key={test.id} style={{
                background: '#fff', border: `1.5px solid ${prev ? '#bbf7d0' : 'var(--border)'}`,
                borderRadius: 14, padding: '22px 24px', boxShadow: 'var(--card-shadow)',
                display: 'flex', alignItems: 'center', gap: 18,
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 12, flexShrink: 0,
                  background: prev ? '#f0fdf4' : 'var(--blue-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {prev
                    ? <CheckCircle2 size={24} color="#16a34a" />
                    : <ClipboardList size={24} color="var(--navy)" />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>{test.title}</p>
                    {prev && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                        background: '#dcfce7', color: '#15803d',
                      }}>
                        Đã làm {prev.count > 1 ? `${prev.count} lần` : ''}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <BookOpen size={12} /> {qCount} câu hỏi
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> ~{mins} phút
                    </span>
                    {test.year && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Năm {test.year}</span>
                    )}
                    {prev && (
                      <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                        Điểm tốt nhất: {prev.bestScore}/{prev.bestTotal} ({bestPct}%)
                      </span>
                    )}
                  </div>
                  {test.description && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{test.description}</p>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                  {prev && (
                    <a href={`/dashboard/exams/${test.id}/result/${prev.latestId}`} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '8px 16px', borderRadius: 8,
                      background: '#f0fdf4', color: '#15803d',
                      border: '1.5px solid #86efac',
                      fontSize: 12, fontWeight: 600, textDecoration: 'none',
                    }}>
                      Xem kết quả
                    </a>
                  )}
                  <a href={`/dashboard/exams/${test.id}`} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '8px 16px', borderRadius: 8,
                    background: prev ? 'var(--bg)' : 'var(--navy)',
                    color: prev ? 'var(--navy)' : '#fff',
                    border: prev ? '1.5px solid var(--border)' : 'none',
                    fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  }}>
                    {prev ? <><RotateCcw size={12} /> Làm lại</> : 'Làm bài →'}
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
