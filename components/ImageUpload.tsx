'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'

type Props = {
  currentUrl?: string | null
  questionId?: string
  onUpload?: (url: string) => void
  // When used inside a form with no questionId yet, just provides a preview URL via hidden input
  name?: string
}

export function ImageUpload({ currentUrl, questionId, onUpload, name = 'image_url' }: Props) {
  const [url, setUrl] = useState<string | null>(currentUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Chỉ hỗ trợ file ảnh (PNG, JPG, GIF, WEBP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh quá lớn (tối đa 5MB).')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'png'
      const path = `${questionId ?? `new-${Date.now()}`}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('question-images')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('question-images').getPublicUrl(path)
      setUrl(data.publicUrl)
      onUpload?.(data.publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload thất bại.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const remove = () => {
    setUrl(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      {/* Hidden input so the URL is submitted with the form */}
      <input type="hidden" name={name} value={url ?? ''} />

      {url ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Hình vẽ câu hỏi"
            style={{
              maxWidth: '100%', maxHeight: 320,
              borderRadius: 8, border: '1px solid var(--border)',
              display: 'block',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 6,
                background: 'var(--bg)', border: '1px solid var(--border)',
                fontSize: 12, fontWeight: 600, color: 'var(--navy)', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Upload size={12} /> Đổi ảnh
            </button>
            <button
              type="button"
              onClick={remove}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 6,
                background: '#fff0f0', border: '1px solid #fca5a5',
                fontSize: 12, fontWeight: 600, color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <X size={12} /> Xóa ảnh
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => !uploading && inputRef.current?.click()}
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 10,
            padding: '28px 20px',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            background: 'var(--bg)',
            transition: 'border-color 0.15s',
          }}
        >
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Loader2 size={24} color="var(--blue)" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Đang upload...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <ImageIcon size={28} color="var(--text-muted)" />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>Kéo thả hoặc click để chọn ảnh</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>PNG, JPG, WEBP — tối đa 5MB</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
