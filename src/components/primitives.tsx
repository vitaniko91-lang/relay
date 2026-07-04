import type { ReactNode, SelectHTMLAttributes } from 'react'
import { Icon, type IconName } from './Icon'
import { cx } from '../lib/cx'

// Small shared UI atoms used across every screen. Kept together because each is
// only a few lines; the surface they share (hairline borders, square-ish
// corners, dark surfaces) is the point.

/** A raised surface panel with a hairline border. The base container. */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-card border border-line bg-bg-raised', className)}>{children}</div>
}

/** Monospace ID / code chip. */
export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('font-mono text-[0.8em] tracking-tight', className)}>{children}</span>
}

/** A neutral tag/label chip. */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center rounded-chip border border-line px-1.5 py-0.5 text-2xs font-medium text-ink-soft', className)}>
      {children}
    </span>
  )
}

/** Keyboard key cap, e.g. for shortcut hints. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.3rem] items-center justify-center rounded border border-line bg-bg-overlay px-1 py-0.5 font-mono text-2xs text-ink-soft">
      {children}
    </kbd>
  )
}

/** Uppercase micro-label used above values and section headers. */
export function Overline({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('text-2xs font-semibold uppercase tracking-[0.14em] text-ink-faint', className)}>{children}</div>
}

/** Shimmering placeholder block for loading states. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cx('relative overflow-hidden rounded bg-white/[0.04]', className)}>
      <div className="animate-shimmer shimmer-mask absolute inset-0 -translate-x-full" />
    </div>
  )
}

/** Empty-state / error-state block. */
export function StateBlock({
  icon,
  title,
  hint,
  tone = 'neutral',
  action,
}: {
  icon: IconName
  title: string
  hint?: string
  tone?: 'neutral' | 'error'
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span
        className={cx(
          'inline-flex h-11 w-11 items-center justify-center rounded-full',
          tone === 'error' ? 'bg-err/10 text-err' : 'bg-white/[0.04] text-ink-faint',
        )}
      >
        <Icon name={icon} size={20} />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        {hint && <p className="max-w-xs text-xs text-ink-faint">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

/** Styled native select — accessible, keyboard-native, with a chevron. */
export function Select({
  icon,
  className,
  children,
  ...props
}: { icon?: IconName } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cx('relative inline-flex items-center', className)}>
      {icon && <Icon name={icon} size={13} className="pointer-events-none absolute left-2.5 text-ink-faint" />}
      <select
        {...props}
        className={cx(
          'h-8 appearance-none rounded-control border border-line bg-bg-raised py-0 pr-7 text-xs font-medium text-ink-soft',
          'hover:border-line-strong hover:text-ink focus-visible:border-accent/50',
          'cursor-pointer transition-colors [color-scheme:dark]',
          icon ? 'pl-7' : 'pl-2.5',
        )}
      >
        {children}
      </select>
      <Icon name="chevronDown" size={13} className="pointer-events-none absolute right-2 text-ink-faint" />
    </div>
  )
}
