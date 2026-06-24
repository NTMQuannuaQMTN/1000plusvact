'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, X } from 'lucide-react'

type Props = {
  message: string
  show: boolean
}

export function Toast({ message, show }: Props) {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!show) return

    setMounted(true)

    // Remove ?saved=1 from URL so the toast doesn't re-appear on refresh
    const url = new URL(window.location.href)
    url.searchParams.delete('saved')
    router.replace(url.pathname + (url.search || ''), { scroll: false })

    // Trigger animation on next tick
    const enter = requestAnimationFrame(() => setVisible(true))

    const hideTimer   = setTimeout(() => setVisible(false), 3200)
    const unmountTimer = setTimeout(() => setMounted(false),  3700)

    return () => {
      cancelAnimationFrame(enter)
      clearTimeout(hideTimer)
      clearTimeout(unmountTimer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  if (!mounted) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 9999,
        background: '#fff',
        border: '1px solid #bbf7d0',
        borderLeft: '4px solid #16a34a',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        minWidth: 280,
        maxWidth: 360,
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(calc(100% + 32px)) scale(0.96)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0 }} />
      <p style={{ fontSize: 14, fontWeight: 500, color: '#15803d', flex: 1, lineHeight: 1.4 }}>
        {message}
      </p>
      <button
        onClick={() => setVisible(false)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 4, borderRadius: 4, color: '#86efac',
          display: 'flex', alignItems: 'center', flexShrink: 0,
        }}
      >
        <X size={16} />
      </button>
    </div>
  )
}
