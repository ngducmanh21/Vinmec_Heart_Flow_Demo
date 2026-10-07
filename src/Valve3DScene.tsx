import { Canvas, type ThreeEvent, useThree } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import './Valve3DScene.css'

export type Valve3DMode = 'normal' | 'prolapse' | 'compare'
export type Valve3DOverlay = 'none' | 'support' | 'deformation'
export type Valve3DPin = 'leaflet' | 'chordae' | 'annulus' | 'coaptation'

export type Valve3DSceneProps = {
  mode: Valve3DMode
  phase: number
  overlay: Valve3DOverlay
  activePin: Valve3DPin
  onPin: (pin: Valve3DPin) => void
}

const TAU = Math.PI * 2
const LEAFLET_ANGLES = [Math.PI / 2, Math.PI / 2 + TAU / 3, Math.PI / 2 + (TAU * 2) / 3]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function phaseFraction(phase: number) {
  return clamp(phase, 0, 100) / 100
}

function leafletPoint(index: number, phase: number, prolapse: boolean) {
  const closure = phaseFraction(phase)
  const angle = LEAFLET_ANGLES[index]
  const isDeformed = prolapse && index === 0
  const lift = (1 - closure) * -0.13 + closure * 0.29
  const deflection = isDeformed ? closure * 0.37 + 0.03 : 0
  const offset = isDeformed ? closure * 0.14 : 0
  const tangent = angle + Math.PI / 2

  return new THREE.Vector3(
    Math.cos(angle) * 0.14 * 1.55 + Math.cos(tangent) * offset,
    lift + deflection,
    Math.sin(angle) * 0.14 * 0.9 + Math.sin(tangent) * offset,
  )
}

function createLeafletGeometry(index: number, phase: number, prolapse: boolean) {
  const closure = phaseFraction(phase)
  const angle = LEAFLET_ANGLES[index]
  const isDeformed = prolapse && index === 0
  const angleSpan = isDeformed ? 1.02 : 1.15
  const angleSegments = 20
  const radialSegments = 7
  const positions: number[] = []
  const indices: number[] = []

  for (let radial = 0; radial <= radialSegments; radial += 1) {
    const v = radial / radialSegments
    const radius = 0.14 + v * 0.88
    const rimCurve = Math.sin(Math.PI * v)

    for (let segment = 0; segment <= angleSegments; segment += 1) {
      const u = segment / angleSegments
      const localAngle = angle - angleSpan / 2 + u * angleSpan
      const tipFactor = 1 - v
      const isTip = isDeformed && tipFactor > 0
      const deformation = isTip ? closure * 0.35 * tipFactor * (0.62 + 0.38 * Math.cos((u - 0.5) * Math.PI)) : 0
      const tangentOffset = isTip ? closure * 0.12 * tipFactor : 0
      const tangentAngle = localAngle + Math.PI / 2
      const x = Math.cos(localAngle) * radius * 1.55 + Math.cos(tangentAngle) * tangentOffset
      const z = Math.sin(localAngle) * radius * 0.9 + Math.sin(tangentAngle) * tangentOffset
      const cupping = Math.sin(Math.PI * v) * 0.1 + rimCurve * 0.015 * Math.cos((u - 0.5) * Math.PI)
      const openingDip = (1 - closure) * -0.14 * tipFactor
      const closingLift = closure * 0.31 * tipFactor
      positions.push(x, cupping + openingDip + closingLift + deformation, z)
    }
  }

  for (let radial = 0; radial < radialSegments; radial += 1) {
    for (let segment = 0; segment < angleSegments; segment += 1) {
      const row = angleSegments + 1
      const a = radial * row + segment
      const b = a + 1
      const c = a + row
      const d = c + 1
      indices.push(a, c, b, b, c, d)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function leafletOutline(index: number, phase: number, prolapse: boolean) {
  const angle = LEAFLET_ANGLES[index]
  const isDeformed = prolapse && index === 0
  const angleSpan = isDeformed ? 1.02 : 1.15
  const points: THREE.Vector3[] = []
  for (let segment = 0; segment <= 14; segment += 1) {
    const u = segment / 14
    const localAngle = angle - angleSpan / 2 + u * angleSpan
    points.push(new THREE.Vector3(Math.cos(localAngle) * 1.02 * 1.55, 0.01, Math.sin(localAngle) * 1.02 * 0.9))
  }
  points.push(leafletPoint(index, phase, prolapse).clone().setY(leafletPoint(index, phase, prolapse).y + 0.012))
  return points
}

function supportPositions(index: number, phase: number, prolapse: boolean) {
  const tip = leafletPoint(index, phase, prolapse)
  const papillary = [
    new THREE.Vector3(-0.72, -0.83, 0.12),
    new THREE.Vector3(0.72, -0.83, 0.12),
    new THREE.Vector3(0, -0.98, -0.3),
  ][index]
  const second = [
    new THREE.Vector3(-0.51, -0.72, -0.12),
    new THREE.Vector3(0.51, -0.72, -0.12),
    new THREE.Vector3(0.12, -0.86, -0.28),
  ][index]
  const side = index === 0 ? -0.16 : index === 1 ? 0.16 : 0
  const anchor = tip.clone().add(new THREE.Vector3(side, 0, 0))
  return [
    [anchor, new THREE.Vector3((anchor.x + papillary.x) / 2, -0.35, (anchor.z + papillary.z) / 2), papillary],
    [tip.clone().add(new THREE.Vector3(-side * 0.55, -0.005, 0.02)), new THREE.Vector3((tip.x + second.x) / 2, -0.3, (tip.z + second.z) / 2), second],
  ]
}

function Annulus({ active, onPin }: { active: boolean; onPin: () => void }) {
  return (
    <group onClick={event => { event.stopPropagation(); onPin() }}>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.45, 0.88, 1]}>
        <torusGeometry args={[1, 0.035, 14, 96]} />
        <meshStandardMaterial color={active ? '#b3efea' : '#55bbb9'} emissive={active ? '#276865' : '#0c343d'} emissiveIntensity={active ? 0.58 : 0.32} roughness={0.34} metalness={0.18} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.22, 0.7, 1]}>
        <torusGeometry args={[1, 0.008, 8, 96]} />
        <meshBasicMaterial color="#94ddd5" transparent opacity={active ? 0.85 : 0.32} depthWrite={false} />
      </mesh>
    </group>
  )
}

function Leaflet({ index, phase, prolapse, active, onPin }: { index: number; phase: number; prolapse: boolean; active: boolean; onPin: () => void }) {
  const geometry = useMemo(() => createLeafletGeometry(index, phase, prolapse), [index, phase, prolapse])
  const outline = useMemo(() => leafletOutline(index, phase, prolapse), [index, phase, prolapse])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group>
      <mesh geometry={geometry} onClick={event => { event.stopPropagation(); onPin() }}>
        <meshPhysicalMaterial color={prolapse ? '#bd9bd0' : '#76c7c9'} emissive={active ? (prolapse ? '#543a68' : '#1f6063') : '#071c25'} emissiveIntensity={active ? 0.52 : 0.16} roughness={0.3} metalness={0.08} clearcoat={0.24} clearcoatRoughness={0.3} transparent opacity={0.91} side={THREE.DoubleSide} />
      </mesh>
      <Line points={outline} color={active ? '#ecffff' : prolapse ? '#c98fcf' : '#a7ebdf'} lineWidth={active ? 1.7 : 0.95} transparent opacity={active ? 0.95 : 0.68} depthTest={false} />
    </group>
  )
}

function SupportSystem({ phase, prolapse, overlay, active, onPin }: { phase: number; prolapse: boolean; overlay: Valve3DOverlay; active: boolean; onPin: () => void }) {
  const lines = useMemo(() => [0, 1, 2].flatMap(index => supportPositions(index, phase, prolapse).map((points, line) => ({ index, line, points }))), [phase, prolapse])
  const pinPosition = new THREE.Vector3(-0.47, -0.42, -0.06)
  return (
    <group onClick={event => { event.stopPropagation(); onPin() }}>
      {lines.map(({ index, line, points }) => {
        const removed = prolapse && index === 0
        return <Line key={`${index}-${line}`} points={points} color={removed ? '#c788b7' : active || overlay === 'support' ? '#86e3d3' : '#4b8d98'} lineWidth={active || overlay === 'support' ? 1.65 : 0.82} transparent opacity={removed ? 0.16 : active || overlay === 'support' ? 0.88 : 0.56} dashed={removed} dashSize={0.065} gapSize={0.045} depthTest={false} />
      })}
      {[new THREE.Vector3(-0.72, -0.83, 0.12), new THREE.Vector3(0.72, -0.83, 0.12), new THREE.Vector3(0, -0.98, -0.3)].map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshStandardMaterial color={prolapse && index === 0 ? '#72516e' : '#4ea9a7'} emissive={prolapse && index === 0 ? '#442b43' : '#123f44'} emissiveIntensity={0.42} roughness={0.52} />
        </mesh>
      ))}
      {prolapse && <Line points={[pinPosition, new THREE.Vector3(-0.18, -0.64, -0.04)]} color="#d69ac2" lineWidth={1.1} transparent opacity={0.36} dashed dashSize={0.055} gapSize={0.05} depthTest={false} />}
    </group>
  )
}

function CoaptationCue({ phase, prolapse, active, onPin }: { phase: number; prolapse: boolean; active: boolean; onPin: () => void }) {
  const closure = phaseFraction(phase)
  const normalY = -0.13 + closure * 0.3
  const gap = prolapse ? closure * 0.22 : closure < 0.45 ? 0.035 : 0.012
  const points = useMemo(() => [new THREE.Vector3(-0.16, normalY - gap / 2, 0.08), new THREE.Vector3(0.16, normalY + gap / 2, 0.08)], [gap, normalY])
  return (
    <group onClick={event => { event.stopPropagation(); onPin() }}>
      <mesh position={[0, normalY, 0.08]}>
        <sphereGeometry args={[active ? 0.075 : 0.055, 14, 14]} />
        <meshStandardMaterial color={prolapse && closure > 0.35 ? '#f2b261' : '#e4fff5'} emissive={prolapse && closure > 0.35 ? '#6b3e1b' : '#2a6965'} emissiveIntensity={active ? 0.72 : 0.42} roughness={0.3} />
      </mesh>
      <Line points={points} color={prolapse && closure > 0.35 ? '#efb15f' : '#dcfaf1'} lineWidth={active ? 2.4 : 1.15} transparent opacity={active ? 0.98 : 0.74} depthTest={false} />
      {prolapse && closure > 0.35 && <Line points={[new THREE.Vector3(0, normalY - gap * 0.8, 0.09), new THREE.Vector3(0, normalY + gap * 0.8, 0.09)]} color="#efb15f" lineWidth={1.35} transparent opacity={0.92} dashed dashSize={0.04} gapSize={0.03} depthTest={false} />}
    </group>
  )
}

function DeformationCue({ phase }: { phase: number }) {
  const closure = phaseFraction(phase)
  const points = useMemo(() => {
    const tip = leafletPoint(0, phase, true)
    return [new THREE.Vector3(-0.46, 0.13 + closure * 0.05, 0.58), new THREE.Vector3(-0.18, tip.y + 0.1, 0.2), tip.clone().add(new THREE.Vector3(0.18, 0.08, 0.04))]
  }, [closure, phase])
  return <Line points={points} color="#edb45d" lineWidth={2.3} transparent opacity={0.9} depthTest={false} />
}

function PinMarker({ pin, position, active, onPin }: { pin: Valve3DPin; position: THREE.Vector3; active: boolean; onPin: (pin: Valve3DPin) => void }) {
  const select = (event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); onPin(pin) }
  return (
    <group position={position}>
      <mesh onClick={select}>
        <sphereGeometry args={[active ? 0.062 : 0.046, 14, 14]} />
        <meshBasicMaterial color={active ? '#f4d49a' : '#9ee6dc'} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[active ? 0.085 : 0.065, active ? 0.096 : 0.076, 24]} />
        <meshBasicMaterial color={active ? '#f4d49a' : '#70c9c3'} transparent opacity={active ? 0.92 : 0.64} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

function ValveModel({ prolapse, phase, overlay, activePin, onPin }: { prolapse: boolean; phase: number; overlay: Valve3DOverlay; activePin: Valve3DPin; onPin: (pin: Valve3DPin) => void }) {
  const closure = phaseFraction(phase)
  const coaptationY = -0.13 + closure * 0.3
  const leafletPin = leafletPoint(0, phase, prolapse).add(new THREE.Vector3(0.08, 0.11, 0.05))
  const chordaePin = new THREE.Vector3(-0.47, -0.42, -0.06)
  const annulusPin = new THREE.Vector3(1.25, 0.06, 0.12)
  const coaptationPin = new THREE.Vector3(0.05, coaptationY + (prolapse ? closure * 0.05 : 0.04), 0.16)

  return (
    <group>
      <mesh position={[0, -0.02, -0.04]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.53, 64]} />
        <meshBasicMaterial color="#0b2d38" transparent opacity={0.26} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Annulus active={activePin === 'annulus'} onPin={() => onPin('annulus')} />
      {[0, 1, 2].map(index => <Leaflet key={index} index={index} phase={phase} prolapse={prolapse} active={activePin === 'leaflet'} onPin={() => onPin('leaflet')} />)}
      <SupportSystem phase={phase} prolapse={prolapse} overlay={overlay} active={activePin === 'chordae'} onPin={() => onPin('chordae')} />
      <CoaptationCue phase={phase} prolapse={prolapse} active={activePin === 'coaptation'} onPin={() => onPin('coaptation')} />
      {overlay === 'deformation' && prolapse && <DeformationCue phase={phase} />}
      <PinMarker pin="annulus" position={annulusPin} active={activePin === 'annulus'} onPin={onPin} />
      <PinMarker pin="leaflet" position={leafletPin} active={activePin === 'leaflet'} onPin={onPin} />
      <PinMarker pin="chordae" position={chordaePin} active={activePin === 'chordae'} onPin={onPin} />
      <PinMarker pin="coaptation" position={coaptationPin} active={activePin === 'coaptation'} onPin={onPin} />
    </group>
  )
}

function CameraRig({ resetKey, compare, stacked }: { resetKey: number; compare: boolean; stacked: boolean }) {
  const { camera, size } = useThree()
  const controls = useRef<OrbitControlsImpl>(null)
  useEffect(() => {
    const aspect = Math.max(size.width / Math.max(size.height, 1), 0.45)
    const verticalFov = THREE.MathUtils.degToRad(34)
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect)
    // The compare layout spans almost six world units. Fit its horizontal
    // footprint first, then add a small breathing margin for orbiting.
    const requiredWidth = compare ? (stacked ? 2.35 : 5.75) : 3.15
    const widthDistance = requiredWidth / (2 * Math.tan(horizontalFov / 2))
    const heightDistance = (compare ? (stacked ? 4.45 : 2.55) : 2.45) / (2 * Math.tan(verticalFov / 2))
    const distance = Math.max(widthDistance, heightDistance) * 1.12
    camera.position.set(0, stacked ? 0.18 : compare ? 1.18 : 1.0, distance)
    controls.current?.target.set(0, stacked ? 0.05 : -0.06, 0)
    controls.current?.update()
  }, [camera, compare, resetKey, size.height, size.width, stacked])
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.08} minDistance={2.2} maxDistance={14} enablePan={false} rotateSpeed={0.72} />
}

function ValveSceneContent({ mode, phase, overlay, activePin, onPin, resetKey }: Valve3DSceneProps & { resetKey: number }) {
  const { size } = useThree()
  const compare = mode === 'compare'
  const stacked = compare && size.width < 620
  return (
    <>
      <ambientLight intensity={1.15} />
      <directionalLight position={[2.4, 4.2, 4.8]} intensity={2.1} color="#f2ffff" />
      <directionalLight position={[-3.4, 0.5, -2.2]} intensity={1.1} color="#5fbac1" />
      <pointLight position={[0, 1.7, 1.2]} intensity={0.72} color="#b9e7de" distance={7} />
      {compare ? (
        <>
          <group position={stacked ? [0, 1.24, 0] : [-1.57, 0, 0]} scale={stacked ? 0.67 : 0.84}><ValveModel prolapse={false} phase={phase} overlay={overlay} activePin={activePin} onPin={onPin} /></group>
          <group position={stacked ? [0, -1.24, 0] : [1.57, 0, 0]} scale={stacked ? 0.67 : 0.84}><ValveModel prolapse phase={phase} overlay={overlay} activePin={activePin} onPin={onPin} /></group>
        </>
      ) : <ValveModel prolapse={mode === 'prolapse'} phase={phase} overlay={overlay} activePin={activePin} onPin={onPin} />}
      <CameraRig resetKey={resetKey} compare={compare} stacked={stacked} />
    </>
  )
}

export default function Valve3DScene({ mode, phase, overlay, activePin, onPin }: Valve3DSceneProps) {
  const [resetKey, setResetKey] = useState(0)
  const compare = mode === 'compare'
  return (
    <div className="valve-3d-scene">
      <Canvas camera={{ position: [0, 1.05, compare ? 6.5 : 4.4], fov: 34, near: 0.05, far: 30 }} dpr={[1, 1.8]} gl={{ antialias: true, alpha: true }}>
        <ValveSceneContent mode={mode} phase={phase} overlay={overlay} activePin={activePin} onPin={onPin} resetKey={resetKey} />
      </Canvas>
      <div className={`valve-3d-state-labels${compare ? ' is-compare' : ''}`} aria-hidden="true">{compare ? <><span>BÌNH THƯỜNG · NORMAL</span><span className="is-prolapse">SA LÁ VAN · PROLAPSE</span></> : <span className={mode === 'prolapse' ? 'is-prolapse' : ''}>{mode === 'prolapse' ? 'SA LÁ VAN · PROLAPSE' : 'BÌNH THƯỜNG · NORMAL'}</span>}</div>
      <div className="valve-3d-toolbar">
        <span className="valve-3d-hint">Kéo để xoay · Cuộn để zoom</span>
        <button type="button" className="valve-3d-reset" onClick={() => setResetKey(key => key + 1)} aria-label="Đặt lại góc nhìn mô hình van">Đặt lại góc nhìn</button>
      </div>
    </div>
  )
}
