import { BarChart3, Info, Layers3, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { DEMO_CASE, DEMO_LESIONS, DEMO_PLAQUE_TOTAL_MM3, LESION_POSITION, BRANCH_LENGTH_MM, TPV_BANDS, tpvBandIndex, demoSeverityAt, type ProbeSelectionProps, type DemoLesion, type LesionSelectionProps } from './coronaryDemoData'
import './CoronaryPlaqueDemo.css'
import CoronaryModelView from './CoronaryModelView'

type PlaqueComposition = DemoLesion['plaqueMm3']

const COMPOSITION_ITEMS: Array<{ key: keyof PlaqueComposition; label: string; shortLabel: string; color: string }> = [
  { key: 'nonCalcified', label: 'Không vôi hóa khác', shortLabel: 'Non-calcified', color: '#72c8bd' },
  { key: 'calcified', label: 'Vôi hóa', shortLabel: 'Calcified', color: '#e6b36f' },
  { key: 'lowAttenuation', label: 'Giảm đậm độ', shortLabel: 'Low attenuation', color: '#c696bd' },
]

function plaqueTotal(composition: PlaqueComposition) {
  return composition.nonCalcified + composition.calcified + composition.lowAttenuation
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

function StraightenedVessel({lesion,probeT,onProbeTChange}: {lesion:DemoLesion;probeT:number;onProbeTChange:(t:number)=>void}) {
  const branchLesions=DEMO_LESIONS.filter(l=>l.branch===lesion.branch)
  return <svg className="coronary-plaque__longitudinal" viewBox="0 0 900 250" role="img" aria-label="Mạch duỗi thẳng liên kết với ghim 3D và mặt cắt">
    <rect width="900" height="250" rx="10" fill="#0b2937"/>
    <text x="28" y="30" fill="#acd9d4" fontSize="12">{lesion.branchLabel} · STRAIGHTENED VESSEL · DEMO</text>
    <rect x="45" y="84" width="810" height="96" rx="15" fill="#1b505d" stroke="#72c8bd" strokeWidth="3"/>
    {branchLesions.map(l=>{const x=45+LESION_POSITION[l.id]*810,w=l.lengthMm/BRANCH_LENGTH_MM[l.branch]*810;return <g key={l.id}><rect x={x-w/2} y="86" width={w} height="92" rx="7" fill="#e6b36f" opacity=".6"/><rect x={x-w/2} y={132-46*(1-l.severityPct/100)} width={w} height={92*(1-l.severityPct/100)} fill="#0c2937"/><text x={x} y="207" textAnchor="middle" fill="#eac589" fontSize="13">{l.id}</text></g>})}
    <line x1={45+probeT*810} x2={45+probeT*810} y1="55" y2="215" stroke="#fff6c7" strokeWidth="2" strokeDasharray="4 4"/>
    <circle cx={45+probeT*810} cy="57" r="6" fill="#ffe09b"/>
    <rect x="45" y="55" width="810" height="165" fill="transparent" onClick={e=>{const r=e.currentTarget.getBoundingClientRect();onProbeTChange(Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)))}} style={{cursor:'crosshair'}}/>
    <text x="450" y="237" textAnchor="middle" fill="#b9d9d8" fontSize="12">Bấm dọc mạch hoặc kéo thanh để đổi mặt cắt</text>
  </svg>
}

function CrossSection({ label, severity, composition, tone, selected, titleId }: { label: string; severity: number; composition: PlaqueComposition; tone: 'reference' | 'lesion' | 'distal'; selected?: boolean; titleId: string }) {
  const lumen = Math.max(5, 41 * (1 - severity / 100))
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
      <div className="coronary-plaque__cross-foot"><span><i className={`is-${tone}`} /> {selected ? 'đồng bộ với vùng chọn' : 'mốc tham chiếu'}</span><strong>MINH HỌA</strong></div>
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

export default function CoronaryPlaqueDemo({ selectedLesionId, onSelectLesion, probeT, onProbeTChange }: ProbeSelectionProps) {
  const titleId = useId()
  const selected = useMemo(() => DEMO_LESIONS.find(lesion => lesion.id === selectedLesionId) ?? DEMO_LESIONS[0], [selectedLesionId])
  function updateProbe(t: number) {
    const nearest = DEMO_LESIONS.filter(l => l.branch === selected.branch).reduce((a,b) => Math.abs(LESION_POSITION[a.id]-t) < Math.abs(LESION_POSITION[b.id]-t) ? a : b)
    onSelectLesion(nearest.id)
    onProbeTChange(t)
  }
  const selectedTotal = plaqueTotal(selected.plaqueMm3)
  const [stagingVolume, setStagingVolume] = useState(DEMO_PLAQUE_TOTAL_MM3)
  const stageIndex = tpvBandIndex(stagingVolume)
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
          <CoronaryModelView selectedLesionId={selectedLesionId} onSelectLesion={onSelectLesion} probeT={probeT} onProbeTChange={onProbeTChange} mode="plaque"/>
          <div className="coronary-extra-panel"><label htmlFor="plaque-probe">Mặt cắt trên {selected.branchLabel} · {(probeT*BRANCH_LENGTH_MM[selected.branch]).toFixed(1)} mm</label><input id="plaque-probe" aria-label="Vị trí mặt cắt mảng bám" type="range" min="0" max="100" value={Math.round(probeT*100)} onChange={e=>updateProbe(Number(e.target.value)/100)}/><small>Ghim 3D, đường trên mạch duỗi thẳng và mặt cắt giữa dùng cùng vị trí.</small></div>
          <div className="coronary-plaque__visual-card"><div className="coronary-plaque__card-head"><span><span className="coronary-plaque__live-dot" /> CO-REGISTRATION THEO DEMO</span><small>{selected.id} · {selected.branchLabel}</small></div><div className="coronary-plaque__longitudinal-wrap"><StraightenedVessel lesion={selected} probeT={probeT} onProbeTChange={updateProbe} /></div><div className="coronary-plaque__longitudinal-legend"><span><i className="is-wall" /> Thành mạch mô hình</span><span><i className="is-noncalcified" /> Không vôi hóa khác</span><span><i className="is-calcified" /> Mảng vôi hóa</span><span><i className="is-low" /> Vùng giảm đậm độ</span></div></div>
          <div className="coronary-plaque__section-card"><div className="coronary-plaque__section-head"><div><span className="coronary-plaque__section-kicker"><MapPin size={13} /> CÙNG VỊ TRÍ · BA MẶT CẮT</span><h3>Nhìn thành mạch từ ba điểm</h3></div><span className="coronary-plaque__linked-label"><Sparkles size={12} /> linked view</span></div><div className="coronary-plaque__cross-grid"><CrossSection label="Đầu gần" severity={Math.round(demoSeverityAt(selected.branch, Math.max(0,probeT-.12)))} composition={referenceComposition} tone="reference" titleId={titleId} /><CrossSection label="Vùng chọn" severity={Math.round(demoSeverityAt(selected.branch,probeT))} composition={selected.plaqueMm3} tone="lesion" selected titleId={titleId} /><CrossSection label="Đầu xa" severity={Math.round(demoSeverityAt(selected.branch,Math.min(1,probeT+.12)))} composition={distalComposition} tone="distal" titleId={titleId} /></div></div>
        </div>

        <aside className="coronary-plaque__controls" aria-label="Thông tin plaque synthetic">
          <div className="coronary-plaque__panel-kicker"><MapPin size={14} /> VÙNG ĐANG CHỌN</div>
          <div className="coronary-plaque__selected-heading"><div><span className="coronary-plaque__selected-dot" /><h3>{selected.id} · {selected.branchLabel}</h3></div><small>{selected.location}</small></div>
          <div className="coronary-plaque__total-card"><div><span>PLAQUE VOLUME · VÙNG CHỌN</span><strong>{selectedTotal} mm³</strong><small>tổng ba cấu phần trong mô hình</small></div><CompositionRing composition={selected.plaqueMm3} titleId={titleId} /></div>
          <CompositionBars composition={selected.plaqueMm3} />
          <div className="coronary-extra-panel">
            <div><ShieldCheck size={15}/> PLAQUE STAGING · TPV</div>
            <strong>{stagingVolume} mm³ → {TPV_BANDS[stageIndex].label}</strong>
            <div className="coronary-tpv-bands">{TPV_BANDS.map((band,i)=><span key={band.label} className={i===stageIndex?'is-active':''}><b>{band.label}</b>{band.range} mm³</span>)}</div>
            <label htmlFor="tpv-demo">Thử TPV khác (minh họa độc lập)</label><input id="tpv-demo" aria-label="TPV minh họa" type="range" min="0" max="1000" value={stagingVolume} onChange={e=>setStagingVolume(Number(e.target.value))}/>
            <button type="button" onClick={()=>setStagingVolume(DEMO_PLAQUE_TOTAL_MM3)}>Về TPV ca demo: {DEMO_PLAQUE_TOTAL_MM3} mm³</button>
            <small>Phân nhóm theo tổng thể tích toàn ca, không theo độ hẹp của một tổn thương. Thanh thử không thay đổi dữ liệu ca hoặc báo cáo.</small>
            <a className="coronary-extra-link" href="https://www.heartflow.com/heartflow-one/plaque/plaque-staging/" target="_blank" rel="noreferrer">Nguồn các khoảng TPV: Heartflow</a>
          </div>
          <div className="coronary-plaque__case-total"><span>Tổng plaque trong cả ca demo</span><strong>{DEMO_PLAQUE_TOTAL_MM3} mm³</strong></div>
        </aside>
      </div>

      <footer className="coronary-plaque__footer"><Info size={14} /><span>Vùng chọn và các mặt cắt chỉ được liên kết theo hình học synthetic để minh họa cách một plaque viewer có thể hoạt động. Không suy ra FFR, chẩn đoán hoặc nguy cơ bệnh.</span></footer>
    </section>
  )
}
