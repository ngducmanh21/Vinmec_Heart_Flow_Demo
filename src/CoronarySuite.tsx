import { lazy, Suspense, useState } from 'react'
import { Activity, ArrowLeft, ArrowRight, ClipboardList, ExternalLink, GitBranch, Layers3, ScanLine, ShieldCheck } from 'lucide-react'
import { DEMO_CASE, getDemoLesion, LESION_POSITION, initialDemoPlans, type DemoPlan, type DemoLesion } from './coronaryDemoData'
import './CoronarySuite.css'
import { useFeatureNavigation } from './useFeatureNavigation'

const CoronaryPhysiologyDemo = lazy(() => import('./CoronaryPhysiologyDemo'))
const CoronaryRoadmapDemo = lazy(() => import('./CoronaryRoadmapDemo'))
const CoronaryPlaqueDemo = lazy(() => import('./CoronaryPlaqueDemo'))
const CoronaryPlanDemo = lazy(() => import('./CoronaryPlanDemo'))
const CoronaryReportDemo = lazy(() => import('./CoronaryReportDemo'))

const views = [
  { key: 'physiology', label: '3D & sinh lý', detail: 'FFR₍CT₎ demo', icon: Activity },
  { key: 'roadmap', label: 'Bản đồ tổn thương', detail: 'Vị trí · độ hẹp', icon: ScanLine },
  { key: 'plaque', label: 'Mảng bám', detail: 'Thể tích · mặt cắt', icon: Layers3 },
  { key: 'plan', label: 'Kế hoạch PCI', detail: 'Phương án minh họa', icon: GitBranch },
  { key: 'report', label: 'Báo cáo', detail: 'Tổng hợp · xuất demo', icon: ClipboardList },
] as const

type ViewKey = typeof views[number]['key']

export default function CoronarySuite() {
  const { active: view, select: setView, navigationRef, workspaceRef } = useFeatureNavigation<ViewKey>('physiology')
  const viewIndex = views.findIndex(item => item.key === view)
  const [selectedLesionId, setSelectedLesionId] = useState<DemoLesion['id']>('L1')
  const [probeT, setProbeT] = useState(LESION_POSITION.L1)
  const [plans, setPlans] = useState(initialDemoPlans)
  function selectLesion(id: DemoLesion['id']) { setSelectedLesionId(id); setProbeT(LESION_POSITION[id]) }
  function changePlan(id: DemoLesion['id'], plan: DemoPlan) { setPlans(current => ({ ...current, [id]: plan })) }
  const selectedLesion = getDemoLesion(selectedLesionId)
  const shared = { selectedLesionId, onSelectLesion: selectLesion, probeT, onProbeTChange: setProbeT }

  return (
    <section className="coronary-suite" id="coronary-suite" aria-labelledby="coronary-suite-title">
      <div className="coronary-suite__hero">
        <div>
          <span className="coronary-suite__eyebrow"><span /> MÔ PHỎNG MẠCH VÀNH · CA GIẢ LẬP</span>
          <h2 id="coronary-suite-title">Khám phá giải phẫu, dòng chảy và phương án</h2>
          <p>Một ca mạch vành được dựng bằng code để thử đủ hành trình tương tác: mô hình 3D, bản đồ tổn thương, mảng bám, lập kế hoạch PCI và báo cáo. Các giá trị được đặt sẵn để minh họa giao diện; khu này không dùng ảnh hay kết quả của ca 0225.</p>
        </div>
        <div className="coronary-suite__case">
          <small>EDUCATIONAL DATASET</small>
          <strong>{DEMO_CASE.id}</strong>
          <span>Không phải dữ liệu bệnh nhân</span>
        </div>
      </div>

      <div className="coronary-suite__boundary" role="note"><ShieldCheck size={16} /><span>Toàn bộ hình học, tỷ lệ áp lực, mức hẹp và mảng bám trong khu này là <strong>dữ liệu giả lập</strong>. Không có CCTA, phép giải FFR₍CT₎, dự đoán hiệu quả can thiệp hoặc kết luận lâm sàng.</span></div>

      <div className="coronary-suite__switcher" ref={navigationRef}>
        <div className="feature-switcher-label"><strong>CHỌN TÍNH NĂNG</strong><span>{viewIndex + 1} / {views.length} · {views[viewIndex].label}</span></div>
      <nav className="coronary-suite__nav" aria-label="Chọn tính năng mô phỏng mạch vành">
        {views.map(item => {
          const Icon = item.icon
          return <button key={item.key} type="button" className={view === item.key ? 'is-active' : ''} aria-pressed={view === item.key} onClick={() => setView(item.key)}>
            <Icon size={18} aria-hidden="true" /><span><strong>{item.label}</strong><small>{item.detail}</small></span>
          </button>
        })}
      </nav>
      </div>

      <div className="coronary-suite__workspace" ref={workspaceRef}>
        <div className="coronary-suite__workspace-head">
          <div><span>CA GIẢ LẬP · {DEMO_CASE.id}</span><h3>{views.find(item => item.key === view)?.label}</h3></div>
          <div className="coronary-suite__selection"><span>Đang xem</span><strong>{selectedLesion.id} · {selectedLesion.location}</strong></div>
        </div>
        <Suspense fallback={<div className="coronary-suite__loading">Đang tải góc xem mạch vành…</div>}>
          {view === 'physiology' && <CoronaryPhysiologyDemo {...shared} />}
          {view === 'roadmap' && <CoronaryRoadmapDemo {...shared} />}
          {view === 'plaque' && <CoronaryPlaqueDemo {...shared} />}
          {view === 'plan' && <CoronaryPlanDemo {...shared} plans={plans} onPlanChange={changePlan} />}
          {view === 'report' && <CoronaryReportDemo {...shared} plans={plans} />}
        </Suspense>
        <div className="coronary-suite__workspace-foot">
          <span>Giá trị giả lập · chỉ để trải nghiệm giao diện</span>
          <div className="coronary-suite__pager">
            <button type="button" disabled={viewIndex === 0} onClick={() => setView(views[viewIndex - 1].key)}><ArrowLeft size={14} /> Mục trước</button>
            <span>{viewIndex + 1} / {views.length}</span>
            <button type="button" disabled={viewIndex === views.length - 1} onClick={() => setView(views[viewIndex + 1].key)}>Mục tiếp <ArrowRight size={14} /></button>
          </div>
        </div>
      </div>

      <div className="coronary-suite__references"><span>Tham khảo nhóm tính năng:</span><a href="https://www.heartflow.com/heartflow-one/ffrct-analysis/" target="_blank" rel="noreferrer">FFR₍CT₎ <ExternalLink size={11} /></a><a href="https://www.heartflow.com/heartflow-one/roadmap/" target="_blank" rel="noreferrer">Roadmap <ExternalLink size={11} /></a><a href="https://www.heartflow.com/heartflow-one/plaque/" target="_blank" rel="noreferrer">Plaque <ExternalLink size={11} /></a><a href="https://www.heartflow.com/heartflow-one/plaque-staging/" target="_blank" rel="noreferrer">Plaque Staging <ExternalLink size={11} /></a><a href="https://www.heartflow.com/heartflow-one/pci-navigator/" target="_blank" rel="noreferrer">PCI Navigator <ExternalLink size={11} /></a></div>
    </section>
  )
}
