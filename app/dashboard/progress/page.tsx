import { createClient } from '@/lib/supabase/server'
import { PARTS, PART_KEYS } from '@/lib/exam/parts'
import { TrendingUp, TrendingDown } from 'lucide-react'

const PART_META = {
  viet:     { label: 'Tiếng Việt',       color: '#2563eb', light: '#dbeafe' },
  anh:      { label: 'Tiếng Anh',        color: '#16a34a', light: '#bbf7d0' },
  toan:     { label: 'Toán',             color: '#d97706', light: '#fde68a' },
  khoa_hoc: { label: 'Tư duy KH',       color: '#7c3aed', light: '#ddd6fe' },
} as const

type ModuleStat = { correct: number; total: number }
type PartStat   = { correct: number; total: number; modules?: Record<string, ModuleStat> }
type Breakdown  = Record<string, PartStat>

function partScore(bd: Breakdown, part: string) {
  const p = bd[part]
  if (!p || p.total === 0) return 0
  return Math.round((p.correct / p.total) * 300)
}

function topModules(bd: Breakdown, part: string, n = 2) {
  const modules = bd[part]?.modules
  if (!modules) return []
  return Object.entries(modules)
    .filter(([, s]) => s.total > 0)
    .map(([key, s]) => ({ key, pct: s.correct / s.total, correct: s.correct, total: s.total }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, n)
}

function bottomModules(bd: Breakdown, part: string, n = 1) {
  const modules = bd[part]?.modules
  if (!modules) return []
  return Object.entries(modules)
    .filter(([, s]) => s.total > 0)
    .map(([key, s]) => ({ key, pct: s.correct / s.total, correct: s.correct, total: s.total }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, n)
}

// ─── Stacked bar chart (pure CSS) ────────────────────────────────────────────
const TOTAL_MAX  = 1200
const CHART_H    = 240  // px = 1200 pts
const GRID_MARKS = [0, 300, 600, 900, 1200]

type ChartSub = { id: string; testTitle: string; bd: Breakdown; createdAt: string }

function StackedBarChart({ submissions }: { submissions: ChartSub[] }) {
  return (
    <div style={{ display: 'flex' }}>

      {/* Y-axis */}
      <div style={{ width: 38, flexShrink: 0, position: 'relative', height: CHART_H + 56 }}>
        {GRID_MARKS.map(v => (
          <div key={v} style={{
            position: 'absolute',
            bottom: 56 + (v / TOTAL_MAX) * CHART_H,
            right: 6, fontSize: 10, color: 'var(--text-muted)',
            lineHeight: 1, transform: 'translateY(50%)',
          }}>{v}</div>
        ))}
      </div>

      {/* Chart body */}
      <div style={{ flex: 1, overflowX: 'auto' }}>
        <div style={{ position: 'relative', minWidth: Math.max(submissions.length * 88, 320) }}>

          {/* Grid lines (absolute, behind bars) */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 56, height: CHART_H, pointerEvents: 'none' }}>
            {GRID_MARKS.map(v => (
              <div key={v} style={{
                position: 'absolute', left: 0, right: 0,
                bottom: (v / TOTAL_MAX) * CHART_H,
                borderTop: v === 0 ? '2px solid #d1d5db' : '1px dashed #e5e7eb',
              }}>
                {v > 0 && (
                  <span style={{
                    position: 'absolute', right: 4, top: -9,
                    fontSize: 9, color: '#d1d5db', fontWeight: 600,
                  }}>{v / 300}×300</span>
                )}
              </div>
            ))}
          </div>

          {/* Bars row */}
          <div style={{
            display: 'flex', alignItems: 'flex-end',
            height: CHART_H + 56, paddingBottom: 8, gap: 8, paddingLeft: 8, paddingRight: 8,
          }}>
            {submissions.map(sub => {
              const scores = PART_KEYS.map(p => ({ part: p, score: partScore(sub.bd, p) }))
              const total  = scores.reduce((s, x) => s + x.score, 0)
              const barH   = Math.max(2, (total / TOTAL_MAX) * CHART_H)

              return (
                <div key={sub.id} style={{ flex: 1, minWidth: 64, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                  {/* Total label above bar */}
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>
                    {total}
                  </span>

                  {/* Stacked bar — segments ordered bottom-to-top via column-reverse */}
                  <div style={{
                    width: '100%', height: barH,
                    display: 'flex', flexDirection: 'column-reverse',
                    borderRadius: '5px 5px 0 0', overflow: 'hidden',
                  }}>
                    {scores.map(({ part, score }) => {
                      const meta = PART_META[part as keyof typeof PART_META]
                      const segH = (score / TOTAL_MAX) * CHART_H
                      return (
                        <div key={part} title={`${meta.label}: ${score}/300`} style={{
                          flexShrink: 0, height: segH, background: meta.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {segH >= 20 && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                              {score}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* X label */}
                  <div style={{ height: 50, paddingTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <span style={{
                      fontSize: 11, color: 'var(--navy)', fontWeight: 600,
                      textAlign: 'center', maxWidth: 80,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {sub.testTitle}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {new Date(sub.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: rawSubs } = await supabase
    .from('test_submissions')
    .select('id, score, total, breakdown, created_at, tests(id, title, year)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: true })

  const submissions = (rawSubs ?? []).map(s => ({
    id:        s.id,
    score:     s.score as number,
    total:     s.total as number,
    bd:        s.breakdown as Breakdown,
    createdAt: s.created_at as string,
    testId:    (s.tests as unknown as { id: string; title: string; year: number | null } | null)?.id ?? '',
    testTitle: (s.tests as unknown as { id: string; title: string; year: number | null } | null)?.title ?? 'Đề thi',
    testYear:  (s.tests as unknown as { id: string; title: string; year: number | null } | null)?.year ?? null,
  }))

  if (submissions.length === 0) {
    return (
      <div style={{ padding: '32px', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>Tiến độ</h1>
        <div style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 14,
          padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14,
          boxShadow: 'var(--card-shadow)', marginTop: 24,
        }}>
          Bạn chưa làm đề thi nào.{' '}
          <a href="/dashboard/exams" style={{ color: 'var(--blue)', fontWeight: 600 }}>Thử làm một đề</a>
        </div>
      </div>
    )
  }

  // Overall averages
  const avgByPart = PART_KEYS.map(part => {
    // Only include submissions where the test actually had questions for this part
    const scores = submissions
      .filter(s => (s.bd[part]?.total ?? 0) > 0)
      .map(s => partScore(s.bd, part))
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    return { part, avg }
  })

  const latestSub  = submissions[submissions.length - 1]
  const latestTotal = PART_KEYS.reduce((sum, p) => sum + partScore(latestSub.bd, p), 0)

  return (
    <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>Tiến độ</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {submissions.length} đề đã làm · Điểm ước tính gần nhất: <strong style={{ color: 'var(--navy)' }}>{latestTotal}/1200</strong>
        </p>
      </div>

      {/* Average summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {avgByPart.map(({ part, avg }) => {
          const meta = PART_META[part as keyof typeof PART_META]
          return (
            <div key={part} style={{
              background: '#fff', border: '1px solid var(--border)', borderRadius: 12,
              padding: '16px', boxShadow: 'var(--card-shadow)',
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: meta.color,
                background: meta.light, padding: '2px 8px', borderRadius: 999,
                display: 'inline-block', marginBottom: 10,
              }}>
                {meta.label}
              </div>
              <p style={{ fontSize: 26, fontWeight: 800, color: meta.color, marginBottom: 0, lineHeight: 1 }}>
                {avg}
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>/300</span>
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Trung bình</p>
            </div>
          )
        })}
      </div>

      {/* Bar chart */}
      <div style={{
        background: '#fff', border: '1px solid var(--border)', borderRadius: 14,
        padding: '24px', marginBottom: 28, boxShadow: 'var(--card-shadow)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>Điểm theo đề thi</h2>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {PART_KEYS.map(part => {
              const meta = PART_META[part as keyof typeof PART_META]
              return (
                <div key={part} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: meta.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{meta.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <StackedBarChart submissions={submissions} />
      </div>

      {/* Per-test skill breakdown */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>Chi tiết từng đề</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[...submissions].reverse().map((sub, ri) => {
          const totalScore = PART_KEYS.reduce((sum, p) => sum + partScore(sub.bd, p), 0)
          const date = new Date(sub.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

          return (
            <div key={sub.id} style={{
              background: '#fff', border: '1px solid var(--border)', borderRadius: 14,
              overflow: 'hidden', boxShadow: 'var(--card-shadow)',
            }}>
              {/* Test header */}
              <div style={{
                background: 'var(--bg)', padding: '14px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
                borderBottom: '1px solid var(--border)',
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>
                    {submissions.length - ri}. {sub.testTitle}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{date} · {sub.score}/{sub.total} câu đúng</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>{totalScore}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/1200</span>
                </div>
              </div>

              {/* Subject breakdown grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0 }}>
                {PART_KEYS.map((part, pi) => {
                  const meta  = PART_META[part as keyof typeof PART_META]
                  const score = partScore(sub.bd, part)
                  const bd    = sub.bd[part]
                  const pct   = bd?.total ? Math.round((bd.correct / bd.total) * 100) : 0
                  const tops  = topModules(sub.bd, part, 1)
                  const bots  = bottomModules(sub.bd, part, 1)
                  const modules = PARTS[part as keyof typeof PARTS]?.modules ?? {}

                  const borderRight = pi % 2 === 0 ? '1px solid var(--border)' : 'none'
                  const borderBottom = pi < 2 ? '1px solid var(--border)' : 'none'

                  return (
                    <div key={part} style={{ padding: '16px 20px', borderRight, borderBottom }}>
                      {/* Part header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: meta.color,
                          background: meta.light, padding: '2px 8px', borderRadius: 999,
                        }}>
                          {meta.label}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: meta.color }}>
                          {score}<span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>/300</span>
                        </span>
                      </div>

                      {/* Score bar */}
                      <div style={{ background: '#e5e7eb', borderRadius: 999, height: 5, marginBottom: 12, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 999, background: meta.color,
                          width: `${pct}%`, transition: 'width 0.5s',
                        }} />
                      </div>

                      {/* Module stats */}
                      {Object.keys(modules).length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {Object.entries(modules).map(([modKey, modLabel]) => {
                            const ms = sub.bd[part]?.modules?.[modKey]
                            if (!ms || ms.total === 0) return null
                            const modPct = Math.round((ms.correct / ms.total) * 100)
                            const isTop = tops[0]?.key === modKey
                            const isBot = bots[0]?.key === modKey && modPct < 60
                            return (
                              <div key={modKey} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                    <span style={{
                                      fontSize: 11, color: 'var(--text-muted)',
                                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                      maxWidth: 120,
                                    }}>
                                      {modLabel}
                                    </span>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: isTop ? meta.color : isBot ? '#dc2626' : 'var(--text-muted)', flexShrink: 0, marginLeft: 4 }}>
                                      {ms.correct}/{ms.total}
                                    </span>
                                  </div>
                                  <div style={{ background: '#e5e7eb', borderRadius: 999, height: 4, overflow: 'hidden' }}>
                                    <div style={{
                                      height: '100%', borderRadius: 999,
                                      width: `${modPct}%`,
                                      background: isTop ? meta.color : isBot ? '#ef4444' : '#9ca3af',
                                    }} />
                                  </div>
                                </div>
                                {isTop && <TrendingUp size={12} color={meta.color} style={{ flexShrink: 0 }} />}
                                {isBot && <TrendingDown size={12} color="#ef4444" style={{ flexShrink: 0 }} />}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {!sub.bd[part]?.modules && (
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Chi tiết kỹ năng không có trong lần làm này.
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
