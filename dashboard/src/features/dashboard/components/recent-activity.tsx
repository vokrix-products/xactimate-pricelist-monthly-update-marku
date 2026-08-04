import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { statuses, severityToBadgeVariant } from '@/features/tasks/data/data'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardStats } from '../data/dashboard'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function AnimatedItem({
  children,
  delay = 0,
}: {
  children: React.ReactNode
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-500 ease-out',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      )}
    >
      {children}
    </div>
  )
}

export function RecentActivity() {
  const { data, isLoading } = useDashboardStats()

  if (isLoading) {
    return (
      <div className='space-y-3'>
        {[1,2,3].map(i => (
          <div key={i} className='flex items-center justify-between gap-4'>
            <div className='space-y-1.5'>
              <Skeleton className='h-3.5 w-32' />
              <Skeleton className='h-3 w-16' />
            </div>
            <Skeleton className='h-6 w-16 rounded-full' />
          </div>
        ))}
      </div>
    )
  }

  if (!data || data.recent.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-[140px] gap-2 text-center'>
        <svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='text-muted-foreground/40'>
          <circle cx='12' cy='12' r='10'/><path d='M12 6v6l4 2'/>
        </svg>
        <p className='text-sm text-muted-foreground'>No activity yet.</p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {data.recent.map((record, i) => {
        const statusDef = statuses.find((s) => s.value === record.status)
        const severity = statusDef?.severity ?? 'neutral'
        const badgeVariant = severityToBadgeVariant[severity]
        return (
          <AnimatedItem key={record.id} delay={i * 80}>
            <div className='flex items-center justify-between gap-4 rounded-md border border-transparent px-1 py-0.5 transition-colors hover:border-border hover:bg-muted/30'>
              <div className='space-y-0.5'>
                <p className='text-sm leading-none font-medium tracking-tight'>{record.title}</p>
                <p className='text-xs text-muted-foreground'>
                  {formatDate(record.created_at)}
                </p>
              </div>
              <Badge variant={badgeVariant}>
                {statusDef?.label ?? record.status}
              </Badge>
            </div>
          </AnimatedItem>
        )
      })}
    </div>
  )
}
