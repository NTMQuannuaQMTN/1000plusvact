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
        background: 'var(--white)',
        padding: '80px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 64,
        flexWrap: 'wrap',
      }}>
        <div style={{ maxWidth: 540 }}>
          <p style={{
            color: 'var(--blue)',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}>
            AI-Powered Exam Prep
          </p>
          <h1 style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 800,
            color: 'var(--navy)',
            lineHeight: 1.15,
            marginBottom: 20,
            letterSpacing: '-1px',
          }}>
            Study smarter.<br />
            Score higher.
          </h1>
          <p style={{
            fontSize: 18,
            color: 'var(--text-muted)',
            lineHeight: 1.7,
            marginBottom: 36,
            maxWidth: 460,
          }}>
            VACT helps Vietnamese students prepare for the university entrance exam
            with personalized AI practice, detailed analytics, and adaptive learning.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <a href="/signup" className="btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
              Get started — it&#39;s free
            </a>
            <a href="/login" className="btn-outline-navy" style={{ fontSize: 16, padding: '14px 32px' }}>
              Log in
            </a>
          </div>
        </div>

        {/* Illustration */}
        <div style={{
          width: 340,
          height: 300,
          background: 'var(--blue-light)',
          borderRadius: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          flexShrink: 0,
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 64 }}>📚</div>
          <div style={{ textAlign: 'center', padding: '0 24px' }}>
            <p style={{ color: 'var(--navy)', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
              AI Tutor · Question Bank · Mock Exams
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Everything you need for the ĐGNL & THPTQG exams
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{ background: 'var(--navy)', padding: '48px 32px' }}>
        <div style={{
          maxWidth: 860,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 0,
        }}>
          {[
            { num: '10,000+', label: 'Active students' },
            { num: '500+',    label: 'Practice questions' },
            { num: '8',       label: 'Exam subjects' },
            { num: '95%',     label: 'Student satisfaction' },
          ].map(({ num, label }) => (
            <div key={label} style={{
              textAlign: 'center',
              padding: '16px 24px',
              borderRight: '1px solid rgba(255,255,255,0.1)',
            }}>
              <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--blue)', lineHeight: 1.1, marginBottom: 6 }}>
                {num}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Subjects ── */}
      <section id="courses" style={{ background: 'var(--bg)', padding: '80px 32px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 12, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
            All subjects covered
          </p>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>
            Choose your subject
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, marginBottom: 48 }}>
            Full coverage of ĐGNL and THPTQG exam subjects.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 20,
          }}>
            {[
              { icon: '📐', name: 'Mathematics',  desc: 'Algebra, Calculus, Geometry' },
              { icon: '📖', name: 'Literature',   desc: 'Comprehension, Composition' },
              { icon: '🌍', name: 'English',      desc: 'Grammar, Reading, Writing' },
              { icon: '⚡', name: 'Physics',      desc: 'Mechanics, Electricity, Waves' },
              { icon: '🧪', name: 'Chemistry',    desc: 'Organic, Inorganic, Reactions' },
              { icon: '🧬', name: 'Biology',      desc: 'Cells, Genetics, Ecology' },
              { icon: '🏛️', name: 'History',      desc: 'Vietnam & World History' },
              { icon: '🗺️', name: 'Geography',   desc: 'Physical & Human Geography' },
            ].map(({ icon, name, desc }) => (
              <a key={name} href="/signup" className="subject-card">
                <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
                <h3 style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 15, marginBottom: 4 }}>
                  {name}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>{desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="practice" style={{ background: 'var(--white)', padding: '80px 32px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 12, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
            Simple process
          </p>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--navy)', marginBottom: 48 }}>
            How VACT works
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 32,
          }}>
            {[
              { step: '01', icon: '✍️', title: 'Create account',  body: 'Sign up free and tell us your target school and subjects.' },
              { step: '02', icon: '🎯', title: 'Practice daily',   body: 'AI picks questions matched to your weak spots and target score.' },
              { step: '03', icon: '📈', title: 'Track progress',   body: 'See your score trend and get a predicted exam score in real time.' },
            ].map(({ step, icon, title, body }) => (
              <div key={step} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--blue-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  margin: '0 auto 16px',
                  border: '2px solid var(--blue)',
                }}>
                  {icon}
                </div>
                <p style={{ color: 'var(--blue)', fontSize: 12, fontWeight: 700, letterSpacing: '1px', marginBottom: 6 }}>STEP {step}</p>
                <h3 style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 18, marginBottom: 10 }}>{title}</h3>
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
        <h2 style={{ fontSize: 36, fontWeight: 800, color: 'var(--white)', marginBottom: 14, letterSpacing: '-0.5px' }}>
          Ready to ace your exam?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 17, marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
          Join thousands of students already preparing with VACT. It&#39;s free to start.
        </p>
        <a href="/signup" className="btn-primary" style={{ fontSize: 16, padding: '14px 40px' }}>
          Start learning now
        </a>
      </section>

      {/* ── Footer ── */}
      <footer id="about" style={{
        background: '#0f1e4d',
        padding: '48px 32px 32px',
        marginTop: 'auto',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 40,
            marginBottom: 40,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ background: 'var(--blue)', color: 'white', borderRadius: 6, padding: '2px 8px', fontSize: 18, fontWeight: 900 }}>V</span>
                <span style={{ color: 'white', fontWeight: 800, fontSize: 18 }}>VACT</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6 }}>
                AI-powered exam preparation for Vietnamese students.
              </p>
            </div>
            <div>
              <h4 style={{ color: 'white', fontWeight: 600, marginBottom: 14, fontSize: 13 }}>LEARN</h4>
              {['Courses', 'Practice Tests', 'AI Tutor', 'Progress Tracking'].map(l => (
                <p key={l} style={{ marginBottom: 8 }}>
                  <a href="/signup" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{l}</a>
                </p>
              ))}
            </div>
            <div>
              <h4 style={{ color: 'white', fontWeight: 600, marginBottom: 14, fontSize: 13 }}>ACCOUNT</h4>
              {['Log in', 'Sign up', 'Dashboard', 'Settings'].map(l => (
                <p key={l} style={{ marginBottom: 8 }}>
                  <a href="/login" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{l}</a>
                </p>
              ))}
            </div>
          </div>
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
              © 2026 VACT. All rights reserved.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
              Built for Vietnamese university entrance exam success.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
