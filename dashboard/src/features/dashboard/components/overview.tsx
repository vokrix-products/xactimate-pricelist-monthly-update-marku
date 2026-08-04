import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { statuses } from '@/features/tasks/data/data'
import { useDashboardStats } from '../data/dashboard'

// Maps severity to a CSS variable color for the chart bars
function severityToFill(status: string): string {
  const def = statuses.find((s) => s.value === status)
  const severity = def?.severity ?? 'neutral'
  switch (severity) {
    case 'critical': return 'var(--color-destructive)'
    case 'warning':  return 'var(--color-warning)'
    case 'good':     return 'var(--color-success)'
    default:         return 'var(--color-muted-foreground)'
  }
}

export function Overview() {
  const { data, isLoading } = useDashboardStats()

  if (isLoading) {
    return (
      <div className='space-y-3 px-2 pt-4'>
        <div className='flex items-end gap-3 h-[200px]'>
          <Skeleton className='w-full rounded-md' style={{height: '60%'}} />
          <Skeleton className='w-full rounded-md' style={{height: '90%'}} />
          <Skeleton className='w-full rounded-md' style={{height: '40%'}} />
          <Skeleton className='w-full rounded-md' style={{height: '75%'}} />
        </div>
        <div className='flex gap-3'>
          <Skeleton className='h-3 w-16' />
          <Skeleton className='h-3 w-16' />
          <Skeleton className='h-3 w-16' />
          <Skeleton className='h-3 w-16' />
        </div>
      </div>
    )
  }

  if (!data || data.statusCounts.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-[200px] gap-2 text-center'>
        <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='text-muted-foreground/40'>
          <rect x='3' y='3' width='18' height='18' rx='2'/><path d='M3 9h18M9 21V9'/>
        </svg>
        <p className='text-sm text-muted-foreground'>No data yet — upload a file to see your breakdown.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={data.statusCounts}>
        <XAxis
          dataKey='status'
          tickFormatter={(value) => {
            const def = statuses.find((s) => s.value === value)
            return def?.label ?? value
          }}
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Bar dataKey='count' radius={[4, 4, 0, 0]}>
          {data.statusCounts.map((entry) => (
            <Cell
              key={entry.status}
              fill={severityToFill(entry.status)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
