import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { NotificationsBell } from '@/components/notifications-bell'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronDown, ChevronRight, BookOpen, HelpCircle } from 'lucide-react'

interface Section {
  title: string
  content: string
  faqs: { q: string; a: string }[]
}

function parseManual(text: string): Section[] {
  // Split on bold headings (**Heading**) or numbered headings (1. Heading)
  const sections: Section[] = []
  const lines = text.split('\n')
  let current: Section | null = null
  let inFaq = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Match **Heading** or numbered "1. Heading"
    const boldHeading = line.match(/^\*\*(.+?)\*\*\s*$/)
    const numberedHeading = line.match(/^(\d+)\.\s+(.+)/)
    const heading = boldHeading?.[1] || numberedHeading?.[2]

    if (heading) {
      if (current) sections.push(current)
      current = { title: heading, content: '', faqs: [] }
      inFaq = false
      continue
    }

    if (!current) {
      // text before first heading goes into an intro section
      current = { title: 'Overview', content: '', faqs: [] }
    }

    // Detect FAQ blocks — numbered bold like **1. Question?** or plain Q:
    const faqBold = line.match(/^\*\*(\d+)\.\s+(.+?)\*\*\s*$/)
    const faqQ = line.match(/^Q:\s*(.+)/)

    if (faqBold) {
      inFaq = true
      current.faqs.push({ q: faqBold[2].trim(), a: '' })
      continue
    }
    if (faqQ) {
      inFaq = true
      current.faqs.push({ q: faqQ[1].trim(), a: '' })
      continue
    }

    if (inFaq && current.faqs.length > 0) {
      const last = current.faqs[current.faqs.length - 1]
      const aMatch = line.match(/^A:\s*(.+)/)
      if (aMatch) { last.a = aMatch[1].trim(); continue }
      if (line.trim()) last.a += (last.a ? ' ' : '') + line.trim()
      continue
    }

    // Regular content — strip markdown bold
    const clean = line.replace(/\*\*/g, '').trim()
    if (clean) current.content += (current.content ? '\n' : '') + clean
  }

  if (current) sections.push(current)
  return sections.filter(s => s.title && (s.content || s.faqs.length > 0))
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className='border-b border-border last:border-0'>
      <button
        onClick={() => setOpen(!open)}
        className='flex w-full items-center justify-between py-3 text-left text-sm font-medium hover:text-primary transition-colors'
      >
        <span>{q}</span>
        {open ? <ChevronDown className='h-4 w-4 shrink-0' /> : <ChevronRight className='h-4 w-4 shrink-0' />}
      </button>
      {open && <p className='pb-3 text-sm text-muted-foreground leading-relaxed'>{a}</p>}
    </div>
  )
}

export function Help() {
  const [sections, setSections] = useState<Section[]>([])
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/manual')
      .then(r => r.json())
      .then(d => {
        if (d.manual) setSections(parseManual(d.manual))
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const section = sections[active]

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
          <BookOpen className='h-5 w-5' />
          <h1 className='text-2xl font-bold tracking-tight'>Help & Documentation</h1>
        </div>
        {loading && (
          <div className='space-y-3'>
            <Skeleton className='h-6 w-48' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-3/4' />
          </div>
        )}
        {error && (
          <Card>
            <CardContent className='pt-6 text-sm text-muted-foreground'>
              Documentation not available yet for this product.
            </CardContent>
          </Card>
        )}
        {!loading && !error && sections.length > 0 && (
          <div className='flex gap-6'>
            <div className='w-56 shrink-0'>
              <Card className='sticky top-4'>
                <CardContent className='p-3'>
                  <nav className='space-y-1'>
                    {sections.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setActive(i)}
                        className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          active === i
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {s.title}
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>
            <div className='flex-1 min-w-0'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BookOpen className='h-4 w-4' />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {section.content && (
                    <div className='text-sm text-muted-foreground leading-relaxed whitespace-pre-line'>
                      {section.content.trim()}
                    </div>
                  )}
                  {section.faqs.length > 0 && (
                    <div className='mt-4'>
                      <div className='flex items-center gap-2 mb-3'>
                        <HelpCircle className='h-4 w-4 text-primary' />
                        <span className='text-sm font-medium'>Common Questions</span>
                      </div>
                      <div className='rounded-lg border border-border px-4'>
                        {section.faqs.map((faq, i) => (
                          <FaqItem key={i} q={faq.q} a={faq.a} />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </Main>
    </>
  )
}
