import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { statuses, severityToBadgeVariant } from '@/features/tasks/data/data'
import { useDashboardStats } from '../data/dashboard'

function formatDaysUntil(iso: string): { label: string; urgent: boolean } {
  const diffDays = Math.ceil(
    (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  if (diffDays === 0) return { label: 'Today', urgent: true }
  if (diffDays === 1) return { label: 'Tomorrow', urgent: true }
  if (diffDays <= 7) return { label: `${diffDays}d`, urgent: true }
  if (diffDays <= 30) return { label: `${diffDays}d`, urgent: false }
  const date = new Date(iso)
  return {
    label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    urgent: false,
  }
}

export function UpcomingExpirations() {
  const { data, isLoading } = useDashboardStats()

  if (isLoading) {
    return (
      <div className='space-y-2'>
        {[1,2,3].map(i => (
          <div key={i} className='flex items-center justify-between rounded-md border px-3 py-2'>
            <div className='flex items-center gap-3'>
              <Skeleton className='h-3 w-10' />
              <Skeleton className='h-3 w-40' />
            </div>
            <Skeleton className='h-6 w-16 rounded-full' />
          </div>
        ))}
      </div>
    )
  }

  const items = data?.upcomingExpirations ?? []

  if (items.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-8 gap-2 text-center'>
        <svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='text-muted-foreground/40'>
          <path d='M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'/>
        </svg>
        <p className='text-sm text-muted-foreground'>Nothing expiring in the next 90 days.</p>
      </div>
    )
  }

  return (
    <div className='space-y-2'>
      {items.map((record) => {
        const statusDef = statuses.find((s) => s.value === record.status)
        const severity = statusDef?.severity ?? 'neutral'
        const badgeVariant = severityToBadgeVariant[severity]
        const { label: daysLabel, urgent } = formatDaysUntil(record.due_date)

        return (
          <div
            key={record.id}
            className='flex items-center justify-between rounded-md border px-3 py-2'
          >
            <div className='flex items-center gap-3 min-w-0'>
              <span
                className={
                  urgent
                    ? 'text-xs font-semibold text-destructive w-16 shrink-0'
                    : 'text-xs font-medium text-muted-foreground w-16 shrink-0'
                }
              >
                {daysLabel}
              </span>
              <span className='text-sm font-medium truncate'>
                {record.title}
              </span>
            </div>
            <Badge variant={badgeVariant} className='ml-2 shrink-0'>
              {statusDef?.label ?? record.status}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}
