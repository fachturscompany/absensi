import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

/**
 * Auto-detect header row by finding row that contains columns matching the expected field names
 * @param rows Array of rows from Excel
 * @param expectedFields Array of expected field labels to search for
 * @param maxSearchRows Maximum number of rows to search (default: 20)
 * @returns Object with detected headerRow and headerRowCount, or null if not found
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
    nik: ['nik'],
    nama: ['nama', 'name'],
    email: ['email', 'surel'],
    jenis_kelamin: ['jk', 'jenis kelamin', 'gender', 'kelamin'],
    tanggal_lahir: ['tanggal lahir', 'tgl lahir', 'ttl', 'dob'],
    tempat_lahir: ['tempat lahir', 'tempat', 'tmp lahir'],
    nisn: ['nisn'],
    agama: ['agama'],
    no_telepon: ['telepon', 'no telepon', 'phone', 'hp', 'telp'],
    department_id: ['department', 'departemen', 'group', 'kelompok', 'jurusan'],
    nipd: ['nipd'], // Added for school data
    no: ['no', 'nomor'], // Added for row number column
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
      const isCommonHeaderWord = /^(no|nama|nik|nipd|jk|nisn|tempat|tanggal|agama|alamat|telepon|email|department|group|kelamin|lahir)$/i.test(cellStr.trim())
      
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
    // Parent headers are usually longer text that spans multiple columns (like "Data Ayah")
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
        
        // Check for descriptive parent header text (like "Data Ayah", "Data Ibu", etc.)
        // This is the most reliable indicator
        const parentHasDescriptiveText = parentRowValuesLower.some(c => {
          if (!c || c.length < 4) return false
          // Check for common parent header patterns - be more flexible
          return c.includes('data ayah') ||
                 c.includes('data ibu') ||
                 c.includes('data wali') ||
                 c.includes('data ortu') ||
                 c.includes('data orang tua') ||
                 c.includes('data siswa') ||
                 c.includes('data peserta') ||
                 /^data\s+(ayah|ibu|wali|ortu|orang tua|siswa|peserta)/i.test(c) ||
                 /^(data|informasi|detail|rincian)\s+(ayah|ibu|wali|ortu|siswa|peserta)/i.test(c)
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
          return /^(nama|name|nik|nipd|nisn|jk|jenis\s+kelamin|tempat|tanggal|tahun|agama|alamat|telepon|email|pekerjaan|penghasilan|pendidikan|jenjang)/i.test(cellLower) ||
                 /^(tahun\s+lahir|jenjang\s+pendidikan|tempat\s+lahir|tanggal\s+lahir)$/i.test(cellLower)
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

  console.log(`[AUTO-DETECT] No suitable header found. Best score: ${bestScore} at row ${bestRow + 1}`)
  return null
}

/**
 * API Route: GET /api/members/import/headers
 * 
 * Purpose: Read Excel file and extract headers (supports custom header row and auto-detect)
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
    
    // Expected fields for members import (for auto-detect)
    const expectedFields = [
      { key: 'nik', label: 'NIK', required: true },
      { key: 'nama', label: 'Nama Lengkap', required: true },
      { key: 'nipd', label: 'NIPD', required: false }, // Added for school data
      { key: 'email', label: 'Email', required: false },
      { key: 'jenis_kelamin', label: 'Jenis Kelamin', required: false },
      { key: 'tanggal_lahir', label: 'Tanggal Lahir', required: false },
      { key: 'tempat_lahir', label: 'Tempat Lahir', required: false },
      { key: 'nisn', label: 'NISN', required: false },
      { key: 'no_telepon', label: 'No Telepon', required: false },
      { key: 'department_id', label: 'Department/Group', required: false },
    ]
    
    // Parse headerRow - if 0 or not provided, use auto-detect
    let headerRow = Number(headerRowInput) || 0
    let headerRowCount = Math.max(1, Number(headerRowCountInput) || 1)
    let autoDetected = false

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
    // Use raw: false to get formatted values (better for headers which might be formatted)
    const rowsFormatted = XLSX.utils.sheet_to_json<any[]>(sheet, { 
      header: 1,   // return array rows so header row is selectable
      defval: '', // Use empty string for empty cells
      raw: false, // Get formatted values (better for headers)
    })
    
    // Also get raw values for data accuracy
    // Use defval: null to preserve null values, but we'll handle empty strings too
    // IMPORTANT: Use blankrows: false to skip completely empty rows, but this might skip rows with some empty cells
    // So we'll use blankrows: true to preserve structure, then filter manually
    const rowsRaw = XLSX.utils.sheet_to_json<any[]>(sheet, { 
      header: 1,
      defval: null, // Use null for empty cells (preserves data structure)
      raw: true,   // Get raw values for data (preserves dates, numbers, etc.)
      blankrows: true, // Include blank rows to preserve row structure
      range: sheet['!ref'] || undefined, // Use full sheet range to ensure all data is read
    })
    
    // Also try reading directly from sheet cells as fallback for sparse data
    const sheetRange = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
    console.log(`[HEADERS] Sheet range: ${sheet['!ref']}, rows: ${sheetRange.e.r + 1}, cols: ${sheetRange.e.c + 1}`)
    
    // Convert formatted rows to string array
    const rows = rowsFormatted.map(row => 
      (row || []).map((cell: any) => {
        if (cell === null || cell === undefined || cell === '') return ''
        // Convert to string, preserving formatted value
        return String(cell).trim()
      })
    ) as (string | number)[][]

    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: 'Excel file is empty or has no data' },
        { status: 400 }
      )
    }

    // Auto-detect header row if not specified (headerRow = 0)
    if (headerRow === 0) {
      const detected = autoDetectHeaderRow(rows, expectedFields)
      if (detected) {
        // Validate that detected row actually has header-like content
        // For multi-row headers, check the child row (last row) which contains actual column names
        const detectedRow = rows[detected.headerRow - 1]
        const childRowIdx = detected.headerRow - 1 + detected.headerRowCount - 1
        const childRow = rows[childRowIdx] // Child row contains actual column names
        
        // Check child row (which has actual column names) for multi-row headers
        // Or check detected row for single-row headers
        const rowToCheck = detected.headerRowCount > 1 ? childRow : detectedRow
        
        let hasHeaderContent = rowToCheck && rowToCheck.some((cell: any) => {
          const cellStr = String(cell || '').trim()
          // Check if cell looks like a header (short text, 2-50 chars, mostly letters/numbers)
          // Be more flexible - headers can contain numbers, dashes, etc.
          if (cellStr.length < 2 || cellStr.length > 50) return false
          // Check if it's mostly text (not a long number or date)
          const textPart = cellStr.replace(/[^a-zA-Z\s]/g, '')
          return textPart.length >= 2 && textPart.length >= cellStr.length * 0.5 // At least 50% letters
        })
        
        if (hasHeaderContent && rowToCheck) {
          // Double-check: make sure row actually has header-like text in most columns
          const headerLikeCount = rowToCheck.filter((cell: any) => {
            const cellStr = String(cell || '').trim()
            if (cellStr.length < 2 || cellStr.length > 50) return false
            // More flexible: headers can contain numbers, dashes, spaces
            // But should not be long numbers, dates, or names
            const textPart = cellStr.replace(/[^a-zA-Z\s]/g, '')
            const isLongNumber = /^\d{10,}$/.test(cellStr) // Long number like NIK
            const isDate = /^\d{4}-\d{2}-\d{2}/.test(cellStr) // Date format
            const isName = /^[A-Z]\.\s+[A-Z]/.test(cellStr) // Name pattern
            return !isLongNumber && !isDate && !isName && 
                   textPart.length >= 2 && textPart.length >= cellStr.length * 0.4 // At least 40% letters
          }).length
          
          // At least 2 columns should look like headers (reduced from 3 for flexibility)
          if (headerLikeCount >= 2) {
            headerRow = detected.headerRow
            headerRowCount = detected.headerRowCount
            autoDetected = true
            console.log(`[AUTO-DETECT] Found header row at row ${headerRow} with ${headerRowCount} row(s), ${headerLikeCount} header-like columns`)
            if (detected.headerRowCount > 1) {
              console.log(`[AUTO-DETECT] Multi-row header: Parent row ${detected.headerRow}, Child row ${childRowIdx + 1}`)
              console.log(`[AUTO-DETECT] Parent row content:`, detectedRow?.slice(0, 10))
              console.log(`[AUTO-DETECT] Child row content:`, childRow?.slice(0, 10))
            } else {
              console.log(`[AUTO-DETECT] Header content:`, detectedRow?.slice(0, 10))
            }
          } else {
            console.log(`[AUTO-DETECT] Detected row ${detected.headerRow} has only ${headerLikeCount} header-like columns, trying fallback`)
            hasHeaderContent = false // Trigger fallback
          }
        }
        
        if (!hasHeaderContent) {
          console.log(`[AUTO-DETECT] Detected row ${detected.headerRow} but it doesn't look like a header, trying fallback`)
          // Try to find a better row by looking for common header words
          for (let i = 0; i < Math.min(rows.length, 10); i++) {
            const row = rows[i]
            const rowText = (row || []).map(c => String(c || '').toLowerCase().trim()).join(' ')
            if (rowText.includes('no') && (rowText.includes('nama') || rowText.includes('name'))) {
              headerRow = i + 1
              headerRowCount = 1
              autoDetected = true
              console.log(`[AUTO-DETECT] Found alternative header row at row ${headerRow} based on common patterns`)
              break
            }
          }
          
          if (headerRow === 0) {
            // Final fallback to row 1
            headerRow = 1
            headerRowCount = 1
            console.log(`[AUTO-DETECT] Using row 1 as final fallback`)
          }
        }
      } else {
        // Fallback to row 1 if auto-detect fails
        headerRow = 1
        headerRowCount = 1
        console.log(`[AUTO-DETECT] Failed to detect header row, using row 1 as fallback`)
      }
    }

    if (headerRow > rows.length) {
      return NextResponse.json(
        { success: false, message: `Header row ${headerRow} is outside the data range (total rows: ${rows.length})` },
        { status: 400 }
      )
    }

    const headerRows = rows.slice(headerRow - 1, headerRow - 1 + headerRowCount)
    const rawHeaderRows = rowsRaw.slice(headerRow - 1, headerRow - 1 + headerRowCount)
    const maxCols = Math.max(
      headerRows.reduce((max, row) => Math.max(max, row.length), 0),
      rawHeaderRows.reduce((max, row) => Math.max(max, (row || []).length), 0)
    )

    console.log(`[HEADERS] Reading header from row ${headerRow}, found ${headerRows.length} header row(s)`)
    console.log(`[HEADERS] Header row content (first 10 cols):`, headerRows[0]?.slice(0, 10))
    console.log(`[HEADERS] Raw header row content (first 10 cols):`, rawHeaderRows[0]?.slice(0, 10))
    console.log(`[HEADERS] Max columns: ${maxCols}`)

    // Build headers, combining multi-row headers if provided.
    // For merged/parent headers, we forward-fill the top row value.
    // Use formatted values (rows) for headers as they're better for text
    const headers: string[] = []
    
    // Pre-process parent row to handle merged cells (forward-fill empty cells)
    // This handles cases where parent header spans multiple columns (like "Data Ayah")
    // In Excel, merged cells only store value in the first cell, others are empty
    const processedParentRow: string[] = []
    let lastParentValue = ""
    
    if (headerRows.length > 1 && headerRows[0]) {
      // Process parent row first to forward-fill merged cells
    for (let col = 0; col < maxCols; col++) {
        const topCellStr = String((headerRows[0]?.[col] ?? "")).trim()
        const rawTopRow = rawHeaderRows[0] || []
        const rawTopCell = rawTopRow[col]
        
        // Get parent value (prioritize formatted, fallback to raw)
        let parentValue = ""
        if (topCellStr && topCellStr.length > 0) {
          parentValue = topCellStr
        } else if (rawTopCell !== undefined && rawTopCell !== null && rawTopCell !== '') {
          parentValue = String(rawTopCell).trim()
        }
        
        // Forward-fill logic for merged cells:
        // - If current cell has value, use it and update lastParentValue
        // - If current cell is empty but previous had value, forward-fill from lastParentValue
        // - Continue forward-fill until we encounter a new non-empty value that's different
        if (parentValue && parentValue.length > 0) {
          // Check if this is a continuation of the same parent (same value) or a new parent
          if (lastParentValue && lastParentValue.length > 0 && parentValue.toLowerCase() === lastParentValue.toLowerCase()) {
            // Same parent, continue forward-fill
            processedParentRow[col] = lastParentValue
          } else {
            // New parent value, update lastParentValue
            lastParentValue = parentValue
            processedParentRow[col] = parentValue
          }
        } else if (lastParentValue && lastParentValue.length > 0) {
          // Forward-fill from previous non-empty parent cell (merged cell continuation)
          // Continue forward-fill until we find a new parent value or reach end
          processedParentRow[col] = lastParentValue
        } else {
          // No parent value yet, leave empty
          processedParentRow[col] = ""
        }
      }
      
      console.log(`[HEADERS] Processed parent row (first 15 cols):`, processedParentRow.slice(0, 15))
      console.log(`[HEADERS] Parent row non-empty values:`, processedParentRow.filter(v => v && v.length > 0))
    }
    
    for (let col = 0; col < maxCols; col++) {
      // Try multiple methods to get header value
      let header = ""
      
      // Method 1: Use formatted values (better for headers - preserves text formatting)
      const topCellStr = String((headerRows[0]?.[col] ?? "")).trim()
      const childCellStr = String((headerRows[headerRows.length - 1]?.[col] ?? "")).trim()
      
      // Method 2: Try from raw rows as fallback
      const rawTopRow = rawHeaderRows[0] || []
      const rawBottomRow = rawHeaderRows[rawHeaderRows.length - 1] || []
      const rawTopCell = rawTopRow[col]
      const rawChildCell = rawBottomRow[col]
      
      // Prioritize formatted values for headers (they preserve text better)
      // Fallback to raw if formatted is empty
      const getCellValue = (formatted: string, raw: any): string => {
        if (formatted && formatted.length > 0) {
          return formatted
        }
        if (raw !== undefined && raw !== null && raw !== '') {
          return String(raw).trim()
        }
        return ''
      }
      
      // Get parent (use processed parent row if available, otherwise use forward-fill logic)
      let parent = ""
      const processedParentValue = processedParentRow[col]
      if (processedParentRow.length > 0 && processedParentValue && processedParentValue.length > 0) {
        parent = processedParentValue
      } else {
        // Fallback: use original logic for single-row headers
        const parentValue = getCellValue(topCellStr, rawTopCell)
        if (parentValue) {
          parent = parentValue
        }
      }

      // Get child (deepest row value - usually the actual column name)
      const child = getCellValue(childCellStr, rawChildCell)

      // Build header from parent and child
      // Priority: child is usually the actual column name (like "Nama", "Tahun Lahir")
      // Parent is usually the category (like "Data Ayah", "Data Ibu")
      if (child && parent) {
        // If child and parent are the same, use child only
        if (child.toLowerCase() === parent.toLowerCase()) {
          header = child
        } else {
          // Always combine parent and child when both exist: "Data Ayah - Nama"
          // This ensures proper identification of columns under parent headers
        header = `${parent} - ${child}`
        }
      } else if (child) {
        // If only child exists, use it
        header = child
      } else if (parent) {
        // If only parent exists, use it
        header = parent
      }

      // Log for debugging multi-row headers (first 10 columns only to avoid spam)
      if (col < 10 && parent && child && parent !== child) {
        console.log(`[HEADERS] Column ${col}: Parent="${parent}", Child="${child}", Combined="${header}"`)
      }

      // If header is still empty, try all available sources in order
      if (!header || header.length === 0) {
        // Priority: raw child > raw parent > string child > string parent
        if (rawChildCell !== undefined && rawChildCell !== null && rawChildCell !== '') {
          header = String(rawChildCell).trim()
        } else if (rawTopCell !== undefined && rawTopCell !== null && rawTopCell !== '') {
          header = String(rawTopCell).trim()
        } else if (childCellStr) {
          header = childCellStr
        } else if (topCellStr) {
          header = topCellStr
        }
      }

      // Clean up header - remove extra whitespace
      if (header) {
        header = header.replace(/\s+/g, ' ').trim()
      }

      // If header is still empty, try to find it in previous rows (might be multi-row header)
      if (!header || header.length === 0) {
        // Search backwards from header row to find column name
        const searchStartRow = Math.max(0, headerRow - 1 - 5) // Search up to 5 rows before
        for (let searchRowIdx = headerRow - 2; searchRowIdx >= searchStartRow; searchRowIdx--) {
          if (searchRowIdx < 0) break
          
          const searchRow = rows[searchRowIdx] // Use formatted values
          const searchRawRow = rowsRaw[searchRowIdx] || []
          const searchCell = searchRow?.[col]
          const searchRawCell = searchRawRow[col]
          
          // Get cell value (prioritize formatted for headers)
          let cellValue = ''
          if (searchCell !== undefined && searchCell !== null && String(searchCell).trim().length > 0) {
            cellValue = String(searchCell).trim()
          } else if (searchRawCell !== undefined && searchRawCell !== null && searchRawCell !== '') {
            cellValue = String(searchRawCell).trim()
          }
          
          // Check if this looks like a header (short text, 2-50 chars, mostly letters/numbers)
          if (cellValue && cellValue.length >= 2 && cellValue.length <= 50) {
            // Skip if it looks like data (long text, dates, long numbers, or common data patterns)
            const looksLikeData = cellValue.length > 30 || 
                                 /^\d{4}-\d{2}-\d{2}/.test(cellValue) || // Date
                                 /^\d{10,}$/.test(cellValue) || // Long number
                                 /^[A-Z]\.\s+[A-Z]/.test(cellValue) || // Name pattern like "A. KHARISH"
                                 /^\d+\/\d+/.test(cellValue) // Pattern like "5132/1194.63"
            if (!looksLikeData) {
              header = cellValue
              console.log(`[HEADERS] Found header for column ${col} in row ${searchRowIdx + 1}: "${header}"`)
              break
            }
          }
        }
      }
      
      // Final check: if header is still empty, it means we couldn't find it anywhere
      // In this case, use __EMPTY_ (don't use generic "Column X" as user wants actual column names)
      if (!header || header.length === 0) {
        header = `__EMPTY_${col}`
        console.log(`[HEADERS] Column ${col} has no header found anywhere, using __EMPTY_${col}`)
      } else {
        // Log all headers, especially email-related ones
        const isEmailHeader = header.toLowerCase().includes('email') || header.toLowerCase().includes('e-mail')
        if (isEmailHeader || col < 15) {
          console.log(`[HEADERS] Column ${col}: "${header}" (length: ${header.length})`)
        }
      }

      headers.push(header)
    }
    
    // Get data rows (after header rows)
    // Use raw values for data accuracy (dates, numbers, etc.)
    const dataStartIdx = headerRow - 1 + headerRowCount
    const dataRowsRaw = rowsRaw.slice(dataStartIdx)
    const dataRowsFormatted = rows.slice(dataStartIdx) // For fallback
    
    console.log(`[HEADERS] Data rows start from index ${dataStartIdx} (after header row ${headerRow} with ${headerRowCount} row(s))`)
    console.log(`[HEADERS] Total data rows: ${dataRowsRaw.length}`)
    if (dataRowsRaw.length > 0) {
      console.log(`[HEADERS] First data row (first 15 columns):`, dataRowsRaw[0]?.slice(0, 15))
      console.log(`[HEADERS] First data row length:`, dataRowsRaw[0]?.length)
      if (dataRowsRaw.length > 1) {
        console.log(`[HEADERS] Second data row (first 15 columns):`, dataRowsRaw[1]?.slice(0, 15))
        console.log(`[HEADERS] Second data row length:`, dataRowsRaw[1]?.length)
      }
      if (dataRowsRaw.length > 2) {
        console.log(`[HEADERS] Third data row (first 15 columns):`, dataRowsRaw[2]?.slice(0, 15))
        console.log(`[HEADERS] Third data row length:`, dataRowsRaw[2]?.length)
      }
    }
    
    // Find email column index for debugging
    const emailColIdx = headers.findIndex(h => h && (h.toLowerCase().includes('email') || h.toLowerCase().includes('e-mail')))
    if (emailColIdx >= 0) {
      console.log(`[HEADERS] Email column found at index ${emailColIdx}: "${headers[emailColIdx]}"`)
      // Check data in email column for limited rows to find where email data appears
      // Try multiple methods to read data (handles sparse arrays)
      // Only check first 20 rows for performance (enough for preview)
      let emailFound = false
      const maxRowsToCheck = Math.min(20, dataRowsRaw.length) // Check up to 20 rows for performance
      console.log(`[HEADERS] Checking email data in first ${maxRowsToCheck} rows...`)
      
      for (let idx = 0; idx < maxRowsToCheck; idx++) {
        const row = dataRowsRaw[idx]
        if (!row) continue
        
        let emailValue: any = undefined
        
        // Method 1: Array access with 'in' check (sparse arrays)
        if (Array.isArray(row)) {
          if (emailColIdx in row) {
            emailValue = row[emailColIdx]
          } else if (emailColIdx < row.length) {
            emailValue = row[emailColIdx]
          }
        }
        // Method 2: Object access
        else if (typeof row === 'object' && row !== null) {
          emailValue = (row as any)[emailColIdx] || (row as any)[String(emailColIdx)]
        }
        
        if (emailValue !== null && emailValue !== undefined && emailValue !== '') {
          const strValue = String(emailValue).trim()
          if (strValue.length > 0 && 
              strValue.toLowerCase() !== 'nan' && 
              strValue.toLowerCase() !== 'null' &&
              strValue.toLowerCase() !== 'undefined') {
            console.log(`[HEADERS] ✓ Email data found at data row ${idx} (Excel row ${dataStartIdx + idx + 1}): "${strValue}" (type: ${typeof emailValue})`)
            emailFound = true
          }
        }
      }
      
      if (!emailFound) {
        console.log(`[HEADERS] WARNING: No email data found in email column at index ${emailColIdx} in first ${maxRowsToCheck} rows!`)
        console.log(`[HEADERS] Total data rows available: ${dataRowsRaw.length}`)
      }
    } else {
      console.log(`[HEADERS] WARNING: Email column not found in headers!`)
    }
    
    // Filter out completely empty columns (no header and no data in any row)
    // Check each column to see if it has any data
    const columnHasData: boolean[] = headers.map((header, colIdx) => {
      // Check if header is not empty (not __EMPTY_)
      const hasHeader = header && !header.startsWith('__EMPTY_')
      
      // If column has valid header, always include it (even if no data in first few rows)
      // This ensures columns like "E-Mail", "SKHUN", "Penerima KPS" are shown even if data appears later
      if (hasHeader) {
        console.log(`[HEADERS] Column ${colIdx} ("${header}") has valid header - will NOT be filtered`)
        return true
      }
      
      // For columns without headers, check if any data row has non-empty value
      // Check ALL rows, not just first few, to catch data that appears later
      const hasData = dataRowsRaw.some((row: any) => {
        if (!row || row.length <= colIdx) return false
        const value = row[colIdx]
        if (value === undefined || value === null) return false
        const strValue = String(value).trim()
        return strValue.length > 0 && 
               strValue.toLowerCase() !== 'nan' && 
               strValue.toLowerCase() !== 'null' &&
               strValue !== '-' &&
               strValue !== 'N/A'
      })
      
      return hasData
    })
    
    // Filter headers and create column mapping (old index -> new index)
    const filteredHeaders: string[] = []
    const columnMapping: number[] = [] // Maps new column index to old column index
    headers.forEach((header, oldIdx) => {
      if (columnHasData[oldIdx]) {
        columnMapping.push(oldIdx)
        filteredHeaders.push(header)
        
        // Log email column mapping for debugging
        const isEmailHeader = header.toLowerCase().includes('email') || header.toLowerCase().includes('e-mail')
        if (isEmailHeader) {
          console.log(`[HEADERS] Email column found: "${header}" at old index ${oldIdx}, new index ${filteredHeaders.length - 1}`)
          // Check first few data rows for this column
          dataRowsRaw.slice(0, 3).forEach((row, rowIdx) => {
            const value = row?.[oldIdx]
            console.log(`[HEADERS] Email column data at row ${rowIdx}: "${value}" (type: ${typeof value})`)
          })
        }
      }
    })
    
    console.log(`[HEADERS] Filtered ${headers.length} columns to ${filteredHeaders.length} columns with data`)
    console.log(`[HEADERS] Removed ${headers.length - filteredHeaders.length} empty columns`)
    
    // Get preview (first 5 non-empty rows for user to see)
    // Skip completely empty rows to ensure we show actual data
    // BUT: Also ensure we include rows that have data in important columns like email
    const nonEmptyRows: { row: any[], rowIdx: number }[] = []
    const emailRows: { row: any[], rowIdx: number }[] = [] // Rows with email data
    
    // Scan limited rows to find email data (up to 20 rows for performance)
    // We only need to find email data for preview, not all rows
    const maxRowsToScan = Math.min(20, dataRowsRaw.length)
    console.log(`[PREVIEW] Scanning ${maxRowsToScan} rows to find email data...`)
    
    for (let idx = 0; idx < maxRowsToScan; idx++) {
      const row = dataRowsRaw[idx]
      if (!row) continue
      // Check if row has any non-empty data
      const hasData = row && Array.isArray(row) && row.some((cell: any) => {
        if (cell === null || cell === undefined || cell === '') return false
        const strValue = String(cell).trim()
        return strValue.length > 0 && 
               strValue.toLowerCase() !== 'nan' && 
               strValue.toLowerCase() !== 'null' &&
               strValue.toLowerCase() !== 'undefined' &&
               strValue !== '-' &&
               strValue !== 'N/A'
      })
      
      // Check if this row has email data (if email column exists)
      // Try multiple ways to read the data to handle sparse arrays
      let hasEmailData = false
      if (emailColIdx >= 0 && row) {
        let emailValue: any = undefined
        
        // Method 1: Direct array access
        if (Array.isArray(row)) {
          // Check if index exists (handles sparse arrays)
          if (emailColIdx in row) {
            emailValue = row[emailColIdx]
          }
          // Also try accessing by index if within bounds
          else if (emailColIdx < row.length) {
            emailValue = row[emailColIdx]
          }
        }
        // Method 2: Object-style access (for XLSX object format)
        else if (typeof row === 'object' && row !== null) {
          emailValue = (row as any)[emailColIdx]
        }
        
        // Check if email value is valid
        if (emailValue !== null && emailValue !== undefined && emailValue !== '') {
          const strValue = String(emailValue).trim()
          if (strValue.length > 0 && 
              strValue.toLowerCase() !== 'nan' && 
              strValue.toLowerCase() !== 'null' &&
              strValue.toLowerCase() !== 'undefined') {
            hasEmailData = true
            console.log(`[PREVIEW] Found email at row ${idx}: "${strValue}"`)
          }
        }
      }
      
      if (hasData) {
        nonEmptyRows.push({ row, rowIdx: idx })
      }
      
      if (hasEmailData) {
        emailRows.push({ row, rowIdx: idx })
        // Logging already done above
      }
      
      // Stop early if we have enough data (but only after checking for email)
      if (nonEmptyRows.length >= 5 && emailRows.length >= 2) {
        console.log(`[PREVIEW] Found enough rows (${nonEmptyRows.length} non-empty, ${emailRows.length} with email) - stopping scan`)
        break
      }
    }
    
    // If we found rows with email data, make sure at least one is in preview
    const previewRows: { row: any[], rowIdx: number }[] = []
    const usedIndices = new Set<number>()
    
    // First, add rows with email data to preview
    emailRows.slice(0, 2).forEach(({ row, rowIdx }) => {
      if (!usedIndices.has(rowIdx)) {
        previewRows.push({ row, rowIdx })
        usedIndices.add(rowIdx)
      }
    })
    
    // Then add other non-empty rows
    nonEmptyRows.forEach(({ row, rowIdx }) => {
      if (!usedIndices.has(rowIdx) && previewRows.length < 5) {
        previewRows.push({ row, rowIdx })
        usedIndices.add(rowIdx)
      }
    })
    
    // Sort by row index to maintain order
    previewRows.sort((a, b) => a.rowIdx - b.rowIdx)
    
    console.log(`[PREVIEW] Found ${nonEmptyRows.length} non-empty rows out of ${dataRowsRaw.length} total rows`)
    console.log(`[PREVIEW] Found ${emailRows.length} rows with email data`)
    if (previewRows.length > 0) {
      console.log(`[PREVIEW] Preview will show rows at indices:`, previewRows.map(r => r.rowIdx))
    }
    
    // IMPORTANT: Use column index directly, not indexOf, to ensure correct column mapping
    const preview = previewRows.map(({ row, rowIdx }) => {
      const previewRow: Record<string, string> = {}
      filteredHeaders.forEach((header, newColIdx) => {
        // Map new column index to old column index
        const oldColIdx = columnMapping[newColIdx]
        
        // Safety check: skip if mapping is invalid
        if (oldColIdx === undefined || oldColIdx === null) {
          console.warn(`[PREVIEW] Column mapping missing for new index ${newColIdx}, header: ${header}`)
          previewRow[header] = ''
          return
        }
        
        // Use colIdx directly to ensure we get data from the correct column
        // This is critical for multi-row headers where header names might be similar
        // Priority: raw value (accurate) > formatted value (fallback)
        // Handle both array access and potential sparse arrays
        // For sparse arrays, we need to check if the index exists, not just if it's less than length
        let rawValue: any = undefined
        let formattedValue: any = undefined
        
        if (row && Array.isArray(row)) {
          // Check if index exists in array (handles sparse arrays)
          if (oldColIdx in row) {
            rawValue = row[oldColIdx]
          }
          // Also try direct access if within bounds (for non-sparse arrays)
          else if (oldColIdx < row.length) {
            rawValue = row[oldColIdx]
          }
        } else if (row && typeof row === 'object' && row !== null) {
          // Handle object-style row (from XLSX)
          rawValue = (row as any)[oldColIdx]
          // Also try numeric key access
          if (rawValue === undefined) {
            rawValue = (row as any)[String(oldColIdx)]
          }
        }
        
        // Use rowIdx to get corresponding formatted row
        const formattedRow = dataRowsFormatted[rowIdx]
        if (formattedRow && Array.isArray(formattedRow)) {
          // Check if index exists in array (handles sparse arrays)
          if (oldColIdx in formattedRow) {
            formattedValue = formattedRow[oldColIdx]
          }
          // Also try direct access if within bounds
          else if (oldColIdx < formattedRow.length) {
            formattedValue = formattedRow[oldColIdx]
          }
        } else if (formattedRow && typeof formattedRow === 'object' && formattedRow !== null) {
          formattedValue = (formattedRow as any)[oldColIdx]
          // Also try numeric key access
          if (formattedValue === undefined) {
            formattedValue = (formattedRow as any)[String(oldColIdx)]
          }
        }
        
        let cellValue = ''
        // Check raw value first (most accurate)
        if (rawValue !== undefined && rawValue !== null) {
          const rawStr = String(rawValue).trim()
          // Filter out common empty representations
          if (rawStr.length > 0 && 
              rawStr.toLowerCase() !== 'nan' && 
              rawStr.toLowerCase() !== 'null' && 
              rawStr.toLowerCase() !== 'undefined' &&
              rawStr !== '-' &&
              rawStr !== 'N/A') {
            cellValue = rawStr
          }
        } 
        // Fallback to formatted value if raw is empty/null
        if (!cellValue && formattedValue !== undefined && formattedValue !== null) {
          const formattedStr = String(formattedValue).trim()
          if (formattedStr.length > 0 && 
              formattedStr.toLowerCase() !== 'nan' && 
              formattedStr.toLowerCase() !== 'null' && 
              formattedStr.toLowerCase() !== 'undefined' &&
              formattedStr !== '-' &&
              formattedStr !== 'N/A') {
            cellValue = formattedStr
          }
        }
        
        previewRow[header] = cellValue
        
        // Log all rows for email column to debug missing data
        const isEmailHeader = header.toLowerCase().includes('email') || header.toLowerCase().includes('e-mail')
        if (isEmailHeader) {
          console.log(`[PREVIEW] Row ${rowIdx}, Column ${newColIdx} (${header}, old idx: ${oldColIdx}): "${cellValue}"`)
          console.log(`[PREVIEW]   - rawValue:`, rawValue, `(type: ${typeof rawValue})`)
          console.log(`[PREVIEW]   - formattedValue:`, formattedValue, `(type: ${typeof formattedValue})`)
          console.log(`[PREVIEW]   - row length:`, row?.length, `oldColIdx:`, oldColIdx)
          if (row && Array.isArray(row)) {
            console.log(`[PREVIEW]   - row[oldColIdx] exists:`, oldColIdx in row)
            console.log(`[PREVIEW]   - row[oldColIdx] value:`, row[oldColIdx])
          }
        } else if (rowIdx < 3 && newColIdx < 15) {
          console.log(`[PREVIEW] Row ${rowIdx}, Column ${newColIdx} (${header}, old idx: ${oldColIdx}): "${cellValue}"`)
        }
      })
      return previewRow
    })
    
    const dataRows = dataRowsRaw // Use raw for total count

    return NextResponse.json({
      success: true,
      headers: filteredHeaders, // Return filtered headers
      preview,
      totalRows: dataRows.length,
      sheetName,
      sheetNames,
      headerRow,
      headerRowCount,
      autoDetected,
      columnMapping, // Include column mapping for processing step
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

