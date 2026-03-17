import { NextResponse } from "next/server"
import { createSupabaseClient } from "@/config/supabase-config"

import { attendanceLogger } from '@/lib/logger';
// Batch API untuk attendance page - 6 queries jadi 1 request
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("organizationId")

    const supabase = await createSupabaseClient()

    // Parallel fetch - optimized dengan joins
    const [attendanceResult, membersResult, usersResult, orgResult] = await Promise.all([
      // Attendance dengan joins langsung
      supabase
        .from("attendance_records")
        .select(`
          *,
          organization_member:organization_member_id (
            id,
            employee_id,
            user_id,
            organization_id
          )
        `)
        .order("created_at", { ascending: false })
        .limit(1000),

      // Members
      organizationId
        ? supabase
          .from("organization_members")
          .select("*")
          .eq("organization_id", organizationId)
        : supabase.from("organization_members").select("*"),

      // Users
      supabase.from("users").select("*"),

      // Organizations
      supabase.from("organizations").select("*"),
    ])

    // Work schedules & member schedules
    const [workSchedulesResult, memberSchedulesResult] = await Promise.all([
      organizationId
        ? supabase
          .from("work_schedules")
          .select("*")
          .eq("organization_id", organizationId)
        : supabase.from("work_schedules").select("*"),

      supabase
        .from("member_schedules")
        .select(`
          *,
          organization_member:organization_member_id (
            id,
            organization_id
          )
        `),
    ])

    // Filter member schedules by organization
    let memberSchedules = memberSchedulesResult.data || []
    if (organizationId && membersResult.data) {
      const memberIds = membersResult.data.map((m: any) => m.id)
      memberSchedules = memberSchedules.filter((ms: any) =>
        memberIds.includes(ms.organization_member_id)
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        attendance: attendanceResult.data || [],
        members: membersResult.data || [],
        users: usersResult.data || [],
        organizations: orgResult.data || [],
        workSchedules: workSchedulesResult.data || [],
        memberSchedules,
      },
    })
  } catch (error) {
    attendanceLogger.error("Error in attendance init:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
