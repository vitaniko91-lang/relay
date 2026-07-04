import type { Agent, Dataset, Run, RunStatus, RunTrigger, Env } from './types'

// Pure derivations over the dataset. All read-only; every screen composes these
// rather than re-deriving stats inline, and they carry the unit tests.

const HOUR_MS = 60 * 60 * 1000
const WINDOW_MS = 24 * HOUR_MS
const BUCKETS = 24

/** A run is "finished" once it is no longer in flight. */
export function isFinished(run: Run): boolean {
  return run.status !== 'running'
}

/** A run counts as a failure for error-rate purposes. */
export function isFailure(run: Run): boolean {
  return run.status === 'error' || run.status === 'timeout'
}

/** Nearest-rank percentile of a numeric list. Returns 0 for an empty list. */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const rank = Math.ceil((p / 100) * sorted.length)
  const idx = Math.min(sorted.length - 1, Math.max(0, rank - 1))
  return sorted[idx]
}

export interface HourBucket {
  /** Bucket end time (epoch ms). */
  t: number
  runs: number
  errors: number
  cost: number
  avgLatency: number
}

export interface OverviewStats {
  totalAgents: number
  activeAgents: number // ≥1 run in the last hour
  runs24h: number
  runningNow: number
  errorRate: number // fraction over finished runs
  successRate: number
  p95LatencyMs: number
  avgLatencyMs: number
  cost24h: number
  totalTokens: number
  /** Hourly buckets, oldest → newest, for sparklines. */
  buckets: HourBucket[]
}

export function overviewStats(dataset: Dataset): OverviewStats {
  const { runs, agents, now } = dataset
  const finished = runs.filter(isFinished)
  const failures = runs.filter(isFailure)
  const running = runs.filter((r) => r.status === 'running')

  const activeIds = new Set(runs.filter((r) => now - r.startedAt < HOUR_MS).map((r) => r.agentId))

  const latencies = finished.map((r) => r.latencyMs)
  const cost24h = runs.reduce((c, r) => c + r.costUsd, 0)
  const totalTokens = runs.reduce((t, r) => t + r.totalTokens, 0)

  // Hourly buckets. bucket 0 = newest hour; we reverse to oldest→newest.
  const raw: HourBucket[] = Array.from({ length: BUCKETS }, (_, i) => ({
    t: now - i * HOUR_MS,
    runs: 0,
    errors: 0,
    cost: 0,
    avgLatency: 0,
  }))
  const latencySum = new Array(BUCKETS).fill(0)
  for (const r of runs) {
    const age = now - r.startedAt
    if (age < 0 || age >= WINDOW_MS) continue
    const b = Math.min(BUCKETS - 1, Math.floor(age / HOUR_MS))
    raw[b].runs += 1
    if (isFailure(r)) raw[b].errors += 1
    raw[b].cost += r.costUsd
    latencySum[b] += r.latencyMs
  }
  raw.forEach((bucket, b) => {
    bucket.avgLatency = bucket.runs ? latencySum[b] / bucket.runs : 0
  })
  const buckets = raw.reverse()

  const finishedCount = finished.length || 1
  return {
    totalAgents: agents.length,
    activeAgents: activeIds.size,
    runs24h: runs.length,
    runningNow: running.length,
    errorRate: failures.length / finishedCount,
    successRate: finished.filter((r) => r.status === 'success').length / finishedCount,
    p95LatencyMs: percentile(latencies, 95),
    avgLatencyMs: latencies.reduce((a, b) => a + b, 0) / finishedCount,
    cost24h,
    totalTokens,
    buckets,
  }
}

export interface AgentHealth {
  agent: Agent
  runs: number
  errorRate: number
  p95LatencyMs: number
  cost: number
  lastRunAt: number
  running: number
}

/** Per-agent rollup for the Overview fleet list, busiest first. */
export function agentHealth(dataset: Dataset): AgentHealth[] {
  return dataset.agents
    .map((agent) => {
      const runs = dataset.runs.filter((r) => r.agentId === agent.id)
      const finished = runs.filter(isFinished)
      const finishedCount = finished.length || 1
      return {
        agent,
        runs: runs.length,
        errorRate: runs.filter(isFailure).length / finishedCount,
        p95LatencyMs: percentile(finished.map((r) => r.latencyMs), 95),
        cost: runs.reduce((c, r) => c + r.costUsd, 0),
        lastRunAt: runs.reduce((m, r) => Math.max(m, r.startedAt), 0),
        running: runs.filter((r) => r.status === 'running').length,
      }
    })
    .sort((a, b) => b.runs - a.runs)
}

/** Most recent failed runs, newest first. */
export function recentFailures(dataset: Dataset, limit = 6): Run[] {
  return dataset.runs
    .filter(isFailure)
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, limit)
}

// ── Runs table: filter + sort ────────────────────────────────────────────────

export interface RunFilters {
  status?: RunStatus | 'all'
  agentId?: string | 'all'
  trigger?: RunTrigger | 'all'
  env?: Env | 'all'
  query?: string
}

export function filterRuns(runs: Run[], filters: RunFilters, agents: Agent[] = []): Run[] {
  const nameById = new Map(agents.map((a) => [a.id, a.name.toLowerCase()]))
  const q = filters.query?.trim().toLowerCase() ?? ''
  return runs.filter((r) => {
    if (filters.status && filters.status !== 'all' && r.status !== filters.status) return false
    if (filters.agentId && filters.agentId !== 'all' && r.agentId !== filters.agentId) return false
    if (filters.trigger && filters.trigger !== 'all' && r.trigger !== filters.trigger) return false
    if (filters.env && filters.env !== 'all' && r.env !== filters.env) return false
    if (q) {
      const hay = `${r.id} ${r.agentId} ${nameById.get(r.agentId) ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

export type SortKey = 'startedAt' | 'latencyMs' | 'costUsd' | 'totalTokens' | 'status' | 'agentId'
export type SortDir = 'asc' | 'desc'

const STATUS_ORDER: Record<RunStatus, number> = { running: 0, error: 1, timeout: 2, success: 3 }

export function sortRuns(runs: Run[], key: SortKey, dir: SortDir): Run[] {
  const sign = dir === 'asc' ? 1 : -1
  return [...runs].sort((a, b) => {
    let d: number
    if (key === 'status') d = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    else if (key === 'agentId') d = a.agentId.localeCompare(b.agentId)
    else d = (a[key] as number) - (b[key] as number)
    if (d === 0) d = a.startedAt - b.startedAt // stable tiebreak
    return d * sign
  })
}

export function getRun(dataset: Dataset, id: string): Run | undefined {
  return dataset.runs.find((r) => r.id === id)
}

export function getAgent(dataset: Dataset, id: string): Agent | undefined {
  return dataset.agents.find((a) => a.id === id)
}
