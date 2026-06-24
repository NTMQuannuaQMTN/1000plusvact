import { createClient } from '@/lib/supabase/server'
import { PARTS, getPartLabel, getModuleLabel } from '@/lib/exam/parts'
import { PlusCircle, Upload, Search, Pencil, Trash2 } from 'lucide-react'
import { deleteQuestion } from './actions'

type SearchParams = Promise<{ part?: string; module?: string; q?: string; page?: string }>

export default async function QuestionsPage({ searchParams }: { searchParams: SearchParams }) {
  const { part, module, q, page } = await searchParams
  const pageNum = Math.max(1, parseInt(page ?? '1', 10))
  const pageSize = 20
  const offset = (pageNum - 1) * pageSize

  const supabase = await createClient()

  let query = supabase
    .from('questions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (part) query = query.eq('part', part)
  if (module) query = query.eq('module', module)
  if (q) query = query.ilike('content', `%${q}%`)

  const { data: questions, count } = await query
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  const partKeys = Object.keys(PARTS)

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginBottom: 2 }}>Ngân hàng câu hỏi</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{count ?? 0} câu hỏi</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/admin/questions/import" style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 16px', borderRadius: 8,
            background: 'var(--bg)', border: '1.5px solid var(--border)',
            fontSize: 13, fontWeight: 600, color: 'var(--navy)', textDecoration: 'none',
          }}>
            <Upload size={15} /> Import PDF
          </a>
          <a href="/admin/questions/new" style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 16px', borderRadius: 8,
            background: 'var(--navy)', border: 'none',
            fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none',
          }}>
            <PlusCircle size={15} /> Thêm câu hỏi
          </a>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Tìm câu hỏi..."
            className="form-input"
            style={{ paddingLeft: 34, fontSize: 13, width: '100%' }}
          />
        </div>

        {/* Part */}
        <select name="part" defaultValue={part ?? ''} className="form-input" style={{ fontSize: 13, minWidth: 160 }}>
          <option value="">Tất cả môn</option>
          {partKeys.map(k => (
            <option key={k} value={k}>{PARTS[k as keyof typeof PARTS].label}</option>
          ))}
        </select>

        {/* Module (only if part selected) */}
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
        <a href="/admin/questions" style={{ fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center' }}>Xóa lọc</a>
      </form>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
        {!questions?.length ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Chưa có câu hỏi nào. <a href="/admin/questions/new" style={{ color: 'var(--blue)' }}>Thêm câu hỏi</a> hoặc <a href="/admin/questions/import" style={{ color: 'var(--blue)' }}>import từ PDF</a>.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['#', 'Môn', 'Chủ đề', 'Câu hỏi', 'Đáp án', ''].map(h => (
                  <th key={h} style={{
                    padding: '11px 14px', textAlign: 'left',
                    fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)', width: 40 }}>
                    {offset + i + 1}
                  </td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 8px',
                      borderRadius: 999, background: 'var(--blue-light)', color: 'var(--navy)',
                    }}>
                      {getPartLabel(q.part)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {getModuleLabel(q.part, q.module)}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text)', maxWidth: 400 }}>
                    <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {q.content}
                    </p>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: '#16a34a', background: '#dcfce7',
                      padding: '2px 8px', borderRadius: 4,
                    }}>
                      {q.answer}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a href={`/admin/questions/${q.id}/edit`} style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '5px 10px', borderRadius: 6,
                        background: 'var(--bg)', border: '1px solid var(--border)',
                        fontSize: 12, color: 'var(--navy)', textDecoration: 'none',
                      }}>
                        <Pencil size={12} /> Sửa
                      </a>
                      <form action={deleteQuestion}>
                        <input type="hidden" name="id" value={q.id} />
                        <button type="submit" style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '5px 10px', borderRadius: 6,
                          background: '#fff0f0', border: '1px solid #fca5a5',
                          fontSize: 12, color: '#dc2626', cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                          onClick={(e) => {
                            if (!confirm('Xóa câu hỏi này?')) e.preventDefault()
                          }}
                        >
                          <Trash2 size={12} /> Xóa
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <a
              key={p}
              href={`/admin/questions?page=${p}${part ? `&part=${part}` : ''}${module ? `&module=${module}` : ''}${q ? `&q=${q}` : ''}`}
              style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 13,
                background: p === pageNum ? 'var(--navy)' : 'var(--bg)',
                color: p === pageNum ? '#fff' : 'var(--text)',
                border: '1px solid var(--border)', textDecoration: 'none', fontWeight: 500,
              }}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
