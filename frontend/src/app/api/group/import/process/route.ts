import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"

interface ColumnMapping {
  [databaseField: string]: string | null
}
//tes
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
    // Parameters kept for backward compatibility but not used
    const _trackHistory = formData.get("trackHistory") === "true"
    const _allowMatchingWithSubfields = formData.get("allowMatchingWithSubfields") === "true"
    void _trackHistory
    void _allowMatchingWithSubfields

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

    // Minimal required field untuk group: name atau code
    if (!mapping.name && !mapping.code) {
      return NextResponse.json(
        { success: false, message: "Name or Code mapping is required (at least one)" },
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

    // Helper function to parse is_active
    const parseIsActive = (value: string): boolean => {
      if (!value) return true // Default to true
      const lower = value.toLowerCase().trim()
      if (lower === "true" || lower === "yes" || lower === "1" || lower === "aktif" || lower === "active") {
        return true
      }
      if (lower === "false" || lower === "no" || lower === "0" || lower === "nonaktif" || lower === "inactive") {
        return false
      }
      return true // Default to true if unclear
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

    // Fetch existing groups for duplicate checking
    const { data: existingGroups } = await adminClient
      .from("departments")
      .select("id, code, name, organization_id")
      .eq("organization_id", orgId)

    // Helper to check for duplicates and generate unique code if needed
    const generateUniqueCode = (code: string | null, name: string, existingCodes: Set<string>, batchCodes: Set<string>): string => {
      // If code is provided and unique, use it
      if (code && !existingCodes.has(code.toLowerCase()) && !batchCodes.has(code.toLowerCase())) {
        return code
      }
      
      // Generate code from name if code is empty or duplicate
      let baseCode = code || name
      if (!baseCode) {
        baseCode = `GROUP_${Date.now()}`
      }
      
      // Convert to uppercase, replace spaces with underscore, remove special chars
      const finalCode = baseCode
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '_')
        .replace(/[^A-Z0-9_]/g, '')
        .substring(0, 50) // Limit length
      
      // Ensure uniqueness
      let uniqueCode = finalCode
      let suffix = 1
      while (existingCodes.has(uniqueCode.toLowerCase()) || batchCodes.has(uniqueCode.toLowerCase())) {
        uniqueCode = `${finalCode}_${suffix}`
        suffix++
        if (suffix > 1000) break // Safety limit
      }
      
      return uniqueCode
    }
    
    // Helper to check for duplicate names (name must be unique)
    const isDuplicateName = (name: string): boolean => {
      if (!existingGroups || existingGroups.length === 0) return false
      return existingGroups.some((group: any) => {
        return group.name && group.name.toLowerCase() === name.toLowerCase()
      })
    }

    if (mode === "import") {
      // BATCH MODE: Collect all valid rows first
      interface ValidRowData {
        rowNumber: number
        code: string | null
        name: string
        description: string | null
        isActive: boolean
      }

      const validRows: ValidRowData[] = []

      // Validate and collect all valid rows
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const rowNumber = headerRow + headerRowCount + i

        if (!row) {
          failed++
          errors.push({ row: rowNumber, message: "Empty row" })
          continue
        }

        const code = getMappedValue(row, "code") || null
        const name = getMappedValue(row, "name")
        const description = getMappedValue(row, "description") || null
        const isActiveValue = getMappedValue(row, "is_active")
        const isActive = parseIsActive(isActiveValue)
        void description; void isActive // Suppress unused warning for test mode

        // Validation: at least name or code must be present
        if (!name && !code) {
          failed++
          errors.push({ row: rowNumber, message: "Name or Code is required (at least one)" })
          continue
        }

        // Check for duplicate names (name must be unique)
        if (isDuplicateName(name)) {
          failed++
          errors.push({
            row: rowNumber,
            message: `Duplicate group name: "${name}" already exists`,
          })
          continue
        }

        // Auto-generate unique code (even if code is provided but duplicate)
        const existingCodes = new Set(
          (existingGroups || []).map((g: any) => g.code?.toLowerCase()).filter(Boolean)
        )
        const batchCodes = new Set(
          validRows.map(vr => vr.code?.toLowerCase()).filter((code): code is string => !!code)
        )
        
        const finalCode = generateUniqueCode(code, name, existingCodes, batchCodes)
        
        // Add to batch codes for next iterations
        batchCodes.add(finalCode.toLowerCase())

        validRows.push({
          rowNumber,
          code: finalCode, // Use generated unique code
          name: name || code || "",
          description,
          isActive,
        })
      }

      console.log(`[GROUP IMPORT] Validated ${validRows.length} rows, ${failed} failed validation`)

      // Batch insert all valid groups
      if (validRows.length > 0) {
        const groupsToInsert = validRows.map((vr) => ({
          code: vr.code || vr.name, // Ensure code is never null
          name: vr.name,
          description: vr.description,
          is_active: vr.isActive,
          organization_id: orgId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

        const { data: insertedGroups, error: insertError } = await adminClient
          .from("departments")
          .insert(groupsToInsert)
          .select()

        if (insertError) {
          console.error("[GROUP IMPORT] Batch insert error:", insertError)
          // If batch insert fails, try inserting one by one to get better error messages
          for (const vr of validRows) {
            try {
              const { error: singleInsertError } = await adminClient.from("departments").insert({
                code: vr.code || vr.name, // Ensure code is never null
                name: vr.name,
                description: vr.description,
                is_active: vr.isActive,
                organization_id: orgId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })

              if (singleInsertError) {
                failed++
                errors.push({
                  row: vr.rowNumber,
                  message: singleInsertError.message || "Failed to insert group",
                })
              } else {
                success++
              }
            } catch (error: any) {
              failed++
              errors.push({
                row: vr.rowNumber,
                message: error.message || "Unexpected error",
              })
            }
          }
        } else {
          success = insertedGroups?.length || 0
          console.log(`[GROUP IMPORT] Successfully inserted ${success} groups`)
        }
      }
    } else {
      // TEST MODE: Only validate without inserting
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const rowNumber = headerRow + headerRowCount + i

        if (!row) {
          failed++
          errors.push({ row: rowNumber, message: "Empty row" })
          continue
        }

        const code = getMappedValue(row, "code") || null
        const name = getMappedValue(row, "name")
        const description = getMappedValue(row, "description") || null
        const isActiveValue = getMappedValue(row, "is_active")
        const isActive = parseIsActive(isActiveValue)
        void description; void isActive // Suppress unused warning for test mode

        // Validation: at least name or code must be present
        if (!name && !code) {
          failed++
          errors.push({ row: rowNumber, message: "Name or Code is required (at least one)" })
          continue
        }

        // Check for duplicate names (name must be unique)
        if (isDuplicateName(name)) {
          failed++
          errors.push({
            row: rowNumber,
            message: `Duplicate group name: "${name}" already exists`,
          })
          continue
        }
        
        // Note: Code will be auto-generated if duplicate, so we don't fail here

        success++
      }
    }

    const response: any = {
      success: true,
      summary: {
        success,
        failed,
        errors,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[GROUP IMPORT] Unexpected error:", error)
    return NextResponse.json(
      { success: false, message: "Unexpected error processing import" },
      { status: 500 }
    )
  }
}


