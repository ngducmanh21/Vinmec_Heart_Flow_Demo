import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ScanLine } from 'lucide-react'

type Slice = {
  file: string
  index: number
  rawZ?: number
}

type SliceManifest = Slice[] | { slices: Slice[]; defaultSlice?: number; dimensions?: number[]; origin?: number[]; spacing?: number[] }

const base = '/vmr-0225/'

export default function MRViewer() {
  const [slices, setSlices] = useState<Slice[]>([])
  const [selected, setSelected] = useState(0)
  const [error, setError] = useState(false)

  useEffect(() => {
    let live = true
    fetch(`${base}slices.json`)
      .then(response => {
        if (!response.ok) throw new Error('MR slice manifest unavailable')
        return response.json() as Promise<SliceManifest>
      })
      .then(manifest => {
        if (!live) return
        const items = Array.isArray(manifest) ? manifest : manifest.slices
        if (!Array.isArray(items) || items.length === 0) throw new Error('No MR slices')
        setSlices(items)
        const requested = Array.isArray(manifest) ? undefined : manifest.defaultSlice
        const requestedPosition = items.findIndex(item => item.index === requested)
        setSelected(requestedPosition >= 0 ? requestedPosition : Math.floor(items.length / 2))
      })
      .catch(() => { if (live) setError(true) })
    return () => { live = false }
  }, [])

  const current = slices[selected]
  const imageUrl = current && (current.file.startsWith('/') ? current.file : `${base}${current.file}`)
  const position = current?.rawZ

  return <div className="mr-viewer">
    <div className="mr-frame">
      {current && <img src={imageUrl} alt={`Lát MR nguồn số ${current.index} của ca 0225_H_AO_COA`} />}
      {!current && <div className="viewer-loading">{error ? 'Không tải được lát MR' : 'Đang tải ảnh MR…'}</div>}
      <div className="mr-frame-top"><ScanLine size={15}/><span>MR · 0225_H_AO_COA</span><b>AXIAL SOURCE IMAGE</b></div>
      {current && <div className="mr-frame-bottom"><span>SLICE {current.index}</span><span>{typeof position === 'number' ? `z ${position.toFixed(2)} · tọa độ ảnh` : 'Ảnh MR nguồn'}</span></div>}
    </div>
    <div className="mr-controls">
      <button type="button" aria-label="Lát trước" disabled={selected === 0 || !slices.length} onClick={() => setSelected(value => value - 1)}><ChevronLeft size={17}/></button>
      <div className="mr-slider"><div className="mr-slider-label"><strong>Duyệt lát MR</strong><span>{slices.length ? `${selected + 1} / ${slices.length} lát trích` : '—'}</span></div><input aria-label="Chọn lát MR" type="range" min="0" max={Math.max(0, slices.length - 1)} value={selected} disabled={!slices.length} onChange={event => setSelected(Number(event.target.value))}/></div>
      <button type="button" aria-label="Lát tiếp" disabled={selected >= slices.length - 1 || !slices.length} onClick={() => setSelected(value => value + 1)}><ChevronRight size={17}/></button>
    </div>
  </div>
}
