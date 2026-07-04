import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../lib/useReducedMotion'

/**
 * An ambient node constellation — the app's one piece of living background.
 * A sparse mesh of cyan nodes drifts slowly and links to nearby neighbours,
 * echoing Relay's own idea: a signal passed forward along a chain of agents.
 *
 * Deliberately faint and painted behind opaque surfaces, so it never touches
 * data legibility — it only breathes in the page gutters and through the
 * translucent header. Canvas 2D (no WebGL), ~1 draw per frame over <60 nodes.
 * Under prefers-reduced-motion it renders a single static frame — texture, no
 * motion — and pauses entirely when the tab is hidden.
 */
export function NodeField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const g = cv.getContext('2d')
    if (!g) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const LINK_DIST = 132
    let w = 0
    let h = 0
    let raf = 0
    let nodes: { x: number; y: number; vx: number; vy: number; r: number }[] = []

    const rand = (a: number, b: number) => a + Math.random() * (b - a)

    function seed() {
      // Density scales with area, capped so large screens stay sparse.
      const count = Math.max(14, Math.min(58, Math.round((w * h) / 26000)))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: rand(-0.12, 0.12),
        vy: rand(-0.12, 0.12),
        r: rand(0.6, 1.9),
      }))
    }

    function resize() {
      w = cv!.clientWidth
      h = cv!.clientHeight
      cv!.width = Math.floor(w * dpr)
      cv!.height = Math.floor(h * dpr)
      g!.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
    }

    function draw(step: boolean) {
      g!.clearRect(0, 0, w, h)
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        if (step) {
          a.x += a.vx
          a.y += a.vy
          if (a.x < -20) a.x = w + 20
          if (a.x > w + 20) a.x = -20
          if (a.y < -20) a.y = h + 20
          if (a.y > h + 20) a.y = -20
        }
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dist = Math.hypot(a.x - b.x, a.y - b.y)
          if (dist < LINK_DIST) {
            g!.strokeStyle = `rgba(103,232,249,${(1 - dist / LINK_DIST) * 0.1})`
            g!.lineWidth = 1
            g!.beginPath()
            g!.moveTo(a.x, a.y)
            g!.lineTo(b.x, b.y)
            g!.stroke()
          }
        }
      }
      for (const n of nodes) {
        g!.fillStyle = `rgba(34,211,238,${0.16 + n.r * 0.14})`
        g!.beginPath()
        g!.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        g!.fill()
      }
    }

    resize()
    window.addEventListener('resize', resize)

    if (reduced) {
      draw(false) // one static frame — texture without motion
      return () => window.removeEventListener('resize', resize)
    }

    const loop = () => {
      draw(true)
      raf = requestAnimationFrame(loop)
    }
    const onVisibility = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', resize)
    }
  }, [reduced])

  return <canvas ref={ref} aria-hidden className={className} />
}
