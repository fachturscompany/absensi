import { useQuery } from "@tanstack/react-query"
import { IWorkSchedule } from "@/interface"

import { scheduleLogger } from '@/lib/logger';
// Custom hook untuk fetch work schedules dengan caching via API route (GET)
export function useWorkSchedules(organizationId?: string) {
  return useQuery({
    queryKey: ["workSchedules", organizationId],
    queryFn: async () => {
      scheduleLogger.debug('[React Query] Fetching work schedules via API')
      const url = organizationId ? `/api/work-schedules?organizationId=${organizationId}` : '/api/work-schedules'
      const response = await fetch(url, { credentials: 'same-origin' })
      const json = await response.json()
      if (!json.success) {
        throw new Error(json.message || 'Failed to fetch work schedules')
      }
      return json.data as IWorkSchedule[]
    },
    enabled: !!organizationId, // Only run when organizationId exists
    staleTime: 3 * 60 * 1000, // Data fresh selama 3 menit
    gcTime: 10 * 60 * 1000, // Cache disimpan 10 menit
  })
}
