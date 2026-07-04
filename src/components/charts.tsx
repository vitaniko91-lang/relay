import { useEffect, useId, useState } from 'react'
import { cx } from '../lib/cx'
import { useReducedMotion } from '../lib/useReducedMotion'

// Hand-built SVG charts — no charting dependency. Each normalizes its series to
// a fixed viewBox and scales with the container; strokes stay crisp via
// non-scaling-stroke.

function points(values: number[], w: number, h: number, pad: number): { x: number; y: number }[] {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const innerW = w - pad * 2
  const innerH = h - pad * 2
  const step = values.length > 1 ? innerW / (values.length - 1) : 0
  return values.map((v, i) => ({
    x: pad + i * step,
    y: pad + innerH - ((v - min) / span) * innerH,
  }))
}

function toLine(pts: { x: number; y: number }[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
}

/** Compact line+area sparkline for stat cards. */
export function Sparkline({
  data,
  className,
  color = '#22D3EE',
  draw = true,
}: {
  data: number[]
  className?: string
  color?: string
  draw?: boolean
}) {
  const id = useId()
  const W = 120
  const H = 36
  const pts = points(data, W, H, 3)
  const line = toLine(pts)
  const area = pts.length ? `${line} L${pts[pts.length - 1].x.toFixed(2)} ${H} L${pts[0].x.toFixed(2)} ${H} Z` : ''
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={cx('h-9 w-full', className)} aria-hidden>
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {area && <path d={area} fill={`url(#spark-${id})`} />}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength={draw ? 1 : undefined}
        className={draw ? 'spark-draw' : undefined}
      />
    </svg>
  )
}

/** Larger runs-over-time area chart with a light baseline grid and a second
 *  (errors) overlay series. */
export function AreaChart({
  values,
  errors,
  labels,
  className,
}: {
  values: number[]
  errors?: number[]
  labels?: string[]
  className?: string
}) {
  const id = useId()
  const W = 720
  const H = 180
  const pad = 8
  const pts = points(values, W, H, pad)
  const line = toLine(pts)
  const area = pts.length ? `${line} L${pts[pts.length - 1].x.toFixed(2)} ${H - pad} L${pts[0].x.toFixed(2)} ${H - pad} Z` : ''

  // Errors share the runs scale so the overlay reads as "of these, how many failed".
  const maxV = Math.max(1, ...values)
  const errPts = errors
    ? errors.map((e, i) => ({ x: pts[i]?.x ?? 0, y: pad + (H - pad * 2) - (e / maxV) * (H - pad * 2) }))
    : []

  const gridY = [0.25, 0.5, 0.75]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={cx('h-44 w-full', className)} role="img" aria-label="Runs over the last 24 hours">
      <defs>
        <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridY.map((g) => (
        <line key={g} x1={pad} x2={W - pad} y1={pad + g * (H - pad * 2)} y2={pad + g * (H - pad * 2)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
      {area && <path d={area} fill={`url(#area-${id})`} />}
      {line && <path d={line} fill="none" stroke="#22D3EE" strokeWidth="1.75" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
      {errPts.length > 1 && <path d={toLine(errPts)} fill="none" stroke="#F87171" strokeWidth="1.4" strokeLinejoin="round" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" opacity="0.85" />}
      {labels && labels.length > 0 && (
        <g className="font-mono" fill="rgba(255,255,255,0.28)" fontSize="9">
          {labels.map((l, i) => (
            <text key={i} x={pad + (i / (labels.length - 1)) * (W - pad * 2)} y={H - 1} textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}>
              {l}
            </text>
          ))}
        </g>
      )}
    </svg>
  )
}

/** A single latency waterfall bar for the trace view — positioned by offset,
 *  width by duration, over the run's total wall time. */
export function WaterfallBar({
  offsetMs,
  durationMs,
  totalMs,
  color,
  muted = false,
  grow = false,
  delayMs = 0,
}: {
  offsetMs: number
  durationMs: number
  totalMs: number
  color: string
  muted?: boolean
  grow?: boolean
  delayMs?: number
}) {
  const reduced = useReducedMotion()
  const animates = grow && !reduced
  // Driven by state (not a CSS keyframe) so the resting value is always
  // scaleX(1) — the bar can never end up invisible if a frame is dropped.
  const [grown, setGrown] = useState(!animates)
  useEffect(() => {
    if (!animates) {
      setGrown(true)
      return
    }
    const t = setTimeout(() => setGrown(true), delayMs + 20)
    return () => clearTimeout(t)
  }, [animates, delayMs])

  const left = totalMs ? (offsetMs / totalMs) * 100 : 0
  const width = totalMs ? Math.max(1.2, (durationMs / totalMs) * 100) : 0
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
      <div
        className="absolute inset-y-0 rounded-full"
        style={{
          left: `${left}%`,
          width: `${Math.min(100 - left, width)}%`,
          background: color,
          opacity: muted ? 0.35 : 1,
          transformOrigin: 'left',
          transform: grown ? 'scaleX(1)' : 'scaleX(0)',
          transition: animates ? 'transform 0.5s cubic-bezier(0.19,1,0.22,1)' : undefined,
        }}
      />
    </div>
  )
}
