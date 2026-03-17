import { useQuery } from '@tanstack/react-query'
import { useSession } from './use-session'

interface BatchDataResponse {
  organization?: {
    id: number
    name: string
    timeFormat: '12h' | '24h'
    timezone: string
    isActive: boolean
    memberIsActive: boolean
  }
  profile?: {
    first_name?: string
    last_name?: string
    display_name?: string
    profile_photo_url?: string
    employee_code?: string
  }
  attendance?: Array<{
    id: string
    status: string
    checkIn: string
    checkOut: string | null
    duration: number
    lateMinutes: number
    employee: {
      name: string
      photo: string | null
      department: string | null
    }
  }>
  errors?: Record<string, string>
}

/**
 * Hook to batch multiple data requests into one API call
 * Reduces network overhead and improves performance
 * 
 * @example
 * // Instead of 3 separate requests:
 * const { data: org } = useOrganizationData()
 * const { data: profile } = useUserProfile()
 * const { data: attendance } = useAttendance()
 * 
 * // Use 1 batched request:
 * const { data } = useBatchData(['organization', 'profile', 'attendance'])
 */
export function useBatchData(requests: Array<'organization' | 'profile' | 'attendance'>) {
  const { data: user } = useSession()

  return useQuery({
    queryKey: ['batch-data', ...requests.sort(), user?.id],
    queryFn: async (): Promise<BatchDataResponse> => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ requests }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch batch data')
      }

      return response.json()
    },
    enabled: !!user?.id && requests.length > 0,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for dashboard page - loads all necessary data in one request
 */
export function useDashboardData() {
  return useBatchData(['organization', 'profile', 'attendance'])
}
