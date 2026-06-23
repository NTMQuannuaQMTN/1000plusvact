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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const profile = await getProfile(user.id)
  if (profile?.role === 'admin') redirect('/admin')

  const displayName = profile?.full_name ?? user.email ?? 'Student'

  const subjects = [
    { icon: '📐', name: 'Mathematics',  progress: 68 },
    { icon: '📖', name: 'Literature',   progress: 42 },
    { icon: '🌍', name: 'English',      progress: 55 },
    { icon: '⚡', name: 'Physics',      progress: 30 },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar variant="app" userName={displayName} userRole={profile?.role} />

      <div style={{ display: 'flex', flex: 1, maxWidth: 1100, margin: '0 auto', width: '100%', padding: '32px 24px', gap: 28 }}>

        {/* Sidebar */}
        <aside style={{
          width: 220,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <a href="/dashboard" className="sidebar-link active">🏠 Home</a>
          <a href="#" className="sidebar-link">📚 My Courses</a>
          <a href="#" className="sidebar-link">🎯 Practice</a>
          <a href="#" className="sidebar-link">📊 Progress</a>
          <a href="#" className="sidebar-link">📝 Mock Exams</a>
          <a href="#" className="sidebar-link">🤖 AI Tutor</a>

          <div style={{ paddingTop: 24, borderTop: '1px solid var(--border)', marginTop: 32 }}>
            <a href="#" className="sidebar-link">⚙️ Settings</a>
            <form action={logout}>
              <button type="submit" className="sidebar-link" style={{ color: '#dc2626' }}>
                🚪 Log out
              </button>
            </form>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* Welcome */}
          <div style={{
            background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)',
            borderRadius: 16,
            padding: '32px 36px',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 6 }}>Welcome back 👋</p>
              <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
                {displayName}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                Target score: <strong style={{ color: 'var(--blue)' }}>{profile?.target_score ?? 1000}</strong>
                {profile?.school && <> · {profile.school}</>}
              </p>
            </div>
            <a href="#" className="btn-primary" style={{ fontSize: 14, padding: '10px 24px' }}>
              Continue learning →
            </a>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 16,
            marginBottom: 28,
          }}>
            {[
              { label: 'Questions done',    value: '124',   color: 'var(--blue)' },
              { label: 'Practice streak',   value: '7 days', color: '#16a34a' },
              { label: 'Avg. score',        value: '7.4 / 10', color: 'var(--navy)' },
              { label: 'Exams completed',   value: '3',     color: '#d97706' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: 'var(--white)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '20px',
                boxShadow: 'var(--card-shadow)',
              }}>
                <p style={{ fontSize: 22, fontWeight: 800, color, marginBottom: 4 }}>{value}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Subject progress */}
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '24px',
            boxShadow: 'var(--card-shadow)',
          }}>
            <h2 style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 17, marginBottom: 20 }}>
              Subject progress
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {subjects.map(({ icon, name, progress }) => (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                      {icon} {name}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{progress}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
