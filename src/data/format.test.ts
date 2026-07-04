import { describe, it, expect } from 'vitest'
import { formatDuration, formatCost, formatTokens, formatNumber, formatPct, relativeTime } from './format'

describe('formatDuration', () => {
  it('shows ms under a second', () => {
    expect(formatDuration(840)).toBe('840ms')
    expect(formatDuration(0)).toBe('0ms')
  })
  it('shows seconds with adaptive precision', () => {
    expect(formatDuration(2400)).toBe('2.40s')
    expect(formatDuration(12400)).toBe('12.4s')
  })
  it('shows minutes and seconds past a minute', () => {
    expect(formatDuration(80000)).toBe('1m 20s')
  })
})

describe('formatCost', () => {
  it('handles zero and small magnitudes', () => {
    expect(formatCost(0)).toBe('$0')
    expect(formatCost(0.0023)).toBe('$0.0023')
    expect(formatCost(0.42)).toBe('$0.420')
    expect(formatCost(12.5)).toBe('$12.50')
  })
})

describe('formatTokens', () => {
  it('compacts thousands and millions', () => {
    expect(formatTokens(940)).toBe('940')
    expect(formatTokens(3200)).toBe('3.2k')
    expect(formatTokens(24000)).toBe('24k')
    expect(formatTokens(1_100_000)).toBe('1.1M')
  })
})

describe('formatNumber', () => {
  it('groups thousands', () => {
    expect(formatNumber(12480)).toBe('12,480')
  })
})

describe('formatPct', () => {
  it('drops the decimal for whole percents', () => {
    expect(formatPct(0.04)).toBe('4%')
    expect(formatPct(0.042)).toBe('4.2%')
  })
})

describe('relativeTime', () => {
  const now = 1_700_000_000_000
  it('describes recent and older times coarsely', () => {
    expect(relativeTime(now, now)).toBe('just now')
    expect(relativeTime(now - 30_000, now)).toBe('30s ago')
    expect(relativeTime(now - 5 * 60_000, now)).toBe('5m ago')
    expect(relativeTime(now - 3 * 3_600_000, now)).toBe('3h ago')
    expect(relativeTime(now - 2 * 86_400_000, now)).toBe('2d ago')
  })
})
