import { useSyncExternalStore } from 'react'
import { generateDataset, spawnRun } from '../data/generate'
import type { Dataset, Run } from '../data/types'

/**
 * A live, reactive dataset. It starts from the deterministic seeded set, then
 * streams a fresh run in every couple of seconds and advances "now" — so the
 * dashboard keeps moving after load: new rows arrive, the running count and
 * metrics tick, relative times age. This is the motion a monitoring product is
 * supposed to have.
 *
 * Under prefers-reduced-motion the feed never starts — the app shows a calm
 * static snapshot. Deterministic run *content* still comes from the seed; only
 * the streamed live runs use Math.random (they're ephemeral).
 */
const seeded = generateDataset({ now: Date.now() })
const agents = seeded.agents
let runs: Run[] = seeded.runs
let now = seeded.now
const MAX_RUNS = 800 // high enough that a viewing session never plateaus
const TICK_MS = 2400

let snapshot: Dataset = { now, agents, runs }
const listeners = new Set<() => void>()

function emit() {
  snapshot = { now, agents, runs }
  for (const l of listeners) l()
}

const prefersReduced =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

let timer: ReturnType<typeof setInterval> | undefined
function ensureRunning() {
  if (timer || prefersReduced || typeof window === 'undefined') return
  timer = setInterval(() => {
    now = Date.now()
    runs = [spawnRun(now), ...runs].slice(0, MAX_RUNS)
    emit()
  }, TICK_MS)
}

ensureRunning()

/** Subscribe a React tree to the live dataset. */
export function useLive(): Dataset {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => snapshot,
    () => snapshot,
  )
}
