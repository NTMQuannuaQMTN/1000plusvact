import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/getProfile'
import { Navbar } from '@/components/Navbar'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const profile = await getProfile(user.id)
    if (profile?.role === 'admin') redirect('/admin')
    redirect('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar variant="landing" />

      {/* ── Hero ── */}
      <section style={{
        background: '#fff',
        padding: '80px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 64,
        flexWrap: 'wrap',
      }}>
        <div style={{ maxWidth: 540 }}>
          <p style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 13, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>
            Nền tảng luyện thi AI
          </p>
          <h1 style={{
            fontSize: 'clamp(36px, 5vw, 54px)',
            fontWeight: 800,
            color: 'var(--navy)',
            lineHeight: 1.15,
            marginBottom: 20,
            letterSpacing: '-1px',
          }}>
            Học thông minh hơn.<br />
            Điểm cao hơn.
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
            VACT giúp học sinh Việt Nam luyện thi ĐGNL với bài tập AI cá nhân hóa,
            phân tích chi tiết và lộ trình học thích ứng.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <a href="/signup" className="btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
              Bắt đầu miễn phí →
            </a>
            <a href="/login" className="btn-outline-navy" style={{ fontSize: 16, padding: '14px 32px' }}>
              Đăng nhập
            </a>
          </div>
        </div>

        {/* Illustration */}
        <div style={{
          width: 340, height: 300,
          background: 'var(--blue-light)',
          borderRadius: 24,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 16, flexShrink: 0,
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 60 }}>📚</div>
          <div style={{ textAlign: 'center', padding: '0 24px' }}>
            <p style={{ color: 'var(--navy)', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
              4 môn thi · Điểm 0–1200 · AI Gia sư
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Chuẩn bị toàn diện cho kỳ thi ĐGNL & THPTQG
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      {/* <section style={{ background: 'var(--navy)', padding: '48px 32px' }}>
        <div style={{
          maxWidth: 860, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        }}>
          {[
            { num: '10.000+', label: 'Học sinh đang học' },
            { num: '500+',    label: 'Câu hỏi luyện tập' },
            { num: '4',       label: 'Môn thi chính'     },
            { num: '95%',     label: 'Học sinh hài lòng' },
          ].map(({ num, label }) => (
            <div key={label} style={{ textAlign: 'center', padding: '16px 24px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--blue)', lineHeight: 1.1, marginBottom: 6 }}>{num}</p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{label}</p>
            </div>
          ))}
        </div>
      </section> */}

      {/* ── Subjects ── */}
      <section id="courses" style={{ background: 'var(--bg)', padding: '80px 32px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <p style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 12, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
            4 môn thi ĐGNL
          </p>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>
            Chọn môn học của bạn
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 48 }}>
            Mỗi môn 300 điểm · Tổng tối đa 1200 điểm
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 20 }}>
            {[
              { icon: '📝', name: 'Tiếng Việt',       desc: 'Đọc hiểu · Nghị luận · Văn học',    color: '#eff6ff', accent: '#2563eb' },
              { icon: '🌍', name: 'Tiếng Anh',         desc: 'Ngữ pháp · Đọc hiểu · Viết',       color: '#f0fdf4', accent: '#16a34a' },
              { icon: '📐', name: 'Toán',              desc: 'Đại số · Giải tích · Hình học',     color: '#fffbeb', accent: '#d97706' },
              { icon: '🔬', name: 'Tư duy khoa học',  desc: 'Vật lý · Hóa học · Sinh học',       color: '#f5f3ff', accent: '#7c3aed' },
            ].map(({ icon, name, desc, color, accent }) => (
              <a key={name} href="/signup" className="subject-card" style={{ borderTop: `3px solid ${accent}` }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, marginBottom: 14,
                }}>{icon}</div>
                <h3 style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 15, marginBottom: 4 }}>{name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>{desc}</p>
                <p style={{ color: accent, fontWeight: 700, fontSize: 13, marginTop: 12 }}>0 – 300 điểm</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="practice" style={{ background: '#fff', padding: '80px 32px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 12, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
            Quy trình đơn giản
          </p>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--navy)', marginBottom: 48 }}>
            VACT hoạt động như thế nào?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
            {[
              { step: '01', icon: '✍️', title: 'Tạo tài khoản',  body: 'Đăng ký miễn phí và chọn trường mục tiêu cùng điểm số mong muốn.' },
              { step: '02', icon: '🎯', title: 'Luyện tập hàng ngày', body: 'AI chọn câu hỏi phù hợp với điểm yếu và mục tiêu của bạn.' },
              { step: '03', icon: '📈', title: 'Theo dõi tiến độ', body: 'Xem xu hướng điểm số và điểm dự đoán cập nhật theo thời gian thực.' },
            ].map(({ step, icon, title, body }) => (
              <div key={step}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'var(--blue-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, margin: '0 auto 16px',
                  border: '2px solid var(--blue)',
                }}>{icon}</div>
                <p style={{ color: 'var(--blue)', fontSize: 12, fontWeight: 700, letterSpacing: '1px', marginBottom: 6 }}>BƯỚC {step}</p>
                <h3 style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 17, marginBottom: 10 }}>{title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)',
        padding: '72px 32px',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 14, letterSpacing: '-0.5px' }}>
          Sẵn sàng chinh phục kỳ thi?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 17, marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
          Hàng nghìn học sinh đang luyện thi cùng VACT. Hoàn toàn miễn phí để bắt đầu.
        </p>
        <a href="/signup" className="btn-primary" style={{ fontSize: 16, padding: '14px 40px' }}>
          Bắt đầu ngay hôm nay
        </a>
      </section>

      {/* ── Footer ── */}
      <footer id="about" style={{ background: '#0f1e4d', padding: '48px 32px 32px', marginTop: 'auto' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ background: 'var(--blue)', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 18, fontWeight: 900 }}>V</span>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>VACT</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.6 }}>
                Nền tảng luyện thi AI dành cho học sinh Việt Nam.
              </p>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: 14, fontSize: 13 }}>HỌC TẬP</h4>
              {['Khóa học', 'Luyện tập', 'Đề thi thử', 'AI Gia sư'].map(l => (
                <p key={l} style={{ marginBottom: 8 }}>
                  <a href="/signup" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{l}</a>
                </p>
              ))}
            </div>
            <div>
              <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: 14, fontSize: 13 }}>TÀI KHOẢN</h4>
              {['Đăng nhập', 'Đăng ký', 'Bảng điều khiển', 'Cài đặt'].map(l => (
                <p key={l} style={{ marginBottom: 8 }}>
                  <a href="/login" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{l}</a>
                </p>
              ))}
            </div>
          </div>
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: 24,
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 12,
          }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>© 2026 VACT. Bảo lưu mọi quyền.</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Luyện thi ĐGNL & THPTQG thông minh hơn.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
