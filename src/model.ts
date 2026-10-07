import * as THREE from 'three'
import centerline from './assets/vmr-p3/centerline.json'

export type Sample = { t: number; distance: number; diameter: number; pressure: number; velocity: number }

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n))
const smoothstep = (a: number, b: number, x: number) => { const v = clamp((x - a) / (b - a)); return v * v * (3 - 2 * v) }

export const pathPoints = centerline.world.map(p => new THREE.Vector3(p[0], p[1], p[2]))
export const curve3D = new THREE.CatmullRomCurve3(pathPoints, false, 'catmullrom', .2)
export const sampledPathPoints = Array.from({ length: 513 }, (_, i) => curve3D.getPointAt(i / 512))
export const caseId = '0227_H_AO_COA'
export const pathLengthMm = 269

export function sampleAt(t: number): Sample {
  const x = clamp(t), narrowing = Math.exp(-Math.pow((x - .48) / .08, 2))
  return {
    t: x,
    distance: Math.round(pathLengthMm * x),
    diameter: +(22 * (1 - .24 * x) * (1 - .18 * narrowing)).toFixed(1),
    pressure: +(5.8 - 1.1 * x - 2.0 * smoothstep(.42, .61, x)).toFixed(2),
    velocity: +(1.15 + .65 * x + 2.45 * narrowing).toFixed(2),
  }
}

export const profile = Array.from({ length: 136 }, (_, i) => ({ ...sampleAt(i / 135), distance: Math.round(pathLengthMm * i / 135) }))

export function flowColor(velocity: number) {
  const stops = [[0, '#223eaa'], [1.2, '#3d88be'], [2.0, '#49c3b0'], [3.0, '#e2cc60'], [4.5, '#e66e55']] as const
  const value = clamp(velocity, 0, 4.5)
  for (let i = 1; i < stops.length; i++) if (value <= stops[i][0]) {
    const [a, ca] = stops[i-1], [b, cb] = stops[i]
    return new THREE.Color(ca).lerp(new THREE.Color(cb), (value-a)/(b-a))
  }
  return new THREE.Color(stops.at(-1)![1])
}
