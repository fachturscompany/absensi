import { createClient } from './supabase/client'

/**
 * Complete logout handler that clears all caches and state
 * Prevents data leakage between different user accounts
 */
export async function handleCompleteLogout() {
  try {
    // 1. Sign out from Supabase
    const supabase = createClient()
    await supabase.auth.signOut()

    // 2. Clear ALL localStorage (including React Query persist cache)
    localStorage.clear()

    // 3. Clear ALL sessionStorage
    sessionStorage.clear()

    // 4. Clear IndexedDB (if React Query persistence is enabled)
    if ('indexedDB' in window && indexedDB.databases) {
      try {
        const dbs = await indexedDB.databases()
        if (dbs) {
          dbs.forEach(db => {
            if (db.name) {
              indexedDB.deleteDatabase(db.name)
            }
          })
        }
      } catch (error) {
        console.warn('Failed to clear IndexedDB:', error)
      }
    }

    // 4.5. Clear Service Worker Cache API (CRITICAL for API response caching)
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
        console.log('Cleared all service worker caches:', cacheNames)
      } catch (error) {
        console.warn('Failed to clear service worker caches:', error)
      }
    }

    // 4.6. Unregister Service Worker (force clean state)
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(
          registrations.map(registration => registration.unregister())
        )
        console.log('Unregistered service workers:', registrations.length)
      } catch (error) {
        console.warn('Failed to unregister service workers:', error)
      }
    }

    // 5. Clear all cookies (optional but recommended)
    if (typeof document !== 'undefined') {
      document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0]?.trim()
        if (name) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        }
      })
    }

    // 6. Hard redirect to login (forces full page reload, clears React state)
    window.location.href = '/auth/login'
  } catch (error) {
    console.error('Logout error:', error)
    // Even if error, still redirect to login
    window.location.href = '/auth/login'
  }
}
