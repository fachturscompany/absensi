import { NextResponse } from "next/server"
import { createSupabaseClient } from "@/config/supabase-config"

import { scheduleLogger } from '@/lib/logger';
// Batch API untuk schedules page
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

    // Parallel fetch
    const [schedulesResult, organizationsResult] = await Promise.all([
      supabase
        .from("work_schedules")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),

      supabase.from("organizations").select("id, name"),
    ])

    return NextResponse.json({
      success: true,
      data: {
        schedules: schedulesResult.data || [],
        organizations: organizationsResult.data || [],
      },
    })
  } catch (error) {
    scheduleLogger.error("Error in schedules init:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
