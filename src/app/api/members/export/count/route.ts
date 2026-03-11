import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get("organizationId")
    const search = searchParams.get("search") || ""
    const active = searchParams.get("active") || "all"
    const groupsParam = searchParams.get("groups") || ""
    const gendersParam = searchParams.get("genders") || ""
    const agamasParam = searchParams.get("agamas") || ""

    const selectedGroups = groupsParam ? groupsParam.split(",").filter(Boolean) : []
    const selectedGenders = gendersParam ? gendersParam.split(",").filter(Boolean) : []
    const selectedAgamas = agamasParam ? agamasParam.split(",").filter(Boolean) : []

    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: "Organization ID is required" },
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

    // Build query
    let query = adminClient
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)

    // Apply status filter
    if (active === "active") {
      query = query.eq("is_active", true)
    } else if (active === "inactive") {
      query = query.eq("is_active", false)
    }

    // Apply group filter (multiple)
    if (selectedGroups.length > 0) {
      query = query.in("department_id", selectedGroups.map(id => parseInt(id, 10)))
    }

    // For search, gender, and agama, we need to join with biodata
    // So we'll use a different approach - fetch and filter in memory or use a more complex query
    if (search || selectedGenders.length > 0 || selectedAgamas.length > 0) {
      // Use select with join to filter
      let dataQuery = adminClient
        .from("organization_members")
        .select(`
          id,
          biodata_nik,
          user:user_id (
            id,
            nik,
            email,
            first_name,
            last_name,
            display_name,
            jenis_kelamin,
            agama
          )
        `)
        .eq("organization_id", organizationId)

      if (active === "active") {
        dataQuery = dataQuery.eq("is_active", true)
      } else if (active === "inactive") {
        dataQuery = dataQuery.eq("is_active", false)
      }

      if (selectedGroups.length > 0) {
        dataQuery = dataQuery.in("department_id", selectedGroups.map(id => parseInt(id, 10)))
      }

      const { data: members, error } = await dataQuery

      if (error) {
        console.error("Error fetching members:", error)
        return NextResponse.json(
          { success: false, message: "Failed to count members" },
          { status: 500 }
        )
      }

      // Helper function to extract user profile from Supabase relation
      const getUserProfile = (member: any) => {
        if (Array.isArray(member.user)) {
          return member.user[0] || {}
        } else if (member.user && typeof member.user === 'object') {
          return member.user
        }
        return {}
      }

      // Filter out members without user profile
      let filtered = (members || []).filter((member: any) => {
        const userProfile = getUserProfile(member)
        // Exclude members yang tidak punya user_id dan tidak punya user profile data
        return member.user_id || (userProfile && Object.keys(userProfile).length > 0)
      })

      if (search) {
        const searchLower = search.toLowerCase()
        filtered = filtered.filter((member: any) => {
          const userProfile = getUserProfile(member)
          const displayName = userProfile.display_name || `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
          const full = [userProfile.first_name, userProfile.userProfile.last_name].filter(Boolean).join(' ')
          return (
            member.biodata_nik?.toLowerCase().includes(searchLower) ||
            (userProfile.nik || '').toLowerCase().includes(searchLower) ||
            displayName.toLowerCase().includes(searchLower) ||
            full.toLowerCase().includes(searchLower) ||
            (userProfile.email && !userProfile.email.toLowerCase().endsWith('@dummy.local') && userProfile.email.toLowerCase().includes(searchLower))
          )
        })
      }
      if (selectedGenders.length > 0) {
        filtered = filtered.filter((member: any) => {
          const userProfile = getUserProfile(member)
          // Convert user_profiles jenis_kelamin (male/female) to biodata format (L/P) for comparison
          const genderMap: Record<string, string> = { 'male': 'L', 'female': 'P' }
          const gender = genderMap[userProfile.jenis_kelamin || ''] || userProfile.jenis_kelamin
          return selectedGenders.includes(gender)
        })
      }
      if (selectedAgamas.length > 0) {
        filtered = filtered.filter((member: any) => {
          const userProfile = getUserProfile(member)
          return selectedAgamas.includes(userProfile.agama)
        })
      }

      return NextResponse.json({ success: true, count: filtered.length })

    } else {
      // Simple count query without joins
      const { count, error } = await query

      if (error) {
        console.error("Error counting members:", error)
        return NextResponse.json(
          { success: false, message: "Failed to count members" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        count: count || 0,
      })
    }
  } catch (error: any) {
    console.error("Error in export count:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}


