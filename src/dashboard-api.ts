import { AttendanceListItem } from '@/action/attendance'
import type { DateFilterState } from '@/components/attendance/dashboard/date-filter-bar.tsx'

export interface DashboardAttendanceRecord {
  id: string
  member_name: string
  department_name: string
  status: string
  actual_check_in: string | null
  actual_check_out: string | null
  work_duration_minutes: number | null
  attendance_date: string
  profile_photo_url: string | null
}

export interface DashboardStats {
  totalPresent: number
  totalLate: number
  totalAbsent: number
  totalWorkHoursToday: number
  activeMembers: number
  onTimeRate: number
  avgWorkHours: number
}

export interface StatusDistributionItem {
  name : string
  value : number
  color : string
}

export async function fetchStatusDistribution(
  organizationId: number,
  dateRange: DateFilterState
): Promise<StatusDistributionItem[]> {
  const { records } = await fetchDashboardDataFull(organizationId, dateRange)  // ✅ GUNAKAN EXISTING
  
  const todayDate = dateRange.to.toISOString().slice(0, 10)
  const todayRecords = records.filter(r => r.attendance_date === todayDate)
  
  // Hitung status count
  const statusCount: Record<string, number> = {}
  todayRecords.forEach(r => {
    const status = r.status.toLowerCase()
    statusCount[status] = (statusCount[status] || 0) + 1
  })
  
  // Map ke pie chart data + FILTER value > 0 ✅ NO ZERO SLICES
  const statusData: StatusDistributionItem[] = [
    { 
      name: 'On Time', 
      value: statusCount['on-time'] || 0, 
      color: '#10b981'  // green
    },
    { 
      name: 'Late', 
      value: statusCount['late'] || 0, 
      color: '#f59e0b'  // orange
    },
    { 
      name: 'Absent', 
      value: statusCount['absent'] || 0, 
      color: '#ef4444'  // red
    }
  ].filter(item => item.value > 0)  // ✅ HANYA DATA REAL
  
  return statusData
}

// Single function return BOTH records + stats
export async function fetchDashboardDataFull(
  organizationId: number,
  dateRange: DateFilterState
) {
  const params = new URLSearchParams({
    organizationId: String(organizationId),
    limit: '20',
    page: '1',
    dateFrom: dateRange.from.toISOString().slice(0, 10),
    dateTo: dateRange.to.toISOString().slice(0, 10),
  })

  const response = await fetch(`/api/home?${params.toString()}`, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  })

  const result = await response.json()
  
  if (!result.success || !Array.isArray(result.data)) {
    console.error('Failed to fetch dashboard data', result)
    return {
      records: [],
      stats: {
        totalPresent: 0, totalLate: 0, totalAbsent: 0,
        totalWorkHoursToday: 0, activeMembers: 0, onTimeRate: 0, avgWorkHours: 0
      }
    }
  }

  // Map records
  const records: DashboardAttendanceRecord[] = result.data.map((item: AttendanceListItem) => ({
    id: item.id,
    member_name: item.member.name,
    department_name: item.member.department,
    status: item.status,
    actual_check_in: item.checkIn,
    actual_check_out: item.checkOut,
    work_duration_minutes: item.work_duration_minutes ?? 0,
    attendance_date: item.date,
    profile_photo_url: item.member.avatar ?? null,
  }))

  // Compute stats
  const todayDate = dateRange.to.toISOString().slice(0, 10)
  const todayRecords = records.filter(r => r.attendance_date === todayDate)
  
  const totalHours = todayRecords.reduce((sum, r) => 
    sum + (r.work_duration_minutes ?? 0) / 60, 0
  )
  
  const uniqueMembers = new Set(todayRecords.map(r => r.member_name)).size
  const present = todayRecords.length
  const late = todayRecords.filter(r => r.status === 'late').length
  const onTime = todayRecords.filter(r => r.status === 'on-time').length
  
  const stats: DashboardStats = {
    totalPresent: present,
    totalLate: late,
    totalAbsent: 0,
    totalWorkHoursToday: totalHours,
    activeMembers: uniqueMembers,
    onTimeRate: uniqueMembers > 0 ? (onTime / uniqueMembers) * 100 : 0,
    avgWorkHours: uniqueMembers > 0 ? totalHours / uniqueMembers : 0
  }

  return { records, stats }  // ✅ RETURN BOTH!
}

// Backward compatibility
export async function fetchDashboardData(
  organizationId: number,
  dateRange: DateFilterState
): Promise<DashboardAttendanceRecord[]> {
  const { records } = await fetchDashboardDataFull(organizationId, dateRange)
  return records
}

export async function fetchDashboardStats(
  organizationId: number,
  dateRange: DateFilterState
): Promise<DashboardStats> {
  const { stats } = await fetchDashboardDataFull(organizationId, dateRange)
  return stats
}