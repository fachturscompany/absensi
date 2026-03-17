"use server"

import { createClient } from "@/utils/supabase/server"

import { logger } from '@/lib/logger';
interface GroupStat {
  id: string
  name: string
  attendanceRate: number
  totalMembers: number
  presentToday: number
  rank: number
}

/**
 * Get group comparison stats with a single optimized query
 * This replaces the slow department comparison that made multiple queries per department
 */
export async function getGroupComparisonStats(organizationId: string): Promise<GroupStat[]> {
  if (!organizationId) {
    return []
  }

  try {
    const supabase = await createClient()
    
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    // Calculate month range
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const monthStart = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0]

    // Get all active groups/departments with their members in one query
    // Specify the exact relationship to avoid ambiguity
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select(`
        id,
        name,
        organization_members!organization_members_department_id_fkey!inner(
          id,
          is_active
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .eq('organization_members.is_active', true)

    if (deptError || !departments || departments.length === 0) {
      logger.error('Failed to fetch departments:', deptError)
      return []
    }

    // Build member ID to department mapping
    const memberToDept = new Map<string, { deptId: string; deptName: string }>()
    const deptStats = new Map<string, {
      id: string
      name: string
      totalMembers: number
      presentToday: number
      monthlyPresent: number
    }>()

    departments.forEach((dept: any) => {
      const members = dept.organization_members || []
      deptStats.set(dept.id, {
        id: dept.id,
        name: dept.name,
        totalMembers: members.length,
        presentToday: 0,
        monthlyPresent: 0
      })

      members.forEach((member: any) => {
        memberToDept.set(member.id, { deptId: dept.id, deptName: dept.name })
      })
    })

    const allMemberIds = Array.from(memberToDept.keys())

    if (allMemberIds.length === 0) {
      return []
    }

    // Fetch all attendance records for today and this month in ONE query
    const { data: attendanceRecords, error: attError } = await supabase
      .from('attendance_records')
      .select('organization_member_id, attendance_date, status')
      .in('organization_member_id', allMemberIds)
      .gte('attendance_date', monthStart)
      .lte('attendance_date', monthEnd)
      .in('status', ['present', 'late'])

    if (attError) {
      logger.error('Failed to fetch attendance records:', attError)
      return []
    }

    // Aggregate attendance data
    attendanceRecords?.forEach((record: any) => {
      const dept = memberToDept.get(record.organization_member_id)
      if (!dept) return

      const stats = deptStats.get(dept.deptId)
      if (!stats) return

      // Count today's attendance
      if (record.attendance_date === today) {
        stats.presentToday++
      }
      
      // Count monthly attendance
      stats.monthlyPresent++
    })

    // Calculate attendance rates and build result
    const result: GroupStat[] = []
    const daysInMonth = new Date(year, month, 0).getDate()
    const workingDays = Math.floor(daysInMonth * (5/7)) // Approximate working days

    deptStats.forEach((stats) => {
      if (stats.totalMembers === 0) return

      const expectedAttendance = stats.totalMembers * workingDays
      const attendanceRate = expectedAttendance > 0
        ? Math.min(100, Math.round((stats.monthlyPresent / expectedAttendance) * 100))
        : 0

      result.push({
        id: stats.id,
        name: stats.name,
        attendanceRate,
        totalMembers: stats.totalMembers,
        presentToday: stats.presentToday,
        rank: 0 // Will be set after sorting
      })
    })

    // Sort by attendance rate and assign ranks
    result.sort((a, b) => b.attendanceRate - a.attendanceRate)
    result.forEach((stat, index) => {
      stat.rank = index + 1
    })

    return result
  } catch (err) {
    logger.error('getGroupComparisonStats error:', err)
    return []
  }
}
