import { describe, it, expect } from 'vitest'
import { generateDataset } from './generate'

const NOW = 1_700_000_000_000

describe('generateDataset', () => {
  it('is deterministic in content for a fixed seed', () => {
    const a = generateDataset({ seed: 7, now: NOW })
    const b = generateDataset({ seed: 7, now: NOW })
    expect(a).toEqual(b)
  })

  it('keeps run content stable across different "now" values', () => {
    const a = generateDataset({ seed: 7, now: NOW })
    const b = generateDataset({ seed: 7, now: NOW + 5_000_000 })
    // Same runs (ids, statuses, latencies) — only absolute timestamps shift.
    expect(a.runs.map((r) => r.id)).toEqual(b.runs.map((r) => r.id))
    expect(a.runs.map((r) => r.status)).toEqual(b.runs.map((r) => r.status))
    expect(a.runs.map((r) => r.latencyMs)).toEqual(b.runs.map((r) => r.latencyMs))
  })

  it('produces the full fleet and expected run volume', () => {
    const d = generateDataset({ seed: 1, now: NOW })
    expect(d.agents).toHaveLength(8)
    expect(d.runs).toHaveLength(214)
    expect(new Set(d.runs.map((r) => r.id)).size).toBe(214) // ids unique
  })

  it('anchors every run inside the last 24h and orders newest-first', () => {
    const d = generateDataset({ seed: 3, now: NOW })
    for (const r of d.runs) {
      expect(r.startedAt).toBeLessThanOrEqual(NOW)
      expect(NOW - r.startedAt).toBeLessThan(24 * 60 * 60 * 1000)
    }
    for (let i = 1; i < d.runs.length; i++) {
      expect(d.runs[i - 1].startedAt).toBeGreaterThanOrEqual(d.runs[i].startedAt)
    }
  })

  it('every run has steps, positive latency, and non-negative cost', () => {
    const d = generateDataset({ seed: 5, now: NOW })
    for (const r of d.runs) {
      expect(r.steps.length).toBeGreaterThan(0)
      expect(r.latencyMs).toBeGreaterThan(0)
      expect(r.costUsd).toBeGreaterThanOrEqual(0)
      expect(r.agentId).toBeTruthy()
    }
  })

  it('models failures as one failing step followed by skipped steps', () => {
    const d = generateDataset({ seed: 5, now: NOW })
    const failed = d.runs.filter((r) => r.status === 'error' || r.status === 'timeout')
    expect(failed.length).toBeGreaterThan(0)
    for (const r of failed) {
      expect(r.failedStepIndex).not.toBeNull()
      const idx = r.failedStepIndex as number
      expect(r.steps[idx].status).toBe('error')
      expect(r.steps[idx].error).toBeTruthy()
      for (let j = idx + 1; j < r.steps.length; j++) {
        expect(r.steps[j].status).toBe('skipped')
      }
    }
  })

  it('marks running runs with a pending tail and no failure', () => {
    const d = generateDataset({ seed: 5, now: NOW })
    const running = d.runs.filter((r) => r.status === 'running')
    for (const r of running) {
      expect(r.failedStepIndex).toBeNull()
      expect(r.steps.some((s) => s.status === 'skipped')).toBe(true)
    }
  })

  it('successful runs have every step ok and no failure index', () => {
    const d = generateDataset({ seed: 5, now: NOW })
    for (const r of d.runs.filter((r) => r.status === 'success')) {
      expect(r.failedStepIndex).toBeNull()
      expect(r.steps.every((s) => s.status === 'ok')).toBe(true)
    }
  })

  it('run totalTokens equals the sum over executed steps', () => {
    const d = generateDataset({ seed: 9, now: NOW })
    for (const r of d.runs) {
      const executed = r.steps.filter((s) => s.status !== 'skipped')
      const sum = executed.reduce((t, s) => t + s.tokensIn + s.tokensOut, 0)
      expect(r.totalTokens).toBe(sum)
    }
  })
})
