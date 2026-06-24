'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(formData: FormData) {
  console.log('updateProfile called with formData:', formData);
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const fullName   = (formData.get('full_name') as string).trim()
  const school     = (formData.get('school') as string).trim()
  const rawScore   = parseInt(formData.get('target_score') as string, 10)
  const targetScore = Math.min(1200, Math.max(0, isNaN(rawScore) ? 1000 : rawScore))

  await supabase.from('profiles').update({
    full_name:    fullName   || null,
    school:       school     || null,
    target_score: targetScore,
    updated_at:   new Date().toISOString(),
  }).eq('id', user.id)

  redirect('/dashboard/settings?saved=1')
}
