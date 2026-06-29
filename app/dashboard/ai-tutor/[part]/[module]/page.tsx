import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PARTS, PartKey } from '@/lib/exam/parts'
import { TutorSession } from './TutorSession'

type Params = Promise<{ part: string; module: string }>

export default async function TutorModulePage({ params }: { params: Params }) {
  const { part, module } = await params

  const partDef = PARTS[part as PartKey]
  if (!partDef || !partDef.modules[module]) notFound()

  const supabase = await createClient()

  const { data: questions } = await supabase
    .from('questions')
    .select('id, content, passage, image_url, image_description, option_a, option_b, option_c, option_d, answer, part, module')
    .eq('part', part)
    .eq('module', module)
    .limit(10)

  if (!questions?.length) {
    return (
      <div style={{ padding: '48px 32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
          Chưa có câu hỏi cho kỹ năng này.
        </p>
        <a href="/dashboard/ai-tutor" style={{ fontSize: 13, color: 'var(--blue)' }}>
          ← Chọn kỹ năng khác
        </a>
      </div>
    )
  }

  return (
    <TutorSession
      questions={questions}
      partLabel={partDef.label}
      moduleLabel={partDef.modules[module]}
      part={part}
      module={module}
    />
  )
}
