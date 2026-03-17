import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

/**
 * Auto-detect header row for attendance import
 */
function autoDetectHeaderRow(
  rows: (string | number)[][],
  expectedFields: Array<{ key: string; label: string; required?: boolean }>,
  maxSearchRows: number = 20
): { headerRow: number; headerRowCount: number } | null {
  // Search patterns for common field names (case-insensitive, exact or close match)
  // Using more specific patterns to avoid false matches
  // Note: Headers are usually short text labels, not full descriptions
  const searchPatterns: Record<string, string[]> = {
    nik: ['nik', 'nipd', 'nomor induk'],
    attendance_date: ['tanggal', 'date', 'tgl', 'tanggal kehadiran', 'hari'],
    check_in_time: ['check in', 'masuk', 'jam masuk', 'checkin', 'waktu check in', 'waktu masuk'],
    check_out_time: ['check out', 'pulang', 'jam pulang', 'checkout', 'waktu check out', 'waktu pulang'],
    status: ['status', 'kehadiran', 'keadaan'],
    validation_status: ['validation status', 'status validasi', 'validasi', 'validation'],
  }

  // Words that should NOT be considered as headers (common document titles)
  const excludeWords = [
    'daftar', 'list', 'tabel', 'table', 'laporan', 'report',
    'peserta', 'didik', 'siswa', 'student', 'murid',
    'tanggal unduh', 'download', 'unduh', 'pengunduh',
    'kecamatan', 'kabupaten', 'provinsi', 'kota',
    'smk', 'sma', 'smp', 'sd', 'sekolah', 'school'
  ]

  // Score each row based on how many expected fields it matches
  // Also check for multi-row headers (parent-child structure)
  let bestRow = 0
  let bestRowCount = 1
  let bestScore = 0

  for (let rowIdx = 0; rowIdx < Math.min(rows.length, maxSearchRows); rowIdx++) {
    const row = rows[rowIdx]
    if (!row || row.length === 0) continue

    let score = 0
    let matchCount = 0
    const rowValues = row.map((cell) => String(cell || '').toLowerCase().trim())
    
    // Skip rows that contain exclude words (likely document headers, not data headers)
    const rowText = rowValues.join(' ')
    const hasExcludeWords = excludeWords.some(word => rowText.includes(word))
    if (hasExcludeWords && rowIdx < 5) { // Only exclude in first 5 rows
      continue
    }

    // Check each expected field
    for (const field of expectedFields) {
      const patterns = searchPatterns[field.key] || [field.label.toLowerCase()]
      
      for (const pattern of patterns) {
        const found = rowValues.some((cell) => {
          if (!cell || cell.length === 0) return false
          const cellLower = cell.toLowerCase().trim()
          
          // Headers are usually short (2-30 chars), not long text
          if (cellLower.length > 30) return false
          
          // Skip if cell looks like data (numbers, dates, times, etc.)
          if (/^\d{10,}$/.test(cell)) return false // NIK-like numbers
          if (/^\d{4}-\d{2}-\d{2}$/.test(cell) || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cell)) return false // Dates
          if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(cell)) return false // Times
          if (['present', 'late', 'absent', 'excused', 'leave', 'approved', 'pending', 'rejected'].includes(cellLower)) return false // Status values
          
          // Exact match gets highest score (most reliable)
          if (cellLower === pattern) return true
          
          // For single-word patterns, check exact match or word boundary
          const patternWords = pattern.split(/\s+/)
          if (patternWords.length === 1) {
            // Exact match or word boundary match
            const regex = new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$|\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
            if (regex.test(cellLower)) return true
          }
          
          // For multi-word patterns, check if all words are present as whole words
          if (patternWords.length > 1) {
            // All words must be present (as whole words)
            const allWordsPresent = patternWords.every(word => {
              if (word.length < 2) return true // Skip very short words
              const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
              return regex.test(cellLower)
            })
            if (allWordsPresent) return true
          }
          
          return false
        })
        
        if (found) {
          matchCount++
          score += field.required ? 3 : 1 // Required fields get higher weight
          break
        }
      }
    }

    // Bonus score if row has multiple column-like values (likely a header row)
    const nonEmptyCells = rowValues.filter(c => c && c.length > 0 && c.length < 50).length
    if (nonEmptyCells >= 3) {
      score += 1 // Bonus for having multiple columns
    }

    // IMPORTANT: Header rows should contain text labels, not data values
    // Check if row looks like header (short text labels) vs data (long text, numbers, dates)
    const looksLikeHeader = rowValues.some(cell => {
      if (!cell || cell.length === 0) return false
      // Headers are usually short text (2-30 chars), not long names or numbers
      const cellStr = String(cell)
      // Check if cell looks like a header label (short, mostly letters)
      const isShortText = cellStr.length >= 2 && cellStr.length <= 30
      const hasMostlyLetters = /^[a-zA-Z\s]+$/.test(cellStr.replace(/[^a-zA-Z\s]/g, ''))
      const isCommonHeaderWord = /^(no|nama|nik|nipd|tanggal|date|tgl|check|in|out|masuk|pulang|status|validasi|kehadiran)$/i.test(cellStr.trim())
      
      return isShortText && (hasMostlyLetters || isCommonHeaderWord)
    })
    
    // Penalize rows that look like data (long text, numbers, dates) instead of headers
    const looksLikeData = rowValues.some(cell => {
      if (!cell || cell.length === 0) return false
      const cellStr = String(cell)
      // Data rows often have: long names (>30 chars), dates (YYYY-MM-DD), long numbers
      return cellStr.length > 30 || 
             /^\d{4}-\d{2}-\d{2}/.test(cellStr) || // Date format
             /^\d{10,}$/.test(cellStr) // Long number (like NIK)
    })
    
    if (looksLikeData && !looksLikeHeader) {
      score -= 5 // Heavy penalty for rows that look like data
    }
    
    if (looksLikeHeader) {
      score += 2 // Bonus for rows that look like headers
    }

    // Check if this row might be a child header with a parent row above
    // Parent headers are usually longer text that spans multiple columns (like "Data Kehadiran")
    let hasParentRow = false
    let parentRowIdx = -1
    
    if (rowIdx > 0 && score >= 2) {
      // Check previous rows for parent header (up to 3 rows above)
      for (let parentCheckIdx = rowIdx - 1; parentCheckIdx >= Math.max(0, rowIdx - 3); parentCheckIdx--) {
        const parentRow = rows[parentCheckIdx]
        if (!parentRow || parentRow.length === 0) continue
        
        const parentRowValues = parentRow.map((cell) => String(cell || '').trim())
        const parentRowValuesLower = parentRowValues.map(c => c.toLowerCase())
        const parentRowText = parentRowValuesLower.join(' ')
        
        // Skip if parent row has exclude words (but be less strict)
        const hasExcludeWords = excludeWords.some(word => {
          // Only exclude if it's clearly a document title, not a data category
          return parentRowText.includes(word) && (word === 'daftar' || word === 'list' || word === 'tabel')
        })
        if (hasExcludeWords && parentCheckIdx < 2) continue // Only exclude in first 2 rows
        
        // Check for descriptive parent header text (like "Data Kehadiran", "Informasi Kehadiran", etc.)
        // This is the most reliable indicator
        const parentHasDescriptiveText = parentRowValuesLower.some(c => {
          if (!c || c.length < 4) return false
          // Check for common parent header patterns - be more flexible
          return c.includes('data kehadiran') ||
                 c.includes('data attendance') ||
                 c.includes('informasi kehadiran') ||
                 c.includes('detail kehadiran') ||
                 c.includes('rincian kehadiran') ||
                 /^data\s+(kehadiran|attendance|absensi)/i.test(c) ||
                 /^(data|informasi|detail|rincian)\s+(kehadiran|attendance|absensi)/i.test(c)
        })
        
        // Check if parent row has merged/spanned headers
        // In Excel, merged cells only store value in first cell, others are empty
        const parentNonEmpty = parentRowValues.filter(c => c && c.length > 0)
        const parentHasMergedCells = parentNonEmpty.length > 0 && parentNonEmpty.length < parentRow.length * 0.8 // Less than 80% cells filled
        
        // Check if parent row has text that looks like category headers (not column names)
        const parentHasCategoryText = parentRowValuesLower.some(c => {
          if (!c || c.length < 4) return false
          // Category headers are usually longer phrases, not single words
          return c.length >= 4 && c.length < 50 && 
                 (c.includes('data') || c.includes('informasi') || c.includes('detail') || c.includes('rincian'))
        })
        
        // Check if current row (child) has actual column names that match expected fields
        const childHasColumnNames = rowValues.some(cell => {
          if (!cell || cell.length === 0) return false
          const cellLower = cell.toLowerCase()
          // Check if it matches common column names - be more flexible
          return /^(nik|nipd|tanggal|date|tgl|check|in|out|masuk|pulang|status|validasi|kehadiran|waktu)$/i.test(cellLower) ||
                 /^(waktu\s+(check|masuk|pulang)|tanggal\s+kehadiran|status\s+validasi|check\s+in|check\s+out)$/i.test(cellLower)
        })
        
        // More flexible detection: if parent row has descriptive text OR merged cells, and child has column names
        // OR if parent row has category text and child has column names
        if (childHasColumnNames && (parentHasDescriptiveText || (parentHasMergedCells && parentHasCategoryText))) {
          hasParentRow = true
          parentRowIdx = parentCheckIdx
          score += 8 // Higher bonus for detecting multi-row header structure
          console.log(`[AUTO-DETECT] Found potential parent row at ${parentRowIdx + 1} for child row ${rowIdx + 1}`)
          console.log(`[AUTO-DETECT] Parent row content:`, parentRowValues.filter(c => c && c.length > 0).slice(0, 10))
          console.log(`[AUTO-DETECT] Child row content:`, rowValues.filter(c => c && c.length > 0).slice(0, 10))
          break
        }
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestRow = rowIdx
      // If parent row found, use both rows as header
      if (hasParentRow && parentRowIdx >= 0) {
        bestRowCount = rowIdx - parentRowIdx + 1
        bestRow = parentRowIdx // Start from parent row
      } else {
        bestRowCount = 1
      }
    }
  }

  // Only return if we found a reasonable match (at least 2 matches, with score >= 3)
  // This ensures we match at least 1 required field or 2+ optional fields
  // Note: bestRow can be 0 (first row) if parent header is at row 0
  if (bestScore >= 3 && bestRow >= 0) {
    console.log(`[AUTO-DETECT] Found header at row ${bestRow + 1} with ${bestRowCount} row(s), score: ${bestScore}`)
    return {
      headerRow: bestRow + 1, // Convert to 1-based index
      headerRowCount: bestRowCount, // Can be 1 or more for multi-row headers
    }
  }

  // If no header found but first row doesn't look like data, assume it's header
  if (rows.length > 0) {
    const firstRow = rows[0]
    if (firstRow && firstRow.length > 0) {
      const firstRowValues = firstRow.map((cell) => String(cell || '').trim())
      const looksLikeData = firstRowValues.some((cell) => {
        const cellStr = String(cell || '').trim()
        // Check if cell looks like data
        if (/^\d{10,}$/.test(cellStr)) return true // NIK-like numbers
        if (/^\d{4}-\d{2}-\d{2}$/.test(cellStr) || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cellStr)) return true // Dates
        if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(cellStr)) return true // Times
        if (['present', 'late', 'absent', 'excused', 'leave', 'approved', 'pending', 'rejected'].includes(cellStr.toLowerCase())) return true // Status values
        return false
      })
      
      // If first row doesn't look like data, assume it's header
      if (!looksLikeData) {
        console.log(`[AUTO-DETECT] Fallback: Assuming first row is header`)
        return {
          headerRow: 1,
          headerRowCount: 1,
        }
      }
    }
  }

  console.log(`[AUTO-DETECT] No suitable header found. Best score: ${bestScore} at row ${bestRow + 1}`)
  return null
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const headerRowInput = formData.get('headerRow')
    const headerRowCountInput = formData.get('headerRowCount')
    const requestedSheet = (formData.get('sheetName') || '') as string

    const expectedFields = [
      { key: 'nik', label: 'NIK', required: true },
      { key: 'attendance_date', label: 'Tanggal Kehadiran', required: true },
      { key: 'check_in_time', label: 'Waktu Check In', required: false },
      { key: 'check_out_time', label: 'Waktu Check Out', required: false },
      { key: 'status', label: 'Status', required: false },
      { key: 'validation_status', label: 'Validation Status', required: false },
    ]

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
      'text/csv',
    ]

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Please upload an Excel or CSV file' },
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

    const rowsFormatted = XLSX.utils.sheet_to_json<any[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
    })

    const rows = rowsFormatted.map(row =>
      (row || []).map((cell: any) => {
        if (cell === null || cell === undefined || cell === '') return ''
        return String(cell).trim()
      })
    ) as (string | number)[][]

    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: 'Excel file is empty or has no data' },
        { status: 400 }
      )
    }

    if (headerRow === 0) {
      const detected = autoDetectHeaderRow(rows, expectedFields)
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
    for (let col = 0; col < maxCols; col++) {
      const topCellStr = String((headerRows[0]?.[col] ?? "")).trim()
      const childCellStr = String((headerRows[headerRows.length - 1]?.[col] ?? "")).trim()

      let header = ""
      if (childCellStr && topCellStr && childCellStr.toLowerCase() !== topCellStr.toLowerCase()) {
        header = `${topCellStr} - ${childCellStr}`
      } else if (childCellStr) {
        header = childCellStr
      } else if (topCellStr) {
        header = topCellStr
      }

      headers.push(header || `__EMPTY_${col}`)
    }

    // Helper function to convert scientific notation to integer string (for NIK)
    const convertScientificToIntegerString = (value: string | number): string => {
      if (typeof value === "number") {
        if (Number.isInteger(value)) {
          return String(value)
        }
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

    const dataRowsRaw = rows.slice(headerRow - 1 + headerRowCount)
    const preview = dataRowsRaw.slice(0, 10).map((rowArr) => {
      const obj: Record<string, string> = {}
      headers.forEach((header, idx) => {
        const rawValue = (rowArr as any)?.[idx]
        let value = String(rawValue ?? "").trim()
        
        // Special handling for NIK column: convert scientific notation to integer string
        if (header.toLowerCase().includes("nik") || header.toLowerCase() === "nik") {
          value = convertScientificToIntegerString(rawValue ?? "")
        }
        
        obj[header] = value
      })
      return obj
    })

    return NextResponse.json({
      success: true,
      headers,
      preview,
      totalRows: dataRowsRaw.length,
      sheetNames,
      sheetName,
      headerRow,
      headerRowCount,
      autoDetected,
    })
  } catch (error: any) {
    console.error('Error reading Excel file:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to read Excel file' },
      { status: 500 }
    )
  }
}

