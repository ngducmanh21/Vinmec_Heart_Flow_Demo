import { useEffect, useMemo, useRef, useState } from 'react'
import { Gauge, Info, Pause, Play, RotateCcw } from 'lucide-react'
import './SimulationVideo.css'

export type SimulationFrame = {
  step: number
  physical_time_s: number
  pressure_surface_min_max_mmHg: [number, number]
  pressure_colour_range_mmHg: [number, number]
  speed_max_cm_s: number
  speed_colour_range_cm_s: [number, number]
  streamline_count?: number
}

export type SimulationMetadata = {
  dt_s: number
  fps: number
  width: number
  height: number
  frame_local_colour_scales: boolean
  pressure_scale_mode: string
  speed_scale_mode: string
  scaling_method: string
  constant_field_note?: string
  frames: SimulationFrame[]
}

export type SimulationVideoProps = {
  /** Use this to pause the player when the parent view is not the active stage. */
  active?: boolean
  /** Optional override for the bundled MP4. */
  videoSrc?: string
  /** Optional override for the bundled frame metadata. */
  metadataSrc?: string
  /** Pass metadata directly when the parent already has it loaded. */
  metadata?: SimulationMetadata
  posterSrc?: string
  title?: string
  className?: string
  autoPlay?: boolean
}

const DEFAULT_VIDEO_SRC = '/vmr-0225/coa_step0_to31600_pressure_0_6mmHg.mp4'
const DEFAULT_METADATA_SRC = '/vmr-0225/coa_step0_to31600_pressure_0_6mmHg.frames.json'
const DEFAULT_POSTER_SRC = '/vmr-0225/coa_step0_to31600_pressure_0_6mmHg-poster.jpg'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function frameIndexForMediaTime(mediaTime: number, duration: number, metadata: SimulationMetadata) {
  const frameCount = metadata.frames.length
  if (!frameCount) return 0

  // The MP4 is intentionally slowed to 16 s while the saved CFD frames represent
  // 3.95 s. Mapping by the media duration keeps this correct if a browser reports
  // a slightly different container duration while preserving the 5 fps frame order.
  const rawIndex = duration > 0
    ? (mediaTime / duration) * frameCount
    : mediaTime * metadata.fps
  return clamp(Math.floor(rawIndex), 0, frameCount - 1)
}

function formatSeconds(value: number, digits = 2) {
  return `${value.toFixed(digits)} s`
}

function formatNumber(value: number, digits = 2) {
  return value.toFixed(digits)
}

function formatRange(range: [number, number], unit: string, digits = 2) {
  return `${formatNumber(range[0], digits)}–${formatNumber(range[1], digits)} ${unit}`
}

function readMetadata(payload: unknown): SimulationMetadata | null {
  if (!payload || typeof payload !== 'object') return null
  const candidate = payload as Partial<SimulationMetadata>
  if (!Array.isArray(candidate.frames) || candidate.frames.length === 0) return null
  if (typeof candidate.fps !== 'number' || !Number.isFinite(candidate.fps)) return null
  return candidate as SimulationMetadata
}

export default function SimulationVideo({
  active = true,
  videoSrc = DEFAULT_VIDEO_SRC,
  metadataSrc = DEFAULT_METADATA_SRC,
  metadata,
  posterSrc = DEFAULT_POSTER_SRC,
  title = 'Dòng chảy qua vùng hẹp động mạch chủ',
  className = '',
  autoPlay = false,
}: SimulationVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [loadedMetadata, setLoadedMetadata] = useState<SimulationMetadata | null>(metadata ?? null)
  const [metadataError, setMetadataError] = useState<string | null>(null)
  const [videoError, setVideoError] = useState(false)
  const [mediaTime, setMediaTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [frameIndex, setFrameIndex] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (metadata) {
      setLoadedMetadata(metadata)
      setMetadataError(null)
      return
    }

    const controller = new AbortController()
    setLoadedMetadata(null)
    setMetadataError(null)

    fetch(metadataSrc, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`Metadata request failed (${response.status})`)
        return response.json() as Promise<unknown>
      })
      .then(payload => {
        const nextMetadata = readMetadata(payload)
        if (!nextMetadata) throw new Error('Frame metadata is missing or invalid')
        setLoadedMetadata(nextMetadata)
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setMetadataError(error instanceof Error ? error.message : 'Unable to load frame metadata')
      })

    return () => controller.abort()
  }, [metadata, metadataSrc])

  useEffect(() => {
    if (!active) {
      videoRef.current?.pause()
      setPlaying(false)
    }
  }, [active])

  const fallbackDuration = loadedMetadata?.frames.length && loadedMetadata.fps
    ? loadedMetadata.frames.length / loadedMetadata.fps
    : 16
  const mediaDuration = duration > 0 ? duration : fallbackDuration
  const currentFrame = loadedMetadata?.frames[frameIndex]
  const frameCount = loadedMetadata?.frames.length ?? 0

  useEffect(() => {
    if (!loadedMetadata) return
    setFrameIndex(frameIndexForMediaTime(mediaTime, mediaDuration, loadedMetadata))
  }, [loadedMetadata, mediaDuration, mediaTime])

  const displayDuration = useMemo(() => {
    if (!loadedMetadata?.frames.length) return '—'
    return formatSeconds(loadedMetadata.frames[loadedMetadata.frames.length - 1].physical_time_s)
  }, [loadedMetadata])

  function syncTime(nextTime: number) {
    const safeTime = clamp(nextTime, 0, mediaDuration)
    setMediaTime(safeTime)
    if (loadedMetadata) setFrameIndex(frameIndexForMediaTime(safeTime, mediaDuration, loadedMetadata))
  }

  async function togglePlayback() {
    const video = videoRef.current
    if (!video) return
    if (video.paused || video.ended) {
      if (video.ended) video.currentTime = 0
      try {
        await video.play()
      } catch {
        // Browser autoplay policy can reject a play request; the user can try again.
      }
    } else {
      video.pause()
    }
  }

  function resetPlayback() {
    const video = videoRef.current
    if (!video) return
    video.pause()
    video.currentTime = 0
    syncTime(0)
  }

  function seekTo(nextTime: number) {
    const video = videoRef.current
    if (video) video.currentTime = nextTime
    syncTime(nextTime)
  }

  const rootClassName = `simulation-video ${className}`.trim()
  const pressureRange = currentFrame?.pressure_surface_min_max_mmHg ?? [0, 0]
  const pressureScale = currentFrame?.pressure_colour_range_mmHg ?? [0, 6]
  const speedScale = currentFrame?.speed_colour_range_cm_s ?? [0, 0]
  const speedMax = currentFrame?.speed_max_cm_s ?? 0

  return (
    <section className={rootClassName} aria-label="Video mô phỏng dòng chảy">
      <div className="simulation-video__main">
        <div className="simulation-video__heading">
          <div>
            <div className="simulation-video__eyebrow"><span /> CFD DEMO · 80 FRAME · 5 FPS</div>
            <h2>{title}</h2>
            <p>Áp suất bề mặt ở bên trái · đường dòng vận tốc tức thời ở bên phải</p>
          </div>
          <div className="simulation-video__status"><b /> RESEARCH DEMO</div>
        </div>

        <div className="simulation-video__player-shell">
          <video
            ref={videoRef}
            className="simulation-video__player"
            src={videoSrc}
            poster={posterSrc}
            muted
            playsInline
            preload="metadata"
            autoPlay={autoPlay && active}
            onLoadedMetadata={event => {
              const nextDuration = Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0
              setDuration(nextDuration)
              syncTime(event.currentTarget.currentTime)
            }}
            onTimeUpdate={event => syncTime(event.currentTarget.currentTime)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => {
              setPlaying(false)
              syncTime(mediaDuration)
            }}
            onError={() => setVideoError(true)}
            aria-label="Video mô phỏng áp suất bề mặt và đường dòng vận tốc"
          />
          <div className="simulation-video__player-label">
            <span className="simulation-video__live-dot" />
            <span>PRESSURE SURFACE</span>
            <i />
            <span>VELOCITY STREAMLINES</span>
          </div>
          {videoError && <div className="simulation-video__error">Không thể tải video mô phỏng.</div>}
        </div>

        <div className="simulation-video__controls">
          <div className="simulation-video__control-row">
            <button type="button" className="simulation-video__control-button simulation-video__play-button" onClick={() => void togglePlayback()} aria-label={playing ? 'Tạm dừng video' : 'Phát video'}>
              {playing ? <Pause size={15} /> : <Play size={15} />}
              <span>{playing ? 'Tạm dừng' : 'Phát video'}</span>
            </button>
            <button type="button" className="simulation-video__icon-button" onClick={resetPlayback} aria-label="Về đầu video" title="Về đầu video">
              <RotateCcw size={15} />
            </button>
            <span className="simulation-video__media-time">{formatSeconds(mediaTime)} <b>/</b> {formatSeconds(mediaDuration)}</span>
          </div>
          <label className="simulation-video__timeline-label" htmlFor="simulation-video-timeline">Scrub video</label>
          <input
            id="simulation-video-timeline"
            className="simulation-video__timeline"
            type="range"
            min="0"
            max={mediaDuration}
            step="0.01"
            value={Math.min(mediaTime, mediaDuration)}
            onChange={event => seekTo(Number(event.currentTarget.value))}
            aria-label="Tua video mô phỏng"
          />
          <div className="simulation-video__timeline-foot">
            <span>Playback chậm để quan sát</span>
            <span>{frameCount ? `${frameIndex + 1} / ${frameCount} saved frames` : 'Đang tải frame metadata…'}</span>
          </div>
        </div>
      </div>

      <aside className="simulation-video__side">
        <div className="simulation-video__frame-card">
          <div className="simulation-video__eyebrow">FRAME READOUT</div>
          <div className="simulation-video__frame-time">{currentFrame ? formatSeconds(currentFrame.physical_time_s) : '—'}</div>
          <div className="simulation-video__frame-copy">Thời gian vật lý · playback dài hơn để xem chậm</div>
          <div className="simulation-video__readouts">
            <div><span>Saved step</span><strong>{currentFrame?.step.toLocaleString() ?? '—'}</strong></div>
            <div><span>Frame</span><strong>{frameCount ? `${frameIndex + 1} / ${frameCount}` : '—'}</strong></div>
          </div>
        </div>

        <div className="simulation-video__metric-card">
          <div className="simulation-video__metric-heading"><span className="simulation-video__metric-dot simulation-video__metric-dot--pressure" /><span>Pressure surface</span><strong>{formatRange(pressureRange, 'mmHg')}</strong></div>
          <div className="simulation-video__metric-note">Giá trị min–max thực của frame hiện tại</div>
          <div className="simulation-video__scale simulation-video__scale--pressure"><div /><span>{formatNumber(pressureScale[0])}</span><span>{formatNumber(pressureScale[1])} mmHg</span></div>
          <div className="simulation-video__scale-note">Thang màu cố định 0–6 mmHg; giá trị ngoài khoảng này được bão hòa màu.</div>
        </div>

        <div className="simulation-video__metric-card">
          <div className="simulation-video__metric-heading"><span className="simulation-video__metric-dot simulation-video__metric-dot--speed" /><span>Velocity streamlines</span><strong>{formatNumber(speedMax)} cm/s</strong></div>
          <div className="simulation-video__metric-note">Speed max của frame hiện tại</div>
          <div className="simulation-video__scale simulation-video__scale--speed"><div /><span>0</span><span>{formatNumber(speedScale[1])} cm/s</span></div>
          <div className="simulation-video__scale-note">Thang màu vận tốc thay đổi theo từng frame: 0 → frame max.</div>
        </div>

        <div className="simulation-video__metadata-card">
          <div className="simulation-video__metadata-title"><Gauge size={14} /> Frame metadata</div>
          <div><span>Temporal spacing</span><strong>{loadedMetadata?.dt_s ? `${loadedMetadata.dt_s} s / step` : '—'}</strong></div>
          <div><span>Physical interval</span><strong>0–{displayDuration}</strong></div>
          <div><span>Streamlines</span><strong>{currentFrame?.streamline_count?.toLocaleString() ?? '—'}</strong></div>
        </div>

        {(metadataError || !loadedMetadata) && <div className="simulation-video__loading-note"><Info size={14} /> {metadataError ?? 'Đang tải frame metadata…'}</div>}
        <p className="simulation-video__disclaimer">Đây là run nghiên cứu/demo nhân tạo. Các giá trị hiển thị không phải tái hiện sinh lý, xác thực lâm sàng, chẩn đoán hay khuyến nghị điều trị.</p>
      </aside>
    </section>
  )
}
