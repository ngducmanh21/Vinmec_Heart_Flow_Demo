import { useEffect, useId, useMemo, useState } from 'react'
import { ExternalLink, Info, Pause, Play, RotateCcw, SlidersHorizontal } from 'lucide-react'
import './AneurysmDemo.css'

type Streamline = {
  d: string
  startY: number
  duration: number
  label: string
}

type AneurysmGeometry = {
  vessel: string
  centerline: string
  streamlines: Streamline[]
  recirculation: string
  region: { cx: number; cy: number; rx: number; ry: number }
  label: { x: number; y: number }
  recirculationLabel: string
}

const DEFAULT_BULGE = 72
const NARROW_BULGE = 40
const BROAD_BULGE = 92

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function buildGeometry(bulge: number): AneurysmGeometry {
  const ratio = clamp((bulge - 35) / 65, 0, 1)
  // The pouch grows off the upper wall while the lower wall stays continuous,
  // which keeps the sketch closer to a side aneurysm geometry.
  const top = 188 - ratio * 90
  const mainTop = 214
  const mainBottom = 306
  const sacLeft = 254 - ratio * 10
  const sacRight = 646 + ratio * 21
  const cx = (sacLeft + sacRight) / 2
  const cy = top + 78 + ratio * 10
  const rx = 78 + ratio * 62
  const ry = 34 + ratio * 29

  const vessel = [
    `M 72 ${mainTop}`,
    `C 132 ${mainTop} 178 ${mainTop} 222 ${mainTop}`,
    `C 252 ${mainTop} 264 ${top + 48} ${sacLeft + 25} ${top + 12}`,
    `C ${sacLeft + 112} ${top - 12} ${sacRight - 117} ${top - 12} ${sacRight - 24} ${top + 12}`,
    `C ${sacRight + 2} ${top + 48} ${sacRight + 6} ${mainTop} ${sacRight + 37} ${mainTop}`,
    `C 716 ${mainTop} 774 ${mainTop} 828 ${mainTop}`,
    `L 828 ${mainBottom}`,
    `C 774 ${mainBottom} 716 ${mainBottom} ${sacRight + 37} ${mainBottom}`,
    `C ${sacRight + 6} ${mainBottom} ${sacRight + 2} ${mainBottom} ${sacRight - 24} ${mainBottom}`,
    `L ${sacLeft + 25} ${mainBottom}`,
    `C 264 ${mainBottom} 252 ${mainBottom} 222 ${mainBottom}`,
    `C 178 ${mainBottom} 132 ${mainBottom} 72 ${mainBottom}`,
    'Z',
  ].join(' ')

  const centerline = `M 72 260 C 148 260 198 260 245 260 C 382 260 536 260 680 260 C 737 260 780 260 828 260`
  const topFlow = `M 72 236 C 150 236 202 236 244 239 C 296 241 319 ${top + 54} ${cx - 30} ${top + 42} C ${cx + 70} ${top + 34} ${sacRight - 41} 240 680 238 C 738 237 780 236 828 236`
  const middleFlow = centerline
  const bottomFlow = `M 72 284 C 150 284 202 284 244 281 C 308 279 333 285 ${cx - 12} 281 C ${cx + 72} 280 ${sacRight - 41} 280 680 282 C 738 283 780 284 828 284`
  const recirculation = [
    `M ${cx + rx} ${cy - 2}`,
    `C ${cx + rx + 12} ${cy - ry * 0.66} ${cx + rx * 0.47} ${cy - ry} ${cx} ${cy - ry}`,
    `C ${cx - rx * 0.56} ${cy - ry} ${cx - rx} ${cy - ry * 0.53} ${cx - rx} ${cy}`,
    `C ${cx - rx} ${cy + ry * 0.56} ${cx - rx * 0.48} ${cy + ry} ${cx} ${cy + ry}`,
    `C ${cx + rx * 0.54} ${cy + ry} ${cx + rx} ${cy + ry * 0.48} ${cx + rx} ${cy - 2}`,
  ].join(' ')

  return {
    vessel,
    centerline,
    streamlines: [
      { d: topFlow, startY: 220, duration: 7.5, label: 'Dòng vào phía trên' },
      { d: middleFlow, startY: 260, duration: 6.2, label: 'Dòng chính' },
      { d: bottomFlow, startY: 300, duration: 8.2, label: 'Dòng vào phía dưới' },
    ],
    recirculation,
    region: { cx, cy, rx, ry },
    label: { x: cx + rx * 0.42, y: cy - ry - 18 },
    recirculationLabel: ratio > 0.58 ? 'vùng hồi lưu rộng hơn' : 'vùng hồi lưu',
  }
}

function titleForBulge(bulge: number) {
  if (bulge < 55) return 'Túi phình hẹp'
  if (bulge > 78) return 'Túi phình rộng'
  return 'Túi phình trung gian'
}

export default function AneurysmDemo() {
  const [bulge, setBulge] = useState(DEFAULT_BULGE)
  const [isPlaying, setIsPlaying] = useState(true)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const rangeId = useId()
  const geometry = useMemo(() => buildGeometry(bulge), [bulge])
  const shapeTitle = titleForBulge(bulge)
  const motionActive = isPlaying && !prefersReducedMotion
  const animationClass = motionActive ? 'is-playing' : 'is-paused'

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)
    updatePreference()
    mediaQuery.addEventListener?.('change', updatePreference)
    return () => mediaQuery.removeEventListener?.('change', updatePreference)
  }, [])

  function chooseShape(nextBulge: number) {
    setBulge(nextBulge)
    setIsPlaying(true)
  }

  function resetDemo() {
    setBulge(DEFAULT_BULGE)
    setIsPlaying(true)
  }

  return (
    <section className="aneurysm-demo" aria-labelledby={`${rangeId}-title`}>
      <header className="aneurysm-demo__header">
        <div>
          <span className="aneurysm-demo__eyebrow"><span aria-hidden="true" /> ANEURYSM FLOW · DÒNG HỒI LƯU</span>
          <h2 id={`${rangeId}-title`}>Dòng hồi lưu trong túi phình</h2>
          <p>Khảo sát định tính cách hình dạng túi làm đổi vùng dòng chảy cục bộ. Kéo thanh điều khiển để xem túi hẹp và túi rộng.</p>
        </div>
        <span className="aneurysm-demo__source-chip">JING ET AL. · PLOS ONE 2015</span>
      </header>

      <div className="aneurysm-demo__layout">
        <div className="aneurysm-demo__visual-card">
          <div className="aneurysm-demo__visual-head">
            <span><span className="aneurysm-demo__live-dot" aria-hidden="true" /> MINH HỌA DÒNG CHẢY</span>
            <span>{shapeTitle}</span>
          </div>

          <div className="aneurysm-demo__canvas-wrap">
            <svg
              className={`aneurysm-demo__canvas ${animationClass}`}
              viewBox="0 0 900 520"
              role="img"
              aria-labelledby={`${rangeId}-svg-title ${rangeId}-svg-desc`}
            >
              <title id={`${rangeId}-svg-title`}>Minh họa dòng chảy qua túi phình</title>
              <desc id={`${rangeId}-svg-desc`}>Mũi tên và các hạt chuyển động từ trái sang phải. Vùng nét đứt ở giữa túi phình biểu thị dòng hồi lưu mang tính minh họa.</desc>
              <defs>
                <linearGradient id={`${rangeId}-lumen`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#123e50" />
                  <stop offset="0.52" stopColor="#0c2c3c" />
                  <stop offset="1" stopColor="#102f3d" />
                </linearGradient>
                <linearGradient id={`${rangeId}-flow`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#63c8bd" />
                  <stop offset="0.55" stopColor="#b4f3d9" />
                  <stop offset="1" stopColor="#f1c56b" />
                </linearGradient>
                <radialGradient id={`${rangeId}-recirc`} cx="50%" cy="50%" r="70%">
                  <stop offset="0" stopColor="#4fbab3" stopOpacity="0.22" />
                  <stop offset="1" stopColor="#2a7d86" stopOpacity="0.02" />
                </radialGradient>
                <filter id={`${rangeId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <marker id={`${rangeId}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#e8c274" />
                </marker>
                <marker id={`${rangeId}-recirc-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#a9e9d1" />
                </marker>
              </defs>

              <rect width="900" height="520" rx="8" fill="#091f2c" />
              <path d="M 34 110 H 866 M 34 410 H 866" stroke="#1c4a58" strokeWidth="1" strokeDasharray="3 11" />
              <path d={geometry.vessel} fill={`url(#${rangeId}-lumen)`} stroke="#63c8bd" strokeWidth="4" strokeLinejoin="round" />
              <path d={geometry.vessel} fill="none" stroke="#a0e4d1" strokeOpacity="0.2" strokeWidth="14" filter={`url(#${rangeId}-glow)`} />
              <path d={geometry.centerline} fill="none" stroke="#e4c170" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="3 9" markerEnd={`url(#${rangeId}-arrow)`} />

              <ellipse
                className="aneurysm-demo__recirc-fill"
                cx={geometry.region.cx}
                cy={geometry.region.cy}
                rx={geometry.region.rx}
                ry={geometry.region.ry}
                fill={`url(#${rangeId}-recirc)`}
              />
              <path
                className="aneurysm-demo__recirc-line"
                d={geometry.recirculation}
                fill="none"
                stroke="#a9e9d1"
                strokeWidth="3"
                strokeDasharray="7 9"
                markerEnd={`url(#${rangeId}-recirc-arrow)`}
              />

              {geometry.streamlines.map((streamline, index) => (
                <g key={streamline.label} aria-hidden="true">
                  <path
                    className="aneurysm-demo__streamline"
                    d={streamline.d}
                    fill="none"
                    pathLength="1"
                    stroke={`url(#${rangeId}-flow)`}
                    strokeWidth={index === 1 ? 4 : 3}
                    strokeLinecap="round"
                    markerEnd={`url(#${rangeId}-arrow)`}
                    style={{ animationDelay: `${index * -0.7}s` }}
                  />
                  {[0, 1, 2].map(particle => (
                    <circle
                      key={`${streamline.label}-${particle}`}
                      className="aneurysm-demo__particle"
                      cx="78"
                      cy={streamline.startY}
                      r={particle === 1 ? 4 : 3}
                      style={{ animationDelay: `${(particle * 0.92 + index * 0.31) * -1}s` }}
                    >
                      {motionActive && (
                        <animateMotion dur={`${streamline.duration}s`} begin={`${particle * 0.92}s`} repeatCount="indefinite" path={streamline.d} rotate="auto" />
                      )}
                    </circle>
                  ))}
                </g>
              ))}

              <g className="aneurysm-demo__label aneurysm-demo__label--inlet">
                <text x="72" y="165">DÒNG VÀO</text>
                <path d="M 107 172 V 200" />
              </g>
              <g className="aneurysm-demo__label aneurysm-demo__label--recirc">
                <text x={geometry.label.x} y={geometry.label.y}>{geometry.recirculationLabel.toUpperCase()}</text>
                <path d={`M ${geometry.label.x - 7} ${geometry.label.y + 8} L ${geometry.region.cx + geometry.region.rx * 0.55} ${geometry.region.cy - geometry.region.ry * 0.55}`} />
              </g>
              <g className="aneurysm-demo__label aneurysm-demo__label--outlet">
                <text x="737" y="165">DÒNG RA</text>
                <path d="M 766 172 V 200" />
              </g>
              <text className="aneurysm-demo__axis-label" x="450" y="476">hướng dòng chính →</text>
            </svg>
          </div>

          <div className="aneurysm-demo__legend" aria-label="Chú giải hình minh họa">
            <span><i className="aneurysm-demo__legend-line aneurysm-demo__legend-line--flow" /> Dòng chính</span>
            <span><i className="aneurysm-demo__legend-line aneurysm-demo__legend-line--recirc" /> Hồi lưu</span>
            <span><i className="aneurysm-demo__legend-dot" /> Thành mô hình</span>
          </div>
        </div>

        <aside className="aneurysm-demo__controls" aria-label="Điều khiển mô phỏng">
          <div className="aneurysm-demo__control-heading">
            <div>
              <span className="aneurysm-demo__control-kicker"><SlidersHorizontal size={14} /> THAM SỐ HÌNH HỌC</span>
              <h3>Đổi hình dạng túi</h3>
            </div>
            <button type="button" className="aneurysm-demo__icon-button" onClick={resetDemo} aria-label="Đặt lại mô phỏng" title="Đặt lại mô phỏng">
              <RotateCcw size={15} />
            </button>
          </div>
          <p className="aneurysm-demo__control-copy">Thanh trượt chỉ thay đổi hình học minh họa và phạm vi vùng hồi lưu. Không có số đo sinh lý được suy ra.</p>

          <div className="aneurysm-demo__preset-row" role="group" aria-label="Mức phình đặt sẵn">
            <button type="button" className={bulge === NARROW_BULGE ? 'is-selected' : ''} onClick={() => chooseShape(NARROW_BULGE)} aria-pressed={bulge === NARROW_BULGE}>Túi hẹp</button>
            <button type="button" className={bulge === BROAD_BULGE ? 'is-selected' : ''} onClick={() => chooseShape(BROAD_BULGE)} aria-pressed={bulge === BROAD_BULGE}>Túi rộng</button>
          </div>

          <div className="aneurysm-demo__range-wrap">
            <div className="aneurysm-demo__range-label"><label htmlFor={`${rangeId}-bulge`}>Mức phình minh họa</label><strong>{shapeTitle}</strong></div>
            <input
              id={`${rangeId}-bulge`}
              type="range"
              min="35"
              max="100"
              value={bulge}
              onChange={event => setBulge(Number(event.currentTarget.value))}
              aria-valuetext={shapeTitle}
            />
            <div className="aneurysm-demo__range-scale" aria-hidden="true"><span>hẹp</span><span>rộng</span></div>
          </div>

          <button type="button" className="aneurysm-demo__play-button" onClick={() => setIsPlaying(current => !current)} aria-pressed={isPlaying} disabled={prefersReducedMotion}>
            {motionActive ? <Pause size={16} /> : <Play size={16} />}
            {prefersReducedMotion ? 'Chuyển động đã tắt' : motionActive ? 'Tạm dừng hạt dòng chảy' : 'Phát hạt dòng chảy'}
          </button>

          <div className="aneurysm-demo__read-card">
            <div className="aneurysm-demo__read-row"><span className="aneurysm-demo__read-icon aneurysm-demo__read-icon--flow" aria-hidden="true">→</span><div><strong>Hướng dòng</strong><p>Dòng chính đi từ trái sang phải qua túi.</p></div></div>
            <div className="aneurysm-demo__read-row"><span className="aneurysm-demo__read-icon aneurysm-demo__read-icon--recirc" aria-hidden="true">↻</span><div><strong>Vùng hồi lưu</strong><p>Nét đứt và mũi tên vòng biểu thị vùng dòng quay lại.</p></div></div>
          </div>

          <div className="aneurysm-demo__notice"><Info size={15} /><p><strong>Minh họa dòng hồi lưu; không dự đoán vỡ và không phải ca 0225.</strong> Đây là mô phỏng giáo dục định tính, không phải CFD bệnh nhân.</p></div>
          <a className="aneurysm-demo__source-link" href="https://doi.org/10.1371/journal.pone.0132494" target="_blank" rel="noreferrer">
            Đọc nguồn Jing et al. (PLOS ONE, 2015) <ExternalLink size={13} />
          </a>
        </aside>
      </div>

      <footer className="aneurysm-demo__footer">
        <span>Chế độ chuyển động tôn trọng cài đặt giảm chuyển động của trình duyệt.</span>
        <span>Hình học được tạo lại để minh họa tương tác.</span>
      </footer>
    </section>
  )
}
