import { Suspense, lazy, useState } from 'react'
import { Activity, ArrowDownRight, ArrowLeft, ArrowRight, Box, Check, ExternalLink, FileDown, FileText, Play, RotateCcw, ScanLine } from 'lucide-react'
import MRViewer from './MRViewer'
import ValveShowcase from './ValveShowcase'
import FeatureBridge from './FeatureBridge'
import vinUniversityLogo from './assets/vinuniversity-logo.png'
import './ShowcaseLayout.css'

const SurfaceViewer = lazy(() => import('./SurfaceViewer'))
const SimulationVideo = lazy(() => import('./SimulationVideo'))

const stages = [
  { number: '01', short: 'Ảnh MR', label: 'Ảnh giải phẫu', icon: ScanLine },
  { number: '02', short: 'Bề mặt mạch', label: 'Hình học P001', icon: Box },
  { number: '03', short: 'Dòng chảy', label: 'Video CFD', icon: Activity },
] as const

function StageNotes({ stage }: { stage: number }) {
  if (stage === 0) return <>
    <div className="note-eyebrow"><span className="tiny-line"/> BƯỚC 01 / 03</div>
    <h2>Bắt đầu từ ảnh MR của ca 0225</h2>
    <p className="note-lead">Các lát ảnh được trích từ volume <strong>0225_H_AO_COA.vti</strong>. Báo cáo VMR xác nhận phương thức chụp là MR.</p>
    <div className="fact-grid"><div><span>Ca dữ liệu</span><strong>0225_H_AO_COA</strong></div><div><span>Loại ảnh</span><strong>MR · VTI</strong></div><div><span>Volume gốc</span><strong>300 × 240 × 280 voxel</strong></div><div><span>Hiển thị</span><strong>Lát cắt nguồn</strong></div></div>
    <div className="note-callout">Ảnh MR và bề mặt ở bước sau thuộc cùng ca. Demo này chưa kiểm chứng phép căn chỉnh không gian để phủ bề mặt lên từng lát MR.</div>
    <a className="text-link" href="/vmr-0225/0225_H_AO_COA.pdf" target="_blank" rel="noreferrer"><FileText size={16}/> Xem báo cáo ca VMR <ExternalLink size={13}/></a>
  </>

  if (stage === 1) return <>
    <div className="note-eyebrow"><span className="tiny-line"/> BƯỚC 02 / 03</div>
    <h2>Khám phá bề mặt mạch P001</h2>
    <p className="note-lead">Xoay, phóng to và quan sát bề mặt <strong>P001.vtp</strong>. Đây là hình học nguồn được mô tả là đầu vào cho lưới CFD của video ở bước 3.</p>
    <div className="fact-grid"><div><span>Điểm bề mặt</span><strong>25.108</strong></div><div><span>Tam giác</span><strong>50.212</strong></div><div><span>Định dạng</span><strong>VTK PolyData</strong></div><div><span>Thao tác</span><strong>Xoay · zoom · pan</strong></div></div>
    <div className="cad-card"><div className="cad-card-icon"><Box size={20}/></div><div><strong>CAD STEP tham khảo</strong><p>File <code>0225_H_AO_COA_lumen_smooth.step</code> là solid CAD xấp xỉ của lòng mạch. Video CFD dùng lưới từ P001, nên STEP không được trình bày như cùng một mesh.</p><a href="/vmr-0225/0225_H_AO_COA_lumen_smooth.step" download><FileDown size={15}/> Tải STEP <ArrowDownRight size={14}/></a></div></div>
  </>

  return <>
    <div className="note-eyebrow"><span className="tiny-line"/> BƯỚC 03 / 03</div>
    <h2>Xem mô phỏng CFD đã cung cấp</h2>
    <p className="note-lead">Video hiển thị <strong>áp lực trên bề mặt</strong> bên trái và <strong>đường dòng vận tốc tức thời</strong> bên phải. Thanh thời gian liên kết với metadata của 80 frame.</p>
    <div className="fact-grid"><div><span>Thời gian vật lý</span><strong>0–3,95 s</strong></div><div><span>Thời lượng phát</span><strong>16 s</strong></div><div><span>Số frame</span><strong>80 · 5 fps</strong></div><div><span>Thang áp lực</span><strong>0–6 mmHg cố định</strong></div></div>
    <div className="note-callout">Đây là lượt chạy nghiên cứu với lưu lượng đầu vào được giảm có chủ ý. Màu áp lực vượt 6 mmHg bị bão hòa; thang màu vận tốc thay đổi theo từng frame. Không suy ra kết luận lâm sàng từ video này.</div>
  </>
}

export default function App() {
  const [stage, setStage] = useState(0)

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><img src={vinUniversityLogo} alt="VinUniversity"/><div><strong>CardioFlow <em>Lab</em></strong><small>INTERACTIVE RESEARCH SHOWCASE</small></div></div><div className="header-case"><span>SHOWCASE TRACKS</span><strong>VALVE · VMR 0225</strong></div><a className="reset-button" href="#valve-lab"><Activity size={15}/> Xem van ba lá</a></header>

    <main>
      <nav className="showcase-nav" aria-label="Đi đến phần showcase"><a href="#valve-lab"><Activity size={14}/> Van ba lá</a><a href="#feature-lab"><Box size={14}/> Tính năng tương tác</a><a href="#case-flow"><ScanLine size={14}/> Ca MR / CFD 0225</a></nav>

      <section id="valve-lab" className="valve-chapter"><div className="valve-hero"><div className="valve-hero-copy"><div className="valve-hero-kicker"><i/> FEATURED RESEARCH VISUALIZATION · VALVE SUPPORT & CLOSURE</div><h1>Điều gì thay đổi khi <span>nâng đỡ van không còn đủ?</span></h1><p>Khám phá cơ chế đóng của van ba lá: dây chằng giữ lá van, các mép lá áp sát nhau và một vùng có thể sa lên khi mất nâng đỡ. Mô hình tương tác dưới đây là minh họa định tính dựa trên nghiên cứu, không phải dữ liệu ca 0225.</p><div className="valve-hero-actions"><a href="#valve-interactive">Khám phá đóng van <ArrowRight size={15}/></a><a href="#feature-lab">Xem tính năng <ArrowRight size={15}/></a></div></div><div className="valve-hero-side" aria-hidden="true"><div className="valve-orbit"><span/></div><div className="valve-orbit-label">LEAFLETS · CHORDAE · COAPTATION</div></div></div><div id="valve-interactive"><ValveShowcase/></div></section>

      <div className="showcase-context"><div><strong>Van ba lá · minh họa</strong>So sánh khép kín bình thường và sa lá van từ tài liệu nghiên cứu công bố.</div><div><strong>VMR 0225 · dữ liệu có thật</strong>Ảnh MR, bề mặt động mạch chủ P001 và video CFD thuộc ca coarctation.</div><div><strong>FFRCT · tham chiếu tính năng</strong>Các kiểu tương tác được tham khảo từ trang HeartFlow; folder hiện không có CCTA hay kết quả FFRCT.</div></div>

      <section id="feature-lab" className="feature-chapter"><FeatureBridge/></section>

      <div className="case-chapter-title"><div><span>VMR 0225 · ORIGINAL DATA TRACK</span><h2>Ca động mạch chủ MR → hình học → CFD</h2></div><p>Dữ liệu ca này độc lập với mô hình van minh họa phía trên. Các giá trị theo frame đến từ video và metadata được cung cấp.</p></div>
      <section id="case-flow" className="hero"><div><div className="hero-kicker"><span/> MỘT CA DỮ LIỆU · BA GÓC NHÌN</div><h1>Từ ảnh MR đến <span>dòng chảy trong động mạch chủ.</span></h1><p>Đi qua ảnh nguồn, hình học lòng mạch và video mô phỏng của ca coarctation <strong>0225_H_AO_COA</strong>. Mỗi bước dùng đúng asset trong thư mục bạn cung cấp.</p><div className="hero-tags"><span>MR SOURCE</span><span>P001 SURFACE</span><span>CFD VIDEO</span></div></div><div className="hero-index"><span>CASE STUDY</span><strong>0225</strong><small>VMR · AORTA / COA</small></div></section>

      <nav className="flow-nav" aria-label="Các bước của flow">{stages.map((item, index) => { const Icon = item.icon; return <button type="button" key={item.number} className={`flow-step ${stage === index ? 'active' : ''} ${stage > index ? 'passed' : ''}`} aria-current={stage === index ? 'step' : undefined} onClick={() => setStage(index)}><span className="step-number">{stage > index ? <Check size={16}/> : item.number}</span><span className="step-copy"><small>{item.label}</small><strong>{item.short}</strong></span><Icon className="step-icon" size={19}/>{index < stages.length - 1 && <ArrowRight className="step-chevron" size={17}/>}</button> })}</nav>

      <section className={`workstation${stage === 2 ? ' cfd' : ''}`} aria-label={stages[stage].label}>
        <div className="visual-column"><div className="visual-head"><div><span className="visual-live"/> <strong>{stages[stage].label}</strong><span className="visual-sep">/</span><span>VMR 0225_H_AO_COA</span></div><span className="visual-stage">{stages[stage].number} / 03</span></div><div className={`visual-body visual-body-${stage + 1}`}>{stage === 0 && <MRViewer/>}{stage === 1 && <Suspense fallback={<div className="visual-loading">Đang tải trình xem 3D…</div>}><SurfaceViewer active/></Suspense>}{stage === 2 && <Suspense fallback={<div className="visual-loading">Đang tải video CFD…</div>}><SimulationVideo active/></Suspense>}</div></div>
        <aside className="stage-notes"><div className="stage-notes-main"><StageNotes stage={stage}/></div><div className="stage-actions"><span>{stage === 0 ? 'Ảnh nguồn' : stage === 1 ? 'Hình học nguồn' : 'Mô phỏng đã kết xuất'}</span><div><button className="secondary-button" type="button" disabled={stage === 0} onClick={() => setStage(value => value - 1)}><ArrowLeft size={16}/> Trước</button><button className="primary-button" type="button" onClick={() => setStage(value => value === 2 ? 0 : value + 1)}>{stage === 2 ? <><RotateCcw size={15}/> Xem lại flow</> : <>Bước tiếp <ArrowRight size={16}/></>}</button></div></div></aside>
      </section>

      <section className="provenance"><div className="provenance-title"><span>DATA LINEAGE</span><h2>Quan hệ giữa các file</h2></div><div className="provenance-track"><div className={stage === 0 ? 'selected' : ''}><ScanLine size={17}/><span><strong>MR volume</strong><small>0225_H_AO_COA.vti</small></span></div><ArrowRight size={17}/><div className={stage === 1 ? 'selected' : ''}><Box size={17}/><span><strong>Bề mặt P001</strong><small>P001.vtp</small></span></div><ArrowRight size={17}/><div className={stage === 2 ? 'selected' : ''}><Play size={17}/><span><strong>Video CFD</strong><small>áp lực + đường dòng</small></span></div></div><div className="provenance-branch"><span>Nhánh CAD từ hình học ca này</span><ArrowDownRight size={15}/><strong>STEP xấp xỉ</strong><span>· file tham khảo riêng, không phải mesh của video</span></div></section>

      <footer><div><strong>CardioFlow Lab</strong><span> · VinUniversity demo · Nghiên cứu và phát triển</span></div><div><a href="https://purl.stanford.edu/rm095dp9056" target="_blank" rel="noreferrer">VMR case source <ExternalLink size={12}/></a><a href="/vmr-0225/LICENSE.txt" target="_blank" rel="noreferrer">License</a><a href="/vmr-0225/README-COPYRIGHT" target="_blank" rel="noreferrer">Copyright</a></div></footer>
    </main>
  </div>
}
