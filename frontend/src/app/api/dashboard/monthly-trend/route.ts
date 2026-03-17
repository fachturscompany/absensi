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
    
    // Get member IDs for the organization
    const { data: memberIds } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    const memberIdList = (memberIds || []).map((m: any) => m.id)

    // Get last 6 months data
    const monthsData = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = targetDate.getFullYear()
      const month = targetDate.getMonth() + 1
      
      // Get first and last day of month
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)
      
      const formatDate = (date: Date) => {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
      }

      // Get attendance count for this month
      const { count: attendanceCount } = await supabase
        .from('attendance_records')
        .select('id', { count: 'exact', head: true })
        .in('organization_member_id', memberIdList)
        .gte('attendance_date', formatDate(startDate))
        .lte('attendance_date', formatDate(endDate))
        .in('status', ['present', 'late'])

      // Get late count for this month
      const { count: lateCount } = await supabase
        .from('attendance_records')
        .select('id', { count: 'exact', head: true })
        .in('organization_member_id', memberIdList)
        .gte('attendance_date', formatDate(startDate))
        .lte('attendance_date', formatDate(endDate))
        .eq('status', 'late')

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      
      monthsData.push({
        month: monthNames[month - 1],
        attendance: attendanceCount || 0,
        late: lateCount || 0
      })
    }

    return NextResponse.json(
      { success: true, data: monthsData },
      {
        headers: {
          'Cache-Control': 'public, max-age=180, stale-while-revalidate=60',
          'Vary': 'Cookie'
        }
      }
    )
  } catch (err) {
    dashboardLogger.error('API /dashboard/monthly-trend error', err)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch monthly trend data' },
      { status: 500 }
    )
  }
}
