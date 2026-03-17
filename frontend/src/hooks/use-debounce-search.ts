"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import type { SearchCallback } from '@/types/search'

interface UseDebounceSearchReturn {
  query: string
  debouncedQuery: string
  isLoading: boolean
  search: (value: string) => void
}

export function useDebounceSearch(
  callback: SearchCallback,
  delay: number = 500
): UseDebounceSearchReturn {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const search = useCallback((value: string) => {
    setQuery(value)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      setDebouncedQuery(value)
      setIsLoading(false)
      try {
        await callback(value)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }, delay)
  }, [callback, delay])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { query, debouncedQuery, isLoading, search }
}
