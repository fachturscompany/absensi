import { logger } from '@/lib/logger';

"use client"

/**
 * Utility function to clear malformed Supabase auth cookies
 * Call this if you encounter cookie parsing errors
 */
export function clearSupabaseCookies() {
  if (typeof window === 'undefined') return
  
  // Get the project reference from the Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return
  
  const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
  if (!projectRef) return
  
  // List of potential Supabase auth cookie names
  const cookieNames = [
    `sb-${projectRef}-auth-token`,
    `sb-${projectRef}-auth-token.0`,
    `sb-${projectRef}-auth-token.1`,
    `sb-${projectRef}-auth-token.2`,
    `sb-${projectRef}-auth-token.3`,
    `sb-${projectRef}-auth-token.4`,
    `sb-${projectRef}-auth-token.5`,
    // Add more potential chunked cookie names if needed
  ]
  
  // Clear each cookie
  cookieNames.forEach(name => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  })
  
  logger.debug('Cleared Supabase auth cookies')
  
  // Reload the page to ensure clean state
  window.location.reload()
}

/**
 * Check if there are any malformed cookies and clear them automatically
 */
export function checkAndClearMalformedCookies() {
  if (typeof window === 'undefined') return
  
  try {
    const cookies = document.cookie.split(';')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) return
    
    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
    if (!projectRef) return
    
    // Find Supabase auth cookies
    const authCookies = cookies.filter(cookie => 
      cookie.trim().startsWith(`sb-${projectRef}-auth-token`)
    )
    
    // Check each auth cookie for malformed JSON
    for (const cookie of authCookies) {
      const value = cookie.split('=')[1]?.trim()
      if (value && value.startsWith('base64-')) {
        try {
          // Try to decode the base64 and parse as JSON
          const decoded = atob(value.replace('base64-', ''))
          JSON.parse(decoded)
        } catch (error) {
          logger.warn('Found malformed cookie, clearing all auth cookies:', error)
          clearSupabaseCookies()
          return
        }
      }
    }
  } catch (error) {
    logger.warn('Error checking cookies, clearing all auth cookies:', error)
    clearSupabaseCookies()
  }
}
