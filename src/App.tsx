import { useHashRoute } from './lib/useHashRoute'
import { AppShell } from './components/AppShell'
import { Overview } from './screens/Overview'
import { Runs } from './screens/Runs'
import { Trace } from './screens/Trace'
import { Icon } from './components/Icon'
import { useLive } from './lib/live'
import { getAgent, getRun } from './data/selectors'

export default function App() {
  const route = useHashRoute()
  const dataset = useLive()

  if (route.name === 'runs') {
    const agent = route.agentId ? getAgent(dataset, route.agentId) : undefined
    return (
      <AppShell route={route} title={agent ? `Runs · ${agent.name}` : 'Runs'}>
        <Runs key={`${route.agentId ?? ''}-${route.status ?? ''}`} initialAgent={route.agentId} initialStatus={route.status} />
      </AppShell>
    )
  }

  if (route.name === 'trace') {
    const run = getRun(dataset, route.id)
    const agent = run ? getAgent(dataset, run.agentId) : undefined
    const breadcrumb = (
      <nav className="mb-0.5 flex items-center gap-1 text-2xs font-medium text-ink-faint">
        <a href="#/runs" className="hover:text-ink-soft">Runs</a>
        <Icon name="chevronRight" size={11} className="text-ink-dim" />
        <span className="font-mono text-ink-soft">{route.id}</span>
      </nav>
    )
    return (
      <AppShell route={route} title={agent?.name ?? 'Run detail'} breadcrumb={breadcrumb}>
        <Trace id={route.id} />
      </AppShell>
    )
  }

  return (
    <AppShell route={route} title="Overview">
      <Overview />
    </AppShell>
  )
}
