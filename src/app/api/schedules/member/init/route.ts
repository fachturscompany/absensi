import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get("organizationId")

        if (!organizationId) {
            return NextResponse.json(
                { success: false, message: "Organization ID required" },
                { status: 400 }
            )
        }

        // Fetch all active members in the organization
        const { createAdminClient } = await import('@/utils/supabase/admin')
        const admin = createAdminClient()

        const { data: members, error } = await admin
            .from("organization_members")
            .select(`
        id,
        employee_id,
        organization_id,
        user:user_id (
          id,
          first_name,
          last_name,
          email,
          profile_photo_url
        )
      `)
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false })

        if (error) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 })
        }

        const { data: workSchedules, error: wsError } = await admin
            .from("work_schedules")
            .select("*")
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false })

        if (wsError) {
            return NextResponse.json({ success: false, message: wsError.message }, { status: 500 })
        }

        const memberIds = (members || []).map((m: any) => m.id)

        let memberSchedules: any[] = []
        if (memberIds.length > 0) {
            const { data: ms } = await admin
                .from("member_schedules")
                .select(`
          *,
          organization_member:organization_member_id (
            id,
            employee_id,
            user:user_id (
              id,
              first_name,
              last_name,
              email,
              profile_photo_url
            )
          ),
          work_schedule:work_schedule_id (
            id,
            code,
            name,
            schedule_type
          )
        `)
                .in("organization_member_id", memberIds)
                .order("created_at", { ascending: false })

            memberSchedules = ms || []
        }

        return NextResponse.json({
            success: true,
            data: {
                members: members || [],
                workSchedules: workSchedules || [],
                memberSchedules,
            },
        })
    } catch (error) {
        console.error("Error in schedules/member/init:", error)
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
}
