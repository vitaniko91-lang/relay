import { useMemo } from 'react'
import { dataset } from '../lib/dataset'
import { agentHealth, overviewStats, recentFailures } from '../data/selectors'
import { formatCost, formatDuration, formatNumber, formatPct, relativeTime } from '../data/format'
import { StatCard, type Trend } from '../components/StatCard'
import { Appear, CountUp } from '../components/motion'
import { Card, Overline } from '../components/primitives'
import { Sparkline, AreaChart } from '../components/charts'
import { Icon } from '../components/Icon'
import { RUN_STATUS_META } from '../components/status'
import { cx } from '../lib/cx'

function sum(a: number[]): number {
  return a.reduce((x, y) => x + y, 0)
}

/** Compare the last quarter of a series to the prior quarter for a trend chip. */
function trend(series: number[], good: 'up' | 'down' | 'none'): Trend {
  const q = Math.max(1, Math.floor(series.length / 4))
  const recent = sum(series.slice(-q))
  const prev = sum(series.slice(-2 * q, -q))
  if (prev === 0) return { label: '—', tone: 'neutral', dir: 'flat' }
  const pct = ((recent - prev) / prev) * 100
  const dir: Trend['dir'] = pct > 2 ? 'up' : pct < -2 ? 'down' : 'flat'
  const label = `${pct > 0 ? '+' : ''}${Math.round(pct)}%`
  let tone: Trend['tone'] = 'neutral'
  if (good !== 'none' && dir !== 'flat') tone = dir === good ? 'good' : 'bad'
  return { label, tone, dir }
}

function healthTone(errorRate: number, running: number): { dot: string; label: string } {
  if (errorRate >= 0.12) return { dot: 'bg-err', label: 'Degraded' }
  if (errorRate >= 0.06) return { dot: 'bg-warn', label: 'Warning' }
  if (running > 0) return { dot: 'bg-run', label: 'Active' }
  return { dot: 'bg-ok', label: 'Healthy' }
}

export function Overview() {
  const stats = useMemo(() => overviewStats(dataset), [])
  const fleet = useMemo(() => agentHealth(dataset), [])
  const failures = useMemo(() => recentFailures(dataset, 6), [])

  const runsSeries = stats.buckets.map((b) => b.runs)
  const errorsSeries = stats.buckets.map((b) => b.errors)
  const costSeries = stats.buckets.map((b) => b.cost)
  const latencySeries = stats.buckets.map((b) => b.avgLatency)

  return (
    <div className="space-y-4">
      {/* Metric row */}
      <Appear className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Active agents"
          value={<CountUp to={stats.activeAgents} format={(n) => String(Math.round(n))} />}
          unit={`/ ${stats.totalAgents}`}
          icon="activity"
          footer={
            <div className="flex flex-wrap gap-1">
              {fleet.map((h) => (
                <span key={h.agent.id} className={cx('h-1.5 w-1.5 rounded-full', healthTone(h.errorRate, h.running).dot)} title={h.agent.name} />
              ))}
            </div>
          }
        />
        <StatCard label="Runs" value={<CountUp to={stats.runs24h} format={formatNumber} />} icon="runs" trend={trend(runsSeries, 'none')} footer={<Sparkline data={runsSeries} />} />
        <StatCard
          label="Error rate"
          value={<CountUp to={stats.errorRate} format={formatPct} />}
          icon="alert"
          trend={trend(errorsSeries, 'down')}
          footer={<Sparkline data={errorsSeries} color="#F87171" />}
        />
        <StatCard label="p95 latency" value={<CountUp to={stats.p95LatencyMs} format={formatDuration} />} icon="gauge" trend={trend(latencySeries, 'down')} footer={<Sparkline data={latencySeries} />} />
        <StatCard label="Cost" value={<CountUp to={stats.cost24h} format={formatCost} />} icon="coins" trend={trend(costSeries, 'down')} footer={<Sparkline data={costSeries} />} />
      </Appear>

      {/* Chart + recent failures */}
      <Appear delay={0.08} className="grid gap-3 xl:grid-cols-3">
        <Card className="p-4 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Runs over time</h2>
              <p className="text-xs text-ink-faint">Hourly, last 24 hours</p>
            </div>
            <div className="flex items-center gap-3 text-2xs font-medium text-ink-soft">
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-3 rounded-full bg-accent" /> Runs
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-3 rounded-full border-t border-dashed border-err" /> Errors
              </span>
            </div>
          </div>
          <AreaChart values={runsSeries} errors={errorsSeries} labels={['24h', '18h', '12h', '6h', 'now']} />
        </Card>

        <Card className="flex flex-col p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Recent failures</h2>
            <a href="#/runs?status=error" className="text-xs font-medium text-accent hover:text-accent-soft">
              View all
            </a>
          </div>
          <ul className="-mx-2 flex-1 space-y-0.5">
            {failures.map((run) => {
              const agent = dataset.agents.find((a) => a.id === run.agentId)
              const failStep = run.failedStepIndex != null ? run.steps[run.failedStepIndex] : undefined
              const meta = RUN_STATUS_META[run.status]
              return (
                <li key={run.id}>
                  <a href={`#/runs/${run.id}`} className="flex items-start gap-2.5 rounded-control px-2 py-2 transition-colors hover:bg-white/[0.03]">
                    <Icon name={meta.icon} size={14} className={cx('mt-0.5 shrink-0', meta.text)} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-ink">{agent?.name}</span>
                        <span className="shrink-0 text-2xs text-ink-faint">{relativeTime(run.startedAt, dataset.now)}</span>
                      </span>
                      <span className="truncate text-xs text-ink-faint">{failStep?.error?.type ?? meta.label}</span>
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </Card>
      </Appear>

      {/* Fleet */}
      <Appear delay={0.16}>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">Fleet</h2>
          <a href="#/runs" className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-soft">
            All runs <Icon name="chevronRight" size={13} />
          </a>
        </div>
        {/* header */}
        <div className="hidden grid-cols-[2fr_1fr_1.4fr_1fr_1fr_1fr] gap-4 border-b border-line px-4 py-2 md:grid">
          {['Agent', 'Runs', 'Error rate', 'p95', 'Cost', 'Last run'].map((h) => (
            <Overline key={h} className={cx(h !== 'Agent' && 'text-right')}>
              {h}
            </Overline>
          ))}
        </div>
        <ul>
          {fleet.map((h) => {
            const tone = healthTone(h.errorRate, h.running)
            return (
              <li key={h.agent.id} className="border-b border-line-soft last:border-0">
                <a
                  href={`#/runs?agent=${h.agent.id}`}
                  className="grid grid-cols-2 items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-white/[0.025] md:grid-cols-[2fr_1fr_1.4fr_1fr_1fr_1fr]"
                >
                  <div className="col-span-2 flex items-center gap-3 md:col-span-1">
                    <span className={cx('h-2 w-2 shrink-0 rounded-full', tone.dot)} title={tone.label} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">{h.agent.name}</span>
                      <span className="block truncate font-mono text-2xs text-ink-faint">{h.agent.model}</span>
                    </span>
                  </div>
                  <div className="tnum text-sm text-ink-soft md:text-right">
                    <span className="text-ink-faint md:hidden">Runs </span>
                    {h.runs}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="hidden h-1 w-14 overflow-hidden rounded-full bg-white/[0.06] sm:block">
                      <span className={cx('block h-full rounded-full', h.errorRate >= 0.12 ? 'bg-err' : h.errorRate >= 0.06 ? 'bg-warn' : 'bg-ok')} style={{ width: `${Math.min(100, h.errorRate * 100 * 4)}%` }} />
                    </span>
                    <span className="tnum text-sm text-ink-soft">{formatPct(h.errorRate)}</span>
                  </div>
                  <div className="tnum hidden text-sm text-ink-soft md:block md:text-right">{formatDuration(h.p95LatencyMs)}</div>
                  <div className="tnum hidden text-sm text-ink-soft md:block md:text-right">{formatCost(h.cost)}</div>
                  <div className="tnum hidden text-sm text-ink-faint md:block md:text-right">{relativeTime(h.lastRunAt, dataset.now)}</div>
                </a>
              </li>
            )
          })}
        </ul>
      </Card>
      </Appear>
    </div>
  )
}
