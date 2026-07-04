import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useReducedMotion } from '../lib/useReducedMotion'
import { cx } from '../lib/cx'

/**
 * A gentle entrance: fade + short rise, once, on mount, via the CSS `fade-up`
 * animation (no motion library — keeps the bundle tiny). `delay` staggers a
 * screen's blocks into a calm "boot up". Reduced motion renders plainly (the
 * animation is also disabled in index.css).
 */
export function Appear({ delay = 0, className, children }: { delay?: number; className?: string; children: ReactNode }) {
  const reduced = useReducedMotion()
  return (
    <div className={cx(className, !reduced && 'animate-fade-up')} style={reduced ? undefined : { animationDelay: `${delay}s` }}>
      {children}
    </div>
  )
}

/**
 * Counts a number up from zero on mount (ease-out), then formats it — the
 * "coming alive" motion for dashboard metrics. Reduced motion shows the final
 * value immediately.
 */
export function CountUp({ to, format, durationMs = 900 }: { to: number; format: (n: number) => string; durationMs?: number }) {
  const reduced = useReducedMotion()
  const [value, setValue] = useState(reduced ? to : 0)
  const raf = useRef(0)

  useEffect(() => {
    if (reduced) {
      setValue(to)
      return
    }
    let start = 0
    const step = (t: number) => {
      if (!start) start = t
      const p = Math.min(1, (t - start) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(to * eased)
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [to, durationMs, reduced])

  return <>{format(value)}</>
}
