// Canonical implementation — moved from /api/position/import/process
import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"

interface ColumnMapping {
    [databaseField: string]: string | null
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get("file") as File
        const mappingJson = formData.get("mapping") as string
        const mode = (formData.get("mode") as string) || "import"
        const organizationIdParam = formData.get("organization_id") as string | null
        const headerRowInput = formData.get("headerRow")
        const headerRowCountInput = formData.get("headerRowCount")
        const requestedSheet = (formData.get("sheetName") || "") as string
        const _trackHistory = formData.get("trackHistory") === "true"
        const _allowMatchingWithSubfields = formData.get("allowMatchingWithSubfields") === "true"
        void _trackHistory
        void _allowMatchingWithSubfields

        if (!file) return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 })
        if (!mappingJson) return NextResponse.json({ success: false, message: "No mapping provided" }, { status: 400 })

        let mapping: ColumnMapping
        try { mapping = JSON.parse(mappingJson) } catch {
            return NextResponse.json({ success: false, message: "Invalid mapping JSON" }, { status: 400 })
        }

        if (!mapping.title && !mapping.code) {
            return NextResponse.json(
                { success: false, message: "Title or Code mapping is required (at least one)" },
                { status: 400 }
            )
        }

        const headerRow = Math.max(1, Number(headerRowInput) || 1)
        const headerRowCount = Math.max(1, Number(headerRowCountInput) || 1)

        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: "array" })
        const sheetNames = workbook.SheetNames || []
        const sheetName = requestedSheet && sheetNames.includes(requestedSheet) ? requestedSheet : sheetNames[0]
        if (!sheetName) return NextResponse.json({ success: false, message: "No sheet found in Excel file" }, { status: 400 })
        const sheet = workbook.Sheets[sheetName]
        if (!sheet) return NextResponse.json({ success: false, message: "Worksheet not found in Excel file" }, { status: 400 })

        const rowsArray = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, defval: "", raw: false })
        if (!rowsArray.length) return NextResponse.json({ success: false, message: "Excel file is empty or has no data" }, { status: 400 })
        if (headerRow > rowsArray.length) return NextResponse.json({ success: false, message: `Header row ${headerRow} is outside the data range` }, { status: 400 })

        const headerRows = rowsArray.slice(headerRow - 1, headerRow - 1 + headerRowCount)
        const maxCols = headerRows.reduce((max, row) => Math.max(max, row.length), 0)

        const headers: string[] = []
        let carryParent = ""
        for (let col = 0; col < maxCols; col++) {
            const topCellRaw = String((headerRows[0]?.[col] ?? "")).trim()
            if (topCellRaw) carryParent = topCellRaw
            const parent = carryParent
            const childRaw = String((headerRows[headerRows.length - 1]?.[col] ?? "")).trim()
            const child = childRaw
            let header = ""
            if (child && parent && child.toLowerCase() === parent.toLowerCase()) header = child
            else if (child && parent) header = `${parent} - ${child}`
            else if (child) header = child
            else if (parent) header = parent
            headers.push(header || `__EMPTY_${col}`)
        }

        const dataRowsRaw = rowsArray.slice(headerRow - 1 + headerRowCount)
        if (!dataRowsRaw.length) return NextResponse.json({ success: false, message: "Excel file has no data rows after header" }, { status: 400 })

        const rows = dataRowsRaw.map((rowArr) => {
            const obj: Record<string, any> = {}
            headers.forEach((header, idx) => { obj[header] = String((rowArr as any)?.[idx] ?? "").trim() })
            return obj
        })

        const supabase = await createClient()
        const adminClient = createAdminClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) return NextResponse.json({ success: false, message: "User not authenticated" }, { status: 401 })

        let orgId: number | null = null
        if (organizationIdParam) {
            orgId = parseInt(organizationIdParam, 10)
            if (isNaN(orgId)) return NextResponse.json({ success: false, message: "Invalid organization_id" }, { status: 400 })
            const { data: member } = await adminClient.from("organization_members").select("organization_id").eq("user_id", user.id).eq("organization_id", orgId).maybeSingle()
            if (!member) return NextResponse.json({ success: false, message: "User is not a member of the specified organization" }, { status: 403 })
        } else {
            const { data: member } = await adminClient.from("organization_members").select("organization_id").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle()
            if (!member || !member.organization_id) return NextResponse.json({ success: false, message: "User not member of any organization" }, { status: 403 })
            orgId = typeof member.organization_id === "string" ? parseInt(member.organization_id, 10) : member.organization_id
        }

        const parseIsActive = (value: string): boolean => {
            if (!value) return true
            const lower = value.toLowerCase().trim()
            if (lower === "true" || lower === "yes" || lower === "1" || lower === "aktif" || lower === "active") return true
            if (lower === "false" || lower === "no" || lower === "0" || lower === "nonaktif" || lower === "inactive") return false
            return true
        }
        const parseLevel = (value: string): number | null => { if (!value) return null; const p = parseInt(value, 10); return isNaN(p) ? null : p }
        const getMappedValue = (row: Record<string, any>, dbField: string): string => {
            const excelColumn = mapping[dbField]
            if (!excelColumn) return ""
            const rawValue = row[excelColumn]
            if (rawValue === null || rawValue === undefined) return ""
            return String(rawValue).trim()
        }

        let success = 0, failed = 0
        const errors: Array<{ row: number; message: string }> = []

        const { data: existingPositions } = await adminClient.from("positions").select("id, code, title, organization_id").eq("organization_id", orgId)
        const isDuplicate = (code: string | null, title: string): boolean => {
            if (!existingPositions || existingPositions.length === 0) return false
            return existingPositions.some((position: any) => {
                if (code && position.code && position.code.toLowerCase() === code.toLowerCase()) return true
                if (position.title && position.title.toLowerCase() === title.toLowerCase()) return true
                return false
            })
        }

        if (mode === "import") {
            interface ValidRowData { rowNumber: number; code: string | null; title: string; description: string | null; level: number | null; isActive: boolean }
            const validRows: ValidRowData[] = []

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i]; const rowNumber = headerRow + headerRowCount + i
                if (!row) { failed++; errors.push({ row: rowNumber, message: "Empty row" }); continue }
                const code = getMappedValue(row, "code") || null
                const title = getMappedValue(row, "title")
                const description = getMappedValue(row, "description") || null
                const level = parseLevel(getMappedValue(row, "level"))
                const isActive = parseIsActive(getMappedValue(row, "is_active"))
                void description; void level; void isActive
                if (!title && !code) { failed++; errors.push({ row: rowNumber, message: "Title or Code is required" }); continue }
                const finalTitle = title || code || ""
                const finalCode = code || null
                if (isDuplicate(finalCode, finalTitle)) { failed++; errors.push({ row: rowNumber, message: `Duplicate: ${finalCode ? `Code "${finalCode}"` : ""} ${finalTitle ? `Title "${finalTitle}"` : ""} already exists` }); continue }
                validRows.push({ rowNumber, code: finalCode, title: finalTitle, description, level, isActive })
            }

            if (validRows.length > 0) {
                const toInsert = validRows.map((vr) => ({
                    code: vr.code, title: vr.title, description: vr.description, level: vr.level,
                    is_active: vr.isActive, organization_id: orgId,
                    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
                }))
                const { data: inserted, error: insertError } = await adminClient.from("positions").insert(toInsert).select()
                if (insertError) {
                    for (const vr of validRows) {
                        const { error: sErr } = await adminClient.from("positions").insert({
                            code: vr.code, title: vr.title, description: vr.description, level: vr.level,
                            is_active: vr.isActive, organization_id: orgId,
                            created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
                        })
                        if (sErr) { failed++; errors.push({ row: vr.rowNumber, message: sErr.message }) } else { success++ }
                    }
                } else {
                    success = inserted?.length || 0
                }
            }
        } else {
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i]; const rowNumber = headerRow + headerRowCount + i
                if (!row) { failed++; errors.push({ row: rowNumber, message: "Empty row" }); continue }
                const code = getMappedValue(row, "code") || null
                const title = getMappedValue(row, "title")
                if (!title && !code) { failed++; errors.push({ row: rowNumber, message: "Title or Code is required" }); continue }
                const finalTitle = title || code || ""; const finalCode = code || null
                if (isDuplicate(finalCode, finalTitle)) { failed++; errors.push({ row: rowNumber, message: `Duplicate position` }); continue }
                success++
            }
        }

        return NextResponse.json({ success: true, summary: { success, failed, errors } })
    } catch (error) {
        console.error("[POSITION IMPORT] Unexpected error:", error)
        return NextResponse.json({ success: false, message: "Unexpected error processing import" }, { status: 500 })
    }
}
