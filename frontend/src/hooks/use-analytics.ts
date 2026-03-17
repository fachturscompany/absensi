import { useQuery } from '@tanstack/react-query'
import { useOrganizationId } from './use-organization-id'

export function useAnalytics() {
  const { data: organizationId } = useOrganizationId()
  
  return useQuery({
    queryKey: ['analytics', organizationId],
    queryFn: async () => {
      const res = await fetch('/api/analytics')
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const json = await res.json()
      return json.data
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus for analytics
  })
}
