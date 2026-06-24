import { signup } from './actions'

type Props = {
  searchParams: Promise<{ error?: string }>
}

export default async function SignupPage({ searchParams }: Props) {
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
        <span style={{ color: 'var(--navy)', fontWeight: 800, fontSize: 22 }}>VACT</span>
      </a>

      <div className="auth-card">
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>Tạo tài khoản</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
          Tham gia cùng hàng nghìn học sinh đang luyện thi với VACT
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

        <form action={signup} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>
              Họ và tên
            </label>
            <input
              name="full_name"
              type="text"
              autoComplete="name"
              placeholder="Nguyễn Văn A"
              className="form-input"
            />
          </div>

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
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>
              Mật khẩu
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, fontSize: 12 }}>
                (tối thiểu 6 ký tự)
              </span>
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="••••••••"
              className="form-input"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '13px', fontSize: 15, marginTop: 4, border: 'none', borderRadius: 8 }}
          >
            Tạo tài khoản miễn phí
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
          Khi đăng ký, bạn đồng ý với Điều khoản dịch vụ của VACT.
        </p>
        <p style={{ textAlign: 'center', marginTop: 12, color: 'var(--text-muted)', fontSize: 14 }}>
          Đã có tài khoản?{' '}
          <a href="/login" style={{ color: 'var(--blue)', fontWeight: 600 }}>Đăng nhập</a>
        </p>
      </div>

      <p style={{ marginTop: 24, color: 'var(--text-muted)', fontSize: 12 }}>© 2026 VACT · Luyện thi AI</p>
    </div>
  )
}
