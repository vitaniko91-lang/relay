import type { ReactNode } from 'react'
import { Card, Overline } from './primitives'
import { Icon, type IconName } from './Icon'
import { cx } from '../lib/cx'

export interface Trend {
  label: string
  tone: 'good' | 'bad' | 'neutral'
  dir: 'up' | 'down' | 'flat'
}

const TONE: Record<Trend['tone'], string> = {
  good: 'text-ok',
  bad: 'text-err',
  neutral: 'text-ink-faint',
}

/** A single metric tile: label + big value + optional trend chip + a footer
 *  slot (sparkline or custom content). */
export function StatCard({
  label,
  value,
  unit,
  icon,
  trend,
  footer,
}: {
  label: string
  value: ReactNode
  unit?: string
  icon: IconName
  trend?: Trend
  footer?: ReactNode
}) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <Overline>{label}</Overline>
        <Icon name={icon} size={15} className="text-ink-dim" />
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="tnum text-[1.6rem] font-semibold leading-none tracking-tight text-ink">
          {value}
          {unit && <span className="ml-1 text-sm font-medium text-ink-faint">{unit}</span>}
        </div>
        {trend && (
          <span className={cx('mb-0.5 flex items-center gap-0.5 text-xs font-medium', TONE[trend.tone])}>
            {trend.dir !== 'flat' && (
              <Icon name="arrowRight" size={12} className={trend.dir === 'up' ? '-rotate-45' : 'rotate-45'} />
            )}
            {trend.label}
          </span>
        )}
      </div>
      {footer && <div className="mt-auto">{footer}</div>}
    </Card>
  )
}
