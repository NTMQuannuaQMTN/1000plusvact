import { saveQuestion } from '../actions'
import { QuestionForm } from '../QuestionForm'

export default function NewQuestionPage() {
  return (
    <div style={{ padding: '32px', maxWidth: 720 }}>
      <div style={{ marginBottom: 24 }}>
        <a href="/admin/questions" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Ngân hàng câu hỏi
        </a>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginTop: 8 }}>Thêm câu hỏi mới</h1>
      </div>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '28px', boxShadow: 'var(--card-shadow)' }}>
        <QuestionForm action={saveQuestion} />
      </div>
    </div>
  )
}
