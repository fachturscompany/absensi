import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get("format") || "xlsx"
    const organizationId = searchParams.get("organizationId")
    const search = searchParams.get("search") || ""
    const active = searchParams.get("active") || "all"
    const groupsParam = searchParams.get("groups") || ""
    const gendersParam = searchParams.get("genders") || ""
    const agamasParam = searchParams.get("agamas") || ""
    const fieldsParam = searchParams.get("fields") || ""
    const selectedNiksParam = searchParams.get("selectedNiks") || ""
    const includeHeader = searchParams.get("includeHeader") === "true"
    const selectedFields = fieldsParam ? fieldsParam.split(",") : []
    const selectedGroups = groupsParam ? groupsParam.split(",").filter(Boolean) : []
    const selectedGenders = gendersParam ? gendersParam.split(",").filter(Boolean) : []
    const selectedAgamas = agamasParam ? agamasParam.split(",").filter(Boolean) : []
    const selectedNiks = selectedNiksParam ? selectedNiksParam.split(",").filter(Boolean) : []

    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: "Organization ID is required" },
        { status: 400 }
      )
    }

    if (selectedFields.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one field must be selected" },
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

    // Fetch all members using pagination to handle large datasets
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
          employee_id,
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
            kecamatan,
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
        .order("id", { ascending: true })
        .range(from, to)

      // Jika ada selectedNiks, hanya filter berdasarkan NIK tersebut (abaikan filter lain)
      if (selectedNiks.length > 0) {
        query = query.in("biodata_nik", selectedNiks)
      } else {
        // Apply filters hanya jika tidak ada selectedNiks
        if (active === "active") {
          query = query.eq("is_active", true)
        } else if (active === "inactive") {
          query = query.eq("is_active", false)
        }

        // Apply group filter (multiple)
        if (selectedGroups.length > 0) {
          query = query.in("department_id", selectedGroups.map(id => parseInt(id, 10)))
        }
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

    // Field labels mapping
    const fieldLabels: Record<string, string> = {
      nik: "NIK",
      nama: "Nama Lengkap",
      nickname: "Nickname",
      nisn: "NISN",
      jenis_kelamin: "Jenis Kelamin",
      tempat_lahir: "Tempat Lahir",
      tanggal_lahir: "Tanggal Lahir",
      agama: "Agama",
      jalan: "Jalan",
      rt: "RT",
      rw: "RW",
      dusun: "Dusun",
      kelurahan: "Kelurahan",
      kecamatan: "Kecamatan",
      no_telepon: "No. Telepon",
      email: "Email",
      department_id: "Group",
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
    // Jika ada selectedNiks, skip filter ini karena sudah difilter di query
    let filteredMembers = (members || []).filter((member: any) => {
      const userProfile = getUserProfile(member)
      // Exclude members yang tidak punya user_id dan tidak punya user profile data
      return member.user_id || (userProfile && Object.keys(userProfile).length > 0)
    })

    if (selectedNiks.length === 0) {
      // Hanya apply filter ini jika tidak ada selectedNiks
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
    }

    // Transform data - from user_profiles
    type ExportRow = Record<string, string>
    const exportData = filteredMembers.map((member: any) => {
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
        row["NIK"] = member.biodata_nik || userProfile.nik || ""
      }
      if (selectedFields.includes("nama")) {
        row["Nama Lengkap"] = displayName || fullName || ""
      }
      if (selectedFields.includes("nickname")) {
        row["Nickname"] = "" // nickname tidak ada di user_profiles
      }
      if (selectedFields.includes("nisn")) {
        row["NISN"] = userProfile.nisn || ""
      }
      if (selectedFields.includes("jenis_kelamin")) {
        row["Jenis Kelamin"] = jenisKelamin || ""
      }
      if (selectedFields.includes("tempat_lahir")) {
        row["Tempat Lahir"] = userProfile.tempat_lahir || ""
      }
      if (selectedFields.includes("tanggal_lahir")) {
        row["Tanggal Lahir"] = userProfile.date_of_birth || ""
      }
      if (selectedFields.includes("agama")) {
        row["Agama"] = userProfile.agama || ""
      }
      if (selectedFields.includes("jalan")) {
        row["Jalan"] = userProfile.jalan || ""
      }
      if (selectedFields.includes("rt")) {
        row["RT"] = userProfile.rt || ""
      }
      if (selectedFields.includes("rw")) {
        row["RW"] = userProfile.rw || ""
      }
      if (selectedFields.includes("dusun")) {
        row["Dusun"] = userProfile.dusun || ""
      }
      if (selectedFields.includes("kelurahan")) {
        row["Kelurahan"] = userProfile.kelurahan || ""
      }
      if (selectedFields.includes("kecamatan")) {
        row["Kecamatan"] = userProfile.kecamatan || ""
      }
      if (selectedFields.includes("no_telepon")) {
        row["No. Telepon"] = userProfile.phone || userProfile.mobile || ""
      }
      if (selectedFields.includes("email")) {
        row["Email"] = getEmail(userProfile.email) || ""
      }
      if (selectedFields.includes("department_id")) {
        const depName = Array.isArray(dep) ? (dep[0]?.name ?? "") : (dep?.name ?? "")
        row["Group"] = String(depName)
      }

      // Kolom yang tidak tersedia di user_profiles ? kosongkan
      for (const [key, label] of Object.entries({
        nickname: "Nickname",
        nisn: "NISN",
        tempat_lahir: "Tempat Lahir",
        tanggal_lahir: "Tanggal Lahir",
        jalan: "Jalan",
        rt: "RT",
        rw: "RW",
        dusun: "Dusun",
        kelurahan: "Kelurahan",
        kecamatan: "Kecamatan",
        no_telepon: "No. Telepon"
      })) {
        if (selectedFields.includes(key)) row[label] = ""
      }

      return row
    })

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(exportData, {
      header: includeHeader ? selectedFields.map((f: string) => fieldLabels[f] ?? f) : undefined,
    })

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members")

    // Generate file buffer
    let buffer: Buffer
    let mimeType: string
    let fileExtension: string

    if (format === "csv") {
      // For CSV, convert to CSV string
      const csv = XLSX.utils.sheet_to_csv(worksheet)
      buffer = Buffer.from(csv, "utf-8")
      mimeType = "text/csv"
      fileExtension = "csv"
    } else {
      // For XLSX
      buffer = Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }))
      mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      fileExtension = "xlsx"
    }

    // Konversi ke Uint8Array agar kompatibel dengan NextResponse typings
    const uint8Buffer = new Uint8Array(buffer)

    // Return file as response
    const fileName = `members-export-${new Date().toISOString().split("T")[0]}.${fileExtension}`

    return new NextResponse(uint8Buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": uint8Buffer.byteLength.toString(),
      },
    })
  } catch (error: any) {
    console.error("Error in export:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// POST handler untuk mengatasi masalah 431 (Request Header Fields Too Large)
// Menggunakan body untuk data besar seperti selectedNiks
export async function POST(request: NextRequest) {
  try {
    let body: any = {}
    try {
      body = await request.json()
    } catch (parseError: any) {
      console.error("[EXPORT POST] Failed to parse request body:", parseError)
      return NextResponse.json(
        { 
          success: false, 
          message: `Invalid request body: ${parseError?.message || 'Failed to parse JSON'}` 
        },
        { status: 400 }
      )
    }
    const searchParams = request.nextUrl.searchParams
    
    // Prioritize body data, fallback to query params for backward compatibility
    const format = body.format || searchParams.get("format") || "xlsx"
    const organizationId = body.organizationId || searchParams.get("organizationId")
    const search = body.search || searchParams.get("search") || ""
    const active = body.active || searchParams.get("active") || "all"
    const groupsParam = body.groups || searchParams.get("groups") || ""
    const gendersParam = body.genders || searchParams.get("genders") || ""
    const agamasParam = body.agamas || searchParams.get("agamas") || ""
    const fieldsParam = body.fields || searchParams.get("fields") || ""
    const selectedNiksParam = body.selectedNiks || searchParams.get("selectedNiks") || ""
    const includeHeader = body.includeHeader !== undefined 
      ? body.includeHeader 
      : (searchParams.get("includeHeader") === "true")
    
    console.log("[EXPORT POST] Request received:", {
      organizationId,
      format,
      selectedNiksCount: Array.isArray(selectedNiksParam) ? selectedNiksParam.length : (typeof selectedNiksParam === 'string' ? selectedNiksParam.split(',').length : 0),
      fieldsCount: Array.isArray(fieldsParam) ? fieldsParam.length : (typeof fieldsParam === 'string' ? fieldsParam.split(',').length : 0),
      includeHeader
    })
    
    const selectedFields = fieldsParam ? (Array.isArray(fieldsParam) ? fieldsParam : fieldsParam.split(",")) : []
    const selectedGroups = groupsParam ? (Array.isArray(groupsParam) ? groupsParam : groupsParam.split(",").filter(Boolean)) : []
    const selectedGenders = gendersParam ? (Array.isArray(gendersParam) ? gendersParam : gendersParam.split(",").filter(Boolean)) : []
    const selectedAgamas = agamasParam ? (Array.isArray(agamasParam) ? agamasParam : agamasParam.split(",").filter(Boolean)) : []
    const selectedNiks = selectedNiksParam 
      ? (Array.isArray(selectedNiksParam) ? selectedNiksParam : selectedNiksParam.split(",").filter(Boolean))
      : []
    
    console.log("[EXPORT POST] Parsed parameters:", {
      selectedNiksCount: selectedNiks.length,
      selectedFieldsCount: selectedFields.length,
      selectedGroupsCount: selectedGroups.length,
      organizationId: organizationId || 'MISSING'
    })

    if (!organizationId) {
      console.error("[EXPORT POST] Missing organizationId")
      return NextResponse.json(
        { success: false, message: "Organization ID is required" },
        { status: 400 }
      )
    }

    if (selectedFields.length === 0) {
      console.error("[EXPORT POST] No fields selected")
      return NextResponse.json(
        { success: false, message: "At least one field must be selected" },
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

    // Fetch all members using pagination to handle large datasets
    let allMembers: any[] = []
    
    // Jika ada selectedNiks, fetch langsung tanpa pagination (karena sudah filter spesifik)
    // Jika tidak ada selectedNiks, gunakan pagination untuk fetch semua data
    if (selectedNiks.length > 0) {
      // Fetch data berdasarkan selectedNiks - bagi menjadi batch jika terlalu banyak
      // Supabase .in() mungkin punya limit, jadi kita bagi menjadi batch 500
      const BATCH_SIZE = 500
      const niksBatches: string[][] = []
      
      for (let i = 0; i < selectedNiks.length; i += BATCH_SIZE) {
        niksBatches.push(selectedNiks.slice(i, i + BATCH_SIZE))
      }
      
      console.log(`[EXPORT POST] Fetching ${selectedNiks.length} members in ${niksBatches.length} batches for org ${organizationId}`)
      
      // Fetch semua batch
      for (let batchIdx = 0; batchIdx < niksBatches.length; batchIdx++) {
        const niksBatch = niksBatches[batchIdx]
        if (!niksBatch || niksBatch.length === 0) {
          console.warn(`[EXPORT POST] Skipping empty batch ${batchIdx + 1}`)
          continue
        }
        
        console.log(`[EXPORT POST] Fetching batch ${batchIdx + 1}/${niksBatches.length} with ${niksBatch.length} NIKs`)
        
        const { data: batchData, error: batchError } = await adminClient
          .from("organization_members")
          .select(`
            id,
            biodata_nik,
            employee_id,
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
              kecamatan,
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
          .in("biodata_nik", niksBatch)
          .order("id", { ascending: true })

        if (batchError) {
          console.error(`[EXPORT POST] Error fetching members batch ${batchIdx + 1}:`, {
            error: batchError,
            message: batchError.message,
            details: batchError.details,
            hint: batchError.hint,
            code: batchError.code
          })
          return NextResponse.json(
            { 
              success: false, 
              message: `Failed to fetch members: ${batchError.message || 'Unknown error'}`,
              error: batchError.message,
              code: batchError.code
            },
            { status: 500 }
          )
        }

        if (batchData && batchData.length > 0) {
          allMembers = allMembers.concat(batchData)
          console.log(`[EXPORT POST] Batch ${batchIdx + 1} fetched ${batchData.length} members (total so far: ${allMembers.length})`)
        } else {
          console.log(`[EXPORT POST] Batch ${batchIdx + 1} returned no data`)
        }
      }
      
      console.log(`[EXPORT POST] Total members fetched: ${allMembers.length} out of ${selectedNiks.length} requested`)
    } else {
      // Fetch dengan pagination jika tidak ada selectedNiks
      let currentPage = 0
      const fetchPageSize = 1000 // Supabase max per request
      let hasMore = true
      const MAX_PAGES = 20 // Safety limit to prevent infinite loops (20,000 records)

      while (hasMore && currentPage < MAX_PAGES) {
        const from = currentPage * fetchPageSize
        const to = from + fetchPageSize - 1
        
        let query = adminClient
          .from("organization_members")
          .select(`
            id,
            biodata_nik,
            employee_id,
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
              kecamatan,
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
          query = query.in("department_id", selectedGroups.map((id: string) => parseInt(id, 10)))
        }

        const { data: pageData, error } = await query

        if (error) {
          console.error("Error fetching members:", error)
          return NextResponse.json(
            { success: false, message: `Failed to fetch members: ${error.message}` },
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
      }
    }

    const members = allMembers
    
    console.log(`[EXPORT POST] Total members fetched: ${members.length}`)
    
    // Validasi: jika ada selectedNiks tapi tidak ada data yang ditemukan
    if (selectedNiks.length > 0 && members.length === 0) {
      console.warn(`[EXPORT POST] No members found for ${selectedNiks.length} selected NIKs`)
      return NextResponse.json(
        { 
          success: false, 
          message: `Tidak ada data member yang ditemukan untuk ${selectedNiks.length} NIK yang dipilih. Pastikan NIK yang dipilih sudah benar.` 
        },
        { status: 404 }
      )
    }

    // Field labels mapping
    const fieldLabels: Record<string, string> = {
      nik: "NIK",
      nama: "Nama Lengkap",
      nickname: "Nickname",
      nisn: "NISN",
      jenis_kelamin: "Jenis Kelamin",
      tempat_lahir: "Tempat Lahir",
      tanggal_lahir: "Tanggal Lahir",
      agama: "Agama",
      jalan: "Jalan",
      rt: "RT",
      rw: "RW",
      dusun: "Dusun",
      kelurahan: "Kelurahan",
      kecamatan: "Kecamatan",
      no_telepon: "No. Telepon",
      email: "Email",
      department_id: "Group",
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
    // Jika ada selectedNiks, skip filter ini karena sudah difilter di query
    let filteredMembers = (members || []).filter((member: any) => {
      const userProfile = getUserProfile(member)
      // Exclude members yang tidak punya user_id dan tidak punya user profile data
      return member.user_id || (userProfile && Object.keys(userProfile).length > 0)
    })

    if (selectedNiks.length === 0) {
      // Hanya apply filter ini jika tidak ada selectedNiks
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
    }

    // Transform data - from user_profiles
    type ExportRow = Record<string, string>
    const exportData = filteredMembers.map((member: any) => {
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
        row["NIK"] = member.biodata_nik || userProfile.nik || ""
      }
      if (selectedFields.includes("nama")) {
        row["Nama Lengkap"] = displayName || fullName || ""
      }
      if (selectedFields.includes("nickname")) {
        row["Nickname"] = "" // nickname tidak ada di user_profiles
      }
      if (selectedFields.includes("nisn")) {
        row["NISN"] = userProfile.nisn || ""
      }
      if (selectedFields.includes("jenis_kelamin")) {
        row["Jenis Kelamin"] = jenisKelamin || ""
      }
      if (selectedFields.includes("tempat_lahir")) {
        row["Tempat Lahir"] = userProfile.tempat_lahir || ""
      }
      if (selectedFields.includes("tanggal_lahir")) {
        row["Tanggal Lahir"] = userProfile.date_of_birth || ""
      }
      if (selectedFields.includes("agama")) {
        row["Agama"] = userProfile.agama || ""
      }
      if (selectedFields.includes("jalan")) {
        row["Jalan"] = userProfile.jalan || ""
      }
      if (selectedFields.includes("rt")) {
        row["RT"] = userProfile.rt || ""
      }
      if (selectedFields.includes("rw")) {
        row["RW"] = userProfile.rw || ""
      }
      if (selectedFields.includes("dusun")) {
        row["Dusun"] = userProfile.dusun || ""
      }
      if (selectedFields.includes("kelurahan")) {
        row["Kelurahan"] = userProfile.kelurahan || ""
      }
      if (selectedFields.includes("kecamatan")) {
        row["Kecamatan"] = userProfile.kecamatan || ""
      }
      if (selectedFields.includes("no_telepon")) {
        row["No. Telepon"] = userProfile.phone || userProfile.mobile || ""
      }
      if (selectedFields.includes("email")) {
        row["Email"] = getEmail(userProfile.email) || ""
      }
      if (selectedFields.includes("department_id")) {
        const depName = Array.isArray(dep) ? (dep[0]?.name ?? "") : (dep?.name ?? "")
        row["Group"] = String(depName)
      }

      return row
    })

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(exportData, {
      header: includeHeader ? selectedFields.map((f: string) => fieldLabels[f] ?? f) : undefined,
    })

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members")

    // Generate file buffer
    let buffer: Buffer
    let mimeType: string
    let fileExtension: string

    if (format === "csv") {
      // For CSV, convert to CSV string
      const csv = XLSX.utils.sheet_to_csv(worksheet)
      buffer = Buffer.from(csv, "utf-8")
      mimeType = "text/csv"
      fileExtension = "csv"
    } else {
      // For XLSX
      buffer = Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }))
      mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      fileExtension = "xlsx"
    }

    // Konversi ke Uint8Array agar kompatibel dengan NextResponse typings
    const uint8Buffer = new Uint8Array(buffer)

    // Return file as response
    const fileName = `members-export-${new Date().toISOString().split("T")[0]}.${fileExtension}`

    return new NextResponse(uint8Buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": uint8Buffer.byteLength.toString(),
      },
    })
  } catch (error: any) {
    console.error("[EXPORT POST] Error in export:", {
      error,
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
    return NextResponse.json(
      { 
        success: false, 
        message: error?.message || "Internal server error",
        error: error?.message,
        code: error?.code
      },
      { status: 500 }
    )
  }
}

