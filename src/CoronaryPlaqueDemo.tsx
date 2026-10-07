import { BarChart3, Info, Layers3, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import { useId, useMemo } from 'react'
import { DEMO_CASE, DEMO_LESIONS, DEMO_PLAQUE_TOTAL_MM3, type DemoLesion, type LesionSelectionProps } from './coronaryDemoData'
import './CoronaryPlaqueDemo.css'

type PlaqueComposition = DemoLesion['plaqueMm3']

const COMPOSITION_ITEMS: Array<{ key: keyof PlaqueComposition; label: string; shortLabel: string; color: string }> = [
  { key: 'nonCalcified', label: 'Không vôi hóa', shortLabel: 'Non-calcified', color: '#72c8bd' },
  { key: 'calcified', label: 'Vôi hóa', shortLabel: 'Calcified', color: '#e6b36f' },
  { key: 'lowAttenuation', label: 'Giảm đậm độ', shortLabel: 'Low attenuation', color: '#c696bd' },
]

function plaqueTotal(composition: PlaqueComposition) {
  return composition.nonCalcified + composition.calcified + composition.lowAttenuation
}

function stageForPlaque(composition: PlaqueComposition, severity: number) {
  const total = plaqueTotal(composition)
  const lowAttenuationShare = composition.lowAttenuation / total
  if (lowAttenuationShare > .12) return { label: 'Pha C · hỗn hợp có vùng giảm đậm độ', tone: 'is-violet', detail: 'Nhãn giáo dục dựa trên cấu phần synthetic' }
  if (severity >= 60) return { label: 'Pha B · mảng phối hợp tại vùng hẹp', tone: 'is-amber', detail: 'Nhãn giáo dục dựa trên cấu phần synthetic' }
  return { label: 'Pha A · mảng nhẹ trong mô hình', tone: 'is-teal', detail: 'Nhãn giáo dục dựa trên cấu phần synthetic' }
}

function CompositionRing({ composition, titleId }: { composition: PlaqueComposition; titleId: string }) {
  const total = plaqueTotal(composition)
  let offset = 0
  return (
    <svg className="coronary-plaque__ring" viewBox="0 0 220 220" role="img" aria-labelledby={`${titleId}-ring-title ${titleId}-ring-desc`}>
      <title id={`${titleId}-ring-title`}>Mặt cắt tỷ lệ thành phần mảng bám synthetic</title>
      <desc id={`${titleId}-ring-desc`}>Vòng màu thể hiện tỷ lệ tương đối của mô không vôi hóa, vôi hóa và vùng giảm đậm độ trong vùng đang chọn.</desc>
      <circle cx="110" cy="110" r="78" fill="none" stroke="#dcebed" strokeWidth="29" />
      {COMPOSITION_ITEMS.map(item => {
        const share = composition[item.key] / total
        const dash = share * 490
        const currentOffset = offset
        offset += dash
        return <circle key={item.key} cx="110" cy="110" r="78" fill="none" stroke={item.color} strokeWidth="29" strokeDasharray={`${dash} ${490 - dash}`} strokeDashoffset={-currentOffset} transform="rotate(-90 110 110)" />
      })}
      <circle cx="110" cy="110" r="57" fill="#fff" />
      <text x="110" y="101" textAnchor="middle" className="coronary-plaque__ring-overline">TỔNG VÙNG</text>
      <text x="110" y="124" textAnchor="middle" className="coronary-plaque__ring-value">{total}</text>
      <text x="110" y="141" textAnchor="middle" className="coronary-plaque__ring-unit">mm³ · DEMO</text>
    </svg>
  )
}

function StraightenedVessel({ lesion, titleId }: { lesion: DemoLesion; titleId: string }) {
  const plaqueWidth = 86 + lesion.lengthMm * 5
  const plaqueX = 425 - plaqueWidth / 2
  const plaqueHeight = 26 + lesion.severityPct * .26
  return (
    <svg className="coronary-plaque__longitudinal" viewBox="0 0 900 270" role="img" aria-labelledby={`${titleId}-vessel-title ${titleId}-vessel-desc`}>
      <title id={`${titleId}-vessel-title`}>Mạch vành duỗi thẳng với vùng mảng bám đang chọn</title>
      <desc id={`${titleId}-vessel-desc`}>Một đoạn mạch duỗi thẳng được chia thành đầu gần, vùng tổn thương và đầu xa. Vùng cam là vị trí được liên kết với các mặt cắt phía dưới trong mô hình.</desc>
      <defs>
        <linearGradient id={`${titleId}-vessel-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#092634" />
          <stop offset="1" stopColor="#123d49" />
        </linearGradient>
        <linearGradient id={`${titleId}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7bd1c6" stopOpacity=".86" />
          <stop offset=".5" stopColor="#367f8d" stopOpacity=".9" />
          <stop offset="1" stopColor="#62b5b5" stopOpacity=".82" />
        </linearGradient>
        <filter id={`${titleId}-soft-glow`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="900" height="270" rx="10" fill={`url(#${titleId}-vessel-bg)`} />
      <g className="coronary-plaque__vessel-grid" aria-hidden="true">
        <line x1="30" y1="48" x2="870" y2="48" /><line x1="30" y1="221" x2="870" y2="221" />
        {Array.from({ length: 9 }, (_, index) => <line key={index} x1={58 + index * 100} y1="38" x2={58 + index * 100} y2="231" />)}
      </g>
      <text x="34" y="27" className="coronary-plaque__vessel-kicker">STRAIGHTENED VESSEL · DEMO CO-REGISTRATION</text>
      <text x="866" y="27" textAnchor="end" className="coronary-plaque__vessel-kicker">LONGITUDINAL VIEW</text>
      <path d="M 56 91 C 180 91 242 91 323 91 C 365 91 375 70 425 70 C 475 70 485 91 527 91 C 608 91 720 91 844 91 L 844 180 C 720 180 608 180 527 180 C 485 180 475 201 425 201 C 375 201 365 180 323 180 C 242 180 180 180 56 180 Z" fill="#0c3442" stroke="url(#${titleId}-wall)" strokeWidth="4" />
      <path d="M 58 135 C 210 135 297 135 844 135" fill="none" stroke="#cbf6df" strokeWidth="2" strokeDasharray="2 15" strokeLinecap="round" opacity=".72" />
      <path d={`M ${plaqueX} ${135 - plaqueHeight / 2} C ${plaqueX + plaqueWidth * .24} ${135 - plaqueHeight / 2 - 8} ${plaqueX + plaqueWidth * .72} ${135 - plaqueHeight / 2 - 8} ${plaqueX + plaqueWidth} ${135 - plaqueHeight / 2} L ${plaqueX + plaqueWidth} ${135 + plaqueHeight / 2} C ${plaqueX + plaqueWidth * .72} ${135 + plaqueHeight / 2 + 8} ${plaqueX + plaqueWidth * .24} ${135 + plaqueHeight / 2 + 8} ${plaqueX} ${135 + plaqueHeight / 2} Z`} fill="#e5a86d42" stroke="#f4c98c" strokeWidth="1.5" filter={`url(#${titleId}-soft-glow)`} />
      <path d={`M ${plaqueX + 13} ${135 - plaqueHeight / 2 + 9} C ${plaqueX + plaqueWidth * .29} ${135 - plaqueHeight / 2 + 3} ${plaqueX + plaqueWidth * .68} ${135 - plaqueHeight / 2 + 3} ${plaqueX + plaqueWidth - 12} ${135 - plaqueHeight / 2 + 9}`} fill="none" stroke="#c894bf" strokeWidth="6" strokeLinecap="round" opacity=".74" />
      <path d={`M ${plaqueX + 13} ${135 + plaqueHeight / 2 - 9} C ${plaqueX + plaqueWidth * .29} ${135 + plaqueHeight / 2 - 3} ${plaqueX + plaqueWidth * .68} ${135 + plaqueHeight / 2 - 3} ${plaqueX + plaqueWidth - 12} ${135 + plaqueHeight / 2 - 9}`} fill="none" stroke="#e7b56e" strokeWidth="7" strokeLinecap="round" opacity=".75" />
      <path d={`M 425 50 V 219`} stroke="#edbf7d" strokeWidth="1" strokeDasharray="3 6" />
      <circle cx="425" cy="48" r="5" fill="#ffe0a4" />
      <text x="425" y="244" textAnchor="middle" className="coronary-plaque__vessel-label">{lesion.id} · {lesion.branchLabel} · {lesion.lengthMm} mm vùng chọn</text>
      <text x="58" y="205" className="coronary-plaque__vessel-end-label">ĐẦU GẦN</text>
      <text x="844" y="205" textAnchor="end" className="coronary-plaque__vessel-end-label">ĐẦU XA</text>
    </svg>
  )
}

function CrossSection({ label, severity, composition, tone, selected, titleId }: { label: string; severity: number; composition: PlaqueComposition; tone: 'reference' | 'lesion' | 'distal'; selected?: boolean; titleId: string }) {
  const lumen = Math.max(19, 41 - severity * .17)
  const outer = 57
  const plaque = Math.max(4, outer - lumen - 18)
  const total = plaqueTotal(composition)
  const calcifiedShare = composition.calcified / total
  const lowAttenuationShare = composition.lowAttenuation / total
  const id = `${titleId}-${tone}`
  return (
    <div className={`coronary-plaque__cross-card ${selected ? 'is-selected' : ''}`}>
      <div className="coronary-plaque__cross-head"><span>{label}</span><small>{severity}% hẹp mô phỏng</small></div>
      <svg className="coronary-plaque__cross-svg" viewBox="0 0 190 160" role="img" aria-labelledby={`${id}-title`}>
        <title id={`${id}-title`}>Mặt cắt {label.toLowerCase()} của mạch vành giả lập</title>
        <defs><radialGradient id={`${id}-wall`} cx="45%" cy="40%"><stop offset="0" stopColor="#174b5a" /><stop offset="1" stopColor="#0a2a38" /></radialGradient></defs>
        <circle cx="95" cy="78" r="65" fill={`url(#${id}-wall)`} stroke="#69c9c1" strokeWidth="3" />
        <circle cx="95" cy="78" r={lumen + plaque * .45} fill="none" stroke="#e5ad6e" strokeWidth={plaque} strokeDasharray={`${(1 - calcifiedShare) * 370} ${calcifiedShare * 370}`} transform="rotate(-90 95 78)" opacity=".9" />
        <circle cx="95" cy="78" r={lumen + plaque * .45} fill="none" stroke="#c49ac0" strokeWidth={Math.max(3, plaque * .55)} strokeDasharray={`${lowAttenuationShare * 370} ${370 - lowAttenuationShare * 370}`} strokeDashoffset="-80" transform="rotate(-90 95 78)" opacity=".9" />
        <circle cx="95" cy="78" r={lumen} fill="#071b28" stroke="#a8e6d8" strokeWidth="2" />
        <circle cx="95" cy="78" r="4" fill="#a8e6d8" opacity=".75" />
        <text x="95" y="146" textAnchor="middle" className="coronary-plaque__cross-axis">MẶT CẮT NGANG</text>
      </svg>
      <div className="coronary-plaque__cross-foot"><span><i className={`is-${tone}`} /> {selected ? 'đồng bộ với vùng chọn' : 'mốc tham chiếu'}</span><strong>{Math.round(lumen * 2)} px lumen</strong></div>
    </div>
  )
}

function CompositionBars({ composition }: { composition: PlaqueComposition }) {
  const total = plaqueTotal(composition)
  return <div className="coronary-plaque__composition-list" aria-label="Thành phần mảng bám synthetic">
    {COMPOSITION_ITEMS.map(item => {
      const value = composition[item.key]
      return <div className="coronary-plaque__composition-row" key={item.key}><div><span><i style={{ background: item.color }} />{item.label}</span><strong>{value} mm³</strong></div><span className="coronary-plaque__composition-track"><i style={{ width: `${Math.round(value / total * 100)}%`, background: item.color }} /></span><small>{Math.round(value / total * 100)}% trong vùng chọn</small></div>
    })}
  </div>
}

function LesionSelector({ selectedLesionId, onSelectLesion }: LesionSelectionProps) {
  return <div className="coronary-plaque__selector" aria-label="Chọn vùng plaque synthetic">
    {DEMO_LESIONS.map(lesion => <button key={lesion.id} type="button" className={lesion.id === selectedLesionId ? 'is-selected' : ''} onClick={() => onSelectLesion(lesion.id)} aria-pressed={lesion.id === selectedLesionId}><span>{lesion.id}</span><strong>{lesion.branchLabel}</strong><small>{lesion.severityPct}%</small></button>)}
  </div>
}

export default function CoronaryPlaqueDemo({ selectedLesionId, onSelectLesion }: LesionSelectionProps) {
  const titleId = useId()
  const selected = useMemo(() => DEMO_LESIONS.find(lesion => lesion.id === selectedLesionId) ?? DEMO_LESIONS[0], [selectedLesionId])
  const selectedTotal = plaqueTotal(selected.plaqueMm3)
  const stage = stageForPlaque(selected.plaqueMm3, selected.severityPct)
  const referenceComposition: PlaqueComposition = { nonCalcified: Math.max(8, Math.round(selected.plaqueMm3.nonCalcified * .2)), calcified: Math.max(3, Math.round(selected.plaqueMm3.calcified * .2)), lowAttenuation: 2 }
  const distalComposition: PlaqueComposition = { nonCalcified: Math.max(7, Math.round(selected.plaqueMm3.nonCalcified * .48)), calcified: Math.max(3, Math.round(selected.plaqueMm3.calcified * .42)), lowAttenuation: Math.max(1, Math.round(selected.plaqueMm3.lowAttenuation * .35)) }

  return (
    <section className="coronary-plaque" aria-labelledby={`${titleId}-title`}>
      <header className="coronary-plaque__hero">
        <div>
          <div className="coronary-plaque__eyebrow"><span /> <Layers3 size={13} /> PLAQUE VIEW · CẤU PHẦN MẢNG BÁM</div>
          <h2 id={`${titleId}-title`}>Từ vị trí hẹp đến thành phần mảng bám</h2>
          <p>Đổi vùng chọn để xem cùng một vị trí qua trục mạch duỗi thẳng, mặt cắt ngang và bảng cấu phần. Các lớp được nối với nhau trong phạm vi mô hình.</p>
        </div>
        <div className="coronary-plaque__hero-mark"><BarChart3 size={20} /><span>PLAQUE<br />VIEW</span></div>
      </header>

      <div className="coronary-plaque__notice"><Info size={15} aria-hidden="true" /><span><strong>{DEMO_CASE.title}</strong> · plaque volume, màu mô và “Plaque Staging” đều là dữ liệu synthetic. Không phải đo CCTA, không phải hồ sơ bệnh nhân và không phải phân loại nguy cơ lâm sàng.</span></div>
      <LesionSelector selectedLesionId={selectedLesionId} onSelectLesion={onSelectLesion} />

      <div className="coronary-plaque__workspace">
        <div className="coronary-plaque__visual-column">
          <div className="coronary-plaque__visual-card"><div className="coronary-plaque__card-head"><span><span className="coronary-plaque__live-dot" /> CO-REGISTRATION THEO DEMO</span><small>{selected.id} · {selected.branchLabel}</small></div><div className="coronary-plaque__longitudinal-wrap"><StraightenedVessel lesion={selected} titleId={titleId} /></div><div className="coronary-plaque__longitudinal-legend"><span><i className="is-wall" /> Thành mạch mô hình</span><span><i className="is-noncalcified" /> Mảng không vôi hóa</span><span><i className="is-calcified" /> Mảng vôi hóa</span><span><i className="is-low" /> Vùng giảm đậm độ</span></div></div>
          <div className="coronary-plaque__section-card"><div className="coronary-plaque__section-head"><div><span className="coronary-plaque__section-kicker"><MapPin size={13} /> CÙNG VỊ TRÍ · BA MẶT CẮT</span><h3>Nhìn thành mạch từ ba điểm</h3></div><span className="coronary-plaque__linked-label"><Sparkles size={12} /> linked view</span></div><div className="coronary-plaque__cross-grid"><CrossSection label="Đầu gần" severity={Math.round(selected.severityPct * .25)} composition={referenceComposition} tone="reference" titleId={titleId} /><CrossSection label="Vùng chọn" severity={selected.severityPct} composition={selected.plaqueMm3} tone="lesion" selected titleId={titleId} /><CrossSection label="Đầu xa" severity={Math.round(selected.severityPct * .48)} composition={distalComposition} tone="distal" titleId={titleId} /></div></div>
        </div>

        <aside className="coronary-plaque__controls" aria-label="Thông tin plaque synthetic">
          <div className="coronary-plaque__panel-kicker"><MapPin size={14} /> VÙNG ĐANG CHỌN</div>
          <div className="coronary-plaque__selected-heading"><div><span className="coronary-plaque__selected-dot" /><h3>{selected.id} · {selected.branchLabel}</h3></div><small>{selected.location}</small></div>
          <div className="coronary-plaque__total-card"><div><span>PLAQUE VOLUME · VÙNG CHỌN</span><strong>{selectedTotal} mm³</strong><small>tổng ba cấu phần trong mô hình</small></div><CompositionRing composition={selected.plaqueMm3} titleId={titleId} /></div>
          <CompositionBars composition={selected.plaqueMm3} />
          <div className={`coronary-plaque__stage-card ${stage.tone}`}><div className="coronary-plaque__stage-heading"><ShieldCheck size={15} /><span>PLAQUE STAGING · GIÁO DỤC</span></div><strong>{stage.label}</strong><small>{stage.detail}</small></div>
          <div className="coronary-plaque__case-total"><span>Tổng plaque trong cả ca demo</span><strong>{DEMO_PLAQUE_TOTAL_MM3} mm³</strong></div>
        </aside>
      </div>

      <footer className="coronary-plaque__footer"><Info size={14} /><span>Vùng chọn và các mặt cắt chỉ được liên kết theo hình học synthetic để minh họa cách một plaque viewer có thể hoạt động. Không suy ra FFR, chẩn đoán hoặc nguy cơ bệnh.</span></footer>
    </section>
  )
}
