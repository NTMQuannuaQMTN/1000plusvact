import { ImportClient } from './ImportClient'

export default function ImportPage() {
  return (
    <div style={{ padding: '32px', maxWidth: 820 }}>
      <div style={{ marginBottom: 24 }}>
        <a href="/admin/questions" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Ngân hàng câu hỏi
        </a>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginTop: 8 }}>Import câu hỏi từ PDF</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Upload đề thi PDF — AI sẽ tự động trích xuất và phân loại tất cả câu hỏi trắc nghiệm.
        </p>
      </div>
      <ImportClient />
    </div>
  )
}
