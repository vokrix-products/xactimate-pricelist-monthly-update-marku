import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string)
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string)

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { flowType: "implicit", detectSessionInUrl: true } })

// PRODUCT_CUSTOMIZE: every product deployment sets this at provisioning
// time (Job Registry writes it as a Vercel env var for that product's
// project). Used to scope every query/RLS check to this specific product.
export const PRODUCT_ID = import.meta.env.VITE_PRODUCT_ID as string

// PRODUCT_CUSTOMIZE: display name shown in the sidebar header for this
// product (e.g. "COI Compliance Tracker"). Set per-deployment alongside
// VITE_PRODUCT_ID.
export const PRODUCT_NAME = (import.meta.env.VITE_PRODUCT_NAME as string) || 'Vokrix Dashboard'
