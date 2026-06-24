'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
  } else {
    await supabase.from('tests').insert(payload)
  }

  revalidatePath('/admin/tests')
  redirect('/admin/tests')
}
