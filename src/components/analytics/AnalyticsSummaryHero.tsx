'use client'

import { cn } from '@/lib/utils'
import { TrendingDown, TrendingUp } from 'lucide-react'

function formatEuro(amount: number): string {
  const abs = Math.abs(amount)
  if (abs >= 1000) {
    return `€${(amount / 1000).toFixed(1)}k`
  }
  return `€${amount.toLocaleString('el-GR')}`
}

function profitChangeFromTimeline(
  timeline: Array<{ year: number; profit: number }>
): { value: number; isPositive: boolean; compareYear: number } | null {
  if (timeline.length < 2) return null
  const sorted = [...timeline].sort((a, b) => a.year - b.year)
  const prev = sorted[sorted.length - 2]
  const current = sorted[sorted.length - 1]
  const base = Math.abs(prev.profit)
  if (base === 0 && current.profit === 0) return null
  const change =
    base > 0 ? ((current.profit - prev.profit) / base) * 100 : current.profit > 0 ? 100 : -100
  return {
    value: Math.round(Math.abs(change)),
    isPositive: change >= 0,
    compareYear: prev.year
  }
}

interface AnalyticsSummaryHeroProps {
  netProfit: number
  totalHarvestValue: number
  totalCosts: number
  profitMargin: number
  profitabilityTimeline: Array<{
    year: number
    revenue: number
    costs: number
    profit: number
  }>
  yearOverYearComparison: {
    currentYear: number
    previousYear: number
    revenueChange: number
  } | null
}

export function AnalyticsSummaryHero({
  netProfit,
  totalHarvestValue,
  totalCosts,
  profitMargin,
  profitabilityTimeline,
  yearOverYearComparison
}: AnalyticsSummaryHeroProps) {
  const profitTrend = profitChangeFromTimeline(profitabilityTimeline)
  const isProfitable = netProfit >= 0

  return (
    <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-medium text-gray-500">Οικονομική σύνοψη</p>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-gray-600">Καθαρό κέρδος</p>
          <p
            className={cn(
              'mt-1 text-3xl font-bold tracking-tight sm:text-4xl',
              isProfitable ? 'text-olive-800' : 'text-red-700'
            )}
          >
            {formatEuro(netProfit)}
          </p>
          {profitTrend && (
            <div
              className={cn(
                'mt-2 inline-flex items-center gap-1.5 text-sm font-medium',
                profitTrend.isPositive ? 'text-olive-700' : 'text-red-600'
              )}
            >
              {profitTrend.isPositive ? (
                <TrendingUp className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <TrendingDown className="h-4 w-4 shrink-0" aria-hidden />
              )}
              <span>
                {profitTrend.isPositive ? '+' : '−'}
                {profitTrend.value}% έναντι {profitTrend.compareYear}
              </span>
            </div>
          )}
        </div>

        {yearOverYearComparison && Math.abs(yearOverYearComparison.revenueChange) >= 0.1 && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
            <p className="text-gray-500">Έσοδα {yearOverYearComparison.currentYear}</p>
            <p className="mt-0.5 font-semibold text-gray-900">
              {yearOverYearComparison.revenueChange >= 0 ? '+' : ''}
              {yearOverYearComparison.revenueChange.toFixed(1)}%{' '}
              <span className="font-normal text-gray-500">
                vs {yearOverYearComparison.previousYear}
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-100 pt-6 sm:grid-cols-3">
        <div>
          <p className="text-sm text-gray-500">Έσοδα</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            {formatEuro(totalHarvestValue)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Έξοδα</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">{formatEuro(totalCosts)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Περιθώριο κέρδους</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            {profitMargin.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  )
}
