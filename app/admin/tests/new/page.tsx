import { saveTest } from '../actions'

export default function NewTestPage() {
  return (
    <div style={{ padding: '32px', maxWidth: 640 }}>
      <div style={{ marginBottom: 24 }}>
        <a href="/admin/tests" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Đề thi
        </a>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginTop: 8 }}>Tạo đề thi mới</h1>
      </div>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '28px', boxShadow: 'var(--card-shadow)' }}>
        <form action={saveTest} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Tên đề thi *</label>
            <input name="title" required className="form-input" style={{ fontSize: 14 }} placeholder="Đề thi ĐGNL 2025 - Đợt 1" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Năm</label>
            <input name="year" type="number" min={2020} max={2030} className="form-input" style={{ fontSize: 14 }} placeholder="2025" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Mô tả (tuỳ chọn)</label>
            <textarea name="description" rows={3} className="form-input" style={{ fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Mô tả ngắn về đề thi..." />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
            <a href="/admin/tests" style={{
              padding: '10px 24px', borderRadius: 8,
              border: '1.5px solid var(--border)', fontSize: 14, fontWeight: 600,
              color: 'var(--navy)', textDecoration: 'none',
            }}>
              Hủy
            </a>
            <button type="submit" className="btn-primary" style={{ padding: '10px 28px', fontSize: 14, border: 'none', borderRadius: 8 }}>
              Tạo đề thi
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
