"use server"

import { createClient } from "@/utils/supabase/server"

import { analyticsLogger } from '@/lib/logger';
async function getUserOrganizationId() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle()

  return member?.organization_id || null
}

export async function getAnalyticsKPIs() {
  const organizationId = await getUserOrganizationId()
  if (!organizationId) {
    return {
      success: false,
      data: {
        totalMembers: 0,
        todayAttendanceRate: 0,
        avgLateMinutes: 0,
        totalOvertimeHours: 0,
        onTimeRate: 0,
        trends: {
          attendance: 0,
          late: 0,
          overtime: 0,
        },
      },
    }
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

  const { data: memberIds } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)

  const memberIdList = memberIds?.map((m) => m.id) || []

  const [
    { count: totalMembers },
    { count: todayAttendance },
    { data: todayLateData },
    { data: todayOvertimeData },
    { count: yesterdayAttendance },
    { count: todayOnTime },
  ] = await Promise.all([
    supabase.from("organization_members").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("is_active", true),
    supabase.from("attendance_records").select("id", { count: "exact", head: true }).in("organization_member_id", memberIdList).eq("attendance_date", today).in("status", ["present", "late"]),
    supabase.from("attendance_records").select("late_minutes").in("organization_member_id", memberIdList).eq("attendance_date", today).gt("late_minutes", 0),
    supabase.from("attendance_records").select("overtime_minutes").in("organization_member_id", memberIdList).eq("attendance_date", today).gt("overtime_minutes", 0),
    supabase.from("attendance_records").select("id", { count: "exact", head: true }).in("organization_member_id", memberIdList).eq("attendance_date", yesterday).in("status", ["present", "late"]),
    supabase.from("attendance_records").select("id", { count: "exact", head: true }).in("organization_member_id", memberIdList).eq("attendance_date", today).eq("status", "present"),
  ])

  const avgLateMinutes =
    todayLateData && todayLateData.length > 0
      ? Math.round(todayLateData.reduce((sum, r) => sum + (r.late_minutes || 0), 0) / todayLateData.length)
      : 0

  const totalOvertimeMinutes =
    todayOvertimeData?.reduce((sum, r) => sum + (r.overtime_minutes || 0), 0) || 0
  const totalOvertimeHours = Math.round((totalOvertimeMinutes / 60) * 10) / 10

  const attendanceRate = totalMembers ? Math.round(((todayAttendance || 0) / (totalMembers || 1)) * 100) : 0
  const onTimeRate = todayAttendance ? Math.round(((todayOnTime || 0) / (todayAttendance || 1)) * 100) : 0

  const yesterdayRate = totalMembers ? Math.round(((yesterdayAttendance || 0) / (totalMembers || 1)) * 100) : 0
  const attendanceTrend = attendanceRate - yesterdayRate

  return {
    success: true,
    data: {
      totalMembers: totalMembers || 0,
      todayAttendanceRate: attendanceRate,
      avgLateMinutes,
      totalOvertimeHours,
      onTimeRate,
      trends: {
        attendance: attendanceTrend,
        late: avgLateMinutes > 0 ? -5 : 0,
        overtime: totalOvertimeHours > 0 ? 2 : 0,
      },
    },
  }
}

export async function getHourlyAttendanceHeatmap() {
  const organizationId = await getUserOrganizationId()
  if (!organizationId) {
    return { success: false, data: [] }
  }

  const supabase = await createClient()

  const { data: memberIds } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)

  const { data: logs } = await supabase
    .from("attendance_logs")
    .select("event_time, event_type")
    .in("organization_member_id", memberIds?.map((m) => m.id) || [])
    .gte("event_time", new Date(Date.now() - 7 * 86400000).toISOString())
    .order("event_time", { ascending: false })

  const hourlyData = new Map<number, { checkIn: number; checkOut: number }>()
  for (let i = 0; i < 24; i++) {
    hourlyData.set(i, { checkIn: 0, checkOut: 0 })
  }

  logs?.forEach((log) => {
    const hour = new Date(log.event_time).getHours()
    const current = hourlyData.get(hour) || { checkIn: 0, checkOut: 0 }
    if (log.event_type === "check_in") {
      current.checkIn++
    } else if (log.event_type === "check_out") {
      current.checkOut++
    }
    hourlyData.set(hour, current)
  })

  return {
    success: true,
    data: Array.from(hourlyData.entries()).map(([hour, data]) => ({
      hour: `${hour.toString().padStart(2, "0")}:00`,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
    })),
  }
}

export async function getDepartmentPerformance() {
  const organizationId = await getUserOrganizationId()
  if (!organizationId) {
    return { success: false, data: [] }
  }

  const supabase = await createClient()
  const startDate = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]

  // Fetch all data in parallel - optimized
  const [
    { data: departments },
    { data: members },
    { data: records }
  ] = await Promise.all([
    supabase
      .from("departments")
      .select("id, name, code")
      .eq("organization_id", organizationId)
      .eq("is_active", true),
    supabase
      .from("organization_members")
      .select("id, department_id")
      .eq("organization_id", organizationId)
      .eq("is_active", true),
    supabase
      .from("attendance_records")
      .select("organization_member_id, status")
      .gte("attendance_date", startDate)
  ])

  // Group members by department
  const deptMembersMap = new Map<string, string[]>()
  members?.forEach((member) => {
    if (member.department_id) {
      const memberIds = deptMembersMap.get(member.department_id) || []
      memberIds.push(member.id)
      deptMembersMap.set(member.department_id, memberIds)
    }
  })

  // Group records by member
  const memberRecordsMap = new Map<string, { total: number, present: number }>()
  records?.forEach((record) => {
    const stats = memberRecordsMap.get(record.organization_member_id) || { total: 0, present: 0 }
    stats.total++
    if (record.status === "present" || record.status === "late") {
      stats.present++
    }
    memberRecordsMap.set(record.organization_member_id, stats)
  })

  // Calculate department stats
  const departmentStats = (departments || []).map((dept) => {
    const memberIds = deptMembersMap.get(dept.id) || []
    
    let totalRecords = 0
    let presentRecords = 0
    
    memberIds.forEach((memberId) => {
      const stats = memberRecordsMap.get(memberId)
      if (stats) {
        totalRecords += stats.total
        presentRecords += stats.present
      }
    })

    const rate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

    return {
      name: dept.name,
      rate,
      memberCount: memberIds.length,
    }
  })

  return {
    success: true,
    data: departmentStats.sort((a, b) => b.rate - a.rate),
  }
}

export async function getAttendanceTrends30Days() {
  const organizationId = await getUserOrganizationId()
  if (!organizationId) {
    return { success: false, data: [] }
  }

  const supabase = await createClient()
  const startDate = new Date(Date.now() - 29 * 86400000).toISOString().split("T")[0]

  const { data: memberIds } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)

  const memberIdList = memberIds?.map((m) => m.id) || []
  if (memberIdList.length === 0) {
    return { success: true, data: [] }
  }

  // Optimized: Single query to get all attendance records for 30 days
  const { data: records } = await supabase
    .from("attendance_records")
    .select("attendance_date, status")
    .in("organization_member_id", memberIdList)
    .gte("attendance_date", startDate)

  // Group by date and status
  const dateMap = new Map<string, {
    present: number,
    late: number,
    absent: number,
    excused: number,
    earlyLeave: number
  }>()

  // Initialize all 30 days
  for (let i = 29; i >= 0; i--) {
    const dateStr = new Date(Date.now() - i * 86400000).toISOString().split("T")[0]!
    dateMap.set(dateStr, { present: 0, late: 0, absent: 0, excused: 0, earlyLeave: 0 })
  }

  // Count statuses
  records?.forEach((record) => {
    const dateData = dateMap.get(record.attendance_date)
    if (dateData) {
      if (record.status === "present") dateData.present++
      else if (record.status === "late") dateData.late++
      else if (record.status === "absent") dateData.absent++
      else if (record.status === "excused") dateData.excused++
      else if (record.status === "early_leave") dateData.earlyLeave++
    }
  })

  // Convert to array format
  const trends = Array.from(dateMap.entries()).map(([dateStr, data]) => {
    const date = new Date(dateStr + "T00:00:00")
    const dayName = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    
    return {
      date: dayName,
      present: data.present,
      late: data.late,
      absent: data.absent,
      excused: data.excused,
      earlyLeave: data.earlyLeave,
    }
  })

  return {
    success: true,
    data: trends,
  }
}

export async function getStatusDistribution() {
  const organizationId = await getUserOrganizationId()
  if (!organizationId) {
    return {
      success: false,
      data: {
        today: [],
        month: [],
      },
    }
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]

  const { data: memberIds } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)

  const memberIdList = memberIds?.map((m) => m.id) || []

  const statuses = ["present", "late", "absent", "excused", "early_leave"]
  const colors = {
    present: "#10b981",
    late: "#f59e0b",
    absent: "#ef4444",
    excused: "#6366f1",
    early_leave: "#8b5cf6",
  }

  const [todayData, monthData] = await Promise.all([
    Promise.all(
      statuses.map(async (status) => {
        const { count } = await supabase
          .from("attendance_records")
          .select("id", { count: "exact", head: true })
          .in("organization_member_id", memberIdList)
          .eq("attendance_date", today)
          .eq("status", status)

        return {
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count || 0,
          color: colors[status as keyof typeof colors],
        }
      })
    ),
    Promise.all(
      statuses.map(async (status) => {
        const { count } = await supabase
          .from("attendance_records")
          .select("id", { count: "exact", head: true })
          .in("organization_member_id", memberIdList)
          .gte("attendance_date", monthStart)
          .eq("status", status)

        return {
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count || 0,
          color: colors[status as keyof typeof colors],
        }
      })
    ),
  ])

  return {
    success: true,
    data: {
      today: todayData.filter((d) => d.value > 0),
      month: monthData.filter((d) => d.value > 0),
    },
  }
}

export async function getRecentActivities(limit = 10) {
  const organizationId = await getUserOrganizationId()
  if (!organizationId) {
    analyticsLogger.debug('[getRecentActivities] No organization ID found')
    return { success: false, data: [] }
  }

  analyticsLogger.debug('[getRecentActivities] Organization ID:', organizationId)

  const supabase = await createClient()

  const { data: memberIds } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)

  const memberIdList = memberIds?.map((m) => m.id) || []
  analyticsLogger.debug('[getRecentActivities] Found', memberIdList.length, 'active members')

  if (memberIdList.length === 0) {
    analyticsLogger.debug('[getRecentActivities] No active members found')
    return { success: true, data: [] }
  }

  // Fetch both attendance_logs and attendance_records in parallel
  const [logsResult, recordsResult] = await Promise.all([
    // Fetch attendance logs (real-time events)
    supabase
      .from("attendance_logs")
      .select("id, event_time, event_type, organization_member_id")
      .in("organization_member_id", memberIdList)
      .order("event_time", { ascending: false })
      .limit(limit),
    
    // Fetch attendance records (daily summaries) - last 7 days
    supabase
      .from("attendance_records")
      .select("id, organization_member_id, attendance_date, actual_check_in, actual_check_out, status, created_at")
      .in("organization_member_id", memberIdList)
      .gte("attendance_date", new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0])
      .order("created_at", { ascending: false })
      .limit(limit)
  ])

  const logs = logsResult.data || []
  const records = recordsResult.data || []

  if (logsResult.error) {
    analyticsLogger.error('[getRecentActivities] Error fetching logs:', logsResult.error)
  }
  if (recordsResult.error) {
    analyticsLogger.error('[getRecentActivities] Error fetching records:', recordsResult.error)
  }

  analyticsLogger.debug('[getRecentActivities] Found', logs.length, 'attendance logs and', records.length, 'attendance records')

  // Convert attendance_records to activity format
  const recordActivities = records.map((record) => ({
    id: `record-${record.id}`,
    event_time: record.actual_check_in || record.created_at,
    event_type: record.status === 'present' ? 'check_in' : 
                 record.status === 'late' ? 'check_in_late' :
                 record.status === 'absent' ? 'absent' : 'check_in',
    organization_member_id: record.organization_member_id,
    source: 'record' as const
  }))

  // Combine and sort by time
  const allActivities = [
    ...logs.map(log => ({ ...log, source: 'log' as const })),
    ...recordActivities
  ].sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime())
    .slice(0, limit)

  if (allActivities.length === 0) {
    analyticsLogger.debug('[getRecentActivities] No activities found from both sources')
    return { success: true, data: [] }
  }

  analyticsLogger.debug('[getRecentActivities] Combined', allActivities.length, 'total activities')

  // Fetch member details separately
  const { data: members } = await supabase
    .from("organization_members")
    .select(`
      id,
      employee_id,
      department_id,
      user_id
    `)
    .in("id", allActivities.map((activity) => activity.organization_member_id))

  // Fetch user profiles
  const userIds = members?.map((m) => m.user_id).filter(Boolean) || []
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, first_name, last_name, profile_photo_url")
    .in("id", userIds)

  // Fetch departments
  const deptIds = members?.map((m) => m.department_id).filter(Boolean) || []
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .in("id", deptIds)

  // Map data
  const memberMap = new Map(members?.map((m) => [m.id, m]))
  const profileMap = new Map(profiles?.map((p) => [p.id, p]))
  const deptMap = new Map(departments?.map((d) => [d.id, d]))

  return {
    success: true,
    data: allActivities.map((activity) => {
      const member = memberMap.get(activity.organization_member_id)
      const profile = member?.user_id ? profileMap.get(member.user_id) : null
      const dept = member?.department_id ? deptMap.get(member.department_id) : null

      return {
        id: typeof activity.id === 'string' ? parseInt(activity.id.replace('record-', '')) : activity.id,
        time: activity.event_time,
        type: activity.event_type,
        employeeName: profile
          ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
          : "Unknown User",
        employeeId: member?.employee_id || "N/A",
        department: dept?.name || "N/A",
        avatarUrl: profile?.profile_photo_url || null,
      }
    }),
  }
}
