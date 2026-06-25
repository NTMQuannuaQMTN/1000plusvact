import { createClient } from '@/lib/supabase/server'
import { PlusCircle, FileText, Pencil } from 'lucide-react'
import { deleteTest } from './actions'
import { DeleteButton } from '@/components/DeleteButton'

export default async function TestsPage() {
  const supabase = await createClient()
  const { data: tests, count } = await supabase
    .from('tests')
    .select('*, test_questions(count)', { count: 'exact' })
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginBottom: 2 }}>Đề thi</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{count ?? 0} đề thi</p>
        </div>
        <a href="/admin/tests/new" style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 16px', borderRadius: 8,
          background: 'var(--navy)', border: 'none',
          fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none',
        }}>
          <PlusCircle size={15} /> Tạo đề thi
        </a>
      </div>

      {/* List */}
      {!tests?.length ? (
        <div style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 14,
          padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14,
          boxShadow: 'var(--card-shadow)',
        }}>
          Chưa có đề thi nào. <a href="/admin/tests/new" style={{ color: 'var(--blue)' }}>Tạo đề thi đầu tiên</a>.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tests.map(test => {
            const qCount = Array.isArray(test.test_questions) ? test.test_questions[0]?.count ?? 0 : 0
            return (
              <div key={test.id} style={{
                background: '#fff', border: '1px solid var(--border)', borderRadius: 12,
                padding: '18px 20px', boxShadow: 'var(--card-shadow)',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: 'var(--blue-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <FileText size={20} color="var(--navy)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 2 }}>{test.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {qCount} câu hỏi
                    {test.year ? ` · Năm ${test.year}` : ''}
                    {test.description ? ` · ${test.description}` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <a href={`/admin/tests/${test.id}/edit`} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '6px 12px', borderRadius: 7,
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    fontSize: 12, color: 'var(--navy)', textDecoration: 'none', fontWeight: 600,
                  }}>
                    <Pencil size={12} /> Sửa
                  </a>
                  <DeleteButton action={deleteTest} id={test.id} confirmMessage="Xóa đề thi này?" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
