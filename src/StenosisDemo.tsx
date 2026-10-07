import { Activity, AlertTriangle, ExternalLink, Info, Pause, Play, RotateCcw, SlidersHorizontal, Waves } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import './StenosisDemo.css'

type LaneProps = {
  y: number
  severity: number
  label: string
  detail: string
  highlighted?: boolean
  paused: boolean
}

function vesselPath(y: number, severity: number) {
  const neck = 38 - severity * 0.22
  return [
    `M 42 ${y - 39}`,
    `C 154 ${y - 39} 260 ${y - 39} 340 ${y - neck}`,
    `C 374 ${y - neck} 426 ${y - neck} 460 ${y - 39}`,
    `C 548 ${y - 39} 654 ${y - 39} 758 ${y - 39}`,
    `L 758 ${y + 39}`,
    `C 654 ${y + 39} 548 ${y + 39} 460 ${y + 39}`,
    `C 426 ${y + neck} 374 ${y + neck} 340 ${y + neck}`,
    `C 260 ${y + 39} 154 ${y + 39} 42 ${y + 39}`,
    'Z',
  ].join(' ')
}

function centerlinePath(y: number) {
  return `M 42 ${y} C 180 ${y} 260 ${y} 340 ${y} C 374 ${y} 426 ${y} 460 ${y} C 564 ${y} 660 ${y} 758 ${y}`
}

function FlowLane({ y, severity, label, detail, highlighted = false, paused }: LaneProps) {
  const path = useMemo(() => vesselPath(y, severity), [severity, y])
  const flowPath = useMemo(() => centerlinePath(y), [y])
  const neck = 38 - severity * 0.22
  const particleDelays = ['0s', '-.72s', '-1.44s', '-2.16s', '-2.88s', '-3.6s']

  return (
    <g className={`stenosis-demo__lane${highlighted ? ' is-highlighted' : ''}`}>
      <text x="42" y={y - 58} className="stenosis-demo__lane-label">{label}</text>
      <text x="758" y={y - 58} textAnchor="end" className="stenosis-demo__lane-detail">{detail}</text>
      <path d={path} className="stenosis-demo__vessel" />
      <path d={path} className="stenosis-demo__vessel-edge" />
      <path d={flowPath} className="stenosis-demo__flow-rail" />
      {highlighted && severity > 4 && (
        <>
          <path d={`M 334 ${y - 48} C 366 ${y - 62} 434 ${y - 62} 466 ${y - 48} L 466 ${y + 48} C 434 ${y + 62} 366 ${y + 62} 334 ${y + 48} Z`} className="stenosis-demo__focus-ring" />
          <path d={`M 342 ${y - 47} C 372 ${y - 47} 428 ${y - 47} 458 ${y - 47}`} className="stenosis-demo__focus-line" />
          <text x="400" y={y - neck - 14} textAnchor="middle" className="stenosis-demo__focus-label">ĐOẠN HẸP</text>
        </>
      )}
      {particleDelays.map((begin, index) => (
        <circle key={`${y}-${begin}`} r={index % 2 === 0 ? 4.5 : 3.2} className="stenosis-demo__particle">
          {!paused && <animateMotion dur={`${highlighted ? 3.7 + severity * 0.012 : 2.7}s`} begin={begin} repeatCount="indefinite" path={flowPath} />}
        </circle>
      ))}
      <path d={flowPath} className="stenosis-demo__flow-arrow" markerMid="url(#stenosis-arrow)" />
      <text x="42" y={y + 61} className="stenosis-demo__lane-foot">ĐẦU VÀO</text>
      <text x="758" y={y + 61} textAnchor="end" className="stenosis-demo__lane-foot">HẠ LƯU</text>
    </g>
  )
}

function FlowDiagram({ severity, paused }: { severity: number; paused: boolean }) {
  return (
    <svg className="stenosis-demo__diagram" viewBox="0 0 800 430" role="img" aria-labelledby="stenosis-diagram-title stenosis-diagram-desc">
      <title id="stenosis-diagram-title">So sánh dòng chảy qua mạch bình thường và đoạn hẹp</title>
      <desc id="stenosis-diagram-desc">Hai mặt cắt mạch dạng minh họa. Hạt dòng chảy chuyển động từ đầu vào qua hạ lưu; đoạn hẹp ở hàng dưới thay đổi theo thanh điều khiển.</desc>
      <defs>
        <linearGradient id="stenosis-vessel-normal" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#164657" />
          <stop offset="0.5" stopColor="#155b68" />
          <stop offset="1" stopColor="#123e51" />
        </linearGradient>
        <linearGradient id="stenosis-vessel-narrow" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#153f51" />
          <stop offset="0.46" stopColor="#264961" />
          <stop offset="0.52" stopColor="#6c4d45" />
          <stop offset="0.58" stopColor="#264961" />
          <stop offset="1" stopColor="#10394d" />
        </linearGradient>
        <filter id="stenosis-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <marker id="stenosis-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#78d6d1" opacity=".45" />
        </marker>
      </defs>
      <rect x="0" y="0" width="800" height="430" rx="12" className="stenosis-demo__diagram-bg" />
      <line x1="42" y1="207" x2="758" y2="207" className="stenosis-demo__divider" />
      <FlowLane y={112} severity={0} label="01 / MẠCH THAM CHIẾU" detail="tiết diện đều · dòng ổn định" paused={paused} />
      <FlowLane y={313} severity={severity} label="02 / QUA ĐOẠN HẸP" detail={`mức hẹp mô hình · ${Math.round(severity)}%`} highlighted paused={paused} />
      <text x="42" y="27" className="stenosis-demo__diagram-kicker">DÒNG CHẢY DỌC THEO TRỤC MẠCH</text>
      <text x="758" y="27" textAnchor="end" className="stenosis-demo__diagram-kicker">MẶT CẮT MINH HỌA</text>
    </svg>
  )
}

function PressureBar({ label, value, tone }: { label: string; value: number; tone: 'upstream' | 'downstream' }) {
  return (
    <div className="stenosis-demo__pressure-item">
      <div className="stenosis-demo__pressure-heading"><span>{label}</span><strong>{value}%</strong></div>
      <div className="stenosis-demo__pressure-track" aria-hidden="true"><span className={`is-${tone}`} style={{ width: `${value}%` }} /></div>
    </div>
  )
}

export default function StenosisDemo() {
  const sliderId = useId()
  const [severity, setSeverity] = useState(48)
  const [paused, setPaused] = useState(false)
  const crossSection = Math.round(100 - severity * 0.58)
  const visualDrop = Math.round(severity * 0.43)
  const downstreamPressure = 100 - visualDrop

  const reset = () => setSeverity(48)

  return (
    <section className="stenosis-demo" aria-labelledby="stenosis-demo-title">
      <header className="stenosis-demo__hero">
        <div>
          <div className="stenosis-demo__eyebrow"><span /><Activity size={13} /> SLIDE 47 · HẸP MẠCH VÀNH</div>
          <h2 id="stenosis-demo-title">Một đoạn hẹp làm thay đổi dòng chảy ra sao?</h2>
          <p>Điều chỉnh mức hẹp để xem mô hình định tính mô tả dòng chảy và áp lực tương đối trước và sau đoạn hẹp.</p>
        </div>
        <div className="stenosis-demo__hero-mark"><Waves size={20} /><span>FLOW<br />LAB</span></div>
      </header>

      <div className="stenosis-demo__notice">
        <Info size={15} aria-hidden="true" />
        <span>Minh họa khái niệm, không tính FFR, không phải ca 0225. Các tỷ lệ hiển thị là thang quy ước của mô hình tương tác.</span>
      </div>

      <div className="stenosis-demo__workspace">
        <div className="stenosis-demo__visual-card">
          <div className="stenosis-demo__card-head">
            <div><span className="stenosis-demo__live-dot" /><strong>SO SÁNH DÒNG CHẢY</strong><span className="stenosis-demo__muted">· qualitative model</span></div>
            <button type="button" className="stenosis-demo__motion-button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>
              {paused ? <Play size={13} /> : <Pause size={13} />} {paused ? 'Phát dòng' : 'Tạm dừng'}
            </button>
          </div>
          <div className="stenosis-demo__canvas"><FlowDiagram severity={severity} paused={paused} /></div>
          <div className="stenosis-demo__legend" aria-label="Chú giải">
            <span><i className="is-flow" /> Hạt dòng chảy</span><span><i className="is-focus" /> Vùng hẹp đang điều chỉnh</span><span><i className="is-rail" /> Trục dòng tham chiếu</span>
          </div>
        </div>

        <aside className="stenosis-demo__controls" aria-label="Điều khiển mô hình hẹp mạch">
          <div className="stenosis-demo__panel-kicker"><SlidersHorizontal size={14} /> THAM SỐ MINH HỌA</div>
          <div className="stenosis-demo__control-title"><h3>Mức hẹp</h3><output htmlFor={sliderId}>{Math.round(severity)}%</output></div>
          <label className="stenosis-demo__range-label" htmlFor={sliderId}>Kéo để thay đổi khẩu kính tương đối</label>
          <input id={sliderId} className="stenosis-demo__range" type="range" min="0" max="80" step="1" value={severity} onChange={(event) => setSeverity(Number(event.target.value))} aria-describedby={`${sliderId}-hint`} />
          <div className="stenosis-demo__range-scale"><span>0 · đều</span><span>80 · hẹp hơn</span></div>
          <p id={`${sliderId}-hint`} className="stenosis-demo__range-hint">Giá trị này chỉ điều khiển hình dạng và chuyển động. Không có phương trình dòng chảy hay CFD nào được giải.</p>

          <div className="stenosis-demo__control-actions"><button type="button" onClick={reset}><RotateCcw size={13} /> Đặt lại</button><span>{paused ? 'Chuyển động đang dừng' : 'Chuyển động đang phát'}</span></div>

          <div className="stenosis-demo__metric-grid">
            <div><span>Tiết diện quy ước</span><strong>{crossSection}%</strong><small>so với đoạn đều</small></div>
            <div><span>Thang giảm áp minh họa</span><strong>{visualDrop}%</strong><small>ánh xạ quy ước từ slider</small></div>
          </div>

          <div className="stenosis-demo__pressure-card">
            <div className="stenosis-demo__pressure-title"><span>ÁP LỰC MINH HỌA</span><strong>đầu vào quy ước = 100%</strong></div>
            <PressureBar label="Trước đoạn hẹp" value={100} tone="upstream" />
            <PressureBar label="Sau đoạn hẹp" value={downstreamPressure} tone="downstream" />
            <p>Thanh màu là ánh xạ quy ước từ slider; không giải phương trình dòng chảy và không phải số đo bệnh nhân.</p>
          </div>

          <div className="stenosis-demo__source"><span>NỀN TẢNG THAM KHẢO</span><a href="https://doi.org/10.1016/j.jcmg.2018.01.019" target="_blank" rel="noreferrer">Gosling et al. · JACC Cardiovasc Imaging <ExternalLink size={12} /></a></div>
        </aside>
      </div>

      <footer className="stenosis-demo__footer"><AlertTriangle size={14} /><span>Đây là mô phỏng giáo dục dựa trên ý tưởng trong slide 47. Không dùng để chẩn đoán, phân tầng nguy cơ hoặc quyết định điều trị.</span></footer>
    </section>
  )
}
