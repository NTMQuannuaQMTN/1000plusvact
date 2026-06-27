import { createClient } from '@/lib/supabase/server'

export type Profile = {
  id: string
  full_name: string | null
  school: string | null
  role: string
  target_score: number | null
  created_at: string
  updated_at: string | null
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}
