import type { RunStatus, StepKind, StepStatus } from '../data/types'
import { Icon, type IconName } from './Icon'
import { cx } from '../lib/cx'

// Single source of truth for how a status or step-kind is shown. Status is
// never conveyed by color alone — every badge pairs an icon + a label + color.

interface StatusMeta {
  label: string
  icon: IconName
  text: string // text color
  bg: string // tinted chip background
  ring: string // border tint
  dot: string // solid dot color (bg utility)
}

export const RUN_STATUS_META: Record<RunStatus, StatusMeta> = {
  success: { label: 'Success', icon: 'check', text: 'text-ok', bg: 'bg-ok/10', ring: 'ring-ok/25', dot: 'bg-ok' },
  error: { label: 'Error', icon: 'x', text: 'text-err', bg: 'bg-err/10', ring: 'ring-err/25', dot: 'bg-err' },
  timeout: { label: 'Timeout', icon: 'clock', text: 'text-warn', bg: 'bg-warn/10', ring: 'ring-warn/25', dot: 'bg-warn' },
  running: { label: 'Running', icon: 'loader', text: 'text-run', bg: 'bg-run/10', ring: 'ring-run/25', dot: 'bg-run' },
}

export const STEP_KIND_META: Record<StepKind, { label: string; icon: IconName; text: string; bg: string }> = {
  router: { label: 'Router', icon: 'router', text: 'text-ink-soft', bg: 'bg-white/[0.05]' },
  retrieval: { label: 'Retrieval', icon: 'retrieval', text: 'text-run', bg: 'bg-run/10' },
  llm: { label: 'LLM', icon: 'llm', text: 'text-accent', bg: 'bg-accent/10' },
  tool: { label: 'Tool', icon: 'tool', text: 'text-warn', bg: 'bg-warn/10' },
  guard: { label: 'Guard', icon: 'guard', text: 'text-ok', bg: 'bg-ok/10' },
}

/** A solid status dot — the compact status marker for dense rows. */
export function StatusDot({ status, className }: { status: RunStatus; className?: string }) {
  const m = RUN_STATUS_META[status]
  return (
    <span className={cx('inline-flex h-2 w-2 shrink-0 rounded-full', m.dot, status === 'running' && 'animate-pulse motion-reduce:animate-none', className)} title={m.label} />
  )
}

/** The full status pill: icon + label + tinted background. */
export function StatusBadge({ status, size = 'md' }: { status: RunStatus; size?: 'sm' | 'md' }) {
  const m = RUN_STATUS_META[status]
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-chip font-medium ring-1 ring-inset',
        m.text,
        m.bg,
        m.ring,
        size === 'sm' ? 'px-1.5 py-0.5 text-2xs' : 'px-2 py-1 text-xs',
      )}
    >
      <Icon name={m.icon} size={size === 'sm' ? 11 : 13} />
      {m.label}
    </span>
  )
}

/** A tinted square holding the step-kind glyph, used down the trace rail. */
export function StepKindBadge({ kind, muted = false }: { kind: StepKind; muted?: boolean }) {
  const m = STEP_KIND_META[kind]
  return (
    <span className={cx('inline-flex h-7 w-7 items-center justify-center rounded-control', muted ? 'bg-white/[0.03] text-ink-dim' : cx(m.bg, m.text))}>
      <Icon name={m.icon} size={15} />
    </span>
  )
}

export const STEP_STATUS_META: Record<StepStatus, { text: string; icon: IconName | null }> = {
  ok: { text: 'text-ok', icon: 'check' },
  error: { text: 'text-err', icon: 'x' },
  skipped: { text: 'text-ink-dim', icon: null },
}

/** Raw hex per step kind — for the SVG waterfall bars, which take a color string. */
export const STEP_KIND_HEX: Record<StepKind, string> = {
  router: '#9AA3B2',
  retrieval: '#38BDF8',
  llm: '#22D3EE',
  tool: '#FBBF24',
  guard: '#34D399',
}
