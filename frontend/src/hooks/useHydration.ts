import { useEffect, useState } from 'react'
import { useOrgStore } from '@/store/org-store'


/**
 * Hook untuk handle Zustand hydration timing
 * Memastikan organizationId tersedia sebelum fetch data
 * 
 * Usage:
 * const { isHydrated, organizationId } = useHydration()
 * 
 * useEffect(() => {
 *   if (isHydrated && organizationId) {
 *     fetchData(organizationId)
 *   }
 * }, [isHydrated, organizationId])
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false)
  const { organizationId } = useOrgStore()

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return {
    isHydrated,
    organizationId,
    isReady: isHydrated && organizationId !== null,
  }
}
