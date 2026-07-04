import { cx } from '../lib/cx'

/** The Relay mark — a signal passed forward along a chain. */
export function LogoMark({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <rect x="0.5" y="0.5" width="31" height="31" rx="6.5" fill="#0F1520" stroke="rgba(34,211,238,0.28)" />
      <circle cx="9" cy="16" r="2.6" fill="#22D3EE" />
      <path d="M15 11L20 16L15 21" stroke="#22D3EE" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.5 11L25.5 16L20.5 21" stroke="#67E8F9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cx('flex items-center gap-2.5', className)}>
      <LogoMark size={26} />
      <span className="text-[0.95rem] font-semibold tracking-tight text-ink">
        Relay
        <span className="ml-1 align-middle text-2xs font-medium uppercase tracking-[0.14em] text-ink-dim">obs</span>
      </span>
    </div>
  )
}
