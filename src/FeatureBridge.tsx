import { useMemo, useState, type CSSProperties } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronDown,
  Crosshair,
  ExternalLink,
  Layers3,
  MapPin,
  Play,
  ScanLine,
  SlidersHorizontal,
} from 'lucide-react'
import './FeatureBridge.css'

type FocusPoint = {
  id: string
  shortLabel: string
  label: string
  segment: string
  source: string
  x: number
  y: number
  accent: string
  note: string
  lens: string
}

const focusPoints: FocusPoint[] = [
  {
    id: 'arch-inlet',
    shortLabel: '01',
    label: 'Điểm quan sát A',
    segment: 'Phía đầu sơ đồ',
    source: 'SCHEMATIC',
    x: 26,
    y: 29,
    accent: '#73d2c0',
    note: 'Marker điều hướng trên sơ đồ; chưa được ánh xạ tới tọa độ MR hoặc P001.',
    lens: 'anatomy',
  },
  {
    id: 'focus-zone',
    shortLabel: '02',
    label: 'Điểm quan sát B',
    segment: 'Giữa sơ đồ',
    source: 'SCHEMATIC',
    x: 53,
    y: 51,
    accent: '#f0ab68',
    note: 'Marker minh họa thao tác ghim điểm; metadata CFD chỉ có số liệu theo frame.',
    lens: 'focus',
  },
  {
    id: 'descending-outlet',
    shortLabel: '03',
    label: 'Điểm quan sát C',
    segment: 'Phía cuối sơ đồ',
    source: 'SCHEMATIC',
    x: 77,
    y: 70,
    accent: '#75c9df',
    note: 'Dùng để so sánh ngữ cảnh quan sát, không phải vị trí đo áp lực hay FFRCT.',
    lens: 'flow',
  },
]

const sourceRows = [
  { label: 'Nguồn giải phẫu', value: 'MR preview; P001 riêng', icon: ScanLine },
  { label: 'Nguồn dòng chảy', value: 'Video CFD · 80 frame', icon: Activity },
  { label: 'Tương tác', value: 'Pin sơ đồ minh họa', icon: Crosshair },
]

const capabilityCards = [
  { number: '01', icon: Layers3, title: 'Giải phẫu 3D', reference: 'Mô hình tương tác theo người bệnh', here: 'Bề mặt P001 của ca 0225', status: 'DỮ LIỆU CA' },
  { number: '02', icon: Activity, title: 'Màu & dòng chảy', reference: 'Trường sinh lý được mã màu', here: 'Áp lực và vận tốc theo frame video', status: 'THEO FRAME' },
  { number: '03', icon: MapPin, title: 'Ghim điểm xem', reference: 'Đặt pin trên cây mạch', here: 'Ghim tọa độ hình học trên P001', status: 'CHỈ HÌNH HỌC' },
  { number: '04', icon: SlidersHorizontal, title: 'So sánh tình huống', reference: 'Xem nhiều vị trí/tổn thương', here: 'Van bình thường ↔ sa lá van minh họa', status: 'MINH HỌA' },
]

const cfdFrame = {
  label: 'Frame 42 / 80',
  physicalTime: '2.05 s',
  pressure: '6.13–6.94 mmHg',
  speed: '17.02 cm/s',
  streamlines: '237',
}

function FlowScale({ kind, title, value, max, marker }: { kind: 'pressure' | 'speed'; title: string; value: string; max: string; marker: string }) {
  return (
    <div className={`feature-bridge__scale feature-bridge__scale--${kind}`}>
      <div className="feature-bridge__scale-head">
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
      <div className="feature-bridge__scale-track" aria-hidden="true">
        <span className="feature-bridge__scale-fill" style={{ width: marker }} />
        <i className="feature-bridge__scale-pin" style={{ left: marker }} />
      </div>
      <div className="feature-bridge__scale-foot"><span>0</span><span>{max}</span></div>
    </div>
  )
}

export default function FeatureBridge() {
  const [selectedId, setSelectedId] = useState('focus-zone')
  const [compareMode, setCompareMode] = useState(false)
  const [showLayers, setShowLayers] = useState(true)

  const selected = useMemo(
    () => focusPoints.find(point => point.id === selectedId) ?? focusPoints[1],
    [selectedId],
  )

  return (
    <section className="feature-bridge" aria-labelledby="feature-bridge-title">
      <div className="feature-bridge__header">
        <div>
          <div className="feature-bridge__eyebrow"><span /> INTERACTION PATTERN / ANATOMY + FLOW</div>
          <h2 id="feature-bridge-title">Đặt giải phẫu và dòng chảy trong cùng một khung nhìn.</h2>
          <p className="feature-bridge__intro">
            Một lớp showcase lấy cảm hứng từ cách <a href="https://www.heartflow.com/heartflow-one/ffrct-analysis/" target="_blank" rel="noreferrer">HeartFlow trình bày FFR<sub>CT</sub></a>:
            ghim điểm, đặt giải phẫu và ngữ cảnh dòng chảy cạnh nhau, rồi so sánh nhiều vùng quan sát.
          </p>
        </div>
        <div className="feature-bridge__header-meta">
          <span className="feature-bridge__meta-label">CASE BRIDGE</span>
          <strong>0225</strong>
          <span>MR / P001 / CFD</span>
        </div>
      </div>

      <div className="feature-bridge__notice" role="note">
        <span className="feature-bridge__notice-dot" />
        <p><strong>Ranh giới của demo:</strong> sơ đồ mạch và các pin là minh họa, chưa căn chỉnh với MR hay P001. Readout bên dưới lấy từ metadata của toàn frame CFD, không đổi theo pin; đó không phải FFR<sub>CT</sub>, phép đo mạch vành hay dữ liệu để quyết định lâm sàng.</p>
      </div>

      <div className="feature-bridge__capabilities" aria-label="Đối chiếu tính năng với dữ liệu showcase">
        {capabilityCards.map(item => { const Icon = item.icon; return <div className="feature-bridge__capability" key={item.number}><div className="feature-bridge__capability-top"><span>{item.number}</span><Icon size={17}/></div><h3>{item.title}</h3><p><b>Tham chiếu:</b> {item.reference}</p><p><b>Showcase:</b> {item.here}</p><small>{item.status}</small></div> })}
      </div>

      <div className="feature-bridge__grid">
        <div className="feature-bridge__visual-card">
          <div className="feature-bridge__card-topline">
            <div>
              <span className="feature-bridge__live-dot" />
              <span>INTERACTIVE CASE VIEW</span>
              <i />
              <strong>{showLayers ? 'SCHEMATIC + FLOW CUE' : 'SCHEMATIC ONLY'}</strong>
            </div>
            <button
              type="button"
              className={`feature-bridge__layer-toggle${showLayers ? ' is-on' : ''}`}
              aria-pressed={showLayers}
              onClick={() => setShowLayers(value => !value)}
            >
              <Layers3 size={14} />
              <span>{showLayers ? 'Ẩn đường dòng minh họa' : 'Hiện đường dòng minh họa'}</span>
            </button>
          </div>

          <div className={`feature-bridge__anatomy${showLayers ? ' has-flow' : ''}`}>
            <svg className="feature-bridge__vessel" viewBox="0 0 800 420" role="img" aria-label="Sơ đồ khái niệm mạch máu với các điểm chọn, không phải hình học P001">
              <defs>
                <linearGradient id="bridge-vessel" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8ddacf" />
                  <stop offset="45%" stopColor="#5bb8ba" />
                  <stop offset="100%" stopColor="#73b9d1" />
                </linearGradient>
                <linearGradient id="bridge-flow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6dd5c1" />
                  <stop offset="52%" stopColor="#f1ad67" />
                  <stop offset="100%" stopColor="#73cfe2" />
                </linearGradient>
                <filter id="bridge-glow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <pattern id="bridge-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                  <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#8ac8ca" strokeOpacity=".08" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="800" height="420" fill="url(#bridge-grid)" />
              <path className="feature-bridge__vessel-shadow" d="M156 103 C174 57 223 44 278 60 C317 71 335 105 331 151 C328 196 359 221 412 236 C474 253 532 254 565 221 C595 191 600 145 587 105 C577 77 592 57 618 52" />
              <path className="feature-bridge__vessel-outline" d="M156 103 C174 57 223 44 278 60 C317 71 335 105 331 151 C328 196 359 221 412 236 C474 253 532 254 565 221 C595 191 600 145 587 105 C577 77 592 57 618 52" />
              <path className="feature-bridge__vessel-core" d="M156 103 C174 57 223 44 278 60 C317 71 335 105 331 151 C328 196 359 221 412 236 C474 253 532 254 565 221 C595 191 600 145 587 105 C577 77 592 57 618 52" />
              <path className="feature-bridge__vessel-rim" d="M145 99 C159 47 215 26 280 45 C332 60 355 101 349 152 C344 179 358 196 398 210 C464 234 513 239 545 207 C577 175 580 131 566 97 C553 63 575 28 620 25" />
              <path className="feature-bridge__branch" d="M242 52 C233 27 232 20 240 8 M273 57 C276 27 277 17 287 4 M302 70 C316 45 323 34 339 22" />
              <path className="feature-bridge__branch" d="M243 55 C235 33 234 26 240 15 M275 58 C278 34 279 25 287 13 M302 71 C317 49 323 42 338 31" />
              {showLayers && <>
                <path className="feature-bridge__flow-ribbon" d="M153 107 C190 73 245 66 294 90 C334 110 328 166 350 191 C380 226 443 247 503 242 C569 237 597 193 586 123 C581 94 595 74 620 64" />
                <path className="feature-bridge__flow-line" d="M162 119 C201 88 248 83 287 103 C317 119 317 165 343 195 C376 234 443 255 507 249 C575 241 610 193 598 124" />
                <path className="feature-bridge__flow-arrow" d="M415 245 l-18 -10 m18 10 l-8 18" />
                <path className="feature-bridge__flow-arrow" d="M560 219 l-19 -6 m19 6 l-9 16" />
              </>}
              <path className="feature-bridge__reference-line" d="M108 323 H678" />
              <path className="feature-bridge__reference-line" d="M118 335 H338" />
              <text x="110" y="350" className="feature-bridge__svg-label">SCHEMATIC · NOT P001 GEOMETRY</text>
              <text x="560" y="350" className="feature-bridge__svg-label">ILLUSTRATIVE PINS</text>
            </svg>

            <div className="feature-bridge__pin-layer" aria-label="Các điểm chọn trên bề mặt">
              {focusPoints.map(point => (
                <button
                  type="button"
                  key={point.id}
                  className={`feature-bridge__pin${selected.id === point.id ? ' is-selected' : ''}`}
                  style={{ left: `${point.x}%`, top: `${point.y}%`, '--pin-color': point.accent } as CSSProperties}
                  aria-label={`Chọn ${point.label}`}
                  aria-pressed={selected.id === point.id}
                  onClick={() => setSelectedId(point.id)}
                >
                  <span className="feature-bridge__pin-ring" />
                  <span className="feature-bridge__pin-dot"><MapPin size={12} /></span>
                  <span className="feature-bridge__pin-label">{point.shortLabel} · {point.label}</span>
                </button>
              ))}
            </div>

            <div className="feature-bridge__anatomy-caption">
              <div><span className="feature-bridge__caption-key" /> <strong>ANATOMY</strong><span>sơ đồ</span></div>
              <div><span className="feature-bridge__caption-key feature-bridge__caption-key--flow" /> <strong>FLOW</strong><span>đường gợi ý</span></div>
            </div>
          </div>

          <div className="feature-bridge__selection">
            <div className="feature-bridge__selection-main">
              <div className="feature-bridge__selection-icon" style={{ backgroundColor: `${selected.accent}25`, color: selected.accent }}><Crosshair size={17} /></div>
              <div>
                <span className="feature-bridge__selection-kicker">SELECTED FOCUS · {selected.source}</span>
                <h3>{selected.label}</h3>
                <p>{selected.note}</p>
              </div>
            </div>
            <div className="feature-bridge__selection-meta">
              <span>VỊ TRÍ TRÊN SƠ ĐỒ</span>
              <strong>{selected.segment}</strong>
            </div>
          </div>
        </div>

        <aside className="feature-bridge__insight-card" aria-label="Thông tin điểm đang chọn">
          <div className="feature-bridge__insight-head">
            <div>
              <span className="feature-bridge__eyebrow feature-bridge__eyebrow--dark"><span /> FRAME-LEVEL READOUT</span>
              <h3>CFD frame context</h3>
            </div>
            <span className="feature-bridge__frame-chip"><Play size={11} /> {cfdFrame.label}</span>
          </div>

          <div className="feature-bridge__frame-summary">
            <div><span>PHYSICAL TIME</span><strong>{cfdFrame.physicalTime}</strong></div>
            <div><span>SCHEMATIC PIN</span><strong>{selected.shortLabel} / 03</strong></div>
          </div>

          <div className="feature-bridge__scales">
            <FlowScale kind="pressure" title="Áp lực · toàn frame" value={cfdFrame.pressure} max="6 mmHg · màu bão hòa" marker="100%" />
            <FlowScale kind="speed" title="Vận tốc tối đa · toàn frame" value={cfdFrame.speed} max="17.02 cm/s" marker="100%" />
          </div>

          <div className="feature-bridge__streamline-readout">
            <div className="feature-bridge__streamline-icon"><Activity size={16} /></div>
            <div><span>STREAMLINE COUNT IN SOURCE FRAME</span><strong>{cfdFrame.streamlines}</strong></div>
            <span className="feature-bridge__readout-status">CFD</span>
          </div>

          <div className="feature-bridge__insight-copy">
            <p>Chọn marker chỉ đổi điểm chú giải trên sơ đồ. Các số liệu vẫn là của toàn frame 42 trong video CFD; không có giá trị gán riêng cho từng vị trí và không đại diện cho FFR<sub>CT</sub>.</p>
          </div>

          <div className="feature-bridge__layer-list">
            {sourceRows.map(row => {
              const Icon = row.icon
              return <div key={row.label}><Icon size={14} /><span>{row.label}</span><strong>{row.value}</strong><Check size={13} /></div>
            })}
          </div>
        </aside>
      </div>

      <div className="feature-bridge__compare-card">
        <div className="feature-bridge__compare-head">
          <div>
            <div className="feature-bridge__eyebrow feature-bridge__eyebrow--dark"><span /> MULTI-POINT REVIEW</div>
            <h3>Đặt các vùng quan sát cạnh nhau.</h3>
            <p>So sánh các marker minh họa để người xem thấy kiểu tương tác nhiều điểm. Chúng không phải các tổn thương đã được đo hoặc đăng ký vào dữ liệu ca 0225.</p>
          </div>
          <button type="button" className={`feature-bridge__compare-toggle${compareMode ? ' is-active' : ''}`} aria-expanded={compareMode} onClick={() => setCompareMode(value => !value)}>
            <SlidersHorizontal size={14} />
            <span>{compareMode ? 'Ẩn bảng so sánh' : 'So sánh 3 điểm'}</span>
            <ChevronDown size={14} />
          </button>
        </div>

        {compareMode && <div className="feature-bridge__compare-table" role="table" aria-label="So sánh các điểm quan sát">
          <div className="feature-bridge__compare-row feature-bridge__compare-row--header" role="row">
            <span role="columnheader">FOCUS POINT</span><span role="columnheader">MARKER TYPE</span><span role="columnheader">VIEW</span><span role="columnheader">ACTION</span>
          </div>
          {focusPoints.map(point => <div className={`feature-bridge__compare-row${point.id === selected.id ? ' is-selected' : ''}`} key={point.id} role="row">
            <span role="cell"><i style={{ background: point.accent }} /> <strong>{point.label}</strong><small>{point.segment}</small></span>
            <span role="cell">{point.source}</span>
            <span role="cell"><b className={`feature-bridge__view-tag feature-bridge__view-tag--${point.lens}`}>{point.lens}</b></span>
            <span role="cell"><button type="button" onClick={() => setSelectedId(point.id)} aria-label={`Xem ${point.label}`}>{point.id === selected.id ? <><Check size={13} /> Đang xem</> : <>Xem điểm <ArrowRight size={13} /></>}</button></span>
          </div>)}
        </div>}
      </div>

      <div className="feature-bridge__rail">
        <div className="feature-bridge__rail-step is-complete"><span><Check size={13} /></span><div><strong>MR source</strong><small>Lát ảnh nguồn</small></div></div>
        <ArrowRight size={16} />
        <div className="feature-bridge__rail-step is-active"><span><Crosshair size={13} /></span><div><strong>Feature bridge</strong><small>Chọn và so sánh</small></div></div>
        <ArrowRight size={16} />
        <div className="feature-bridge__rail-step"><span><Activity size={13} /></span><div><strong>CFD flow</strong><small>Playback đầy đủ</small></div></div>
        <div className="feature-bridge__rail-actions"><a href="#valve-lab">Xem valve lab <ArrowDownRight size={14} /></a><a href="#case-flow">Mở case flow <ArrowRight size={14} /></a></div>
      </div>

      <footer className="feature-bridge__footer"><span>Interaction reference: HeartFlow FFR<sub>CT</sub> Analysis</span><a href="https://www.heartflow.com/heartflow-one/ffrct-analysis/" target="_blank" rel="noreferrer">Đọc nguồn tham khảo <ExternalLink size={12} /></a></footer>
    </section>
  )
}
