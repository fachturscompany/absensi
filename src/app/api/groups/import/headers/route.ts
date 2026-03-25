import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

/**
 * Auto-detect header row by finding row that contains "name" or "nama" column
 */
function autoDetectHeaderRow(
    rows: (string | number)[][],
    maxSearchRows: number = 20
): { headerRow: number; headerRowCount: number } | null {
    const namePatterns = ['name', 'nama']

    for (let rowIdx = 0; rowIdx < Math.min(rows.length, maxSearchRows); rowIdx++) {
        const row = rows[rowIdx]
        if (!row || row.length === 0) continue

        const rowValues = row.map((cell) => String(cell || '').toLowerCase().trim())

        const hasNameColumn = namePatterns.some(pattern => {
            return rowValues.some(cell => {
                if (!cell || cell.length === 0) return false
                const cellLower = cell.toLowerCase().trim()
                return cellLower === pattern ||
                    new RegExp(`\\b${pattern}\\b`, 'i').test(cellLower)
            })
        })

        if (hasNameColumn) {
            console.log(`[AUTO-DETECT] Found header at row ${rowIdx + 1}`)
            return { headerRow: rowIdx + 1, headerRowCount: 1 }
        }
    }

    console.log(`[AUTO-DETECT] No header row found, will fallback to row 1`)
    return null
}

/**
 * POST /api/groups/import/headers
 * Read Excel file and extract headers (supports custom header row and auto-detect)
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const headerRowInput = formData.get('headerRow')
        const headerRowCountInput = formData.get('headerRowCount')
        const requestedSheet = (formData.get('sheetName') || '') as string

        let headerRow = Number(headerRowInput) || 0
        let headerRowCount = Math.max(1, Number(headerRowCountInput) || 1)
        let autoDetected = false

        if (!file) {
            return NextResponse.json(
                { success: false, message: 'No file provided' },
                { status: 400 }
            )
        }

        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/octet-stream',
        ]

        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
            return NextResponse.json(
                { success: false, message: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
                { status: 400 }
            )
        }

        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })

        const sheetNames = workbook.SheetNames || []
        const sheetName = requestedSheet && sheetNames.includes(requestedSheet)
            ? requestedSheet
            : sheetNames[0]
        if (!sheetName) {
            return NextResponse.json(
                { success: false, message: 'No sheet found in Excel file' },
                { status: 400 }
            )
        }

        const sheet = workbook.Sheets[sheetName]
        if (!sheet) {
            return NextResponse.json(
                { success: false, message: 'Cannot find a valid sheet in Excel file' },
                { status: 400 }
            )
        }

        const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
            header: 1,
            defval: '',
            raw: false,
        })

        if (!rows.length) {
            return NextResponse.json(
                { success: false, message: 'Excel file is empty or has no data' },
                { status: 400 }
            )
        }

        if (headerRow === 0) {
            const detected = autoDetectHeaderRow(rows)
            if (detected) {
                headerRow = detected.headerRow
                headerRowCount = detected.headerRowCount
                autoDetected = true
            } else {
                headerRow = 1
                headerRowCount = 1
            }
        }

        if (headerRow > rows.length) {
            return NextResponse.json(
                { success: false, message: `Header row ${headerRow} is outside the data range (total rows: ${rows.length})` },
                { status: 400 }
            )
        }

        const headerRows = rows.slice(headerRow - 1, headerRow - 1 + headerRowCount)
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

        const dataRows = rows.slice(headerRow - 1 + headerRowCount)

        if (dataRows.length === 0) {
            return NextResponse.json(
                { success: false, message: `Sheet "${sheetName}" tidak memiliki data. Pastikan ada data setelah header row.` },
                { status: 400 }
            )
        }

        const nonEmptyHeaders = headers.filter(h => h && !h.startsWith('__EMPTY_'))
        if (nonEmptyHeaders.length === 0) {
            return NextResponse.json(
                { success: false, message: `Sheet "${sheetName}" tidak memiliki kolom header yang valid.` },
                { status: 400 }
            )
        }

        const preview = dataRows.slice(0, 5).map(row => {
            const previewRow: Record<string, string> = {}
            headers.forEach(header => {
                const cellIndex = headers.indexOf(header)
                previewRow[header] = String((row as any)?.[cellIndex] || '').trim()
            })
            return previewRow
        })

        return NextResponse.json({
            success: true,
            headers,
            preview,
            totalRows: dataRows.length,
            sheetName,
            sheetNames,
            headerRow,
            headerRowCount,
            autoDetected,
        })
    } catch (error) {
        console.error('Error reading Excel headers:', error)
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to read Excel file'
            },
            { status: 500 }
        )
    }
}
