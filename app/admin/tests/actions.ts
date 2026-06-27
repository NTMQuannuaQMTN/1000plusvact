'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addQuestionToTest(formData: FormData) {
  const testId = formData.get('test_id') as string
  const questionId = formData.get('question_id') as string
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('test_questions')
    .select('order_num')
    .eq('test_id', testId)
    .order('order_num', { ascending: false })
    .limit(1)

  await supabase.from('test_questions').insert({
    test_id: testId,
    question_id: questionId,
    order_num: (existing?.[0]?.order_num ?? 0) + 1,
  })

  revalidatePath(`/admin/tests/${testId}/edit`)
}

export async function removeQuestionFromTest(formData: FormData) {
  const testId = formData.get('test_id') as string
  const questionId = formData.get('question_id') as string
  const supabase = await createClient()

  await supabase.from('test_questions')
    .delete()
    .eq('test_id', testId)
    .eq('question_id', questionId)

  revalidatePath(`/admin/tests/${testId}/edit`)
}

export async function deleteTest(formData: FormData) {
  const id = formData.get('id') as string
  const supabase = await createClient()
  await supabase.from('tests').delete().eq('id', id)
  revalidatePath('/admin/tests')
}

export async function saveTest(formData: FormData) {
  const id = formData.get('id') as string | null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const payload = {
    title:       (formData.get('title') as string).trim(),
    description: (formData.get('description') as string)?.trim() || null,
    year:        parseInt(formData.get('year') as string, 10) || null,
    created_by:  user?.id ?? null,
    updated_at:  new Date().toISOString(),
  }

  if (id) {
    await supabase.from('tests').update(payload).eq('id', id)
    revalidatePath(`/admin/tests/${id}/edit`)
    revalidatePath('/admin/tests')
    redirect(`/admin/tests/${id}/edit`)
  } else {
    const { data: created } = await supabase.from('tests').insert(payload).select('id').single()
    revalidatePath('/admin/tests')
    redirect(created?.id ? `/admin/tests/${created.id}/edit` : '/admin/tests')
  }
}
