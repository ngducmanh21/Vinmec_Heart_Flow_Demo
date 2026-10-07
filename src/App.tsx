import { useState } from 'react'
import { Activity, ArrowRight, Check, ChevronRight, CircleHelp, Crosshair, Layers3, RotateCcw, ScanLine, SlidersHorizontal } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import CTCanvas, { type CTMode } from './CTCanvas'
import Vessel3D from './Vessel3D'
import vinUniversityLogo from './assets/vinuniversity-logo.png'
import ctMetadata from './assets/vmr-p3/ct-slices.json'
import centerlineData from './assets/vmr-p3/centerline.json'
import { caseId, curve3D, pathLengthMm, profile, sampledPathPoints, sampleAt } from './model'

const stages = [
  { label: 'Ảnh CT', title: 'Bắt đầu từ ảnh CT', note: 'Lát cắt thực của ca P-3. Điểm vàng trên mạch được theo dõi qua cả ba bước.', icon: ScanLine },
  { label: 'CAD model', title: 'Mô hình CAD mạch từ CT', note: 'Mô hình PolyData P007 được dựng sẵn từ phân đoạn của cùng ca CT; xem bề mặt lưới, contour và centerline.', icon: Layers3 },
  { label: '3D tương tác', title: 'Khám phá mô hình CAD trong 3D', note: 'Xoay và kiểm tra chính P007 ở bước 2. Mặt phẳng xanh giữ vị trí lát CT đã chọn.', icon: Activity },
]

function slicePlaneY(index: number) {
  return (ctMetadata.origin[2] + ctMetadata.sliceIndices[index] * ctMetadata.spacing[2] - centerlineData.bounds.center[2]) * centerlineData.bounds.scale
}

function nearestPathT(index: number, previousT: number) {
  const targetY = slicePlaneY(index)
  let bestT = previousT, bestCost = Infinity
  sampledPathPoints.forEach((point, i) => {
    const t = i / (sampledPathPoints.length - 1)
    const cost = (point.y - targetY) ** 2 + .025 * (t - previousT) ** 2
    if (cost < bestCost) { bestCost = cost; bestT = t }
  })
  return bestT
}

function closestCtSlice(y: number) {
  let bestIndex = 0, bestGap = Infinity
  ctMetadata.sliceIndices.forEach((_, i) => {
    const gap = Math.abs(y - slicePlaneY(i))
    if (gap < bestGap) { bestGap = gap; bestIndex = i }
  })
  return bestIndex
}

function BrandMark() { return <span className="brand-mark"><img src={vinUniversityLogo} alt="Logo VinUniversity" /></span> }
function Stat({ label, value }: { label: string; value: string }) { return <div className="workstat"><span>{label}</span><strong>{value}</strong></div> }

export default function App() {
  const [stage, setStage] = useState(1)
  const [slice, setSlice] = useState(4)
  const [windowWidth, setWindowWidth] = useState(700)
  const [ctMode, setCtMode] = useState<CTMode>('overlay')
  const [centerline, setCenterline] = useState(true)
  const [showPlane, setShowPlane] = useState(true)
  const [flow, setFlow] = useState(false)
  const [inspectT, setInspectT] = useState(() => nearestPathT(4, .46))
  const [cameraReset, setCameraReset] = useState(0)
  const sample = sampleAt(inspectT)
  const current = stages[stage - 1]
  const selectedWorldPoint = curve3D.getPointAt(inspectT)
  const halfSampleGap = (ctMetadata.sliceIndices[1] - ctMetadata.sliceIndices[0]) * ctMetadata.spacing[2] * centerlineData.bounds.scale / 2
  const pointOnSlice = Math.abs(selectedWorldPoint.y - slicePlaneY(slice)) <= halfSampleGap + .002
  const selectedCtPoint: [number, number] | undefined = pointOnSlice ? [
    (selectedWorldPoint.z / centerlineData.bounds.scale + centerlineData.bounds.center[0] - ctMetadata.origin[0]) / ctMetadata.spacing[0],
    (selectedWorldPoint.x / centerlineData.bounds.scale + centerlineData.bounds.center[1] - ctMetadata.origin[1]) / ctMetadata.spacing[1],
  ] : undefined

  function updateSlice(next: number) {
    const index = Math.max(0, Math.min(ctMetadata.sliceIndices.length - 1, next))
    setSlice(index)
    setInspectT(previous => nearestPathT(index, previous))
  }
  function selectModelPoint(t: number) {
    const index = closestCtSlice(curve3D.getPointAt(t).y)
    setSlice(index)
    const inCtRange = Math.abs(curve3D.getPointAt(t).y - slicePlaneY(index)) <= halfSampleGap + .002
    setInspectT(inCtRange ? nearestPathT(index, t) : t)
  }
  function navigate(next: number) { setStage(next); if (next === 2) setCtMode('overlay') }
  function reset() { setStage(1); setSlice(4); setWindowWidth(700); setCtMode('overlay'); setCenterline(true); setShowPlane(true); setFlow(false); setInspectT(nearestPathT(4, .46)); setCameraReset(n => n + 1) }

  return <div className="app">
    <header className="topbar"><div className="brand"><BrandMark/><div><strong>CardioFlow <span>Lab</span></strong><small>VINUNIVERSITY · CT → CAD MODEL → 3D</small></div></div><div className="top-meta"><div><span>CA DỮ LIỆU</span><strong>P-3 · CT</strong></div><i/><div><span>MÔ HÌNH</span><strong>{caseId}</strong></div></div><div className="top-actions"><span className="synthetic-badge"><b/> CÙNG MỘT CA</span><button onClick={reset} title="Đặt lại demo"><RotateCcw size={15}/> Đặt lại</button></div></header>
    <main>
      <section className="intro"><div><div className="eyebrow"><span className="eyebrow-line"/> CT THẬT · CAD MODEL CÙNG CA · 3D TƯƠNG TÁC</div><h1>Một mạch máu, một luồng phân tích liên tục.</h1><p>Từ lát CT ca P-3, xem mô hình PolyData P007 cùng ca dưới góc nhìn kỹ thuật, rồi khám phá chính mô hình đó trong 3D. Lát cắt và điểm đã chọn được giữ xuyên suốt.</p></div><a className="source-link" href="https://purl.stanford.edu/hh073fw2871" target="_blank" rel="noreferrer">Nguồn ca P-3 <ArrowRight size={15}/></a></section>
      <nav className="stepper" aria-label="Luồng CT đến CAD model và xem 3D">{stages.map((item, i) => { const Icon = item.icon; return <div className="stepper-item" key={item.label}><button className={stage === i + 1 ? 'active' : ''} onClick={() => navigate(i + 1)} aria-current={stage === i + 1 ? 'step' : undefined}><span className="step-circle">{stage > i + 1 ? <Check size={14}/> : String(i + 1).padStart(2, '0')}</span><Icon size={17}/><span><strong>{item.label}</strong><small>{i === 0 ? 'CT volume P-3' : i === 1 ? 'PolyData · P007.vtp' : 'Cùng mô hình P007'}</small></span></button>{i < 2 && <ChevronRight size={15} className="step-arrow"/>}</div> })}</nav>
      <section className="workstation"><div className={`continuous-view stage-${stage}`}>
        <div className="viewer-status"><span className="live-dot"/> {caseId} <b>·</b> CT {ctMetadata.sliceIndices[slice]} / 872 <b>·</b> {stage === 1 ? 'SOURCE IMAGE' : stage === 2 ? 'CT ↔ CAD MODEL P007' : 'CT ↔ CAD ↔ 3D · SAME GEOMETRY'}</div>
        <div className="continuous-ct">
          <CTCanvas slice={slice} windowWidth={windowWidth} mode={stage === 1 ? 'ct' : stage === 2 ? ctMode : 'overlay'} onSlice={updateSlice} selectedPoint={selectedCtPoint}/>
          {stage >= 2 && <div className="pane-caption">01 · CT {ctMetadata.sliceIndices[slice]} · ROI PHÓNG ĐẠI{!pointOnSlice && ' · ĐIỂM 3D NGOÀI LÁT MẪU'}</div>}
        </div>
        {stage >= 2 && <div className="continuous-cad"><Vessel3D flow={false} selectedT={inspectT} onSelect={selectModelPoint} resetKey={cameraReset} interactive centerline={centerline} segmentationView sliceIndex={slice} showSlicePlane/><div className="mesh-tag">02 · CAD POLYDATA P007 · LÁT {ctMetadata.sliceIndices[slice]}</div></div>}
        {stage === 3 && <div className="continuous-mesh"><Vessel3D flow={flow} selectedT={inspectT} onSelect={selectModelPoint} resetKey={cameraReset} interactive sliceIndex={slice} showSlicePlane={showPlane}/><div className="mesh-tag">03 · 3D CÙNG P007 · LÁT {ctMetadata.sliceIndices[slice]}</div></div>}
        {stage === 2 && <div className="bridge-label"><span>CT + MASK</span><ArrowRight size={15}/><span>POLYDATA P007</span></div>}
      </div><aside className="workstation-side"><div className="side-heading"><div className="eyebrow">BƯỚC 0{stage} / 03</div><h2>{current.title}</h2><p>{current.note}</p></div>
        {stage === 1 && <div className="side-content"><div className="case-pill"><ScanLine size={17}/> ẢNH GỐC · P-3 · CT</div><Stat label="Nguồn ảnh" value="0227_H_AO_COA.vti"/><Stat label="Bề mặt sẽ dùng" value="P007.vtp"/><Stat label="Lát đang xem" value={`${ctMetadata.sliceIndices[slice]} / 872`}/><p className="side-explain">Thanh lát cắt này chỉ hiển thị 9 lát đã trích quanh quai động mạch chủ. Sang bước 2, chính lát hiện tại sẽ giữ nguyên và được phủ đường bao mạch.</p></div>}
        {stage === 2 && <div className="side-content"><div className="case-pill"><Layers3 size={17}/> CAD MODEL · POLYDATA P007</div><div className="viewer-modes">{(['ct','overlay','mask'] as const).map(mode => <button key={mode} className={ctMode === mode ? 'active' : ''} onClick={() => setCtMode(mode)}>{mode === 'ct' ? 'CT' : mode === 'overlay' ? 'CT + Mask' : 'Mask'}</button>)}</div><label className="check-row"><input type="checkbox" checked={centerline} onChange={e => setCenterline(e.target.checked)}/> Hiện centerline trên mô hình</label><Stat label="Dạng hình học" value="PolyData · 74.572 tam giác"/><Stat label="Mặt cắt liên kết" value={`CT ${ctMetadata.sliceIndices[slice]} ↔ P007`}/><p className="side-explain">Vùng màu trên CT và vòng vàng trên CAD là cùng giao tuyến của P007 với lát đang chọn. Đổi lát để cả hai cập nhật. P007 là mô hình có sẵn của ca P-3, không phải STEP/BREP tham số hay kết quả dựng mới ngay trên web.</p></div>}
        {stage === 3 && <div className="side-content"><div className="case-pill"><Activity size={17}/> CT ↔ CAD ↔ 3D · CÙNG P007</div><div className="viewer-modes"><button className={!flow ? 'active' : ''} onClick={() => setFlow(false)}>Anatomy</button><button className={flow ? 'active' : ''} onClick={() => setFlow(true)}>Velocity demo</button></div><label className="check-row"><input type="checkbox" checked={showPlane} onChange={e => setShowPlane(e.target.checked)}/> Hiện mặt phẳng của lát CT trên 3D</label><button className="camera-reset" onClick={() => setCameraReset(n => n + 1)}><RotateCcw size={14}/> Đặt lại góc nhìn</button><Stat label="Lát liên kết" value={pointOnSlice ? `CT ${ctMetadata.sliceIndices[slice]} ↔ P007` : 'Điểm ngoài 9 lát CT mẫu'}/><Stat label="Vị trí trên centerline" value={`${sample.distance} mm`}/><Stat label="Vận tốc giả lập*" value={`${sample.velocity.toFixed(2)} cm/s`}/></div>}
        <div className="side-bottom"><div className="range-heading"><label htmlFor="slice">LÁT CT CÙNG CA</label><strong>{ctMetadata.sliceIndices[slice]} <span>/ 872</span></strong></div><input id="slice" type="range" min="0" max={ctMetadata.sliceIndices.length - 1} value={slice} onChange={e => updateSlice(+e.target.value)}/><div className="control-foot"><span>9 lát gần quai mạch</span><span>CT thật</span></div>{stage < 3 && <div className="secondary-range"><label htmlFor="width"><SlidersHorizontal size={13}/> Window width</label><input id="width" type="range" min="350" max="1200" step="10" value={windowWidth} onChange={e => setWindowWidth(+e.target.value)}/><span>{windowWidth} HU</span></div>}<button className="primary-action" onClick={() => stage === 3 ? reset() : navigate(stage + 1)}>{stage === 1 ? 'Xem mô hình từ CT' : stage === 2 ? 'Xoay mô hình trong 3D' : 'Chạy lại luồng'} <ArrowRight size={17}/></button><p className="source-note">CT và geometry cùng ca P-3. Chỉ giá trị có dấu * là mô phỏng.</p></div>
      </aside></section>
      <div className="continuity-strip"><span className={stage >= 1 ? 'lit' : ''}><ScanLine size={15}/> CT {ctMetadata.sliceIndices[slice]}</span><ArrowRight size={14}/><span className={stage >= 2 ? 'lit' : ''}><Layers3 size={15}/> CAD model · PolyData P007</span><ArrowRight size={14}/><span className={stage >= 3 ? 'lit' : ''}><Activity size={15}/> 3D tương tác cùng P007</span></div>
      {stage === 3 && <section className="profile-section"><div className="profile-chart"><div className="profile-head"><div><div className="eyebrow">ILLUSTRATIVE FLOW PROFILE</div><h3>Hồ sơ mô phỏng dọc theo mạch</h3></div><span><Crosshair size={14}/> Di chuột để dời điểm trên 3D</span></div><div className="chart-legend"><span><i className="diameter-key"/> Đường kính minh họa (mm)</span><span><i className="index-key"/> Vận tốc giả lập (cm/s)</span><span><i className="lesion-key"/> Vùng hẹp minh họa</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={profile} margin={{top:9,right:20,bottom:0,left:-13}} onMouseMove={state => { if (state.activeLabel !== undefined) selectModelPoint(Math.max(0, Math.min(1, Number(state.activeLabel) / pathLengthMm))) }}><CartesianGrid vertical={false} stroke="#e8eef0" strokeDasharray="3 4"/><XAxis dataKey="distance" type="number" domain={[0,pathLengthMm]} ticks={[0,67,135,202,269]} tick={{fontSize:10,fill:'#91a3ad'}} axisLine={{stroke:'#dbe5e8'}} tickLine={false} unit=" mm"/><YAxis yAxisId="diameter" domain={[0,30]} tick={{fontSize:10,fill:'#91a3ad'}} axisLine={false} tickLine={false}/><YAxis yAxisId="velocity" orientation="right" domain={[0,5]} tick={{fontSize:10,fill:'#91a3ad'}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{border:'1px solid #d9e5e9',borderRadius:6,fontSize:11}} labelFormatter={v => `${v} mm`}/><ReferenceArea yAxisId="diameter" x1={105} x2={158} fill="#f6ddc5" fillOpacity={.45} strokeOpacity={0}/><ReferenceLine yAxisId="diameter" x={sample.distance} stroke="#357c94" strokeDasharray="4 4"/><Line yAxisId="diameter" type="monotone" dataKey="diameter" name="Đường kính minh họa" stroke="#c98776" strokeWidth={2.3} dot={false} isAnimationActive={false}/><Line yAxisId="velocity" type="monotone" dataKey="velocity" name="Vận tốc giả lập" stroke="#3c9fae" strokeWidth={2.2} dot={false} isAnimationActive={false}/></LineChart></ResponsiveContainer></div></div><div className="measurement-card"><div className="eyebrow">ĐIỂM ĐO · DEMO</div><div className="measurement-value"><span>{sample.distance}</span> mm <b>dọc centerline P-3</b></div><div className="measure-row"><span>Đường kính minh họa*</span><strong>{sample.diameter.toFixed(1)} mm</strong></div><div className="measure-row"><span>Áp lực tương đối giả lập*</span><strong>{sample.pressure.toFixed(2)} mmHg</strong></div><div className="measure-row"><span>Vận tốc giả lập*</span><strong>{sample.velocity.toFixed(2)} cm/s</strong></div><div className="measure-note"><CircleHelp size={15}/> CT và mesh là cùng ca. Giá trị * chỉ minh họa, không phải kết quả lâm sàng.</div></div></section>}
      <footer><span>CardioFlow Lab <b>·</b> VMR P-3</span><span>CT <ArrowRight size={12}/> CAD MODEL P007 <ArrowRight size={12}/> 3D TƯƠNG TÁC</span><span><a href="https://purl.stanford.edu/hh073fw2871" target="_blank" rel="noreferrer">Stanford VMR source</a> · RESEARCH DEMO</span></footer>
    </main>
  </div>
}
