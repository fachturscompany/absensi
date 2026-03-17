"use client"

import { useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { logger } from "@/lib/logger"

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

export function AuthErrorHandler() {
  useEffect(() => {
    const supabase = createClient()

    // Listen for auth state changes and handle errors
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string) => {
      if (event === 'SIGNED_OUT') {
        logger.debug('User signed out, clearing cookies')
        clearAuthCookies()
      } else if (event === 'TOKEN_REFRESHED') {
        logger.debug('Token refreshed successfully')
      }
    })

    // Set up global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason

      // "Auth session missing!" is normal when user is not logged in
      const isSessionMissing = error?.message === 'Auth session missing!'

      if (isSessionMissing) {
        // This is normal, don't handle it
        return
      }

      // Check if it's a Supabase refresh token error
      if (
        (error?.message?.toLowerCase().includes('refresh') &&
          error?.message?.toLowerCase().includes('token')) ||
        error?.message?.includes('Invalid Refresh Token')
      ) {
        logger.warn('Caught unhandled refresh token error, clearing cookies')
        event.preventDefault() // Prevent error from showing in console

        clearAuthCookies()

        // Redirect to login if not already there
        if (!window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth/login'
        }
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null
}
