import { Canvas, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { RotateCcw, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import './SurfaceViewer.css'

const SURFACE_URL = '/vmr-0225/surface.bin'
const METADATA_URL = '/vmr-0225/surface.json'

type SurfaceMetadata = Record<string, unknown>

type SurfaceResource = {
  geometry: THREE.BufferGeometry
  vertexCount: number
  indexCount: number
}

type Bounds = {
  min: THREE.Vector3
  max: THREE.Vector3
}

type SurfacePin = {
  id: number
  point: THREE.Vector3
}

const MAX_SURFACE_PINS = 3

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asVector(value: unknown): THREE.Vector3 | null {
  if (Array.isArray(value) && value.length >= 3) {
    const numbers = value.slice(0, 3).map(asNumber)
    if (numbers.every(number => number !== null)) return new THREE.Vector3(numbers[0]!, numbers[1]!, numbers[2]!)
  }

  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>
    const x = asNumber(object.x)
    const y = asNumber(object.y)
    const z = asNumber(object.z)
    if (x !== null && y !== null && z !== null) return new THREE.Vector3(x, y, z)
  }

  return null
}

function boundsFromMetadata(metadata: SurfaceMetadata | null): Bounds | null {
  if (!metadata) return null

  const candidates: unknown[] = [
    metadata.bounds,
    metadata.rawBounds,
    metadata.sourceBounds,
    metadata.boundingBox,
    metadata.viewerBounds,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length >= 6) {
      const values = candidate.slice(0, 6).map(asNumber)
      if (values.every(value => value !== null)) {
        return {
          min: new THREE.Vector3(values[0]!, values[1]!, values[2]!),
          max: new THREE.Vector3(values[3]!, values[4]!, values[5]!),
        }
      }
    }

    if (!candidate || typeof candidate !== 'object') continue
    const object = candidate as Record<string, unknown>
    const min = asVector(object.min ?? object.minimum ?? object.lower)
    const max = asVector(object.max ?? object.maximum ?? object.upper)
    if (min && max) return { min, max }
  }

  // Some converters store center and size instead of explicit min/max bounds.
  const center = asVector(metadata.center)
  const size = asVector(metadata.size)
  if (center && size) {
    const halfSize = size.multiplyScalar(.5)
    return { min: center.clone().sub(halfSize), max: center.clone().add(halfSize) }
  }

  return null
}

function parseSurface(buffer: ArrayBuffer): SurfaceResource {
  if (buffer.byteLength < 8) throw new Error('surface.bin is shorter than its header')

  const header = new DataView(buffer)
  const vertexCount = header.getUint32(0, true)
  const indexCount = header.getUint32(4, true)
  const positionOffset = 8
  const indexOffset = positionOffset + vertexCount * 3 * Float32Array.BYTES_PER_ELEMENT
  const requiredBytes = indexOffset + indexCount * Uint32Array.BYTES_PER_ELEMENT

  if (!vertexCount || !indexCount || indexCount % 3 !== 0) throw new Error('surface.bin has invalid vertex or triangle counts')
  if (!Number.isSafeInteger(requiredBytes) || requiredBytes > buffer.byteLength) throw new Error('surface.bin is truncated')

  const positions = new Float32Array(buffer, positionOffset, vertexCount * 3).slice()
  const indices = new Uint32Array(buffer, indexOffset, indexCount).slice()
  for (const index of indices) {
    if (index >= vertexCount) throw new Error('surface.bin contains an out-of-range triangle index')
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(new THREE.Uint32BufferAttribute(indices, 1))
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()

  return { geometry, vertexCount, indexCount }
}

function metadataLabel(metadata: SurfaceMetadata | null, resource: SurfaceResource | null) {
  const source = metadata?.source
  const sourceName = typeof source === 'string' && source.trim() ? source : 'P001.vtp'
  if (!resource) return sourceName
  return `${sourceName} · ${resource.vertexCount.toLocaleString()} điểm`
}

function CameraRig({ geometry, metadataBounds, resetKey }: { geometry: THREE.BufferGeometry | null; metadataBounds: Bounds | null; resetKey: number }) {
  const { camera, size } = useThree()
  const controls = useRef<OrbitControlsImpl | null>(null)

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return

    const box = geometry?.boundingBox?.clone() ?? (metadataBounds ? new THREE.Box3(metadataBounds.min.clone(), metadataBounds.max.clone()) : null)
    if (!box || box.isEmpty()) return

    const center = box.getCenter(new THREE.Vector3())
    const sphere = box.getBoundingSphere(new THREE.Sphere())
    const radius = Math.max(sphere.radius, .001)
    const verticalFit = radius / Math.tan(THREE.MathUtils.degToRad(camera.fov * .5))
    const aspectFit = size.width > 0 && size.height > 0 ? verticalFit / Math.max(size.width / size.height, .35) : verticalFit
    const distance = Math.max(verticalFit, aspectFit) * 1.32
    const direction = new THREE.Vector3(.72, .42, 1).normalize()

    camera.position.copy(center).addScaledVector(direction, distance)
    camera.near = Math.max(radius / 1000, .001)
    camera.far = Math.max(distance + radius * 5, 20)
    camera.updateProjectionMatrix()
    controls.current?.target.copy(center)
    controls.current?.update()
  }, [camera, geometry, metadataBounds, resetKey, size.height, size.width])

  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.08} minDistance={.05} maxDistance={100} enablePan={false} rotateSpeed={.72} />
}

function SurfaceMesh({ geometry, onPin }: { geometry: THREE.BufferGeometry; onPin: (point: THREE.Vector3) => void }) {
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    // R3F exposes the pointer travel in pixels. Ignore a drag release so orbiting
    // the model does not accidentally leave a probe behind.
    if (event.delta > 4) return
    event.stopPropagation()
    onPin(event.point.clone())
  }

  return <mesh geometry={geometry} castShadow receiveShadow onClick={handleClick}>
    <meshStandardMaterial color="#8bbec7" roughness={.44} metalness={.06} side={THREE.DoubleSide} />
  </mesh>
}

function SurfacePinMarker({ point, number, radius, selected, onSelect }: { point: THREE.Vector3; number: number; radius: number; selected: boolean; onSelect: () => void }) {
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onSelect()
  }

  return <group position={point} renderOrder={2}>
    <mesh onClick={handleClick}>
      <sphereGeometry args={[radius * (selected ? 1.3 : 1), 16, 10]} />
      <meshBasicMaterial color={selected ? '#fff1b0' : '#f7c76a'} depthTest={false} depthWrite={false} toneMapped={false} />
    </mesh>
    <Html center position={[0, radius * 2.4, 0]} distanceFactor={8} style={{ pointerEvents: 'none' }}>
      <span className={`surface-viewer__pin-badge${selected ? ' is-selected' : ''}`} aria-hidden="true">{number}</span>
    </Html>
  </group>
}

function formatCoordinate(value: number) {
  const rounded = Math.abs(value) < .0005 ? 0 : value
  return rounded.toFixed(3)
}

function pinCoordinates(pin: SurfacePin) {
  return `x ${formatCoordinate(pin.point.x)} · y ${formatCoordinate(pin.point.y)} · z ${formatCoordinate(pin.point.z)}`
}

export default function SurfaceViewer({ active = true }: { active?: boolean }) {
  const [resource, setResource] = useState<SurfaceResource | null>(null)
  const [metadata, setMetadata] = useState<SurfaceMetadata | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [pins, setPins] = useState<SurfacePin[]>([])
  const [selectedPinId, setSelectedPinId] = useState<number | null>(null)
  const [pinNotice, setPinNotice] = useState<string | null>(null)
  const nextPinId = useRef(1)

  useEffect(() => {
    const controller = new AbortController()
    let mounted = true

    async function load() {
      try {
        const surfaceResponse = await fetch(SURFACE_URL, { signal: controller.signal })
        if (!surfaceResponse.ok) throw new Error(`Surface request failed (${surfaceResponse.status})`)
        const buffer = await surfaceResponse.arrayBuffer()
        const nextResource = parseSurface(buffer)

        let nextMetadata: SurfaceMetadata | null = null
        try {
          const metadataResponse = await fetch(METADATA_URL, { signal: controller.signal })
          if (metadataResponse.ok) {
            const payload: unknown = await metadataResponse.json()
            if (payload && typeof payload === 'object' && !Array.isArray(payload)) nextMetadata = payload as SurfaceMetadata
          }
        } catch (metadataError) {
          if (metadataError instanceof DOMException && metadataError.name === 'AbortError') throw metadataError
        }

        if (!mounted) {
          nextResource.geometry.dispose()
          return
        }
        setResource(nextResource)
        setMetadata(nextMetadata)
        setError(null)
      } catch (loadError) {
        if (!mounted || (loadError instanceof DOMException && loadError.name === 'AbortError')) return
        setError(loadError instanceof Error ? loadError.message : 'Không thể tải bề mặt P001.vtp')
      }
    }

    void load()
    return () => {
      mounted = false
      controller.abort()
    }
  }, [])

  useEffect(() => () => resource?.geometry.dispose(), [resource])

  const metadataBounds = useMemo(() => boundsFromMetadata(metadata), [metadata])
  const label = metadataLabel(metadata, resource)
  const pinRadius = Math.max(resource?.geometry.boundingSphere?.radius ?? .5, .001) * .018

  function addPin(point: THREE.Vector3) {
    if (pins.length >= MAX_SURFACE_PINS) {
      setPinNotice('Đã đủ 3 điểm · xoá một điểm để ghim vị trí mới')
      return
    }

    const id = nextPinId.current
    nextPinId.current += 1
    setPins(current => [...current, { id, point }])
    setSelectedPinId(id)
    setPinNotice(null)
  }

  function removePin(id: number) {
    const remaining = pins.filter(pin => pin.id !== id)
    setPins(remaining)
    setSelectedPinId(current => current === id ? (remaining[0]?.id ?? null) : current)
    setPinNotice(null)
  }

  function clearPins() {
    setPins([])
    setSelectedPinId(null)
    setPinNotice(null)
  }

  return <section className={`surface-viewer${active ? '' : ' surface-viewer--inactive'}`} aria-label="Bề mặt mạch nguồn P001.vtp">
    <div className="surface-viewer__canvas">
      {resource && <Canvas frameloop={active ? 'always' : 'demand'} camera={{ position: [0, 0, 3], fov: 34, near: .01, far: 100 }} dpr={[1, 1.8]} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={['#0c1821']} />
        <ambientLight intensity={1.15} />
        <directionalLight position={[2.8, 3.5, 4]} intensity={2.4} color="#f5fdff" castShadow />
        <directionalLight position={[-3, -1, -2]} intensity={.9} color="#65b4c1" />
        <SurfaceMesh geometry={resource.geometry} onPin={addPin} />
        {pins.map((pin, index) => <SurfacePinMarker key={pin.id} point={pin.point} number={index + 1} radius={pinRadius} selected={pin.id === selectedPinId} onSelect={() => setSelectedPinId(pin.id)} />)}
        <CameraRig geometry={resource.geometry} metadataBounds={metadataBounds} resetKey={resetKey} />
      </Canvas>}
      {!resource && !error && <div className="surface-viewer__message" role="status">Đang tải bề mặt P001.vtp…</div>}
      {error && <div className="surface-viewer__message surface-viewer__message--error" role="alert">Không thể tải bề mặt P001.vtp.</div>}
      <div className="surface-viewer__hud" aria-live="polite">
        <span className="surface-viewer__live-dot" />
        <span>SOURCE SURFACE</span>
        <i />
        <span>{label}</span>
      </div>
      <button type="button" className="surface-viewer__reset" onClick={() => setResetKey(value => value + 1)} aria-label="Đặt lại góc nhìn bề mặt" title="Đặt lại góc nhìn">
        <RotateCcw size={14} aria-hidden="true" />
        <span>Đặt lại góc nhìn</span>
      </button>
      <aside className="surface-viewer__pin-panel" aria-label="Điểm ghim hình học" aria-live="polite">
        <div className="surface-viewer__pin-heading">
          <span className="surface-viewer__pin-marker" aria-hidden="true" />
          <span>ĐIỂM GHIM HÌNH HỌC</span>
          <strong>{pins.length}/{MAX_SURFACE_PINS}</strong>
        </div>
        <span className="surface-viewer__pin-space">VIEWER-SPACE · NORMALIZED</span>
        {pins.length ? <ol className="surface-viewer__pin-list">
          {pins.map((pin, index) => <li key={pin.id} className={`surface-viewer__pin-row${pin.id === selectedPinId ? ' is-selected' : ''}`}>
            <button type="button" className="surface-viewer__pin-select" onClick={() => setSelectedPinId(pin.id)} aria-pressed={pin.id === selectedPinId}>
              <span className="surface-viewer__pin-number" aria-hidden="true">{index + 1}</span>
              <span className="surface-viewer__pin-row-content">
                <strong>Điểm {index + 1}</strong>
                <code>{pinCoordinates(pin)}</code>
              </span>
            </button>
            <button type="button" className="surface-viewer__pin-remove" onClick={() => removePin(pin.id)} aria-label={`Xoá điểm ghim ${index + 1}`} title="Xoá điểm này">
              <X size={12} aria-hidden="true" />
            </button>
          </li>)}
        </ol> : <p className="surface-viewer__pin-empty">Nhấp lên bề mặt để ghim tối đa 3 điểm. Kéo để xoay, cuộn để zoom.</p>}
        {pinNotice && <p className="surface-viewer__pin-notice" role="status">{pinNotice}</p>}
        <p className="surface-viewer__pin-disclaimer">Tọa độ chỉ mô tả hình học đã chuẩn hóa; không có FFRCT, áp lực hoặc xếp hạng tổn thương tại điểm.</p>
        {pins.length > 0 && <button type="button" className="surface-viewer__pin-clear" onClick={clearPins}>Xoá tất cả điểm</button>}
      </aside>
    </div>
  </section>
}
