// Presentation formatters — pure, unit-tested, shared across every screen so
// numbers read consistently (durations, cost, tokens, relative time).

/** Human duration: 840ms · 2.4s · 1m 20s. */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(s < 10 ? 2 : 1)}s`
  const m = Math.floor(s / 60)
  const rem = Math.round(s % 60)
  return `${m}m ${rem}s`
}

/** USD cost with sensible precision at small magnitudes. */
export function formatCost(usd: number): string {
  if (usd === 0) return '$0'
  if (usd < 0.01) return `$${usd.toFixed(4)}`
  if (usd < 1) return `$${usd.toFixed(3)}`
  return `$${usd.toFixed(2)}`
}

/** Compact token counts: 940 · 3.2k · 1.1M. */
export function formatTokens(n: number): string {
  if (n < 1000) return `${n}`
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

/** Grouped integer, e.g. 12,480. */
export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

/** Percent with one decimal only when needed: 4% · 4.2%. */
export function formatPct(fraction: number): string {
  const pct = fraction * 100
  const rounded = Math.round(pct * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`
}

/** Coarse relative time anchored to a reference "now". */
export function relativeTime(then: number, now: number): string {
  const diff = Math.max(0, now - then)
  const s = Math.floor(diff / 1000)
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

/** Wall-clock HH:MM:SS for a timestamp (local). */
export function formatClock(epoch: number): string {
  const d = new Date(epoch)
  const p = (n: number) => `${n}`.padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
