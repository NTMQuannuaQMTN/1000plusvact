import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/getProfile'
import { Navbar } from '@/components/Navbar'

async function logout() {
  'use server'
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  await supabase.auth.signOut()
  const { redirect } = await import('next/navigation')
  redirect('/')
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const profile = await getProfile(user.id)
  if (profile?.role !== 'admin') redirect('/dashboard')

  const displayName = profile?.full_name ?? user.email ?? 'Admin'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar variant="app" userName={displayName} userRole="admin" />

      <div style={{ display: 'flex', flex: 1, maxWidth: 1100, margin: '0 auto', width: '100%', padding: '32px 24px', gap: 28 }}>

        {/* Sidebar */}
        <aside style={{
          width: 220,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <a href="/admin" className="sidebar-link active">🏠 Overview</a>
          <a href="#" className="sidebar-link">👥 Students</a>
          <a href="#" className="sidebar-link">📚 Questions</a>
          <a href="#" className="sidebar-link">📝 Exams</a>
          <a href="#" className="sidebar-link">📊 Analytics</a>
          <a href="#" className="sidebar-link">⚙️ Settings</a>

          <div style={{ borderTop: '1px solid var(--border)', marginTop: 32, paddingTop: 24 }}>
            <form action={logout}>
              <button type="submit" className="sidebar-link" style={{ color: '#dc2626' }}>
                🚪 Log out
              </button>
            </form>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #0f1e4d 0%, var(--navy) 100%)',
            borderRadius: 16,
            padding: '32px 36px',
            marginBottom: 28,
          }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 6 }}>Admin dashboard</p>
            <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
              {displayName}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{user.email}</p>
          </div>

          {/* Platform stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 16,
            marginBottom: 28,
          }}>
            {[
              { label: 'Total students',   value: '10,482', icon: '👥', color: 'var(--blue)' },
              { label: 'Active this week', value: '3,241',  icon: '📈', color: '#16a34a' },
              { label: 'Questions in DB',  value: '512',    icon: '📚', color: 'var(--navy)' },
              { label: 'Exams taken',      value: '8,910',  icon: '📝', color: '#d97706' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} style={{
                background: 'var(--white)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '20px',
                boxShadow: 'var(--card-shadow)',
              }}>
                <p style={{ fontSize: 22, marginBottom: 4 }}>{icon}</p>
                <p style={{ fontSize: 24, fontWeight: 800, color, marginBottom: 4 }}>{value}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '24px',
            boxShadow: 'var(--card-shadow)',
          }}>
            <h2 style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 17, marginBottom: 20 }}>
              Quick actions
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
              {[
                { label: 'Add question',   icon: '➕' },
                { label: 'Create exam',    icon: '📋' },
                { label: 'View students',  icon: '👤' },
                { label: 'Export reports', icon: '📤' },
              ].map(({ label, icon }) => (
                <button key={label} style={{
                  background: 'var(--bg)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 10,
                  padding: '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--navy)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'border-color 0.15s',
                }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
