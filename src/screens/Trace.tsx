import { useState } from 'react'
import { dataset } from '../lib/dataset'
import { getRun, getAgent } from '../data/selectors'
import type { Run, Step } from '../data/types'
import { formatCost, formatDuration, formatNumber, formatTokens, relativeTime, formatClock } from '../data/format'
import { Card, Mono, Tag, StateBlock, Overline } from '../components/primitives'
import { Icon } from '../components/Icon'
import { STEP_KIND_META, STEP_KIND_HEX, StatusBadge } from '../components/status'
import { WaterfallBar } from '../components/charts'
import { cx } from '../lib/cx'

export function Trace({ id }: { id: string }) {
  const run = getRun(dataset, id)
  if (!run) {
    return (
      <Card className="mt-6">
        <StateBlock
          icon="alert"
          title="Run not found"
          hint={`No run matches “${id}”. It may have aged out of the 24-hour window.`}
          action={
            <a href="#/runs" className="rounded-control border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink">
              Back to runs
            </a>
          }
        />
      </Card>
    )
  }

  const agent = getAgent(dataset, run.agentId)
  const total = run.latencyMs

  return (
    <div className="space-y-4">
      <RunSummary run={run} agentName={agent?.name ?? run.agentId} model={agent?.model ?? ''} />

      {/* Trace */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Trace</h2>
            <p className="text-xs text-ink-faint">
              {run.steps.filter((s) => s.status !== 'skipped').length} of {run.steps.length} steps · {formatDuration(total)} wall time
            </p>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            {(['router', 'retrieval', 'llm', 'tool', 'guard'] as const).map((k) => (
              <span key={k} className="flex items-center gap-1.5 text-2xs font-medium text-ink-faint">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: STEP_KIND_HEX[k] }} />
                {STEP_KIND_META[k].label}
              </span>
            ))}
          </div>
        </div>

        {/* Time ruler */}
        <div className="hidden px-4 pt-3 sm:block">
          <div className="ml-[3.25rem] flex justify-between font-mono text-2xs text-ink-dim">
            {[0, 0.25, 0.5, 0.75, 1].map((f) => (
              <span key={f}>{formatDuration(total * f)}</span>
            ))}
          </div>
        </div>

        <ol className="p-2 sm:p-3">
          {run.steps.map((step, i) => (
            <TraceStep key={step.id} step={step} total={total} isLast={i === run.steps.length - 1} defaultOpen={run.failedStepIndex === i} />
          ))}
        </ol>
      </Card>
    </div>
  )
}

function RunSummary({ run, agentName, model }: { run: Run; agentName: string; model: string }) {
  const failStep = run.failedStepIndex != null ? run.steps[run.failedStepIndex] : undefined

  return (
    <Card className="p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-semibold tracking-tight text-ink">{agentName}</h2>
            <StatusBadge status={run.status} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
            <Mono className="text-ink-soft">{run.id}</Mono>
            <span className="font-mono">{model}</span>
            <span className="capitalize">via {run.trigger}</span>
            <Tag>{run.env}</Tag>
            <span>
              {relativeTime(run.startedAt, dataset.now)} · {formatClock(run.startedAt)}
            </span>
          </div>
        </div>
        <a href="#/runs" className="flex shrink-0 items-center gap-1 rounded-control border border-line px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:border-line-strong hover:text-ink">
          <Icon name="arrowRight" size={13} className="rotate-180" /> Runs
        </a>
      </div>

      {/* Metrics */}
      <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-control border border-line bg-line sm:grid-cols-4">
        {[
          { label: 'Latency', value: formatDuration(run.latencyMs) },
          { label: 'Tokens', value: formatNumber(run.totalTokens) },
          { label: 'Cost', value: formatCost(run.costUsd) },
          { label: 'Steps', value: `${run.steps.filter((s) => s.status !== 'skipped').length} / ${run.steps.length}` },
        ].map((m) => (
          <div key={m.label} className="bg-bg-raised px-3.5 py-3">
            <Overline>{m.label}</Overline>
            <div className="tnum mt-1 text-lg font-semibold text-ink">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Failure banner */}
      {failStep?.error && (
        <div className="mt-4 flex items-start gap-3 rounded-control border border-err/25 bg-err/[0.07] px-3.5 py-3">
          <Icon name="alert" size={17} className="mt-0.5 shrink-0 text-err" />
          <div className="min-w-0 text-sm">
            <p className="font-medium text-ink">
              Failed at step {(run.failedStepIndex ?? 0) + 1} · <Mono className="text-err">{failStep.name}</Mono>
            </p>
            <p className="mt-0.5 text-ink-soft">
              <span className="font-semibold text-err">{failStep.error.type}</span> — {failStep.error.message}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}

function TraceStep({ step, total, isLast, defaultOpen }: { step: Step; total: number; isLast: boolean; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const meta = STEP_KIND_META[step.kind]
  const skipped = step.status === 'skipped'
  const failed = step.status === 'error'
  const color = failed ? '#F87171' : STEP_KIND_HEX[step.kind]

  return (
    <li className="relative">
      {/* connector */}
      {!isLast && <span className="absolute left-[1.4rem] top-9 bottom-0 w-px bg-line" aria-hidden />}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cx(
          'relative flex w-full items-center gap-3 rounded-control px-2 py-2 text-left transition-colors',
          failed ? 'bg-err/[0.06] hover:bg-err/[0.09]' : 'hover:bg-white/[0.03]',
        )}
      >
        {/* kind badge */}
        <span
          className={cx('z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-control', skipped ? 'bg-bg-raised text-ink-dim ring-1 ring-inset ring-line' : meta.text)}
          style={skipped ? undefined : { background: `${color}1a` }}
        >
          <Icon name={meta.icon} size={15} />
        </span>

        {/* name + waterfall */}
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <Mono className={cx('truncate text-[0.82rem]', skipped ? 'text-ink-dim' : 'text-ink')}>{step.name}</Mono>
              <span className={cx('shrink-0 text-2xs', skipped ? 'text-ink-dim' : 'text-ink-faint')}>{meta.label}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {failed && <Icon name="x" size={13} className="text-err" />}
              {skipped ? (
                <span className="text-2xs text-ink-dim">skipped</span>
              ) : (
                <span className="tnum text-xs font-medium text-ink-soft">{formatDuration(step.durationMs)}</span>
              )}
              <Icon name="chevronDown" size={13} className={cx('text-ink-faint transition-transform', open && 'rotate-180')} />
            </span>
          </span>
          <span className="mt-1.5 block">
            <WaterfallBar offsetMs={step.offsetMs} durationMs={skipped ? 0 : step.durationMs} totalMs={total} color={color} muted={skipped} />
          </span>
        </span>
      </button>

      {/* expanded detail */}
      {open && !skipped && (
        <div className="ml-[2.6rem] mb-1 mt-1 space-y-2 rounded-control border border-line bg-bg-sink/60 p-3 animate-fade-up">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-2xs text-ink-faint">
            <span>start <span className="tnum text-ink-soft">+{formatDuration(step.offsetMs)}</span></span>
            {(step.tokensIn > 0 || step.tokensOut > 0) && (
              <span>
                tokens <span className="tnum text-ink-soft">{formatTokens(step.tokensIn)} in · {formatTokens(step.tokensOut)} out</span>
              </span>
            )}
            {step.costUsd > 0 && <span>cost <span className="tnum text-ink-soft">{formatCost(step.costUsd)}</span></span>}
          </div>
          <IoRow label="input" value={step.io.input} />
          <IoRow label="output" value={step.io.output} tone={failed ? 'error' : 'default'} />
        </div>
      )}
    </li>
  )
}

function IoRow({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'error' }) {
  return (
    <div className="flex gap-2">
      <span className="w-12 shrink-0 select-none pt-0.5 text-2xs uppercase tracking-wider text-ink-dim">{label}</span>
      <code className={cx('block flex-1 overflow-x-auto whitespace-pre-wrap break-words rounded bg-black/30 px-2 py-1.5 font-mono text-2xs leading-relaxed', tone === 'error' ? 'text-err/90' : 'text-ink-soft')}>
        {value}
      </code>
    </div>
  )
}
