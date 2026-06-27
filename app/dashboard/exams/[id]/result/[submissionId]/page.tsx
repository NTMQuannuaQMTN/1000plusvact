import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Trophy, RotateCcw } from 'lucide-react'
import { ResultQuestionCard } from '../ResultQuestionCard'

type Params = Promise<{ id: string; submissionId: string }>

const PART_META: Record<string, { label: string; color: string; bg: string }> = {
  viet:      { label: 'Tiếng Việt',       color: '#2563eb', bg: '#eff6ff' },
  anh:       { label: 'Tiếng Anh',        color: '#16a34a', bg: '#f0fdf4' },
  toan:      { label: 'Toán',             color: '#d97706', bg: '#fffbeb' },
  khoa_hoc:  { label: 'Tư duy khoa học', color: '#7c3aed', bg: '#f5f3ff' },
}

function scoreLabel(pct: number) {
  if (pct >= 0.85) return { text: 'Xuất sắc',   color: '#16a34a' }
  if (pct >= 0.70) return { text: 'Khá tốt',    color: '#2563eb' }
  if (pct >= 0.50) return { text: 'Trung bình', color: '#d97706' }
  return                  { text: 'Cần cải thiện', color: '#dc2626' }
}

export default async function ResultPage({ params }: { params: Params }) {
  const { id: testId, submissionId } = await params
  const supabase = await createClient()

  const [{ data: submission }, { data: test }, { data: questionRows }] = await Promise.all([
    supabase.from('test_submissions').select('*').eq('id', submissionId).single(),
    supabase.from('tests').select('id, title, year').eq('id', testId).single(),
    supabase
      .from('test_questions')
      .select('order_num, questions!inner(id, content, option_a, option_b, option_c, option_d, answer, part, module, passage, image_url)')
      .eq('test_id', testId)
      .order('order_num'),
  ])

  if (!submission || !test) notFound()

  const answers = submission.answers as Record<string, string>
  const breakdown = submission.breakdown as Record<string, { correct: number; total: number }>
  const score = submission.score as number
  const total = submission.total as number
  const pct = total > 0 ? score / total : 0

  // Estimated ĐGNL score: each part is 300 pts max, 4 parts = 1200 total
  const estimatedScore = Object.values(breakdown).reduce((sum, { correct, total: t }) => {
    return sum + (t > 0 ? Math.round((correct / t) * 300) : 0)
  }, 0)

  const label = scoreLabel(pct)

  const questions = (questionRows ?? []).map(r => ({
    ...(r.questions as unknown as Record<string, unknown>),
    order_num: r.order_num,
  })) as Array<{
    id: string; content: string; passage: string | null; image_url: string | null
    option_a: string; option_b: string; option_c: string; option_d: string
    answer: string; part: string; module: string; order_num: number
  }>

  return (
    <div style={{ padding: '32px', maxWidth: 800, margin: '0 auto' }}>

      {/* Score banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, #2d4ab7 100%)',
        borderRadius: 16, padding: '32px', marginBottom: 28, color: '#fff',
        display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Trophy size={36} color="#fbbf24" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginBottom: 4 }}>{test.title}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 42, fontWeight: 900, lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>/ {total} câu đúng</span>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
              Điểm ước tính: <strong style={{ color: '#fbbf24', fontSize: 18 }}>{estimatedScore}</strong>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>/1200</span>
            </span>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
              background: label.color + '33', color: '#fff',
            }}>
              {label.text}
            </span>
          </div>
        </div>
        <a href={`/dashboard/exams/${testId}`} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '10px 18px', borderRadius: 10,
          background: 'rgba(255,255,255,0.15)', color: '#fff',
          fontSize: 13, fontWeight: 600, textDecoration: 'none', flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.25)',
        }}>
          <RotateCcw size={14} /> Làm lại
        </a>
      </div>

      {/* Part breakdown */}
      <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>Kết quả theo môn</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 32 }}>
        {Object.entries(PART_META).map(([part, meta]) => {
          const bd = breakdown[part] ?? { correct: 0, total: 0 }
          const partPct = bd.total > 0 ? bd.correct / bd.total : 0
          const partScore = Math.round(partPct * 300)
          const lbl = scoreLabel(partPct)
          return (
            <div key={part} style={{
              background: '#fff', border: '1px solid var(--border)', borderRadius: 14,
              padding: '18px 20px', boxShadow: 'var(--card-shadow)',
            }}>
              <div style={{
                display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                background: meta.bg, color: meta.color,
                fontSize: 11, fontWeight: 700, marginBottom: 12,
              }}>
                {meta.label}
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: meta.color, marginBottom: 2 }}>
                {bd.correct}
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>/{bd.total}</span>
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>~{partScore} điểm ĐGNL</p>
              <div style={{ background: '#e5e7eb', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 999,
                  width: `${Math.round(partPct * 100)}%`,
                  background: meta.color, transition: 'width 0.6s ease',
                }} />
              </div>
              <p style={{ fontSize: 11, color: lbl.color, fontWeight: 600, marginTop: 6 }}>
                {Math.round(partPct * 100)}% · {lbl.text}
              </p>
            </div>
          )
        })}
      </div>

      {/* Question review */}
      <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>
        Xem lại câu hỏi
        <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 10 }}>
          ({total - score} câu sai)
        </span>
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {questions.map((q, i) => {
          const studentAnswer = answers[q.id] ?? null
          const isCorrect = studentAnswer === q.answer
          const meta = PART_META[q.part]
          return (
            <ResultQuestionCard
              key={q.id}
              q={q}
              index={i}
              studentAnswer={studentAnswer}
              isCorrect={isCorrect}
              partColor={meta?.color ?? 'var(--text-muted)'}
              partBg={meta?.bg ?? '#f3f4f6'}
              partLabel={meta?.label ?? q.part}
            />
          )
        })}
      </div>

      <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center' }}>
        <a href="/dashboard/exams" style={{
          padding: '11px 28px', borderRadius: 10,
          background: 'var(--bg)', border: '1.5px solid var(--border)',
          fontSize: 14, fontWeight: 600, color: 'var(--navy)', textDecoration: 'none',
        }}>
          ← Danh sách đề
        </a>
        <a href={`/dashboard/exams/${testId}`} style={{
          padding: '11px 28px', borderRadius: 10,
          background: 'var(--navy)', color: '#fff',
          fontSize: 14, fontWeight: 700, textDecoration: 'none',
        }}>
          Làm lại đề này
        </a>
      </div>
    </div>
  )
}
