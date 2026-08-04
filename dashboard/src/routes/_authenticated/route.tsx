import { createFileRoute, redirect } from '@tanstack/react-router'
import { syncAuthFromSession } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      throw redirect({ to: '/sign-up' })
    }
    await syncAuthFromSession()
    // Cross-product login guard: if user is paid for a different product, sign out
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData.session) {
      const meta = sessionData.session.user.app_metadata
      const userProductId = meta.product_id ?? ''
      const thisProductId = import.meta.env.VITE_PRODUCT_ID as string
      if (userProductId && userProductId !== thisProductId) {
        await supabase.auth.signOut()
        throw redirect({ to: '/sign-up' })
      }
    }
    // Write audit log for session start (once per browser session)
    const auditKey = `audit_session_${data.session.user.id}`
    if (!sessionStorage.getItem(auditKey)) {
      sessionStorage.setItem(auditKey, '1')
      void supabase.from('audit_log').insert({
        product_id: import.meta.env.VITE_PRODUCT_ID,
        customer_id: data.session.user.id,
        action: 'session.started',
        entity: 'auth',
        entity_id: data.session.user.id,
      })
    }
    // Fire welcome email once per user (magic link confirmation)
    const welcomeKey = `welcome_sent_${data.session.user.email}`
    if (!localStorage.getItem(welcomeKey)) {
      localStorage.setItem(welcomeKey, '1')
      fetch('https://web-production-6adc6.up.railway.app/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.session.user.email,
          product_name: (import.meta.env.VITE_PRODUCT_NAME as string),
          dashboard_url: window.location.origin,
        }),
      }).catch(() => {})
    }
  },
  component: AuthenticatedLayout,
})
