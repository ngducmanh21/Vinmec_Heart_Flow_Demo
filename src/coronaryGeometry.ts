import * as THREE from 'three'
import type { CoronaryBranchId } from './coronaryDemoData'
export const CORONARY_PATHS: Record<CoronaryBranchId, [number, number, number][]> = {
  lad: [[-.15,.8,.12],[-.08,.55,.27],[.12,.23,.42],[.24,-.2,.4],[.22,-.65,.22],[.08,-1.14,0]],
  lcx: [[-.15,.8,.12],[.16,.7,.1],[.54,.5,-.02],[.85,.17,-.23],[1,-.22,-.39],[.81,-.6,-.43]],
  rca: [[-.48,.87,-.04],[-.8,.57,.03],[-.96,.12,.02],[-.94,-.33,-.17],[-.63,-.77,-.37],[-.12,-1.08,-.4]],
}
export function coronaryCurve(branch: CoronaryBranchId) {
  return new THREE.CatmullRomCurve3(CORONARY_PATHS[branch].map(p => new THREE.Vector3(...p)), false, 'catmullrom', .3)
}
export function segmentCurve(curve: THREE.CatmullRomCurve3, from: number, to: number) {
  return new THREE.CatmullRomCurve3(Array.from({length:13},(_,i)=>curve.getPointAt(from+(to-from)*i/12)))
}
export function demoRatioColor(value: number) {
  return value < .8 ? '#ef8b78' : value < .88 ? '#e5c46b' : '#61d1c0'
}
