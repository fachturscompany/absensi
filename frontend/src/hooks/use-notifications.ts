import { useQuery } from '@tanstack/react-query'
import { useOrganizationId } from './use-organization-id'

export type NotificationType = 'attendance' | 'leaves' | 'schedule' | 'invites'

export type NotificationItem = {
  id: string
  type: NotificationType
  timestamp: string
  memberName: string
  status: string
  action?: string
  lateMinutes?: number
  data?: {
    checkInTime?: string
    attendanceDate?: string
    leaveType?: string
    startDate?: string
    endDate?: string
    totalDays?: number
    inviterName?: string
    recipients?: string[]
  }
}

export function useNotifications(limit: number = 50) {
  const { data: organizationId } = useOrganizationId()

  return useQuery({
    queryKey: ['notifications', organizationId, limit],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?limit=${limit}`, {
        credentials: 'same-origin',
        cache: 'no-store'
      })
      const json = await res.json()
      if (!json.success || !json.data) {
        throw new Error('Failed to fetch notifications')
      }
      return json.data as NotificationItem[]
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchInterval: 1000 * 60 * 3, // Auto-refresh every 3 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  })
}
