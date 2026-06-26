'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function submitTest(testId: string, answers: Record<string, string>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Fetch correct answers server-side — never sent to client
  const { data: rows } = await supabase
    .from('test_questions')
    .select('question_id, questions!inner(id, answer, part, module)')
    .eq('test_id', testId)

  if (!rows?.length) throw new Error('No questions')

  let score = 0
  type PartBreakdown = { correct: number; total: number; modules: Record<string, { correct: number; total: number }> }
  const breakdown: Record<string, PartBreakdown> = {}

  for (const row of rows) {
    const q = row.questions as unknown as { id: string; answer: string; part: string; module: string }
    if (!breakdown[q.part]) breakdown[q.part] = { correct: 0, total: 0, modules: {} }
    breakdown[q.part].total++
    if (!breakdown[q.part].modules[q.module]) breakdown[q.part].modules[q.module] = { correct: 0, total: 0 }
    breakdown[q.part].modules[q.module].total++
    if (answers[q.id] === q.answer) {
      score++
      breakdown[q.part].correct++
      breakdown[q.part].modules[q.module].correct++
    }
  }

  const { data: submission, error } = await supabase
    .from('test_submissions')
    .insert({
      test_id:   testId,
      user_id:   user.id,
      answers,
      score,
      total:     rows.length,
      breakdown,
    })
    .select('id')
    .single()

  if (error || !submission) throw new Error('Failed to save submission')

  redirect(`/dashboard/exams/${testId}/result/${submission.id}`)
}
