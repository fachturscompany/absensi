import { useDashboardStats } from './use-dashboard-stats'

export type GroupStat = {
  id: string
  name: string
  attendanceRate: number
  totalMembers: number
  presentToday: number
  rank: number
}

/**
 * Get group comparison data from consolidated dashboard stats
 * This eliminates a separate API call and uses cached data
 */
export function useGroupComparison() {
  const { data, ...rest } = useDashboardStats()
  
  return {
    data: (data?.groupComparison || []) as GroupStat[],
    ...rest
  }
}

// Alias for backward compatibility - now returns group data
export const useDepartmentComparison = useGroupComparison
