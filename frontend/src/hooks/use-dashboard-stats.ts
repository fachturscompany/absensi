import { useQuery } from '@tanstack/react-query'
import { useOrganizationId } from './use-organization-id'

import { dashboardLogger } from '@/lib/logger';
type MonthlyStats = {
  currentMonth: number
  previousMonth: number
  percentChange: number
}

type MemberDistribution = {
  status: Array<{ name: string; value: number; color: string }>
  employment: Array<{ name: string; value: number; color: string }>
}

type MonthlyTrendData = {
  month: string
  attendance: number
  late: number
}

type TodaySummaryData = {
  totalMembers: number
  checkedIn: number
  onTime: number
  late: number
  absent: number
  attendanceRate: number
}

type DashboardStats = {
  totalActiveMembers: number
  totalMembers: number
  todayAttendance: number
  todayLate: number
  todayAbsent: number
  todayExcused: number
  pendingApprovals: number
  totalGroups: number
  memberDistribution: MemberDistribution | null
  monthlyAttendance: MonthlyStats
  monthlyLate: MonthlyStats
  activeMembers: MonthlyStats
  activeRfid: MonthlyStats
  attendanceGroups: any[]
  groupComparison: any[]
  monthlyTrend: MonthlyTrendData[]
  todaySummary: TodaySummaryData
}

// CONSOLIDATED HOOK - Fetches all dashboard stats in one request
export function useDashboardStats() {
  const { data: organizationId } = useOrganizationId()

  return useQuery({
    queryKey: ['dashboard', 'stats', organizationId],
    queryFn: async () => {
      dashboardLogger.debug('[React Query] Fetching consolidated dashboard stats for org:', organizationId)
      const res = await fetch('/api/dashboard/stats', { 
        credentials: 'same-origin',
        cache: 'no-store' // Disable cache for fresh data
      })
      const json = await res.json()
      if (!json.success || !json.data) {
        throw new Error('Failed to fetch dashboard stats')
      }
      return json.data as DashboardStats
    },
    enabled: !!organizationId,
    staleTime: 1000 * 30, // 30 seconds - fresh data quickly
    gcTime: 1000 * 60 * 2, // 2 minutes in cache (reduced from 5)
    refetchInterval: false, // Disable auto-refresh (use manual invalidation instead)
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnMount: true, // Always fetch fresh data on mount
  })
}

// Legacy individual hooks - now use the consolidated hook internally
export function useMonthlyAttendance() {
  const { data, ...rest } = useDashboardStats()
  return { data: data?.monthlyAttendance, ...rest }
}

export function useMonthlyLate() {
  const { data, ...rest } = useDashboardStats()
  return { data: data?.monthlyLate, ...rest }
}

export function useActiveMembers() {
  const { data, ...rest } = useDashboardStats()
  return { data: data?.activeMembers, ...rest }
}

export function useActiveRfid() {
  const { data, ...rest } = useDashboardStats()
  return { data: data?.activeRfid, ...rest }
}

export function useMemberDistribution() {
  const { data, ...rest } = useDashboardStats()
  return { data: data?.memberDistribution, ...rest }
}

export function useAttendanceGroups(_organizationId: string | null) {
  const { data, ...rest } = useDashboardStats()
  
  return {
    ...rest,
    data: data?.attendanceGroups ? data.attendanceGroups.map((g: any) => {
      const present_plus_late = (g.present || 0) + (g.late || 0)
      const not_in_others = (g.absent || 0) + (g.excused || 0) + (g.others || 0)
      const total = g.total || present_plus_late + not_in_others
      const percent_present = total > 0 ? present_plus_late / total : 0
      const late_count = g.late || 0
      const overall = present_plus_late + not_in_others
      return {
        group: g.group,
        present_plus_late,
        not_in_others,
        percent_present,
        late_count,
        overall,
      }
    }) : []
  }
}
