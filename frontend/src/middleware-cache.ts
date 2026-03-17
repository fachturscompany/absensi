/**
 * Caching utilities for middleware and API routes
 */

export const CACHE_HEADERS = {
  // Static assets - 1 year
  STATIC: 'public, max-age=31536000, immutable',
  
  // Images - 30 days
  IMAGES: 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400',
  
  // API responses - 1 minute
  API_SHORT: 'private, max-age=60, s-maxage=60, stale-while-revalidate=30',
  
  // API responses - 5 minutes
  API_MEDIUM: 'private, max-age=300, s-maxage=300, stale-while-revalidate=60',
  
  // API responses - 1 hour
  API_LONG: 'private, max-age=3600, s-maxage=3600, stale-while-revalidate=300',
  
  // No cache
  NO_CACHE: 'no-store, must-revalidate',
} as const

export function getCacheHeaders(type: keyof typeof CACHE_HEADERS): Record<string, string> {
  return {
    'Cache-Control': CACHE_HEADERS[type],
    'CDN-Cache-Control': CACHE_HEADERS[type],
    'Vercel-CDN-Cache-Control': CACHE_HEADERS[type],
  }
}
