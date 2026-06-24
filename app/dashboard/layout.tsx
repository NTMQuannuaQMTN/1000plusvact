import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/getProfile'
import { DashboardSidebar } from '@/components/DashboardSidebar'

async function logout() {
  'use server'
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  await supabase.auth.signOut()
  const { redirect } = await import('next/navigation')
  redirect('/')
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const profile = await getProfile(user.id)
  if (profile?.role === 'admin') redirect('/admin')

  const displayName = profile?.full_name ?? user.email?.split('@')[0] ?? 'Học sinh'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <DashboardSidebar userName={displayName} onLogout={logout} />
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
