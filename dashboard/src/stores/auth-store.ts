import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface AuthUser {
  id: string
  email: string
  customer_id: string
  product_id: string
}

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    isLoading: boolean
    setLoading: (loading: boolean) => void
    reset: () => void
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  auth: {
    user: null,
    isLoading: true,
    setUser: (user) =>
      set((state) => ({ ...state, auth: { ...state.auth, user } })),
    setLoading: (isLoading) =>
      set((state) => ({ ...state, auth: { ...state.auth, isLoading } })),
    reset: () =>
      set((state) => ({ ...state, auth: { ...state.auth, user: null } })),
  },
}))

// PRODUCT_CUSTOMIZE: customer_id and product_id come from the user's
// app_metadata, set at signup time (Stripe webhook -> Supabase admin API
// sets these claims once a subscription is confirmed active).
export async function syncAuthFromSession() {
  const { data } = await supabase.auth.getSession()
  const session = data.session
  const store = useAuthStore.getState().auth
  if (!session) {
    store.setUser(null)
    store.setLoading(false)
    return
  }
  const meta = session.user.app_metadata
  store.setUser({
    id: session.user.id,
    email: session.user.email ?? '',
    customer_id: meta.customer_id ?? '',
    product_id: meta.product_id ?? '',
  })
  store.setLoading(false)
}
