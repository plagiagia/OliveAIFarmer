/**
 * Centralized urgency styling for AI / smart recommendations.
 * Imported by AIGeoponosTab, DashboardAIGeoponos, and any future
 * insight / chat surface so colors stay consistent.
 */
import { AlertTriangle, Clock, Lightbulb, type LucideIcon } from 'lucide-react'

export type Urgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface UrgencyStyle {
  bg: string
  border: string
  badge: string
  icon: LucideIcon
  iconColor: string
  label: string
}

export const URGENCY_CONFIG: Record<Urgency, UrgencyStyle> = {
  CRITICAL: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
    icon: AlertTriangle,
    iconColor: 'text-red-600',
    label: 'Κρίσιμο',
  },
  HIGH: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-800',
    icon: AlertTriangle,
    iconColor: 'text-orange-600',
    label: 'Υψηλή',
  },
  MEDIUM: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    iconColor: 'text-yellow-600',
    label: 'Μέτρια',
  },
  LOW: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
    icon: Lightbulb,
    iconColor: 'text-blue-600',
    label: 'Χαμηλή',
  },
}
