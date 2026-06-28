import { login } from './actions'

type Props = {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 16px',
    }}>
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, textDecoration: 'none' }}>
        <span style={{ background: 'var(--navy)', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 20, fontWeight: 900 }}>V</span>
        <span style={{ color: 'var(--navy)', fontWeight: 800, fontSize: 17 }}>1000plus VACT</span>
      </a>

      <div className="auth-card">
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>Chào mừng trở lại</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
          Đăng nhập để tiếp tục luyện thi của bạn
        </p>

        {error && (
          <div style={{
            background: '#fff0f0', border: '1px solid #fca5a5',
            borderRadius: 8, padding: '12px 14px', marginBottom: 20,
            color: '#b91c1c', fontSize: 14,
          }}>
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={login} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>
              Địa chỉ email
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="ban@email.com"
              className="form-input"
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>Mật khẩu</label>
              <a href="#" style={{ color: 'var(--blue)', fontSize: 13, fontWeight: 500 }}>Quên mật khẩu?</a>
            </div>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="form-input"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '13px', fontSize: 15, marginTop: 4, border: 'none', borderRadius: 8 }}
          >
            Đăng nhập
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: 14 }}>
          Chưa có tài khoản?{' '}
          <a href="/signup" style={{ color: 'var(--blue)', fontWeight: 600 }}>Đăng ký miễn phí</a>
        </p>
      </div>

      <p style={{ marginTop: 24, color: 'var(--text-muted)', fontSize: 12 }}>© 2026 1000plus VACT · Luyện thi AI</p>
    </div>
  )
}
