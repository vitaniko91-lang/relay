import { generateDataset } from '../data/generate'

/**
 * The single mock dataset for the running app. Generated once at load with the
 * real wall clock as the anchor, so relative times ("2m ago") look fresh on
 * every visit while the run content stays deterministic (fixed seed).
 */
export const dataset = generateDataset({ now: Date.now() })
