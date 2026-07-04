// Domain model for Relay — a team's fleet of AI agents running in production,
// the runs they produce, and the step-by-step trace inside each run.

export type RunStatus = 'success' | 'error' | 'timeout' | 'running'

export type RunTrigger = 'schedule' | 'api' | 'manual' | 'webhook'

export type Env = 'prod' | 'staging'

/** The kinds of steps that make up an agent run's trace. */
export type StepKind = 'router' | 'retrieval' | 'llm' | 'tool' | 'guard'

export type StepStatus = 'ok' | 'error' | 'skipped'

export interface Agent {
  id: string // slug, e.g. "support-triage"
  name: string // display, e.g. "Support Triage"
  model: string // e.g. "gpt-4o-mini"
  blurb: string // one-line description
}

export interface Step {
  id: string
  kind: StepKind
  name: string // e.g. "vector.search", "openai.chat", "crm.lookup"
  status: StepStatus
  offsetMs: number // start offset from the run's start
  durationMs: number
  tokensIn: number // 0 for non-LLM steps
  tokensOut: number
  costUsd: number
  /** Present only on the failing step. */
  error?: {
    type: string // e.g. "ToolTimeout", "RateLimited", "GuardrailBlocked"
    message: string
  }
  /** Compact input/output previews shown when a step is expanded. */
  io: {
    input: string
    output: string
  }
}

export interface Run {
  id: string // e.g. "run_8f3a2c"
  agentId: string
  env: Env
  status: RunStatus
  trigger: RunTrigger
  startedAt: number // epoch ms
  latencyMs: number // total wall time of the run
  totalTokens: number
  costUsd: number
  steps: Step[]
  /** Index into steps of the step that failed; null for non-error runs. */
  failedStepIndex: number | null
}

export interface Dataset {
  /** Reference "now" the runs are anchored to (epoch ms). */
  now: number
  agents: Agent[]
  runs: Run[]
}
