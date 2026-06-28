type NavbarProps = {
  variant?: 'landing' | 'app'
  userName?: string
  userRole?: string
}

export function Navbar({ variant = 'landing', userName, userRole }: NavbarProps) {
  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--navy)',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      padding: '0 32px',
      gap: 32,
      boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    }}>
      <a href="/" style={{
        color: '#fff',
        fontWeight: 800,
        fontSize: 22,
        letterSpacing: '-0.5px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        textDecoration: 'none',
      }}>
        <span style={{
          background: 'var(--blue)',
          color: '#fff',
          borderRadius: 6,
          padding: '2px 8px',
          fontSize: 18,
          fontWeight: 900,
        }}>V</span>
        <span style={{ fontWeight: 800, fontSize: 16 }}>1000plus VACT</span>
      </a>

      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {variant === 'landing' && (
          <>
            <a href="#courses"  className="nav-link">Khóa học</a>
            <a href="#practice" className="nav-link">Luyện tập</a>
            <a href="#about"    className="nav-link">Giới thiệu</a>
          </>
        )}
        {variant === 'app' && (
          <>
            <a href="/dashboard"          className="nav-link">Trang chủ</a>
            <a href="/dashboard/courses"  className="nav-link">Khóa học</a>
            <a href="/dashboard/practice" className="nav-link">Luyện tập</a>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {variant === 'landing' && (
          <>
            <a href="/login"  className="btn-outline"  style={{ fontSize: 14, padding: '8px 20px' }}>Đăng nhập</a>
            <a href="/signup" className="btn-primary"  style={{ fontSize: 14, padding: '8px 20px' }}>Đăng ký</a>
          </>
        )}
        {variant === 'app' && userName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff', fontSize: 14 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 15, flexShrink: 0,
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <span style={{ opacity: 0.9 }}>{userName}</span>
            {userRole === 'admin' && (
              <span style={{
                background: 'rgba(41,171,226,0.25)',
                color: 'var(--blue)',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase' as const,
              }}>Admin</span>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
