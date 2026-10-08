import { Activity, AlertTriangle, Check, Info, MapPin, Target } from 'lucide-react'
import { useMemo } from 'react'
import { DEMO_CASE, DEMO_LESIONS, LESION_POSITION, BRANCH_LENGTH_MM, type DemoLesion, type LesionSelectionProps } from './coronaryDemoData'
import { coronaryCurve } from './coronaryGeometry'
import './CoronaryRoadmapDemo.css'
import './CoronaryEnhancements.css'

function lesionSeverityTone(value: number) { return value >= 70 ? 'is-alert' : value >= 50 ? 'is-watch' : 'is-calm' }
function severityColor(value: number) { return value >= 70 ? '#bc8fd9' : value >= 50 ? '#eb797a' : '#ecd26f' }
function branchPath(branch: DemoLesion['branch'], from = 0, to = 1) {
  const curve = coronaryCurve(branch)
  return Array.from({length:61},(_,i)=>{const p=curve.getPointAt(from+(to-from)*i/60);return `${i?'L':'M'} ${380+p.x*200} ${190-p.y*130}`}).join(' ')
}
function CoronarySchematic({selectedLesionId,onSelectLesion}:LesionSelectionProps) {
  return <svg className="coronary-roadmap__diagram" viewBox="0 0 760 390" role="img" aria-label="Bản đồ chiều dài và mức hẹp trên cùng cây mạch giả lập">
    <rect width="760" height="390" rx="12" fill="#0b2937"/>
    <text x="25" y="28" fill="#a2d9d4" fontSize="11">CAPSULE LENGTH = LESION LENGTH · DEMO</text>
    {(['lad','lcx','rca'] as const).map(branch=><path key={branch} d={branchPath(branch)} fill="none" stroke="#477e8c" strokeWidth="10" strokeLinecap="round"/>)}
    {DEMO_LESIONS.map(l=>{
      const t=LESION_POSITION[l.id],half=l.lengthMm/BRANCH_LENGTH_MM[l.branch]/2
      const p=coronaryCurve(l.branch).getPointAt(t),x=380+p.x*200,y=190-p.y*130
      const selected=l.id===selectedLesionId
      return <g key={l.id} role="button" tabIndex={0} aria-label={`Chọn ${l.id}, ${l.branchLabel}, ${l.severityPct}% hẹp, dài ${l.lengthMm} mm`} onClick={()=>onSelectLesion(l.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelectLesion(l.id)}}}>
        <path className="coronary-roadmap-capsule" d={branchPath(l.branch,Math.max(0,t-half),Math.min(1,t+half))} fill="none" stroke={severityColor(l.severityPct)} strokeWidth={selected?20:15}/>
        <path d={`M ${x-6} ${y-24} L ${x+6} ${y-24} L ${x} ${y-13} Z`} fill="#fff"/>
        <text x={x+(l.branch==='rca'?-28:27)} y={y+3} textAnchor={l.branch==='rca'?'end':'start'} fill={selected?'#fff6db':'#c4dedf'} fontSize="13">{l.id} · {l.branchLabel}</text>
      </g>
    })}
    <text x="24" y="368" fill="#a2d9d4" fontSize="11">Mũi tên: vị trí hẹp nhất · LAD có L1 + L4 nối tiếp</text>
  </svg>
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
          <div className="coronary-roadmap__legend"><span style={{color:"#aa8a16"}}>● Nhẹ 30–49%</span><span style={{color:"#c65f66"}}>● Vừa 50–69%</span><span style={{color:"#9772b4"}}>● Nặng 70–99%</span><span>Chiều dài capsule theo mm giả lập</span></div>
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
          <div className="coronary-roadmap__list-heading"><span>CÁC ĐIỂM TRONG CA</span><small>{DEMO_LESIONS.length} vùng có sẵn</small></div>
          <LesionList selectedLesionId={selectedLesionId} onSelectLesion={onSelectLesion} />
          <div className="coronary-roadmap__callout"><Check size={14} /><div><strong>Điểm nổi bật của demo</strong><p>{mostPronounced.id} · {mostPronounced.branchLabel} đang có mức hẹp mô phỏng cao nhất ({mostPronounced.severityPct}%).</p></div></div>
        </aside>
      </div>

      <footer className="coronary-roadmap__footer"><AlertTriangle size={14} /><span>Roadmap này chỉ giúp định hướng vùng cần xem trong mô hình. Không tự động phát hiện tổn thương và không hỗ trợ quyết định điều trị.</span></footer>
    </section>
  )
}
