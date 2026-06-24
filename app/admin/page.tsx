import { createClient } from '@/lib/supabase/server'
import { Users, BarChart2, BookOpen, FileText, PlusCircle, Download, ChevronRight, ClipboardList } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: questionCount },
    { count: testCount },
  ] = await Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('tests').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { icon: BookOpen,  value: String(questionCount ?? 0), label: 'Câu hỏi trong CSDL', color: 'var(--navy)' },
    { icon: FileText,  value: String(testCount ?? 0),     label: 'Đề thi',             color: '#d97706'     },
    { icon: Users,     value: '—',                        label: 'Tổng học sinh',      color: 'var(--blue)' },
    { icon: BarChart2, value: '—',                        label: 'Hoạt động tuần này', color: '#16a34a'     },
  ]

  const quickActions = [
    { icon: PlusCircle,  label: 'Thêm câu hỏi',    href: '/admin/questions/new'    },
    { icon: ClipboardList, label: 'Import từ PDF',  href: '/admin/questions/import' },
    { icon: FileText,    label: 'Tạo đề thi',       href: '/admin/tests/new'        },
    { icon: Download,    label: 'Xem ngân hàng câu hỏi', href: '/admin/questions'  },
  ]

  return (
    <div style={{ padding: '32px', maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f1e4d 0%, var(--navy) 100%)',
        borderRadius: 16, padding: '28px 32px',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 4 }}>Quản trị hệ thống</p>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800 }}>Tổng quan</h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {stats.map(({ icon: Icon, value, label, color }) => (
          <div key={label} style={{
            background: '#fff', border: '1px solid var(--border)',
            borderRadius: 12, padding: '18px 20px',
            boxShadow: 'var(--card-shadow)',
          }}>
            <Icon size={20} color={color} style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 24, fontWeight: 800, color, marginBottom: 2 }}>{value}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '24px', boxShadow: 'var(--card-shadow)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 18 }}>Thao tác nhanh</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {quickActions.map(({ icon: Icon, label, href }) => (
            <a key={label} href={href} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'var(--bg)', border: '1.5px solid var(--border)',
              borderRadius: 10, cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              color: 'var(--navy)', textDecoration: 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon size={17} color="var(--blue)" />
                {label}
              </div>
              <ChevronRight size={14} color="var(--text-muted)" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
