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
  color?: 'green' | 'blue' | 'amber' | 'purple' | 'gray'
}

const colorStyles = {
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-600',
    trend: 'text-green-600'
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    trend: 'text-blue-600'
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-100 text-amber-600',
    trend: 'text-amber-600'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-100 text-purple-600',
    trend: 'text-purple-600'
  },
  gray: {
    bg: 'bg-gray-50',
    icon: 'bg-gray-100 text-gray-600',
    trend: 'text-gray-600'
  }
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'green'
}: StatsCardProps) {
  const styles = colorStyles[color]

  return (
    <div className={cn(
      'rounded-2xl p-5 transition-all hover:shadow-md',
      styles.bg
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-gray-500 font-normal">vs πέρυσι</span>
            </div>
          )}
        </div>
        <div className={cn(
          'flex items-center justify-center w-12 h-12 rounded-xl',
          styles.icon
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}
