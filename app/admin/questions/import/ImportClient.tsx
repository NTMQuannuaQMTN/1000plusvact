'use client'

import { useState, useTransition, useRef } from 'react'
import { PARTS, getPartLabel, getModuleLabel } from '@/lib/exam/parts'
import {
  extractQuestionsFromPdf,
  extractFullExamFromPdf,
  saveImportedQuestions,
  type ExtractedQuestion,
} from './actions'
import { createClient } from '@/lib/supabase/client'
import { Upload, CheckSquare, Square, Loader2, Image as ImageIcon } from 'lucide-react'

const OPTIONS = ['A', 'B', 'C', 'D'] as const

type Mode = 'part' | 'full'

export function ImportClient() {
  const [mode, setMode] = useState<Mode>('part')
  const [part, setPart] = useState('viet')
  const [module, setModule] = useState(Object.keys(PARTS.viet.modules)[0])
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{
    questions: ExtractedQuestion[]
    mode: Mode
    part?: string
    module?: string
    testTitle?: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  // image_url per question index, uploaded inline before saving
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({})
  const [imageUploading, setImageUploading] = useState<Record<number, boolean>>({})
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const modules = PARTS[part as keyof typeof PARTS]?.modules ?? {}

  const handlePartChange = (newPart: string) => {
    setPart(newPart)
    const mods = PARTS[newPart as keyof typeof PARTS]?.modules ?? {}
    setModule(Object.keys(mods)[0] ?? '')
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    setResult(null)
    setSelected(new Set())

    startTransition(async () => {
      const res = mode === 'full'
        ? await extractFullExamFromPdf(formData)
        : await extractQuestionsFromPdf(formData)

      if (res.ok) {
        setResult({
          questions: res.questions,
          mode: res.mode,
          ...(res.mode === 'part' ? { part: res.part, module: res.module } : { testTitle: res.testTitle }),
        })
        setSelected(new Set(res.questions.map((_, i) => i)))
      } else {
        setError(res.error)
      }
    })
  }

  const toggleAll = () => {
    if (!result) return
    setSelected(selected.size === result.questions.length
      ? new Set()
      : new Set(result.questions.map((_, i) => i)))
  }

  const toggle = (i: number) => {
    const next = new Set(selected)
    if (next.has(i)) { next.delete(i) } else { next.add(i) }
    setSelected(next)
  }

  const uploadImage = async (index: number, file: File) => {
    setImageUploading(prev => ({ ...prev, [index]: true }))
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'png'
      const path = `import-${Date.now()}-${index}.${ext}`
      const { error } = await supabase.storage.from('question-images').upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('question-images').getPublicUrl(path)
      setImageUrls(prev => ({ ...prev, [index]: data.publicUrl }))
    } finally {
      setImageUploading(prev => ({ ...prev, [index]: false }))
    }
  }

  const handleSave = async () => {
    if (!result || selected.size === 0) return
    setSaving(true)
    // Merge uploaded image URLs back into questions before saving
    const questionsWithImages = result.questions.map((q, i) =>
      imageUrls[i] ? { ...q, image_url: imageUrls[i] } : q
    )
    const fd = new FormData()
    fd.set('mode', result.mode)
    if (result.part) fd.set('part', result.part)
    if (result.module) fd.set('module', result.module)
    if (result.testTitle) fd.set('test_title', result.testTitle)
    fd.set('questions', JSON.stringify(questionsWithImages))
    selected.forEach(i => fd.append('selected', String(i)))
    await saveImportedQuestions(fd)
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Mode toggle */}
      <div style={{
        display: 'flex', background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 10, padding: 4, gap: 4, width: 'fit-content',
      }}>
        {([['part', 'Import từng phần'], ['full', 'Import cả đề thi']] as const).map(([m, label]) => (
          <button
            key={m}
            onClick={() => { setMode(m); setResult(null); setError(null) }}
            style={{
              padding: '8px 20px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              background: mode === m ? 'var(--navy)' : 'transparent',
              color: mode === m ? '#fff' : 'var(--text-muted)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Upload form */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '28px', boxShadow: 'var(--card-shadow)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 20 }}>
          {mode === 'part' ? '1. Chọn file PDF và môn học' : '1. Chọn file PDF đề thi đầy đủ'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {mode === 'part' ? (
            /* Part mode selectors */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Môn học *</label>
                <select name="part" value={part} onChange={e => handlePartChange(e.target.value)} className="form-input" style={{ fontSize: 14 }}>
                  {Object.entries(PARTS).map(([k, { label }]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Chủ đề *</label>
                <select name="module" value={module} onChange={e => setModule(e.target.value)} className="form-input" style={{ fontSize: 14 }}>
                  {Object.entries(modules).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* Full exam mode — just need a title */
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Tên đề thi *</label>
              <input
                name="test_title"
                required
                className="form-input"
                style={{ fontSize: 14 }}
                placeholder="Đề thi ĐGNL TPHCM 2026 - Đợt 1"
              />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                AI sẽ tự động xác định môn học và chủ đề cho từng câu hỏi, và tạo đề thi liên kết tất cả câu hỏi.
              </p>
            </div>
          )}

          {/* File upload */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>File PDF *</label>
            <input
              name="pdf"
              type="file"
              accept="application/pdf"
              required
              className="form-input"
              style={{ fontSize: 13, padding: '8px 12px', cursor: 'pointer' }}
            />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              Tối đa 20MB. Hình vẽ và sơ đồ trong đề sẽ được AI mô tả bằng văn bản.
            </p>
          </div>

          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#b91c1c' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 24px', fontSize: 14, border: 'none', borderRadius: 8,
              width: 'fit-content', opacity: isPending ? 0.7 : 1,
              cursor: isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {isPending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={16} />}
            {isPending ? 'AI đang xử lý...' : 'Trích xuất câu hỏi'}
          </button>
        </form>
      </div>

      {/* Results */}
      {result && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '28px', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 2 }}>
                2. Xem lại và lưu
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                AI tìm thấy {result.questions.length} câu hỏi. Đã chọn {selected.size} câu.
                {result.mode === 'full' && ` Sẽ tạo đề thi "${result.testTitle}".`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={toggleAll}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8,
                  background: 'var(--bg)', border: '1.5px solid var(--border)',
                  fontSize: 13, fontWeight: 600, color: 'var(--navy)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {selected.size === result.questions.length ? <CheckSquare size={14} /> : <Square size={14} />}
                {selected.size === result.questions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
              <button
                onClick={handleSave}
                disabled={selected.size === 0 || saving}
                className="btn-primary"
                style={{
                  padding: '8px 20px', border: 'none', borderRadius: 8,
                  fontSize: 13, fontWeight: 600,
                  opacity: selected.size === 0 || saving ? 0.5 : 1,
                  cursor: selected.size === 0 || saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Đang lưu...' : result.mode === 'full'
                  ? `Tạo đề thi & lưu ${selected.size} câu`
                  : `Lưu ${selected.size} câu hỏi`}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {result.questions.map((q, i) => (
              <div
                key={i}
                onClick={() => toggle(i)}
                style={{
                  border: `1.5px solid ${selected.has(i) ? 'var(--blue)' : 'var(--border)'}`,
                  borderRadius: 10, padding: '16px 18px',
                  background: selected.has(i) ? 'var(--blue-light)' : 'var(--bg)',
                  cursor: 'pointer',
                  transition: 'border-color 0.12s, background 0.12s',
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, marginTop: 1 }}>
                    {selected.has(i)
                      ? <CheckSquare size={18} color="var(--blue)" />
                      : <Square size={18} color="var(--text-muted)" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Meta row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Câu {i + 1}</span>
                      {result.mode === 'full' && q.part && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'var(--blue-light)', color: 'var(--navy)' }}>
                          {getPartLabel(q.part)} · {getModuleLabel(q.part, q.module ?? '')}
                        </span>
                      )}
                      {q.answer && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 4, background: '#dcfce7', color: '#16a34a' }}>
                          ĐA: {q.answer}
                        </span>
                      )}
                      {q.image_description && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: '#fef3c7', color: '#92400e', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ImageIcon size={11} /> Có hình vẽ
                        </span>
                      )}
                    </div>

                    {/* Passage */}
                    {q.passage && (
                      <div style={{
                        fontSize: 13, color: 'var(--text)', lineHeight: 1.6,
                        background: '#f8faff', border: '1px solid var(--border)',
                        borderLeft: '3px solid var(--blue)',
                        borderRadius: 6, padding: '10px 12px', marginBottom: 10,
                        whiteSpace: 'pre-wrap',
                      }}>
                        {q.passage}
                      </div>
                    )}

                    {/* Image — uploaded or description fallback */}
                    {(q.image_description || imageUrls[i]) && (
                      <div style={{
                        background: '#fef3c7', border: '1px solid #fde68a',
                        borderLeft: '3px solid #f59e0b',
                        borderRadius: 6, padding: '10px 12px', marginBottom: 10,
                      }}
                        onClick={e => e.stopPropagation()}
                      >
                        {imageUrls[i] ? (
                          <div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageUrls[i]} alt="Hình vẽ" style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 6, display: 'block', marginBottom: 8 }} />
                            <button
                              onClick={() => fileInputRefs.current[i]?.click()}
                              style={{ fontSize: 11, color: '#92400e', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}
                            >
                              Đổi ảnh
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                            <ImageIcon size={14} color="#92400e" style={{ flexShrink: 0, marginTop: 1 }} />
                            <span style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
                              <strong>Mô tả hình:</strong> {q.image_description}
                            </span>
                          </div>
                        )}

                        {!imageUrls[i] && (
                          <button
                            disabled={imageUploading[i]}
                            onClick={() => fileInputRefs.current[i]?.click()}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                              background: '#f59e0b', border: 'none', color: '#fff',
                              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                            }}
                          >
                            {imageUploading[i]
                              ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Đang upload...</>
                              : <><Upload size={12} /> Upload ảnh thật</>}
                          </button>
                        )}

                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          ref={el => { fileInputRefs.current[i] = el }}
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) uploadImage(i, file)
                          }}
                        />
                      </div>
                    )}

                    {/* Question */}
                    <p style={{ fontSize: 14, color: 'var(--navy)', fontWeight: 500, marginBottom: 10, lineHeight: 1.5 }}>
                      {q.content}
                    </p>

                    {/* Options */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {OPTIONS.map(letter => (
                        <div key={letter} style={{
                          display: 'flex', gap: 7, alignItems: 'flex-start',
                          fontSize: 13,
                          color: q.answer === letter ? '#16a34a' : 'var(--text)',
                          fontWeight: q.answer === letter ? 600 : 400,
                        }}>
                          <span style={{ fontWeight: 700, flexShrink: 0 }}>{letter}.</span>
                          <span>{q[`option_${letter.toLowerCase()}` as keyof ExtractedQuestion] as string}</span>
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, fontStyle: 'italic' }}>
                        💡 {q.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {result.questions.length > 5 && (
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleSave}
                disabled={selected.size === 0 || saving}
                className="btn-primary"
                style={{
                  padding: '10px 24px', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  opacity: selected.size === 0 || saving ? 0.5 : 1,
                  cursor: selected.size === 0 || saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Đang lưu...' : result.mode === 'full'
                  ? `Tạo đề thi & lưu ${selected.size} câu`
                  : `Lưu ${selected.size} câu hỏi vào ngân hàng`}
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
