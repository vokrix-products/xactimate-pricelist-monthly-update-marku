import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { supabase, PRODUCT_ID } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'

interface Notification {
  id: number
  title: string
  body: string | null
  type: string
  read: boolean
  created_at: string
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function typeColor(type: string) {
  if (type === 'success') return 'bg-success'
  if (type === 'error') return 'bg-destructive'
  if (type === 'warning') return 'bg-warning'
  return 'bg-primary'
}

export function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const user = useAuthStore((s) => s.auth.user)

  async function fetchNotifications() {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('id, title, body, type, read, created_at')
      .eq('product_id', PRODUCT_ID)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setNotifications(data)
  }

  async function markAllRead() {
    if (!user) return
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 30s
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    if (open) markAllRead()
  }, [open])

  const unread = notifications.filter(n => !n.read).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='icon' className='relative'>
          <Bell className='h-5 w-5' />
          {unread > 0 && (
            <span className='absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground'>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-80 p-0'>
        <div className='flex items-center justify-between border-b px-4 py-3'>
          <span className='text-sm font-semibold'>Notifications</span>
          {notifications.length > 0 && (
            <button
              onClick={markAllRead}
              className='text-xs text-muted-foreground hover:text-foreground transition-colors'
            >
              Mark all read
            </button>
          )}
        </div>
        <div className='max-h-80 overflow-y-auto'>
          {notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <Bell className='h-8 w-8 text-muted-foreground/40 mb-2' />
              <p className='text-sm text-muted-foreground'>No notifications yet</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`flex gap-3 px-4 py-3 border-b last:border-0 transition-colors ${!n.read ? 'bg-muted/40' : ''}`}
              >
                <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${typeColor(n.type)}`} />
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium leading-tight'>{n.title}</p>
                  {n.body && <p className='text-xs text-muted-foreground mt-0.5'>{n.body}</p>}
                  <p className='text-xs text-muted-foreground/60 mt-1'>{timeAgo(n.created_at)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
