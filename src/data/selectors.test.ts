import { describe, it, expect } from 'vitest'
import { generateDataset } from './generate'
import {
  percentile,
  overviewStats,
  agentHealth,
  recentFailures,
  filterRuns,
  sortRuns,
  getRun,
  isFailure,
} from './selectors'

const NOW = 1_700_000_000_000
const dataset = generateDataset({ seed: 42, now: NOW })

describe('percentile', () => {
  it('returns 0 for an empty list', () => {
    expect(percentile([], 95)).toBe(0)
  })
  it('uses nearest-rank', () => {
    const v = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    expect(percentile(v, 100)).toBe(10)
    expect(percentile(v, 50)).toBe(5)
    expect(percentile(v, 10)).toBe(1)
  })
  it('ignores input order', () => {
    expect(percentile([5, 1, 4, 2, 3], 60)).toBe(3)
  })
})

describe('overviewStats', () => {
  const s = overviewStats(dataset)
  it('summarizes the fleet', () => {
    expect(s.totalAgents).toBe(8)
    expect(s.runs24h).toBe(dataset.runs.length)
    expect(s.activeAgents).toBeGreaterThan(0)
    expect(s.activeAgents).toBeLessThanOrEqual(8)
  })
  it('keeps rates within [0,1]', () => {
    expect(s.errorRate).toBeGreaterThanOrEqual(0)
    expect(s.errorRate).toBeLessThanOrEqual(1)
    expect(s.successRate).toBeGreaterThanOrEqual(0)
    expect(s.successRate).toBeLessThanOrEqual(1)
  })
  it('exposes 24 hourly buckets, oldest first', () => {
    expect(s.buckets).toHaveLength(24)
    expect(s.buckets[0].t).toBeLessThan(s.buckets[23].t)
    const total = s.buckets.reduce((n, b) => n + b.runs, 0)
    expect(total).toBe(dataset.runs.length)
  })
  it('p95 latency is positive and >= average', () => {
    expect(s.p95LatencyMs).toBeGreaterThan(0)
    expect(s.p95LatencyMs).toBeGreaterThanOrEqual(Math.round(s.avgLatencyMs))
  })
})

describe('agentHealth', () => {
  const health = agentHealth(dataset)
  it('covers every agent, busiest first', () => {
    expect(health).toHaveLength(8)
    for (let i = 1; i < health.length; i++) {
      expect(health[i - 1].runs).toBeGreaterThanOrEqual(health[i].runs)
    }
  })
  it('run counts sum to the dataset total', () => {
    expect(health.reduce((n, h) => n + h.runs, 0)).toBe(dataset.runs.length)
  })
})

describe('recentFailures', () => {
  it('returns only failures, newest first, capped', () => {
    const fails = recentFailures(dataset, 5)
    expect(fails.length).toBeLessThanOrEqual(5)
    expect(fails.every(isFailure)).toBe(true)
    for (let i = 1; i < fails.length; i++) {
      expect(fails[i - 1].startedAt).toBeGreaterThanOrEqual(fails[i].startedAt)
    }
  })
})

describe('filterRuns', () => {
  it('filters by status', () => {
    const errs = filterRuns(dataset.runs, { status: 'error' })
    expect(errs.length).toBeGreaterThan(0)
    expect(errs.every((r) => r.status === 'error')).toBe(true)
  })
  it('filters by agent', () => {
    const one = filterRuns(dataset.runs, { agentId: 'support-triage' })
    expect(one.every((r) => r.agentId === 'support-triage')).toBe(true)
  })
  it('"all" is a no-op passthrough', () => {
    expect(filterRuns(dataset.runs, { status: 'all', agentId: 'all' })).toHaveLength(dataset.runs.length)
  })
  it('matches a query against id or agent', () => {
    const some = dataset.runs[0]
    const hit = filterRuns(dataset.runs, { query: some.id }, dataset.agents)
    expect(hit.some((r) => r.id === some.id)).toBe(true)
    expect(filterRuns(dataset.runs, { query: 'triage' }, dataset.agents).every((r) => r.agentId === 'support-triage')).toBe(true)
  })
})

describe('sortRuns', () => {
  it('sorts by latency ascending and descending', () => {
    const asc = sortRuns(dataset.runs, 'latencyMs', 'asc')
    const desc = sortRuns(dataset.runs, 'latencyMs', 'desc')
    expect(asc[0].latencyMs).toBeLessThanOrEqual(asc[asc.length - 1].latencyMs)
    expect(desc[0].latencyMs).toBeGreaterThanOrEqual(desc[desc.length - 1].latencyMs)
  })
  it('does not mutate the input', () => {
    const before = dataset.runs.map((r) => r.id)
    sortRuns(dataset.runs, 'costUsd', 'desc')
    expect(dataset.runs.map((r) => r.id)).toEqual(before)
  })
  it('orders status running → error → timeout → success', () => {
    const sorted = sortRuns(dataset.runs, 'status', 'asc')
    const rank = { running: 0, error: 1, timeout: 2, success: 3 } as const
    for (let i = 1; i < sorted.length; i++) {
      expect(rank[sorted[i - 1].status]).toBeLessThanOrEqual(rank[sorted[i].status])
    }
  })
})

describe('getRun', () => {
  it('finds a run by id', () => {
    const target = dataset.runs[10]
    expect(getRun(dataset, target.id)?.id).toBe(target.id)
    expect(getRun(dataset, 'run_nope')).toBeUndefined()
  })
})
