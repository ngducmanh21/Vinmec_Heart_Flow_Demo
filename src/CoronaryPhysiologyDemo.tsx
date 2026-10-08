import { Activity, AlertTriangle, ExternalLink, MousePointer2, Rotate3D, RotateCcw, Target } from 'lucide-react'
import { useMemo, useState } from 'react'
import CoronaryModelView from './CoronaryModelView'
import {
  DEMO_CASE,
  DEMO_LESIONS,
  DEMO_PLAQUE_TOTAL_MM3,
  getDemoLesion,
  DEMO_LESIONS as PROFILE_LESIONS, demoRatioAt, LESION_POSITION, BRANCH_LENGTH_MM,
  type ProbeSelectionProps,
} from './coronaryDemoData'
import './CoronaryPhysiologyDemo.css'

function ratioColor(value: number) { return value < .8 ? '#ef8b78' : value < .88 ? '#e5c46b' : '#61d1c0' }
function ratioLabel(value: number) { return value < .8 ? 'thấp hơn trong preset' : 'giá trị preset' }

function RatioLegend() {
  return (
    <div className="coronary-physiology-demo__legend" aria-label="Chú giải màu tỷ lệ hạ lưu giả lập">
      <span className="coronary-physiology-demo__legend-title">TỶ LỆ HẠ LƯU · PRESET</span>
      <span><i style={{ background: '#61d1c0' }} /> 0.88–1.00</span>
      <span><i style={{ background: '#e5c46b' }} /> 0.80–0.87</span>
      <span><i style={{ background: '#ef8b78' }} /> &lt; 0.80</span>
    </div>
  )
}

export default function CoronaryPhysiologyDemo({ selectedLesionId, onSelectLesion, probeT, onProbeTChange }: ProbeSelectionProps) {
  const [resetKey, setResetKey] = useState(0)
  const selected = getDemoLesion(selectedLesionId)
  function updateProbe(t: number) {
    const nearest = DEMO_LESIONS.filter(l => l.branch === selected.branch).reduce((a,b) => Math.abs(LESION_POSITION[a.id]-t) < Math.abs(LESION_POSITION[b.id]-t) ? a : b)
    onSelectLesion(nearest.id)
    onProbeTChange(t)
  }
  const rankedLesions = useMemo(() => [...DEMO_LESIONS].sort((a, b) => b.severityPct - a.severityPct), [])

  return (
    <section className="coronary-physiology-demo" aria-labelledby="coronary-physiology-title">
      <header className="coronary-physiology-demo__header">
        <div>
          <div className="coronary-physiology-demo__eyebrow"><span aria-hidden="true" /><Activity size={14} /> CORONARY PHYSIOLOGY · INTERACTIVE MODEL</div>
          <h2 id="coronary-physiology-title">Cây mạch vành giả lập, từ nhánh đến hạ lưu</h2>
          <p>Chọn một ghim để xem cách một tổn thương được đọc theo đầu gần, hạ lưu và mức độ hẹp trong bộ dữ liệu trình diễn.</p>
        </div>
        <div className="coronary-physiology-demo__badge"><strong>{DEMO_CASE.id}</strong><span>DỮ LIỆU GIẢ LẬP</span></div>
      </header>

      <div className="coronary-physiology-demo__notice">
        <AlertTriangle size={15} aria-hidden="true" />
        <p><strong>Preset để showcase tương tác.</strong> Hình học, màu nhánh và các tỷ lệ đều là dữ liệu tổng hợp; không có CCTA/CFD/FFR_CT nào được tính, không phải ca 0225 và không dùng cho chẩn đoán.</p>
      </div>

      <div className="coronary-physiology-demo__workspace">
        <div className="coronary-physiology-demo__visual-card">
          <div className="coronary-physiology-demo__visual-head">
            <span><i aria-hidden="true" /> CÂY MẠCH VÀNH · PROCEDURAL VIEW</span>
            <span><Rotate3D size={13} /> kéo để xoay · cuộn để zoom</span>
          </div>
          <div className="coronary-physiology-demo__canvas-wrap" role="img" aria-label="Cây mạch vành giả lập 3D với các ghim tổn thương và điểm thăm dò tự do">
            <CoronaryModelView selectedLesionId={selectedLesionId} onSelectLesion={onSelectLesion} probeT={probeT} onProbeTChange={onProbeTChange} resetKey={resetKey} height={450} />
            <div className="coronary-physiology-demo__canvas-hint"><MousePointer2 size={12} /> Chọn ghim trên cây mạch hoặc danh sách bên cạnh</div>
          </div>
          <RatioLegend />
          <div className="coronary-extra-panel">
            <label htmlFor="coronary-probe">Ghim dọc {selected.branchLabel} · {(probeT * BRANCH_LENGTH_MM[selected.branch]).toFixed(1)} mm</label>
            <input id="coronary-probe" aria-label="Vị trí ghim dọc nhánh" type="range" min="0" max="100" value={Math.round(probeT*100)} onChange={e=>updateProbe(Number(e.target.value)/100)}/>
            <strong aria-live="polite">Tỷ lệ tại ghim: {demoRatioAt(selected.branch,probeT).toFixed(2)} · preset</strong>
            <svg viewBox="0 0 620 140" role="img" aria-label="Đường tỷ lệ preset dọc nhánh">
              <path d={Array.from({length:101},(_,i)=>`${i?'L':'M'} ${20+i*5.8} ${15+(1-demoRatioAt(selected.branch,i/100))*280}`).join(' ')} fill="none" stroke="#3b9e9e" strokeWidth="3"/>
              {PROFILE_LESIONS.filter(l=>l.branch===selected.branch).map(l=><g key={l.id}><line x1={20+LESION_POSITION[l.id]*580} x2={20+LESION_POSITION[l.id]*580} y1="8" y2="115" stroke="#c09060" strokeDasharray="4 4"/><text x={20+LESION_POSITION[l.id]*580} y="133" textAnchor="middle" fill="#795637" fontSize="12">{l.id}</text></g>)}
              <circle cx={20+probeT*580} cy={15+(1-demoRatioAt(selected.branch,probeT))*280} r="5" fill="#163e53"/>
            </svg>
            <small>{selected.branch==='lad'?'LAD có L1 và L4 nối tiếp: đường preset giảm qua từng vị trí.':'Chạm lên mạch 3D hoặc kéo thanh để đặt ghim tại vị trí bất kỳ.'} Các giá trị được nội suy từ preset.</small>
          </div>
        </div>

        <aside className="coronary-physiology-demo__side" aria-label="Bảng dữ liệu mô phỏng mạch vành">
          <div className="coronary-physiology-demo__side-section coronary-physiology-demo__selected-card">
            <div className="coronary-physiology-demo__section-kicker"><Target size={13} /> TỔN THƯƠNG ĐANG CHỌN</div>
            <div className="coronary-physiology-demo__selected-title"><div><span>{selected.id} · {selected.branchLabel}</span><strong>{selected.location}</strong></div><b>{selected.severityPct}%</b></div>
            <div className="coronary-physiology-demo__ratio-grid">
              <div><span>ĐẦU GẦN · PRESET</span><strong>{selected.proximalRatio.toFixed(2)}</strong><small>mốc quy ước</small></div>
              <div><span>HẠ LƯU · PRESET</span><strong style={{ color: ratioColor(selected.distalRatio) }}>{selected.distalRatio.toFixed(2)}</strong><small>{ratioLabel(selected.distalRatio)}</small></div>
            </div>
            <p className="coronary-physiology-demo__microcopy">Hai tỷ lệ là giá trị dựng sẵn để minh họa cách đọc chênh lệch theo nhánh; không phải FFR_CT.</p>
          </div>

          <div className="coronary-physiology-demo__side-section">
            <div className="coronary-physiology-demo__section-kicker"><Activity size={13} /> XẾP HẠNG TỔN THƯƠNG</div>
            <div className="coronary-physiology-demo__lesion-list">
              {rankedLesions.map((lesion, index) => (
                <button key={lesion.id} type="button" className={selected.id === lesion.id ? 'is-selected' : ''} aria-pressed={selected.id === lesion.id} onClick={() => onSelectLesion(lesion.id)}>
                  <span className="coronary-physiology-demo__rank">0{index + 1}</span>
                  <span className="coronary-physiology-demo__lesion-copy"><strong>{lesion.id} · {lesion.branchLabel}</strong><small>{lesion.location} · {lesion.lengthMm} mm</small></span>
                  <span className="coronary-physiology-demo__lesion-value"><b>{lesion.severityPct}%</b><i style={{ background: ratioColor(lesion.distalRatio) }} /></span>
                </button>
              ))}
            </div>
          </div>

          <div className="coronary-physiology-demo__side-section coronary-physiology-demo__detail-grid">
            <div><span>MẢNG BÁM · PRESET</span><strong>{selected.plaqueMm3.nonCalcified + selected.plaqueMm3.calcified + selected.plaqueMm3.lowAttenuation} mm³</strong><small>tổn thương đang chọn</small></div>
            <div><span>TỔNG MẢNG BÁM</span><strong>{DEMO_PLAQUE_TOTAL_MM3} mm³</strong><small>tổng các preset</small></div>
          </div>

          <div className="coronary-physiology-demo__side-section coronary-physiology-demo__plan-card">
            <div><span>GỢI Ý LẬP KẾ HOẠCH · GIẢ LẬP</span><strong>Landing zone {selected.planning.landingZoneMm} mm</strong><small>{selected.planning.cArmAngle}</small></div>
            <button type="button" onClick={() => setResetKey(value => value + 1)} title="Đặt lại góc nhìn 3D"><RotateCcw size={14} /> Đặt lại góc nhìn</button>
          </div>
        </aside>
      </div>

      <footer className="coronary-physiology-demo__footer">
        <span>SIM-COR-01 · {DEMO_CASE.modality}</span>
        <a href="https://www.heartflow.com/heartflow-one/ffrct-analysis/" target="_blank" rel="noreferrer">Tham khảo kiểu tương tác HeartFlow <ExternalLink size={12} /></a>
      </footer>
    </section>
  )
}
