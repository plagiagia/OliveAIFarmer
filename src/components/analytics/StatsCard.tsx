'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  /** @deprecated Use neutral cards; only valueTone applies semantic color to the number */
  color?: 'green' | 'blue' | 'amber' | 'purple' | 'gray' | 'red'
  valueTone?: 'neutral' | 'positive' | 'negative'
  /** Full value for hover tooltip when `value` is abbreviated */
  valueTitle?: string
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  valueTone = 'neutral',
  valueTitle
}: StatsCardProps) {
  const valueColorClass =
    valueTone === 'positive'
      ? 'text-olive-800'
      : valueTone === 'negative'
        ? 'text-red-700'
        : 'text-gray-900'

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-center gap-2">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600"
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </div>
        <p className="min-w-0 flex-1 text-sm font-medium leading-tight text-gray-500">{title}</p>
      </div>

      <p
        className={cn(
          'break-words text-lg font-bold leading-tight tabular-nums tracking-tight',
          valueColorClass
        )}
        title={valueTitle ?? (typeof value === 'string' ? value : String(value))}
      >
        {value}
      </p>

      {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}

      {trend && (
        <p
          className={cn(
            'mt-2 text-xs font-medium leading-snug',
            trend.isPositive ? 'text-olive-700' : 'text-red-600'
          )}
        >
          <span aria-hidden>{trend.isPositive ? '↑ ' : '↓ '}</span>
          {Math.abs(trend.value)}%{' '}
          <span className="font-normal text-gray-500">vs πέρυσι</span>
        </p>
      )}
    </div>
  )
}
