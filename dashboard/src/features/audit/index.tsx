import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { NotificationsBell } from '@/components/notifications-bell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase, PRODUCT_ID } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import { ClipboardList, Upload, LogIn, Trash2, Edit, Download } from 'lucide-react'

interface AuditEntry {
  id: number
  action: string
  entity: string | null
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

function actionIcon(action: string) {
  if (action.includes('upload') || action.includes('job')) return <Upload className='h-3.5 w-3.5' />
  if (action.includes('login') || action.includes('sign')) return <LogIn className='h-3.5 w-3.5' />
  if (action.includes('delete')) return <Trash2 className='h-3.5 w-3.5' />
  if (action.includes('update') || action.includes('edit')) return <Edit className='h-3.5 w-3.5' />
  if (action.includes('download') || action.includes('export')) return <Download className='h-3.5 w-3.5' />
  return <ClipboardList className='h-3.5 w-3.5' />
}

function actionLabel(action: string) {
  const map: Record<string, string> = {
    'job.created': 'File uploaded',
    'job.completed': 'Processing complete',
    'job.failed': 'Processing failed',
    'record.deleted': 'Record deleted',
    'record.updated': 'Record updated',
    'session.started': 'Signed in',
    'export.csv': 'Exported CSV',
  }
  return map[action] ?? action
}

function timeFormat(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const user = useAuthStore((s) => s.auth.user)

  useEffect(() => {
    if (!user) return
    supabase
      .from('audit_log')
      .select('id, action, entity, entity_id, metadata, created_at')
      .eq('product_id', PRODUCT_ID)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (data) setEntries(data)
        setLoading(false)
      })
  }, [user])

  return (
    <>
      <Header>
        <Search />
        <ThemeSwitch />
        <NotificationsBell />
        <ProfileDropdown />
      </Header>
      <Main>
        <div className='mb-4 flex items-center gap-2'>
          <ClipboardList className='h-5 w-5' />
          <h1 className='text-2xl font-bold tracking-tight'>Audit Log</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Activity history for your account
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className='space-y-3'>
                {[...Array(5)].map((_, i) => <Skeleton key={i} className='h-10 w-full' />)}
              </div>
            )}
            {!loading && entries.length === 0 && (
              <div className='flex flex-col items-center py-10 text-center'>
                <ClipboardList className='h-8 w-8 text-muted-foreground/40 mb-2' />
                <p className='text-sm text-muted-foreground'>No activity recorded yet.</p>
                <p className='text-xs text-muted-foreground/60 mt-1'>Actions like uploads and sign-ins will appear here.</p>
              </div>
            )}
            {!loading && entries.length > 0 && (
              <div className='space-y-0'>
                {entries.map((e, i) => (
                  <div key={e.id} className={`flex items-start gap-3 py-3 ${i < entries.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className='mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'>
                      {actionIcon(e.action)}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium'>{actionLabel(e.action)}</p>
                      {e.entity && (
                        <p className='text-xs text-muted-foreground truncate'>{e.entity}{e.entity_id ? ` · ${e.entity_id}` : ''}</p>
                      )}
                    </div>
                    <span className='shrink-0 text-xs text-muted-foreground/60'>{timeFormat(e.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
