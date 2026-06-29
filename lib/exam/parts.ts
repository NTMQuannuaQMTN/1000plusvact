export type PartKey = 'viet' | 'anh' | 'toan' | 'khoa_hoc'

export const PARTS: Record<PartKey, { label: string; modules: Record<string, string> }> = {
  viet: {
    label: 'Tiếng Việt',
    modules: {
      doc_hieu: 'Đọc hiểu',
      ngu_phap: 'Ngữ pháp & từ vựng',
      van_hoc: 'Văn học',
      dien_dat: 'Diễn đạt',
    },
  },
  anh: {
    label: 'Tiếng Anh',
    modules: {
      reading: 'Reading Comprehension',
      grammar: 'Grammar & Vocabulary',
      writing: 'Writing',
    },
  },
  toan: {
    label: 'Toán',
    modules: {
      dai_so: 'Đại số',
      hinh_hoc: 'Hình học',
      giai_tich: 'Giải tích',
      xac_suat: 'Xác suất & Thống kê',
    },
  },
  khoa_hoc: {
    label: 'Tư duy khoa học',
    modules: {
      vat_ly: 'Vật lý',
      hoa_hoc: 'Hóa học',
      sinh_hoc: 'Sinh học',
      xa_hoi: 'Khoa học xã hội',
    },
  },
}

export const PART_KEYS = Object.keys(PARTS) as PartKey[]

export function getPartLabel(part: string): string {
  return PARTS[part as PartKey]?.label ?? part
}

export function getModuleLabel(part: string, module: string): string {
  return PARTS[part as PartKey]?.modules[module] ?? module
}

export function getTaskHint(part: string, module: string, content: string, passage?: string | null): string | null {
  if (part !== 'anh') return null
  const c = content.toLowerCase()
  const p = (passage ?? '').toLowerCase()
  if (module === 'reading') return 'Choose the best answer based on the passage.'
  if (module === 'writing') return 'Choose the option that best rewrites or completes the sentence.'
  if (module === 'grammar') {
    if (c.includes('underlined') || c.includes('error') || c.includes('incorrect') || c.includes('mistake') ||
        p.includes('one error') || p.includes('has an error') || p.includes('underlined'))
      return 'Identify the underlined part (A, B, C or D) that contains an error.'
    if (content.includes('___') || content.includes('……') || content.includes('....') ||
        p.includes('suitable word') || p.includes('fill in') || p.includes('blank'))
      return 'Choose the word or phrase that best completes the sentence.'
    if (c.includes('closest in meaning') || c.includes('nearest in meaning') || p.includes('closest in meaning'))
      return 'Choose the word or phrase closest in meaning to the underlined part.'
    if (c.includes('opposite') || c.includes('antonym') || p.includes('opposite in meaning'))
      return 'Choose the word or phrase opposite in meaning to the underlined part.'
    return 'Choose the correct answer.'
  }
  return null
}
