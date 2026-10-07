import { Suspense, lazy, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { ExternalLink, Info, Move3D, Pause, Play, RotateCcw, Sparkles } from 'lucide-react'
import './ValveShowcase.css'

const Valve3DScene = lazy(() => import('./Valve3DScene'))

type ValveMode = 'normal' | 'prolapse' | 'compare'
type OverlayMode = 'none' | 'support' | 'deformation'
type PinName = 'leaflet' | 'chordae' | 'annulus' | 'coaptation'

type PinDetail = {
  label: string
  title: string
  description: string
  normal: string
  prolapse: string
}

const PIN_DETAILS: Record<PinName, PinDetail> = {
  leaflet: {
    label: 'Lá van',
    title: 'Lá van trước',
    description: 'Mặt mô mềm di động trong mỗi chu kỳ. Khi đóng, mép lá van đi về đường tiếp xúc ở trung tâm.',
    normal: 'Mép lá van tiến đều về đường đóng.',
    prolapse: 'Lá van vượt lên trên mặt phẳng đóng khi điểm neo bị mất.',
  },
  chordae: {
    label: 'Dây chằng',
    title: 'Dây chằng van',
    description: 'Các sợi neo nối lá van với cơ nhú và giúp giữ mép van khi áp lực tăng trong pha đóng.',
    normal: 'Các sợi còn nguyên tạo lực đỡ hướng về cơ nhú.',
    prolapse: 'Sơ đồ đánh dấu nhóm dây chằng đã bị loại bỏ để minh họa cơ chế sa lá van.',
  },
  annulus: {
    label: 'Vòng van',
    title: 'Vòng van (annulus)',
    description: 'Vành nền giữ biên của các lá van. Sơ đồ dùng vòng van để làm mốc hình học, không phải phép đo ca bệnh.',
    normal: 'Vòng van là biên đỡ ổn định của hệ van.',
    prolapse: 'Biên vòng vẫn được giữ nguyên để cô lập vai trò của dây chằng.',
  },
  coaptation: {
    label: 'Đường khép',
    title: 'Vùng tiếp áp (coaptation)',
    description: 'Vùng mà các mép lá van gặp nhau khi van đóng. Khoảng hở màu hổ phách chỉ là dấu hiệu định tính.',
    normal: 'Ba mép gặp nhau, tạo đường khép liên tục.',
    prolapse: 'Khoảng hở xuất hiện phía dưới lá van bị sa trong pha đóng.',
  },
}

const PIN_ORDER: PinName[] = ['leaflet', 'chordae', 'annulus', 'coaptation']

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function phaseLabel(phase: number) {
  if (phase < 28) return 'Mở'
  if (phase < 70) return 'Đang khép'
  return 'Đóng'
}

function Pin({
  name,
  x,
  y,
  active,
  onSelect,
}: {
  name: PinName
  x: number
  y: number
  active: boolean
  onSelect: (pin: PinName) => void
}) {
  const detail = PIN_DETAILS[name]
  const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(name)
    }
  }

  return (
    <g
      className={`valve-svg-pin${active ? ' is-active' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Xem giải thích: ${detail.label}`}
      onClick={() => onSelect(name)}
      onKeyDown={handleKeyDown}
      transform={`translate(${x} ${y})`}
    >
      <circle className="valve-svg-pin__halo" r="14" />
      <circle className="valve-svg-pin__dot" r="7" />
      <circle className="valve-svg-pin__core" r="2" />
      <text x="12" y="4">{detail.label}</text>
    </g>
  )
}

function ValveDiagram({
  mode,
  phase,
  overlay,
  activePin,
  onPin,
  idPrefix,
}: {
  mode: Exclude<ValveMode, 'compare'>
  phase: number
  overlay: OverlayMode
  activePin: PinName
  onPin: (pin: PinName) => void
  idPrefix: string
}) {
  const closure = clamp(phase, 0, 100) / 100
  const isProlapse = mode === 'prolapse'
  const coaptationY = 159 - closure * 18
  const anteriorTipY = coaptationY - (isProlapse ? closure * 52 : 0)
  const sideTipY = coaptationY + 4 + (1 - closure) * 24
  const diagramTitle = isProlapse ? 'Mô hình sa lá van' : 'Mô hình khép bình thường'

  return (
    <svg
      className={`valve-diagram ${isProlapse ? 'valve-diagram--prolapse' : 'valve-diagram--normal'}`}
      viewBox="0 0 420 340"
      role="img"
      aria-label={`${diagramTitle}, pha ${phaseLabel(phase).toLowerCase()}`}
    >
      <defs>
        <linearGradient id={`${idPrefix}-leaflet`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={isProlapse ? '#d4a6d9' : '#b7d8dc'} />
          <stop offset="100%" stopColor={isProlapse ? '#7d65b3' : '#4f9eaa'} />
        </linearGradient>
        <linearGradient id={`${idPrefix}-leaflet-side`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isProlapse ? '#ceb3da' : '#d1e7e8'} />
          <stop offset="100%" stopColor={isProlapse ? '#9d6fa8' : '#66aeb1'} />
        </linearGradient>
        <linearGradient id={`${idPrefix}-strain`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3eafa2" stopOpacity=".2" />
          <stop offset="56%" stopColor="#f3c85d" stopOpacity=".65" />
          <stop offset="100%" stopColor="#e96d5b" stopOpacity=".84" />
        </linearGradient>
        <radialGradient id={`${idPrefix}-surface`} cx="50%" cy="44%" r="65%">
          <stop offset="0%" stopColor="#163c4a" />
          <stop offset="100%" stopColor="#081d28" />
        </radialGradient>
        <filter id={`${idPrefix}-shadow`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#031017" floodOpacity=".34" />
        </filter>
      </defs>

      <rect className="valve-diagram__surface" x="0" y="0" width="420" height="340" rx="11" fill={`url(#${idPrefix}-surface)`} />
      <path className="valve-diagram__grid" d="M 26 277 H 394 M 37 52 H 383" />
      <text className="valve-diagram__kicker" x="26" y="32">{isProlapse ? 'AFTER CHORDAE REMOVAL' : 'INTACT SUPPORT'}</text>
      <text className="valve-diagram__phase" x="394" y="32" textAnchor="end">{phaseLabel(phase).toUpperCase()}</text>

      <g filter={`url(#${idPrefix}-shadow)`}>
        <ellipse className="valve-annulus__shadow" cx="210" cy="188" rx="158" ry="71" />
        <ellipse className="valve-annulus__body" cx="210" cy="158" rx="162" ry="78" />
        <ellipse className="valve-annulus__inner" cx="210" cy="157" rx="132" ry="58" />

        <path
          className="valve-leaflet valve-leaflet--anterior"
          d={`M 62 146 C 94 96 151 76 210 ${anteriorTipY} C 168 ${anteriorTipY + 30} 104 169 62 146 Z`}
          fill={`url(#${idPrefix}-leaflet)`}
        />
        <path
          className="valve-leaflet valve-leaflet--posterior"
          d={`M 210 ${anteriorTipY} C 270 77 326 96 358 146 C 316 169 251 ${anteriorTipY + 30} 210 ${anteriorTipY} Z`}
          fill={`url(#${idPrefix}-leaflet-side)`}
        />
        <path
          className="valve-leaflet valve-leaflet--septal"
          d={`M 62 146 C 98 194 149 221 210 ${sideTipY} C 271 221 322 194 358 146 C 320 178 268 185 210 ${sideTipY + 2} C 152 185 100 178 62 146 Z`}
          fill={`url(#${idPrefix}-leaflet-side)`}
        />

        <path className="leaflet-edge leaflet-edge--left" d={`M 62 146 C 98 174 146 181 210 ${sideTipY}`} />
        <path className="leaflet-edge leaflet-edge--right" d={`M 210 ${sideTipY} C 274 181 320 174 358 146`} />
        <path className="leaflet-edge leaflet-edge--anterior" d={`M 210 ${anteriorTipY} C 204 ${anteriorTipY + 10} 204 ${anteriorTipY + 11} 210 ${sideTipY}`} />

        {overlay === 'deformation' && (
          <>
            <path
              className="valve-deformation-band"
              d={`M 80 142 C 122 112 163 105 210 ${anteriorTipY + 4} C 178 ${anteriorTipY + 31} 123 157 80 142 Z`}
              fill={`url(#${idPrefix}-strain)`}
            />
            <path className="valve-deformation-line" d={`M 95 133 C 139 116 173 112 207 ${anteriorTipY + 9}`} />
          </>
        )}

        <g className={`valve-chordae${isProlapse ? ' is-removed' : ''}`}>
          <path d="M 121 220 C 144 204 165 183 190 161" />
          <path d="M 147 233 C 158 207 179 183 202 160" />
          <path d="M 275 232 C 260 205 239 181 219 160" />
          <path d="M 300 219 C 278 202 252 181 229 160" />
        </g>
        <g className="valve-papillary">
          <path d="M 126 220 L 116 262 M 148 231 L 144 270 M 273 230 L 276 270 M 296 219 L 305 261" />
          <ellipse cx="128" cy="267" rx="20" ry="7" />
          <ellipse cx="290" cy="267" rx="20" ry="7" />
        </g>
      </g>

      {isProlapse && closure > .3 && (
        <g className="valve-gap-indicator">
          <path d={`M 183 ${coaptationY + 8} Q 207 ${coaptationY + 31} 232 ${coaptationY + 8}`} />
          <path d={`M 195 ${coaptationY + 12} L 195 ${coaptationY + 26} M 225 ${coaptationY + 12} L 225 ${coaptationY + 26}`} />
          <text x="240" y={coaptationY + 25}>khoảng hở</text>
        </g>
      )}

      {overlay === 'support' && <path className="valve-support-glow" d="M 91 208 C 128 244 164 255 210 257 C 256 255 292 244 329 208" />}

      <g className="valve-coaptation-marker">
        <circle cx="210" cy={coaptationY} r="5" />
        <path d={`M 210 ${coaptationY - 14} V ${coaptationY - 7}`} />
      </g>

      <Pin name="annulus" x={73} y={113} active={activePin === 'annulus'} onSelect={onPin} />
      <Pin name="leaflet" x={isProlapse ? 243 : 228} y={Math.max(69, anteriorTipY - 3)} active={activePin === 'leaflet'} onSelect={onPin} />
      <Pin name="coaptation" x={210} y={coaptationY + 8} active={activePin === 'coaptation'} onSelect={onPin} />
      <Pin name="chordae" x={isProlapse ? 312 : 283} y={235} active={activePin === 'chordae'} onSelect={onPin} />

      {isProlapse && (
        <g className="valve-removed-label">
          <path d="M 316 94 H 378 V 119 H 316" />
          <text x="322" y="104">DÂY CHẰNG</text>
          <text x="322" y="115">ĐÃ LOẠI BỎ</text>
        </g>
      )}
    </svg>
  )
}

function ModeButton({ mode, current, children, onClick }: { mode: ValveMode; current: ValveMode; children: string; onClick: () => void }) {
  return (
    <button
      className={`valve-mode-button${current === mode ? ' is-active' : ''}`}
      type="button"
      role="tab"
      aria-selected={current === mode}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default function ValveShowcase() {
  const [mode, setMode] = useState<ValveMode>('compare')
  const [phase, setPhase] = useState(100)
  const [viewMode, setViewMode] = useState<'3d' | 'diagram'>('3d')
  const [overlay, setOverlay] = useState<OverlayMode>('support')
  const [activePin, setActivePin] = useState<PinName>('coaptation')
  const [playing, setPlaying] = useState(false)
  const playDirection = useRef<1 | -1>(1)

  useEffect(() => {
    if (!playing) return undefined

    const timer = window.setInterval(() => {
      setPhase(value => {
        const next = value + playDirection.current * 2
        if (next >= 100) {
          playDirection.current = -1
          return 100
        }
        if (next <= 0) {
          playDirection.current = 1
          return 0
        }
        return next
      })
    }, 48)

    return () => window.clearInterval(timer)
  }, [playing])

  const activeDetail = PIN_DETAILS[activePin]
  const stateCopy = useMemo(() => {
    const label = phaseLabel(phase)
    if (mode === 'compare') {
      return label === 'Đóng' ? 'Bên trái khép liên tục; bên phải có khoảng hở định tính.' : 'Cùng một pha đóng được đặt cạnh nhau để so sánh.'
    }
    if (mode === 'prolapse') {
      return label === 'Đóng' ? 'Lá van sa tạo khoảng hở định tính.' : 'Theo dõi lá van khi tiến vào mặt phẳng đóng.'
    }
    return label === 'Đóng' ? 'Ba lá van gặp nhau trên đường khép.' : 'Quan sát chuyển động của các lá van về vùng tiếp áp.'
  }, [mode, phase])

  function reset() {
    setPlaying(false)
    playDirection.current = 1
    setPhase(0)
  }

  function setSelectedPin(pin: PinName) {
    setActivePin(pin)
  }

  return (
    <section className="valve-showcase" aria-labelledby="valve-showcase-title">
      <div className="valve-showcase__intro">
        <div className="valve-showcase__eyebrow"><span /> STRUCTURAL MECHANICS · TRICUSPID VALVE</div>
        <div className="valve-showcase__intro-row">
          <div>
            <h2 id="valve-showcase-title">Khi điểm tựa của van thay đổi</h2>
            <p>Khám phá cách dây chằng giữ lá van nhĩ thất phải (van ba lá) trong pha đóng, và vì sao việc mất một nhóm điểm neo có thể tạo ra hiện tượng sa lá van.</p>
          </div>
          <div className="valve-showcase__intro-mark" aria-hidden="true"><Sparkles size={19} /><span>FOCUS<br /><strong>VALVE</strong></span></div>
        </div>
        <div className="valve-showcase__source-strip"><span>Idealized educational model</span><span>Normal coaptation ↔ leaflet prolapse</span><span>Qualitative support map</span></div>
      </div>

      <div className="valve-showcase__workspace">
        <div className="valve-showcase__visual-card">
          <div className="valve-showcase__visual-head">
            <div><span className="valve-live-dot" /> <strong>VALVE SUPPORT &amp; CLOSURE</strong><span className="valve-head-divider">/</span><span>MINH HỌA CẤU TRÚC</span></div>
            <span className="valve-phase-badge">{phaseLabel(phase).toUpperCase()} · {phase}%</span>
          </div>

          <div className="valve-view-toolbar"><div><Move3D size={14}/><strong>GÓC NHÌN</strong><button type="button" className={viewMode === '3d' ? 'is-active' : ''} aria-pressed={viewMode === '3d'} onClick={() => setViewMode('3d')}>3D xoay được</button><button type="button" className={viewMode === 'diagram' ? 'is-active' : ''} aria-pressed={viewMode === 'diagram'} onClick={() => setViewMode('diagram')}>Sơ đồ 2D</button></div><span>{viewMode === '3d' ? 'Kéo mô hình để xoay · cuộn để zoom' : 'Chọn điểm trên sơ đồ để đọc chú giải'}</span></div>

          <div className={`valve-showcase__diagrams${mode === 'compare' ? ' is-compare' : ''}${viewMode === '3d' ? ' is-3d' : ''}`}>
            <div className="valve-3d-holder" style={{ display: viewMode === '3d' ? 'block' : 'none' }} aria-hidden={viewMode !== '3d'}><Suspense fallback={<div className="valve-3d-loading">Đang tải mô hình van 3D…</div>}><Valve3DScene mode={mode} phase={phase} overlay={overlay} activePin={activePin} onPin={setSelectedPin}/></Suspense></div>
            {viewMode === 'diagram' && (mode === 'compare' ? (
              <div className="valve-compare-grid">
                <div className="valve-compare-panel"><div className="valve-compare-label"><span className="valve-state-dot valve-state-dot--normal" /> Bình thường <small>coaptation</small></div><ValveDiagram mode="normal" phase={phase} overlay={overlay} activePin={activePin} onPin={setSelectedPin} idPrefix="valve-normal" /></div>
                <div className="valve-compare-panel"><div className="valve-compare-label"><span className="valve-state-dot valve-state-dot--prolapse" /> Sa lá van <small>chordae removed</small></div><ValveDiagram mode="prolapse" phase={phase} overlay={overlay} activePin={activePin} onPin={setSelectedPin} idPrefix="valve-prolapse" /></div>
              </div>
            ) : (
              <ValveDiagram mode={mode} phase={phase} overlay={overlay} activePin={activePin} onPin={setSelectedPin} idPrefix={`valve-${mode}`} />
            ))}
          </div>

          <div className="valve-showcase__visual-foot">
            <span><i className="valve-legend-swatch valve-legend-swatch--support" /> điểm tựa / mô nâng đỡ</span>
            <span><i className="valve-legend-swatch valve-legend-swatch--gap" /> khoảng hở định tính</span>
            <span><i className="valve-legend-swatch valve-legend-swatch--surface" /> bề mặt lá van</span>
            <span className="valve-showcase__state-copy" aria-live="polite">{stateCopy}</span>
          </div>
        </div>

        <aside className="valve-showcase__info-card" aria-label="Điều khiển và giải thích van">
          <div className="valve-control-group">
            <div className="valve-control-label"><span>01 / VIEW</span><strong>Chọn trạng thái cấu trúc</strong></div>
            <div className="valve-mode-tabs" role="tablist" aria-label="Trạng thái van">
              <ModeButton mode="normal" current={mode} onClick={() => setMode('normal')}>Bình thường</ModeButton>
              <ModeButton mode="prolapse" current={mode} onClick={() => setMode('prolapse')}>Sa lá van</ModeButton>
              <ModeButton mode="compare" current={mode} onClick={() => setMode('compare')}>So sánh</ModeButton>
            </div>
          </div>

          <div className="valve-control-group valve-control-group--phase">
            <div className="valve-control-label"><span>02 / MOTION</span><strong>Giai đoạn đóng</strong><output>{phaseLabel(phase)} <b>{phase}%</b></output></div>
            <input
              className="valve-phase-slider"
              type="range"
              min="0"
              max="100"
              step="1"
              value={phase}
              onChange={event => setPhase(Number(event.target.value))}
              aria-label="Giai đoạn đóng của van"
            />
            <div className="valve-range-labels"><span>Mở</span><span>Đóng</span></div>
            <div className="valve-play-row">
              <button className="valve-play-button" type="button" onClick={() => setPlaying(value => !value)} aria-label={playing ? 'Tạm dừng chuyển động' : 'Phát chuyển động'}>
                {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? 'Tạm dừng' : 'Phát chuyển động'}
              </button>
              <button className="valve-reset-button" type="button" onClick={reset} aria-label="Đặt lại giai đoạn đóng" title="Đặt lại giai đoạn đóng"><RotateCcw size={15} /></button>
            </div>
          </div>

          <div className="valve-control-group valve-control-group--overlay">
            <div className="valve-control-label"><span>03 / LAYER</span><strong>Lớp thông tin</strong></div>
            <div className="valve-overlay-options" role="radiogroup" aria-label="Lớp thông tin trên sơ đồ">
              {(['support', 'deformation', 'none'] as OverlayMode[]).map(option => (
                <label key={option} className={`valve-overlay-option${overlay === option ? ' is-active' : ''}`}>
                  <input type="radio" name="valve-overlay" checked={overlay === option} onChange={() => setOverlay(option)} />
                  <span>{option === 'support' ? 'Điểm tựa' : option === 'deformation' ? 'Biến dạng minh họa' : 'Tắt lớp'}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="valve-selected-structure" aria-live="polite">
            <div className="valve-selected-structure__label"><Info size={13} /> SELECTED STRUCTURE</div>
            <h3>{activeDetail.title}</h3>
            <p>{activeDetail.description}</p>
            <div className={`valve-structure-note${mode === 'prolapse' ? ' is-prolapse' : ''}`}><span>{mode === 'prolapse' ? 'SA LÁ VAN' : mode === 'compare' ? 'SO SÁNH' : 'BÌNH THƯỜNG'}</span>{mode === 'prolapse' ? activeDetail.prolapse : mode === 'compare' ? `${activeDetail.normal} ${activeDetail.prolapse}` : activeDetail.normal}</div>
          </div>
        </aside>
      </div>

      <div className="valve-anatomy-row">
        <div className="valve-anatomy-intro"><span>ANATOMY PINS</span><strong>Chạm vào một điểm để đọc nhanh</strong></div>
        <div className="valve-anatomy-buttons">
          {PIN_ORDER.map(pin => (
            <button key={pin} type="button" className={`valve-anatomy-button${activePin === pin ? ' is-active' : ''}`} onClick={() => setSelectedPin(pin)}>
              <span className="valve-anatomy-number">{PIN_ORDER.indexOf(pin) + 1}</span><span>{PIN_DETAILS[pin].label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="valve-showcase__disclaimer"><Info size={14} /><span><strong>Minh họa cơ chế.</strong> Hình vẽ lấy cảm hứng từ mô hình structural mechanics lý tưởng hóa của van nhĩ thất phải trong Kamensky et al. (2018), không phải dữ liệu ca 0225, không tính MIPE/FFRCT và không phải mô phỏng FSI bệnh nhân.</span><a href="https://yan.cee.illinois.edu/files/2021/08/1-s2.0-S0045782517307120-main.pdf" target="_blank" rel="noreferrer">Đọc paper nguồn <ExternalLink size={13} /></a></div>
    </section>
  )
}
