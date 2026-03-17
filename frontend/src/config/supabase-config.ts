// Client-side Supabase client for client components
import { createClient } from '@/utils/supabase/client'

// Create a browser client instance
export const supabase = createClient()

// Create a function that returns the client
export function getSupabaseClient() {
  return createClient()
}

// For backwards compatibility - creates a client instance
export function createSupabaseClient() {
  return createClient()
}

// Export the createClient function directly
export { createClient } from '@/utils/supabase/client'
