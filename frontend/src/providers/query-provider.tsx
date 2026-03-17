"use client"

import { QueryClient, QueryClientProvider, dehydrate, hydrate, type DehydratedState } from '@tanstack/react-query'
import { ReactNode, useEffect } from 'react'
import { useAuthCacheClear } from '@/hooks/use-auth-cache-clear'

// Create a singleton QueryClient instance outside of component
// This ensures the same instance is used across all renders and hot reloads
let browserQueryClient: QueryClient | undefined = undefined

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes - data is considered fresh
        gcTime: 1000 * 60 * 10, // 10 minutes - keep unused data in cache
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
        refetchOnMount: false, // Don't refetch when component mounts if data exists
        refetchOnReconnect: false, // Don't refetch on reconnect
        retry: false, // Disable automatic retries
      },
    },
  })
}

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new query client
    return makeQueryClient()
  }

  // Browser: use singleton pattern
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}

function AuthCacheClearWrapper({ children }: { children: ReactNode }) {
  // Clear cache when user changes (login/logout/switch)
  useAuthCacheClear()
  return <>{children}</>
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // Get the singleton QueryClient instance
  const queryClient = getQueryClient()

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('rq-cache-v1')
      if (raw) {
        const parsed = JSON.parse(raw) as { buster?: string; data?: DehydratedState | undefined }
        if (!parsed.buster || parsed.buster === 'rq-v1' || parsed.buster === 'v1') {
          if (parsed.data) hydrate(queryClient, parsed.data)
        }
      }
    } catch {}
    const unsub = queryClient.getQueryCache().subscribe(() => {
      try {
        const data: DehydratedState = dehydrate(queryClient)
        const payload: { buster: string; data: DehydratedState } = { buster: 'v1', data }
        localStorage.setItem('rq-cache-v1', JSON.stringify(payload))
      } catch {}
    })
    return () => {
      if (typeof unsub === 'function') unsub()
    }
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      <AuthCacheClearWrapper>{children}</AuthCacheClearWrapper>
    </QueryClientProvider>
  )
}
