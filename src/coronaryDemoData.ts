/** Shared, synthetic teaching case. None of these values comes from a patient or solver. */
export const DEMO_CASE = {
  id: 'SIM-COR-01',
  title: 'Ca mạch vành giả lập',
  modality: 'Không có ảnh CCTA · hình học dựng bằng code',
  provenance: 'Toàn bộ hình học và giá trị trong khu này được tạo để showcase tương tác; không phải dữ liệu ca 0225.',
} as const

export type CoronaryBranchId = 'lad' | 'lcx' | 'rca'

export type DemoLesion = {
  id: 'L1' | 'L2' | 'L3' | 'L4'
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
  {
    id: 'L4', branch: 'lad', branchLabel: 'LAD', location: 'Đoạn xa LAD · nối tiếp L1',
    severityPct: 38, lengthMm: 7, proximalRatio: .74, distalRatio: .69, plannedRatio: .85,
    plaqueMm3: { nonCalcified: 10, calcified: 5, lowAttenuation: 2 },
    planning: { landingZoneMm: 15, cArmAngle: 'LAO 32° · cranial 18°' },
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


export const LESION_POSITION: Record<DemoLesion['id'], number> = { L1: .42, L2: .42, L3: .52, L4: .76 }
export const BRANCH_LENGTH_MM: Record<CoronaryBranchId, number> = { lad: 100, lcx: 80, rca: 100 }
export type ProbeSelectionProps = LesionSelectionProps & { probeT: number; onProbeTChange: (t: number) => void }
export type DemoPlan = { stentLength: number; lao: number; cranial: number }
export type DemoPlans = Record<DemoLesion['id'], DemoPlan>
export function defaultDemoPlan(lesion: DemoLesion): DemoPlan {
  return { stentLength: lesion.lengthMm + 8, lao: lesion.branch === 'lcx' ? -25 : lesion.branch === 'rca' ? 18 : 32, cranial: lesion.branch === 'lcx' ? -12 : lesion.branch === 'rca' ? 8 : 18 }
}
export function initialDemoPlans(): DemoPlans {
  return Object.fromEntries(DEMO_LESIONS.map(l => [l.id, defaultDemoPlan(l)])) as DemoPlans
}
export type PlanSelectionProps = LesionSelectionProps & { plans: DemoPlans; onPlanChange: (id: DemoLesion['id'], plan: DemoPlan) => void }
export function demoRatioAt(branch: CoronaryBranchId, t: number): number {
  const lesions = DEMO_LESIONS.filter(l => l.branch === branch)
  let ratio = lesions[0].proximalRatio
  for (const l of lesions) {
    const half = l.lengthMm / BRANCH_LENGTH_MM[branch] / 2
    const blend = Math.min(1, Math.max(0, (t - LESION_POSITION[l.id] + half) / (2 * half)))
    ratio -= (l.proximalRatio - l.distalRatio) * blend
  }
  return Number(ratio.toFixed(3))
}
export function demoSeverityAt(branch: CoronaryBranchId, t: number): number {
  return Math.max(0, ...DEMO_LESIONS.filter(l => l.branch === branch).map(l => {
    const half = l.lengthMm / BRANCH_LENGTH_MM[branch] / 2
    return l.severityPct * Math.max(0, 1 - Math.abs(t - LESION_POSITION[l.id]) / half)
  }))
}
// Public TPV bands, checked against Heartflow's Plaque Staging page on 2026-10-08.
// This classifies the synthetic total only; it does not supply treatment advice.
export const TPV_BANDS = [
  { label: 'Không có mảng bám', range: '0', max: 0 },
  { label: 'Mild', range: '1–100', max: 100 },
  { label: 'Moderate', range: '101–250', max: 250 },
  { label: 'Severe', range: '251–750', max: 750 },
  { label: 'Extensive', range: '>750', max: Infinity },
] as const
export function tpvBandIndex(volume: number) { return TPV_BANDS.findIndex(b => volume <= b.max) }
