import { createClient } from '@/lib/supabase/server'
import { PARTS } from '@/lib/exam/parts'
import { QuestionCard } from './QuestionCard'

type SearchParams = Promise<{ part?: string; module?: string; page?: string }>

export default async function PracticePage({ searchParams }: { searchParams: SearchParams }) {
  const { part, module, page } = await searchParams
  const pageNum = Math.max(1, parseInt(page ?? '1', 10))
  const pageSize = 10
  const offset = (pageNum - 1) * pageSize

  const supabase = await createClient()

  let query = supabase
    .from('questions')
    .select('id, content, passage, image_url, option_a, option_b, option_c, option_d, answer, part, module', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (part) query = query.eq('part', part)
  if (module) query = query.eq('module', module)

  const { data: questions, count } = await query
  const totalPages = Math.ceil((count ?? 0) / pageSize)
  const partKeys = Object.keys(PARTS)

  return (
    <div style={{ padding: '32px', maxWidth: 800, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>Luyện tập</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Đọc câu hỏi, chọn đáp án, hoặc nhờ AI giải thích ngay.
        </p>
      </div>

      {/* Filters */}
      <form method="GET" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        <select name="part" defaultValue={part ?? ''} className="form-input" style={{ fontSize: 13, minWidth: 160 }}>
          <option value="">Tất cả môn</option>
          {partKeys.map(k => (
            <option key={k} value={k}>{PARTS[k as keyof typeof PARTS].label}</option>
          ))}
        </select>

        {part && PARTS[part as keyof typeof PARTS] && (
          <select name="module" defaultValue={module ?? ''} className="form-input" style={{ fontSize: 13, minWidth: 180 }}>
            <option value="">Tất cả chủ đề</option>
            {Object.entries(PARTS[part as keyof typeof PARTS].modules).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        )}

        <button type="submit" className="btn-primary" style={{ padding: '9px 20px', fontSize: 13, border: 'none', borderRadius: 8 }}>
          Lọc
        </button>
        {(part || module) && (
          <a href="/dashboard/practice" style={{ fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center' }}>Xóa lọc</a>
        )}
      </form>

      {/* Questions */}
      {!questions?.length ? (
        <div style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 14,
          padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14,
        }}>
          Chưa có câu hỏi nào. Admin cần import câu hỏi trước.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {questions.map((q, i) => (
            <QuestionCard key={q.id} q={q} index={offset + i} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 28 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <a key={p}
              href={`/dashboard/practice?page=${p}${part ? `&part=${part}` : ''}${module ? `&module=${module}` : ''}`}
              style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 13,
                background: p === pageNum ? 'var(--navy)' : 'var(--bg)',
                color: p === pageNum ? '#fff' : 'var(--text)',
                border: '1px solid var(--border)', textDecoration: 'none', fontWeight: 500,
              }}>
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
