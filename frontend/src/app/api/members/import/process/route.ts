import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"

interface ColumnMapping {
  [databaseField: string]: string | null
}

// Helper function to parse date in various formats
function parseDateString(dateStr: string): string | null {
  if (!dateStr) return null
  
  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }
  
  // Try DD/MM/YYYY format
  const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (ddmmyyyyMatch && ddmmyyyyMatch[1] && ddmmyyyyMatch[2] && ddmmyyyyMatch[3]) {
    const day = ddmmyyyyMatch[1].padStart(2, '0')
    const month = ddmmyyyyMatch[2].padStart(2, '0')
    const year = ddmmyyyyMatch[3]
    return `${year}-${month}-${day}`
  }
  
  // Try parsing as Date object
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0] || null
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const mappingJson = formData.get("mapping") as string
    const mode = (formData.get("mode") as string) || "import" // 'test' atau 'import'
    const organizationIdParam = formData.get("organization_id") as string | null
    const groupIdParam = formData.get("groupId") as string | null // Group yang dipilih dari dropdown
    const headerRowInput = formData.get("headerRow")
    const headerRowCountInput = formData.get("headerRowCount")
    const requestedSheet = (formData.get("sheetName") || "") as string
    const trackHistory = formData.get("trackHistory") === "true"
    const allowMatchingWithSubfields = formData.get("allowMatchingWithSubfields") === "true"

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 })
    }

    if (!mappingJson) {
      return NextResponse.json({ success: false, message: "No mapping provided" }, { status: 400 })
    }

    let mapping: ColumnMapping
    try {
      mapping = JSON.parse(mappingJson)
    } catch {
      return NextResponse.json({ success: false, message: "Invalid mapping JSON" }, { status: 400 })
      }

    //komentar
    // Minimal required field untuk user_profiles: nik & nama
    if (!mapping.nik) {
      return NextResponse.json(
        { success: false, message: "NIK mapping is required" },
        { status: 400 }
      )
    }

    if (!mapping.nama) {
      return NextResponse.json(
        { success: false, message: "Nama Lengkap mapping is required" },
        { status: 400 }
      )
    }

    const headerRow = Math.max(1, Number(headerRowInput) || 1)
    const headerRowCount = Math.max(1, Number(headerRowCountInput) || 1)
    
    // Log groupIdParam untuk debugging
    console.log(`[MEMBERS IMPORT] groupIdParam from formData:`, groupIdParam)

    // Read workbook
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheetNames = workbook.SheetNames || []
    const sheetName = requestedSheet && sheetNames.includes(requestedSheet) ? requestedSheet : sheetNames[0]
    if (!sheetName) {
      return NextResponse.json({ success: false, message: "No sheet found in Excel file" }, { status: 400 })
    }
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      return NextResponse.json({ success: false, message: "Worksheet not found in Excel file" }, { status: 400 })
    }

    // Use array-of-arrays to respect custom header rows
    const rowsArray = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    })
    if (!rowsArray.length) {
      return NextResponse.json(
        { success: false, message: "Excel file is empty or has no data" },
        { status: 400 }
      )
    }

    if (headerRow > rowsArray.length) {
      return NextResponse.json(
        { success: false, message: `Header row ${headerRow} is outside the data range (total rows: ${rowsArray.length})` },
        { status: 400 }
      )
    }

    const headerRows = rowsArray.slice(headerRow - 1, headerRow - 1 + headerRowCount)
    const maxCols = headerRows.reduce((max, row) => Math.max(max, row.length), 0)

    const headers: string[] = []
    let carryParent = ""
    for (let col = 0; col < maxCols; col++) {
      const topCellRaw = String((headerRows[0]?.[col] ?? "")).trim()
      if (topCellRaw) {
        carryParent = topCellRaw
      }
      const parent = carryParent
      const childRaw = String((headerRows[headerRows.length - 1]?.[col] ?? "")).trim()
      const child = childRaw

      let header = ""
      if (child && parent && child.toLowerCase() === parent.toLowerCase()) {
        header = child
      } else if (child && parent) {
        header = `${parent} - ${child}`
      } else if (child) {
        header = child
      } else if (parent) {
        header = parent
      }

      headers.push(header || `__EMPTY_${col}`)
    }

    const dataRowsRaw = rowsArray.slice(headerRow - 1 + headerRowCount)
    if (!dataRowsRaw.length) {
      return NextResponse.json(
        { success: false, message: "Excel file has no data rows after header" },
        { status: 400 }
      )
    }

    // Convert data rows into array of objects keyed by headers
    const rows = dataRowsRaw.map((rowArr) => {
      const obj: Record<string, any> = {}
      headers.forEach((header, idx) => {
        obj[header] = String((rowArr as any)?.[idx] ?? "").trim()
      })
      return obj
    })

    // Auth & org
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ success: false, message: "User not authenticated" }, { status: 401 })
    }

    let orgId: number | null = null

    if (organizationIdParam) {
      orgId = parseInt(organizationIdParam, 10)
      if (isNaN(orgId)) {
      return NextResponse.json(
          { success: false, message: "Invalid organization_id" },
          { status: 400 }
      )
    }

    const { data: member } = await adminClient
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("organization_id", orgId)
      .maybeSingle()

    if (!member) {
      return NextResponse.json(
          { success: false, message: "User is not a member of the specified organization" },
        { status: 403 }
      )
    }
    } else {
      const { data: member } = await adminClient
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!member || !member.organization_id) {
        return NextResponse.json(
          { success: false, message: "User not member of any organization" },
        { status: 403 }
      )
    }

      orgId =
        typeof member.organization_id === "string"
      ? parseInt(member.organization_id, 10) 
      : member.organization_id
    }

    // Fetch departments untuk lookup
    const deptFields = allowMatchingWithSubfields 
      ? "id, name, code, is_active, organization_id, description"
      : "id, name, code, is_active, organization_id"
    
    const { data: departments } = await adminClient
      .from("departments")
      .select(deptFields)
      .eq("organization_id", orgId)
      .eq("is_active", true)

    // Helper normalize string
    const normalizeForMatching = (str: string): string => {
      if (!str) return ""
      return str
        .trim()
        .toLowerCase()
        .replace(/[\s\-_\.]/g, "")
        .replace(/[^\w]/g, "")
    }

    // Helper convert jenis_kelamin from format (L/P) to user_profiles format (male/female)
    const convertJenisKelamin = (jenisKelamin: string | null | undefined): string | null => {
      if (!jenisKelamin) return null
      const normalized = jenisKelamin.trim().toUpperCase()
      if (normalized === "L") return "male"
      if (normalized === "P") return "female"
      // Jika format tidak sesuai, return null (akan di-handle oleh constraint)
      return null
    }

    const findDepartmentId = (
      value: string,
      departments: any[]
    ): { id?: number; notFound: boolean } => {
      if (!value || !departments || departments.length === 0) {
        return { id: undefined, notFound: false }
      }

      const searchValue = value.trim()
      const normalizedSearch = normalizeForMatching(searchValue)
      
      if (!normalizedSearch) {
        return { id: undefined, notFound: false }
      }
      
      let match = departments.find((item: any) => {
        const nameMatch = String(item?.name ?? "").trim().toLowerCase() === searchValue.toLowerCase()
        const codeMatch = String(item?.code ?? "").trim().toLowerCase() === searchValue.toLowerCase()
      return nameMatch || codeMatch
    })
    
      if (!match) {
        match = departments.find((item: any) => {
          const nameNormalized = normalizeForMatching(String(item?.name ?? ""))
          const codeNormalized = normalizeForMatching(String(item?.code ?? ""))
          return (
            (nameNormalized === normalizedSearch && nameNormalized.length > 0) ||
            (codeNormalized === normalizedSearch && codeNormalized.length > 0)
          )
        })
      }

      if (!match && allowMatchingWithSubfields) {
        match = departments.find((item: any) => {
          const descValue = String(item?.description ?? "").trim()
          if (!descValue) return false
          return (
            descValue.toLowerCase().includes(searchValue.toLowerCase()) ||
            normalizeForMatching(descValue).includes(normalizedSearch)
          )
        })
      }

      if (!match && normalizedSearch.length >= 3) {
        match = departments.find((item: any) => {
          const nameNormalized = normalizeForMatching(String(item?.name ?? ""))
          const codeNormalized = normalizeForMatching(String(item?.code ?? ""))
          return (
            nameNormalized.includes(normalizedSearch) ||
            normalizedSearch.includes(nameNormalized) ||
            codeNormalized.includes(normalizedSearch) ||
            normalizedSearch.includes(codeNormalized)
          )
        })
      }
      
      if (!match) {
        return { id: undefined, notFound: true }
      }
      
      return { id: Number(match.id), notFound: false }
    }

    const getMappedValue = (row: Record<string, any>, dbField: string): string => {
      const excelColumn = mapping[dbField]
      if (!excelColumn) return ""
      
      const rawValue = row[excelColumn]
      if (rawValue === null || rawValue === undefined) return ""

      return String(rawValue).trim()
    }

    let success = 0
    let failed = 0
    const errors: Array<{ row: number; message: string }> = []
    // Untuk mode test: kumpulkan data row yang akan muncul di halaman finger
    const fingerPagePreview: Array<{
      row: number
      nik: string
      nama: string
      email: string
      department?: string
    }> = []
    let withoutEmailCount = 0 // Hitung yang tidak punya email

    // OPTIMASI: Cache listUsers() di awal sekali saja dengan pagination untuk mendapatkan semua users
    console.log("[MEMBERS IMPORT] Fetching existing users...")
    const usersByEmail = new Map<string, { id: string; email: string }>()
    
    // Fetch semua users dengan pagination
    let page = 1
    const perPage = 2000 // Optimized: increased from 1000 to reduce pagination calls
    let hasMore = true
    
    while (hasMore) {
      const { data: existingUsersData, error: listUsersError } = await adminClient.auth.admin.listUsers({
        page,
        perPage,
      })
      
      if (listUsersError) {
        console.error(`[MEMBERS IMPORT] Failed to fetch users (page ${page}):`, listUsersError)
        // Jika ini page pertama dan error, return error
        if (page === 1) {
          return NextResponse.json(
            { success: false, message: `Gagal memeriksa user yang sudah ada: ${listUsersError.message}` },
            { status: 500 }
          )
        }
        // Jika error di page selanjutnya, stop pagination
        break
      }
      
      // Tambahkan users ke cache
      existingUsersData?.users?.forEach((user) => {
        if (user.email) {
          usersByEmail.set(user.email.toLowerCase(), { id: user.id, email: user.email })
        }
      })
      
      // Jika jumlah users kurang dari perPage, berarti sudah sampai akhir
      if (!existingUsersData?.users || existingUsersData.users.length < perPage) {
        hasMore = false
      } else {
        page++
      }
    }
    
    console.log(`[MEMBERS IMPORT] Cached ${usersByEmail.size} existing users (from ${page} page(s))`)

    // OPTIMASI: Cache existing organization_members untuk batch lookup
    console.log("[MEMBERS IMPORT] Fetching existing organization members...")
    const { data: existingMembersData } = await adminClient
      .from("organization_members")
      .select("id, user_id, organization_id, biodata_nik")
      .eq("organization_id", orgId)
    
    // Map untuk lookup berdasarkan user_id
    const membersByUserId = new Map<string, { id: number; biodata_nik: string | null; organization_id: number }>()
    // Map untuk lookup berdasarkan NIK (untuk member tanpa email)
    const membersByBiodataNik = new Map<string, { id: number; user_id: string | null; organization_id: number }>()
    
    existingMembersData?.forEach((member) => {
      if (member.user_id) {
        membersByUserId.set(member.user_id, { 
          id: member.id, 
          biodata_nik: member.biodata_nik,
          organization_id: member.organization_id 
        })
      }
      if (member.biodata_nik) {
        membersByBiodataNik.set(member.biodata_nik, { 
          id: member.id, 
          user_id: member.user_id,
          organization_id: member.organization_id 
        })
      }
    })
    console.log(`[MEMBERS IMPORT] Cached ${membersByUserId.size} existing organization members by user_id, ${membersByBiodataNik.size} by biodata_nik`)

    // OPTIMASI BATCH: Untuk mode import, kumpulkan semua data valid terlebih dahulu
    if (mode === "import") {
      console.log("[MEMBERS IMPORT] Starting batch processing mode...")
      
      // Kumpulkan semua data yang valid
      interface ValidRowData {
        rowNumber: number
        row: Record<string, any>
        nik: string
        nama: string
        nisn: string
        jenisKelamin: string
        tempatLahir: string
        tanggalLahir: string | null
        agama: string
        jalan: string
        rt: string
        rw: string
        dusun: string
        kelurahan: string
        kecamatan: string
        noTelepon: string
        email: string
        departmentId: number | null
        departmentName?: string
      }

      const validRows: ValidRowData[] = []
      
      // Validasi dan kumpulkan semua rows yang valid
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const rowNumber = headerRow + headerRowCount + i

        if (!row) {
          failed++
          errors.push({ row: rowNumber, message: "Empty row" })
          continue
        }

        const nik = getMappedValue(row, "nik")
        const nama = getMappedValue(row, "nama")
        const nisn = getMappedValue(row, "nisn")
        const jenisKelamin = getMappedValue(row, "jenis_kelamin").toUpperCase()
        const tempatLahir = getMappedValue(row, "tempat_lahir")
        const tanggalLahirRaw = getMappedValue(row, "tanggal_lahir")
        const agama = getMappedValue(row, "agama")
        const jalan = getMappedValue(row, "jalan")
        const rt = getMappedValue(row, "rt")
        const rw = getMappedValue(row, "rw")
        const dusun = getMappedValue(row, "dusun")
        const kelurahan = getMappedValue(row, "kelurahan")
        const kecamatan = getMappedValue(row, "kecamatan")
        const noTelepon = getMappedValue(row, "no_telepon")
        const email = getMappedValue(row, "email")
        const departmentValue = getMappedValue(row, "department_id")

        // Validasi dasar
        if (!nik || !nama) {
          failed++
          errors.push({ row: rowNumber, message: !nik ? "NIK is required" : "Nama Lengkap is required" })
          continue
        }

        // Email tidak wajib, tapi jika ada harus valid format
        if (email && email.trim() !== "") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(email)) {
            failed++
            errors.push({ row: rowNumber, message: `Email format invalid: "${email}"` })
            continue
          }
        }

        if (nik.length < 10) {
          failed++
          errors.push({ row: rowNumber, message: `NIK terlalu pendek (minimal 10 karakter): "${nik}"` })
          continue
        }

        if (mapping.jenis_kelamin && jenisKelamin !== "L" && jenisKelamin !== "P") {
          failed++
          errors.push({ row: rowNumber, message: "Jenis Kelamin must be 'L' or 'P'" })
          continue
        }

        let tanggalLahir: string | null = null
        if (tanggalLahirRaw) {
          tanggalLahir = parseDateString(tanggalLahirRaw)
          if (!tanggalLahir) {
              failed++
              errors.push({ row: rowNumber, message: `Tanggal Lahir invalid: "${tanggalLahirRaw}"` })
              continue
          }
        }

        let departmentId: number | null = null
        let departmentName: string | undefined = undefined
        
        // Prioritas: groupIdParam dari dropdown > departmentValue dari Excel
        if (groupIdParam && groupIdParam.trim() !== "") {
          // Gunakan group yang dipilih dari dropdown
          const groupIdNum = parseInt(groupIdParam, 10)
          if (!isNaN(groupIdNum)) {
            departmentId = groupIdNum
            console.log(`[MEMBERS IMPORT] Using groupIdParam for row ${rowNumber}:`, groupIdNum)
            const dept = departments?.find((d: any) => Number(d.id) === groupIdNum) as any
            if (dept && typeof dept === 'object' && 'name' in dept) {
              departmentName = (dept as { name?: string }).name || undefined
            }
          }
        } else if (departmentValue && departments && departments.length > 0) {
          console.log(`[MEMBERS IMPORT] Using departmentValue from Excel for row ${rowNumber}:`, departmentValue)
          // Fallback: gunakan department dari Excel jika groupIdParam tidak ada
          const deptResult = findDepartmentId(departmentValue, departments)
          if (deptResult.id) {
            departmentId = deptResult.id
            const dept = departments.find((d: any) => Number(d.id) === Number(departmentId)) as any
            if (dept && typeof dept === 'object' && 'name' in dept) {
              departmentName = (dept as { name?: string }).name || undefined
            }
          }
        }

        validRows.push({
          rowNumber,
          row,
          nik,
          nama,
          nisn,
          jenisKelamin,
          tempatLahir,
          tanggalLahir,
          agama,
          jalan,
          rt,
          rw,
          dusun,
          kelurahan,
          kecamatan,
          noTelepon,
          email,
          departmentId,
          departmentName,
        })
      }

      console.log(`[MEMBERS IMPORT] Validated ${validRows.length} rows, ${failed} failed validation`)

      // Track row yang gagal setelah validasi untuk menghitung success dengan benar
      const failedAfterValidation = new Set<number>()

      // Batch process: Buat user untuk yang belum ada (termasuk yang tidak punya email akan dibuat email dummy)
      const CONCURRENCY_LIMIT = 50 // Process 50 users at a time (optimized for faster import)
      const usersToCreate = validRows.filter(vr => {
        // Generate email (asli atau dummy)
        const emailToUse = (vr.email && vr.email.trim() !== "") ? vr.email : `${vr.nik}@dummy.local`
        // Buat user jika belum ada di cache
        return !usersByEmail.has(emailToUse.toLowerCase())
      })
      
      console.log(`[MEMBERS IMPORT] Creating ${usersToCreate.length} new users (${validRows.length - usersToCreate.length} rows already have users, rows without email will use dummy email: nik@dummy.local)...`)
      
      for (let i = 0; i < usersToCreate.length; i += CONCURRENCY_LIMIT) {
        const batch = usersToCreate.slice(i, i + CONCURRENCY_LIMIT)
        await Promise.all(
          batch.map(async (vr) => {
            try {
              const nameParts = vr.nama.trim().split(" ")
              const firstName = nameParts[0] || vr.nama
              // Ensure last_name is never null (use empty string if no last name)
              const lastName = nameParts.slice(1).join(" ") || ""
              const randomPassword = `password`
              
              // Generate email dummy jika tidak ada email
              const emailToUse = (vr.email && vr.email.trim() !== "") ? vr.email : `${vr.nik}@dummy.local`

              const { data: newUser, error: createUserError } = await adminClient.auth.admin.createUser({
                email: emailToUse,
                password: randomPassword,
                email_confirm: true,
                user_metadata: {
                  first_name: firstName,
                  last_name: lastName,
                },
              })

              if (createUserError) {
                // Jika error karena email sudah terdaftar, cari user yang sudah ada
                if (createUserError.message?.toLowerCase().includes("already been registered") || 
                    createUserError.message?.toLowerCase().includes("email already exists")) {
                  console.log(`[MEMBERS IMPORT] Email ${emailToUse} sudah terdaftar, mencari user yang sudah ada...`)
                  
                  // Cari user berdasarkan email dari cache atau list users
                  // Pertama cek cache lagi (mungkin ada race condition)
                  const cachedUser = usersByEmail.get(emailToUse.toLowerCase())
                  if (cachedUser) {
                    console.log(`[MEMBERS IMPORT] Found cached user for email ${emailToUse}, using userId: ${cachedUser.id}`)
                    return { email: emailToUse.toLowerCase(), userId: cachedUser.id, rowData: vr }
                  }
                  
                  // Jika tidak ada di cache, cari dari list users
                  const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers()
                  if (!listError && existingUsers?.users) {
                    const existingUser = existingUsers.users.find(
                      (u: any) => u.email?.toLowerCase() === emailToUse.toLowerCase()
                    )
                    
                    if (existingUser) {
                      // Update cache
                      usersByEmail.set(emailToUse.toLowerCase(), { id: existingUser.id, email: emailToUse })
                      console.log(`[MEMBERS IMPORT] Found existing user for email ${emailToUse}, using userId: ${existingUser.id}`)
                      return { email: emailToUse.toLowerCase(), userId: existingUser.id, rowData: vr }
                    }
                  }
                  
                  // Jika tidak ditemukan, anggap sebagai error
                  console.warn(`[MEMBERS IMPORT] Email ${emailToUse} dikatakan sudah terdaftar tapi tidak ditemukan`)
                  failed++
                  failedAfterValidation.add(vr.rowNumber)
                  errors.push({
                    row: vr.rowNumber,
                    message: `Baris ${vr.rowNumber}: Email sudah terdaftar tapi tidak dapat menemukan user yang sudah ada`,
                  })
                  return null
                } else {
                  // Error lain selain email sudah terdaftar
                  failed++
                  failedAfterValidation.add(vr.rowNumber)
                  errors.push({
                    row: vr.rowNumber,
                    message: `Baris ${vr.rowNumber}: Gagal membuat user - ${createUserError.message}`,
                  })
                  return null
                }
              }

              if (!newUser?.user) {
                failed++
                failedAfterValidation.add(vr.rowNumber)
                errors.push({
                  row: vr.rowNumber,
                  message: `Baris ${vr.rowNumber}: Gagal membuat user - Tidak ada user yang dikembalikan`,
                })
                return null
              }

              usersByEmail.set(emailToUse.toLowerCase(), { id: newUser.user.id, email: emailToUse })
              return { email: emailToUse.toLowerCase(), userId: newUser.user.id, rowData: vr }
            } catch (error: any) {
              failed++
              failedAfterValidation.add(vr.rowNumber)
              errors.push({
                row: vr.rowNumber,
                message: `Baris ${vr.rowNumber}: Gagal membuat user - ${error.message}`,
              })
              return null
            }
          })
        )
      }

      // Batch upsert user_profiles (semua rows, termasuk yang tidak punya email akan menggunakan email dummy)
      // Split into batches to avoid timeout
      const rowsWithEmail = validRows.filter(vr => {
        // Include semua rows yang sudah punya user (baik dengan email asli atau email dummy)
        const emailToUse = (vr.email && vr.email.trim() !== "") ? vr.email : `${vr.nik}@dummy.local`
        return usersByEmail.has(emailToUse.toLowerCase())
      })
      console.log(`[MEMBERS IMPORT] Batch upserting ${rowsWithEmail.length} user profiles (rows without email will use dummy email: nik@dummy.local)...`)
      const PROFILE_BATCH_SIZE = 500 // Process 500 profiles at a time (optimized for faster import)
      
      for (let i = 0; i < rowsWithEmail.length; i += PROFILE_BATCH_SIZE) {
        const batch = rowsWithEmail.slice(i, i + PROFILE_BATCH_SIZE)
        const profilePayloads = batch
          .filter(vr => !failedAfterValidation.has(vr.rowNumber))
          .map((vr) => {
            // Generate email (asli atau dummy) untuk lookup user
            const emailToUse = (vr.email && vr.email.trim() !== "") ? vr.email : `${vr.nik}@dummy.local`
            const userId = usersByEmail.get(emailToUse.toLowerCase())?.id
            if (!userId) {
              // Jika tidak ada userId, berarti row ini gagal
              if (!failedAfterValidation.has(vr.rowNumber)) {
                failed++
                failedAfterValidation.add(vr.rowNumber)
                errors.push({
                  row: vr.rowNumber,
                  message: `Baris ${vr.rowNumber}: Gagal memproses - user tidak ditemukan`,
                })
              }
              return null
            }

            const nameParts = vr.nama.trim().split(" ")
            // Ensure last_name is never null (use empty string if no last name)
            const lastName = nameParts.slice(1).join(" ") || ""
            return {
              id: userId,
              email: emailToUse,
              first_name: nameParts[0] || vr.nama,
              last_name: lastName,
              phone: vr.noTelepon || null,
              display_name: vr.nama,
              is_active: true,
              // Fields from import data
              nik: vr.nik || null,
              nisn: vr.nisn || null,
              jenis_kelamin: convertJenisKelamin(vr.jenisKelamin),
              tempat_lahir: vr.tempatLahir || null,
              date_of_birth: vr.tanggalLahir || null,
              agama: vr.agama || null,
              jalan: vr.jalan || null,
              rt: vr.rt || null,
              rw: vr.rw || null,
              dusun: vr.dusun || null,
              kelurahan: vr.kelurahan || null,
              kecamatan: vr.kecamatan || null,
            }
          }).filter(Boolean) as any[]

        if (profilePayloads.length > 0) {
          const { error: profileError } = await adminClient
            .from("user_profiles")
            .upsert(profilePayloads, { onConflict: "id" })

          if (profileError) {
            console.error(`[MEMBERS IMPORT] Batch profile upsert error (batch ${Math.floor(i / PROFILE_BATCH_SIZE) + 1}):`, profileError)
            // Fallback: upsert satu per satu untuk batch yang error
            for (const vr of batch) {
              if (failedAfterValidation.has(vr.rowNumber)) continue
              const emailToUse = (vr.email && vr.email.trim() !== "") ? vr.email : `${vr.nik}@dummy.local`
              const userId = usersByEmail.get(emailToUse.toLowerCase())?.id
              if (!userId) continue
              const nameParts = vr.nama.trim().split(" ")
              // Ensure last_name is never null (use empty string if no last name)
              const lastName = nameParts.slice(1).join(" ") || ""
              const { error: singleProfileError } = await adminClient
                .from("user_profiles")
                .upsert({
                  id: userId,
                  email: emailToUse,
                  first_name: nameParts[0] || vr.nama,
                  last_name: lastName,
                  phone: vr.noTelepon || null,
                  display_name: vr.nama,
                  is_active: true,
                  // Fields from import data
                  nik: vr.nik || null,
                  nisn: vr.nisn || null,
                  jenis_kelamin: convertJenisKelamin(vr.jenisKelamin),
                  tempat_lahir: vr.tempatLahir || null,
                  date_of_birth: vr.tanggalLahir || null,
                  agama: vr.agama || null,
                  jalan: vr.jalan || null,
                  rt: vr.rt || null,
                  rw: vr.rw || null,
                  dusun: vr.dusun || null,
                  kelurahan: vr.kelurahan || null,
                  kecamatan: vr.kecamatan || null,
                }, { onConflict: "id" })
              
              if (singleProfileError && !failedAfterValidation.has(vr.rowNumber)) {
                failed++
                failedAfterValidation.add(vr.rowNumber)
                errors.push({
                  row: vr.rowNumber,
                  message: `Baris ${vr.rowNumber}: Gagal memperbarui profil user - ${singleProfileError.message}`,
                })
              }
            }
          } else {
            console.log(`[MEMBERS IMPORT] Successfully upserted profile batch ${Math.floor(i / PROFILE_BATCH_SIZE) + 1} (${profilePayloads.length} profiles)`)
          }
        }
      }

      // Batch insert/update organization_members
      // Member dengan email: user_id diisi, member tanpa email: user_id NULL (tetap dibuat sebagai organization_members)
      console.log(`[MEMBERS IMPORT] Batch processing organization members...`)
      const today = new Date().toISOString().split("T")[0]
      const membersToInsert: Array<{ rowNumber: number; payload: any }> = []
      const membersToUpdate: Array<{ id: number; data: any; rowNumber: number }> = []

      for (const vr of validRows) {
        if (failedAfterValidation.has(vr.rowNumber)) continue

        if (!orgId) {
          if (!failedAfterValidation.has(vr.rowNumber)) {
            failed++
            failedAfterValidation.add(vr.rowNumber)
            errors.push({
              row: vr.rowNumber,
              message: `Baris ${vr.rowNumber}: Gagal memproses - organization tidak ditemukan`,
            })
          }
          continue
        }

        // Untuk member dengan email, gunakan userId
        // Untuk member tanpa email, gunakan email dummy (nik@dummy.local) yang sudah dibuat di batch user creation
        const hasEmail = vr.email && vr.email.trim() !== ""
        const emailToUse = hasEmail ? vr.email : `${vr.nik}@dummy.local`
        let userId: string | null = null
        
        // Cari userId dari cache (baik untuk email asli atau email dummy)
        userId = usersByEmail.get(emailToUse.toLowerCase())?.id || null
        
        if (!userId) {
          if (!failedAfterValidation.has(vr.rowNumber)) {
            failed++
            failedAfterValidation.add(vr.rowNumber)
            errors.push({
              row: vr.rowNumber,
              message: `Baris ${vr.rowNumber}: Gagal memproses - user tidak ditemukan`,
            })
          }
          continue
        }
        
        if (!hasEmail) {
          // Member tanpa email: hitung untuk reporting
          withoutEmailCount++
        }

        // Cek apakah member sudah ada berdasarkan NIK (prioritas utama)
        // Karena user minta: jika data sudah ada (berdasarkan NIK), update saja, jangan buat baru
        let existingMember = null
        
        // Prioritas 1: Cek berdasarkan NIK - ini yang utama
        if (vr.nik) {
          existingMember = membersByBiodataNik.get(vr.nik)
          // Pastikan organization_id sama
          if (existingMember && existingMember.organization_id !== orgId) {
            existingMember = null
          }
        }
        
        // Prioritas 2: Jika tidak ada berdasarkan NIK, cek berdasarkan userId (untuk member dengan email)
        if (!existingMember && userId) {
          existingMember = membersByUserId.get(userId)
          // Pastikan organization_id sama
          if (existingMember && existingMember.organization_id !== orgId) {
            existingMember = null
          }
        }

        // SELALU update jika member sudah ada (berdasarkan NIK atau userId)
        if (existingMember) {
          const updateData: any = { is_active: true }
          // Jika groupIdParam dipilih, selalu update department_id (bahkan jika null untuk menghapus)
          if (groupIdParam && groupIdParam.trim() !== "") {
            updateData.department_id = vr.departmentId
            console.log(`[MEMBERS IMPORT] Updating existing member ${existingMember.id} (NIK: ${vr.nik}) with department_id:`, vr.departmentId)
          } else if (vr.departmentId) {
            // Jika tidak ada groupIdParam, hanya update jika ada departmentId dari Excel
            updateData.department_id = vr.departmentId
          }
          if (vr.nik) updateData.biodata_nik = vr.nik
          
          // OPSI 3: Update user_id jika existing member punya user_id NULL
          // Cari user account untuk member yang sebelumnya tidak punya user_id
          let finalUserId = userId
          if ('user_id' in existingMember && !existingMember.user_id && vr.nik) {
            // Cari user berdasarkan email dummy di cache
            const dummyEmail = `${vr.nik}@dummy.local`
            const existingUserByDummyEmail = usersByEmail.get(dummyEmail.toLowerCase())
            
            if (existingUserByDummyEmail) {
              finalUserId = existingUserByDummyEmail.id
              console.log(`[MEMBERS IMPORT] Found existing user for dummy email ${dummyEmail}, will update user_id for member ${existingMember.id}`)
            }
            // Note: Jika user belum ada di cache, user akan dibuat nanti di batch user creation
            // dan akan ter-update di import berikutnya atau di single row processing
          }
          
          if (finalUserId) {
            updateData.user_id = finalUserId
          } else if (userId) {
            updateData.user_id = userId // Fallback ke userId dari import baru
          }
          
          membersToUpdate.push({ id: existingMember.id, data: updateData, rowNumber: vr.rowNumber })
          console.log(`[MEMBERS IMPORT] Will UPDATE existing member ID ${existingMember.id} for NIK ${vr.nik} (row ${vr.rowNumber})`)
        } else {
          // Member tidak ditemukan di cache
          // PENTING: Karena user minta hanya update (jangan buat baru), 
          // kita HARUS pastikan tidak ada di database sebelum insert
          // Tapi query per row terlalu lambat, jadi kita akan batch query semua NIK yang tidak ada di cache
          console.log(`[MEMBERS IMPORT] Member dengan NIK ${vr.nik} tidak ditemukan di cache, akan dicek lagi nanti (row ${vr.rowNumber})`)
          
          // Simpan dulu untuk batch check nanti
          const insertPayload = {
            user_id: userId, // NULL untuk member tanpa email
            organization_id: orgId,
            department_id: vr.departmentId,
            biodata_nik: vr.nik, // Wajib untuk memenuhi constraint (user_id OR biodata_nik harus ada)
            hire_date: today,
            is_active: true,
          }
          membersToInsert.push({
            rowNumber: vr.rowNumber, // Store untuk tracking
            payload: insertPayload
          })
        }
      }

      // PENTING: Batch check semua NIK yang akan di-insert untuk memastikan tidak ada yang sudah ada
      // Ini untuk memastikan hanya update, bukan insert baru (sesuai permintaan user)
      if (membersToInsert.length > 0) {
        console.log(`[MEMBERS IMPORT] Batch checking ${membersToInsert.length} members yang tidak ada di cache...`)
        
        // Kumpulkan semua NIK yang akan di-insert
        const niksToCheck = membersToInsert
          .map(item => item.payload.biodata_nik)
          .filter((nik): nik is string => !!nik && nik.trim() !== "")
        
        // Batch query untuk mengecek apakah NIK-NIK ini sudah ada di database
        if (niksToCheck.length > 0) {
          const { data: existingByNik } = await adminClient
            .from("organization_members")
            .select("id, user_id, organization_id, biodata_nik")
            .eq("organization_id", orgId)
            .in("biodata_nik", niksToCheck)
          
          // Update cache dengan hasil query
          if (existingByNik && existingByNik.length > 0) {
            existingByNik.forEach((member: any) => {
              if (member.user_id) {
                membersByUserId.set(member.user_id, { 
                  id: member.id, 
                  biodata_nik: member.biodata_nik, 
                  organization_id: member.organization_id 
                })
              }
              if (member.biodata_nik) {
                membersByBiodataNik.set(member.biodata_nik, { 
                  id: member.id, 
                  user_id: member.user_id, 
                  organization_id: member.organization_id 
                })
              }
            })
            console.log(`[MEMBERS IMPORT] Found ${existingByNik.length} existing members via batch query, moving to update list`)
          }
          
          // Pindahkan yang sudah ada dari insert ke update
          const membersToInsertFiltered: Array<{ rowNumber: number; payload: any }> = []
          const membersToUpdateFromCheck: Array<{ id: number; data: any; rowNumber: number }> = []
          
          for (const item of membersToInsert) {
            if (!item.payload.biodata_nik) {
              // Tidak ada NIK, tetap di insert (tidak mungkin terjadi karena NIK wajib)
              membersToInsertFiltered.push(item)
              continue
            }
            
            const existingMember = membersByBiodataNik.get(item.payload.biodata_nik)
            
            if (existingMember && existingMember.organization_id === orgId) {
              // Member ditemukan, pindahkan ke update
              const updateData: any = { is_active: true }
              if (groupIdParam && groupIdParam.trim() !== "") {
                updateData.department_id = item.payload.department_id
              } else if (item.payload.department_id) {
                updateData.department_id = item.payload.department_id
              }
              if (item.payload.biodata_nik) updateData.biodata_nik = item.payload.biodata_nik
              if (item.payload.user_id) updateData.user_id = item.payload.user_id
              
              membersToUpdateFromCheck.push({ 
                id: existingMember.id, 
                data: updateData, 
                rowNumber: item.rowNumber 
              })
              console.log(`[MEMBERS IMPORT] Moving member NIK ${item.payload.biodata_nik} from INSERT to UPDATE (ID: ${existingMember.id}, row ${item.rowNumber})`)
            } else {
              // Benar-benar baru, tetap di insert list
              membersToInsertFiltered.push(item)
            }
          }
          
          // Tambahkan ke membersToUpdate
          membersToUpdate.push(...membersToUpdateFromCheck)
          
          // Update membersToInsert dengan yang sudah di-filter
          membersToInsert.length = 0
          membersToInsert.push(...membersToInsertFiltered)
          
          console.log(`[MEMBERS IMPORT] After batch check: ${membersToUpdateFromCheck.length} moved to update, ${membersToInsert.length} will be inserted as new`)
        }
      }

      // Batch insert new members (setelah batch check)
      // Gunakan upsert untuk menghindari duplicate key error jika ada duplicate dalam batch
      // Split into smaller batches to avoid timeout and improve performance
      if (membersToInsert.length > 0) {
        const MEMBER_UPSERT_BATCH_SIZE = 1000 // Upsert 1000 members at a time (optimized for faster import)
        console.log(`[MEMBERS IMPORT] Batch upserting ${membersToInsert.length} new members in batches of ${MEMBER_UPSERT_BATCH_SIZE}...`)
        
        for (let i = 0; i < membersToInsert.length; i += MEMBER_UPSERT_BATCH_SIZE) {
          const batch = membersToInsert.slice(i, i + MEMBER_UPSERT_BATCH_SIZE)
          const upsertPayloads = batch.map(item => item.payload)

          // Gunakan upsert dengan onConflict pada constraint unique
          // Constraint idx_org_members_org_user_unique adalah unique pada (organization_id, user_id)
          // Tapi karena Supabase tidak support onConflict dengan multiple columns secara langsung,
          // kita perlu handle duplicate dengan cara lain
          
          // Untuk menghindari duplicate dalam batch yang sama, deduplicate dulu
          const uniquePayloads = new Map<string, { payload: any; rowNumber: number }>()
          
          upsertPayloads.forEach((payload, idx) => {
            const batchItem = batch[idx]
            if (!batchItem) return // Safety check
            
            // Buat key unik berdasarkan organization_id + user_id (atau biodata_nik jika user_id null)
            const uniqueKey = payload.user_id 
              ? `${payload.organization_id}_${payload.user_id}`
              : `${payload.organization_id}_nik_${payload.biodata_nik}`
            
            // Jika sudah ada, skip (ambil yang pertama)
            if (!uniquePayloads.has(uniqueKey)) {
              uniquePayloads.set(uniqueKey, { payload, rowNumber: batchItem.rowNumber })
            } else {
              // Duplicate dalam batch yang sama, log warning
              console.warn(`[MEMBERS IMPORT] Duplicate member in batch: ${uniqueKey}, skipping row ${batchItem.rowNumber}`)
            }
          })

          const deduplicatedItems = Array.from(uniquePayloads.values())
          const deduplicatedPayloads = deduplicatedItems.map(item => item.payload)

          // Insert dengan handling duplicate key error
          // Karena Supabase tidak support onConflict dengan multiple columns, kita perlu insert satu per satu
          // atau handle error duplicate key
          const { data: newMembers, error: insertError } = await adminClient
            .from("organization_members")
            .insert(deduplicatedPayloads)
            .select("id, user_id, biodata_nik")

          if (insertError) {
            console.error(`[MEMBERS IMPORT] Batch member insert error (batch ${Math.floor(i / MEMBER_UPSERT_BATCH_SIZE) + 1}):`, insertError)
            
            // Jika insert gagal karena duplicate key constraint, coba insert satu per satu
            // dan handle duplicate dengan update jika sudah ada
            if (insertError.message?.includes("duplicate key") || insertError.message?.includes("unique constraint") || insertError.message?.includes("idx_org_members_org_user_unique")) {
              console.log(`[MEMBERS IMPORT] Duplicate key detected, trying individual inserts with update fallback...`)
              
              for (const item of deduplicatedItems) {
                // Cek apakah member sudah ada berdasarkan user_id atau biodata_nik
                let existingMemberId: number | null = null
                
                if (item.payload.user_id) {
                  const existing = membersByUserId.get(item.payload.user_id)
                  if (existing && existing.organization_id === orgId) {
                    existingMemberId = existing.id
                  }
                } else if (item.payload.biodata_nik) {
                  const existing = membersByBiodataNik.get(item.payload.biodata_nik)
                  if (existing && existing.organization_id === orgId) {
                    existingMemberId = existing.id
                  }
                }
                
                if (existingMemberId) {
                  // Member sudah ada, update saja
                  const updateData: any = { is_active: true }
                  if (item.payload.department_id) updateData.department_id = item.payload.department_id
                  if (item.payload.biodata_nik) updateData.biodata_nik = item.payload.biodata_nik
                  
                  const { error: updateError } = await adminClient
                    .from("organization_members")
                    .update(updateData)
                    .eq("id", existingMemberId)
                  
                  if (updateError) {
                    if (!failedAfterValidation.has(item.rowNumber)) {
                      failed++
                      failedAfterValidation.add(item.rowNumber)
                      errors.push({
                        row: item.rowNumber,
                        message: `Baris ${item.rowNumber}: Gagal memperbarui member organisasi - ${updateError.message}`,
                      })
                    }
                  } else {
                    console.log(`[MEMBERS IMPORT] Updated existing member ${existingMemberId} for row ${item.rowNumber}`)
                  }
                } else {
                  // Coba insert satu per satu
                  const { data: singleMember, error: singleError } = await adminClient
                    .from("organization_members")
                    .insert(item.payload)
                    .select("id, user_id, biodata_nik")
                    .maybeSingle()
                  
                  if (singleError) {
                    // Jika masih duplicate, berarti ada race condition atau cache tidak lengkap
                    // Query untuk mendapatkan member yang sudah ada
                    if (singleError.message?.includes("duplicate key") || singleError.message?.includes("unique constraint") || singleError.message?.includes("idx_org_members_org_user_unique")) {
                      // Query berdasarkan organization_id dan user_id (atau biodata_nik jika user_id null)
                      let query = adminClient
                        .from("organization_members")
                        .select("id, user_id, biodata_nik")
                        .eq("organization_id", item.payload.organization_id)
                      
                      if (item.payload.user_id) {
                        query = query.eq("user_id", item.payload.user_id)
                      } else if (item.payload.biodata_nik) {
                        query = query.eq("biodata_nik", item.payload.biodata_nik).is("user_id", null)
                      }
                      
                      const { data: existingMember } = await query.maybeSingle()
                      
                      if (existingMember) {
                        // Update member yang sudah ada
                        const updateData: any = { is_active: true }
                        if (item.payload.department_id) updateData.department_id = item.payload.department_id
                        if (item.payload.biodata_nik) updateData.biodata_nik = item.payload.biodata_nik
                        
                        const { error: updateError } = await adminClient
                          .from("organization_members")
                          .update(updateData)
                          .eq("id", existingMember.id)
                        
                        if (updateError) {
                          if (!failedAfterValidation.has(item.rowNumber)) {
                            failed++
                            failedAfterValidation.add(item.rowNumber)
                            errors.push({
                              row: item.rowNumber,
                              message: `Baris ${item.rowNumber}: Gagal memperbarui member organisasi - ${updateError.message}`,
                            })
                          }
                        } else {
                          // Update cache
                          if (existingMember.user_id && orgId) {
                            membersByUserId.set(existingMember.user_id, { id: existingMember.id, biodata_nik: existingMember.biodata_nik, organization_id: orgId })
                          }
                          if (existingMember.biodata_nik && orgId) {
                            membersByBiodataNik.set(existingMember.biodata_nik, { id: existingMember.id, user_id: existingMember.user_id, organization_id: orgId })
                          }
                          console.log(`[MEMBERS IMPORT] Updated existing member ${existingMember.id} for row ${item.rowNumber} (found via query)`)
                        }
                      } else {
                        if (!failedAfterValidation.has(item.rowNumber)) {
                          failed++
                          failedAfterValidation.add(item.rowNumber)
                          errors.push({
                            row: item.rowNumber,
                            message: `Baris ${item.rowNumber}: Gagal membuat member organisasi - ${singleError.message}`,
                          })
                        }
                      }
                    } else {
                      if (!failedAfterValidation.has(item.rowNumber)) {
                        failed++
                        failedAfterValidation.add(item.rowNumber)
                        errors.push({
                          row: item.rowNumber,
                          message: `Baris ${item.rowNumber}: Gagal membuat member organisasi - ${singleError.message}`,
                        })
                      }
                    }
                  } else if (singleMember) {
                    // Update cache
                    if (singleMember.user_id && orgId) {
                      membersByUserId.set(singleMember.user_id, { id: singleMember.id, biodata_nik: singleMember.biodata_nik, organization_id: orgId })
                    }
                    if (singleMember.biodata_nik && orgId) {
                      membersByBiodataNik.set(singleMember.biodata_nik, { id: singleMember.id, user_id: singleMember.user_id, organization_id: orgId })
                    }
                  }
                }
              }
            } else {
              // Error lain, tandai semua sebagai failed
              deduplicatedItems.forEach(item => {
                if (!failedAfterValidation.has(item.rowNumber)) {
                  failed++
                  failedAfterValidation.add(item.rowNumber)
                  errors.push({
                    row: item.rowNumber,
                    message: `Baris ${item.rowNumber}: Gagal membuat member organisasi - ${insertError.message}`,
                  })
                }
              })
            }
          } else if (newMembers) {
            newMembers.forEach((member: any) => {
              if (member.user_id && orgId) {
                membersByUserId.set(member.user_id, { id: member.id, biodata_nik: member.biodata_nik, organization_id: orgId })
              }
              if (member.biodata_nik && orgId) {
                membersByBiodataNik.set(member.biodata_nik, { id: member.id, user_id: member.user_id, organization_id: orgId })
              }
            })
            console.log(`[MEMBERS IMPORT] Successfully inserted batch ${Math.floor(i / MEMBER_UPSERT_BATCH_SIZE) + 1} (${deduplicatedPayloads.length} members, ${upsertPayloads.length - deduplicatedPayloads.length} duplicates skipped)`)
          }
        }
      }

      // Batch update existing members (optimized with higher concurrency)
      const UPDATE_BATCH_SIZE = 300 // Optimized for faster import (increased from 100)
      const UPDATE_CONCURRENCY = 50 // Process 50 updates in parallel per batch
      
      for (let i = 0; i < membersToUpdate.length; i += UPDATE_BATCH_SIZE) {
        const batch = membersToUpdate.slice(i, i + UPDATE_BATCH_SIZE)
        
        // Process batch dengan concurrency limit untuk menghindari overwhelming database
        for (let j = 0; j < batch.length; j += UPDATE_CONCURRENCY) {
          const concurrentBatch = batch.slice(j, j + UPDATE_CONCURRENCY)
          await Promise.all(
            concurrentBatch.map(async ({ id, data, rowNumber }) => {
              const { error: updateError } = await adminClient
                .from("organization_members")
                .update(data)
                .eq("id", id)
              
              if (updateError && !failedAfterValidation.has(rowNumber)) {
                failed++
                failedAfterValidation.add(rowNumber)
                errors.push({
                  row: rowNumber,
                  message: `Baris ${rowNumber}: Gagal memperbarui member organisasi - ${updateError.message}`,
                })
              }
            })
          )
        }
      }

      // Audit logs (optional, bisa di-skip jika terlalu lambat)
      if (trackHistory) {
        const auditLogs = validRows
          .filter(vr => !failedAfterValidation.has(vr.rowNumber))
          .map((vr) => ({
          organization_id: orgId,
          user_id: user.id,
          action: "member_import",
          entity_type: "biodata",
          entity_id: null,
          old_values: null,
          new_values: {
            nik: vr.nik,
            nama: vr.nama,
            email: vr.email,
            department_id: vr.departmentId,
            row_number: vr.rowNumber,
            file_name: file.name,
          },
          ip_address: null,
          user_agent: null,
          session_id: null,
        }))

        // Batch insert audit logs dalam batch kecil
        const AUDIT_BATCH_SIZE = 200 // Optimized for faster import (increased from 50)
        for (let i = 0; i < auditLogs.length; i += AUDIT_BATCH_SIZE) {
          const batch = auditLogs.slice(i, i + AUDIT_BATCH_SIZE)
          try {
            await adminClient.from("audit_logs").insert(batch)
          } catch (err: any) {
            console.error("[MEMBERS IMPORT] Failed to write audit log batch:", err)
          }
        }
      }

      // Hitung success berdasarkan row yang benar-benar berhasil (bukan hanya validRows.length)
      // Row yang gagal setelah validasi sudah ditrack di failedAfterValidation
      success = validRows.length - failedAfterValidation.size
      console.log(`[MEMBERS IMPORT] Batch processing complete: ${success} success, ${failed} failed (${validRows.length} validated, ${failedAfterValidation.size} failed after validation)`)

      // Kumpulkan data untuk preview halaman finger (hanya yang berhasil diproses)
      validRows
        .filter(vr => !failedAfterValidation.has(vr.rowNumber))
        .forEach((vr) => {
          fingerPagePreview.push({
            row: vr.rowNumber,
            nik: vr.nik,
            nama: vr.nama,
            email: vr.email,
            department: vr.departmentName,
          })
        })

      // Skip loop normal untuk mode import
      // Continue to response section
    } else {
      // Mode test: tetap gunakan loop normal (karena perlu cleanup)
      for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = headerRow + headerRowCount + i

      if (!row) {
        failed++
        errors.push({ row: rowNumber, message: "Empty row" })
          continue
        }

      const nik = getMappedValue(row, "nik")
      const nama = getMappedValue(row, "nama")
      const nisn = getMappedValue(row, "nisn")
      const jenisKelamin = getMappedValue(row, "jenis_kelamin").toUpperCase()
      const tempatLahir = getMappedValue(row, "tempat_lahir")
      const tanggalLahirRaw = getMappedValue(row, "tanggal_lahir")
      const agama = getMappedValue(row, "agama")
      const jalan = getMappedValue(row, "jalan")
      const rt = getMappedValue(row, "rt")
      const rw = getMappedValue(row, "rw")
      const dusun = getMappedValue(row, "dusun")
      const kelurahan = getMappedValue(row, "kelurahan")
      const kecamatan = getMappedValue(row, "kecamatan")
      const noTelepon = getMappedValue(row, "no_telepon")
      const email = getMappedValue(row, "email")
      const departmentValue = getMappedValue(row, "department_id")

      if (!nik) {
        failed++
        errors.push({ row: rowNumber, message: "NIK is required" })
          continue
        }

      if (!nama) {
        failed++
        errors.push({ row: rowNumber, message: "Nama Lengkap is required" })
        continue
      }

      // Email tidak wajib, tapi jika ada harus valid format
      if (email && email.trim() !== "") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          failed++
          errors.push({ row: rowNumber, message: `Email format invalid: "${email}"` })
          continue
        }
      } else {
        // Hitung yang tidak punya email (untuk reporting)
        if (mode === "test") {
          withoutEmailCount++
        }
      }
              
      if (mapping.jenis_kelamin) {
        if (!jenisKelamin) {
          failed++
          errors.push({
            row: rowNumber,
            message: "Jenis Kelamin is required (must be 'L' or 'P')",
          })
          continue
        }
        if (jenisKelamin !== "L" && jenisKelamin !== "P") {
          failed++
          errors.push({
            row: rowNumber,
            message: "Jenis Kelamin must be 'L' or 'P'",
          })
          continue
        }
      }

      let tanggalLahir: string | null = null
      if (tanggalLahirRaw) {
        tanggalLahir = parseDateString(tanggalLahirRaw)
        if (!tanggalLahir) {
            failed++
            errors.push({
              row: rowNumber,
              message: `Tanggal Lahir invalid: "${tanggalLahirRaw}"`,
            })
              continue
          }
        }

      // Validasi NIK harus dilakukan sebelum mode test/import
      if (nik && nik.length < 10) {
        failed++
        errors.push({
          row: rowNumber,
          message: `NIK terlalu pendek (minimal 10 karakter): "${nik}"`,
        })
        continue
      }

      if (email && email !== "") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          failed++
          errors.push({
            row: rowNumber,
            message: `Email format invalid: "${email}"`,
          })
          continue
        }
      }

      let departmentId: number | null = null
      
      // Prioritas: groupIdParam dari dropdown > departmentValue dari Excel
      if (groupIdParam && groupIdParam.trim() !== "") {
        // Gunakan group yang dipilih dari dropdown
        const groupIdNum = parseInt(groupIdParam, 10)
        if (!isNaN(groupIdNum)) {
          departmentId = groupIdNum
          console.log(`[MEMBERS IMPORT] Using groupIdParam for row ${rowNumber}:`, groupIdNum)
        }
      } else if (departmentValue && departments && departments.length > 0) {
        console.log(`[MEMBERS IMPORT] Using departmentValue from Excel for row ${rowNumber}:`, departmentValue)
        // Fallback: gunakan department dari Excel jika groupIdParam tidak ada
        const deptResult = findDepartmentId(departmentValue, departments)
        if (deptResult.id) {
          departmentId = deptResult.id
        } else if (deptResult.notFound) {
          errors.push({
            row: rowNumber,
            message: `Department "${departmentValue}" not found (skipped)`,
          })
        }
      }

      if (mode === "test") {
        // Mode test: Validasi lengkap seperti import mode, TIDAK insert/update ke database
        // Ini memastikan test mode memberikan hasil yang sama dengan import mode
        
        try {
          // Validasi: Cek apakah email sudah ada (untuk preview)
          const hasEmail = email && email.trim() !== ""
          let userId: string | null = null
          if (hasEmail) {
            const existingUserData = usersByEmail.get(email.toLowerCase())
            if (existingUserData) {
              userId = existingUserData.id
            }
          }

          // Validasi: Cek apakah department yang dipilih valid
          if (departmentId) {
            const deptExists = departments?.some((d: any) => Number(d.id) === Number(departmentId))
            if (!deptExists) {
              failed++
              errors.push({
                row: rowNumber,
                message: `Department dengan ID ${departmentId} tidak ditemukan`,
              })
              continue
            }
          }

          // Validasi: Cek apakah NIK sudah ada di organization yang sama (untuk update vs insert)
          // Jika NIK sudah ada, berarti akan di-update (bukan insert baru), jadi ini SUCCESS
          let existingMember: { id: number; biodata_nik?: string | null; user_id?: string | null; organization_id: number } | null = null
          if (userId) {
            existingMember = membersByUserId.get(userId) || null
          } else if (nik) {
            existingMember = membersByBiodataNik.get(nik) || null
            // Pastikan organization_id sama
            if (existingMember && existingMember.organization_id !== orgId) {
              existingMember = null
            }
          }

          // Jika existing member ditemukan berdasarkan NIK, berarti akan di-update
          // Ini adalah SUCCESS, bukan error
          if (existingMember) {
            // Log untuk debugging
            console.log(`[MEMBERS IMPORT TEST] Row ${rowNumber}: NIK ${nik} sudah ada, akan di-update (member ID: ${existingMember.id})`)
            
            // Validasi tambahan: Jika groupIdParam dipilih, pastikan departmentId valid
            if (groupIdParam && groupIdParam.trim() !== "") {
              if (!departmentId) {
                // Ini bukan error fatal, hanya warning - tetap bisa di-update
                console.warn(`[MEMBERS IMPORT TEST] Row ${rowNumber}: Department ID tidak valid untuk group yang dipilih, tapi tetap akan di-update`)
              }
            }
            
            // Jika semua validasi passed, hitung sebagai success (akan di-update)
            success++
          } else {
            // Jika tidak ada existing member, berarti akan insert baru
            // Pastikan tidak ada constraint violation
            // Validasi: Pastikan NIK tidak null (sudah divalidasi di atas)
            // Jika semua validasi passed, hitung sebagai success
            success++
          }
          
          // Kumpulkan data untuk preview halaman finger (hanya yang punya email)
          let departmentName: string | undefined = undefined
          if (departmentId && departments && departments.length > 0) {
            const dept = departments.find((d: any) => Number(d.id) === Number(departmentId)) as any
            if (dept && typeof dept === 'object' && 'name' in dept) {
              departmentName = (dept as { name?: string }).name || undefined
            }
          }
          
          fingerPagePreview.push({
            row: rowNumber,
            nik,
            nama,
            email: email,
            department: departmentName,
          })
        } catch (error: any) {
          failed++
          errors.push({
            row: rowNumber,
            message: `Validation error: ${error.message || "Unexpected error"}`,
          })
        }
        continue
      }

      try {
        // Email tidak wajib, jika tidak ada email akan dibuat email dummy: nik@dummy.local
        let userId: string | null = null
        const hasEmail = email && email.trim() !== ""
        
        // Generate email dummy jika tidak ada email
        const finalEmail = hasEmail ? email : `${nik}@dummy.local`

        // Selalu buat user account (baik dengan email asli atau email dummy)
        // OPTIMASI: Gunakan cached usersByEmail map
        const existingUserData = usersByEmail.get(finalEmail.toLowerCase())

          if (existingUserData) {
            userId = existingUserData.id

            // Ensure last_name is never null (use empty string if no last name)
            const nameParts = nama.trim().split(" ")
            const lastName = nameParts.slice(1).join(" ") || ""
            const { error: profileError } = await adminClient
              .from("user_profiles")
              .upsert(
                {
                  id: userId,
                  email: finalEmail,
                  first_name: nameParts[0] || nama,
                  last_name: lastName,
                  phone: noTelepon || null,
                  display_name: nama,
                  is_active: true,
                  // Fields from import data
                  nik: nik || null,
                  nisn: nisn || null,
                  jenis_kelamin: convertJenisKelamin(jenisKelamin),
                  tempat_lahir: tempatLahir || null,
                  date_of_birth: tanggalLahir || null,
                  agama: agama || null,
                  jalan: jalan || null,
                  rt: rt || null,
                  rw: rw || null,
                  dusun: dusun || null,
                  kelurahan: kelurahan || null,
                  kecamatan: kecamatan || null,
                },
                {
                  onConflict: "id",
                }
              )

            if (profileError) {
              failed++
              errors.push({
                row: rowNumber,
                message: `Baris ${rowNumber}: Gagal memperbarui profil user - ${profileError.message}`,
              })
              continue
            }
          } else {
            // Email tidak ada di cache, coba buat user baru
            const randomPassword = `MB${orgId}${Date.now()}${Math.random().toString(36).substring(2, 15)}`

            const nameParts = nama.trim().split(" ")
            const firstName = nameParts[0] || nama
            // Ensure last_name is never null (use empty string if no last name)
            const lastName = nameParts.slice(1).join(" ") || ""

            const { data: newUser, error: createUserError } = await adminClient.auth.admin.createUser({
              email: finalEmail,
              password: randomPassword,
              email_confirm: true,
              user_metadata: {
                first_name: firstName,
                last_name: lastName,
              },
            })

              if (createUserError) {
                // Jika error karena email sudah terdaftar, cari user yang sudah ada
                if (createUserError.message?.toLowerCase().includes("already been registered") || 
                    createUserError.message?.toLowerCase().includes("email already exists")) {
                  console.log(`[MEMBERS IMPORT] Email ${finalEmail} sudah terdaftar, mencari user yang sudah ada...`)
                  
                  // Cek cache dulu (mungkin ada race condition)
                  const cachedUser = usersByEmail.get(finalEmail.toLowerCase())
                  if (cachedUser) {
                    userId = cachedUser.id
                    console.log(`[MEMBERS IMPORT] Found cached user for email ${finalEmail}, using userId: ${userId}`)
                  } else {
                    // Jika tidak ada di cache, cari dengan listUsers dengan pagination
                    let found = false
                    let page = 1
                    const perPage = 1000
                    
                    while (!found && page <= 10) { // Max 10 pages untuk safety
                      const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers({
                        page,
                        perPage,
                      })
                      
                      if (listError) {
                        console.error(`[MEMBERS IMPORT] Failed to list users (page ${page}) to find existing user for ${finalEmail}:`, listError)
                        break
                      }
                      
                      if (existingUsers?.users) {
                        const existingUser = existingUsers.users.find(
                          (u: any) => u.email?.toLowerCase() === finalEmail.toLowerCase()
                        )
                        
                        if (existingUser) {
                          userId = existingUser.id
                          // Update cache
                          usersByEmail.set(finalEmail.toLowerCase(), { id: userId, email: finalEmail })
                          console.log(`[MEMBERS IMPORT] Found existing user for email ${finalEmail} on page ${page}, using userId: ${userId}`)
                          found = true
                          break
                        }
                        
                        // Jika tidak ada lagi users di page ini, stop
                        if (existingUsers.users.length < perPage) {
                          break
                        }
                      } else {
                        break
                      }
                      
                      page++
                    }
                    
                    // Jika masih tidak ditemukan, coba refresh cache dengan listUsers sekali lagi
                    if (!found && !userId) {
                      console.log(`[MEMBERS IMPORT] Email ${finalEmail} tidak ditemukan di paginated search, refreshing cache...`)
                      const { data: allUsers, error: refreshError } = await adminClient.auth.admin.listUsers()
                      if (!refreshError && allUsers?.users) {
                        // Update cache dengan semua users
                        allUsers.users.forEach((u: any) => {
                          if (u.email) {
                            usersByEmail.set(u.email.toLowerCase(), { id: u.id, email: u.email })
                          }
                        })
                        
                        const existingUser = allUsers.users.find(
                          (u: any) => u.email?.toLowerCase() === finalEmail.toLowerCase()
                        )
                        
                        if (existingUser) {
                          userId = existingUser.id
                          console.log(`[MEMBERS IMPORT] Found existing user for email ${finalEmail} after cache refresh, using userId: ${userId}`)
                        }
                      }
                    }
                  }
                  
                  // Jika userId masih null setelah semua pencarian, anggap sebagai error
                  if (!userId) {
                    console.error(`[MEMBERS IMPORT] Email ${finalEmail} dikatakan sudah terdaftar tapi tidak dapat menemukan user yang sudah ada setelah semua pencarian`)
                    failed++
                    errors.push({
                      row: rowNumber,
                      message: `Baris ${rowNumber}: Email sudah terdaftar tapi tidak dapat menemukan user yang sudah ada`,
                    })
                    continue
                  }
                } else {
                  // Error lain selain email sudah terdaftar
                  failed++
                  errors.push({
                    row: rowNumber,
                    message: `Baris ${rowNumber}: Gagal membuat user - ${createUserError.message}`,
                  })
                  continue
                }
            } else if (!newUser?.user) {
              failed++
              errors.push({
                row: rowNumber,
                message: `Baris ${rowNumber}: Gagal membuat user - Tidak ada user yang dikembalikan`,
              })
              continue
            } else {
              // User berhasil dibuat
              userId = newUser.user.id
              // Update cache untuk user baru (termasuk email dummy)
              usersByEmail.set(finalEmail.toLowerCase(), { id: userId, email: finalEmail })
            }

            const { error: profileError } = await adminClient
              .from("user_profiles")
              .upsert(
                {
                  id: userId,
                  email: finalEmail,
                  first_name: firstName,
                  last_name: lastName,
                  phone: noTelepon || null,
                  display_name: nama,
                  is_active: true,
                  // Fields from import data
                  nik: nik || null,
                  nisn: nisn || null,
                  jenis_kelamin: convertJenisKelamin(jenisKelamin),
                  tempat_lahir: tempatLahir || null,
                  date_of_birth: tanggalLahir || null,
                  agama: agama || null,
                  jalan: jalan || null,
                  rt: rt || null,
                  rw: rw || null,
                  dusun: dusun || null,
                  kelurahan: kelurahan || null,
                  kecamatan: kecamatan || null,
                },
                {
                  onConflict: "id",
                }
              )

            if (profileError) {
              failed++
              errors.push({
                row: rowNumber,
                message: `Baris ${rowNumber}: Gagal membuat profil user - ${profileError.message}`,
              })
              try {
                await adminClient.auth.admin.deleteUser(userId)
              } catch (deleteError) {
                console.error(`[MEMBERS IMPORT] Failed to cleanup user ${userId}:`, deleteError)
              }
              continue
            }
          }

        // Buat/update organization_members
        // Bisa dibuat dengan user_id NULL untuk member tanpa email
        if (orgId) {
          const today = new Date().toISOString().split("T")[0]

          // Cari existing member: berdasarkan userId jika ada, atau berdasarkan NIK jika tidak ada email
          let existingMember: { id: number; biodata_nik?: string | null; user_id?: string | null; organization_id: number } | null = null
          if (userId) {
            existingMember = membersByUserId.get(userId) || null
          } else if (nik) {
            existingMember = membersByBiodataNik.get(nik) || null
            // Pastikan organization_id sama
            if (existingMember && existingMember.organization_id !== orgId) {
              existingMember = null
            }
          }

          if (existingMember) {
            // Update department dan biodata_nik jika diperlukan
            const updateData: any = {
              is_active: true,
            }
            // Jika groupIdParam dipilih, selalu update department_id
            if (groupIdParam && groupIdParam.trim() !== "") {
              updateData.department_id = departmentId
              console.log(`[MEMBERS IMPORT] Updating existing member ${existingMember.id} with department_id:`, departmentId)
            } else {
              // Jika tidak ada groupIdParam, hanya update jika member belum punya department_id
              const { data: memberData, error: memberDataError } = await adminClient
                .from("organization_members")
                .select("department_id")
                .eq("id", existingMember.id)
                .single()
              
              if (memberDataError) {
                // Jika query gagal (misalnya member tidak ditemukan), anggap member belum punya department_id
                console.warn(`[MEMBERS IMPORT] Failed to fetch member data for ${existingMember.id}, assuming no department_id:`, memberDataError)
                if (departmentId) {
                  updateData.department_id = departmentId
                }
              } else if (!memberData?.department_id && departmentId) {
                updateData.department_id = departmentId
              }
            }
            // Update biodata_nik dengan NIK jika belum ada atau berbeda
            if (nik && 'biodata_nik' in existingMember && existingMember.biodata_nik !== nik) {
              updateData.biodata_nik = nik
            }
            
            // OPSI 3: Update user_id jika existing member punya user_id NULL
            // Cari atau buat user account untuk member yang sebelumnya tidak punya user_id
            if (!existingMember.user_id && nik) {
              // Jika userId dari import baru tidak ada, cari user berdasarkan email dummy
              if (!userId) {
                const dummyEmail = `${nik}@dummy.local`
                const { data: existingUser } = await adminClient
                  .from("user_profiles")
                  .select("id")
                  .eq("email", dummyEmail)
                  .maybeSingle()
                
                if (existingUser) {
                  userId = existingUser.id
                  console.log(`[MEMBERS IMPORT] Found existing user for dummy email ${dummyEmail}, will update user_id for member ${existingMember.id}`)
                } else {
                  // User belum ada, buat user account baru dengan email dummy
                  const randomPassword = `password`
                  const { data: newUser, error: createUserError } = await adminClient.auth.admin.createUser({
                    email: dummyEmail,
                    password: randomPassword,
                    email_confirm: true,
                  })
                  
                  if (createUserError) {
                    console.error(`[MEMBERS IMPORT] Failed to create user for dummy email ${dummyEmail}:`, createUserError)
                    // Continue tanpa user_id, tetap update field lain
                  } else if (newUser?.user) {
                    userId = newUser.user.id
                    
                    // Buat user profile
                    const nameParts = nama.trim().split(" ")
                    // Ensure last_name is never null (use empty string if no last name)
                    const lastName = nameParts.slice(1).join(" ") || ""
                    const { error: profileError } = await adminClient
                      .from("user_profiles")
                      .upsert({
                        id: userId,
                        email: dummyEmail,
                        first_name: nameParts[0] || nama,
                        last_name: lastName,
                        phone: noTelepon || null,
                        display_name: nama,
                        is_active: true,
                        // Fields from import data
                        nik: nik || null,
                        nisn: nisn || null,
                        jenis_kelamin: convertJenisKelamin(jenisKelamin),
                        tempat_lahir: tempatLahir || null,
                        date_of_birth: tanggalLahir || null,
                        agama: agama || null,
                        jalan: jalan || null,
                        rt: rt || null,
                        rw: rw || null,
                        dusun: dusun || null,
                        kelurahan: kelurahan || null,
                        kecamatan: kecamatan || null,
                      }, { onConflict: "id" })
                    
                    if (profileError) {
                      console.error(`[MEMBERS IMPORT] Failed to create user profile for ${dummyEmail}:`, profileError)
                    } else {
                      console.log(`[MEMBERS IMPORT] Created new user account with dummy email ${dummyEmail} for member ${existingMember.id}`)
                    }
                  }
                }
              }
              
              // Update user_id jika sudah ditemukan atau dibuat
              if (userId) {
                updateData.user_id = userId
              }
            } else if (userId && 'user_id' in existingMember && !existingMember.user_id) {
              // Update user_id jika ada dari import baru (untuk member yang sebelumnya tanpa email, sekarang punya email)
              updateData.user_id = userId
            }

            if (Object.keys(updateData).length > 1) { // Lebih dari is_active saja
              const { error: updateMemberError } = await adminClient
                .from("organization_members")
                .update(updateData)
                .eq("id", existingMember.id)

              if (updateMemberError) {
                failed++
                errors.push({
                  row: rowNumber,
                  message: `Baris ${rowNumber}: Gagal memperbarui member organisasi (ID: ${existingMember.id}) - ${updateMemberError.message}`,
                })
                console.error(`[MEMBERS IMPORT] Failed to update member ${existingMember.id} for row ${rowNumber}:`, updateMemberError)
                continue
              } else {
                console.log(`[MEMBERS IMPORT] Successfully updated member ${existingMember.id} for row ${rowNumber}`)
              }
            } else {
              // Jika hanya is_active yang diupdate, anggap sebagai success (tidak perlu update)
              console.log(`[MEMBERS IMPORT] Member ${existingMember.id} already up to date for row ${rowNumber}`)
            }
          } else {
            const insertPayload = {
              user_id: userId, // NULL untuk member tanpa email
              organization_id: orgId,
              department_id: departmentId,
              biodata_nik: nik, // Wajib untuk memenuhi constraint (user_id OR biodata_nik harus ada)
              hire_date: today,
              is_active: true,
            }
            console.log(`[MEMBERS IMPORT] Inserting new member with department_id:`, departmentId, `for NIK:`, nik)
            const { data: newMember, error: memberInsertError } = await adminClient
              .from("organization_members")
              .insert(insertPayload)
              .select("id")
              .single()

            if (memberInsertError) {
              failed++
              errors.push({
                row: rowNumber,
                message: `Baris ${rowNumber}: Gagal membuat member organisasi - ${memberInsertError.message}`,
              })
              continue
            }
            
            // Update cache untuk member baru
            if (newMember) {
              if (userId) {
                membersByUserId.set(userId, { id: newMember.id, biodata_nik: nik, organization_id: orgId })
              }
              if (nik) {
                membersByBiodataNik.set(nik, { id: newMember.id, user_id: userId, organization_id: orgId })
              }
            }
          }
        }

        if (trackHistory && mode === "import") {
              try {
                await adminClient
              .from("audit_logs")
                  .insert({
                    organization_id: orgId,
                    user_id: user.id,
                action: "member_import",
                entity_type: "biodata",
                entity_id: null,
                    old_values: null,
                    new_values: {
                  nik,
                  nama,
                  email,
                  department_id: departmentId,
                  row_number: rowNumber,
                      file_name: file.name,
                    },
                    ip_address: null,
                    user_agent: null,
                    session_id: null,
                  })
              } catch (auditError) {
            console.error("[MEMBERS IMPORT] Failed to write audit log:", auditError)
          }
        }

        success++
      } catch (error: any) {
        failed++
        errors.push({
          row: rowNumber,
          message: error.message || "Unexpected error",
        })
        console.error(`[MEMBERS IMPORT] Error processing row ${rowNumber}:`, error)
      }
    }
    } // End of else block (mode test)

    const response: any = {
      success: true,
      summary: {
        success,
        failed,
        errors,
      },
    }

    // Untuk mode test, tambahkan informasi preview halaman finger
    if (mode === "test") {
      const withEmailCount = fingerPagePreview.length
      const totalWillAppear = withEmailCount
      
      let message = ""
      if (totalWillAppear > 0) {
        message = `${totalWillAppear} data akan muncul di halaman Fingerprint setelah import`
      } else {
        message = "Tidak ada data yang akan muncul di halaman Fingerprint"
      }
      
      response.fingerPagePreview = {
        totalRows: totalWillAppear,
        withEmailCount,
        withoutEmailCount,
        sampleData: fingerPagePreview.slice(0, 10), // Ambil 10 sample pertama
        message,
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[MEMBERS IMPORT] Unexpected error:", error)
    return NextResponse.json(
      { success: false, message: "Unexpected error processing import" },
      { status: 500 }
    )
  }
}

