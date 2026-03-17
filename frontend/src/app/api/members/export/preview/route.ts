import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "10", 10)
    const organizationId = searchParams.get("organizationId")
    const search = searchParams.get("search") || ""
    const active = searchParams.get("active") || "all"
    const groupsParam = searchParams.get("groups") || ""
    const gendersParam = searchParams.get("genders") || ""
    const agamasParam = searchParams.get("agamas") || ""
    const fieldsParam = searchParams.get("fields") || ""
    const selectedFields = fieldsParam ? fieldsParam.split(",") : []
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
      .select(`
        id,
        is_active,
        hire_date,
        user:user_id (
          id,
          nik,
          email,
          first_name,
          last_name,
          display_name,
          phone,
          mobile,
          date_of_birth,
          jenis_kelamin,
          nisn,
          tempat_lahir,
          agama,
          profile_photo_url
        ),
        departments:department_id (
          id,
          name
        ),
        positions:position_id (
          id,
          title
        )
      `)
      .eq("organization_id", organizationId)
      .limit(limit)

    // Apply filters
    if (active === "active") {
      query = query.eq("is_active", true)
    } else if (active === "inactive") {
      query = query.eq("is_active", false)
    }

    // Apply group filter (multiple)
    if (selectedGroups.length > 0) {
      query = query.in("department_id", selectedGroups.map(id => parseInt(id, 10)))
    }

    const { data: members, error } = await query

    if (error) {
      console.error("Error fetching members:", error)
      return NextResponse.json(
        { success: false, message: "Failed to fetch members" },
        { status: 500 }
      )
    }

    // Filter by search, gender, and agama in memory (since they require user_profiles join)
    // Helper function to extract user profile from Supabase relation
    const getUserProfile = (member: any) => {
      if (Array.isArray(member.user)) {
        return member.user[0] || {}
      } else if (member.user && typeof member.user === 'object') {
        return member.user
      }
      return {}
    }

    // Helper function to filter dummy emails
    const getEmail = (email: string | null | undefined): string => {
      if (!email) return ""
      // Filter out dummy emails (ending with @dummy.local)
      if (email.toLowerCase().endsWith('@dummy.local')) {
        return ""
      }
      return email
    }

    // Filter out members without user profile
    let filteredMembers = (members || []).filter((member: any) => {
      const userProfile = getUserProfile(member)
      // Exclude members yang tidak punya user_id dan tidak punya user profile data
      return member.user_id || (userProfile && Object.keys(userProfile).length > 0)
    })

    if (search) {
      const searchLower = search.toLowerCase()
      filteredMembers = filteredMembers.filter((member: any) => {
        const userProfile = getUserProfile(member)
        const displayName = userProfile.display_name || `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
        return (
          member.biodata_nik?.toLowerCase().includes(searchLower) ||
          member.employee_id?.toLowerCase().includes(searchLower) ||
          displayName.toLowerCase().includes(searchLower) ||
          (userProfile.email && !userProfile.email.toLowerCase().endsWith('@dummy.local') && userProfile.email.toLowerCase().includes(searchLower))
        )
      })
    }

    if (selectedGenders.length > 0) {
      filteredMembers = filteredMembers.filter((member: any) => {
        const userProfile = getUserProfile(member)
        // Convert user_profiles jenis_kelamin (male/female) to biodata format (L/P) for comparison
        const genderMap: Record<string, string> = { 'male': 'L', 'female': 'P' }
        const gender = genderMap[userProfile.jenis_kelamin || ''] || userProfile.jenis_kelamin
        return selectedGenders.includes(gender)
      })
    }

    if (selectedAgamas.length > 0) {
      filteredMembers = filteredMembers.filter((member: any) => {
        const userProfile = getUserProfile(member)
        return selectedAgamas.includes(userProfile.agama)
      })
    }

    // Limit results
    filteredMembers = filteredMembers.slice(0, limit)

    // Transform data based on selected fields - from user_profiles
    type ExportRow = Record<string, string>
    const transformedData = filteredMembers.map((member: any) => {
      const userProfile = getUserProfile(member)
      const displayName = userProfile.display_name || `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
      const fullName = [userProfile.first_name, userProfile.userProfile.last_name].filter(Boolean).join(" ").trim()
      
      // Convert user_profiles jenis_kelamin (male/female) to biodata format (L/P)
      const genderMap: Record<string, string> = { 'male': 'L', 'female': 'P' }
      const jenisKelamin = genderMap[userProfile.jenis_kelamin || ''] || userProfile.jenis_kelamin || ""
      
      const dep = member.departments
      const row: ExportRow = {}

      // Include fields from user_profiles (mapped to biodata format for compatibility)
      if (selectedFields.includes("nik")) {
        row.nik = member.biodata_nik || userProfile.nik || "-"
      }
      if (selectedFields.includes("nama")) {
        row.nama = displayName || fullName || "-"
      }
      if (selectedFields.includes("nickname")) {
        row.nickname = "-" // nickname tidak ada di user_profiles
      }
      if (selectedFields.includes("nisn")) {
        row.nisn = userProfile.nisn || "-"
      }
      if (selectedFields.includes("jenis_kelamin")) {
        row.jenis_kelamin = jenisKelamin || "-"
      }
      if (selectedFields.includes("tempat_lahir")) {
        row.tempat_lahir = userProfile.tempat_lahir || "-"
      }
      if (selectedFields.includes("tanggal_lahir")) {
        row.tanggal_lahir = userProfile.date_of_birth || "-"
      }
      if (selectedFields.includes("agama")) {
        row.agama = userProfile.agama || "-"
      }
      if (selectedFields.includes("jalan")) {
        row.jalan = userProfile.jalan || "-"
      }
      if (selectedFields.includes("rt")) {
        row.rt = userProfile.rt || "-"
      }
      if (selectedFields.includes("rw")) {
        row.rw = userProfile.rw || "-"
      }
      if (selectedFields.includes("dusun")) {
        row.dusun = userProfile.dusun || "-"
      }
      if (selectedFields.includes("kelurahan")) {
        row.kelurahan = userProfile.kelurahan || "-"
      }
      if (selectedFields.includes("kecamatan")) {
        row.kecamatan = userProfile.kecamatan || "-"
      }
      if (selectedFields.includes("no_telepon")) {
        row.no_telepon = userProfile.phone || userProfile.mobile || "-"
      }
      if (selectedFields.includes("email")) {
        row.email = getEmail(userProfile.email) || "-"
      }
      if (selectedFields.includes("department_id")) {
        const depName = Array.isArray(dep) ? (dep[0]?.name ?? "-") : (dep?.name ?? "-")
        row.department_id = String(depName)
      }

      return row
    })

    return NextResponse.json({
      success: true,
      data: transformedData,
      count: transformedData.length,
    })
  } catch (error: any) {
    console.error("Error in export preview:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

