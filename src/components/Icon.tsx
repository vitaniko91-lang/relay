import type { ReactNode } from 'react'
import { cx } from '../lib/cx'

/**
 * A small, coherent stroke-icon set (geometry from the Lucide icon family in
 * the Iconify catalog, MIT). Inlined so the runtime carries no icon dependency
 * and every glyph shares one 24×24 stroke grid. `currentColor` throughout.
 */
export type IconName =
  | 'dashboard'
  | 'runs'
  | 'evals'
  | 'alerts'
  | 'check'
  | 'x'
  | 'clock'
  | 'loader'
  | 'search'
  | 'filter'
  | 'sort'
  | 'chevronRight'
  | 'chevronDown'
  | 'arrowRight'
  | 'externalLink'
  | 'router'
  | 'retrieval'
  | 'llm'
  | 'tool'
  | 'guard'
  | 'activity'
  | 'alert'
  | 'coins'
  | 'gauge'

const PATHS: Record<IconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="8" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="15" width="7" height="6" rx="1" />
    </>
  ),
  runs: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  evals: <path d="M3 3v18h18M19 9l-5 5-4-4-3 3" />,
  alerts: <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />,
  check: <path d="M20 6 9 17l-5-5" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  loader: <path d="M21 12a9 9 0 1 1-6.219-8.56" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  filter: <path d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />,
  sort: <path d="m7 15 5 5 5-5M7 9l5-5 5 5" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  arrowRight: <path d="M5 12h14M13 5l7 7-7 7" />,
  externalLink: <path d="M15 3h6v6M10 14 20.5 3.5M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />,
  router: (
    <>
      <circle cx="6" cy="19" r="2.5" />
      <circle cx="18" cy="5" r="2.5" />
      <path d="M6 16.5V9a3 3 0 0 1 3-3h6.5" />
    </>
  ),
  retrieval: (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </>
  ),
  llm: <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5 10.1 11.9 4.5 10l5.6-1.4L12 3z" />,
  tool: <path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L3.5 17.5 6.5 20.5l6-6a4 4 0 0 0 5.2-5.2l-2.6 2.6-2.4-.4-.4-2.4 2.4-2.6z" />,
  guard: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3zM9 12l2 2 4-4" />,
  activity: <path d="M22 12h-4l-3 8-6-16-3 8H2" />,
  alert: <path d="M10.3 4 3 17a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01" />,
  coins: (
    <>
      <ellipse cx="9" cy="7" rx="6" ry="3" />
      <path d="M3 7v5c0 1.66 2.69 3 6 3M15 8.13c1.8.42 3 1.28 3 2.37v5c0 1.66-2.69 3-6 3-1.28 0-2.47-.2-3.45-.55" />
    </>
  ),
  gauge: <path d="M12 15l4-4M20 20a9 9 0 1 0-16 0M12 15a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />,
}

interface IconProps {
  name: IconName
  size?: number
  className?: string
  strokeWidth?: number
}

export function Icon({ name, size = 16, className, strokeWidth = 1.9 }: IconProps) {
  const spin = name === 'loader'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx(spin && 'animate-spin motion-reduce:animate-none', className)}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
