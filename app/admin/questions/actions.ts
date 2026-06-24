'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function deleteQuestion(formData: FormData) {
  const id = formData.get('id') as string
  const supabase = await createClient()
  await supabase.from('questions').delete().eq('id', id)
  revalidatePath('/admin/questions')
}

export async function saveQuestion(formData: FormData) {
  const id = formData.get('id') as string | null
  const supabase = await createClient()

  const payload = {
    part:        formData.get('part') as string,
    module:      formData.get('module') as string,
    passage:           (formData.get('passage') as string)?.trim() || null,
    image_url:         (formData.get('image_url') as string)?.trim() || null,
    image_description: (formData.get('image_description') as string)?.trim() || null,
    content:     (formData.get('content') as string).trim(),
    option_a:    (formData.get('option_a') as string).trim(),
    option_b:    (formData.get('option_b') as string).trim(),
    option_c:    (formData.get('option_c') as string).trim(),
    option_d:    (formData.get('option_d') as string).trim(),
    answer:      formData.get('answer') as string,
    explanation: (formData.get('explanation') as string)?.trim() || null,
    difficulty:  formData.get('difficulty') as string,
    source:      (formData.get('source') as string)?.trim() || null,
    updated_at:  new Date().toISOString(),
  }

  if (id) {
    await supabase.from('questions').update(payload).eq('id', id)
  } else {
    await supabase.from('questions').insert(payload)
  }

  revalidatePath('/admin/questions')
  redirect('/admin/questions')
}
