'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  const userId = data.user?.id
  if (!userId) {
    redirect('/signup?error=Signup+succeeded+but+no+user+returned')
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    full_name: fullName || null,
    role: 'student',
  })

  if (profileError) {
    redirect(`/signup?error=${encodeURIComponent(profileError.message)}`)
  }

  redirect('/dashboard')
}
