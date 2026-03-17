import { NextResponse } from "next/server"
import { createSupabaseClient } from "@/config/supabase-config"

import { memberLogger } from '@/lib/logger';
// Batch API untuk members page - 3 queries jadi 1 request
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("organizationId")

    const supabase = await createSupabaseClient()

    // Parallel fetch dengan joins
    const [membersResult, usersResult, groupsResult] = await Promise.all([
      // Members dengan user relation
      organizationId
        ? supabase
            .from("organization_members")
            .select(`
              *,
              user:user_id (*),
              departments:department_id (
                id,
                name
              ),
              groups:group_id (
                id,
                name
              )
            `)
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false })
        : supabase
            .from("organization_members")
            .select(`
              *,
              user:user_id (*),
              departments:department_id (
                id,
                name
              ),
              groups:group_id (
                id,
                name
              )
            `)
            .order("created_at", { ascending: false }),

      // All users (for fallback if join fails)
      supabase.from("users").select("*"),

      // Groups/Departments
      supabase.from("groups").select("id, name"),
    ])

    return NextResponse.json({
      success: true,
      data: {
        members: membersResult.data || [],
        users: usersResult.data || [],
        groups: groupsResult.data || [],
      },
    })
  } catch (error) {
    memberLogger.error("Error in members init:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
