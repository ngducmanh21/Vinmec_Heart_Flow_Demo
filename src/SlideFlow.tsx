import { Suspense, lazy, useState } from 'react'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileDown,
  FlaskConical,
  GitBranch,
  Image,
  Info,
  Layers3,
  MousePointer2,
  Play,
  Ruler,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  Workflow,
} from 'lucide-react'
import MRViewer from './MRViewer'
import SlideLab from './SlideLab'
import './SlideFlow.css'

const SurfaceViewer = lazy(() => import('./SurfaceViewer'))
const SimulationVideo = lazy(() => import('./SimulationVideo'))

type StepId = 'intake' | 'model' | 'alternatives' | 'check'
type ModelView = 'surface' | 'simulation'

type FlowStep = {
  id: StepId
  number: string
  label: string
  title: string
  summary: string
  icon: typeof Image
}

const steps: FlowStep[] = [
  {
    id: 'intake',
    number: '01',
    label: 'Dữ liệu lâm sàng',
    title: 'Ảnh lâm sàng và thông số đo',
    summary: 'Xem giải phẫu nguồn trước khi diễn giải mô hình dòng chảy.',
    icon: Image,
  },
  {
    id: 'model',
    number: '02',
    label: 'Mô hình dòng chảy',
    title: 'Mô hình dòng chảy theo ca',
    summary: 'Nối hình học bề mặt được cung cấp với lượt chạy CFD đã lưu.',
    icon: Workflow,
  },
  {
    id: 'alternatives',
    number: '03',
    label: 'Kịch bản điều trị',
    title: 'Phương án do bác sĩ định nghĩa',
    summary: 'Đặt câu hỏi so sánh trong mô hình và ghi rõ giới hạn bằng chứng.',
    icon: GitBranch,
  },
  {
    id: 'check',
    number: '04',
    label: 'Kiểm chứng',
    title: 'Đối chiếu với phép đo độc lập',
    summary: 'Khép vòng bằng dữ liệu nằm ngoài mô hình khi dữ liệu đó sẵn sàng.',
    icon: ClipboardCheck,
  },
]

const researchExamples = [
  {
    title: 'Hẹp mạch vành',
    question: 'Bao nhiêu áp lực đến được phía hạ lưu?',
    detail: 'Một tỷ số áp lực như FFR có thể đặt câu hỏi về dòng chảy mạch vành khi tăng tưới máu.',
    source: 'Gosling et al. (2019) · deck slide 47',
    sourceLinks: [{ label: 'DOI', href: 'https://doi.org/10.1016/j.jcmg.2018.01.019' }],
    status: 'Ví dụ nghiên cứu đã công bố',
    icon: Activity,
  },
  {
    title: 'Dòng chảy trong phình mạch',
    question: 'Dòng chảy hồi lưu xuất hiện ở đâu?',
    detail: 'Thay đổi hình dạng có thể làm đổi mô thức dòng chảy cục bộ. Deck gọi đây là phân tích thăm dò.',
    source: 'Jing et al., PLOS ONE (2015) · deck slide 48',
    sourceLinks: [{ label: 'DOI', href: 'https://doi.org/10.1371/journal.pone.0132494' }],
    status: 'Ví dụ phân tích thăm dò',
    icon: Layers3,
  },
  {
    title: 'So sánh phương án can thiệp',
    question: 'Các kế hoạch khác nhau có làm đổi kết quả mô hình?',
    detail: 'Các phương án ban đầu, đặt stent gần, xa và kết hợp minh họa câu hỏi thay đổi điều trị trong điều kiện mô phỏng.',
    source: 'Gosling et al. (2019) · deck slide 49',
    sourceLinks: [{ label: 'DOI', href: 'https://doi.org/10.1016/j.jcmg.2018.01.019' }],
    status: 'Ví dụ so sánh đã công bố',
    icon: GitBranch,
  },
  {
    title: 'Cầu nối mạch vành',
    question: 'Động mạch tự nhiên và cầu nối chia dòng thế nào?',
    detail: 'Các thang màu riêng cho trạng thái nghỉ và tăng tưới máu hỗ trợ so sánh dòng chảy, không kết luận độ thông cầu nối.',
    source: 'Wu et al., PLOS ONE (2023) · deck slide 50',
    sourceLinks: [{ label: 'DOI', href: 'https://doi.org/10.1371/journal.pone.0281423' }],
    status: 'Ví dụ so sánh đã công bố',
    icon: BarChart3,
  },
  {
    title: 'Van và thiết bị tiếp xúc máu',
    question: 'Giá đỡ hoặc thiết bị làm đổi dòng cục bộ ra sao?',
    detail: 'Van chuyển động, thiết bị quay và kiểm chứng trên bench được deck trình bày như các hướng mở rộng.',
    source: 'Kamensky et al. (2018) and Ponnaluri et al. (2023) · slides 51–53',
    sourceLinks: [
      { label: 'Kamensky DOI', href: 'https://doi.org/10.1016/j.cma.2017.11.007' },
      { label: 'Ponnaluri DOI', href: 'https://doi.org/10.1007/s10439-022-03105-w' },
    ],
    status: 'Hướng mở rộng tương lai',
    icon: FlaskConical,
  },
]

const roadmap = [
  {
    label: 'Hiện tại',
    title: 'Prototype nghiên cứu',
    copy: 'Deck liệt kê dòng đập mạch với thành cố định, áp lực, vận tốc và lưu lượng từng nhánh. Asset ca 0225 hiện chỉ có áp lực và vận tốc.',
    icon: Activity,
    tone: 'current',
  },
  {
    label: 'Kế tiếp',
    title: 'Đo và so sánh',
    copy: 'Kiểm chứng sinh lý cần ghép đầu ra mô hình với phép đo catheter theo cùng một endpoint; so sánh hình học ảo cần các lần chạy thay thế.',
    icon: Ruler,
    tone: 'next',
  },
  {
    label: 'Tương lai',
    title: 'Mở rộng mô hình',
    copy: 'Thành mạch chuyển động, van, thiết bị quay và mô hình tổn thương máu đã kiểm chứng cần phát triển riêng.',
    icon: ShieldCheck,
    tone: 'future',
  },
] as const

function StepRail({ activeStep, onSelect }: { activeStep: number; onSelect: (index: number) => void }) {
  return (
    <nav className="slide-flow__rail" aria-label="Bốn bước của flow nghiên cứu">
      {steps.map((step, index) => {
        const Icon = step.icon
        const selected = activeStep === index
        const complete = activeStep > index
        return (
          <button
            key={step.id}
            type="button"
            className={`slide-flow__rail-step${selected ? ' is-active' : ''}${complete ? ' is-complete' : ''}`}
            aria-current={selected ? 'step' : undefined}
            onClick={() => onSelect(index)}
          >
            <span className="slide-flow__rail-number">{step.number}</span>
            <span className="slide-flow__rail-copy">
              <small>{step.label}</small>
              <strong>{step.title}</strong>
            </span>
            <Icon className="slide-flow__rail-icon" size={18} aria-hidden="true" />
            {index < steps.length - 1 && <ArrowRight className="slide-flow__rail-chevron" size={15} aria-hidden="true" />}
          </button>
        )
      })}
    </nav>
  )
}

function EvidenceTag({ children, tone = 'source' }: { children?: string; tone?: 'source' | 'planned' | 'future' }) {
  return <span className={`slide-flow__evidence-tag slide-flow__evidence-tag--${tone}`}>{children ?? 'Nguồn'}</span>
}

function IntakeStage() {
  return (
    <div className="slide-flow__stage-grid slide-flow__stage-grid--intake">
      <div className="slide-flow__asset-card slide-flow__asset-card--mr">
        <div className="slide-flow__asset-heading">
          <div>
            <span className="slide-flow__eyebrow"><ScanLine size={13} /> ẢNH NGUỒN</span>
            <h3>Rà soát giải phẫu MR</h3>
          </div>
          <EvidenceTag>Asset ca 0225</EvidenceTag>
        </div>
        <div className="slide-flow__asset-stage slide-flow__asset-stage--mr"><MRViewer /></div>
        <div className="slide-flow__asset-caption">
          <span>0225_H_AO_COA.vti</span>
          <span>16 lát cắt trục đã xuất · tọa độ nguồn</span>
        </div>
      </div>

      <aside className="slide-flow__side-panel">
        <div className="slide-flow__panel-kicker"><Stethoscope size={14} /> ĐẦU VÀO LÂM SÀNG</div>
        <h3>Bắt đầu từ điều ảnh có thể cho biết</h3>
        <p className="slide-flow__panel-lead">Deck đặt rà soát giải phẫu và thông số đo ở đầu flow. Báo cáo ca có huyết áp catheter tóm tắt tại AAo và DAo; chưa có waveform thô hoặc phép ghép những số đo này với video CFD đã lưu.</p>

        <div className="slide-flow__input-list">
          <div><span>Phương thức chụp</span><strong>MR · volume VTI</strong><EvidenceTag /></div>
          <div><span>Kích thước nguồn</span><strong>300 × 240 × 280 voxel</strong><EvidenceTag /></div>
          <div><span>Huyết áp catheter trung bình</span><strong>AAo 88 · DAo 81 mmHg</strong><EvidenceTag>Báo cáo ca</EvidenceTag></div>
          <div><span>Căn chỉnh MR với bề mặt</span><strong className="is-missing">Chưa kiểm chứng</strong><EvidenceTag tone="planned">Ranh giới còn mở</EvidenceTag></div>
        </div>

        <div className="slide-flow__note slide-flow__note--teal">
          <Info size={15} />
          <p>Dùng ảnh để rà soát bối cảnh ca. Lát MR và bề mặt P001 được giữ ở hai view nguồn vì folder chưa xác lập căn chỉnh không gian giữa chúng.</p>
        </div>

        <a className="slide-flow__text-link" href="/vmr-0225/0225_H_AO_COA.pdf" target="_blank" rel="noreferrer">
          <span>Mở báo cáo VMR được cung cấp</span><ExternalLink size={13} />
        </a>
      </aside>
    </div>
  )
}

function ModelStage({ modelView, onModelViewChange }: { modelView: ModelView; onModelViewChange: (view: ModelView) => void }) {
  return (
    <div className="slide-flow__model-stage-wrap">
      <div className="slide-flow__model-tabs" role="tablist" aria-label="Hai góc xem bằng chứng mô hình">
          <button type="button" role="tab" aria-selected={modelView === 'surface'} className={modelView === 'surface' ? 'is-active' : ''} onClick={() => onModelViewChange('surface')}>
          <Layers3 size={15} /> Bề mặt P001
        </button>
        <button type="button" role="tab" aria-selected={modelView === 'simulation'} className={modelView === 'simulation' ? 'is-active' : ''} onClick={() => onModelViewChange('simulation')}>
          <Play size={15} /> Timeline CFD
        </button>
      </div>

      <div className={`slide-flow__model-canvas${modelView === 'simulation' ? ' slide-flow__model-canvas--simulation' : ''}`}>
        {modelView === 'surface' ? <Suspense fallback={<div className="slide-flow__model-loading">Đang tải bề mặt P001…</div>}><SurfaceViewer active /></Suspense> : <Suspense fallback={<div className="slide-flow__model-loading">Đang tải video CFD…</div>}><SimulationVideo active title="Lượt chạy CFD đã lưu · ca 0225" /></Suspense>}
      </div>
    </div>
  )
}

function ModelStageAside() {
  return (
    <aside className="slide-flow__side-panel slide-flow__side-panel--model">
      <div className="slide-flow__panel-kicker"><Workflow size={14} /> BẰNG CHỨNG MÔ HÌNH</div>
      <h3>Một ca, hai view nguồn liên kết</h3>
      <p className="slide-flow__panel-lead">Bề mặt P001 và video CFD đã lưu giúp prototype có thể kiểm tra. Viewer mở hình học và metadata phát lại mà không tạo thêm điểm số lâm sàng.</p>

      <div className="slide-flow__metric-list">
        <div><span>Bề mặt</span><strong>P001.vtp</strong><small>25.108 đỉnh · 50.212 tam giác</small></div>
        <div><span>Output đã lưu</span><strong>MP4 + manifest frame</strong><small>80 frame · playback 5 fps</small></div>
        <div><span>Khoảng thời gian vật lý</span><strong>0–3,95 s</strong><small>Theo metadata được cung cấp</small></div>
        <div><span>Phạm vi mô hình</span><strong>Dòng chảy thành cố định</strong><small>Bối cảnh prototype nghiên cứu</small></div>
      </div>

      <div className="slide-flow__note slide-flow__note--amber">
        <Info size={15} />
        <p>STEP là file CAD tham khảo của ca, không phải mesh CFD. Ca này cũng chưa có kết quả FFRCT theo bệnh nhân.</p>
      </div>
      <a className="slide-flow__text-link" href="/vmr-0225/0225_H_AO_COA_lumen_smooth.step" download><FileDown size={14} /><span>Tải file STEP tham khảo</span></a>
      <div className="slide-flow__interaction-hint"><MousePointer2 size={14} /> Kéo bề mặt để xoay hoặc tua timeline video đã lưu.</div>
    </aside>
  )
}

function AlternativesStage({ selectedResearch, onSelectResearch }: { selectedResearch: number; onSelectResearch: (index: number) => void }) {
  const selected = researchExamples[selectedResearch]
  const SelectedIcon = selected.icon

  return (
    <div className="slide-flow__alternatives">
      <div className="slide-flow__alternatives-intro">
        <div>
          <span className="slide-flow__eyebrow"><GitBranch size={13} /> CÂU HỎI MÔ HÌNH</span>
          <h3>Phương án điều trị cần một câu hỏi rõ ràng</h3>
          <p>Deck dùng các ví dụ hẹp mạch vành, phình mạch, cầu nối, van và thiết bị để minh họa nơi mô hình dòng chảy có thể so sánh lựa chọn. Đây là hướng nghiên cứu có nguồn, chưa phải output của ca 0225.</p>
        </div>
        <EvidenceTag tone="future">Ví dụ đã công bố + hướng tương lai</EvidenceTag>
      </div>

      <div className="slide-flow__research-layout">
        <div className="slide-flow__research-list" role="list" aria-label="Các ví dụ nghiên cứu từ slide deck">
          {researchExamples.map((example, index) => {
            const Icon = example.icon
            const active = index === selectedResearch
            return (
              <button key={example.title} type="button" className={`slide-flow__research-item${active ? ' is-active' : ''}`} onClick={() => onSelectResearch(index)} aria-pressed={active}>
                <span className="slide-flow__research-icon"><Icon size={17} /></span>
                <span><strong>{example.title}</strong><small>{example.status}</small></span>
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            )
          })}
        </div>

        <article className="slide-flow__research-detail">
          <div className="slide-flow__detail-heading">
            <span className="slide-flow__detail-icon"><SelectedIcon size={18} /></span>
            <div><span>VÍ DỤ TRONG DECK</span><h4>{selected.title}</h4></div>
            <EvidenceTag tone={selected.status === 'Hướng mở rộng tương lai' ? 'future' : 'source'}>{selected.status}</EvidenceTag>
          </div>
          <p className="slide-flow__research-question">{selected.question}</p>
          <p className="slide-flow__research-copy">{selected.detail}</p>
          <div className="slide-flow__source-line"><CheckCircle2 size={14} /> <span>{selected.source}</span>{selected.sourceLinks.map(link => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label} <ExternalLink size={11} /></a>)}</div>
          <div className="slide-flow__boundary-box">
            <span>RANH GIỚI CỦA CA ĐANG CHỌN</span>
            <strong>Ca 0225_H_AO_COA chưa có output phương án thay thế</strong>
            <p>Ca hiện tại có MR, hình học P001 và một lượt chạy CFD đã lưu. Ca chưa có FFR mạch vành, biến thể điều trị, chuyển động van hoặc mô hình thiết bị.</p>
          </div>
        </article>
      </div>
    </div>
  )
}

function CheckStage() {
  return (
    <div className="slide-flow__check-layout">
      <div className="slide-flow__check-hero">
        <span className="slide-flow__eyebrow"><ClipboardCheck size={13} /> BƯỚC KIỂM CHỨNG</span>
        <h3>Dự đoán gần với phép đo đến mức nào?</h3>
        <p>Báo cáo ca có huyết áp catheter tóm tắt: AAo mean 88 mmHg và DAo mean 81 mmHg. Lượt chạy CFD đang phát chưa có đầu ra tương ứng để đối chiếu cùng điều kiện, nên việc kiểm chứng video vẫn đang lên kế hoạch.</p>
        <div className="slide-flow__status-line"><span className="slide-flow__status-dot" /> Chưa có cặp kết quả mô phỏng và phép đo phù hợp để kiểm chứng video</div>
      </div>

      <div className="slide-flow__check-grid">
        <div className="slide-flow__check-card">
          <span className="slide-flow__check-number">01</span>
          <h4>Số đo lâm sàng trong báo cáo</h4>
          <p>Huyết áp catheter AAo/DAo trung bình 88/81 mmHg; chưa có waveform catheter thô.</p>
          <EvidenceTag>Báo cáo ca</EvidenceTag>
        </div>
        <div className="slide-flow__check-card">
          <span className="slide-flow__check-number">02</span>
          <h4>Endpoint được định nghĩa</h4>
          <p>Cần xác định dự đoán áp lực tương ứng, điều kiện dòng chảy và cách ghép với số đo.</p>
          <EvidenceTag tone="planned">Chưa ghép CFD</EvidenceTag>
        </div>
        <div className="slide-flow__check-card">
          <span className="slide-flow__check-number">03</span>
          <h4>Pilot khả thi</h4>
          <p>Deck đề xuất một đầu mối lâm sàng, 3–5 ca hồi cứu và một endpoint độc lập.</p>
          <EvidenceTag tone="future">Hướng ở slide 58</EvidenceTag>
        </div>
      </div>

      <div className="slide-flow__check-footnote">
        <ShieldCheck size={16} />
        <p><strong>Ranh giới bằng chứng:</strong> deck dẫn một ví dụ kiểm chứng FFR mạch vành đã công bố, đồng thời nêu solver này chưa được kiểm chứng lâm sàng. Ví dụ đó không kiểm chứng lượt chạy ca 0225.</p>
      </div>
    </div>
  )
}

function Roadmap() {
  return (
    <section className="slide-flow__roadmap" aria-labelledby="slide-flow-roadmap-title">
      <div className="slide-flow__section-heading">
        <div><span className="slide-flow__eyebrow"><BarChart3 size={13} /> TRẠNG THÁI PHÁT TRIỂN</span><h2 id="slide-flow-roadmap-title">Ranh giới rõ giữa prototype và câu hỏi kế tiếp</h2></div>
        <p>Diễn giải từ deck được cung cấp, slide 56</p>
      </div>
      <div className="slide-flow__roadmap-grid">
        {roadmap.map(item => {
          const Icon = item.icon
          return <article key={item.label} className={`slide-flow__roadmap-card slide-flow__roadmap-card--${item.tone}`}>
            <div className="slide-flow__roadmap-label"><span>{item.label}</span><Icon size={16} /></div>
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
          </article>
        })}
      </div>
      <div className="slide-flow__roadmap-note"><Info size={14} /> Prototype nghiên cứu. Ứng dụng lâm sàng cần một quy trình kiểm chứng riêng.</div>
    </section>
  )
}

export default function SlideFlow() {
  const [activeStep, setActiveStep] = useState(0)
  const [modelView, setModelView] = useState<ModelView>('surface')
  const [selectedResearch, setSelectedResearch] = useState(0)
  const currentStep = steps[activeStep]

  function selectStep(index: number) {
    setActiveStep(index)
    if (index !== 2) setSelectedResearch(0)
  }

  function moveStep(delta: number) {
    setActiveStep(current => Math.min(steps.length - 1, Math.max(0, current + delta)))
  }

  return (
    <div className="slide-flow">
      <section className="slide-flow__hero">
        <div className="slide-flow__hero-copy">
          <div className="slide-flow__hero-kicker"><span /> FLOW NGHIÊN CỨU DÒNG CHẢY</div>
          <h1>Từ ảnh lâm sàng đến mô hình dòng chảy có thể kiểm tra</h1>
          <p>Dùng asset của ca để đi qua một flow lấy cảm hứng tương tác từ HeartFlow: rà soát ảnh, xem mô hình, đặt câu hỏi về phương án thay thế và xác định phép đo cần có để kiểm tra.</p>
          <div className="slide-flow__hero-actions">
            <button type="button" onClick={() => selectStep(0)}>Mở flow của ca <ArrowRight size={15} /></button>
            <a className="slide-flow__lab-cta" href="#slide-lab">Xem mô phỏng slide 43–48 <ArrowRight size={15} /></a>
            <a href="https://www.heartflow.com/heartflow-one/ffrct-analysis/" target="_blank" rel="noreferrer">Trang tham khảo tương tác: HeartFlow FFRCT <ExternalLink size={13} /></a>
          </div>
        </div>
        <div className="slide-flow__hero-case">
          <span>CA ĐANG CHỌN</span>
          <strong>0225</strong>
          <small>MR · ĐỘNG MẠCH CHỦ / COA</small>
          <div className="slide-flow__hero-divider" />
          <p>Deck nguồn<br /><b>Slides.pdf</b><br />flow: slide 55 · roadmap: slide 56</p>
        </div>
      </section>

      <div className="slide-flow__disclosure"><Info size={14} /><span>Flow showcase nguyên bản. HeartFlow chỉ là trang tham khảo tương tác. Ca đang chọn là dữ liệu MR động mạch chủ, không có FFRCT mạch vành hoặc tuyên bố hiệu năng lâm sàng.</span></div>

      <StepRail activeStep={activeStep} onSelect={selectStep} />

      <section className="slide-flow__workspace" aria-labelledby="slide-flow-workspace-title">
        <div className="slide-flow__workspace-head">
          <div><span className="slide-flow__workspace-step">BƯỚC {currentStep.number} · {currentStep.label.toUpperCase()}</span><h2 id="slide-flow-workspace-title">{currentStep.title}</h2><p>{currentStep.summary}</p></div>
          <div className="slide-flow__workspace-controls"><button type="button" onClick={() => moveStep(-1)} disabled={activeStep === 0} aria-label="Bước trước"><ArrowLeft size={15} /></button><span>{currentStep.number} / 04</span><button type="button" onClick={() => moveStep(1)} disabled={activeStep === steps.length - 1} aria-label="Bước tiếp theo"><ArrowRight size={15} /></button></div>
        </div>

        <div className={`slide-flow__workspace-body slide-flow__workspace-body--${currentStep.id}`}>
          {activeStep === 0 && <IntakeStage />}
          {activeStep === 1 && <div className={`slide-flow__stage-grid slide-flow__stage-grid--model${modelView === 'simulation' ? ' slide-flow__stage-grid--simulation' : ''}`}><ModelStage modelView={modelView} onModelViewChange={setModelView} />{modelView === 'surface' && <ModelStageAside />}</div>}
          {activeStep === 2 && <AlternativesStage selectedResearch={selectedResearch} onSelectResearch={setSelectedResearch} />}
          {activeStep === 3 && <CheckStage />}
        </div>

        <div className="slide-flow__workspace-footer"><span>{activeStep === 0 ? 'Rà soát nguồn' : activeStep === 1 ? 'Bằng chứng mô hình' : activeStep === 2 ? 'Bối cảnh nghiên cứu' : 'Kế hoạch kiểm chứng'}</span><div><button type="button" className="slide-flow__secondary-button" onClick={() => moveStep(-1)} disabled={activeStep === 0}><ArrowLeft size={14} /> Trước</button><button type="button" className="slide-flow__primary-button" onClick={() => moveStep(1)} disabled={activeStep === steps.length - 1}>{activeStep === steps.length - 1 ? 'Kết thúc flow' : 'Bước tiếp'} <ArrowRight size={14} /></button></div></div>
      </section>

      <SlideLab />

      <Roadmap />

      <section className="slide-flow__sources" aria-label="Provenance and scope">
        <div><span className="slide-flow__eyebrow"><ShieldCheck size={13} /> NGUỒN VÀ PHẠM VI</span><h2>Mỗi lớp dữ liệu có một ranh giới bằng chứng riêng</h2></div>
        <div className="slide-flow__source-columns"><p><strong>Ca 0225</strong> Lát MR, bề mặt P001, STEP, huyết áp catheter tóm tắt trong báo cáo và metadata MP4/frame CFD đã lưu đến từ bundle cục bộ `public/vmr-0225`.</p><p><strong>Bối cảnh deck</strong> Trình tự flow và hướng nghiên cứu đến từ <em>Slides.pdf</em>, slide 43–58, do người dùng cung cấp.</p><p><strong>Kiểm chứng</strong> Showcase chỉ ra phép đối chiếu còn thiếu. Các ví dụ nghiên cứu không trở thành tuyên bố theo bệnh nhân.</p></div>
      </section>
    </div>
  )
}
