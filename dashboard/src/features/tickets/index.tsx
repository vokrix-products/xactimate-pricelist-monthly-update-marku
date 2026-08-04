import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { NotificationsBell } from '@/components/notifications-bell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ShineBorder } from '@/components/ui/shine-border'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { AnimatedList } from '@/components/magicui/animated-list'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase, PRODUCT_ID, PRODUCT_NAME } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import { LifeBuoy, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

interface Ticket {
  id: number
  subject: string
  message: string
  priority: string
  status: string
  created_at: string
}

function statusVariant(status: string): 'default' | 'secondary' | 'outline' {
  if (status === 'open') return 'default'
  if (status === 'in_progress') return 'secondary'
  return 'outline'
}

function priorityColor(priority: string) {
  if (priority === 'high') return 'text-destructive'
  if (priority === 'medium') return 'text-warning'
  return 'text-muted-foreground'
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `${days}d ago`
  const hrs = Math.floor(diff / 3600000)
  if (hrs > 0) return `${hrs}h ago`
  return 'just now'
}

export function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('medium')
  const user = useAuthStore((s) => s.auth.user)

  async function fetchTickets() {
    if (!user) return
    const { data } = await supabase
      .from('tickets')
      .select('id, subject, message, priority, status, created_at')
      .eq('product_id', PRODUCT_ID)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setTickets(data)
    setLoading(false)
  }

  useEffect(() => { fetchTickets() }, [user])

  async function handleSubmit() {
    if (!user || !subject.trim() || !message.trim()) return
    setSubmitting(true)
    const { error } = await supabase.from('tickets').insert({
      product_id: PRODUCT_ID,
      customer_id: user.id,
      email: user.email ?? '',
      subject: subject.trim(),
      message: message.trim(),
      priority,
      status: 'open',
    })
    if (error) {
      toast.error('Failed to submit ticket. Please try again.')
    } else {
      toast.success('Ticket submitted! We\'ll get back to you via email.')
      setSubject('')
      setMessage('')
      setPriority('medium')
      setShowForm(false)
      fetchTickets()
      // Also send notification email via billing webhook
      fetch('https://web-production-6adc6.up.railway.app/send-support-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, subject: subject.trim(), message: message.trim(), priority, product_name: PRODUCT_NAME }),
      }).catch(() => {})
    }
    setSubmitting(false)
  }

  return (
    <>
      <Header>
        <Search />
        <ThemeSwitch />
        <NotificationsBell />
        <ProfileDropdown />
      </Header>
      <Main>
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <LifeBuoy className='h-5 w-5' />
            <h1 className='text-2xl font-bold tracking-tight'>Support</h1>
          </div>
          {!showForm && (
            <ShimmerButton
              shimmerColor='#5e6ad2'
              background='rgba(94,106,210,0.08)'
              className='h-9 px-4 text-sm border border-[#5e6ad2]/30 text-foreground'
              onClick={() => setShowForm(true)}
            >
              <Plus className='mr-1.5 h-4 w-4' />
              New ticket
            </ShimmerButton>
          )}
        </div>

        {showForm && (
          <Card className='relative overflow-hidden mb-6'>
            <ShineBorder shineColor={['#5e6ad2', '#a78bfa', '#5e6ad2']} />
            <CardHeader className='flex flex-row items-center justify-between pb-3'>
              <CardTitle className='text-base'>New support ticket</CardTitle>
              <button onClick={() => setShowForm(false)} className='text-muted-foreground hover:text-foreground'>
                <X className='h-4 w-4' />
              </button>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Input
                placeholder='Subject'
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
              <Textarea
                placeholder='Describe your issue in detail...'
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
              <div className='flex items-center gap-3'>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className='w-36'>
                    <SelectValue placeholder='Priority' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='low'>Low</SelectItem>
                    <SelectItem value='medium'>Medium</SelectItem>
                    <SelectItem value='high'>High</SelectItem>
                  </SelectContent>
                </Select>
                <ShimmerButton
                  shimmerColor='#5e6ad2'
                  background='rgba(94,106,210,0.08)'
                  className='h-9 px-6 text-sm border border-[#5e6ad2]/30 text-foreground'
                  onClick={handleSubmit}
                  disabled={submitting || !subject.trim() || !message.trim()}
                >
                  {submitting ? 'Submitting...' : 'Submit ticket'}
                </ShimmerButton>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className='space-y-3'>
            {[...Array(3)].map((_, i) => <Skeleton key={i} className='h-20 w-full' />)}
          </div>
        )}

        {!loading && tickets.length === 0 && !showForm && (
          <Card>
            <CardContent className='flex flex-col items-center py-12 text-center'>
              <LifeBuoy className='h-10 w-10 text-muted-foreground/40 mb-3' />
              <p className='text-sm font-medium'>No support tickets yet</p>
              <p className='text-xs text-muted-foreground mt-1'>Create a ticket and we'll get back to you via email.</p>
            </CardContent>
          </Card>
        )}

        {!loading && tickets.length > 0 && (
          <AnimatedList delay={100} className='gap-3 items-stretch'>
            {tickets.map(ticket => (
              <div key={ticket.id} className='w-full rounded-lg border border-border bg-card px-4 py-3 flex items-start gap-3'>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <p className='text-sm font-medium truncate'>{ticket.subject}</p>
                    <Badge variant={statusVariant(ticket.status)} className='shrink-0 text-xs'>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className='text-xs text-muted-foreground line-clamp-2'>{ticket.message}</p>
                </div>
                <div className='shrink-0 text-right'>
                  <p className={`text-xs font-medium ${priorityColor(ticket.priority)}`}>{ticket.priority}</p>
                  <p className='text-xs text-muted-foreground mt-0.5'>{timeAgo(ticket.created_at)}</p>
                </div>
              </div>
            ))}
          </AnimatedList>
        )}
      </Main>
    </>
  )
}
