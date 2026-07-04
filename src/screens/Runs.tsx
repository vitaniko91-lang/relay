import { useMemo, useState } from 'react'
import { dataset } from '../lib/dataset'
import { filterRuns, sortRuns, type RunFilters, type SortDir, type SortKey } from '../data/selectors'
import type { RunStatus } from '../data/types'
import { formatCost, formatDuration, formatTokens, relativeTime } from '../data/format'
import { Card, Select, StateBlock, Mono, Tag } from '../components/primitives'
import { Icon } from '../components/Icon'
import { StatusBadge } from '../components/status'
import { cx } from '../lib/cx'

const COLS = 'grid-cols-[7rem_minmax(11rem,2fr)_6rem_6.5rem_6rem_6rem_7rem]'
const PAGE = 50

interface SortHeaderProps {
  label: string
  col: SortKey
  active: SortKey
  dir: SortDir
  onSort: (k: SortKey) => void
  align?: 'left' | 'right'
}

function SortHeader({ label, col, active, dir, onSort, align = 'left' }: SortHeaderProps) {
  const isActive = active === col
  return (
    <button
      onClick={() => onSort(col)}
      className={cx(
        'flex items-center gap-1 text-2xs font-semibold uppercase tracking-[0.12em] transition-colors hover:text-ink',
        isActive ? 'text-ink' : 'text-ink-faint',
        align === 'right' && 'justify-end',
      )}
    >
      {align === 'right' && <SortGlyph active={isActive} dir={dir} />}
      {label}
      {align === 'left' && <SortGlyph active={isActive} dir={dir} />}
    </button>
  )
}

function SortGlyph({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <Icon name="sort" size={12} className="text-ink-dim" />
  return <Icon name="chevronDown" size={12} className={cx('text-accent transition-transform', dir === 'asc' && 'rotate-180')} />
}

export function Runs({ initialAgent, initialStatus }: { initialAgent?: string; initialStatus?: string }) {
  const [filters, setFilters] = useState<RunFilters>({
    status: (initialStatus as RunStatus) ?? 'all',
    agentId: initialAgent ?? 'all',
    trigger: 'all',
    env: 'all',
    query: '',
  })
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'startedAt', dir: 'desc' })
  const [limit, setLimit] = useState(PAGE)

  const filtered = useMemo(() => filterRuns(dataset.runs, filters, dataset.agents), [filters])
  const sorted = useMemo(() => sortRuns(filtered, sort.key, sort.dir), [filtered, sort])
  const visible = sorted.slice(0, limit)

  function set<K extends keyof RunFilters>(key: K, value: RunFilters[K]) {
    setFilters((f) => ({ ...f, [key]: value }))
    setLimit(PAGE)
  }
  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))
  }
  const active = filters.status !== 'all' || filters.agentId !== 'all' || filters.trigger !== 'all' || filters.env !== 'all' || !!filters.query
  function clear() {
    setFilters({ status: 'all', agentId: 'all', trigger: 'all', env: 'all', query: '' })
    setLimit(PAGE)
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative flex items-center">
          <Icon name="search" size={14} className="pointer-events-none absolute left-2.5 text-ink-faint" />
          <input
            value={filters.query}
            onChange={(e) => set('query', e.target.value)}
            placeholder="Search run id or agent…"
            aria-label="Search runs"
            className="h-8 w-56 rounded-control border border-line bg-bg-raised pl-8 pr-3 text-xs text-ink placeholder:text-ink-dim hover:border-line-strong focus-visible:border-accent/50"
          />
        </label>
        <Select icon="filter" value={filters.status} onChange={(e) => set('status', e.target.value as RunFilters['status'])} aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
          <option value="timeout">Timeout</option>
          <option value="running">Running</option>
        </Select>
        <Select value={filters.agentId} onChange={(e) => set('agentId', e.target.value)} aria-label="Filter by agent">
          <option value="all">All agents</option>
          {dataset.agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        <Select value={filters.trigger} onChange={(e) => set('trigger', e.target.value as RunFilters['trigger'])} aria-label="Filter by trigger">
          <option value="all">All triggers</option>
          <option value="schedule">Schedule</option>
          <option value="api">API</option>
          <option value="manual">Manual</option>
          <option value="webhook">Webhook</option>
        </Select>
        <Select value={filters.env} onChange={(e) => set('env', e.target.value as RunFilters['env'])} aria-label="Filter by environment">
          <option value="all">All envs</option>
          <option value="prod">Production</option>
          <option value="staging">Staging</option>
        </Select>
        {active && (
          <button onClick={clear} className="flex items-center gap-1 rounded-control px-2 py-1.5 text-xs font-medium text-ink-faint hover:text-ink">
            <Icon name="x" size={12} /> Clear
          </button>
        )}
        <span className="ml-auto text-xs text-ink-faint">
          <span className="tnum font-medium text-ink-soft">{filtered.length}</span> of {dataset.runs.length} runs
        </span>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[52rem]">
            {/* header */}
            <div className={cx('grid gap-4 border-b border-line px-4 py-2.5', COLS)}>
              <SortHeader label="Status" col="status" active={sort.key} dir={sort.dir} onSort={toggleSort} />
              <SortHeader label="Agent" col="agentId" active={sort.key} dir={sort.dir} onSort={toggleSort} />
              <span className="text-2xs font-semibold uppercase tracking-[0.12em] text-ink-faint">Trigger</span>
              <SortHeader label="Latency" col="latencyMs" active={sort.key} dir={sort.dir} onSort={toggleSort} align="right" />
              <SortHeader label="Tokens" col="totalTokens" active={sort.key} dir={sort.dir} onSort={toggleSort} align="right" />
              <SortHeader label="Cost" col="costUsd" active={sort.key} dir={sort.dir} onSort={toggleSort} align="right" />
              <SortHeader label="Started" col="startedAt" active={sort.key} dir={sort.dir} onSort={toggleSort} align="right" />
            </div>

            {filtered.length === 0 ? (
              <StateBlock icon="search" title="No runs match these filters" hint="Try widening the status or agent filter, or clearing your search." />
            ) : (
              <ul>
                {visible.map((run) => {
                  const agent = dataset.agents.find((a) => a.id === run.agentId)
                  return (
                    <li key={run.id} className="border-b border-line-soft last:border-0">
                      <a href={`#/runs/${run.id}`} className={cx('grid items-center gap-4 px-4 py-2.5 transition-colors hover:bg-white/[0.03] focus-visible:bg-white/[0.03]', COLS)}>
                        <div>
                          <StatusBadge status={run.status} size="sm" />
                        </div>
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-medium text-ink">{agent?.name}</span>
                          {run.env === 'staging' && <Tag className="shrink-0">staging</Tag>}
                          <Mono className="shrink-0 text-ink-dim">{run.id}</Mono>
                        </div>
                        <div className="text-xs capitalize text-ink-soft">{run.trigger}</div>
                        <div className="tnum text-right text-sm text-ink-soft">{formatDuration(run.latencyMs)}</div>
                        <div className="tnum text-right text-sm text-ink-soft">{formatTokens(run.totalTokens)}</div>
                        <div className="tnum text-right text-sm text-ink-soft">{formatCost(run.costUsd)}</div>
                        <div className="tnum text-right text-xs text-ink-faint">{relativeTime(run.startedAt, dataset.now)}</div>
                      </a>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {visible.length < filtered.length && (
          <div className="border-t border-line p-3 text-center">
            <button onClick={() => setLimit((l) => l + PAGE)} className="rounded-control border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-line-strong hover:text-ink">
              Load {Math.min(PAGE, filtered.length - visible.length)} more
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}
