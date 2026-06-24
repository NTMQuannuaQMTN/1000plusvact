import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/getProfile'
import { updateProfile } from './actions'
import { User, Trophy, Mail } from 'lucide-react'
import TargetScoreSelector from "@/components/TargetScoreSelector"
import { Toast } from '@/components/Toast'

type Props = {
  searchParams: Promise<{ saved?: string; error?: string }>
}


export default async function SettingsPage({ searchParams }: Props) {
  const { saved, error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const profile = await getProfile(user!.id)

  return (
    <div style={{ padding: '32px', maxWidth: 720, margin: '0 auto' }}>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>Cài đặt</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Quản lý thông tin cá nhân và mục tiêu học tập</p>
      </div>

      <Toast message="Đã lưu thay đổi thành công!" show={!!saved} />
      {error && (
        <div style={{
          background: '#fff0f0', border: '1px solid #fca5a5',
          borderRadius: 10, padding: '12px 16px', marginBottom: 24,
          color: '#b91c1c', fontSize: 14,
        }}>
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Personal info */}
        <section style={{
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 14, padding: '24px', boxShadow: 'var(--card-shadow)',
        }}>
          <h2 style={{
            fontSize: 15, fontWeight: 700, color: 'var(--navy)',
            marginBottom: 20, paddingBottom: 14,
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <User size={17} /> Thông tin cá nhân
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>
                Họ và tên
              </label>
              <input
                name="full_name"
                type="text"
                defaultValue={profile?.full_name ?? ''}
                placeholder="Nguyễn Văn A"
                className="form-input"
                style={{ fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>
                Trường học
              </label>
              <input
                name="school"
                type="text"
                defaultValue={profile?.school ?? ''}
                placeholder="Phổ Thông Năng Khiếu"
                className="form-input"
                style={{ fontSize: 14 }}
              />
            </div>
          </div>
        </section>

        {/* Target score */}
        <section style={{
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 14, padding: '24px', boxShadow: 'var(--card-shadow)',
        }}>
          <h2 style={{
            fontSize: 15, fontWeight: 700, color: 'var(--navy)',
            marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Trophy size={17} /> Điểm mục tiêu
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
            Điểm ĐGNL dao động từ 0 đến 1200 (mỗi môn tối đa 300 điểm)
          </p>

          <TargetScoreSelector
            defaultValue={profile?.target_score ?? 1000}
          />

          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
            💡 Mục tiêu 1000+ điểm thường đủ điều kiện vào các trường đại học top tại TP.HCM.
          </p>
        </section>

        {/* Account info (read-only) */}
        <section style={{
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 14, padding: '24px', boxShadow: 'var(--card-shadow)',
        }}>
          <h2 style={{
            fontSize: 15, fontWeight: 700, color: 'var(--navy)',
            marginBottom: 20, paddingBottom: 14,
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Mail size={17} /> Tài khoản
          </h2>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>
              Địa chỉ email
            </label>
            <input
              type="email"
              value={user!.email ?? ''}
              disabled
              readOnly
              className="form-input"
              style={{ fontSize: 14, background: 'var(--bg)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
            />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              Email không thể thay đổi sau khi đăng ký.
            </p>
          </div>
        </section>

        {/* Save */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <a href="/dashboard" className="btn-outline-navy" style={{ fontSize: 14, padding: '10px 24px' }}>
            Hủy
          </a>
          <button
            type="submit"
            className="btn-primary"
            style={{ fontSize: 14, padding: '10px 28px', border: 'none', borderRadius: 8 }}
          >
            Lưu thay đổi
          </button>
        </div>

      </form>
    </div>
  )
}
