import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { saveQuestion } from '../../actions'
import { QuestionForm } from '../../QuestionForm'

type Props = { params: Promise<{ id: string }> }

export default async function EditQuestionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: question } = await supabase.from('questions').select('*').eq('id', id).single()
  if (!question) notFound()

  return (
    <div style={{ padding: '32px', maxWidth: 720 }}>
      <div style={{ marginBottom: 24 }}>
        <a href="/admin/questions" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Ngân hàng câu hỏi
        </a>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginTop: 8 }}>Chỉnh sửa câu hỏi</h1>
      </div>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '28px', boxShadow: 'var(--card-shadow)' }}>
        <QuestionForm question={question} action={saveQuestion} />
      </div>
    </div>
  )
}
