import { useQuery } from '@tanstack/react-query'
import { useSession } from './use-session'
import { useEffect } from 'react'
import { useOrgStore } from '@/store/org-store'

interface OrganizationData {
  organizationId: number
  organizationName: string
  timeFormat: '12h' | '24h'
  timezone: string
  isActive: boolean
  memberIsActive: boolean
}

/**
 * Centralized organization data hook
 * Fetches all organization-related data in a single query
 */
export function useOrganizationData() {
  const { data: user } = useSession()
  const { organizationId: storeOrgId } = useOrgStore()

  return useQuery({
    // Ikat ke user + org aktif di store supaya ikut berubah
    queryKey: ['organization', 'full-data', user?.id, storeOrgId],
    queryFn: async (): Promise<OrganizationData | null> => {
      if (!user?.id) return null

      // ✅ USE SECURE API ROUTE - kirim organizationId dari store kalau ada
      let url = '/api/organization/info'
      if (storeOrgId) {
        const params = new URLSearchParams({ organizationId: String(storeOrgId) })
        url = `/api/organization/info?${params.toString()}`
      }

      const response = await fetch(url, {
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401) return null
        throw new Error('Failed to fetch organization data')
      }

      const { data } = await response.json()

      return {
        organizationId: data.id,
        organizationName: data.name,
        timeFormat: data.timeFormat,
        timezone: data.timezone,
        isActive: data.isActive,
        memberIsActive: data.memberIsActive,
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute - balance between fresh data and efficiency
    gcTime: 1000 * 60 * 5, // 5 minutes - reasonable cache duration
    retry: 1,
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Refetch when component mounts (e.g., navigating to dashboard)
  })
}

/**
 * Hook to get only organization ID
 * Uses the shared organization data query
 */
export function useOrganizationId() {
  const { data, ...rest } = useOrganizationData()
  return {
    data: data?.organizationId ?? null,
    ...rest,
  }
}

/**
 * Hook to get only organization name
 * Uses the shared organization data query
 */
export function useOrganizationName() {
  const { data, isLoading, ...rest } = useOrganizationData()
  
  // Force refetch when data changes to ensure UI updates
  useEffect(() => {
    // This ensures the hook responds to data changes
  }, [data])
  
  return {
    organizationName: data?.organizationName ?? null,
    loading: isLoading,
    ...rest,
  }
}

/**
 * Hook to get organization time format
 * Uses the shared organization data query
 */
export function useOrganizationTimeFormat() {
  const { data, ...rest } = useOrganizationData()
  return {
    timeFormat: data?.timeFormat ?? '24h',
    ...rest,
  }
}

/**
 * Hook to get organization timezone
 * Uses the shared organization data query
 */
export function useOrganizationTimezone() {
  const { data, ...rest } = useOrganizationData()
  return {
    timezone: data?.timezone ?? 'UTC',
    ...rest,
  }
}
