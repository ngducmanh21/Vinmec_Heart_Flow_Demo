import { useEffect, useId, useMemo, useState } from 'react'
import {
  Check,
  ChevronRight,
  Crosshair,
  Info,
  Layers3,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  Target,
} from 'lucide-react'
import {
  DEMO_CASE,
  DEMO_LESIONS,
  type DemoLesion,
  type LesionSelectionProps,
  getDemoLesion,
} from './coronaryDemoData'
import './CoronaryPlanDemo.css'

type PlanExtent = 'focal' | 'balanced' | 'long'

const EXTENT_COPY: Record<PlanExtent, { label: string; detail: string; offset: number }> = {
  focal: { label: 'Gọn', detail: 'phủ tổn thương + 4 mm', offset: 4 },
  balanced: { label: 'Cân bằng', detail: 'phủ tổn thương + 8 mm', offset: 8 },
  long: { label: 'Dài hơn', detail: 'phủ tổn thương + 14 mm', offset: 14 },
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatRatio(value: number) {
  return value.toFixed(2)
}

function getExtentFromLength(lesion: DemoLesion, length: number): PlanExtent {
  const offset = length - lesion.lengthMm
  if (offset <= 5) return 'focal'
  if (offset <= 10) return 'balanced'
  return 'long'
}

function VesselPlanGraphic({ lesion, stentLength }: { lesion: DemoLesion; stentLength: number }) {
  const lesionWidth = clamp(lesion.severityPct * 0.72, 28, 66)
  const stentWidth = clamp(190 + (stentLength - lesion.lengthMm - 8) * 8, 155, 285)
  const stentLeft = 452 - stentWidth / 2
  const stentRight = 452 + stentWidth / 2
  const lesionLeft = 452 - lesionWidth / 2
  const lesionRight = 452 + lesionWidth / 2
  const landingLeft = stentLeft + 12
  const landingRight = stentRight - 12
  const beforeTop = 62
  const beforeBottom = 168
  const afterTop = 262
  const afterBottom = 368
  const beforePath = [
    `M 82 ${beforeTop}`,
    `C 190 ${beforeTop} 280 ${beforeTop} 354 ${beforeTop}`,
    `C 397 ${beforeTop} 414 ${beforeTop + lesion.severityPct * 0.18} 432 ${beforeTop + 13 + lesion.severityPct * 0.42}`,
    `C 445 ${beforeTop + 21 + lesion.severityPct * 0.44} 459 ${beforeTop + 21 + lesion.severityPct * 0.44} 472 ${beforeTop + 13 + lesion.severityPct * 0.42}`,
    `C 490 ${beforeTop + lesion.severityPct * 0.18} 507 ${beforeTop} 550 ${beforeTop}`,
    `C 628 ${beforeTop} 718 ${beforeTop} 818 ${beforeTop}`,
    `L 818 ${beforeBottom}`,
    `C 718 ${beforeBottom} 628 ${beforeBottom} 550 ${beforeBottom}`,
    `C 507 ${beforeBottom} 490 ${beforeBottom - lesion.severityPct * 0.18} 472 ${beforeBottom - 13 - lesion.severityPct * 0.42}`,
    `C 459 ${beforeBottom - 21 - lesion.severityPct * 0.44} 445 ${beforeBottom - 21 - lesion.severityPct * 0.44} 432 ${beforeBottom - 13 - lesion.severityPct * 0.42}`,
    `C 414 ${beforeBottom - lesion.severityPct * 0.18} 397 ${beforeBottom} 354 ${beforeBottom}`,
    `C 280 ${beforeBottom} 190 ${beforeBottom} 82 ${beforeBottom} Z`,
  ].join(' ')
  const afterPath = `M 82 ${afterTop} C 270 ${afterTop} 344 ${afterTop} 818 ${afterTop} L 818 ${afterBottom} C 344 ${afterBottom} 270 ${afterBottom} 82 ${afterBottom} Z`

  return (
    <div className="coronary-plan__graphic-card">
      <div className="coronary-plan__graphic-head">
        <div>
          <span className="coronary-plan__live-dot" aria-hidden="true" />
          <strong>ĐƯỜNG KÍNH LÒNG MẠCH</strong>
          <span className="coronary-plan__muted">· plan preview</span>
        </div>
        <span className="coronary-plan__graphic-chip"><ScanLine size={12} /> {lesion.branchLabel} · {lesion.location}</span>
      </div>

      <svg
        className="coronary-plan__graphic"
        viewBox="0 0 900 460"
        role="img"
        aria-labelledby="coronary-plan-graphic-title coronary-plan-graphic-desc"
      >
        <title id="coronary-plan-graphic-title">So sánh lòng mạch trước và sau kế hoạch đặt stent</title>
        <desc id="coronary-plan-graphic-desc">Hai sơ đồ minh họa đoạn hẹp và lòng mạch được mở rộng sau khi đặt stent. Các vùng đáp lành ở hai đầu stent được đánh dấu bằng đường nét đứt.</desc>
        <defs>
          <linearGradient id="coronary-plan-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0a2937" />
            <stop offset="1" stopColor="#123c49" />
          </linearGradient>
          <linearGradient id="coronary-plan-lumen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#54bab8" stopOpacity=".82" />
            <stop offset=".48" stopColor="#2d7f8e" stopOpacity=".9" />
            <stop offset="1" stopColor="#1d566b" stopOpacity=".88" />
          </linearGradient>
          <linearGradient id="coronary-plan-stent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c5efe0" stopOpacity=".84" />
            <stop offset=".5" stopColor="#60c5bb" stopOpacity=".46" />
            <stop offset="1" stopColor="#82d4c8" stopOpacity=".76" />
          </linearGradient>
          <filter id="coronary-plan-glow" x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <pattern id="coronary-plan-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#a3d8d51a" strokeWidth="1" />
          </pattern>
          <clipPath id="coronary-plan-after-clip">
            <path d={afterPath} />
          </clipPath>
        </defs>

        <rect width="900" height="460" rx="10" fill="url(#coronary-plan-bg)" />
        <rect width="900" height="460" rx="10" fill="url(#coronary-plan-grid)" />
        <line x1="34" y1="215" x2="866" y2="215" stroke="#9adbd624" strokeDasharray="4 8" />

        <text x="38" y="30" className="coronary-plan__svg-kicker">01 / TRƯỚC KẾ HOẠCH</text>
        <text x="862" y="30" textAnchor="end" className="coronary-plan__svg-kicker">ĐOẠN HẸP ĐƯỢC ĐÁNH DẤU</text>
        <path d={beforePath} fill="url(#coronary-plan-lumen)" stroke="#69cac1" strokeWidth="2.5" />
        <path d={`M ${lesionLeft - 18} ${beforeTop + 12} C ${lesionLeft} ${beforeTop + 12} ${lesionRight} ${beforeTop + 12} ${lesionRight + 18} ${beforeTop + 12} L ${lesionRight + 18} ${beforeBottom - 12} C ${lesionRight} ${beforeBottom - 12} ${lesionLeft} ${beforeBottom - 12} ${lesionLeft - 18} ${beforeBottom - 12} Z`} fill="#f1b06a1d" stroke="#e8aa68" strokeWidth="1.5" strokeDasharray="5 5" />
        <line x1={lesionLeft} y1="42" x2={lesionLeft} y2={beforeTop - 2} stroke="#efbd79" strokeDasharray="3 3" />
        <line x1={lesionRight} y1="42" x2={lesionRight} y2={beforeTop - 2} stroke="#efbd79" strokeDasharray="3 3" />
        <text x="452" y="37" textAnchor="middle" className="coronary-plan__svg-focus">ĐOẠN HẸP · {lesion.severityPct}%</text>
        <text x="450" y="197" textAnchor="middle" className="coronary-plan__svg-note">Lòng mạch hẹp hơn tại vùng tổn thương</text>

        <text x="38" y="237" className="coronary-plan__svg-kicker">02 / SAU KẾ HOẠCH</text>
        <text x="862" y="237" textAnchor="end" className="coronary-plan__svg-kicker">STENT ẢO · {stentLength} mm</text>
        <path d={afterPath} fill="url(#coronary-plan-lumen)" stroke="#69cac1" strokeWidth="2.5" />
        <g clipPath="url(#coronary-plan-after-clip)" opacity=".94">
          <rect x={stentLeft} y="246" width={stentWidth} height="142" rx="23" fill="#75d0c31b" stroke="#b6eee0" strokeWidth="2" strokeDasharray="7 5" />
          {Array.from({ length: 13 }, (_, index) => {
            const x = stentLeft + 9 + index * ((stentWidth - 18) / 12)
            return <path key={x} d={`M ${x} 250 C ${x - 8} 278 ${x + 8} 306 ${x} 328 C ${x - 8} 350 ${x + 8} 378 ${x} 384`} fill="none" stroke="url(#coronary-plan-stent)" strokeWidth="2.4" />
          })}
          <path d={`M ${stentLeft + 5} 272 H ${stentRight - 5} M ${stentLeft + 5} 358 H ${stentRight - 5}`} stroke="#d2f5e84c" strokeWidth="2" />
        </g>
        <path d={`M ${landingLeft} ${afterTop - 7} V ${afterBottom + 8} M ${landingRight} ${afterTop - 7} V ${afterBottom + 8}`} stroke="#f2c778" strokeWidth="1.4" strokeDasharray="4 5" />
        <path d={`M ${stentLeft} 398 H ${stentRight}`} stroke="#a9e7d6" strokeWidth="1.5" />
        <path d={`M ${stentLeft} 392 V 404 M ${stentRight} 392 V 404`} stroke="#a9e7d6" strokeWidth="1.5" />
        <text x="452" y="424" textAnchor="middle" className="coronary-plan__svg-note">phạm vi điều trị ảo · điều chỉnh bằng thanh bên</text>
        <text x={landingLeft - 4} y="386" textAnchor="end" className="coronary-plan__svg-landing">VÙNG ĐÁP LÀNH</text>
        <text x={landingRight + 4} y="386" className="coronary-plan__svg-landing">VÙNG ĐÁP LÀNH</text>
        <circle cx={landingLeft} cy={afterTop - 7} r="4" fill="#f2c778" filter="url(#coronary-plan-glow)" />
        <circle cx={landingRight} cy={afterTop - 7} r="4" fill="#f2c778" filter="url(#coronary-plan-glow)" />
        <text x="38" y="450" className="coronary-plan__svg-foot">MÀU TEAL = LÒNG MẠCH · VÀNG = VÙNG ĐÁNH DẤU CHO KẾ HOẠCH</text>
        <text x="862" y="450" textAnchor="end" className="coronary-plan__svg-foot">SƠ ĐỒ HÌNH HỌC MINH HỌA</text>
      </svg>
    </div>
  )
}

function RatioCard({ lesion }: { lesion: DemoLesion }) {
  return (
    <section className="coronary-plan__ratio-card" aria-labelledby="coronary-plan-ratio-title">
      <div className="coronary-plan__panel-label"><Target size={14} /> PHYSIOLOGY PRESET</div>
      <div className="coronary-plan__ratio-title"><div><h3 id="coronary-plan-ratio-title">Tỷ lệ minh họa trước / sau</h3><p>Giá trị preset để kể câu chuyện của kế hoạch</p></div><span>illustrative</span></div>
      <div className="coronary-plan__ratio-bars">
        <div className="coronary-plan__ratio-item">
          <div><span>Trước kế hoạch</span><strong>{formatRatio(lesion.distalRatio)}</strong></div>
          <div className="coronary-plan__ratio-track"><i className="is-before" style={{ width: `${lesion.distalRatio * 100}%` }} /></div>
        </div>
        <ChevronRight className="coronary-plan__ratio-arrow" size={17} aria-hidden="true" />
        <div className="coronary-plan__ratio-item">
          <div><span>Phương án mẫu</span><strong>{formatRatio(lesion.plannedRatio)}</strong></div>
          <div className="coronary-plan__ratio-track"><i className="is-after" style={{ width: `${lesion.plannedRatio * 100}%` }} /></div>
        </div>
      </div>
      <p className="coronary-plan__ratio-foot"><Info size={13} /> Chỉ là tỷ lệ dựng sẵn cho showcase, không phải FFR/FFR<sub>CT</sub>, không phải kết quả solver.</p>
    </section>
  )
}

export default function CoronaryPlanDemo({ selectedLesionId, onSelectLesion }: LesionSelectionProps) {
  const lengthId = useId()
  const selectedLesion = getDemoLesion(selectedLesionId)
  const [stentLength, setStentLength] = useState(selectedLesion.lengthMm + 8)
  const [extent, setExtent] = useState<PlanExtent>('balanced')
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareIds, setCompareIds] = useState<DemoLesion['id'][]>([selectedLesionId])

  useEffect(() => {
    setStentLength(selectedLesion.lengthMm + 8)
    setExtent('balanced')
    setCompareIds((current) => current.includes(selectedLesion.id) ? current : [selectedLesion.id, ...current].slice(0, 3))
  }, [selectedLesion.id, selectedLesion.lengthMm])

  const minLength = selectedLesion.lengthMm + 4
  const maxLength = selectedLesion.lengthMm + 18
  const activeCompareLesions = useMemo(
    () => DEMO_LESIONS.filter((lesion) => compareIds.includes(lesion.id)),
    [compareIds],
  )

  const changeExtent = (nextExtent: PlanExtent) => {
    setExtent(nextExtent)
    setStentLength(selectedLesion.lengthMm + EXTENT_COPY[nextExtent].offset)
  }

  const changeLength = (value: number) => {
    setStentLength(value)
    setExtent(getExtentFromLength(selectedLesion, value))
  }

  const reset = () => {
    setStentLength(selectedLesion.lengthMm + 8)
    setExtent('balanced')
    setCompareOpen(false)
    setCompareIds([selectedLesion.id])
  }

  const toggleCompare = (id: DemoLesion['id']) => {
    setCompareIds((current) => {
      if (current.includes(id)) return current.length === 1 ? current : current.filter((item) => item !== id)
      return current.length >= 3 ? current : [...current, id]
    })
  }

  return (
    <section className="coronary-plan" aria-labelledby="coronary-plan-title">
      <header className="coronary-plan__hero">
        <div className="coronary-plan__hero-copy">
          <div className="coronary-plan__eyebrow"><span className="coronary-plan__eyebrow-dot" /> PCI PLANNING · VIRTUAL WORKSPACE</div>
          <h2 id="coronary-plan-title">Từ tổn thương đến một kế hoạch đặt stent có thể nhìn thấy</h2>
          <p>Chọn một đoạn hẹp tổng hợp, điều chỉnh phạm vi điều trị và xem các điểm đáp lành thay đổi trên bản xem trước.</p>
        </div>
        <div className="coronary-plan__synthetic-badge" aria-label="Dữ liệu tổng hợp SIM-COR-01">
          <ShieldCheck size={20} />
          <span><b>{DEMO_CASE.id}</b><small>synthetic showcase</small></span>
        </div>
      </header>

      <div className="coronary-plan__notice" role="note">
        <Info size={16} aria-hidden="true" />
        <span><strong>Không phải ca bệnh.</strong> Hình học, tỷ lệ và thông số trong khu này được dựng cho showcase tương tác; không phải dự đoán lâm sàng hay khuyến nghị điều trị.</span>
      </div>

      <div className="coronary-plan__lesion-rail" aria-label="Chọn tổn thương giả lập">
        <div className="coronary-plan__rail-label"><Crosshair size={14} /> CHỌN TỔN THƯƠNG</div>
        {DEMO_LESIONS.map((lesion) => {
          const isActive = lesion.id === selectedLesion.id
          return (
            <button key={lesion.id} type="button" className={`coronary-plan__lesion-tab${isActive ? ' is-active' : ''}`} onClick={() => onSelectLesion(lesion.id)} aria-pressed={isActive}>
              <span className="coronary-plan__lesion-id">{lesion.id}</span>
              <span><strong>{lesion.branchLabel}</strong><small>{lesion.location}</small></span>
              <b>{lesion.severityPct}%</b>
            </button>
          )
        })}
        <button type="button" className="coronary-plan__reset" onClick={reset}><RotateCcw size={13} /> Đặt lại</button>
      </div>

      <div className="coronary-plan__workspace">
        <div className="coronary-plan__main-column">
          <VesselPlanGraphic lesion={selectedLesion} stentLength={stentLength} />
          <RatioCard lesion={selectedLesion} />
        </div>

        <aside className="coronary-plan__controls" aria-label="Điều khiển kế hoạch PCI">
          <div className="coronary-plan__panel-label"><SlidersHorizontal size={14} /> PLAN CONTROLS</div>
          <div className="coronary-plan__selected-heading"><div><span>ĐANG XEM</span><h3>{selectedLesion.branchLabel} · {selectedLesion.location}</h3></div><span className="coronary-plan__severity-badge">{selectedLesion.severityPct}% hẹp</span></div>

          <fieldset className="coronary-plan__extent-fieldset">
            <legend>Phạm vi điều trị ảo</legend>
            <div className="coronary-plan__extent-grid">
              {(Object.keys(EXTENT_COPY) as PlanExtent[]).map((item) => (
                <button key={item} type="button" className={`coronary-plan__extent-button${extent === item ? ' is-active' : ''}`} onClick={() => changeExtent(item)} aria-pressed={extent === item}>
                  <span>{extent === item ? <Check size={13} /> : <span className="coronary-plan__empty-check" />}{EXTENT_COPY[item].label}</span>
                  <small>{EXTENT_COPY[item].detail}</small>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="coronary-plan__slider-heading"><label htmlFor={lengthId}>Chiều dài stent ảo</label><output htmlFor={lengthId}>{stentLength} mm</output></div>
          <input id={lengthId} className="coronary-plan__slider" type="range" min={minLength} max={maxLength} value={stentLength} onChange={(event) => changeLength(Number(event.target.value))} aria-describedby={`${lengthId}-hint`} />
          <div className="coronary-plan__slider-scale"><span>{minLength} mm</span><span>{maxLength} mm</span></div>
          <p id={`${lengthId}-hint`} className="coronary-plan__control-hint">Thanh này chỉ thay đổi chiều dài hình vẽ và phạm vi đánh dấu.</p>

          <div className="coronary-plan__planning-card">
            <div className="coronary-plan__panel-label"><Layers3 size={14} /> LANDING ZONES</div>
            <div className="coronary-plan__planning-row"><span><i className="is-zone" /> Mốc đáp lành giả lập</span><strong>{selectedLesion.planning.landingZoneMm} mm</strong></div>
            <div className="coronary-plan__planning-row"><span><i className="is-angle" /> Góc C-arm mẫu</span><strong>{selectedLesion.planning.cArmAngle}</strong></div>
            <p>Hai vùng đáp được đánh dấu để giải thích phạm vi phủ trong kế hoạch ảo.</p>
          </div>

          <button type="button" className={`coronary-plan__compare-toggle${compareOpen ? ' is-open' : ''}`} onClick={() => setCompareOpen((value) => !value)} aria-expanded={compareOpen}>
            <span><Layers3 size={15} /> So sánh nhiều tổn thương</span><ChevronRight size={15} />
          </button>
          {compareOpen && (
            <div className="coronary-plan__compare-panel">
              <p>Chọn tối đa 3 đoạn để đặt cạnh nhau.</p>
              {DEMO_LESIONS.map((lesion) => (
                <label key={lesion.id} className="coronary-plan__compare-option">
                  <input type="checkbox" checked={compareIds.includes(lesion.id)} onChange={() => toggleCompare(lesion.id)} />
                  <span className="coronary-plan__fake-checkbox" aria-hidden="true">{compareIds.includes(lesion.id) && <Check size={12} />}</span>
                  <span><strong>{lesion.id} · {lesion.branchLabel}</strong><small>{lesion.location} · {lesion.severityPct}%</small></span>
                </label>
              ))}
              <div className="coronary-plan__compare-table" role="table" aria-label="Bảng so sánh tổn thương">
                <div className="coronary-plan__compare-table-head" role="row"><span>ĐOẠN</span><span>HẸP</span><span>PRESET SAU</span></div>
                {activeCompareLesions.map((lesion) => <div key={lesion.id} className="coronary-plan__compare-table-row" role="row"><strong>{lesion.branchLabel}</strong><span>{lesion.severityPct}%</span><b>{formatRatio(lesion.plannedRatio)}</b></div>)}
              </div>
            </div>
          )}
        </aside>
      </div>

      <footer className="coronary-plan__footer"><span><Target size={13} /> {selectedLesion.branchLabel} · {selectedLesion.location} · kế hoạch đang chọn: {stentLength} mm</span><span>preset physiology · synthetic only</span></footer>
    </section>
  )
}
