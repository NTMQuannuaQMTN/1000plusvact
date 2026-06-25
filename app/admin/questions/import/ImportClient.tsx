'use client'

import { useState, useRef, useEffect } from 'react'
import { PARTS, getPartLabel, getModuleLabel } from '@/lib/exam/parts'
import { saveImportedQuestions, type ExtractedQuestion } from './actions'
import { createClient } from '@/lib/supabase/client'
import { Upload, CheckSquare, Square, Loader2, Image as ImageIcon } from 'lucide-react'

const OPTIONS = ['A', 'B', 'C', 'D'] as const
type Mode = 'part' | 'full'

type ProgressState = {
  phase: 'idle' | 'reading' | 'analyzing' | 'extracting' | 'parsing' | 'done' | 'error'
  progress: number
  partialCount: number
  estimatedSeconds: number
  error: string | null
}

const PHASE_LABELS: Record<ProgressState['phase'], string> = {
  idle:       '',
  reading:    'Đang đọc file PDF...',
  analyzing:  'AI đang bắt đầu phân tích...',
  extracting: 'Đang trích xuất câu hỏi...',
  parsing:    'Đang xử lý kết quả...',
  done:       'Hoàn thành!',
  error:      'Có lỗi xảy ra',
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ ps, elapsed }: { ps: ProgressState; elapsed: number }) {
  if (ps.phase === 'idle') return null

  const remaining = ps.phase !== 'done' && ps.estimatedSeconds > 0
    ? Math.max(0, ps.estimatedSeconds - elapsed)
    : null

  const progressColor = ps.phase === 'error' ? '#dc2626'
    : ps.phase === 'done' ? '#16a34a'
    : 'var(--blue)'

  return (
    <div style={{
      background: 'var(--bg)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '20px 22px',
      boxShadow: 'var(--card-shadow)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {ps.phase !== 'done' && ps.phase !== 'error' && (
            <Loader2 size={15} color="var(--blue)" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          )}
          <span style={{ fontSize: 14, fontWeight: 600, color: ps.phase === 'error' ? '#dc2626' : 'var(--navy)' }}>
            {PHASE_LABELS[ps.phase]}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {ps.partialCount > 0 && ps.phase !== 'done' && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>~{ps.partialCount} câu hỏi</span>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
            {elapsed}s{remaining !== null ? ` / ~${ps.estimatedSeconds}s` : ''}
          </span>
        </div>
      </div>

      <div style={{ background: '#e5e7eb', borderRadius: 999, height: 8, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${ps.progress}%`, background: progressColor,
          borderRadius: 999, transition: 'width 0.6s ease, background 0.3s',
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {ps.phase === 'extracting' && ps.partialCount > 0
            ? `Đã tìm thấy ${ps.partialCount} câu hỏi...`
            : ps.phase === 'done' ? `Hoàn thành — ${ps.partialCount} câu hỏi`
            : ps.phase === 'error' ? ps.error
            : 'Vui lòng không đóng trang này'}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: progressColor }}>{ps.progress}%</span>
      </div>

      {remaining !== null && remaining > 0 && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
          Ước tính còn lại: {remaining < 60 ? `${remaining}s` : `${Math.ceil(remaining / 60)} phút`}
        </p>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ImportClient() {
  const [mode, setMode] = useState<Mode>('part')
  const [part, setPart] = useState('viet')
  const [module, setModule] = useState(Object.keys(PARTS.viet.modules)[0])

  const [ps, setPs] = useState<ProgressState>({
    phase: 'idle', progress: 0, partialCount: 0, estimatedSeconds: 0, error: null,
  })
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [result, setResult] = useState<{
    questions: ExtractedQuestion[]
    mode: Mode
    part?: string
    module?: string
    testTitle?: string
  } | null>(null)

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)

  // keyed by image_group index — shared across questions with the same table/figure
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({})
  const [imageUploading, setImageUploading] = useState<Record<number, boolean>>({})

  // one hidden file input per question card (index i), but upload stores by image_group
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  // per-question answer + explanation overrides
  const [overrides, setOverrides] = useState<Record<number, { answer: string; explanation: string }>>({})

  const modules = PARTS[part as keyof typeof PARTS]?.modules ?? {}

  useEffect(() => {
    if (ps.phase !== 'idle' && ps.phase !== 'done' && ps.phase !== 'error') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [ps.phase])

  const handlePartChange = (newPart: string) => {
    setPart(newPart)
    const mods = PARTS[newPart as keyof typeof PARTS]?.modules ?? {}
    setModule(Object.keys(mods)[0] ?? '')
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('mode', mode)
    if (mode === 'part') {
      formData.set('part', part)
      formData.set('module', module)
    }

    setResult(null)
    setSelected(new Set())
    setElapsed(0)
    setImageUrls({})
    setImageUploading({})
    setOverrides({})
    setPs({ phase: 'reading', progress: 5, partialCount: 0, estimatedSeconds: 0, error: null })

    try {
      const response = await fetch('/admin/questions/import/extract', { method: 'POST', body: formData })
      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const event = JSON.parse(line.slice(6))

          if (event.phase === 'error') {
            setPs(prev => ({ ...prev, phase: 'error', error: event.error }))
            return
          }

          if (event.phase === 'done') {
            const qs: ExtractedQuestion[] = event.questions
            setPs(prev => ({ ...prev, phase: 'done', progress: 100, partialCount: qs.length }))
            const testTitle = formData.get('test_title') as string | null
            setResult({ questions: qs, mode, ...(mode === 'part' ? { part, module } : { testTitle: testTitle ?? '' }) })
            setSelected(new Set(qs.map((_, i) => i)))
            setOverrides(Object.fromEntries(qs.map((q, i) => [i, { answer: q.answer, explanation: q.explanation ?? '' }])))
            return
          }

          setPs(prev => ({
            ...prev,
            phase: event.phase,
            progress: event.progress ?? prev.progress,
            partialCount: event.partialCount ?? prev.partialCount,
            estimatedSeconds: event.estimatedSeconds ?? prev.estimatedSeconds,
          }))
        }
      }
    } catch (err) {
      setPs(prev => ({ ...prev, phase: 'error', error: err instanceof Error ? err.message : 'Có lỗi không xác định.' }))
    }
  }

  const toggleAll = () => {
    if (!result) return
    setSelected(selected.size === result.questions.length ? new Set() : new Set(result.questions.map((_, i) => i)))
  }

  const toggle = (i: number) => {
    const next = new Set(selected)
    if (next.has(i)) { next.delete(i) } else { next.add(i) }
    setSelected(next)
  }

  const uploadImage = async (imageGroup: number, questionIdx: number, file: File) => {
    setImageUploading(prev => ({ ...prev, [imageGroup]: true }))
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'png'
      const path = `import-${Date.now()}-g${imageGroup}.${ext}`
      const { error } = await supabase.storage.from('question-images').upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('question-images').getPublicUrl(path)
      setImageUrls(prev => ({ ...prev, [imageGroup]: data.publicUrl }))
    } finally {
      setImageUploading(prev => ({ ...prev, [imageGroup]: false }))
    }
    void questionIdx // suppress unused-var
  }

  const setOverride = (i: number, field: 'answer' | 'explanation', value: string) => {
    setOverrides(prev => ({ ...prev, [i]: { ...prev[i], [field]: value } }))
  }

  const handleSave = async () => {
    if (!result || selected.size === 0) return
    setSaving(true)
    const questionsWithEdits = result.questions.map((q, i) => {
      const ig = q.image_group ?? null
      return {
        ...q,
        answer: overrides[i]?.answer ?? q.answer,
        explanation: overrides[i]?.explanation || q.explanation,
        image_url: ig !== null && imageUrls[ig] ? imageUrls[ig] : undefined,
      }
    })
    const fd = new FormData()
    fd.set('mode', result.mode)
    if (result.part) fd.set('part', result.part)
    if (result.module) fd.set('module', result.module)
    if (result.testTitle) fd.set('test_title', result.testTitle)
    fd.set('questions', JSON.stringify(questionsWithEdits))
    selected.forEach(i => fd.append('selected', String(i)))
    await saveImportedQuestions(fd)
    setSaving(false)
  }

  const isProcessing = ps.phase !== 'idle' && ps.phase !== 'done' && ps.phase !== 'error'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Mode toggle */}
      <div style={{
        display: 'flex', background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 10, padding: 4, gap: 4, width: 'fit-content',
      }}>
        {([['part', 'Import từng phần'], ['full', 'Import cả đề thi']] as const).map(([m, label]) => (
          <button key={m} onClick={() => { setMode(m); setResult(null); setPs(p => ({ ...p, phase: 'idle' })) }}
            style={{
              padding: '8px 20px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              background: mode === m ? 'var(--navy)' : 'transparent',
              color: mode === m ? '#fff' : 'var(--text-muted)',
              transition: 'background 0.15s, color 0.15s',
            }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Môn học *</label>
                <select name="part" value={part} onChange={e => handlePartChange(e.target.value)} className="form-input" style={{ fontSize: 14 }}>
                  {Object.entries(PARTS).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Chủ đề *</label>
                <select name="module" value={module} onChange={e => setModule(e.target.value)} className="form-input" style={{ fontSize: 14 }}>
                  {Object.entries(modules).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Tên đề thi *</label>
              <input name="test_title" required className="form-input" style={{ fontSize: 14 }} placeholder="Đề thi ĐGNL TPHCM 2026 - Đợt 1" />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>AI sẽ tự động xác định môn học và chủ đề cho từng câu hỏi.</p>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>File PDF *</label>
            <input name="pdf" type="file" accept="application/pdf" required className="form-input" style={{ fontSize: 13, padding: '8px 12px', cursor: 'pointer' }} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Tối đa 20MB.</p>
          </div>

          <button type="submit" disabled={isProcessing} className="btn-primary" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 24px', fontSize: 14, border: 'none', borderRadius: 8,
            width: 'fit-content', opacity: isProcessing ? 0.5 : 1,
            cursor: isProcessing ? 'not-allowed' : 'pointer',
          }}>
            <Upload size={16} /> Trích xuất câu hỏi
          </button>
        </form>
      </div>

      {/* Progress */}
      {ps.phase !== 'idle' && <ProgressBar ps={ps} elapsed={elapsed} />}

      {/* Results */}
      {result && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '28px', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 2 }}>2. Xem lại và lưu</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {result.questions.length} câu hỏi — Đã chọn {selected.size}.
                {result.mode === 'full' && ` Sẽ tạo đề thi "${result.testTitle}".`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={toggleAll} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8,
                background: 'var(--bg)', border: '1.5px solid var(--border)',
                fontSize: 13, fontWeight: 600, color: 'var(--navy)', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {selected.size === result.questions.length ? <CheckSquare size={14} /> : <Square size={14} />}
                {selected.size === result.questions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
              <button onClick={handleSave} disabled={selected.size === 0 || saving} className="btn-primary" style={{
                padding: '8px 20px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                opacity: selected.size === 0 || saving ? 0.5 : 1,
                cursor: selected.size === 0 || saving ? 'not-allowed' : 'pointer',
              }}>
                {saving ? 'Đang lưu...' : result.mode === 'full'
                  ? `Tạo đề thi & lưu ${selected.size} câu`
                  : `Lưu ${selected.size} câu hỏi`}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {result.questions.map((q, i) => {
              const ig = q.image_group ?? null
              const hasImage = ig !== null
              const uploadedUrl = hasImage ? (imageUrls[ig] ?? null) : null
              const isUploading = hasImage ? (imageUploading[ig] ?? false) : false
              const ov = overrides[i] ?? { answer: q.answer, explanation: q.explanation ?? '' }

              return (
                <div key={i} onClick={() => toggle(i)} style={{
                  border: `1.5px solid ${selected.has(i) ? 'var(--blue)' : 'var(--border)'}`,
                  borderRadius: 10, padding: '16px 18px',
                  background: selected.has(i) ? 'var(--blue-light)' : 'var(--bg)',
                  cursor: 'pointer', transition: 'border-color 0.12s, background 0.12s',
                }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, marginTop: 1 }}>
                      {selected.has(i) ? <CheckSquare size={18} color="var(--blue)" /> : <Square size={18} color="var(--text-muted)" />}
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
                        {hasImage && !uploadedUrl && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: '#fef3c7', color: '#92400e', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ImageIcon size={11} /> Có hình ảnh/bảng
                          </span>
                        )}
                        {uploadedUrl && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ImageIcon size={11} /> Đã upload ảnh
                          </span>
                        )}
                      </div>

                      {/* Passage */}
                      {q.passage && (
                        <div style={{
                          fontSize: 13, color: 'var(--text)', lineHeight: 1.6,
                          background: '#f8faff', border: '1px solid var(--border)',
                          borderLeft: '3px solid var(--blue)',
                          borderRadius: 6, padding: '10px 12px', marginBottom: 10, whiteSpace: 'pre-wrap',
                        }}>
                          {q.passage}
                        </div>
                      )}

                      {/* Image upload — shared by all questions with same image_group */}
                      {hasImage && (
                        <div style={{
                          background: '#fef3c7', border: '1px solid #fde68a',
                          borderLeft: '3px solid #f59e0b', borderRadius: 6, padding: '10px 12px', marginBottom: 10,
                        }} onClick={e => e.stopPropagation()}>
                          {uploadedUrl ? (
                            <div>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={uploadedUrl} alt="Hình ảnh / bảng" style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 6, display: 'block', marginBottom: 8 }} />
                              <button onClick={() => fileInputRefs.current[i]?.click()} style={{ fontSize: 11, color: '#92400e', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
                                Đổi ảnh
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <ImageIcon size={16} color="#92400e" style={{ flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: '#92400e', flex: 1 }}>
                                Câu hỏi này có hình ảnh hoặc bảng số liệu — upload ảnh chụp từ đề thi.
                                {ig !== null && result.questions.filter(qq => (qq.image_group ?? null) === ig).length > 1 && (
                                  <span style={{ fontWeight: 600 }}> (dùng chung với các câu khác)</span>
                                )}
                              </span>
                              <button disabled={isUploading} onClick={() => fileInputRefs.current[i]?.click()} style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '5px 12px', borderRadius: 6, cursor: isUploading ? 'not-allowed' : 'pointer',
                                background: '#f59e0b', border: 'none', color: '#fff',
                                fontSize: 12, fontWeight: 600, fontFamily: 'inherit', flexShrink: 0,
                              }}>
                                {isUploading
                                  ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Đang upload...</>
                                  : <><Upload size={12} /> Upload ảnh</>}
                              </button>
                            </div>
                          )}
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            ref={el => { fileInputRefs.current[i] = el }}
                            onChange={e => { const f = e.target.files?.[0]; if (f && ig !== null) uploadImage(ig, i, f) }}
                          />
                        </div>
                      )}

                      {/* Question */}
                      <p style={{ fontSize: 14, color: 'var(--navy)', fontWeight: 500, marginBottom: 10, lineHeight: 1.5 }}>{q.content}</p>

                      {/* Options */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
                        {OPTIONS.map(letter => (
                          <div key={letter} style={{
                            display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 13,
                            color: ov.answer === letter ? '#16a34a' : 'var(--text)',
                            fontWeight: ov.answer === letter ? 600 : 400,
                          }}>
                            <span style={{ fontWeight: 700, flexShrink: 0 }}>{letter}.</span>
                            <span>{q[`option_${letter.toLowerCase()}` as keyof ExtractedQuestion] as string}</span>
                          </div>
                        ))}
                      </div>

                      {/* Editable answer */}
                      <div onClick={e => e.stopPropagation()} style={{
                        borderTop: '1px solid var(--border)', paddingTop: 12,
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0 }}>Đáp án:</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {OPTIONS.map(letter => (
                            <button key={letter} onClick={() => setOverride(i, 'answer', letter)} style={{
                              width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer',
                              fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                              background: ov.answer === letter ? '#16a34a' : 'var(--bg)',
                              color: ov.answer === letter ? '#fff' : 'var(--text)',
                              outline: ov.answer === letter ? 'none' : '1.5px solid var(--border)',
                              transition: 'background 0.12s, color 0.12s',
                            }}>
                              {letter}
                            </button>
                          ))}
                          {ov.answer === '' && (
                            <span style={{ fontSize: 11, color: '#dc2626', alignSelf: 'center', marginLeft: 4 }}>Chưa có đáp án</span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {result.questions.length > 5 && (
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleSave} disabled={selected.size === 0 || saving} className="btn-primary" style={{
                padding: '10px 24px', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
                opacity: selected.size === 0 || saving ? 0.5 : 1,
                cursor: selected.size === 0 || saving ? 'not-allowed' : 'pointer',
              }}>
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
