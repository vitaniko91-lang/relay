/**
 * A tiny seeded PRNG so the whole mock dataset is deterministic — the same seed
 * always yields the same fleet, runs, and traces. This keeps the demo stable
 * (no reshuffling on reload) and makes the generator unit-testable.
 *
 * mulberry32: fast, well-distributed 32-bit generator. Not cryptographic —
 * appropriate only for mock data.
 */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return function next(): number {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Rng = ReturnType<typeof mulberry32>

/** Integer in [min, max] inclusive. */
export function int(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

/** Float in [min, max). */
export function float(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min)
}

/** Pick one element. Assumes a non-empty array. */
export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

/** True with probability p. */
export function chance(rng: Rng, p: number): boolean {
  return rng() < p
}

/**
 * Approximate standard normal via the mean of several uniforms (central limit).
 * Returned unbounded; callers clamp. Good enough to give latency/token counts a
 * natural bell shape instead of a flat distribution.
 */
export function gaussian(rng: Rng): number {
  return (rng() + rng() + rng() + rng() - 2) / Math.sqrt(4 / 12)
}
