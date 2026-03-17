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
    const headerRowInput = formData.get("headerRow")
    const headerRowCountInput = formData.get("headerRowCount")
    const requestedSheet = (formData.get("sheetName") || "") as string
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

    // Minimal required field untuk biodata: nik & nama
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

    //komentar
    // Auth & org (untuk lookup departments)
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

    // Get organization_id untuk lookup departments
    if (organizationIdParam) {
      orgId = parseInt(organizationIdParam, 10)
      if (isNaN(orgId)) {
        return NextResponse.json(
          { success: false, message: "Invalid organization_id" },
          { status: 400 }
        )
      }

      // Verify user is member of this organization
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
      // Fallback: get organization from user's most recent member record
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

    // Helper function untuk normalize string untuk matching
    const normalizeForMatching = (str: string): string => {
      if (!str) return ""
      return str
        .trim()
        .toLowerCase()
        .replace(/[\s\-_\.]/g, "")
        .replace(/[^\w]/g, "")
    }

    // Helper function untuk find department ID by name/code
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

      // Try exact match first
      let match = departments.find((item: any) => {
        const nameMatch = String(item?.name ?? "").trim().toLowerCase() === searchValue.toLowerCase()
        const codeMatch = String(item?.code ?? "").trim().toLowerCase() === searchValue.toLowerCase()
        return nameMatch || codeMatch
      })

      // Try flexible matching
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

      // Try subfield matching if enabled
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

      // Try partial match
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

    // Helper function untuk get value dari Excel row berdasarkan mapping
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

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = headerRow + headerRowCount + i // nomor baris asli di Excel

      if (!row) {
        failed++
        errors.push({ row: rowNumber, message: "Empty row" })
        continue
      }

      // Ambil nilai sesuai mapping biodata
      const nik = getMappedValue(row, "nik")
      const nama = getMappedValue(row, "nama")
      const nickname = getMappedValue(row, "nickname")
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

      // Validasi minimal
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

      // Validasi jenis kelamin - wajib jika ada mapping
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

      // Normalisasi tanggal lahir ke YYYY-MM-DD
      let tanggalLahir: string | null = null
      if (tanggalLahirRaw) {
        tanggalLahir = parseDateString(tanggalLahirRaw)
        if (!tanggalLahir) {
          failed++
          errors.push({
            row: rowNumber,
            message: `Tanggal Lahir invalid: "${tanggalLahirRaw}" (gunakan format DD/MM/YYYY, contoh: 15/05/1992)`,
          })
          continue
        }
      }

      // Validasi format NIK (minimal panjang)
      if (nik && nik.length < 10) {
        failed++
        errors.push({
          row: rowNumber,
          message: `NIK terlalu pendek (minimal 10 karakter): "${nik}"`,
        })
        continue
      }

      // Validasi email format jika ada
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

      // Lookup department_id jika ada department value
      let departmentId: number | null = null
      if (departmentValue && departments && departments.length > 0) {
        const deptResult = findDepartmentId(departmentValue, departments)
        if (deptResult.id) {
          departmentId = deptResult.id
        } else if (deptResult.notFound) {
          // Department tidak ditemukan - bisa skip atau error
          // Untuk sekarang kita skip (optional field)
          errors.push({
            row: rowNumber,
            message: `Department "${departmentValue}" not found (skipped)`,
          })
        }
      }

      if (mode === "test") {
        // Hanya validasi, tidak menyentuh DB
        // Tapi kita sudah melakukan semua validasi yang sama dengan mode import
        success++
        continue
      }

      try {
        let userId: string | null = null

        // Jika ada email, buat/update user di auth dan user_profiles (tanpa invitation)
        if (email && email !== "") {
          // Cek apakah user dengan email ini sudah ada
        const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers()
        if (listError) {
          failed++
            errors.push({
              row: rowNumber,
              message: `Failed to check existing users: ${listError.message}`,
            })
          continue
        }

        const existingUser = existingUsers?.users?.find(
            (u) => u.email?.toLowerCase() === email.toLowerCase()
        )

        if (existingUser) {
            // User sudah ada, gunakan user yang ada
          userId = existingUser.id
          
          // Update user profile
            const { error: profileError } = await adminClient
            .from("user_profiles")
              .upsert(
                {
              id: userId,
                  email: email,
                  first_name: nama.split(" ")[0] || nama,
                  last_name: nama.split(" ").slice(1).join(" ") || null,
                  phone: noTelepon || null,
                  display_name: nickname || nama,
              is_active: true,
                },
                {
                  onConflict: "id",
                }
              )

            if (profileError) {
            failed++
              errors.push({
                row: rowNumber,
                message: `Failed to update user profile: ${profileError.message}`,
              })
            continue
          }
        } else {
            // User belum ada, buat user baru tanpa invitation
            // Generate password random (min 6 karakter untuk Supabase)
            const randomPassword = `FP${orgId}${Date.now()}${Math.random().toString(36).substring(2, 15)}`

            // Split nama untuk first_name dan last_name
            const nameParts = nama.trim().split(" ")
            const firstName = nameParts[0] || nama
            const lastName = nameParts.slice(1).join(" ") || null

            // Create user di auth (langsung confirmed, tanpa email invitation)
          const { data: newUser, error: createUserError } = await adminClient.auth.admin.createUser({
              email: email,
            password: randomPassword,
              email_confirm: true, // Langsung confirmed, tidak perlu konfirmasi email
            user_metadata: {
              first_name: firstName,
                last_name: lastName,
            },
          })

          if (createUserError) {
            failed++
              errors.push({
                row: rowNumber,
                message: `Failed to create user: ${createUserError.message}`,
            })
            continue
          }

          if (!newUser?.user) {
            failed++
              errors.push({
                row: rowNumber,
                message: "Failed to create user: No user returned",
              })
            continue
          }

          userId = newUser.user.id

            // Tunggu sebentar untuk trigger (jika ada)
            await new Promise((resolve) => setTimeout(resolve, 100))
          
            // Create user profile
          const { error: profileError } = await adminClient
            .from("user_profiles")
              .upsert(
                {
              id: userId,
                  email: email,
              first_name: firstName,
                  last_name: lastName,
                  phone: noTelepon || null,
                  display_name: nickname || nama,
              is_active: true,
                },
                {
                  onConflict: "id",
                }
              )

          if (profileError) {
            failed++
              errors.push({
                row: rowNumber,
                message: `Failed to create user profile: ${profileError.message}`,
              })
              // Cleanup: hapus user auth jika profile creation gagal
            try {
              await adminClient.auth.admin.deleteUser(userId)
            } catch (deleteError) {
              console.error(`[FINGER IMPORT] Failed to cleanup user ${userId}:`, deleteError)
            }
            continue
          }

            // Buat organization_member jika user baru dan ada orgId
            if (orgId) {
              const today = new Date().toISOString().split("T")[0] // Format: YYYY-MM-DD

              const { error: memberError } = await adminClient
                .from("organization_members")
                .insert({
                  user_id: userId,
                  organization_id: orgId,
                  department_id: departmentId,
                  hire_date: today,
                  is_active: true,
                })

              if (memberError) {
                // Log error tapi jangan gagalkan import (optional)
                console.error(`[FINGER IMPORT] Failed to create organization member:`, memberError)
              }
            }
          }
        }

        // Upsert ke tabel biodata (berdasarkan NIK)
        const biodataPayload: any = {
          nik,
          nama,
          nickname: nickname || null,
          nisn: nisn || null,
          jenis_kelamin: jenisKelamin || null,
          tempat_lahir: tempatLahir || null,
          tanggal_lahir: tanggalLahir,
          agama: agama || null,
          jalan: jalan || null,
          rt: rt || null,
          rw: rw || null,
          dusun: dusun || null,
          kelurahan: kelurahan || null,
          kecamatan: kecamatan || null,
          no_telepon: noTelepon || null,
          email: email || null,
          department_id: departmentId,
          organization_id: orgId || null,
        }

        // Jika ada userId dan ada relasi biodata ke organization_members, link mereka
        // (asumsi: jika ada kolom organization_member_id di biodata)
        if (userId && orgId) {
          // Cari organization_member_id
          const { data: orgMember } = await adminClient
          .from("organization_members")
          .select("id")
          .eq("user_id", userId)
          .eq("organization_id", orgId)
          .maybeSingle()

          if (orgMember) {
            // Jika ada relasi biodata.organization_member_id, uncomment baris ini:
            // biodataPayload.organization_member_id = orgMember.id
          }
        }

        const { error: upsertError } = await adminClient
          .from("biodata")
          .upsert(biodataPayload, {
            onConflict: "nik",
          })

        if (upsertError) {
            failed++
          errors.push({
            row: rowNumber,
            message: `Failed to save biodata: ${upsertError.message}`,
          })
            continue
        }

        success++
      } catch (error: any) {
        failed++
        errors.push({
          row: rowNumber,
          message: error.message || "Unexpected error",
        })
        console.error(`[FINGER IMPORT] Error processing row ${rowNumber}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        success,
        failed,
        errors,
      },
    })
  } catch (error) {
    console.error("[FINGER IMPORT] Unexpected error:", error)
    return NextResponse.json(
      { success: false, message: "Unexpected error processing import" },
      { status: 500 }
    )
  }
}
