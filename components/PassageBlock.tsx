type Props = {
  text: string
  part?: string
  questionRange?: string
}

function detectPoetry(text: string): boolean {
  const lines = text.split('\n').filter(l => l.trim().length > 0)
  if (lines.length < 4) return false
  const avg = lines.reduce((s, l) => s + l.trim().length, 0) / lines.length
  // Vietnamese poetry: short lines, multiple stanzas
  return avg < 52
}

export function PassageBlock({ text, part, questionRange }: Props) {
  const isPoetry = part === 'viet' && detectPoetry(text)

  if (isPoetry) {
    return (
      <div style={{
        background: '#fdfcf7',
        border: '1px solid #e2d9c0',
        borderRadius: 10,
        padding: '18px 24px',
        marginBottom: 16,
      }}>
        {questionRange && (
          <p style={{
            fontSize: 11, fontWeight: 700, color: '#92400e',
            textTransform: 'uppercase', letterSpacing: 0.8,
            marginBottom: 14,
          }}>
            Đọc đoạn thơ sau và trả lời câu {questionRange}
          </p>
        )}
        <div style={{
          textAlign: 'center',
          fontStyle: 'italic',
          fontSize: 14,
          lineHeight: 2.1,
          color: '#1c1917',
          whiteSpace: 'pre-wrap',
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}>
          {text}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: '#f8faff',
      border: '1px solid #dbeafe',
      borderLeft: '3px solid #2563eb',
      borderRadius: 8,
      padding: '14px 16px',
      marginBottom: 16,
    }}>
      {questionRange && (
        <p style={{
          fontSize: 11, fontWeight: 700, color: '#2563eb',
          textTransform: 'uppercase', letterSpacing: 0.8,
          marginBottom: 10,
        }}>
          Đọc đoạn văn sau và trả lời câu {questionRange}
        </p>
      )}
      <div style={{
        fontSize: 14,
        lineHeight: 1.85,
        color: '#1e293b',
        whiteSpace: 'pre-wrap',
      }}>
        {text}
      </div>
    </div>
  )
}
