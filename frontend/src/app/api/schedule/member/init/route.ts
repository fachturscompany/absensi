import { NextResponse } from "next/server"
import { createSupabaseClient } from "@/config/supabase-config"

import { memberLogger } from '@/lib/logger';
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("organizationId")

    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: "Organization ID required" },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseClient()

    // Batch all queries in parallel - 1 round trip to DB
    const [membersResult, workSchedulesResult, memberSchedulesResult] = await Promise.all([
      // Get organization members
      supabase
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
        .order("created_at", { ascending: false }),

      // Get work schedules
      supabase
        .from("work_schedules")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),

      // Get member schedules with relations
      supabase
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
        .in(
          "organization_member_id",
          // Will be populated after members query
          []
        )
        .order("created_at", { ascending: false }),
    ])

    // Filter member schedules by organization members
    let memberSchedules = memberSchedulesResult.data || []
    if (membersResult.data) {
      const memberIds = membersResult.data.map((m: any) => m.id)
      memberSchedules = (memberSchedulesResult.data || []).filter((ms: any) =>
        memberIds.includes(ms.organization_member_id)
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        members: membersResult.data || [],
        workSchedules: workSchedulesResult.data || [],
        memberSchedules,
      },
    })
  } catch (error) {
    memberLogger.error("Error in member-schedules init:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
