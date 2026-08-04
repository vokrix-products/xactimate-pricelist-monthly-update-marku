import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/(auth)/auth-callback')({
  component: AuthCallback,
})

function AuthCallback() {
  const navigate = useNavigate()
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    // console.log('tokens:', !!access_token, !!refresh_token)
    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token })
        .then(({ data }) => {
          if (data.session) navigate({ to: '/' })
          else navigate({ to: '/sign-up' })
        })
    } else {
      navigate({ to: '/sign-up' })
    }
  }, [navigate])
  return (
    <div className='flex h-screen items-center justify-center'>
      <p className='text-muted-foreground'>Signing you in...</p>
    </div>
  )
}
