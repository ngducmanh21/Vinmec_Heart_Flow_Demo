import { Canvas, ThreeEvent, useFrame } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import { Activity, AlertTriangle, ExternalLink, MousePointer2, Rotate3D, RotateCcw, Target } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  DEMO_CASE,
  DEMO_LESIONS,
  DEMO_PLAQUE_TOTAL_MM3,
  getDemoLesion,
  type DemoLesion,
  type LesionSelectionProps,
} from './coronaryDemoData'
import './CoronaryPhysiologyDemo.css'

type BranchSpec = {
  id: DemoLesion['branch']
  label: string
  lesionT: number
  path: readonly [number, number, number][]
}

const BRANCH_SPECS: readonly BranchSpec[] = [
  {
    id: 'lad',
    label: 'LAD',
    lesionT: .56,
    path: [
      [0, .02, .02], [-.08, .19, .04], [-.11, .42, .02], [-.14, .67, .03], [-.20, .91, .08], [-.31, 1.13, .10], [-.37, 1.34, .04],
    ],
  },
  {
    id: 'lcx',
    label: 'LCx',
    lesionT: .42,
    path: [
      [0, .02, .02], [.20, .05, .03], [.41, .02, .05], [.63, -.05, .04], [.85, -.18, .08], [1.02, -.38, .13], [1.10, -.59, .08],
    ],
  },
  {
    id: 'rca',
    label: 'RCA',
    lesionT: .52,
    path: [
      [-.15, -.08, -.04], [-.36, -.18, -.02], [-.58, -.34, .02], [-.77, -.53, .07], [-.83, -.74, .11], [-.74, -.95, .08], [-.56, -1.10, .02],
    ],
  },
]

const TRUNK_PATH: readonly [number, number, number][] = [
  [-.15, -.08, -.04], [-.11, -.01, -.01], [-.03, .02, .02], [0, .02, .02],
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function ratioColor(ratio: number) {
  if (ratio < .8) return '#ef8b78'
  if (ratio < .88) return '#e5c46b'
  return '#61d1c0'
}

function ratioLabel(ratio: number) {
  if (ratio < .8) return 'thấp hơn trong preset'
  if (ratio < .88) return 'trung gian trong preset'
  return 'cao hơn trong preset'
}

function makeCurve(points: readonly [number, number, number][]) {
  return new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)), false, 'catmullrom', .22)
}

function makeSubCurve(curve: THREE.CatmullRomCurve3, start: number, end: number) {
  const samples = 28
  const points = Array.from({ length: samples + 1 }, (_, index) => curve.getPointAt(start + ((end - start) * index) / samples))
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', .1)
}

function FlowDots({ curve, color }: { curve: THREE.CatmullRomCurve3; color: string }) {
  const dots = useRef<Array<THREE.Mesh | null>>([])

  useFrame(({ clock }) => {
    dots.current.forEach((dot, index) => {
      if (!dot) return
      const t = (clock.getElapsedTime() * .075 + index * .26) % 1
      dot.position.copy(curve.getPointAt(t))
    })
  })

  return (
    <group>
      {[0, 1, 2].map(index => (
        <mesh key={index} ref={node => { dots.current[index] = node }}>
          <sphereGeometry args={[.024, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={.9} />
        </mesh>
      ))}
    </group>
  )
}

function LesionPin({
  lesion,
  position,
  selected,
  onSelect,
}: {
  lesion: DemoLesion
  position: THREE.Vector3
  selected: boolean
  onSelect: (id: DemoLesion['id']) => void
}) {
  const group = useRef<THREE.Group>(null)
  const pinColor = selected ? '#ffbd73' : '#ee9b7c'

  useFrame(({ clock }) => {
    if (!group.current) return
    const pulse = selected ? 1 + Math.sin(clock.getElapsedTime() * 3.5) * .08 : 1
    group.current.scale.setScalar(pulse)
  })

  function select(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation()
    onSelect(lesion.id)
  }

  return (
    <group
      ref={group}
      position={position}
      onClick={select}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = '' }}
    >
      <mesh>
        <sphereGeometry args={[selected ? .075 : .06, 18, 18]} />
        <meshBasicMaterial color={pinColor} transparent opacity={.95} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[selected ? .13 : .095, .012, 10, 32]} />
        <meshBasicMaterial color={pinColor} transparent opacity={selected ? .9 : .55} />
      </mesh>
    </group>
  )
}

function CoronaryBranch({
  spec,
  lesion,
  selected,
  onSelect,
}: {
  spec: BranchSpec
  lesion: DemoLesion
  selected: boolean
  onSelect: (id: DemoLesion['id']) => void
}) {
  const curves = useMemo(() => {
    const whole = makeCurve(spec.path)
    const lesionStart = clamp(spec.lesionT - .045, .05, .92)
    const lesionEnd = clamp(spec.lesionT + .045, .08, .97)
    return {
      whole,
      proximal: makeSubCurve(whole, 0, lesionStart),
      lesion: makeSubCurve(whole, lesionStart, lesionEnd),
      distal: makeSubCurve(whole, lesionEnd, 1),
      marker: whole.getPointAt(spec.lesionT),
    }
  }, [spec])
  const distalColor = ratioColor(lesion.distalRatio)

  function pickBranch(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation()
    onSelect(lesion.id)
  }

  return (
    <group>
      <mesh onClick={pickBranch}>
        <tubeGeometry args={[curves.proximal, 30, .052, 10, false]} />
        <meshStandardMaterial color="#70b8bc" roughness={.44} metalness={.06} />
      </mesh>
      <mesh onClick={pickBranch}>
        <tubeGeometry args={[curves.lesion, 16, .058, 10, false]} />
        <meshStandardMaterial color="#db8d75" roughness={.4} metalness={.05} emissive="#4a1e1e" emissiveIntensity={.35} />
      </mesh>
      <mesh onClick={pickBranch}>
        <tubeGeometry args={[curves.distal, 34, .046, 10, false]} />
        <meshStandardMaterial color={distalColor} roughness={.4} metalness={.06} emissive={distalColor} emissiveIntensity={selected ? .2 : .06} />
      </mesh>
      <FlowDots curve={curves.whole} color={distalColor} />
      <LesionPin lesion={lesion} position={curves.marker} selected={selected} onSelect={onSelect} />
    </group>
  )
}

function CoronaryTree({ selectedLesionId, onSelectLesion, resetKey }: LesionSelectionProps & { resetKey: number }) {
  const trunk = useMemo(() => makeCurve(TRUNK_PATH), [])
  const origin = useMemo(() => new THREE.Vector3(-.02, .02, .02), [])

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[2, 3, 4]} intensity={2.2} color="#effdff" />
      <directionalLight position={[-3, -2, 1]} intensity={1.15} color="#68b9d3" />
      <mesh>
        <tubeGeometry args={[trunk, 24, .073, 12, false]} />
        <meshStandardMaterial color="#8ac9c6" roughness={.35} metalness={.08} />
      </mesh>
      <mesh position={origin}>
        <sphereGeometry args={[.1, 18, 18]} />
        <meshStandardMaterial color="#b7ede0" emissive="#459d9b" emissiveIntensity={.45} roughness={.26} />
      </mesh>
      {BRANCH_SPECS.map(spec => {
        const lesion = getDemoLesion(spec.id === 'lad' ? 'L1' : spec.id === 'lcx' ? 'L2' : 'L3')
        return <CoronaryBranch key={spec.id} spec={spec} lesion={lesion} selected={selectedLesionId === lesion.id} onSelect={onSelectLesion} />
      })}
      <Line points={[[0, -.03, -.01], [0, .02, .02]]} color="#d7f5ec" transparent opacity={.5} lineWidth={1} />
      <OrbitControls
        key={resetKey}
        makeDefault
        enableDamping
        dampingFactor={.08}
        enablePan={false}
        minDistance={2.25}
        maxDistance={5.3}
        minPolarAngle={.35}
        maxPolarAngle={2.7}
        target={[0, .06, 0]}
      />
    </>
  )
}

function RatioLegend() {
  return (
    <div className="coronary-physiology-demo__legend" aria-label="Chú giải màu tỷ lệ hạ lưu giả lập">
      <span className="coronary-physiology-demo__legend-title">TỶ LỆ HẠ LƯU · PRESET</span>
      <span><i style={{ background: '#61d1c0' }} /> 0.88–1.00</span>
      <span><i style={{ background: '#e5c46b' }} /> 0.80–0.87</span>
      <span><i style={{ background: '#ef8b78' }} /> &lt; 0.80</span>
    </div>
  )
}

export default function CoronaryPhysiologyDemo({ selectedLesionId, onSelectLesion }: LesionSelectionProps) {
  const [resetKey, setResetKey] = useState(0)
  const selected = getDemoLesion(selectedLesionId)
  const rankedLesions = useMemo(() => [...DEMO_LESIONS].sort((a, b) => b.severityPct - a.severityPct), [])

  return (
    <section className="coronary-physiology-demo" aria-labelledby="coronary-physiology-title">
      <header className="coronary-physiology-demo__header">
        <div>
          <div className="coronary-physiology-demo__eyebrow"><span aria-hidden="true" /><Activity size={14} /> CORONARY PHYSIOLOGY · INTERACTIVE MODEL</div>
          <h2 id="coronary-physiology-title">Cây mạch vành giả lập, từ nhánh đến hạ lưu</h2>
          <p>Chọn một ghim để xem cách một tổn thương được đọc theo đầu gần, hạ lưu và mức độ hẹp trong bộ dữ liệu trình diễn.</p>
        </div>
        <div className="coronary-physiology-demo__badge"><strong>{DEMO_CASE.id}</strong><span>DỮ LIỆU GIẢ LẬP</span></div>
      </header>

      <div className="coronary-physiology-demo__notice">
        <AlertTriangle size={15} aria-hidden="true" />
        <p><strong>Preset để showcase tương tác.</strong> Hình học, màu nhánh và các tỷ lệ đều là dữ liệu tổng hợp; không có CCTA/CFD/FFR_CT nào được tính, không phải ca 0225 và không dùng cho chẩn đoán.</p>
      </div>

      <div className="coronary-physiology-demo__workspace">
        <div className="coronary-physiology-demo__visual-card">
          <div className="coronary-physiology-demo__visual-head">
            <span><i aria-hidden="true" /> CÂY MẠCH VÀNH · PROCEDURAL VIEW</span>
            <span><Rotate3D size={13} /> kéo để xoay · cuộn để zoom</span>
          </div>
          <div className="coronary-physiology-demo__canvas-wrap" role="img" aria-label="Cây mạch vành giả lập 3D với ba ghim tổn thương có thể chọn">
            <Canvas camera={{ position: [0, .32, 3.4], fov: 34, near: .1, far: 20 }} dpr={[1, 1.7]} gl={{ antialias: true, alpha: true }}>
              <color attach="background" args={['#071d2a']} />
              <CoronaryTree selectedLesionId={selectedLesionId} onSelectLesion={onSelectLesion} resetKey={resetKey} />
            </Canvas>
            <div className="coronary-physiology-demo__canvas-hint"><MousePointer2 size={12} /> Chọn ghim trên cây mạch hoặc danh sách bên cạnh</div>
          </div>
          <RatioLegend />
        </div>

        <aside className="coronary-physiology-demo__side" aria-label="Bảng dữ liệu mô phỏng mạch vành">
          <div className="coronary-physiology-demo__side-section coronary-physiology-demo__selected-card">
            <div className="coronary-physiology-demo__section-kicker"><Target size={13} /> TỔN THƯƠNG ĐANG CHỌN</div>
            <div className="coronary-physiology-demo__selected-title"><div><span>{selected.id} · {selected.branchLabel}</span><strong>{selected.location}</strong></div><b>{selected.severityPct}%</b></div>
            <div className="coronary-physiology-demo__ratio-grid">
              <div><span>ĐẦU GẦN · PRESET</span><strong>{selected.proximalRatio.toFixed(2)}</strong><small>mốc quy ước</small></div>
              <div><span>HẠ LƯU · PRESET</span><strong style={{ color: ratioColor(selected.distalRatio) }}>{selected.distalRatio.toFixed(2)}</strong><small>{ratioLabel(selected.distalRatio)}</small></div>
            </div>
            <p className="coronary-physiology-demo__microcopy">Hai tỷ lệ là giá trị dựng sẵn để minh họa cách đọc chênh lệch theo nhánh; không phải FFR_CT.</p>
          </div>

          <div className="coronary-physiology-demo__side-section">
            <div className="coronary-physiology-demo__section-kicker"><Activity size={13} /> XẾP HẠNG TỔN THƯƠNG</div>
            <div className="coronary-physiology-demo__lesion-list">
              {rankedLesions.map((lesion, index) => (
                <button key={lesion.id} type="button" className={selected.id === lesion.id ? 'is-selected' : ''} aria-pressed={selected.id === lesion.id} onClick={() => onSelectLesion(lesion.id)}>
                  <span className="coronary-physiology-demo__rank">0{index + 1}</span>
                  <span className="coronary-physiology-demo__lesion-copy"><strong>{lesion.id} · {lesion.branchLabel}</strong><small>{lesion.location} · {lesion.lengthMm} mm</small></span>
                  <span className="coronary-physiology-demo__lesion-value"><b>{lesion.severityPct}%</b><i style={{ background: ratioColor(lesion.distalRatio) }} /></span>
                </button>
              ))}
            </div>
          </div>

          <div className="coronary-physiology-demo__side-section coronary-physiology-demo__detail-grid">
            <div><span>MẢNG BÁM · PRESET</span><strong>{selected.plaqueMm3.nonCalcified + selected.plaqueMm3.calcified + selected.plaqueMm3.lowAttenuation} mm³</strong><small>tổn thương đang chọn</small></div>
            <div><span>TỔNG MẢNG BÁM</span><strong>{DEMO_PLAQUE_TOTAL_MM3} mm³</strong><small>ba preset cộng lại</small></div>
          </div>

          <div className="coronary-physiology-demo__side-section coronary-physiology-demo__plan-card">
            <div><span>GỢI Ý LẬP KẾ HOẠCH · GIẢ LẬP</span><strong>Landing zone {selected.planning.landingZoneMm} mm</strong><small>{selected.planning.cArmAngle}</small></div>
            <button type="button" onClick={() => setResetKey(value => value + 1)} title="Đặt lại góc nhìn 3D"><RotateCcw size={14} /> Đặt lại góc nhìn</button>
          </div>
        </aside>
      </div>

      <footer className="coronary-physiology-demo__footer">
        <span>SIM-COR-01 · {DEMO_CASE.modality}</span>
        <a href="https://www.heartflow.com/heartflow-one/ffrct-analysis/" target="_blank" rel="noreferrer">Tham khảo kiểu tương tác HeartFlow <ExternalLink size={12} /></a>
      </footer>
    </section>
  )
}
