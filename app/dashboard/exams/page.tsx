import { createClient } from '@/lib/supabase/server'
import { ClipboardList, Clock, BookOpen } from 'lucide-react'

export default async function ExamsPage() {
  const supabase = await createClient()

  const { data: tests } = await supabase
    .from('tests')
    .select('id, title, description, year, test_questions(count)')
    .order('created_at', { ascending: false })

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
            return (
              <div key={test.id} style={{
                background: '#fff', border: '1px solid var(--border)', borderRadius: 14,
                padding: '22px 24px', boxShadow: 'var(--card-shadow)',
                display: 'flex', alignItems: 'center', gap: 18,
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 12, flexShrink: 0,
                  background: 'var(--blue-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ClipboardList size={24} color="var(--navy)" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>{test.title}</p>
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
                  </div>
                  {test.description && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{test.description}</p>
                  )}
                </div>

                <a href={`/dashboard/exams/${test.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 20px', borderRadius: 10,
                  background: 'var(--navy)', color: '#fff',
                  fontSize: 13, fontWeight: 700, textDecoration: 'none', flexShrink: 0,
                }}>
                  Làm bài →
                </a>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
