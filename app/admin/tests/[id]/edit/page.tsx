import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PARTS, PartKey } from '@/lib/exam/parts'
import { saveTest, addQuestionToTest, removeQuestionFromTest } from '../../actions'
import { Trash2, Plus, BookOpen } from 'lucide-react'

type Params = Promise<{ id: string }>
type SearchParams = Promise<{ part?: string; module?: string }>

const PART_COLORS: Record<string, string> = {
  viet: '#2563eb', anh: '#16a34a', toan: '#d97706', khoa_hoc: '#7c3aed',
}

export default async function EditTestPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const { id } = await params
  const { part, module } = await searchParams
  const supabase = await createClient()

  const [{ data: test }, { data: testQRows }] = await Promise.all([
    supabase.from('tests').select('*').eq('id', id).single(),
    supabase
      .from('test_questions')
      .select('order_num, question_id, questions!inner(id, content, part, module, answer)')
      .eq('test_id', id)
      .order('order_num'),
  ])

  if (!test) notFound()

  const inTestIds = new Set((testQRows ?? []).map(r => r.question_id as string))
  const testQuestions = (testQRows ?? []).map(r => ({
    ...(r.questions as unknown as { id: string; content: string; part: string; module: string; answer: string }),
    order_num: r.order_num as number,
  }))

  // Available questions (filtered, not in test)
  let bankQuery = supabase
    .from('questions')
    .select('id, content, part, module, answer')
    .order('created_at', { ascending: false })
    .limit(30)

  if (part) bankQuery = bankQuery.eq('part', part)
  if (module) bankQuery = bankQuery.eq('module', module)

  const { data: bankRaw } = await bankQuery
  const bank = (bankRaw ?? []).filter(q => !inTestIds.has(q.id))

  const partKeys = Object.keys(PARTS) as PartKey[]

  return (
    <div style={{ padding: '32px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <a href="/admin/tests" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Đề thi
        </a>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginTop: 8, marginBottom: 2 }}>
          Chỉnh sửa đề thi
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{testQuestions.length} câu hỏi</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* LEFT: Test info + current questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Metadata */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '24px', boxShadow: 'var(--card-shadow)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 18 }}>Thông tin đề thi</h2>
            <form action={saveTest} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input type="hidden" name="id" value={id} />
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 5 }}>Tên đề thi *</label>
                <input name="title" required defaultValue={test.title} className="form-input" style={{ fontSize: 14 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 5 }}>Năm</label>
                  <input name="year" type="number" defaultValue={test.year ?? ''} className="form-input" style={{ fontSize: 14 }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 5 }}>Mô tả</label>
                <textarea name="description" rows={2} defaultValue={test.description ?? ''} className="form-input" style={{ fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '9px 20px', fontSize: 13, border: 'none', borderRadius: 8, alignSelf: 'flex-end' }}>
                Lưu thông tin
              </button>
            </form>
          </div>

          {/* Current questions */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={15} color="var(--navy)" />
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>
                Câu hỏi trong đề
                <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>({testQuestions.length})</span>
              </h2>
            </div>
            {!testQuestions.length ? (
              <p style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                Chưa có câu hỏi. Thêm từ ngân hàng bên phải.
              </p>
            ) : (
              <div>
                {testQuestions.map((q, i) => (
                  <div key={q.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '12px 16px',
                    borderBottom: i < testQuestions.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, width: 22, flexShrink: 0, paddingTop: 2 }}>
                      {q.order_num}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: 'var(--navy)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {q.content}
                      </p>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: PART_COLORS[q.part] + '18', color: PART_COLORS[q.part] }}>
                          {PARTS[q.part as PartKey]?.label ?? q.part}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>ĐA: {q.answer}</span>
                      </div>
                    </div>
                    <form action={removeQuestionFromTest}>
                      <input type="hidden" name="test_id" value={id} />
                      <input type="hidden" name="question_id" value={q.id} />
                      <button type="submit" title="Xóa khỏi đề" style={{
                        width: 28, height: 28, borderRadius: 6, border: 'none',
                        background: '#fef2f2', color: '#dc2626', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Trash2 size={13} />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Question bank */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--card-shadow)', position: 'sticky', top: 24 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>Ngân hàng câu hỏi</h2>
            {/* Filters */}
            <form method="GET" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select name="part" defaultValue={part ?? ''} className="form-input" style={{ fontSize: 12, flex: 1, minWidth: 120 }}>
                <option value="">Tất cả môn</option>
                {partKeys.map(k => (
                  <option key={k} value={k}>{PARTS[k].label}</option>
                ))}
              </select>
              {part && PARTS[part as PartKey] && (
                <select name="module" defaultValue={module ?? ''} className="form-input" style={{ fontSize: 12, flex: 1, minWidth: 140 }}>
                  <option value="">Tất cả chủ đề</option>
                  {Object.entries(PARTS[part as PartKey].modules).map(([k, lbl]) => (
                    <option key={k} value={k}>{lbl}</option>
                  ))}
                </select>
              )}
              <button type="submit" className="btn-primary" style={{ padding: '7px 14px', fontSize: 12, border: 'none', borderRadius: 7 }}>Lọc</button>
              {(part || module) && <a href={`/admin/tests/${id}/edit`} style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>Xóa</a>}
            </form>
          </div>

          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            {!bank.length ? (
              <p style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                {inTestIds.size > 0 && !part
                  ? 'Tất cả câu hỏi đã có trong đề, hoặc dùng bộ lọc để tìm thêm.'
                  : 'Không có câu hỏi phù hợp.'}
              </p>
            ) : (
              bank.map((q, i) => (
                <div key={q.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '12px 16px',
                  borderBottom: i < bank.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: 'var(--navy)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {q.content}
                    </p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: PART_COLORS[q.part] + '18', color: PART_COLORS[q.part] }}>
                        {PARTS[q.part as PartKey]?.label ?? q.part}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {PARTS[q.part as PartKey]?.modules[q.module] ?? q.module}
                      </span>
                    </div>
                  </div>
                  <form action={addQuestionToTest}>
                    <input type="hidden" name="test_id" value={id} />
                    <input type="hidden" name="question_id" value={q.id} />
                    <button type="submit" title="Thêm vào đề" style={{
                      width: 28, height: 28, borderRadius: 6, border: 'none',
                      background: '#f0fdf4', color: '#16a34a', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Plus size={14} />
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
            Hiển thị {bank.length} câu chưa có trong đề (tối đa 30)
          </div>
        </div>
      </div>
    </div>
  )
}
