import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Layers3,
  Pause,
  Play,
  RotateCcw,
  ScanLine,
  Sparkles,
  Workflow,
} from 'lucide-react'
import './ImageStackDemo.css'

// Keep the Three.js viewer behind a lazy boundary. The image stack is useful
// on its own and should not make the initial page pay for the 3D bundle.
const SurfaceViewer = lazy(() => import('./SurfaceViewer'))
const CTCanvas = lazy(() => import('./CTCanvas'))
const Vessel3D = lazy(() => import('./Vessel3D'))

type Slice = {
  file: string
  index: number
  rawZ?: number
  z?: number
  label?: string
}

type SliceManifest = {
  slices?: Slice[]
  defaultIndex?: number
  defaultSlice?: number
}

export type ImageStackStage = 'stack' | 'segmentation' | 'model'
export type ImageStackSource = 'mr-0225' | 'ct-p3'

export type ImageStackDemoProps = {
  /** Open the demo at a particular workflow stage. */
  initialStage?: ImageStackStage
  /** Render the real P001 surface when the model stage is selected. */
  showSurface?: boolean
  /** Select the evidence set. CT P-3 is a separate 0227 case from MR 0225. */
  initialSource?: ImageStackSource
  /** Optional hook for a parent flow to observe the current stage. */
  onStageChange?: (stage: ImageStackStage) => void
  className?: string
}

const FALLBACK_SLICES: Slice[] = [80, 88, 96, 104, 112, 120, 128, 136, 144, 152, 160, 168, 176, 184, 192, 200].map(index => ({
  file: `slices/mr-${String(index).padStart(3, '0')}.png`,
  index,
}))

const STAGES: Array<{
  id: ImageStackStage
  number: string
  label: string
  title: string
  short: string
}> = [
  { id: 'stack', number: '01', label: 'INPUT VOLUME', title: 'Xếp chồng các lát ảnh', short: 'm × n pixels · k layers' },
  { id: 'segmentation', number: '02', label: 'SEGMENTATION', title: 'Tách cấu trúc cần dựng', short: 'CT contour / MR còn thiếu' },
  { id: 'model', number: '03', label: 'MODEL BUILD', title: 'Dựng model để kiểm tra', short: 'P007 / P001 · xoay để xem' },
]

function imagePath(file: string) {
  if (file.startsWith('/')) return file
  return file.startsWith('vmr-0225/') ? `/${file}` : `/vmr-0225/${file}`
}

function sliceZ(slice?: Slice) {
  const value = slice?.rawZ ?? slice?.z
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : '—'
}

function stageIndex(stage: ImageStackStage) {
  return STAGES.findIndex(item => item.id === stage)
}

function StageRail({ stage, onChange }: { stage: ImageStackStage; onChange: (stage: ImageStackStage) => void }) {
  return (
    <nav className="image-stack-demo__rail" aria-label="Các bước mô phỏng từ volume đến model">
      {STAGES.map((item, index) => {
        const active = item.id === stage
        const passed = stageIndex(stage) > index
        return (
          <div className="image-stack-demo__rail-item" key={item.id}>
            <button
              type="button"
              className={`image-stack-demo__rail-button${active ? ' is-active' : ''}${passed ? ' is-passed' : ''}`}
              aria-current={active ? 'step' : undefined}
              onClick={() => onChange(item.id)}
            >
              <span className="image-stack-demo__rail-number">{passed ? <Check size={13} /> : item.number}</span>
              <span className="image-stack-demo__rail-copy">
                <small>{item.label}</small>
                <strong>{item.title}</strong>
                <em>{item.short}</em>
              </span>
            </button>
            {index < STAGES.length - 1 && <ArrowRight className="image-stack-demo__rail-arrow" size={14} aria-hidden="true" />}
          </div>
        )
      })}
    </nav>
  )
}

function SliceDeck({
  slices,
  selected,
  onSelect,
}: {
  slices: Slice[]
  selected: number
  onSelect: (index: number) => void
}) {
  const visible = useMemo(() => {
    if (!slices.length) return []
    return [-2, -1, 0, 1, 2].map(offset => {
      const index = Math.min(slices.length - 1, Math.max(0, selected + offset))
      return { slice: slices[index], index, offset }
    })
  }, [selected, slices])

  return (
    <div className="image-stack-demo__deck" aria-label="Các lát MR được xếp chồng">
      <div className="image-stack-demo__deck-grid" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      {visible.map(({ slice, index, offset }) => {
        const isActive = index === selected
        const z = Math.abs(offset)
        return (
          <button
            type="button"
            key={`${slice.index}-${offset}`}
            className={`image-stack-demo__slice-card${isActive ? ' is-active' : ''}${offset < 0 ? ' is-before' : ''}${offset > 0 ? ' is-after' : ''}`}
            style={{
              transform: `translate(-50%, -50%) translate(${offset * 30}px, ${offset * -14}px) rotate(${offset * 1.6}deg) scale(${1 - z * .055})`,
              zIndex: 10 - z,
            }}
            onClick={() => onSelect(index)}
            aria-label={`Chọn lát MR ${slice.index}`}
          >
            <img src={imagePath(slice.file)} alt="" draggable="false" />
            <span className="image-stack-demo__slice-shade" />
            <span className="image-stack-demo__slice-tag">{isActive ? `SLICE ${slice.index}` : slice.index}</span>
          </button>
        )
      })}
      <div className="image-stack-demo__deck-caption">
        <span><Layers3 size={13} /> MR source stack</span>
        <strong>{slices.length ? `${selected + 1} / ${slices.length}` : '—'}</strong>
      </div>
    </div>
  )
}

function SliceControls({
  slices,
  selected,
  playing,
  onSelect,
  onPlaying,
}: {
  slices: Slice[]
  selected: number
  playing: boolean
  onSelect: (index: number) => void
  onPlaying: (playing: boolean) => void
}) {
  const current = slices[selected]
  return (
    <div className="image-stack-demo__slice-controls">
      <button type="button" className="image-stack-demo__icon-button" disabled={selected === 0} onClick={() => onSelect(Math.max(0, selected - 1))} aria-label="Lát trước"><ChevronLeft size={16} /></button>
      <div className="image-stack-demo__range-wrap">
        <div className="image-stack-demo__range-label"><span>Duyệt volume MR</span><strong>{current ? `slice ${current.index} · z ${sliceZ(current)}` : 'Đang tải…'}</strong></div>
        <input type="range" min="0" max={Math.max(0, slices.length - 1)} value={selected} disabled={!slices.length} onChange={event => onSelect(Number(event.target.value))} aria-label="Chọn lát MR trong volume" />
      </div>
      <button type="button" className="image-stack-demo__icon-button" disabled={selected >= slices.length - 1} onClick={() => onSelect(Math.min(slices.length - 1, selected + 1))} aria-label="Lát tiếp"><ChevronRight size={16} /></button>
      <button type="button" className={`image-stack-demo__play-button${playing ? ' is-playing' : ''}`} onClick={() => onPlaying(!playing)} aria-pressed={playing}>
        {playing ? <Pause size={14} /> : <Play size={14} />}<span>{playing ? 'Dừng' : 'Tự chạy'}</span>
      </button>
    </div>
  )
}

function SegmentationLegend({ verified = false }: { verified?: boolean }) {
  return (
    <div className="image-stack-demo__legend" aria-label={verified ? 'Chú giải contour CT đã cung cấp' : 'Chú giải phân đoạn minh họa'}>
      <span><i className="is-outline" /> {verified ? 'contour asset' : 'contour concept'}</span>
      <span><i className="is-fill" /> {verified ? 'vùng đã có trong repo' : 'vùng quan tâm'}</span>
      <span><i className="is-dash" /> {verified ? 'đối chiếu với P007' : 'bước cần xác thực'}</span>
    </div>
  )
}

function CTStage({ stage, slice, onSlice }: { stage: 'stack' | 'segmentation'; slice: number; onSlice: (value: number) => void }) {
  const masked = stage === 'segmentation'
  return (
    <div className="image-stack-demo__ct-stage">
      <div className="image-stack-demo__ct-viewer">
        <Suspense fallback={<div className="image-stack-demo__viewer-loading"><span className="image-stack-demo__spinner" />Đang tải CT P-3/0227…</div>}>
          <CTCanvas slice={slice} windowWidth={700} onSlice={onSlice} mode={masked ? 'overlay' : 'ct'} />
        </Suspense>
        <div className="image-stack-demo__ct-badge"><span>{masked ? 'CT + CONTOUR OVERLAY' : 'CT SOURCE'}</span><strong>0227_H_AO_COA · {masked ? 'validated asset' : '9 exported slices'}</strong></div>
      </div>
      <div className="image-stack-demo__ct-controls">
        <button type="button" className="image-stack-demo__icon-button" disabled={slice === 0} onClick={() => onSlice(Math.max(0, slice - 1))} aria-label="CT slice trước"><ChevronLeft size={16} /></button>
        <label><span>{masked ? 'Duyệt contour theo lát CT' : 'Duyệt stack CT'}</span><strong>slice index {680 + slice * 10}</strong><input type="range" min="0" max="8" value={slice} onChange={event => onSlice(Number(event.target.value))} aria-label="Chọn lát CT P-3" /></label>
        <button type="button" className="image-stack-demo__icon-button" disabled={slice === 8} onClick={() => onSlice(Math.min(8, slice + 1))} aria-label="CT slice tiếp"><ChevronRight size={16} /></button>
      </div>
      {masked && <SegmentationLegend verified />}
    </div>
  )
}

function ModelStage({ showSurface, source, ctSlice, onCtSelect, modelResetKey }: { showSurface: boolean; source: ImageStackSource; ctSlice: number; onCtSelect: (value: number) => void; modelResetKey: number }) {
  const isCt = source === 'ct-p3'
  return (
    <div className="image-stack-demo__model-stage">
      <div className="image-stack-demo__model-viewer">
        {isCt ? (
          <Suspense fallback={<div className="image-stack-demo__viewer-loading"><span className="image-stack-demo__spinner" />Đang tải P007 mesh…</div>}>
            <Vessel3D flow={false} selectedT={.52} onSelect={() => undefined} resetKey={modelResetKey} interactive centerline segmentationView showSlicePlane sliceIndex={ctSlice} />
          </Suspense>
        ) : showSurface ? (
          <Suspense fallback={<div className="image-stack-demo__viewer-loading"><span className="image-stack-demo__spinner" />Đang tải surface P001…</div>}>
            <SurfaceViewer active />
          </Suspense>
        ) : (
          <div className="image-stack-demo__model-placeholder" aria-label="Minh họa bề mặt mạch">
            <svg viewBox="0 0 640 350" role="img" aria-label="Bề mặt mạch minh họa"><path d="M38 214 C143 214 161 180 244 182 C322 185 316 126 380 126 C452 126 451 196 528 197 C567 198 587 180 610 180" fill="none" stroke="#79c4c4" strokeWidth="55" strokeLinecap="round" /><path d="M38 214 C143 214 161 180 244 182 C322 185 316 126 380 126 C452 126 451 196 528 197 C567 198 587 180 610 180" fill="none" stroke="#163d4a" strokeWidth="45" strokeLinecap="round" /><path d="M38 214 C143 214 161 180 244 182 C322 185 316 126 380 126 C452 126 451 196 528 197 C567 198 587 180 610 180" fill="none" stroke="#d4eee9" strokeOpacity=".5" strokeWidth="2" strokeDasharray="2 10" /></svg>
            <span>Surface P001 · preview</span>
          </div>
        )}
      </div>
      <aside className="image-stack-demo__model-facts">
        <div className="image-stack-demo__fact-kicker"><Boxes size={14} /> MODEL EVIDENCE</div>
        <h3>{isCt ? 'P007 model từ CT contours' : 'P001 surface để xoay'}</h3>
        <p>{isCt ? 'Ca CT P-3/0227 có contours và mesh P007 đã được đối chiếu trong repo. Đây là ví dụ CT→mask→3D riêng, không phải ca MR 0225.' : 'P001 là bề mặt dùng trong video CFD của ca MR 0225. Viewer cho phép kéo để xoay; liên hệ không gian với MR vẫn được giữ là câu hỏi cần xác thực.'}</p>
        <div className="image-stack-demo__fact-grid">{isCt ? <><span><small>case</small><strong>0227_H_AO_COA</strong></span><span><small>source</small><strong>P007.vtp</strong></span><span><small>link</small><strong>CT contours</strong></span><span><small>status</small><strong>verified</strong></span></> : <><span><small>surface</small><strong>P001.vtp</strong></span><span><small>vertices</small><strong>25,108</strong></span><span><small>triangles</small><strong>50,212</strong></span><span><small>relation</small><strong>display only</strong></span></>}</div>
        {isCt ? <div className="image-stack-demo__notice image-stack-demo__notice--teal"><Check size={15} /><span>CT contours, P007 mesh và slice index dùng cùng bộ asset P-3.</span></div> : <div className="image-stack-demo__notice image-stack-demo__notice--amber"><AlertTriangle size={15} /><span>Không hiển thị MR phủ lên P001: manifest ghi rõ chưa có registration MR–P001.</span></div>}
        {isCt && <label className="image-stack-demo__ct-model-slider"><span>Slice plane · CT {ctSlice + 1} / 9</span><input type="range" min="0" max="8" value={ctSlice} onChange={event => onCtSelect(Number(event.target.value))} aria-label="Chọn slice plane CT cho model P007" /></label>}
      </aside>
    </div>
  )
}

function StageIntro({ stage }: { stage: ImageStackStage }) {
  const item = STAGES.find(value => value.id === stage) ?? STAGES[0]
  return (
    <div className="image-stack-demo__stage-heading">
      <div><span className="image-stack-demo__eyebrow"><Sparkles size={13} /> BƯỚC {item.number}</span><h2>{item.title}</h2></div>
      <p>{stage === 'stack' && 'Một volume gồm nhiều ảnh 2D. Kéo qua các lát để thấy ý tưởng “k layers stack on top of each other”.'}{stage === 'segmentation' && 'Contour được đặt lên lát ảnh để minh họa bước tách cấu trúc trước khi dựng model. Nhánh CT dùng contour đã có trong repo; nhánh MR chỉ là workflow concept.'}{stage === 'model' && 'Từ contour đã xác thực có thể dựng surface CAD/3D để kiểm tra hình học. Chọn nguồn ở dưới để xem đúng case và đúng asset.'}</p>
    </div>
  )
}

export default function ImageStackDemo({ initialStage = 'stack', showSurface = true, initialSource = 'ct-p3', onStageChange, className = '' }: ImageStackDemoProps) {
  const [stage, setStageState] = useState<ImageStackStage>(initialStage)
  const [source, setSource] = useState<ImageStackSource>(initialSource)
  const [slices, setSlices] = useState<Slice[]>(FALLBACK_SLICES)
  const [selected, setSelected] = useState(4)
  const [ctSlice, setCtSlice] = useState(4)
  const [modelResetKey, setModelResetKey] = useState(0)
  const [playing, setPlaying] = useState(false)

  const setStage = (next: ImageStackStage) => {
    setStageState(next)
    onStageChange?.(next)
  }

  useEffect(() => {
    let live = true
    fetch('/vmr-0225/slices.json')
      .then(response => {
        if (!response.ok) throw new Error('MR manifest unavailable')
        return response.json() as Promise<SliceManifest>
      })
      .then(manifest => {
        if (!live || !Array.isArray(manifest.slices) || !manifest.slices.length) return
        setSlices(manifest.slices)
        const defaultPosition = typeof manifest.defaultIndex === 'number' ? manifest.defaultIndex : manifest.slices.findIndex(item => item.index === manifest.defaultSlice)
        setSelected(defaultPosition >= 0 && defaultPosition < manifest.slices.length ? defaultPosition : Math.floor(manifest.slices.length / 2))
      })
      .catch(() => { /* fallback slices keep the demo useful offline */ })
    return () => { live = false }
  }, [])

  useEffect(() => {
    if (!playing || !slices.length) return
    const timer = window.setInterval(() => setSelected(value => (value + 1) % slices.length), 820)
    return () => window.clearInterval(timer)
  }, [playing, slices.length])

  const current = slices[selected]
  const rootClass = `image-stack-demo${className ? ` ${className}` : ''}`
  const isCt = source === 'ct-p3'

  return (
    <section className={rootClass} aria-label="Mô phỏng image stack đến model">
      <header className="image-stack-demo__hero">
        <div><span className="image-stack-demo__hero-kicker"><CircleDot size={12} /> DIGITAL TWIN · IMAGE TO MODEL</span><h1>Từ volume ảnh đến model 3D</h1><p>Flow tương tác đi từ nhiều lát ảnh → contour / mask → model. Chọn bộ evidence để xem CT P-3/0227 đã có contour và mesh, hoặc MR 0225 hiện chỉ có ảnh nguồn và surface P001 riêng biệt.</p></div>
        <div className="image-stack-demo__hero-case"><small>ACTIVE SOURCE</small><strong>{isCt ? 'P-3' : '0225'}</strong><span>{isCt ? '0227_H_AO_COA' : 'H_AO_COA'}</span><i><ScanLine size={14} /> {isCt ? 'CT + MASK' : 'MR SOURCE'}</i></div>
      </header>

      <div className="image-stack-demo__source-switch" role="tablist" aria-label="Chọn bộ dữ liệu cho image stack">
        <span>Evidence set</span>
        <button type="button" role="tab" aria-selected={!isCt} className={!isCt ? 'is-active' : ''} onClick={() => { setSource('mr-0225'); setStage('stack'); setPlaying(false); setModelResetKey(value => value + 1) }}><strong>MR 0225</strong><small>source-only · P001 surface riêng</small></button>
        <button type="button" role="tab" aria-selected={isCt} className={isCt ? 'is-active' : ''} onClick={() => { setSource('ct-p3'); setStage('stack'); setPlaying(false); setModelResetKey(value => value + 1) }}><strong>CT P-3 / 0227</strong><small>contours + P007 mesh verified</small></button>
      </div>

      <StageRail stage={stage} onChange={setStage} />
      <div className={`image-stack-demo__disclosure${isCt ? ' is-ct' : ''}`}><AlertTriangle size={14} /><span>{isCt ? 'CT P-3/0227 là một ca khác với MR 0225. Contours và P007 mesh trong nhánh này được dùng cùng bộ P-3 để minh họa đúng CT → mask → 3D.' : 'Nhánh CT là ví dụ tổng quát; MR 0225 trong folder có 16 lát nguồn nhưng chưa có segmentation hoặc registration MR–P001 đã kiểm chứng.'}</span></div>

      <div className="image-stack-demo__workbench">
        <div className="image-stack-demo__main-panel">
          <StageIntro stage={stage} />
          {stage === 'stack' && (isCt ? <CTStage stage="stack" slice={ctSlice} onSlice={setCtSlice} /> : <div className="image-stack-demo__stack-stage"><SliceDeck slices={slices} selected={selected} onSelect={setSelected} /><SliceControls slices={slices} selected={selected} playing={playing} onSelect={setSelected} onPlaying={setPlaying} /></div>)}
          {stage === 'segmentation' && (isCt ? <CTStage stage="segmentation" slice={ctSlice} onSlice={setCtSlice} /> : <div className="image-stack-demo__stack-stage"><SliceDeck slices={slices} selected={selected} onSelect={setSelected} /><SliceControls slices={slices} selected={selected} playing={playing} onSelect={setSelected} onPlaying={setPlaying} /><div className="image-stack-demo__concept-only"><AlertTriangle size={13} /> MR 0225: chưa có contour asset — đây là workflow concept, không vẽ mask lên ảnh nguồn.</div></div>)}
          {stage === 'model' && <ModelStage showSurface={showSurface} source={source} ctSlice={ctSlice} onCtSelect={setCtSlice} modelResetKey={modelResetKey} />}
        </div>

        <aside className="image-stack-demo__side-panel">
          <div className="image-stack-demo__side-kicker"><Workflow size={14} /> WORKFLOW EVIDENCE</div>
          <h3>{stage === 'stack' ? '1. Một volume, nhiều lát' : stage === 'segmentation' ? '2. Tách vùng cần dựng' : '3. Kiểm tra model 3D'}</h3>
          <p>{stage === 'stack' ? (isCt ? 'Duyệt 9 lát CT P-3/0227 có cùng bộ contours và P007 mesh. Đây là bộ asset phù hợp với workflow CT tổng quát.' : 'Kéo slider hoặc bấm Tự chạy để duyệt 16 lát MR 0225 đã xuất từ VTI. Các thẻ phía sau làm rõ ý tưởng về chiều sâu của volume.') : stage === 'segmentation' ? (isCt ? 'Lớp contour overlay là asset của CT P-3/0227 và có thể được đối chiếu với P007 mesh. Không gán kết quả này cho MR 0225.' : 'MR 0225 chưa có algorithm segmentation hoặc nhãn ground truth trong folder, nên giao diện chỉ trình bày bước cần làm.') : (isCt ? 'P007 là model dựng từ bộ CT contours P-3/0227; kéo để xoay và dùng slice plane để đối chiếu.' : 'Surface P001 có thể xoay, zoom và ghim điểm. Nó là bằng chứng hình học riêng của MR 0225, không được gán là overlay của lát MR.')}</p>
          <div className="image-stack-demo__side-list">
            <div><span><Layers3 size={13} /> SOURCE</span><strong>{isCt ? (stage === 'model' ? 'P007 · CT-derived mesh' : 'CT · 9 exported slices') : (stage === 'model' ? 'P001 · supplied surface' : 'MR · 16 exported slices')}</strong><small>{isCt ? `0227_H_AO_COA · slice ${680 + ctSlice * 10}` : stage === 'model' ? '25,108 vertices · 50,212 triangles' : (current ? `active slice ${current.index} · z ${sliceZ(current)}` : 'loading')}</small></div>
            <div><span><CircleDot size={13} /> STATUS</span><strong className={isCt || stage === 'stack' || stage === 'model' ? 'is-source' : 'is-concept'}>{isCt ? 'Verified P-3 assets' : stage === 'stack' || stage === 'model' ? 'Asset trong folder' : 'Conceptual UI'}</strong><small>{isCt ? 'CT contour ↔ P007 checked in repo' : stage === 'stack' ? 'pixel-accurate source preview' : stage === 'model' ? 'viewer uses supplied surface.bin' : 'requires segmentation pipeline'}</small></div>
          </div>
          <div className={`image-stack-demo__notice${isCt || stage === 'stack' || stage === 'model' ? ' image-stack-demo__notice--teal' : ' image-stack-demo__notice--amber'}`}>
            {isCt || stage === 'stack' || stage === 'model' ? <Check size={15} /> : <AlertTriangle size={15} />}
            <span>{isCt ? 'Đây là case CT P-3/0227. Không trộn label hoặc kết quả sang MR 0225.' : stage === 'stack' ? 'Ảnh hiển thị là MR nguồn; nhánh CT là mô tả khái quát.' : stage === 'model' ? 'Surface viewer được tải khi mở stage này để giữ initial bundle nhẹ.' : 'Không gọi đây là segmentation hoặc registration đã kiểm chứng.'}</span>
          </div>
          <button type="button" className="image-stack-demo__reset" onClick={() => { setStage('stack'); setSelected(4); setCtSlice(4); setPlaying(false); setModelResetKey(value => value + 1) }}><RotateCcw size={14} /> Đặt lại mô phỏng</button>
        </aside>
      </div>

      <footer className="image-stack-demo__footer"><span><Boxes size={13} /> Conceptual image-to-model workflow</span><span>CT P-3/0227 and MR 0225 remain separate evidence sets.</span></footer>
    </section>
  )
}
