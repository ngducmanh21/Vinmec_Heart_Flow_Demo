import {
  Activity,
  ArrowRight,
  Check,
  ClipboardList,
  Database,
  Download,
  FileText,
  Info,
  Layers3,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  DEMO_CASE,
  DEMO_LESIONS,
  DEMO_PLAQUE_TOTAL_MM3,
  getDemoLesion,
  type DemoLesion,
  type LesionSelectionProps, type DemoPlans, TPV_BANDS, tpvBandIndex,
} from './coronaryDemoData'
import './CoronaryReportDemo.css'
import './CoronaryEnhancements.css'
import { createCoronaryReportPdf } from './coronaryReportPdf'

type WorkflowStep = {
  number: string
  label: string
  detail: string
  icon: typeof Layers3
}

const WORKFLOW_STEPS: readonly WorkflowStep[] = [
  { number: '01', label: 'CCTA concept', detail: 'input minh họa', icon: Layers3 },
  { number: '02', label: 'Anatomy + physiology', detail: 'bản đồ tương tác', icon: Activity },
  { number: '03', label: 'Lesion review', detail: 'chọn vùng cần xem', icon: MapPin },
  { number: '04', label: 'Report', detail: 'tải bản tóm tắt', icon: FileText },
]

function formatRatio(value: number) {
  return value.toFixed(2)
}

function plaqueTotal(lesion: DemoLesion) {
  return lesion.plaqueMm3.nonCalcified + lesion.plaqueMm3.calcified + lesion.plaqueMm3.lowAttenuation
}

function reportText(selected: DemoLesion, plans: DemoPlans) {
  const lines = [
    'CARDIOFLOW LAB · CASE SUMMARY',
    '================================',
    `Dataset: ${DEMO_CASE.id}`,
    `Case: ${DEMO_CASE.title}`,
    `Modality: ${DEMO_CASE.modality}`,
    '',
    'DEMO CAVEAT',
    'This is a synthetic teaching dataset created for an interaction showcase.',
    'It contains no patient data, no measured FFRCT, and no clinical recommendation.',
    'The report is generated locally in the browser. No PACS or EMR integration is active.',
    '',
    'SELECTED LESION',
    `ID: ${selected.id}`,
    `Branch: ${selected.branchLabel}`,
    `Location: ${selected.location}`,
    `Illustrative narrowing: ${selected.severityPct}%`,
    `Proximal ratio: ${formatRatio(selected.proximalRatio)}`,
    `Distal ratio: ${formatRatio(selected.distalRatio)}`,
    `Planning ratio: ${formatRatio(selected.plannedRatio)}`,
    `Plaque volume (illustrative): ${plaqueTotal(selected)} mm³`,
    '',
    'LESION REGISTER',
    ...DEMO_LESIONS.map(
      lesion => `${lesion.id} · ${lesion.branchLabel} · ${lesion.location} · ${lesion.severityPct}% illustrative narrowing`,
    ),
    '',
    'SAVED VIRTUAL PLANS',
    ...DEMO_LESIONS.map(l => `${l.id}: ${plans[l.id].stentLength} mm stent | horizontal ${plans[l.id].lao} deg | vertical ${plans[l.id].cranial} deg`),
    `Total plaque: ${DEMO_PLAQUE_TOTAL_MM3} mm3 | TPV band: ${TPV_BANDS[tpvBandIndex(DEMO_PLAQUE_TOTAL_MM3)].label}`,
    '',
    'WORKFLOW STATUS',
    'CCTA concept → anatomy/physiology demo → lesion review → report',
    'Status: showcase only · not for diagnosis, triage, or treatment decisions',
    '',
    'Generated locally by CardioFlow Lab.',
  ]
  return lines.join('\n')
}

function WorkflowRail({ activeStep, onStepChange }: { activeStep: number; onStepChange: (step: number) => void }) {
  return (
    <nav className="coronary-report__workflow" aria-label="Luồng xem ca mô phỏng">
      {WORKFLOW_STEPS.map((step, index) => {
        const Icon = step.icon
        const active = activeStep === index
        const completed = index < activeStep
        return (
          <button
            className={`coronary-report__workflow-step${active ? ' is-active' : ''}${completed ? ' is-complete' : ''}`}
            key={step.number}
            type="button"
            onClick={() => onStepChange(index)}
            aria-current={active ? 'step' : undefined}
          >
            <span className="coronary-report__workflow-number">{completed ? <Check size={13} /> : step.number}</span>
            <span className="coronary-report__workflow-copy">
              <strong>{step.label}</strong>
              <small>{step.detail}</small>
            </span>
            <Icon className="coronary-report__workflow-icon" size={16} aria-hidden="true" />
            {index < WORKFLOW_STEPS.length - 1 && <ArrowRight className="coronary-report__workflow-arrow" size={14} aria-hidden="true" />}
          </button>
        )
      })}
    </nav>
  )
}

function RatioBar({ label, value, tone }: { label: string; value: number; tone: 'teal' | 'violet' | 'gold' }) {
  return (
    <div className="coronary-report__ratio">
      <div className="coronary-report__ratio-heading"><span>{label}</span><strong>{formatRatio(value)}</strong></div>
      <div className="coronary-report__ratio-track" aria-hidden="true"><span className={`is-${tone}`} style={{ width: `${value * 100}%` }} /></div>
    </div>
  )
}

function LesionRow({ lesion, selected, onSelect }: { lesion: DemoLesion; selected: boolean; onSelect: () => void }) {
  return (
    <button className={`coronary-report__lesion-row${selected ? ' is-selected' : ''}`} type="button" onClick={onSelect} aria-pressed={selected}>
      <span className="coronary-report__lesion-id"><i />{lesion.id}</span>
      <span><strong>{lesion.branchLabel}</strong><small>{lesion.location}</small></span>
      <span className="coronary-report__lesion-severity"><strong>{lesion.severityPct}%</strong><small>mô hình</small></span>
      <span className="coronary-report__lesion-plaque"><strong>{plaqueTotal(lesion)} mm³</strong><small>plaque demo</small></span>
      <ArrowRight className="coronary-report__lesion-arrow" size={15} aria-hidden="true" />
    </button>
  )
}

export default function CoronaryReportDemo({ selectedLesionId, onSelectLesion, plans }: LesionSelectionProps & {plans: DemoPlans}) {
  const [activeStep, setActiveStep] = useState(0)
  const [downloaded, setDownloaded] = useState(false)
  const [delivery, setDelivery] = useState(0)
  const [pdfUrl, setPdfUrl] = useState('')
  useEffect(() => {
    const bytes = createCoronaryReportPdf(selectedLesionId, plans)
    const url = URL.createObjectURL(new Blob([bytes.slice().buffer as ArrayBuffer], {type:'application/pdf'}))
    setPdfUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [selectedLesionId, plans])
  const selected = useMemo(() => getDemoLesion(selectedLesionId), [selectedLesionId])
  const plainReport = useMemo(() => reportText(selected, plans), [selected, plans])
  const downloadHref = useMemo(() => `data:text/plain;charset=utf-8,${encodeURIComponent(plainReport)}`, [plainReport])

  const jumpToLesion = (id: DemoLesion['id']) => {
    onSelectLesion(id)
    setActiveStep(2)
  }

  const handleDownload = () => {
    setDownloaded(true)
    setActiveStep(3)
  }

  return (
    <section className="coronary-report" aria-labelledby="coronary-report-title">
      <header className="coronary-report__hero">
        <div className="coronary-report__hero-copy">
          <div className="coronary-report__eyebrow"><span /> CASE WORKSPACE · SYNTHETIC SHOWCASE</div>
          <h2 id="coronary-report-title">Từ cây mạch đến bản tóm tắt ca</h2>
          <p>Một luồng khép kín để xem anatomy, physiology minh họa, rà từng tổn thương và xuất lại trạng thái đang chọn.</p>
          <div className="coronary-report__hero-tags"><span>{DEMO_CASE.id}</span><span>CCTA concept</span><span>local-only</span></div>
        </div>
        <div className="coronary-report__hero-status">
          <div className="coronary-report__status-icon"><ShieldCheck size={21} /></div>
          <strong>Không kết nối hệ thống</strong>
          <span>PACS / EMR · LOCAL DEMO</span>
        </div>
      </header>

      <div className="coronary-report__caveat" role="note">
        <Info size={15} aria-hidden="true" />
        <p><strong>SIM-COR-01 là bộ dữ liệu giả lập.</strong> Hình học, tỷ lệ và thể tích plaque chỉ phục vụ showcase tương tác; không có dữ liệu bệnh nhân, FFRCT đo thật hay khuyến nghị lâm sàng.</p>
      </div>

      <WorkflowRail activeStep={activeStep} onStepChange={setActiveStep} />
      <div className="coronary-extra-panel" aria-live="polite">{[
        'Đầu vào demo: hình học dựng sẵn, không cần tải ảnh bệnh nhân.',
        'Mô hình dùng chung các nhánh LAD, LCx, RCA và các preset tỷ lệ, mức hẹp, mảng bám.',
        'Chọn tổn thương trong danh sách để xem đúng số liệu và kế hoạch được lưu.',
        'Mở hoặc tải PDF tổng hợp; có thể thử trạng thái giao nhận PACS/EMR ở panel bên dưới.'
      ][activeStep]}</div>

      <div className="coronary-report__summary-grid">
        <article className="coronary-report__summary-card">
          <div className="coronary-report__card-heading">
            <div><span className="coronary-report__heading-icon"><Database size={16} /></span><span><small>CASE INPUT</small><strong>{DEMO_CASE.title}</strong></span></div>
            <span className="coronary-report__status-pill"><i /> LOCAL DEMO</span>
          </div>
          <div className="coronary-report__summary-stats">
            <div><span>Dataset</span><strong>{DEMO_CASE.id}</strong><small>synthetic geometry</small></div>
            <div><span>Nhánh review</span><strong>03</strong><small>LAD · LCx · RCA</small></div>
            <div><span>Plaque tổng</span><strong>{DEMO_PLAQUE_TOTAL_MM3}</strong><small>mm³ · quy ước</small></div>
          </div>
          <div className="coronary-report__input-note"><Layers3 size={14} /><span><strong>CCTA concept</strong> · hình học tổng hợp để diễn giải cách một case workspace có thể nối hình học, physiology và report.</span></div>
        </article>

        <article className="coronary-report__selected-card">
          <div className="coronary-report__card-heading">
            <div><span className="coronary-report__heading-icon is-purple"><MapPin size={16} /></span><span><small>SELECTED LESION</small><strong>{selected.id} · {selected.branchLabel}</strong></span></div>
            <span className="coronary-report__selected-label">ĐANG XEM</span>
          </div>
          <div className="coronary-report__selected-location"><strong>{selected.location}</strong><span> · {selected.lengthMm} mm length demo</span></div>
          <div className="coronary-report__ratio-grid">
            <RatioBar label="Proximal" value={selected.proximalRatio} tone="teal" />
            <RatioBar label="Distal" value={selected.distalRatio} tone="violet" />
            <RatioBar label="Planning" value={selected.plannedRatio} tone="gold" />
          </div>
          <div className="coronary-extra-panel"><strong>Kế hoạch PCI đã chọn</strong><span>{plans[selected.id].stentLength} mm · {plans[selected.id].lao >= 0 ? 'LAO' : 'RAO'} {Math.abs(plans[selected.id].lao)}° · góc dọc {plans[selected.id].cranial}°</span></div>
          <div className="coronary-report__selected-foot"><span><strong>{selected.severityPct}%</strong> mức hẹp hình học</span><span><strong>{plaqueTotal(selected)} mm³</strong> plaque demo</span></div>
        </article>
      </div>

      <div className="coronary-report__main-grid">
        <article className="coronary-report__register-card">
          <div className="coronary-report__section-heading"><div><span className="coronary-report__heading-icon is-orange"><ClipboardList size={16} /></span><span><small>LESION REGISTER</small><strong>Danh sách vùng cần review</strong></span></div><span className="coronary-report__section-meta">{DEMO_LESIONS.length} targets</span></div>
          <p className="coronary-report__section-lead">Chọn một dòng để đồng bộ vùng đang xem với bản đồ anatomy/physiology ở workspace chính.</p>
          <div className="coronary-report__lesion-list">
            {DEMO_LESIONS.map(lesion => <LesionRow key={lesion.id} lesion={lesion} selected={lesion.id === selected.id} onSelect={() => jumpToLesion(lesion.id)} />)}
          </div>
          <div className="coronary-report__review-note"><Sparkles size={14} /><span><strong>Gợi ý demo:</strong> đổi L1 → L2 → L3 → L4 để thấy selected lesion và report context cập nhật theo.</span></div>
        </article>

        <aside className="coronary-report__report-card">
          <div className="coronary-report__report-card-top"><span className="coronary-report__heading-icon is-green"><FileText size={16} /></span><div><small>REPORT WORKFLOW</small><strong>Xuất bản tóm tắt</strong></div><span className="coronary-report__report-state">{downloaded ? 'YÊU CẦU TẢI' : 'LOCAL'}</span></div>
          <p>Báo cáo gồm các tổn thương, tổng plaque và chiều dài stent/góc C-arm bạn đã chọn. PDF được tạo tại trình duyệt.</p>
          <div className="coronary-report__report-preview">
            <div><span>Selected</span><strong>{selected.id} · {selected.branchLabel}</strong></div>
            <div><span>Output</span><strong>PDF + TXT · {DEMO_CASE.id.toLowerCase()}</strong></div>
            <div><span>Transport</span><strong>Local browser only</strong></div>
          </div>
          <div className="coronary-pdf-actions"><a href={pdfUrl} download={`${DEMO_CASE.id.toLowerCase()}-report.pdf`} onClick={handleDownload}>Tải báo cáo PDF</a><a href={pdfUrl} target="_blank" rel="noreferrer">Mở PDF</a></div>
          <div className="coronary-case-delivery"><strong>Giao nhận mô phỏng</strong><p aria-live="polite">{['Chưa chuẩn bị gói demo','Đã đóng gói báo cáo demo','PACS mô phỏng đã nhận','EMR mô phỏng đã nhận'][delivery]}</p><button type="button" onClick={()=>setDelivery(value=>(value+1)%4)}>{['Chuẩn bị gói demo','Chuyển tới PACS mô phỏng','Chuyển tới EMR mô phỏng','Đặt lại giao nhận'][delivery]}</button><p>Trạng thái chạy cục bộ, không gửi dữ liệu ra hệ thống ngoài.</p></div>
          <a className="coronary-report__download" href={downloadHref} download={`${DEMO_CASE.id.toLowerCase()}-case-summary.txt`} onClick={handleDownload}><Download size={15} /> {downloaded ? 'Tải lại bản tóm tắt' : 'Tải case summary'}</a>
          <details className="coronary-report__text-preview"><summary>Xem nội dung bản tóm tắt</summary><pre>{plainReport}</pre></details>
          <div className="coronary-report__report-foot"><Check size={13} /><span>Không gửi dữ liệu ra ngoài · không PACS/EMR integration</span></div>
        </aside>
      </div>

      <footer className="coronary-report__footer"><span><ShieldCheck size={13} /> SIM-COR-01 · synthetic teaching case</span><span>Showcase only · không dùng cho quyết định lâm sàng</span></footer>
    </section>
  )
}
