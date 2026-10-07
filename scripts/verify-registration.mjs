import { readFileSync } from 'node:fs'
import * as THREE from 'three'

const root = new URL('../src/assets/vmr-p3/', import.meta.url)
const readJson = name => JSON.parse(readFileSync(new URL(name, root), 'utf8'))
const ct = readJson('ct-slices.json')
const contours = readJson('ct-contours.json')
const centerline = readJson('centerline.json')
const model = readFileSync(new URL('model.bin', root))
const view = new DataView(model.buffer, model.byteOffset, model.byteLength)
const vertexCount = view.getUint32(0, true)
const indexCount = view.getUint32(4, true)
const indexOffset = 8 + vertexCount * 12
const scale = centerline.bounds.scale
const center = centerline.bounds.center

if (ct.case !== contours.case || ct.sliceIndices.join() !== contours.sliceIndices.join()) {
  throw new Error('CT and contour case or slice indices differ')
}

const vertex = index => [
  view.getFloat32(8 + index * 12, true),
  view.getFloat32(12 + index * 12, true),
  view.getFloat32(16 + index * 12, true),
]
const project = ([x, , z]) => [
  (z / scale + center[0] - ct.origin[0]) / ct.spacing[0],
  (x / scale + center[1] - ct.origin[1]) / ct.spacing[1],
]
const sliceY = index => (ct.origin[2] + ct.sliceIndices[index] * ct.spacing[2] - center[2]) * scale
const points = centerline.world.map(p => new THREE.Vector3(...p))
const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', .2)
const samples = Array.from({ length: 513 }, (_, i) => curve.getPointAt(i / 512))
const contourPolygons = contours.paths.map(paths => paths.map(path => {
  const values = [...path.matchAll(/-?\d+(?:\.\d+)?/g)].map(match => Number(match[0]))
  return Array.from({ length: values.length / 2 }, (_, i) => [values[i * 2], values[i * 2 + 1]])
}))

function selectedT(sliceIndex, previousT) {
  let bestT = previousT, bestCost = Infinity
  samples.forEach((point, i) => {
    const t = i / 512
    const cost = (point.y - sliceY(sliceIndex)) ** 2 + .025 * (t - previousT) ** 2
    if (cost < bestCost) { bestCost = cost; bestT = t }
  })
  return bestT
}

function inPolygon([x, y], vertices) {
  let inside = false
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const [xi, yi] = vertices[i], [xj, yj] = vertices[j]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

let previousT = selectedT(4, .46)
let largestBboxError = 0
for (let sliceIndex = 0; sliceIndex < ct.sliceIndices.length; sliceIndex++) {
  const plane = sliceY(sliceIndex)
  const intersections = []
  for (let i = 0; i < indexCount; i += 3) {
    const triangle = [0, 1, 2].map(j => vertex(view.getUint32(indexOffset + (i + j) * 4, true)))
    for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) {
      const p = triangle[a], q = triangle[b]
      if ((p[1] - plane) * (q[1] - plane) > 0 || p[1] === q[1]) continue
      const fraction = (plane - p[1]) / (q[1] - p[1])
      if (fraction < 0 || fraction > 1) continue
      intersections.push(project([
        p[0] + fraction * (q[0] - p[0]),
        plane,
        p[2] + fraction * (q[2] - p[2]),
      ]))
    }
  }
  const savedPolygons = contourPolygons[sliceIndex]
  const saved = savedPolygons.flat()
  const bbox = values => [
    Math.min(...values.map(p => p[0])), Math.min(...values.map(p => p[1])),
    Math.max(...values.map(p => p[0])), Math.max(...values.map(p => p[1])),
  ]
  const meshBox = bbox(intersections), savedBox = bbox(saved)
  const error = Math.max(...meshBox.map((value, i) => Math.abs(value - savedBox[i])))
  largestBboxError = Math.max(largestBboxError, error)
  if (error > .15) throw new Error(`Slice ${ct.sliceIndices[sliceIndex]} contour differs from P007 by ${error.toFixed(3)} px`)

  const t = selectedT(sliceIndex, previousT)
  const centerlinePoint = curve.getPointAt(t)
  const pixel = project(centerlinePoint.toArray())
  if (!savedPolygons.some(polygon => inPolygon(pixel, polygon))) {
    throw new Error(`Selected centerline point misses CT contour on slice ${ct.sliceIndices[sliceIndex]}`)
  }
  previousT = t
}

const halfSliceGap = (ct.sliceIndices[1] - ct.sliceIndices[0]) * ct.spacing[2] * scale / 2 + .002
let checkedSelections = 0
for (let i = 0; i < samples.length; i++) {
  const point = samples[i]
  const nearestSlice = ct.sliceIndices.reduce((best, _, index) =>
    Math.abs(sliceY(index) - point.y) < Math.abs(sliceY(best) - point.y) ? index : best, 0)
  if (Math.abs(sliceY(nearestSlice) - point.y) > halfSliceGap) continue
  const snappedPoint = curve.getPointAt(selectedT(nearestSlice, i / 512))
  if (!contourPolygons[nearestSlice].some(polygon => inPolygon(project(snappedPoint.toArray()), polygon))) {
    throw new Error(`Linked 3D selection misses CT contour at t=${(i / 512).toFixed(3)}`)
  }
  checkedSelections++
}

console.log(`Verified ${ct.sliceIndices.length} CT slices against P007: max contour bbox error ${largestBboxError.toFixed(3)} px; ${checkedSelections} in-range 3D selections land inside a CT contour.`)
