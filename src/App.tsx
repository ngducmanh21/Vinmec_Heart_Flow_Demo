import { Activity, ExternalLink, Layers3, ScanLine } from 'lucide-react'
import SlideFlow from './SlideFlow'
import vinUniversityLogo from './assets/vinuniversity-logo.png'
import './FeatureNavigation.css'

export default function App() {
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><img src={vinUniversityLogo} alt="VinUniversity"/><div><strong>CardioFlow <em>Lab</em></strong><small>IMAGE → MODEL → FLOW → EVIDENCE</small></div></div><div className="header-case"><span>CA NGUỒN</span><strong>0225_H_AO_COA</strong></div><a className="reset-button" href="#flow-top"><ScanLine size={15}/> Xem flow</a></header>
    <nav className="demo-section-nav" aria-label="Đi đến khu demo">
      <a href="#flow-top"><ScanLine size={16} /> Ca nguồn 0225</a>
      <a href="#slide-lab"><Layers3 size={16} /> Ảnh & CFD</a>
      <a href="#coronary-suite"><Activity size={16} /> Mạch vành giả lập</a>
    </nav>
    <main id="flow-top"><SlideFlow/><footer><div><strong>CardioFlow Lab</strong><span> · VinUniversity · Research prototype</span></div><div><a href="https://purl.stanford.edu/rm095dp9056" target="_blank" rel="noreferrer">VMR case source <ExternalLink size={12}/></a><a href="/vmr-0225/LICENSE.txt" target="_blank" rel="noreferrer">License</a><a href="/vmr-0225/README-COPYRIGHT" target="_blank" rel="noreferrer">Copyright</a></div></footer></main>
  </div>
}
