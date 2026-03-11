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
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "1000", 10)
    
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

    // Build query - fetch ALL user_profiles columns
    // Fetch all data using pagination to handle large datasets (>1000 records)
    let allMembers: any[] = []
    let currentPage = 0
    const fetchPageSize = 1000 // Supabase max per request
    let hasMore = true

    while (hasMore) {
      const from = currentPage * fetchPageSize
      const to = from + fetchPageSize - 1
      
      let query = adminClient
        .from("organization_members")
        .select(`
          id,
          biodata_nik,
          is_active,
          hire_date,
          department_id,
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
            jalan,
            rt,
            rw,
            dusun,
            kelurahan,
            kecamatan
          ),
          departments:department_id ( id, name ),
          positions:position_id ( id, title )
        `)
        .eq("organization_id", organizationId)
        .order("id", { ascending: true })
        .range(from, to)

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

      const { data: pageData, error } = await query

      if (error) {
        console.error("Error fetching members:", error)
        return NextResponse.json(
          { success: false, message: "Failed to fetch members" },
          { status: 500 }
        )
      }

      if (pageData && pageData.length > 0) {
        allMembers = allMembers.concat(pageData)
        // If we got less than fetchPageSize, we're done
        if (pageData.length < fetchPageSize) {
          hasMore = false
        } else {
          currentPage++
        }
      } else {
        hasMore = false
      }

      // Safety limit: stop after 20 pages (20,000 records)
      if (currentPage >= 20) {
        console.warn("Reached safety limit of 20 pages (20,000 records)")
        hasMore = false
      }
    }

    const members = allMembers

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
          (userProfile.email && !userProfile.email.toLowerCase().endsWith('@dummy.local') && userProfile.email.toLowerCase().includes(searchLower)) ||
          userProfile.nik?.toLowerCase().includes(searchLower)
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

    // Apply pagination
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedMembers = filteredMembers.slice(startIndex, endIndex)

    // Transform to flat structure with user_profiles columns
    const transformedData = paginatedMembers.map((member: any) => {
      const userProfile = getUserProfile(member)
      const displayName = userProfile.display_name || `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
      
      // Convert user_profiles jenis_kelamin (male/female) to biodata format (L/P)
      const genderMap: Record<string, string> = { 'male': 'L', 'female': 'P' }
      const jenisKelamin = genderMap[userProfile.jenis_kelamin || ''] || userProfile.jenis_kelamin || ""

      // Get department name from departments relation
      const getDepartmentName = (member: any): string => {
        if (member.departments) {
          if (Array.isArray(member.departments) && member.departments.length > 0) {
            return member.departments[0]?.name || ""
          } else if (typeof member.departments === 'object' && member.departments.name) {
            return member.departments.name
          }
        }
        return ""
      }

      // Return columns from user_profiles (mapped to biodata format for compatibility)
      return {
        nik: member.biodata_nik || userProfile.nik || "",
        nama: displayName || "",
        nickname: "", // nickname tidak ada di user_profiles
        nisn: userProfile.nisn || "",
        jenis_kelamin: jenisKelamin,
        tempat_lahir: userProfile.tempat_lahir || "",
        tanggal_lahir: userProfile.date_of_birth || "",
        agama: userProfile.agama || "",
        jalan: userProfile.jalan || "",
        rt: userProfile.rt || "",
        rw: userProfile.rw || "",
        dusun: userProfile.dusun || "",
        kelurahan: userProfile.kelurahan || "",
        kecamatan: userProfile.kecamatan || "",
        no_telepon: userProfile.phone || userProfile.mobile || "",
        email: getEmail(userProfile.email) || "",
        department_id: getDepartmentName(member) || "", // Use department name instead of ID
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedData,
      count: transformedData.length,
      total: filteredMembers.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredMembers.length / pageSize),
    })
  } catch (error: any) {
    console.error("Error in export rows:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

