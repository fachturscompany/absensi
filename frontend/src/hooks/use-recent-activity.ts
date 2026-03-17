import { useQuery } from '@tanstack/react-query'
import { useOrganizationId } from './use-organization-id'

type ActivityItem = {
  id: string
  memberName: string
  status: 'present' | 'late' | 'absent'
  checkInTime: string
  lateMinutes?: number
  department?: string
}

export function useRecentActivity(limit: number = 15, options?: { enabled?: boolean; refetchIntervalMs?: number }) {
  const { data: organizationId } = useOrganizationId()

  return useQuery({
    queryKey: ['dashboard', 'recent-activity', organizationId, limit],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/recent-activity?limit=${limit}`, {
        credentials: 'same-origin',
        cache: 'no-store'
      })
      const json = await res.json()
      if (!json.success || !json.data) {
        throw new Error('Failed to fetch recent activity')
      }
      return json.data as ActivityItem[]
    },
    enabled: !!organizationId && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 2, // 2 minutes - data is fresh for longer
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchInterval: options?.refetchIntervalMs,
    refetchOnWindowFocus: false, // Disable refetch on window focus to reduce requests
    refetchOnMount: false, // Disable refetch on mount, rely on cache
    refetchOnReconnect: true, // Only refetch when reconnecting
  })
}
