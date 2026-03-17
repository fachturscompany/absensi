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

// Helper function to parse time in various formats
function parseTimeString(timeStr: string): string | null {
  if (!timeStr) return null

  // Already in HH:MM:SS or HH:MM format
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeStr)) {
    const parts = timeStr.split(':')
    if (parts[0] && parts[1]) {
      const hours = parts[0].padStart(2, '0')
      const minutes = parts[1].padStart(2, '0')
      const seconds = parts[2] ? parts[2].padStart(2, '0') : '00'
      return `${hours}:${minutes}:${seconds}`
    }
  }

  // Try parsing as Excel time (decimal number)
  const timeNum = parseFloat(timeStr)
  if (!isNaN(timeNum) && timeNum >= 0 && timeNum < 1) {
    const totalSeconds = Math.floor(timeNum * 86400) // 86400 seconds in a day
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return null
}

// Helper function to convert scientific notation to integer string (for NIK)
function convertScientificToIntegerString(value: string | number): string {
  if (typeof value === "number") {
    // If it's already a number, convert to string without scientific notation
    if (Number.isInteger(value)) {
      return String(value)
    }
    // For very large numbers, use toFixed to avoid scientific notation
    return String(Math.round(value))
  }

  const str = String(value).trim()
  if (!str) return ""

  // Check if it's in scientific notation (e.g., "3.50724E+14" or "3.50724e+14")
  const scientificMatch = str.match(/^([+-]?\d*\.?\d+)[eE]([+-]?\d+)$/)
  if (scientificMatch && scientificMatch[1] && scientificMatch[2]) {
    const base = parseFloat(scientificMatch[1])
    const exponent = parseInt(scientificMatch[2], 10)
    const result = base * Math.pow(10, exponent)
    // Convert to integer string (remove decimal if any)
    return String(Math.round(result))
  }

  // If it's already a valid number string, return as is
  if (/^\d+$/.test(str)) {
    return str
  }

  // Try to parse as number and convert back to string
  const num = parseFloat(str)
  if (!isNaN(num) && isFinite(num)) {
    return String(Math.round(num))
  }

  return str
}

// Helper function to combine date and time into ISO timestamp
function combineDateTime(dateStr: string, timeStr: string | null): string | null {
  if (!dateStr) return null
  if (!timeStr) return null

  const time = parseTimeString(timeStr)
  if (!time) return null

  return `${dateStr}T${time}`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const mappingJson = formData.get("mapping") as string
    const mode = (formData.get("mode") as string) || "import"
    const organizationIdParam = formData.get("organization_id") as string | null
    const checkInMethodParam = formData.get("checkInMethod") as string | null
    const headerRowInput = formData.get("headerRow")
    const headerRowCountInput = formData.get("headerRowCount")
    const requestedSheet = (formData.get("sheetName") || "") as string

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

    if (!mapping.nik) {
      return NextResponse.json(
        { success: false, message: "NIK mapping is required" },
        { status: 400 }
      )
    }

    if (!mapping.attendance_date) {
      return NextResponse.json(
        { success: false, message: "Attendance date mapping is required" },
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
    for (let col = 0; col < maxCols; col++) {
      const topCellRaw = String((headerRows[0]?.[col] ?? "")).trim()
      const childCellRaw = String((headerRows[headerRows.length - 1]?.[col] ?? "")).trim()

      let header = ""
      if (childCellRaw && topCellRaw && childCellRaw.toLowerCase() !== topCellRaw.toLowerCase()) {
        header = `${topCellRaw} - ${childCellRaw}`
      } else if (childCellRaw) {
        header = childCellRaw
      } else if (topCellRaw) {
        header = topCellRaw
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

      orgId = typeof member.organization_id === "string"
        ? parseInt(member.organization_id, 10)
        : member.organization_id
    }

    const getMappedValue = (row: Record<string, any>, dbField: string): string => {
      const excelColumn = mapping[dbField]
      if (!excelColumn) return ""

      const rawValue = row[excelColumn]
      if (rawValue === null || rawValue === undefined) return ""

      let value = String(rawValue).trim()

      // Special handling for NIK field: convert scientific notation to integer string
      if (dbField === "nik") {
        value = convertScientificToIntegerString(rawValue)
      }

      return value
    }

    // Helper function to normalize NIK for matching (remove leading zeros, trim)
    const normalizeNik = (nik: string | null | undefined): string => {
      if (!nik) return ""
      const normalized = String(nik).trim()
      // Remove leading zeros but keep at least one digit
      const withoutLeadingZeros = normalized.replace(/^0+/, "") || "0"
      return withoutLeadingZeros
    }

    // Cache organization members by NIK/NIP
    // First, get all organization_members with their biodata_nik and employee_id
    const { data: existingMembers } = await adminClient
      .from("organization_members")
      .select("id, biodata_nik, employee_id, organization_id, user_id")
      .eq("organization_id", orgId)

    const membersByNik = new Map<string, { id: number }>()
    existingMembers?.forEach((member) => {
      if (member.biodata_nik) {
        const normalizedNik = normalizeNik(member.biodata_nik)
        // Store both original and normalized for matching
        membersByNik.set(member.biodata_nik, { id: member.id })
        if (normalizedNik !== member.biodata_nik) {
          membersByNik.set(normalizedNik, { id: member.id })
        }
      }
      if (member.employee_id) {
        const normalizedEmployeeId = normalizeNik(member.employee_id)
        membersByNik.set(member.employee_id, { id: member.id })
        if (normalizedEmployeeId !== member.employee_id) {
          membersByNik.set(normalizedEmployeeId, { id: member.id })
        }
      }
    })

    // Also query user_profiles table to get both NIK and NIP
    // This handles cases where biodata_nik in organization_members might be null or different
    try {
      // Get all user_ids for this organization
      const userIds = existingMembers?.map(m => m.user_id).filter(Boolean) || []

      if (userIds.length > 0) {
        // Create a map of user_id to organization_member_id for this org
        const userIdToOrgMemberId = new Map<string, number>()
        existingMembers?.forEach((member) => {
          if (member.user_id) {
            userIdToOrgMemberId.set(member.user_id, member.id)
          }
        })

        // Process in batches to avoid query size limits
        const BATCH_SIZE = 500
        for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
          const batch = userIds.slice(i, i + BATCH_SIZE)

          // Query user_profiles with NIK for these users
          // Note: user_profiles.id = auth.users.id = organization_members.user_id
          const { data: userProfiles } = await adminClient
            .from("user_profiles")
            .select("id, nik")
            .in("id", batch)

          // Process user_profiles records and add NIK to the lookup map
          userProfiles?.forEach((profile) => {
            // Find the organization_member_id for this user (profile.id = member.user_id)
            const orgMemberId = profile.id ? userIdToOrgMemberId.get(profile.id) : null

            if (orgMemberId) {
              // Add NIK to the map
              if (profile.nik) {
                const normalizedNik = normalizeNik(profile.nik)
                membersByNik.set(profile.nik, { id: orgMemberId })
                if (normalizedNik !== profile.nik) {
                  membersByNik.set(normalizedNik, { id: orgMemberId })
                }
              }


            }
          })
        }
      }
    } catch (error) {
      console.error("[ATTENDANCE IMPORT] Error querying user_profiles for caching:", error)
      // Continue without this cache, will fallback to on-demand queries
    }

    let success = 0
    let failed = 0
    const errors: Array<{ row: number; message: string }> = []

    // Interface for valid row data
    interface ValidRowData {
      rowNumber: number
      payload: {
        organization_member_id: number
        attendance_date: string
        status: string
        validation_status: string
        actual_check_in?: string | null
        actual_check_out?: string | null
        check_in_method?: string | null
      }
    }

    // Collect all valid rows first
    const validRows: ValidRowData[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = headerRow + headerRowCount + i

      if (!row) {
        failed++
        errors.push({ row: rowNumber, message: "Empty row" })
        continue
      }

      const nik = getMappedValue(row, "nik")
      const attendanceDateRaw = getMappedValue(row, "attendance_date")
      const checkInTimeRaw = getMappedValue(row, "check_in_time")
      const checkOutTimeRaw = getMappedValue(row, "check_out_time")
      const statusRaw = getMappedValue(row, "status")
      const validationStatusRaw = getMappedValue(row, "validation_status")

      // Validation
      if (!nik) {
        failed++
        errors.push({ row: rowNumber, message: "NIK is required" })
        continue
      }

      if (!attendanceDateRaw) {
        failed++
        errors.push({ row: rowNumber, message: "Attendance date is required" })
        continue
      }

      const attendanceDate = parseDateString(attendanceDateRaw)
      if (!attendanceDate) {
        failed++
        errors.push({ row: rowNumber, message: `Invalid date format: "${attendanceDateRaw}"` })
        continue
      }

      // Find organization member - try multiple matching strategies
      const normalizedNik = normalizeNik(nik)
      let member = membersByNik.get(nik) || membersByNik.get(normalizedNik)

      // If still not found, try with leading zeros added (for shorter NIKs)
      if (!member && normalizedNik.length < 16) {
        const withLeadingZeros = normalizedNik.padStart(16, "0")
        member = membersByNik.get(withLeadingZeros)
      }

      // If still not found, try removing leading zeros from all stored NIKs
      if (!member) {
        for (const [storedNik, memberData] of membersByNik.entries()) {
          const normalizedStored = normalizeNik(storedNik)
          if (normalizedStored === normalizedNik || storedNik === normalizedNik || normalizedStored === nik) {
            member = memberData
            break
          }
        }
      }

      // If still not found, try querying user_profiles table directly and then find organization_member
      if (!member) {
        try {
          // Try exact match first - check NIK in user_profiles
          // Note: user_profiles.id = auth.users.id = organization_members.user_id
          let userProfileRecord = null
          const { data: profileExact } = await adminClient
            .from("user_profiles")
            .select("id, nik")
            .eq("nik", nik)
            .maybeSingle()

          if (profileExact) {
            userProfileRecord = profileExact
          } else if (normalizedNik !== nik) {
            // Try normalized match
            const { data: profileNormalized } = await adminClient
              .from("user_profiles")
              .select("id, nik")
              .eq("nik", normalizedNik)
              .maybeSingle()

            if (profileNormalized) {
              userProfileRecord = profileNormalized
            }
          }

          if (userProfileRecord) {
            // If we have user profile, try to find org member by user_id (which is profile.id)
            if (userProfileRecord.id) {
              const { data: orgMemberByUserId } = await adminClient
                .from("organization_members")
                .select("id")
                .eq("organization_id", orgId)
                .eq("user_id", userProfileRecord.id)
                .maybeSingle()

              if (orgMemberByUserId) {
                member = { id: orgMemberByUserId.id }
                // Cache it for future lookups
                membersByNik.set(nik, member)
                membersByNik.set(normalizedNik, member)
                if (userProfileRecord.nik) {
                  membersByNik.set(userProfileRecord.nik, member)
                  const normalizedProfileNik = normalizeNik(userProfileRecord.nik)
                  if (normalizedProfileNik !== userProfileRecord.nik) {
                    membersByNik.set(normalizedProfileNik, member)
                  }
                }
              }
            }

            // If not found by user_id, try matching with biodata_nik or employee_id
            if (!member && userProfileRecord.nik) {
              const checkNikValue = userProfileRecord.nik

              // Try to find organization_member with this biodata_nik (exact match)
              let orgMember = null
              const { data: orgMemberExact } = await adminClient
                .from("organization_members")
                .select("id")
                .eq("organization_id", orgId)
                .eq("biodata_nik", checkNikValue)
                .maybeSingle()

              if (orgMemberExact) {
                orgMember = orgMemberExact
              } else {
                // Try with normalized NIK
                const normalizedProfileNik = normalizeNik(checkNikValue)
                if (normalizedProfileNik !== checkNikValue) {
                  const { data: orgMemberNormalized } = await adminClient
                    .from("organization_members")
                    .select("id")
                    .eq("organization_id", orgId)
                    .eq("biodata_nik", normalizedProfileNik)
                    .maybeSingle()

                  if (orgMemberNormalized) {
                    orgMember = orgMemberNormalized
                  }
                }
              }

              if (orgMember) {
                member = { id: orgMember.id }
                // Cache it for future lookups
                membersByNik.set(nik, member)
                membersByNik.set(normalizedNik, member)
                membersByNik.set(userProfileRecord.nik, member)
                const normalizedProfileNik = normalizeNik(checkNikValue)
                if (normalizedProfileNik !== checkNikValue) {
                  membersByNik.set(normalizedProfileNik, member)
                }
              } else {
                // If user_profile exists but no organization_member found with biodata_nik,
                // try to find by employee_id that matches the NIK
                const { data: orgMemberByEmployeeId } = await adminClient
                  .from("organization_members")
                  .select("id")
                  .eq("organization_id", orgId)
                  .eq("employee_id", checkNikValue)
                  .maybeSingle()

                if (orgMemberByEmployeeId) {
                  member = { id: orgMemberByEmployeeId.id }
                  // Cache it for future lookups
                  membersByNik.set(nik, member)
                  membersByNik.set(normalizedNik, member)
                  membersByNik.set(userProfileRecord.nik, member)
                  const normalizedProfileNik = normalizeNik(checkNikValue)
                  if (normalizedProfileNik !== checkNikValue) {
                    membersByNik.set(normalizedProfileNik, member)
                  }
                } else {
                  // Try with normalized NIK as employee_id
                  const normalizedProfileNik = normalizeNik(checkNikValue)
                  if (normalizedProfileNik !== checkNikValue) {
                    const { data: orgMemberByEmployeeIdNormalized } = await adminClient
                      .from("organization_members")
                      .select("id")
                      .eq("organization_id", orgId)
                      .eq("employee_id", normalizedProfileNik)
                      .maybeSingle()

                    if (orgMemberByEmployeeIdNormalized) {
                      member = { id: orgMemberByEmployeeIdNormalized.id }
                      // Cache it for future lookups
                      membersByNik.set(nik, member)
                      membersByNik.set(normalizedNik, member)
                      membersByNik.set(userProfileRecord.nik, member)
                      membersByNik.set(normalizedProfileNik, member)
                    }
                  }
                }

                // If still not found, log for debugging
                if (!member) {
                  console.warn(`[ATTENDANCE IMPORT] User profile with NIK ${checkNikValue} exists but no organization_member found for org ${orgId}`)
                }
              }
            }
          }
        } catch (error) {
          console.error(`[ATTENDANCE IMPORT] Error querying user_profiles for NIK ${nik}:`, error)
        }
      }

      if (!member) {
        failed++
        errors.push({ row: rowNumber, message: `Member with NIK "${nik}" not found` })
        continue
      }

      // Parse times
      let actualCheckIn: string | null = null
      let actualCheckOut: string | null = null

      if (checkInTimeRaw) {
        const checkInDateTime = combineDateTime(attendanceDate, checkInTimeRaw)
        if (checkInDateTime) {
          actualCheckIn = checkInDateTime
        }
      }

      if (checkOutTimeRaw) {
        const checkOutDateTime = combineDateTime(attendanceDate, checkOutTimeRaw)
        if (checkOutDateTime) {
          actualCheckOut = checkOutDateTime
        }
      }

      // Determine status
      let status = "present"
      if (statusRaw) {
        const statusLower = statusRaw.toLowerCase()
        if (["present", "late", "absent", "excused", "leave"].includes(statusLower)) {
          status = statusLower
        }
      } else if (!actualCheckIn) {
        status = "absent"
      }

      // Determine validation_status
      let validationStatus = "pending" // Default value
      if (validationStatusRaw) {
        const validationStatusLower = validationStatusRaw.toLowerCase()
        if (["pending", "approved", "rejected"].includes(validationStatusLower)) {
          validationStatus = validationStatusLower
        }
      }

      // For test mode, just validate
      if (mode === "test") {
        success++
        continue
      }

      // For import mode, collect valid rows
      const payload: any = {
        organization_member_id: member.id,
        attendance_date: attendanceDate,
        status: status,
        validation_status: validationStatus,
      }

      if (actualCheckIn) {
        payload.actual_check_in = actualCheckIn
      }
      if (actualCheckOut) {
        payload.actual_check_out = actualCheckOut
      }
      if (checkInMethodParam) {
        payload.check_in_method = checkInMethodParam
      }

      validRows.push({
        rowNumber,
        payload,
      })
    }

    // Batch processing for import mode
    if (mode === "import" && validRows.length > 0) {
      console.log(`[ATTENDANCE IMPORT] Starting batch processing for ${validRows.length} valid rows`)

      const ATTENDANCE_BATCH_SIZE = 500 // Batch size for optimal performance
      const attendancePayloads = validRows.map((vr) => vr.payload)

      // Process in batches
      for (let i = 0; i < attendancePayloads.length; i += ATTENDANCE_BATCH_SIZE) {
        const batch = attendancePayloads.slice(i, i + ATTENDANCE_BATCH_SIZE)
        const batchRowNumbers = validRows.slice(i, i + ATTENDANCE_BATCH_SIZE).map((vr) => vr.rowNumber)

        console.log(`[ATTENDANCE IMPORT] Processing batch ${Math.floor(i / ATTENDANCE_BATCH_SIZE) + 1} (${batch.length} records)`)

        const { error: batchError } = await adminClient
          .from("attendance_records")
          .upsert(batch, {
            onConflict: "organization_member_id,attendance_date",
          })

        if (batchError) {
          console.error(`[ATTENDANCE IMPORT] Batch upsert error (batch ${Math.floor(i / ATTENDANCE_BATCH_SIZE) + 1}):`, batchError)
          // Fallback: upsert one by one for failed batch
          for (let j = 0; j < batch.length; j++) {
            try {
              const { error: singleError } = await adminClient
                .from("attendance_records")
                .upsert(batch[j], {
                  onConflict: "organization_member_id,attendance_date",
                })

              if (singleError) {
                failed++
                const rowNumber = batchRowNumbers[j]
                if (rowNumber !== undefined) {
                  errors.push({
                    row: rowNumber,
                    message: singleError.message || "Failed to upsert attendance record",
                  })
                }
              } else {
                success++
              }
            } catch (error: any) {
              failed++
              const rowNumber = batchRowNumbers[j]
              if (rowNumber !== undefined) {
                errors.push({
                  row: rowNumber,
                  message: error.message || "Unknown error",
                })
              }
            }
          }
        } else {
          success += batch.length
          console.log(`[ATTENDANCE IMPORT] Successfully upserted batch ${Math.floor(i / ATTENDANCE_BATCH_SIZE) + 1} (${batch.length} records)`)
        }
      }

      console.log(`[ATTENDANCE IMPORT] Completed batch processing: ${success} success, ${failed} failed`)
    }

    return NextResponse.json({
      success: true,
      summary: {
        success,
        failed,
        errors: errors.slice(0, 100), // Limit errors to first 100
      },
    })
  } catch (error: any) {
    console.error("Error processing attendance import:", error)
    return NextResponse.json(
      { success: false, message: error.message || "An error occurred" },
      { status: 500 }
    )
  }
}

