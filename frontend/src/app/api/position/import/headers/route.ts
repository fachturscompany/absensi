import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

/**
 * API Route: POST /api/position/import/headers
 * 
 * Purpose: Read Excel file and extract headers (supports custom header row)
 * 
 * Request Body: FormData with 'file' field
 * Response: { success: boolean, headers: string[], preview: Record<string, any>[] }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const headerRowInput = formData.get('headerRow')
    const headerRowCountInput = formData.get('headerRowCount')
    const requestedSheet = (formData.get('sheetName') || '') as string
    const headerRow = Math.max(1, Number(headerRowInput) || 1)
    const headerRowCount = Math.max(1, Number(headerRowCountInput) || 1)

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/octet-stream', // Sometimes Excel files are sent as this
    ]
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
        { status: 400 }
      )
    }

    // Read Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    
    // Get first sheet
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

    // Convert to JSON (array-of-arrays) so we can pick a specific header row
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { 
      header: 1,   // return array rows so header row is selectable
      defval: '',
      raw: false,  // Convert all values to strings for consistency
    })

    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: 'Excel file is empty or has no data' },
        { status: 400 }
      )
    }

    if (headerRow > rows.length) {
      return NextResponse.json(
        { success: false, message: `Header row ${headerRow} is outside the data range (total rows: ${rows.length})` },
        { status: 400 }
      )
    }

    const headerRows = rows.slice(headerRow - 1, headerRow - 1 + headerRowCount)
    const maxCols = headerRows.reduce((max, row) => Math.max(max, row.length), 0)

    // Build headers, combining multi-row headers if provided.
    // For merged/parent headers, we forward-fill the top row value.
    const headers: string[] = []
    let carryParent = ""
    for (let col = 0; col < maxCols; col++) {
      // Determine parent (top row with forward-fill)
      const topCellRaw = String((headerRows[0]?.[col] ?? "")).trim()
      if (topCellRaw) {
        carryParent = topCellRaw
      }
      const parent = carryParent

      // Use the deepest row value for the child (typically last header row)
      const childRaw = String((headerRows[headerRows.length - 1]?.[col] ?? "")).trim()
      const child = childRaw

      let header = ""
      if (child && parent && child.toLowerCase() === parent.toLowerCase()) {
        header = child // avoid duplicates like "No - No"
      } else if (child && parent) {
        header = `${parent} - ${child}`
      } else if (child) {
        header = child
      } else if (parent) {
        header = parent
      }

      headers.push(header || `__EMPTY_${col}`)
    }
    
    const dataRows = rows.slice(headerRow - 1 + headerRowCount) // rows after header rows
    
    // Get preview (first 5 rows for user to see)
    const preview = dataRows.slice(0, 5).map(row => {
      const previewRow: Record<string, string> = {}
      headers.forEach(header => {
        // @ts-ignore row is an array, use index based on header position
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


