'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { fetchDashboardData, type DashboardAttendanceRecord } from '@/dashboard-api'
import type { DateFilterState } from '@/components/attendance/dashboard/date-filter-bar.tsx'

export interface DashboardStats {
  totalPresent: number
  totalLate: number
  totalAbsent: number
  onTimeRate: number
  avgWorkHours: number
  totalWorkHoursToday: number
  activeMembers: number
}

export interface ChartDataItem {
  label : string
  present : number
  late : number
  absent : number  
}

interface UseDashboardDataReturn {
  records: DashboardAttendanceRecord[]
  stats: DashboardStats
  chartData: ChartDataItem[]
  statusData: { name: string; value: number; color: string }[]
  isLoading: boolean
  dateRange: DateFilterState
  maxAttendance: number
  setDateRange: (range: DateFilterState) => void
}

export function useDashboardData(
  organizationId: number | null,
  isHydrated: boolean
): UseDashboardDataReturn {
  const [dateRange, setDateRange] = useState<DateFilterState>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)
    return { from: today, to: endOfToday, preset: 'today' }
  })

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['dashboard', organizationId, dateRange.preset],
    queryFn: () => fetchDashboardData(organizationId!, dateRange),
    staleTime: 0, // No cache
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000, // Auto refresh 30s
    refetchOnWindowFocus: true,
    enabled: !!organizationId && isHydrated,
  })

const filteredRecords = useMemo(() => {
if (!Array.isArray(records) || !records.length) {
  return []
}
  const fromDate = new Date(dateRange.from);
  fromDate.setHours(0, 0, 0, 0);
  
  const toDate = new Date(dateRange.to);
  toDate.setHours(23, 59, 59, 999);
  
  return records.filter(record => {
    if (!record.attendance_date) return false;
    
    // ✅ Parse dengan timezone safety
    const recordDate = new Date(record.attendance_date);
    if (isNaN(recordDate.getTime())) return false;
    
    // ✅ Compare timestamps
    return recordDate.getTime() >= fromDate.getTime() && 
           recordDate.getTime() <= toDate.getTime();
  });
}, [records, dateRange]);


  // Calculate stats
  const stats = useMemo((): DashboardStats => {
    const onTimeCount = filteredRecords.filter(r => r.status === 'on-time').length
    const lateCount = filteredRecords.filter(r => r.status === 'late').length
    const absentCount = filteredRecords.filter(records => records.status === 'absent').length
    const presentCount = onTimeCount + lateCount

    const totalWorkMinutes = filteredRecords.reduce((sum, r) => {
      return sum + (r.work_duration_minutes || 0)
    }, 0)
    
    const totalWorkHours = totalWorkMinutes / 60
    const avgHours = filteredRecords.length > 0 ? totalWorkMinutes / filteredRecords.length / 60 : 0

    const uniqueMembers = new Set(
      filteredRecords.filter(r => r.actual_check_in).map(r => r.member_name)
    )

  return {
    totalPresent: presentCount,
    totalLate: lateCount,
    totalAbsent: absentCount,
    onTimeRate: presentCount > 0 ? (onTimeCount / presentCount) * 100 : 0,
    avgWorkHours: avgHours,
    totalWorkHoursToday: totalWorkHours,
    activeMembers: uniqueMembers.size,
  }
}, [filteredRecords])

  // Chart data
  const chartData = useMemo(() => {
    const isToday = dateRange.preset === 'today'
    
    if (isToday) {
      const hours = Array.from({ length: 24 }, (_, i) => i)
      const hourlyMap: Record<number, {
        present: number;
        late: number;
        absent: number;
      }> = {}
      
      hours.forEach(hour => {
        hourlyMap[hour] = { present: 0, late: 0, absent: 0 }
      })

      filteredRecords.forEach(record => {
        if (record.actual_check_in) {
          const checkInDate = new Date(record.actual_check_in)
          const hour = checkInDate.getHours()
          if (hourlyMap[hour]) {
            if (record.status === 'present') hourlyMap[hour].present++
            else if (record.status === 'late') hourlyMap[hour].late++
          }
        }
      })

      return hours.map(hour => ({
        label: `${hour.toString().padStart(2, '0')}:00`,
        present: hourlyMap[hour]?.present || 0,
        late: hourlyMap[hour]?.late || 0,
        absent: hourlyMap[hour]?.absent || 0,
      }))
    }

    // Default: daily data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const daysMap: Record<string, {
      present: number;
      late: number;
      absent: number;
    }> = {}
    
    days.forEach(day => {
      daysMap[day] = { present: 0, late: 0, absent: 0 }
    })

    filteredRecords.forEach(record => {
      const date = new Date(record.attendance_date)
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
      
      if (dayName && daysMap[dayName]) {
        if (record.status === 'present') daysMap[dayName].present++
        else if (record.status === 'late') daysMap[dayName].late++
      }
    })

    return days.map(day => ({
      label: day,
      present: daysMap[day]?.present || 0,
      late: daysMap[day]?.late || 0,
      absent: daysMap[day]?.absent || 0,
    }))
  }, [filteredRecords, dateRange.preset])

const statusData = useMemo(() => {
  const onTimeCount = filteredRecords.filter(r => r.status === 'on-time').length
  const lateCount = filteredRecords.filter(r => r.status === 'late').length
  const absentCount = filteredRecords.filter(r => r.status === 'absent').length
  const totalRecords = onTimeCount + lateCount + absentCount
  
  const data = [
    { name: 'On Time', value: onTimeCount, color: '#10B981' },
    { name: 'Late', value: lateCount, color: '#F59E0B' },
    { name: 'Absent', value: absentCount, color: '#EF4444' },
  ].filter(item => item.value > 0)
  
  // Convert ke percentage dari totalRecords
  return totalRecords > 0 
    ? data.map(item => ({
        name: item.name,
        value: totalRecords,
        color: item.color
      }))
    : []
}, [filteredRecords])  // ✅ DEPENDENCY filteredRecords SAJA



const maxAttendance = useMemo(() => {
  if (!chartData?.length) return 1;
  const values = chartData
    .map(item => Math.max(item.present || 0, item.late || 0))
    .filter(v => v > 0);
  return values.length ? Math.max(...values) : 1;
}, [chartData]);

  return {
    records: filteredRecords,
    stats,
    chartData,
    statusData,
    isLoading,
    dateRange,
    maxAttendance,
    setDateRange,
  }
}

