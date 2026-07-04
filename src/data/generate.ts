import type { Agent, Dataset, Env, Run, RunStatus, RunTrigger, Step, StepKind } from './types'
import { chance, gaussian, int, mulberry32, pick, type Rng } from './rng'

// ── Fleet definition ────────────────────────────────────────────────────────
// Each agent carries a profile so the generated data has texture: some agents
// are flakier, slower, or higher-volume than others. These shape (not hardcode)
// the runs — the RNG still drives every individual value.

interface AgentSeed extends Agent {
  errRate: number // baseline probability a run fails
  speed: number // per-step duration multiplier (1 = typical)
  count: number // how many runs to generate
}

const FLEET: AgentSeed[] = [
  { id: 'support-triage', name: 'Support Triage', model: 'gpt-4o-mini', blurb: 'Routes and answers inbound support tickets', errRate: 0.09, speed: 0.8, count: 46 },
  { id: 'doc-summarizer', name: 'Doc Summarizer', model: 'claude-haiku-4', blurb: 'Summarizes long documents on upload', errRate: 0.03, speed: 0.85, count: 40 },
  { id: 'outreach-writer', name: 'Outreach Writer', model: 'gpt-4o-mini', blurb: 'Drafts personalized sales outreach', errRate: 0.07, speed: 1, count: 34 },
  { id: 'invoice-extractor', name: 'Invoice Extractor', model: 'claude-sonnet-4', blurb: 'Extracts line items from uploaded invoices', errRate: 0.06, speed: 1.15, count: 22 },
  { id: 'sql-copilot', name: 'SQL Copilot', model: 'gpt-4o', blurb: 'Turns questions into SQL for analysts', errRate: 0.11, speed: 1.05, count: 22 },
  { id: 'churn-sentinel', name: 'Churn Sentinel', model: 'gpt-4o-mini', blurb: 'Flags at-risk accounts from usage signals', errRate: 0.04, speed: 0.7, count: 20 },
  { id: 'lead-enricher', name: 'Lead Enricher', model: 'gpt-4o', blurb: 'Enriches CRM leads from public web data', errRate: 0.14, speed: 1.4, count: 18 },
  { id: 'code-reviewer', name: 'Code Reviewer', model: 'claude-opus-4', blurb: 'Reviews pull requests and flags risks', errRate: 0.05, speed: 1.6, count: 12 },
]

// Price per 1K tokens, [input, output], in USD. Realistic ballpark rates.
const MODEL_RATES: Record<string, [number, number]> = {
  'gpt-4o-mini': [0.00015, 0.0006],
  'gpt-4o': [0.0025, 0.01],
  'claude-haiku-4': [0.0008, 0.004],
  'claude-sonnet-4': [0.003, 0.015],
  'claude-opus-4': [0.015, 0.075],
}

const TOOL_NAMES = ['crm.lookup', 'http.fetch', 'db.query', 'stripe.charge', 'slack.post', 'pdf.parse', 's3.get', 'sheets.append']
const TRIGGERS: RunTrigger[] = ['schedule', 'api', 'manual', 'webhook']

const WINDOW_MS = 24 * 60 * 60 * 1000 // runs spread across the last 24h
const RUNNING_WINDOW_MS = 90 * 1000 // only very recent runs may still be running

// ── Helpers ─────────────────────────────────────────────────────────────────

function hexId(rng: Rng, prefix: string, len: number): string {
  const chars = '0123456789abcdef'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[int(rng, 0, 15)]
  return `${prefix}${s}`
}

function round(n: number, dp: number): number {
  const f = 10 ** dp
  return Math.round(n * f) / f
}

function llmCallName(model: string): string {
  return model.startsWith('claude') ? 'anthropic.messages' : 'openai.chat'
}

function stepCost(kind: StepKind, model: string, tokensIn: number, tokensOut: number): number {
  if (kind === 'llm') {
    const [inR, outR] = MODEL_RATES[model] ?? [0.001, 0.003]
    return (tokensIn / 1000) * inR + (tokensOut / 1000) * outR
  }
  if (kind === 'retrieval') return 0.00002
  return 0 // router / tool / guard have no token cost here
}

// ── Step chain ──────────────────────────────────────────────────────────────

/**
 * Build a plausible step chain for one run. Returns the ordered steps with
 * offsets already accumulated. Failure (if any) is applied afterwards.
 */
function buildSteps(rng: Rng, agent: AgentSeed): Step[] {
  const kinds: StepKind[] = ['router']
  if (chance(rng, 0.7)) kinds.push('retrieval')
  kinds.push('llm')
  if (chance(rng, 0.65)) kinds.push('tool')
  if (chance(rng, 0.4)) kinds.push('llm') // synthesis pass
  kinds.push('guard')

  const steps: Step[] = []
  let offset = 0
  kinds.forEach((kind, i) => {
    let duration: number
    let tokensIn = 0
    let tokensOut = 0
    let name: string
    let input: string
    let output: string

    switch (kind) {
      case 'router':
        duration = Math.max(12, 45 + gaussian(rng) * 18)
        name = 'router.classify'
        input = 'inbound payload'
        output = `route=${pick(rng, ['billing', 'technical', 'sales', 'general'])} · conf ${round(0.7 + rng() * 0.29, 2)}`
        break
      case 'retrieval':
        duration = Math.max(30, 110 + gaussian(rng) * 45) * agent.speed
        name = 'vector.search'
        input = `query · ${int(rng, 3, 24)} terms`
        output = `${int(rng, 2, 8)} chunks · top ${round(0.6 + rng() * 0.39, 2)}`
        break
      case 'tool': {
        duration = Math.max(45, 320 + gaussian(rng) * 180) * agent.speed
        name = pick(rng, TOOL_NAMES)
        input = `{ id: "${hexId(rng, '', 6)}" }`
        output = `200 OK · ${round(0.4 + rng() * 3, 1)}kb`
        break
      }
      case 'guard':
        duration = Math.max(8, 22 + gaussian(rng) * 8)
        name = 'guard.validate'
        input = 'candidate output'
        output = 'schema ✓ · pii ✓'
        break
      case 'llm':
      default:
        tokensIn = Math.max(120, Math.round(900 + gaussian(rng) * 620))
        tokensOut = Math.max(40, Math.round(280 + gaussian(rng) * 220))
        duration = Math.max(180, (tokensOut * 1.6 + 260 + gaussian(rng) * 200)) * agent.speed
        name = llmCallName(agent.model)
        input = `system + user · ${tokensIn.toLocaleString()} tok`
        output = `completion · ${tokensOut.toLocaleString()} tok`
        break
    }

    duration = Math.round(duration)
    steps.push({
      id: `step_${i}`,
      kind,
      name,
      status: 'ok',
      offsetMs: Math.round(offset),
      durationMs: duration,
      tokensIn,
      tokensOut,
      costUsd: round(stepCost(kind, agent.model, tokensIn, tokensOut), 6),
      io: { input, output },
    })
    offset += duration + int(rng, 4, 22) // small inter-step gap
  })

  return steps
}

const LLM_ERRORS = [
  { type: 'RateLimited', message: '429 Too Many Requests from provider — retry budget exhausted' },
  { type: 'ContextLengthExceeded', message: 'prompt of 128,402 tokens exceeds the model context window' },
  { type: 'ContentFilter', message: 'response blocked by the provider safety filter' },
]
const TOOL_ERRORS = [
  { type: 'ToolTimeout', message: 'timed out after 30,000ms waiting for upstream' },
  { type: 'HTTPError', message: '502 Bad Gateway from upstream service' },
  { type: 'ConnectionReset', message: 'ECONNRESET while streaming response body' },
]
const GUARD_ERRORS = [{ type: 'GuardrailBlocked', message: 'output failed JSON schema validation (missing `total`)' }]

/** Apply a failure to a step chain: mark the failing step and skip the rest. */
function applyFailure(rng: Rng, steps: Step[]): { failedStepIndex: number; status: RunStatus } {
  // Prefer failing on a risky step (tool or llm); fall back to guard.
  const candidates = steps
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.kind === 'tool' || s.kind === 'llm' || s.kind === 'guard')
  const chosen = candidates.length ? pick(rng, candidates) : { s: steps[steps.length - 1], i: steps.length - 1 }
  const idx = chosen.i
  const step = steps[idx]

  let error
  let status: RunStatus = 'error'
  if (step.kind === 'tool') {
    error = pick(rng, TOOL_ERRORS)
    if (error.type === 'ToolTimeout') {
      status = 'timeout'
      step.durationMs = 30000
    }
  } else if (step.kind === 'guard') {
    error = pick(rng, GUARD_ERRORS)
  } else {
    error = pick(rng, LLM_ERRORS)
  }

  step.status = 'error'
  step.error = error
  step.io = { ...step.io, output: `${error.type}: ${error.message}` }

  // Everything after the failure never ran.
  for (let j = idx + 1; j < steps.length; j++) {
    steps[j].status = 'skipped'
    steps[j].durationMs = 0
    steps[j].tokensIn = 0
    steps[j].tokensOut = 0
    steps[j].costUsd = 0
    steps[j].io = { input: '—', output: 'skipped (upstream failure)' }
  }

  return { failedStepIndex: idx, status }
}

function lastExecuted(steps: Step[], failedIndex: number | null): Step {
  if (failedIndex == null) return steps[steps.length - 1]
  return steps[failedIndex]
}

// ── Public API ──────────────────────────────────────────────────────────────

export interface GenerateOptions {
  seed?: number
  /** Reference "now" the runs are anchored to. Defaults to wall clock. */
  now?: number
}

/**
 * Generate the full mock dataset. Content is fully determined by `seed`; only
 * absolute timestamps shift with `now`, so relative displays ("2m ago") always
 * look fresh while the runs themselves stay stable across reloads.
 */
export function generateDataset(options: GenerateOptions = {}): Dataset {
  const seed = options.seed ?? 20260704
  const now = options.now ?? Date.now()
  const rng = mulberry32(seed)

  const agents: Agent[] = FLEET.map(({ id, name, model, blurb }) => ({ id, name, model, blurb }))
  const runs: Run[] = []

  for (const agent of FLEET) {
    for (let n = 0; n < agent.count; n++) {
      const steps = buildSteps(rng, agent)

      const startedAt = Math.round(now - rng() * WINDOW_MS)
      const isRecent = now - startedAt < RUNNING_WINDOW_MS

      let failedStepIndex: number | null = null
      let status: RunStatus

      if (isRecent && chance(rng, 0.5)) {
        // A fraction of very recent runs are still in flight.
        status = 'running'
        const cut = int(rng, 0, steps.length - 1)
        for (let j = cut + 1; j < steps.length; j++) {
          steps[j].status = 'skipped'
          steps[j].durationMs = 0
          steps[j].tokensIn = 0
          steps[j].tokensOut = 0
          steps[j].costUsd = 0
          steps[j].io = { input: '—', output: 'pending' }
        }
      } else if (chance(rng, agent.errRate)) {
        const failure = applyFailure(rng, steps)
        failedStepIndex = failure.failedStepIndex
        status = failure.status
      } else {
        status = 'success'
      }

      const executed = status === 'running' ? steps.filter((s) => s.status !== 'skipped') : status === 'success' ? steps : steps.slice(0, (failedStepIndex ?? steps.length - 1) + 1)

      const totalTokens = executed.reduce((t, s) => t + s.tokensIn + s.tokensOut, 0)
      const costUsd = round(
        executed.reduce((c, s) => c + s.costUsd, 0),
        6,
      )
      const tail = status === 'running' ? executed[executed.length - 1] : lastExecuted(steps, failedStepIndex)
      const latencyMs = tail.offsetMs + tail.durationMs

      const env: Env = chance(rng, 0.82) ? 'prod' : 'staging'

      runs.push({
        id: hexId(rng, 'run_', 6),
        agentId: agent.id,
        env,
        status,
        trigger: pick(rng, TRIGGERS),
        startedAt,
        latencyMs,
        totalTokens,
        costUsd,
        steps,
        failedStepIndex,
      })
    }
  }

  // Newest first — the natural default order for a runs feed.
  runs.sort((a, b) => b.startedAt - a.startedAt)

  return { now, agents, runs }
}

/**
 * Spawn a single, just-happened run for the live feed. Uses Math.random (these
 * runs are ephemeral and independent of the seeded dataset, so they never touch
 * generateDataset's determinism). Mostly completed runs with a minority still
 * in flight — so streaming them in reads as real activity without the "running"
 * count growing without bound.
 */
export function spawnRun(now: number): Run {
  const rng = mulberry32(Math.floor(Math.random() * 2 ** 31) >>> 0)
  const agent = FLEET[Math.floor(Math.random() * FLEET.length)]
  const steps = buildSteps(rng, agent)

  let failedStepIndex: number | null = null
  let status: RunStatus
  const roll = Math.random()
  if (roll < 0.25) {
    status = 'running'
    const cut = int(rng, 0, steps.length - 1)
    for (let j = cut + 1; j < steps.length; j++) {
      steps[j].status = 'skipped'
      steps[j].durationMs = 0
      steps[j].tokensIn = 0
      steps[j].tokensOut = 0
      steps[j].costUsd = 0
      steps[j].io = { input: '—', output: 'pending' }
    }
  } else if (Math.random() < agent.errRate * 1.5) {
    const failure = applyFailure(rng, steps)
    failedStepIndex = failure.failedStepIndex
    status = failure.status
  } else {
    status = 'success'
  }

  const executed = status === 'running' ? steps.filter((s) => s.status !== 'skipped') : status === 'success' ? steps : steps.slice(0, (failedStepIndex ?? steps.length - 1) + 1)
  const totalTokens = executed.reduce((t, s) => t + s.tokensIn + s.tokensOut, 0)
  const costUsd = round(
    executed.reduce((c, s) => c + s.costUsd, 0),
    6,
  )
  const tail = executed[executed.length - 1] ?? steps[0]

  return {
    id: hexId(rng, 'run_', 6),
    agentId: agent.id,
    env: chance(rng, 0.82) ? 'prod' : 'staging',
    status,
    trigger: pick(rng, TRIGGERS),
    startedAt: now - Math.floor(Math.random() * 2500),
    latencyMs: tail.offsetMs + tail.durationMs,
    totalTokens,
    costUsd,
    steps,
    failedStepIndex,
  }
}
