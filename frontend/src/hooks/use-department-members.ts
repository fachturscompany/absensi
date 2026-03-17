import { useQuery } from "@tanstack/react-query"
import { getDepartmentMembersByOrganization } from "@/action/members"

import { memberLogger } from '@/lib/logger';
// Hook for fetching department members with React Query caching
export function useDepartmentMembers(organizationId?: string) {
  return useQuery({
    queryKey: ["departmentMembers", organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      memberLogger.debug('[React Query] Fetching department members')
      const res = await getDepartmentMembersByOrganization(organizationId)
      if (!res.success) {
        throw new Error(res.message || 'Failed to fetch department members')
      }
      return res.data as Array<{ department: string; members: number }>
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}
