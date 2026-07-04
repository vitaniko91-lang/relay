import { Logo, LogoMark } from './Logo'
import { Icon, type IconName } from './Icon'
import { Overline } from './primitives'
import type { Route } from '../lib/useHashRoute'
import { cx } from '../lib/cx'

interface NavDef {
  label: string
  icon: IconName
  href: string
  match: Route['name'][]
}

const PRIMARY: NavDef[] = [
  { label: 'Overview', icon: 'dashboard', href: '#/overview', match: ['overview'] },
  { label: 'Runs', icon: 'runs', href: '#/runs', match: ['runs', 'trace'] },
]

const SOON: { label: string; icon: IconName }[] = [
  { label: 'Evals', icon: 'evals' },
  { label: 'Alerts', icon: 'alerts' },
]

function NavItem({ def, active }: { def: NavDef; active: boolean }) {
  return (
    <a
      href={def.href}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'group relative flex items-center gap-2.5 rounded-control px-2.5 py-2 text-sm font-medium transition-colors',
        active ? 'bg-white/[0.055] text-ink' : 'text-ink-soft hover:bg-white/[0.03] hover:text-ink',
      )}
    >
      {active && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent" />}
      <Icon name={def.icon} size={17} className={active ? 'text-accent' : 'text-ink-faint group-hover:text-ink-soft'} />
      {def.label}
    </a>
  )
}

function isActive(def: NavDef, route: Route): boolean {
  return def.match.includes(route.name)
}

/** Desktop rail. */
export function Sidebar({ route }: { route: Route }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-line bg-bg-sink md:flex">
      <div className="flex h-14 items-center border-b border-line px-4">
        <a href="#/overview" className="rounded">
          <Logo />
        </a>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {PRIMARY.map((d) => (
          <NavItem key={d.label} def={d} active={isActive(d, route)} />
        ))}

        <div className="px-2.5 pb-1 pt-5">
          <Overline>More</Overline>
        </div>
        {SOON.map((d) => (
          <div
            key={d.label}
            aria-disabled
            title="Coming soon"
            className="flex items-center gap-2.5 rounded-control px-2.5 py-2 text-sm font-medium text-ink-dim"
          >
            <Icon name={d.icon} size={17} className="text-ink-dim" />
            {d.label}
            <span className="ml-auto rounded-chip border border-line px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-ink-faint">
              Soon
            </span>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-line p-3">
        <div className="flex items-center justify-between rounded-control border border-line bg-bg-raised px-2.5 py-2">
          <span className="flex items-center gap-2 text-xs font-medium text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" />
            Production
          </span>
          <span className="font-mono text-2xs text-ink-faint">us-east-1</span>
        </div>
        <p className="px-1 text-2xs leading-relaxed text-ink-dim">
          A product concept — designed &amp; built by Vitalina Nikulina.
        </p>
      </div>
    </aside>
  )
}

/** Mobile top bar — logo + primary nav as pills. */
export function MobileNav({ route }: { route: Route }) {
  return (
    <div className="sticky top-0 z-30 border-b border-line bg-bg-sink/95 backdrop-blur md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <a href="#/overview" className="flex items-center gap-2">
          <LogoMark size={24} />
          <span className="font-semibold tracking-tight text-ink">Relay</span>
        </a>
        <span className="flex items-center gap-1.5 text-2xs font-medium text-ink-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" /> prod
        </span>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
        {PRIMARY.map((d) => {
          const active = isActive(d, route)
          return (
            <a
              key={d.label}
              href={d.href}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'flex items-center gap-1.5 whitespace-nowrap rounded-chip px-3 py-1.5 text-xs font-medium',
                active ? 'bg-white/[0.06] text-ink' : 'text-ink-soft',
              )}
            >
              <Icon name={d.icon} size={14} className={active ? 'text-accent' : 'text-ink-faint'} />
              {d.label}
            </a>
          )
        })}
      </nav>
    </div>
  )
}
