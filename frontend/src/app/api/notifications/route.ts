import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { dashboardLogger } from '@/lib/logger'

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

export async function GET(request: Request) {
  try {
    const organizationId = await getUserOrganizationId()
    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: 'Organization not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const supabase = await createClient()
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Fetch all notification types in parallel
    const [attendanceResult, leavesResult, invitesResult] = await Promise.all([
      // Attendance notifications (last 7 days)
      supabase
        .from('attendance_records')
        .select(`
          id,
          status,
          actual_check_in,
          late_minutes,
          attendance_date,
          organization_member_id,
          organization_members!inner (
            id,
            department_id,
            user_profiles!inner (
              first_name,
              last_name
            ),
            departments!organization_members_department_id_fkey (
              name
            )
          )
        `)
        .eq('organization_members.organization_id', organizationId)
        .gte('attendance_date', sevenDaysAgo)
        .not('actual_check_in', 'is', null)
        .order('actual_check_in', { ascending: false })
        .limit(limit),

      // Leave notifications (recent approvals, requests, etc.)
      supabase
        .from('leave_requests')
        .select(`
          id,
          status,
          requested_at,
          approved_at,
          start_date,
          end_date,
          total_days,
          leave_type:leave_types (
            name,
            code
          ),
          organization_member:organization_members!inner (
            id,
            organization_id,
            user_profiles!inner (
              first_name,
              last_name
            )
          )
        `)
        .eq('organization_members.organization_id', organizationId)
        .gte('requested_at', sevenDaysAgo)
        .in('status', ['pending', 'approved', 'rejected'])
        .order('requested_at', { ascending: false })
      .limit(limit),

      // Invitation notifications (recent invites)
      supabase
        .from('member_invitations')
        .select(`
          id,
          email,
          status,
          created_at,
          accepted_at,
          invited_by,
          inviter:user_profiles!invited_by (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .in('status', ['pending', 'accepted', 'expired', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(limit)
    ])

    const notifications: Record<string, unknown>[] = []

    // Transform attendance records
    if (attendanceResult.data) {
      attendanceResult.data.forEach((record: Record<string, unknown>) => {
        const member = record.organization_members as Record<string, unknown>
        const profile = member?.user_profiles as Record<string, unknown>
        const memberName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown'
        
        notifications.push({
          id: `attendance-${record.id}`,
          type: 'attendance',
          timestamp: record.actual_check_in,
          memberName,
          status: record.status,
          lateMinutes: record.late_minutes,
          data: {
            checkInTime: record.actual_check_in,
            attendanceDate: record.attendance_date
          }
        })
      })
    }

    // Transform leave requests
    if (leavesResult.data) {
      leavesResult.data.forEach((request: Record<string, unknown>) => {
        const member = request.organization_member as Record<string, unknown>
        const profile = member?.user_profiles as Record<string, unknown>
        const memberName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown'
        const leaveType = (request.leave_type as Record<string, unknown>)?.name || 'Leave'
        
        let timestamp = request.requested_at
        let action = 'requested'
        
        if (request.status === 'approved' && request.approved_at) {
          timestamp = request.approved_at
          action = 'approved'
        } else if (request.status === 'rejected') {
          action = 'rejected'
        }

        notifications.push({
          id: `leave-${request.id}`,
          type: 'leaves',
          timestamp,
          memberName,
          status: request.status,
          action,
          data: {
            leaveType,
            startDate: request.start_date,
            endDate: request.end_date,
            totalDays: request.total_days
          }
        })
      })
    }

    // Transform invitations
    if (invitesResult.data) {
      for (const invite of invitesResult.data) {
        let inviterName = "System"
        
        // Try to get inviter profile from relation
        const inviterProfile = Array.isArray(invite.inviter) ? invite.inviter[0] : invite.inviter
        
        if (inviterProfile && typeof inviterProfile === 'object') {
          if (inviterProfile.first_name || inviterProfile.last_name) {
            inviterName = `${inviterProfile.first_name || ""} ${inviterProfile.last_name || ""}`.trim()
          } else if (inviterProfile.email) {
            // Fallback to email username if name not available
            inviterName = inviterProfile.email.split('@')[0]
          }
        } else if (invite.invited_by) {
          // If relation failed, try to fetch directly using invited_by
          const { data: directInviter } = await supabase
            .from('user_profiles')
            .select('first_name, last_name, email')
            .eq('id', invite.invited_by)
            .maybeSingle()
          
          if (directInviter) {
            if (directInviter.first_name || directInviter.last_name) {
              inviterName = `${directInviter.first_name || ""} ${directInviter.last_name || ""}`.trim()
            } else if (directInviter.email) {
              inviterName = directInviter.email.split('@')[0]
            }
          }
        }
        
        const recipients = invite.email ? [invite.email] : []
        const timestamp = invite.status === "accepted" ? (invite.accepted_at || invite.created_at) : invite.created_at

        notifications.push({
          id: `invite-${invite.id}`,
          type: "invites",
          timestamp,
          memberName: invite.email || "Unknown",
          status: invite.status,
          action: invite.status === "accepted" ? "accepted" : "sent",
          data: {
            inviterName,
            recipients,
          },
        })
      }
    }

    // Sort by timestamp (newest first)
    notifications.sort((a, b) => {
      const dateA = new Date(a.timestamp as string).getTime()
      const dateB = new Date(b.timestamp as string).getTime()
      return dateB - dateA
    })

    // Limit results
    const limitedNotifications = notifications.slice(0, limit)

    return NextResponse.json(
      { success: true, data: limitedNotifications },
      {
        headers: {
          'Cache-Control': 'private, no-cache, must-revalidate',
          'Vary': 'Cookie'
        }
      }
    )
  } catch (err) {
    dashboardLogger.error('API /notifications error', err)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
