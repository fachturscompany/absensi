import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get("organizationId")
    const column = searchParams.get("column") // "agama", "jenis_kelamin", etc.

    if (!organizationId || !column) {
      return NextResponse.json(
        { success: false, message: "Organization ID and column are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Auth check
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 }
      )
    }

    // Verify user is member of organization
    const { data: member } = await adminClient
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .maybeSingle()

    if (!member) {
      return NextResponse.json(
        { success: false, message: "User is not a member of the specified organization" },
        { status: 403 }
      )
    }

    if (!["jenis_kelamin", "agama"].includes(column)) {
      return NextResponse.json({ success: true, options: [] })
    }

    // Get unique values from user_profiles for the specified column
    const query = adminClient
      .from("organization_members")
      .select(`
        user:user_id (
          ${column}
        )
      `)
      .eq("organization_id", organizationId)
      .not("user_id", "is", null)

    const { data: members, error } = await query

    if (error) {
      console.error("Error fetching filter options:", error)
      return NextResponse.json(
        { success: false, message: "Failed to fetch filter options" },
        { status: 500 }
      )
    }

    // Extract unique values
    const uniqueValues = new Set<string>()
    members?.forEach((member: any) => {
      const userProfile = Array.isArray(member.user) ? member.user[0] : member.user
      if (userProfile && userProfile[column]) {
        let value = userProfile[column]
        // Convert jenis_kelamin from user_profiles format (male/female) to biodata format (L/P)
        if (column === "jenis_kelamin") {
          if (value === "male") value = "L"
          else if (value === "female") value = "P"
        }
        if (value && String(value).trim() !== "") {
          uniqueValues.add(String(value))
        }
      }
    })

    // Convert to array and sort
    const options = Array.from(uniqueValues)
      .sort()
      .map(value => {
        // Map values to labels for specific columns
        let label = value
        if (column === "jenis_kelamin") {
          if (value === "L") label = "Laki-laki"
          else if (value === "P") label = "Perempuan"
        }
        return {
          value,
          label,
        }
      })

    return NextResponse.json({
      success: true,
      options,
    })
  } catch (error: any) {
    console.error("Error in filter options:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

