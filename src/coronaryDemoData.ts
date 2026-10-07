/** Shared, synthetic teaching case. None of these values comes from a patient or solver. */
export const DEMO_CASE = {
  id: 'SIM-COR-01',
  title: 'Ca mạch vành giả lập',
  modality: 'Không có ảnh CCTA · hình học dựng bằng code',
  provenance: 'Toàn bộ hình học và giá trị trong khu này được tạo để showcase tương tác; không phải dữ liệu ca 0225.',
} as const

export type CoronaryBranchId = 'lad' | 'lcx' | 'rca'

export type DemoLesion = {
  id: 'L1' | 'L2' | 'L3'
  branch: CoronaryBranchId
  branchLabel: string
  location: string
  severityPct: number
  lengthMm: number
  proximalRatio: number
  distalRatio: number
  plannedRatio: number
  plaqueMm3: {
    nonCalcified: number
    calcified: number
    lowAttenuation: number
  }
  planning: {
    landingZoneMm: number
    cArmAngle: string
  }
}

export const DEMO_LESIONS: readonly DemoLesion[] = [
  {
    id: 'L1', branch: 'lad', branchLabel: 'LAD', location: 'Đoạn giữa LAD',
    severityPct: 72, lengthMm: 16, proximalRatio: .95, distalRatio: .74, plannedRatio: .89,
    plaqueMm3: { nonCalcified: 48, calcified: 16, lowAttenuation: 8 },
    planning: { landingZoneMm: 24, cArmAngle: 'LAO 32° · cranial 18°' },
  },
  {
    id: 'L2', branch: 'lcx', branchLabel: 'LCx', location: 'Đoạn gần LCx',
    severityPct: 56, lengthMm: 11, proximalRatio: .96, distalRatio: .83, plannedRatio: .91,
    plaqueMm3: { nonCalcified: 25, calcified: 15, lowAttenuation: 5 },
    planning: { landingZoneMm: 19, cArmAngle: 'RAO 25° · caudal 12°' },
  },
  {
    id: 'L3', branch: 'rca', branchLabel: 'RCA', location: 'Đoạn giữa RCA',
    severityPct: 43, lengthMm: 9, proximalRatio: .97, distalRatio: .91, plannedRatio: .95,
    plaqueMm3: { nonCalcified: 18, calcified: 11, lowAttenuation: 2 },
    planning: { landingZoneMm: 16, cArmAngle: 'LAO 18° · cranial 8°' },
  },
] as const

export type LesionSelectionProps = {
  selectedLesionId: DemoLesion['id']
  onSelectLesion: (id: DemoLesion['id']) => void
}

export function getDemoLesion(id: DemoLesion['id']): DemoLesion {
  return DEMO_LESIONS.find(lesion => lesion.id === id) ?? DEMO_LESIONS[0]
}

export const DEMO_PLAQUE_TOTAL_MM3 = DEMO_LESIONS.reduce(
  (total, lesion) => total + lesion.plaqueMm3.nonCalcified + lesion.plaqueMm3.calcified + lesion.plaqueMm3.lowAttenuation,
  0,
)
