import { lazy, Suspense } from 'react'
import { Activity, ArrowLeft, ArrowRight, CircleHelp, ExternalLink, FlaskConical, Layers3, ScanLine, Waves } from 'lucide-react'
import './SlideLab.css'
import { useFeatureNavigation } from './useFeatureNavigation'

const ImageStackDemo = lazy(() => import('./ImageStackDemo'))
const SimulationVideo = lazy(() => import('./SimulationVideo'))
const StenosisDemo = lazy(() => import('./StenosisDemo'))
const AneurysmDemo = lazy(() => import('./AneurysmDemo'))

const modules = [
  { key: 'image', label: 'Ảnh → mô hình', status: 'CT P-3 · ca riêng', icon: ScanLine },
  { key: 'coronal', label: 'MR coronal', status: 'Ảnh nguồn ca 0225', icon: Layers3 },
  { key: 'fields', label: 'Áp lực & vận tốc', status: 'Video ca 0225', icon: Activity },
  { key: 'questions', label: 'Câu hỏi dòng chảy', status: 'Bản đồ ứng dụng', icon: CircleHelp },
  { key: 'stenosis', label: 'Hẹp mạch', status: 'Minh họa', icon: Layers3 },
  { key: 'aneurysm', label: 'Phình mạch', status: 'Minh họa', icon: Waves },
] as const

type ModuleKey = typeof modules[number]['key']

function Questions({ onChoose }: { onChoose: (key: ModuleKey) => void }) {
  return (
    <div className="slide-lab__questions">
      <div className="slide-lab__questions-head">
        <span>BẢN ĐỒ ỨNG DỤNG</span>
        <h3>Mô hình dòng chảy sẽ giúp hỏi điều gì?</h3>
        <p>Khám phá hai câu hỏi bằng mô phỏng tương tác. So sánh điều trị và van/thiết bị vẫn là hướng phát triển, không phải kết quả của ca 0225.</p>
      </div>
      <div className="slide-lab__questions-grid">
        <button type="button" onClick={() => onChoose('stenosis')}>
          <Layers3 size={22} />
          <strong>Hẹp động mạch</strong>
          <span>Điều gì xảy ra với dòng chảy và áp lực sau chỗ hẹp?</span>
          <small>Xem minh họa <ArrowRight size={13} /></small>
        </button>
        <button type="button" onClick={() => onChoose('aneurysm')}>
          <Waves size={22} />
          <strong>Phình mạch</strong>
          <span>Hình dạng túi phình thay đổi vùng hồi lưu như thế nào?</span>
          <small>Xem minh họa <ArrowRight size={13} /></small>
        </button>
        <div className="is-future">
          <FlaskConical size={22} />
          <strong>So sánh phương án</strong>
          <span>Cần mô hình và lần chạy thay thế cho cùng một ca.</span>
          <small>HƯỚNG KẾ TIẾP</small>
        </div>
        <div className="is-future">
          <Activity size={22} />
          <strong>Van & thiết bị</strong>
          <span>Cần hình học chuyển động và kiểm chứng riêng.</span>
          <small>HƯỚNG TƯƠNG LAI</small>
        </div>
      </div>
    </div>
  )
}

export default function SlideLab() {
  const { active, select: setActive, navigationRef, workspaceRef } = useFeatureNavigation<ModuleKey>('image')
  const index = modules.findIndex(item => item.key === active)
  const current = modules[index]

  function move(delta: number) {
    setActive(modules[Math.min(modules.length - 1, Math.max(0, index + delta))].key)
  }

  return (
    <section className="slide-lab" id="slide-lab" aria-labelledby="slide-lab-title">
      <div className="slide-lab__heading">
        <div>
          <span className="slide-lab__eyebrow"><i /> KHÁM PHÁ MÔ HÌNH</span>
          <h2 id="slide-lab-title">Từ lát ảnh đến câu hỏi dòng chảy</h2>
          <p>CT P-3 thuộc <strong>một ca riêng</strong>; ảnh MR coronal và video CFD thuộc ca 0225. Hai mô hình hẹp mạch và phình mạch ở phía sau chỉ minh họa câu hỏi dòng chảy: không dùng dữ liệu của các ca này, không tính FFR và không dự đoán vỡ phình mạch.</p>
        </div>
      </div>

      <div className="slide-lab__switcher" ref={navigationRef}>
        <div className="feature-switcher-label"><strong>CHỌN GÓC XEM</strong><span>{index + 1} / {modules.length} · {current.label}</span></div>
      <nav className="slide-lab__nav" aria-label="Chọn góc xem mô phỏng">
        {modules.map(item => {
          const Icon = item.icon
          return (
            <button type="button" key={item.key} className={active === item.key ? 'is-active' : ''} aria-pressed={active === item.key} onClick={() => setActive(item.key)}>
              <Icon size={17} />
              <span><strong>{item.label}</strong><small>{item.status}</small></span>
            </button>
          )
        })}
      </nav>
      </div>

      <div className="slide-lab__workspace" ref={workspaceRef}>
        <div className="slide-lab__workspace-head">
          <div><span>{current.status.toUpperCase()}</span><h3>{current.label}</h3></div>
          <div>
            <button type="button" aria-label="Mục trước" disabled={index === 0} onClick={() => move(-1)}><ArrowLeft size={16} /></button>
            <span>{index + 1} / {modules.length}</span>
            <button type="button" aria-label="Mục tiếp" disabled={index === modules.length - 1} onClick={() => move(1)}><ArrowRight size={16} /></button>
          </div>
        </div>
        <div className="slide-lab__content">
          {active === 'image' && <Suspense fallback={<div className="slide-lab__loading">Đang tải ảnh và hình học…</div>}><ImageStackDemo /></Suspense>}
          {active === 'coronal' && <Suspense fallback={<div className="slide-lab__loading">Đang tải các lát MR coronal…</div>}><ImageStackDemo initialSource="mr-coronal" /></Suspense>}
          {active === 'fields' && <div className="slide-lab__fields">
            <div className="slide-lab__notice"><Activity size={17} /><p>Panel dưới phát <strong>video CFD đã lưu của ca 0225</strong>: áp lực bề mặt ở trái và đường dòng vận tốc ở phải. Thang màu và thông số theo metadata của video này.</p></div>
            <Suspense fallback={<div className="slide-lab__loading">Đang tải video CFD…</div>}><SimulationVideo active title="Áp lực bề mặt và đường dòng · ca 0225" /></Suspense>
          </div>}
          {active === 'questions' && <Questions onChoose={setActive} />}
          {active === 'stenosis' && <Suspense fallback={<div className="slide-lab__loading">Đang tải minh họa hẹp mạch…</div>}><StenosisDemo /></Suspense>}
          {active === 'aneurysm' && <Suspense fallback={<div className="slide-lab__loading">Đang tải minh họa phình mạch…</div>}><AneurysmDemo /></Suspense>}
        </div>
        <div className="slide-lab__footer">
          <span>{active === 'image' ? 'CT P-3 · CA RIÊNG' : active === 'coronal' ? 'MR CORONAL · CA 0225' : active === 'fields' ? 'VIDEO CA 0225' : active === 'questions' ? 'BẢN ĐỒ ỨNG DỤNG' : 'MINH HỌA ĐỊNH TÍNH'}</span>
          <div>
            <button type="button" disabled={index === 0} onClick={() => move(-1)}><ArrowLeft size={14} /> Trước</button>
            <button type="button" disabled={index === modules.length - 1} onClick={() => move(1)}>Tiếp <ArrowRight size={14} /></button>
          </div>
        </div>
      </div>
      <p className="slide-lab__source">Nguồn dữ liệu được ghi trong từng góc xem; các hình minh họa được dựng mới. <a href="https://www.heartflow.com/heartflow-one/ffrct-analysis/" target="_blank" rel="noreferrer">HeartFlow là tham khảo kiểu tương tác <ExternalLink size={12} /></a>.</p>
    </section>
  )
}
