import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

import { dashboardLogger } from '@/lib/logger';
async function getUserOrganizationId() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

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

export async function GET() {
  try {
    const organizationId = await getUserOrganizationId()
    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: 'Organization not found' },
        { status: 404 }
      )
    }

    const supabase = await createClient()
    
    // Get current month range
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    
    const formatDate = (date: Date) => {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }

    const today = formatDate(new Date())
    const monthStart = formatDate(startDate)
    const monthEnd = formatDate(endDate)

    // Get all departments
    const { data: departments } = await supabase
      .from('departments')
      .select('id, name')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (!departments || departments.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Calculate stats for each department
    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        // Get total members in this department
        const { data: members } = await supabase
          .from('organization_members')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('department_id', dept.id)
          .eq('is_active', true)

        const totalMembers = members?.length || 0
        const memberIds = members?.map(m => m.id) || []

        if (totalMembers === 0) {
          return null
        }

        // Get present count for today
        const { count: presentToday } = await supabase
          .from('attendance_records')
          .select('id', { count: 'exact', head: true })
          .in('organization_member_id', memberIds)
          .eq('attendance_date', today)
          .in('status', ['present', 'late'])

        // Get total attendance this month
        const { count: monthlyAttendance } = await supabase
          .from('attendance_records')
          .select('id', { count: 'exact', head: true })
          .in('organization_member_id', memberIds)
          .gte('attendance_date', monthStart)
          .lte('attendance_date', monthEnd)
          .in('status', ['present', 'late'])

        // Calculate working days this month (approximate)
        const daysInMonth = endDate.getDate()
        const workingDays = Math.floor(daysInMonth * (5/7)) // Rough estimate
        const expectedAttendance = totalMembers * workingDays

        const attendanceRate = expectedAttendance > 0
          ? Math.round((monthlyAttendance || 0) / expectedAttendance * 100)
          : 0

        return {
          id: dept.id.toString(),
          name: dept.name,
          attendanceRate: Math.min(100, attendanceRate), // Cap at 100%
          totalMembers,
          presentToday: presentToday || 0,
          rank: 0 // Will be calculated after sorting
        }
      })
    )

    // Filter out null values and sort by attendance rate
    const validStats = departmentStats
      .filter((stat): stat is NonNullable<typeof stat> => stat !== null)
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .map((stat, index) => ({
        ...stat,
        rank: index + 1
      }))

    return NextResponse.json(
      { success: true, data: validStats },
      {
        headers: {
          'Cache-Control': 'public, max-age=180, stale-while-revalidate=60',
          'Vary': 'Cookie'
        }
      }
    )
  } catch (err) {
    dashboardLogger.error('API /dashboard/department-comparison error', err)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch department comparison' },
      { status: 500 }
    )
  }
}
