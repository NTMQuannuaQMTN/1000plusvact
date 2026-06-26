import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TestClient } from './TestClient'

type Params = Promise<{ id: string }>

export default async function ExamPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: test }, { data: rows }] = await Promise.all([
    supabase.from('tests').select('id, title, year').eq('id', id).single(),
    supabase
      .from('test_questions')
      .select(`
        order_num,
        questions!inner(
          id, content, passage, image_url, image_description,
          option_a, option_b, option_c, option_d,
          part, module
        )
      `)
      .eq('test_id', id)
      .order('order_num'),
  ])

  if (!test) notFound()

  const questions = (rows ?? []).map(r => ({
    ...(r.questions as unknown as Record<string, unknown>),
    order_num: r.order_num,
  }))

  return <TestClient test={test} questions={questions as Parameters<typeof TestClient>[0]['questions']} />
}
