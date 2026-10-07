import { useEffect, useRef, useState, type WheelEvent } from 'react'
import ctDataUrl from './assets/vmr-p3/ct-slices.bin?url'
import metadata from './assets/vmr-p3/ct-slices.json'
import contours from './assets/vmr-p3/ct-contours.json'

const size = 512
const slicePixels = size * size

export type CTMode = 'ct' | 'overlay' | 'mask'

export default function CTCanvas({ slice, windowWidth, onSlice, mode = 'ct', selectedPoint }: { slice: number; windowWidth: number; onSlice: (n: number) => void; mode?: CTMode; selectedPoint?: [number, number] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [volume, setVolume] = useState<Int16Array | null>(null)
  useEffect(() => {
    let active = true
    fetch(ctDataUrl).then(r => { if (!r.ok) throw new Error('CT data unavailable'); return r.arrayBuffer() }).then(buffer => {
      if (active) setVolume(new Int16Array(buffer))
    }).catch(() => { if (active) setVolume(null) })
    return () => { active = false }
  }, [])
  useEffect(() => {
    const canvas = ref.current, ctx = canvas?.getContext('2d')
    if (!ctx || !volume) return
    const image = ctx.createImageData(size, size)
    const start = slice * slicePixels, low = metadata.level - windowWidth / 2
    for (let i = 0; i < slicePixels; i++) {
      const value = Math.max(0, Math.min(255, (volume[start + i] - low) * 255 / windowWidth))
      const p = i * 4
      image.data[p] = image.data[p + 1] = image.data[p + 2] = value
      image.data[p + 3] = 255
    }
    ctx.putImageData(image, 0, 0)
  }, [volume, slice, windowWidth])
  function wheel(e: WheelEvent) { e.preventDefault(); onSlice(Math.max(0, Math.min(metadata.sliceIndices.length - 1, slice + (e.deltaY > 0 ? 1 : -1)))) }
  return <div className={`ct-image real-ct ct-mode-${mode}`} onWheel={wheel}>
    <canvas ref={ref} width={size} height={size} aria-label={`Ảnh CT thật của ca ${metadata.case}, lát ${metadata.sliceIndices[slice]}`} />
    {!volume && <div className="ct-loading">Đang tải ảnh CT cùng ca...</div>}
    <svg className="ct-annotation" viewBox="0 0 512 512" aria-hidden="true">
      <g className="ct-segmentation">{(contours.paths[slice] ?? []).map((path, i) => <path key={i} d={path} fill="#42cbd4" fillOpacity={mode === 'mask' ? .76 : .36} stroke="#ffce82" strokeWidth="1.5" fillRule="evenodd" />)}</g>
      {selectedPoint && <g className="ct-roi-marker"><circle cx={selectedPoint[0]} cy={selectedPoint[1]} r="12" fill="none" stroke="#ffce82" strokeWidth="1.7"/><circle cx={selectedPoint[0]} cy={selectedPoint[1]} r="2.5" fill="#ffce82"/><path d={`M ${selectedPoint[0]+12} ${selectedPoint[1]} h 14`} stroke="#ffce82" strokeWidth="1.4"/></g>}
    </svg>
    <span className="orientation orientation-top">A</span><span className="orientation orientation-left">R</span><span className="orientation orientation-right">L</span><span className="orientation orientation-bottom">P</span>
    <span className="ct-roi-label">{mode === 'ct' ? 'P007 · CÙNG CA' : 'P007 ∩ CT SLICE'}</span><span className="ct-slice-label">AXIAL CT · {metadata.sliceIndices[slice]} / 872</span>
  </div>
}
