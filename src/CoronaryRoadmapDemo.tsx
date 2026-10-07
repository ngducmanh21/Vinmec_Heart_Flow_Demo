import { Activity, AlertTriangle, Check, Info, MapPin, Target } from 'lucide-react'
import { useId, useMemo } from 'react'
import { DEMO_CASE, DEMO_LESIONS, type DemoLesion, type LesionSelectionProps } from './coronaryDemoData'
import './CoronaryRoadmapDemo.css'

type LesionPoint = {
  x: number
  y: number
  labelX: number
  labelY: number
}

const LESION_POINTS: Record<DemoLesion['id'], LesionPoint> = {
  L1: { x: 440, y: 150, labelX: 468, labelY: 142 },
  L2: { x: 460, y: 94, labelX: 486, labelY: 85 },
  L3: { x: 470, y: 291, labelX: 496, labelY: 300 },
}

function lesionSeverityTone(severity: number) {
  if (severity >= 65) return 'is-alert'
  if (severity >= 50) return 'is-watch'
  return 'is-calm'
}

function Marker({ lesion, selected, onSelect }: { lesion: DemoLesion; selected: boolean; onSelect: () => void }) {
  const point = LESION_POINTS[lesion.id]
  return (
    <g
      className={`coronary-roadmap__marker ${selected ? 'is-selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Chọn ${lesion.branchLabel}, mức hẹp mô phỏng ${lesion.severityPct}%`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
    >
      <circle cx={point.x} cy={point.y} r={selected ? 25 : 20} className="coronary-roadmap__marker-halo" />
      <circle cx={point.x} cy={point.y} r="11" className="coronary-roadmap__marker-ring" />
      <circle cx={point.x} cy={point.y} r="6" className="coronary-roadmap__marker-core" />
      <line x1={point.x + 15} y1={point.y - 15} x2={point.labelX - 6} y2={point.labelY + 3} className="coronary-roadmap__marker-leader" />
      <text x={point.labelX} y={point.labelY} className="coronary-roadmap__marker-label">{lesion.id} · {lesion.branchLabel}</text>
    </g>
  )
}

function CoronarySchematic({ selectedLesionId, onSelectLesion }: LesionSelectionProps) {
  const titleId = useId()
  return (
    <svg className="coronary-roadmap__diagram" viewBox="0 0 760 390" role="img" aria-labelledby={`${titleId}-title ${titleId}-desc`}>
      <title id={`${titleId}-title`}>Cây mạch vành giả lập với ba vùng tổn thương có thể chọn</title>
      <desc id={`${titleId}-desc`}>Sơ đồ mạch vành dạng minh họa. Ba điểm cam đại diện cho các vùng tổn thương trong dữ liệu synthetic; chọn từng điểm để cập nhật thông tin ở bảng bên cạnh.</desc>
      <defs>
        <linearGradient id={`${titleId}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0b2734" />
          <stop offset="1" stopColor="#0f3c49" />
        </linearGradient>
        <linearGradient id={`${titleId}-artery`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#91e1d5" />
          <stop offset="0.48" stopColor="#69c2c1" />
          <stop offset="1" stopColor="#317e8e" />
        </linearGradient>
        <filter id={`${titleId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <marker id={`${titleId}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#79d3cb" opacity=".72" />
        </marker>
      </defs>

      <rect width="760" height="390" rx="12" fill={`url(#${titleId}-bg)`} />
      <g className="coronary-roadmap__grid" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => <line key={`v-${index}`} x1={36 + index * 86} y1="26" x2={36 + index * 86} y2="364" />)}
        {Array.from({ length: 5 }, (_, index) => <line key={`h-${index}`} x1="26" y1={50 + index * 72} x2="734" y2={50 + index * 72} />)}
      </g>
      <text x="30" y="27" className="coronary-roadmap__diagram-kicker">CCTA SCHEMATIC · DEMO VESSEL MAP</text>
      <text x="730" y="27" textAnchor="end" className="coronary-roadmap__diagram-kicker">ANTERIOR VIEW</text>

      <g className="coronary-roadmap__heart" aria-hidden="true">
        <path d="M 226 113 C 285 52 405 50 505 98 C 588 137 620 235 558 303 C 515 349 424 363 345 350 C 263 337 183 291 160 218 C 143 164 177 131 226 113 Z" />
        <path d="M 215 147 C 264 103 338 91 414 101 C 492 110 550 155 565 222 C 579 281 531 322 467 340" />
      </g>

      <g className="coronary-roadmap__arteries" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 356 177 C 333 143 315 109 304 72" className="coronary-roadmap__artery-shadow" />
        <path d="M 356 177 C 333 143 315 109 304 72" className="coronary-roadmap__artery" />
        <path d="M 356 177 C 405 154 458 135 519 126 C 582 116 629 90 674 64" className="coronary-roadmap__artery-shadow" />
        <path d="M 356 177 C 405 154 458 135 519 126 C 582 116 629 90 674 64" className="coronary-roadmap__artery" />
        <path d="M 356 177 C 386 205 409 238 422 278 C 431 307 438 331 451 356" className="coronary-roadmap__artery-shadow" />
        <path d="M 356 177 C 386 205 409 238 422 278 C 431 307 438 331 451 356" className="coronary-roadmap__artery" />
        <path d="M 356 177 C 321 204 289 232 260 271 C 239 300 229 321 220 345" className="coronary-roadmap__artery-shadow" />
        <path d="M 356 177 C 321 204 289 232 260 271 C 239 300 229 321 220 345" className="coronary-roadmap__artery" />
        <path d="M 356 177 C 342 188 327 201 313 222" className="coronary-roadmap__artery" />
        <path d="M 433 145 C 450 111 455 79 451 46" className="coronary-roadmap__artery" />
        <path d="M 470 134 C 509 102 539 72 556 40" className="coronary-roadmap__artery" />
        <path d="M 419 271 C 468 275 514 293 551 329" className="coronary-roadmap__artery" />
        <path d="M 269 258 C 226 253 192 250 152 254" className="coronary-roadmap__artery" />
      </g>
      <g className="coronary-roadmap__flow-lines" aria-hidden="true">
        <path d="M 359 181 C 342 145 323 111 307 76" markerEnd={`url(#${titleId}-arrow)`} />
        <path d="M 363 174 C 426 147 493 130 566 113" markerEnd={`url(#${titleId}-arrow)`} />
        <path d="M 362 184 C 397 226 415 273 438 327" markerEnd={`url(#${titleId}-arrow)`} />
      </g>
      <g className="coronary-roadmap__origin" aria-hidden="true">
        <circle cx="356" cy="177" r="17" />
        <circle cx="356" cy="177" r="6" />
        <text x="356" y="211" textAnchor="middle">LM · GỐC MẠCH</text>
      </g>
      {DEMO_LESIONS.map(lesion => <Marker key={lesion.id} lesion={lesion} selected={lesion.id === selectedLesionId} onSelect={() => onSelectLesion(lesion.id)} />)}
      <g className="coronary-roadmap__branch-labels" aria-hidden="true">
        <text x="276" y="60">LAD</text>
        <text x="674" y="56" textAnchor="end">LCx</text>
        <text x="459" y="369">RCA</text>
      </g>
    </svg>
  )
}

function LesionList({ selectedLesionId, onSelectLesion }: LesionSelectionProps) {
  return (
    <div className="coronary-roadmap__lesion-list" aria-label="Danh sách vùng tổn thương giả lập">
      {DEMO_LESIONS.map(lesion => (
        <button
          key={lesion.id}
          type="button"
          className={`coronary-roadmap__lesion-row ${lesion.id === selectedLesionId ? 'is-selected' : ''}`}
          onClick={() => onSelectLesion(lesion.id)}
          aria-pressed={lesion.id === selectedLesionId}
        >
          <span className={`coronary-roadmap__lesion-index ${lesionSeverityTone(lesion.severityPct)}`}>{lesion.id}</span>
          <span className="coronary-roadmap__lesion-copy"><strong>{lesion.branchLabel}</strong><small>{lesion.location}</small></span>
          <span className="coronary-roadmap__lesion-value"><strong>{lesion.severityPct}%</strong><small>{lesion.lengthMm} mm</small></span>
        </button>
      ))}
    </div>
  )
}

export default function CoronaryRoadmapDemo({ selectedLesionId, onSelectLesion }: LesionSelectionProps) {
  const selected = useMemo(() => DEMO_LESIONS.find(lesion => lesion.id === selectedLesionId) ?? DEMO_LESIONS[0], [selectedLesionId])
  const mostPronounced = useMemo(() => DEMO_LESIONS.reduce((leading, lesion) => lesion.severityPct > leading.severityPct ? lesion : leading, DEMO_LESIONS[0]), [])

  return (
    <section className="coronary-roadmap" aria-labelledby="coronary-roadmap-title">
      <header className="coronary-roadmap__hero">
        <div>
          <div className="coronary-roadmap__eyebrow"><span /> <Activity size={13} /> CORONARY ROADMAP · BẢN ĐỒ TỔN THƯƠNG</div>
          <h2 id="coronary-roadmap-title">Theo dõi vị trí hẹp trên cây mạch vành</h2>
          <p>Chọn một điểm trên sơ đồ để xem nhánh, vị trí, chiều dài và mức hẹp trong ca mô phỏng. Các điểm đã được tạo sẵn để trình diễn tương tác.</p>
        </div>
        <div className="coronary-roadmap__hero-mark"><Target size={20} /><span>LESION<br />MAP</span></div>
      </header>

      <div className="coronary-roadmap__notice"><Info size={15} aria-hidden="true" /><span><strong>{DEMO_CASE.title}</strong> · dữ liệu synthetic để showcase. Đây không phải kết quả phân đoạn tự động, không phải CCTA hay ca 0225.</span></div>

      <div className="coronary-roadmap__workspace">
        <div className="coronary-roadmap__visual-card">
          <div className="coronary-roadmap__card-head"><span><span className="coronary-roadmap__live-dot" /> BẢN ĐỒ MẠCH VÀNH</span><small>chọn điểm để xem chi tiết</small></div>
          <div className="coronary-roadmap__canvas"><CoronarySchematic selectedLesionId={selectedLesionId} onSelectLesion={onSelectLesion} /></div>
          <div className="coronary-roadmap__legend"><span><i className="is-artery" /> Nhánh mạch mô hình</span><span><i className="is-lesion" /> Vùng tổn thương có thể chọn</span><span><i className="is-flow" /> Hướng dòng quy ước</span></div>
        </div>

        <aside className="coronary-roadmap__controls" aria-label="Chi tiết tổn thương">
          <div className="coronary-roadmap__panel-kicker"><MapPin size={14} /> ĐIỂM ĐANG CHỌN</div>
          <div className="coronary-roadmap__selected-heading"><div><span className={`coronary-roadmap__selected-dot ${lesionSeverityTone(selected.severityPct)}`} /><h3>{selected.id} · {selected.branchLabel}</h3></div><span className={`coronary-roadmap__severity-badge ${lesionSeverityTone(selected.severityPct)}`}>{selected.severityPct}%</span></div>
          <p className="coronary-roadmap__selected-location">{selected.location}</p>
          <div className="coronary-roadmap__metric-grid">
            <div><span>Mức hẹp mô phỏng</span><strong>{selected.severityPct}%</strong><small>thang hình học</small></div>
            <div><span>Chiều dài vùng</span><strong>{selected.lengthMm} mm</strong><small>giá trị synthetic</small></div>
          </div>
          <div className="coronary-roadmap__meter"><div><span>Mức độ trong ca demo</span><strong>{selected.severityPct}%</strong></div><span className="coronary-roadmap__meter-track"><i className={lesionSeverityTone(selected.severityPct)} style={{ width: `${selected.severityPct}%` }} /></span></div>
          <div className="coronary-roadmap__list-heading"><span>CÁC ĐIỂM TRONG CA</span><small>3 vùng có sẵn</small></div>
          <LesionList selectedLesionId={selectedLesionId} onSelectLesion={onSelectLesion} />
          <div className="coronary-roadmap__callout"><Check size={14} /><div><strong>Điểm nổi bật của demo</strong><p>{mostPronounced.id} · {mostPronounced.branchLabel} đang có mức hẹp mô phỏng cao nhất ({mostPronounced.severityPct}%).</p></div></div>
        </aside>
      </div>

      <footer className="coronary-roadmap__footer"><AlertTriangle size={14} /><span>Roadmap này chỉ giúp định hướng vùng cần xem trong mô hình. Không tự động phát hiện tổn thương và không hỗ trợ quyết định điều trị.</span></footer>
    </section>
  )
}
