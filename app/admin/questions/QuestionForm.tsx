'use client'

import { useState } from 'react'
import { PARTS } from '@/lib/exam/parts'
import { ImageUpload } from '@/components/ImageUpload'

type Question = {
  id?: string
  part?: string
  module?: string
  passage?: string | null
  image_description?: string | null
  image_url?: string | null
  content?: string
  option_a?: string
  option_b?: string
  option_c?: string
  option_d?: string
  answer?: string
  explanation?: string
  difficulty?: string
  source?: string
}

type Props = {
  question?: Question
  action: (formData: FormData) => Promise<void>
}

const OPTIONS = ['A', 'B', 'C', 'D'] as const

export function QuestionForm({ question, action }: Props) {
  const [part, setPart] = useState(question?.part ?? 'viet')
  const modules = PARTS[part as keyof typeof PARTS]?.modules ?? {}

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {question?.id && <input type="hidden" name="id" value={question.id} />}

      {/* Part + Module */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Môn học *</label>
          <select
            name="part"
            value={part}
            onChange={e => setPart(e.target.value)}
            className="form-input"
            style={{ fontSize: 14 }}
          >
            {Object.entries(PARTS).map(([k, { label }]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Chủ đề *</label>
          <select
            name="module"
            defaultValue={question?.module}
            className="form-input"
            style={{ fontSize: 14 }}
          >
            {Object.entries(modules).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Passage */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
          Ngữ liệu / Đoạn văn <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(tuỳ chọn — dùng khi câu hỏi có đoạn đọc hiểu)</span>
        </label>
        <textarea
          name="passage"
          defaultValue={question?.passage ?? ''}
          rows={5}
          className="form-input"
          style={{ fontSize: 13, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
          placeholder="Dán đoạn văn/ngữ liệu vào đây nếu có..."
        />
      </div>

      {/* Image */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
          Hình vẽ / Sơ đồ <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(tuỳ chọn)</span>
        </label>
        <ImageUpload
          currentUrl={question?.image_url}
          questionId={question?.id}
          name="image_url"
        />
      </div>

      {/* Image description (fallback / accessibility) */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
          Mô tả hình vẽ bằng văn bản <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(dùng làm fallback khi không có ảnh)</span>
        </label>
        <textarea
          name="image_description"
          defaultValue={question?.image_description ?? ''}
          rows={2}
          className="form-input"
          style={{ fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }}
          placeholder="Ví dụ: Hình chữ nhật ABCD với hai đường chéo cắt nhau tại E và F..."
        />
      </div>

      {/* Content */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Câu hỏi *</label>
        <textarea
          name="content"
          defaultValue={question?.content ?? ''}
          required
          rows={4}
          className="form-input"
          style={{ fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }}
          placeholder="Nhập nội dung câu hỏi..."
        />
      </div>

      {/* Options */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Đáp án *</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {OPTIONS.map(letter => (
            <div key={letter} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--blue-light)', color: 'var(--navy)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13, flexShrink: 0,
              }}>{letter}</span>
              <input
                name={`option_${letter.toLowerCase()}`}
                defaultValue={question?.[`option_${letter.toLowerCase()}` as keyof Question] ?? ''}
                required
                className="form-input"
                style={{ flex: 1, fontSize: 14 }}
                placeholder={`Lựa chọn ${letter}...`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Correct answer + difficulty */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Đáp án đúng *</label>
          <select name="answer" defaultValue={question?.answer ?? 'A'} className="form-input" style={{ fontSize: 14 }}>
            {OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Độ khó</label>
          <select name="difficulty" defaultValue={question?.difficulty ?? 'medium'} className="form-input" style={{ fontSize: 14 }}>
            <option value="easy">Dễ</option>
            <option value="medium">Trung bình</option>
            <option value="hard">Khó</option>
          </select>
        </div>
      </div>

      {/* Explanation */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Giải thích (tuỳ chọn)</label>
        <textarea
          name="explanation"
          defaultValue={question?.explanation ?? ''}
          rows={3}
          className="form-input"
          style={{ fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }}
          placeholder="Giải thích đáp án..."
        />
      </div>

      {/* Source */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Nguồn (tuỳ chọn)</label>
        <input
          name="source"
          defaultValue={question?.source ?? ''}
          className="form-input"
          style={{ fontSize: 14 }}
          placeholder="Đề ĐGNL 2024..."
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
        <a href="/admin/questions" style={{
          padding: '10px 24px', borderRadius: 8,
          border: '1.5px solid var(--border)', fontSize: 14, fontWeight: 600,
          color: 'var(--navy)', textDecoration: 'none',
        }}>
          Hủy
        </a>
        <button type="submit" className="btn-primary" style={{ padding: '10px 28px', fontSize: 14, border: 'none', borderRadius: 8 }}>
          Lưu câu hỏi
        </button>
      </div>
    </form>
  )
}
