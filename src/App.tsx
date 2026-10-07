import { useState } from 'react'
import { Activity, ArrowDownRight, ArrowLeft, ArrowRight, Box, Check, ExternalLink, FileDown, FileText, Play, RotateCcw, ScanLine } from 'lucide-react'
import MRViewer from './MRViewer'
import SurfaceViewer from './SurfaceViewer'
import SimulationVideo from './SimulationVideo'
import vinUniversityLogo from './assets/vinuniversity-logo.png'

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
    <header className="topbar"><div className="brand"><img src={vinUniversityLogo} alt="VinUniversity"/><div><strong>CardioFlow <em>Lab</em></strong><small>VASCULAR RESEARCH VIEWER</small></div></div><div className="header-case"><span>ACTIVE CASE</span><strong>0225_H_AO_COA</strong></div><button className="reset-button" type="button" onClick={() => setStage(0)}><RotateCcw size={15}/> Bắt đầu lại</button></header>

    <main>
      <section className="hero"><div><div className="hero-kicker"><span/> MỘT CA DỮ LIỆU · BA GÓC NHÌN</div><h1>Từ ảnh MR đến <span>dòng chảy trong động mạch chủ.</span></h1><p>Đi qua ảnh nguồn, hình học lòng mạch và video mô phỏng của ca coarctation <strong>0225_H_AO_COA</strong>. Mỗi bước dùng đúng asset trong thư mục bạn cung cấp.</p><div className="hero-tags"><span>MR SOURCE</span><span>P001 SURFACE</span><span>CFD VIDEO</span></div></div><div className="hero-index"><span>CASE STUDY</span><strong>0225</strong><small>VMR · AORTA / COA</small></div></section>

      <nav className="flow-nav" aria-label="Các bước của flow">{stages.map((item, index) => { const Icon = item.icon; return <button type="button" key={item.number} className={`flow-step ${stage === index ? 'active' : ''} ${stage > index ? 'passed' : ''}`} aria-current={stage === index ? 'step' : undefined} onClick={() => setStage(index)}><span className="step-number">{stage > index ? <Check size={16}/> : item.number}</span><span className="step-copy"><small>{item.label}</small><strong>{item.short}</strong></span><Icon className="step-icon" size={19}/>{index < stages.length - 1 && <ArrowRight className="step-chevron" size={17}/>}</button> })}</nav>

      <section className={`workstation${stage === 2 ? ' cfd' : ''}`} aria-label={stages[stage].label}>
        <div className="visual-column"><div className="visual-head"><div><span className="visual-live"/> <strong>{stages[stage].label}</strong><span className="visual-sep">/</span><span>VMR 0225_H_AO_COA</span></div><span className="visual-stage">{stages[stage].number} / 03</span></div><div className={`visual-body visual-body-${stage + 1}`}>{stage === 0 && <MRViewer/>}{stage === 1 && <SurfaceViewer active/>}{stage === 2 && <SimulationVideo active/>}</div></div>
        <aside className="stage-notes"><div className="stage-notes-main"><StageNotes stage={stage}/></div><div className="stage-actions"><span>{stage === 0 ? 'Ảnh nguồn' : stage === 1 ? 'Hình học nguồn' : 'Mô phỏng đã kết xuất'}</span><div><button className="secondary-button" type="button" disabled={stage === 0} onClick={() => setStage(value => value - 1)}><ArrowLeft size={16}/> Trước</button><button className="primary-button" type="button" onClick={() => setStage(value => value === 2 ? 0 : value + 1)}>{stage === 2 ? <><RotateCcw size={15}/> Xem lại flow</> : <>Bước tiếp <ArrowRight size={16}/></>}</button></div></div></aside>
      </section>

      <section className="provenance"><div className="provenance-title"><span>DATA LINEAGE</span><h2>Quan hệ giữa các file</h2></div><div className="provenance-track"><div className={stage === 0 ? 'selected' : ''}><ScanLine size={17}/><span><strong>MR volume</strong><small>0225_H_AO_COA.vti</small></span></div><ArrowRight size={17}/><div className={stage === 1 ? 'selected' : ''}><Box size={17}/><span><strong>Bề mặt P001</strong><small>P001.vtp</small></span></div><ArrowRight size={17}/><div className={stage === 2 ? 'selected' : ''}><Play size={17}/><span><strong>Video CFD</strong><small>áp lực + đường dòng</small></span></div></div><div className="provenance-branch"><span>Nhánh CAD từ hình học ca này</span><ArrowDownRight size={15}/><strong>STEP xấp xỉ</strong><span>· file tham khảo riêng, không phải mesh của video</span></div></section>

      <footer><div><strong>CardioFlow Lab</strong><span> · VinUniversity demo · Nghiên cứu và phát triển</span></div><div><a href="https://purl.stanford.edu/rm095dp9056" target="_blank" rel="noreferrer">VMR case source <ExternalLink size={12}/></a><a href="/vmr-0225/LICENSE.txt" target="_blank" rel="noreferrer">License</a><a href="/vmr-0225/README-COPYRIGHT" target="_blank" rel="noreferrer">Copyright</a></div></footer>
    </main>
  </div>
}
