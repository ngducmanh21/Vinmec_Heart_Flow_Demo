import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import modelUrl from './assets/vmr-p3/model.bin?url'
import ctMetadata from './assets/vmr-p3/ct-slices.json'
import ctContours from './assets/vmr-p3/ct-contours.json'
import centerlineData from './assets/vmr-p3/centerline.json'
import { curve3D, flowColor, pathPoints, sampledPathPoints, sampleAt } from './model'

function usePatientMesh(flow: boolean) {
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null)
  useEffect(() => {
    let active = true
    fetch(modelUrl).then(r => { if (!r.ok) throw new Error('Model unavailable'); return r.arrayBuffer() }).then(data => { if (active) setBuffer(data) })
    return () => { active = false }
  }, [])
  const geometry = useMemo(() => {
    if (!buffer) return null
    const view = new DataView(buffer), vertexCount = view.getUint32(0, true), indexCount = view.getUint32(4, true)
    const pointOffset = 8, indexOffset = pointOffset + vertexCount * 12, tOffset = indexOffset + indexCount * 4
    const positions = new Float32Array(buffer, pointOffset, vertexCount * 3)
    const indices = new Uint32Array(buffer, indexOffset, indexCount)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setIndex(new THREE.BufferAttribute(indices, 1))
    if (flow) {
      const tValues = new Float32Array(buffer, tOffset, vertexCount), colors = new Float32Array(vertexCount * 3)
      for (let i = 0; i < vertexCount; i++) {
        const color = flowColor(sampleAt(tValues[i]).velocity)
        colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    }
    geo.computeVertexNormals()
    return geo
  }, [buffer, flow])
  useEffect(() => () => geometry?.dispose(), [geometry])
  return geometry
}

function nearestPath(point: THREE.Vector3) {
  let best = 0, distance = Infinity
  for (let i = 0; i < sampledPathPoints.length; i++) {
    const d = sampledPathPoints[i].distanceToSquared(point)
    if (d < distance) { distance = d; best = i }
  }
  return best / (sampledPathPoints.length - 1)
}

function PatientAorta({ flow, selectedT, centerline, segmentationView, onSelect }: { flow: boolean; selectedT: number; centerline: boolean; segmentationView: boolean; onSelect: (t: number) => void }) {
  const [hover, setHover] = useState(false), geometry = usePatientMesh(flow)
  const point = curve3D.getPointAt(selectedT)
  function click(e: ThreeEvent<MouseEvent>) { e.stopPropagation(); onSelect(nearestPath(e.point)) }
  return <group>
    {geometry && <mesh geometry={geometry} onClick={click} onPointerOver={e => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'crosshair' }} onPointerOut={() => { setHover(false); document.body.style.cursor = '' }}>
      <meshStandardMaterial vertexColors={flow} color={flow ? '#ffffff' : segmentationView ? '#84c8d1' : '#a9c2d5'} metalness={.08} roughness={.42} side={THREE.DoubleSide} transparent={segmentationView} opacity={segmentationView ? .86 : 1} depthWrite={!segmentationView} emissive={hover ? '#1c465e' : '#000000'} emissiveIntensity={hover ? .22 : 0} />
    </mesh>}
    {geometry && segmentationView && <mesh geometry={geometry}><meshBasicMaterial color="#1e6675" wireframe transparent opacity={.16} depthWrite={false} polygonOffset polygonOffsetFactor={-1} /></mesh>}
    {centerline && <Line points={pathPoints} color="#fff2d0" lineWidth={1.3} depthTest={false} transparent opacity={.95} />}
    <group position={point}><mesh><sphereGeometry args={[.045, 16, 16]} /><meshBasicMaterial color="#fff4dd" /></mesh><mesh><sphereGeometry args={[.078, 16, 16]} /><meshBasicMaterial color="#ffca77" transparent opacity={.28} depthWrite={false} /></mesh></group>
  </group>
}

function FlowParticles({ enabled }: { enabled: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null), dummy = useMemo(() => new THREE.Object3D(), [])
  useFrame(({ clock }) => {
    if (!enabled || !mesh.current) return
    for (let i = 0; i < 32; i++) {
      const t = (i / 32 + clock.elapsedTime * (.07 + i % 4 * .008)) % 1
      dummy.position.copy(curve3D.getPointAt(t)); dummy.scale.setScalar(.65 + Math.sin(clock.elapsedTime * 3 + i) * .12); dummy.updateMatrix(); mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })
  if (!enabled) return null
  return <instancedMesh ref={mesh} args={[undefined, undefined, 32]}><sphereGeometry args={[.011, 7, 7]} /><meshBasicMaterial color="#efffff" transparent opacity={.7} depthWrite={false} /></instancedMesh>
}

function CameraRig({ resetKey, interactive }: { resetKey: number; interactive: boolean }) {
  const { camera, size } = useThree(), controls = useRef<OrbitControlsImpl>(null)
  useEffect(() => {
    const distance = Math.max(4.6, size.height / Math.max(size.width, 1) * 2.9)
    camera.position.set(.75, .45, distance)
    controls.current?.target.set(0, 0, 0)
    controls.current?.update()
  }, [camera, resetKey, size.width, size.height])
  return interactive ? <OrbitControls ref={controls} makeDefault enableDamping minDistance={2.3} maxDistance={8} enablePan panSpeed={.65} /> : null
}

function SlicePlane({ sliceIndex }: { sliceIndex: number }) {
  const z = ctMetadata.origin[2] + ctMetadata.sliceIndices[sliceIndex] * ctMetadata.spacing[2]
  const y = (z - centerlineData.bounds.center[2]) * centerlineData.bounds.scale
  const corners: [number, number, number][] = [[-.94,y,-.55],[.94,y,-.55],[.94,y,.55],[-.94,y,.55],[-.94,y,-.55]]
  return <group><mesh position={[0,y,0]} rotation={[Math.PI/2,0,0]}><planeGeometry args={[1.88,1.1]}/><meshBasicMaterial color="#62d3df" transparent opacity={.10} depthWrite={false} side={THREE.DoubleSide}/></mesh><Line points={corners} color="#65cddc" lineWidth={1} transparent opacity={.55} depthTest={false}/></group>
}

function ContourStack({ sliceIndex, currentOnly = false }: { sliceIndex: number; currentOnly?: boolean }) {
  const rings = useMemo(() => ctContours.paths.map((paths, i) => paths.map(path => {
    const values = [...path.matchAll(/-?\d+(?:\.\d+)?/g)].map(match => Number(match[0]))
    const z = ctMetadata.origin[2] + ctMetadata.sliceIndices[i] * ctMetadata.spacing[2]
    const points: THREE.Vector3[] = []
    for (let n = 0; n < values.length; n += 2) {
      const x = ctMetadata.origin[0] + values[n] * ctMetadata.spacing[0]
      const y = ctMetadata.origin[1] + values[n + 1] * ctMetadata.spacing[1]
      points.push(new THREE.Vector3((y - centerlineData.bounds.center[1]) * centerlineData.bounds.scale, (z - centerlineData.bounds.center[2]) * centerlineData.bounds.scale, (x - centerlineData.bounds.center[0]) * centerlineData.bounds.scale))
    }
    if (points.length) points.push(points[0].clone())
    return points
  })), [])
  return <group>{rings.map((paths, i) => currentOnly && i !== sliceIndex ? null : paths.map((points, j) => <Line key={`${i}-${j}`} points={points} color={i === sliceIndex ? '#ffce82' : '#55b4c2'} lineWidth={i === sliceIndex ? 2.2 : 1} transparent opacity={i === sliceIndex ? .96 : .30} depthTest={false} />))}</group>
}

export default function Vessel3D({ flow, selectedT, onSelect, resetKey, interactive = true, centerline = false, sliceIndex = 4, showSlicePlane = false, segmentationView = false }: { flow: boolean; selectedT: number; onSelect: (t: number) => void; resetKey: number; interactive?: boolean; centerline?: boolean; sliceIndex?: number; showSlicePlane?: boolean; segmentationView?: boolean }) {
  return <Canvas camera={{ position: [.4, .1, 4.6], fov: 40, near: .1, far: 30 }} dpr={[1, 1.8]} gl={{ antialias: true, alpha: true }}>
    <ambientLight intensity={1.45} /><directionalLight position={[2, 3, 4]} intensity={2.4} color="#f2f7ff" /><directionalLight position={[-3, -1, -2]} intensity={1.1} color="#7dc7da" />
    <PatientAorta flow={flow} selectedT={selectedT} centerline={centerline} segmentationView={segmentationView} onSelect={onSelect} />{(segmentationView || showSlicePlane) && <ContourStack sliceIndex={sliceIndex} currentOnly={!segmentationView}/>} {showSlicePlane && <SlicePlane sliceIndex={sliceIndex}/>}<FlowParticles enabled={flow && interactive} /><CameraRig resetKey={resetKey} interactive={interactive} />
  </Canvas>
}
