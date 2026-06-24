'use client'

import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, ClipboardList,
  Users, BarChart2, LogOut,
} from 'lucide-react'

type Props = {
  userName: string
  userEmail: string
  onLogout: () => Promise<void>
}

const navItems = [
  { href: '/admin',           icon: LayoutDashboard, label: 'Tổng quan',    exact: true  },
  { href: '/admin/questions', icon: BookOpen,         label: 'Ngân hàng câu hỏi', exact: false },
  { href: '/admin/tests',     icon: ClipboardList,    label: 'Đề thi',       exact: false },
  { href: '/admin/students',  icon: Users,            label: 'Học sinh',     exact: false },
  { href: '/admin/stats',     icon: BarChart2,        label: 'Thống kê',     exact: false },
]

export function AdminSidebar({ userName, userEmail, onLogout }: Props) {
  const pathname = usePathname()

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

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
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginLeft: 2 }}>Admin</span>
        </a>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {navItems.map(({ href, icon: Icon, label, exact }) => {
          const active = isActive(href, exact)
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
                fontWeight: active ? 600 : 500,
                color: active ? 'var(--navy)' : 'var(--text-muted)',
                background: active ? 'var(--blue-light)' : 'transparent',
                borderLeft: `3px solid ${active ? 'var(--blue)' : 'transparent'}`,
                textDecoration: 'none',
                transition: 'background 0.12s, color 0.12s',
              }}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 2} />
              {label}
            </a>
          )
        })}
      </nav>

      {/* User + logout */}
      <div style={{ padding: '10px 12px 16px', borderTop: '1px solid var(--border)' }}>
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
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail}
              </p>
            </div>
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
