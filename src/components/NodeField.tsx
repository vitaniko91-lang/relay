import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../lib/useReducedMotion'

/**
 * An ambient node constellation — the app's living background. A sparse mesh of
 * cyan nodes drifts and links to nearby neighbours, and every so often a pulse
 * of light travels along a link and makes the destination node flare: a signal
 * passed forward along a chain of agents — Relay's own idea, moving.
 *
 * Faint and painted behind opaque surfaces, so it never touches data
 * legibility. Canvas 2D, <60 nodes, a handful of pulses. Pauses when the tab is
 * hidden; renders a single static frame (no pulses) under reduced motion.
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
    let frame = 0
    type Node = { x: number; y: number; vx: number; vy: number; r: number; flare: number }
    let nodes: Node[] = []
    let pulses: { a: number; b: number; t: number; speed: number }[] = []

    const rand = (a: number, b: number) => a + Math.random() * (b - a)

    function seed() {
      const count = Math.max(14, Math.min(58, Math.round((w * h) / 26000)))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: rand(-0.12, 0.12),
        vy: rand(-0.12, 0.12),
        r: rand(0.6, 1.9),
        flare: 0,
      }))
      pulses = []
    }

    function resize() {
      w = cv!.clientWidth
      h = cv!.clientHeight
      cv!.width = Math.floor(w * dpr)
      cv!.height = Math.floor(h * dpr)
      g!.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
    }

    function spawnPulse() {
      if (pulses.length >= 5 || nodes.length < 2) return
      const a = Math.floor(Math.random() * nodes.length)
      // pick a neighbour within link range
      const near: number[] = []
      for (let b = 0; b < nodes.length; b++) {
        if (b === a) continue
        if (Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y) < LINK_DIST) near.push(b)
      }
      if (!near.length) return
      pulses.push({ a, b: near[Math.floor(Math.random() * near.length)], t: 0, speed: rand(0.012, 0.026) })
    }

    function draw(step: boolean) {
      g!.clearRect(0, 0, w, h)

      // links + node drift
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        if (step) {
          a.x += a.vx
          a.y += a.vy
          if (a.x < -20) a.x = w + 20
          if (a.x > w + 20) a.x = -20
          if (a.y < -20) a.y = h + 20
          if (a.y > h + 20) a.y = -20
          a.flare *= 0.94
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

      // pulses travelling along links
      if (step) {
        if (frame % 46 === 0) spawnPulse()
        for (let i = pulses.length - 1; i >= 0; i--) {
          const p = pulses[i]
          p.t += p.speed
          if (p.t >= 1 || !nodes[p.a] || !nodes[p.b]) {
            if (nodes[p.b]) nodes[p.b].flare = 1
            pulses.splice(i, 1)
          }
        }
      }
      for (const p of pulses) {
        const a = nodes[p.a]
        const b = nodes[p.b]
        if (!a || !b) continue
        const x = a.x + (b.x - a.x) * p.t
        const y = a.y + (b.y - a.y) * p.t
        g!.fillStyle = `rgba(34,211,238,${0.5 * (1 - Math.abs(p.t - 0.5))})`
        g!.beginPath()
        g!.arc(x, y, 1.7, 0, Math.PI * 2)
        g!.fill()
      }

      // nodes (brightened briefly when a signal arrives)
      for (const n of nodes) {
        const base = 0.16 + n.r * 0.14
        g!.fillStyle = `rgba(34,211,238,${Math.min(0.9, base + n.flare * 0.6)})`
        g!.beginPath()
        g!.arc(n.x, n.y, n.r + n.flare * 1.4, 0, Math.PI * 2)
        g!.fill()
      }
    }

    resize()
    window.addEventListener('resize', resize)

    if (reduced) {
      draw(false)
      return () => window.removeEventListener('resize', resize)
    }

    const loop = () => {
      frame++
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
