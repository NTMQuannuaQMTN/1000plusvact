'use client'

import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Target,
  TrendingUp,
  ClipboardList,
  BrainCircuit,
  Settings,
  LogOut,
} from 'lucide-react'

type Props = {
  userName: string
  onLogout: () => Promise<void>
}

const navItems = [
  { href: '/dashboard',          icon: LayoutDashboard, label: 'Tổng quan',   exact: true },
  { href: '/dashboard/ai-tutor', icon: BrainCircuit,    label: 'AI Gia sư',   exact: false },
  { href: '/dashboard/practice', icon: Target,          label: 'Luyện tập',   exact: false },
  { href: '/dashboard/exams',    icon: ClipboardList,   label: 'Đề thi thử',  exact: false },
  { href: '/dashboard/progress', icon: TrendingUp,      label: 'Tiến độ',     exact: false },
]

export function DashboardSidebar({ userName, onLogout }: Props) {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 240,
      height: '100vh',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
      background: '#fff',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '2px 0 8px rgba(27,52,128,0.04)',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 18px', borderBottom: '1px solid var(--border)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{
            background: 'var(--navy)',
            color: '#fff',
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: 17,
            fontWeight: 900,
            lineHeight: 1.4,
          }}>V</span>
          <span style={{ color: 'var(--navy)', fontWeight: 800, fontSize: 19, letterSpacing: '-0.3px' }}>VACT</span>
        </a>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {navItems.map(({ href, icon: Icon, label, exact }) => {
          const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
          return (
            <a
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--navy)' : 'var(--text-muted)',
                background: isActive ? 'var(--blue-light)' : 'transparent',
                borderLeft: `3px solid ${isActive ? 'var(--blue)' : 'transparent'}`,
                textDecoration: 'none',
                transition: 'background 0.12s, color 0.12s',
              }}
            >
              <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </a>
          )
        })}
      </nav>

      {/* Bottom: settings + user + logout */}
      <div style={{ padding: '10px 12px 16px', borderTop: '1px solid var(--border)' }}>
        <a
          href="/dashboard/settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: pathname.startsWith('/dashboard/settings') ? 600 : 500,
            color: pathname.startsWith('/dashboard/settings') ? 'var(--navy)' : 'var(--text-muted)',
            background: pathname.startsWith('/dashboard/settings') ? 'var(--blue-light)' : 'transparent',
            borderLeft: `3px solid ${pathname.startsWith('/dashboard/settings') ? 'var(--blue)' : 'transparent'}`,
            textDecoration: 'none',
            marginBottom: 8,
          }}
        >
          <Settings size={17} strokeWidth={pathname.startsWith('/dashboard/settings') ? 2.5 : 2} />
          Cài đặt
        </a>

        {/* User card */}
        <div style={{
          background: 'var(--bg)',
          borderRadius: 10,
          padding: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--navy)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, flexShrink: 0,
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <span style={{
              fontSize: 13, fontWeight: 600, color: 'var(--text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {userName}
            </span>
          </div>
          <form action={onLogout} style={{ margin: 0 }}>
            <button type="submit" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '7px 10px',
              borderRadius: 6, border: 'none',
              background: 'transparent', cursor: 'pointer',
              fontSize: 13, fontWeight: 500,
              color: '#dc2626', fontFamily: 'inherit',
              textAlign: 'left' as const,
            }}>
              <LogOut size={15} />
              Đăng xuất
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
