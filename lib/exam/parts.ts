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
