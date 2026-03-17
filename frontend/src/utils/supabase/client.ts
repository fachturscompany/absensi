import { createBrowserClient } from '@supabase/ssr'
import { logger } from '@/lib/logger'

const clearAuthCookies = () => {
  if (typeof window === 'undefined') return

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return

  const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
  if (!projectRef) return

  const cookieNames = [
    `sb-${projectRef}-auth-token`,
    `sb-${projectRef}-auth-token.0`,
    `sb-${projectRef}-auth-token.1`,
    `sb-${projectRef}-auth-token.2`,
    `sb-${projectRef}-auth-token.3`,
    `sb-${projectRef}-auth-token.4`,
    `sb-${projectRef}-auth-token.5`,
  ]

  cookieNames.forEach(name => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  })
}

let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (clientInstance) return clientInstance

  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false,
        detectSessionInUrl: true,
        persistSession: true,
      },
    }
  )

  // Set up global auth error handler
  client.auth.onAuthStateChange((event) => {
    if (event === 'TOKEN_REFRESHED') {
      logger.debug('Token refreshed successfully')
    } else if (event === 'SIGNED_OUT') {
      logger.debug('User signed out')
      clearAuthCookies()
    }
  })

  // Intercept auth errors
  const originalGetSession = client.auth.getSession.bind(client.auth)
  client.auth.getSession = async () => {
    try {
      return await originalGetSession()
    } catch (error: any) {
      // "Auth session missing!" is normal when user is not logged in
      const isSessionMissing = error?.message === 'Auth session missing!'

      if (isSessionMissing) {
        // This is a normal case, don't log or redirect
        throw error
      }

      // Check for actual refresh token errors
      if (
        (error?.message?.toLowerCase().includes('refresh') &&
          error?.message?.toLowerCase().includes('token')) ||
        error?.message?.includes('Invalid Refresh Token')
      ) {
        logger.warn('Invalid refresh token detected, clearing cookies and redirecting to login')
        clearAuthCookies()

        // Only redirect if not already on auth page
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth/login'
        }
      }
      throw error
    }
  }

  clientInstance = client
  return client
}
