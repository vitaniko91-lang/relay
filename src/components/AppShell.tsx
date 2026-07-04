import type { ReactNode } from 'react'
import { Sidebar, MobileNav } from './Sidebar'
import { Icon } from './Icon'
import { NodeField } from './NodeField'
import type { Route } from '../lib/useHashRoute'
import { useLive } from '../lib/live'
import { CountUp } from './motion'

function LiveBadge({ count }: { count: number }) {
  return (
    <span className="hidden items-center gap-2 rounded-chip border border-line bg-bg-raised px-2.5 py-1.5 text-xs font-medium text-ink-soft sm:inline-flex">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-run opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-run" />
      </span>
      <CountUp to={count} format={(n) => String(Math.round(n))} durationMs={500} /> running
    </span>
  )
}

/**
 * The persistent chrome: left rail (desktop), mobile top nav, a per-screen top
 * bar, and the scrolling content column. Screens supply their title + actions.
 */
export function AppShell({
  route,
  title,
  breadcrumb,
  actions,
  children,
}: {
  route: Route
  title: ReactNode
  breadcrumb?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  const live = useLive()
  const runningNow = live.runs.filter((r) => r.status === 'running').length
  return (
    <div className="relative min-h-screen">
      {/* Ambient node constellation — faint, behind all content. */}
      <NodeField className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-70" />

      <div className="relative z-10 flex min-h-screen">
        <Sidebar route={route} />

        <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav route={route} />

        <header className="sticky top-0 z-20 flex min-h-14 items-center gap-4 border-b border-line bg-bg-base/85 px-4 py-2.5 backdrop-blur md:px-6">
          <div className="min-w-0 flex-1">
            {breadcrumb}
            <h1 className="truncate text-base font-semibold tracking-tight text-ink">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <span className="hidden items-center gap-1.5 rounded-chip border border-line bg-bg-raised px-2.5 py-1.5 text-xs font-medium text-ink-soft lg:inline-flex">
              <Icon name="clock" size={13} className="text-ink-faint" />
              Last 24h
            </span>
            <LiveBadge count={runningNow} />
          </div>
        </header>

          <main className="mx-auto w-full max-w-content flex-1 px-4 py-5 md:px-6 md:py-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
