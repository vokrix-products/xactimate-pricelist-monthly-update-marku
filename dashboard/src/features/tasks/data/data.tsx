import { CircleCheckBig, TriangleAlert } from 'lucide-react'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success'

export const statuses = [
  {
    label: 'Current',
    value: 'current:good',
    icon: CircleCheckBig,
    severity: 'good',
  },
  {
    label: 'Outdated',
    value: 'outdated:critical',
    icon: TriangleAlert,
    severity: 'critical',
  },
]

export const severityToBadgeVariant: Record<string, BadgeVariant> = {
  good: 'success',
  warning: 'warning',
  critical: 'destructive',
  neutral: 'secondary',
}
