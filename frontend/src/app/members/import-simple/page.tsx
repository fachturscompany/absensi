"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useOrgStore } from "@/store/org-store"
import { FileText, Upload, X, Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Wizard, WizardStep } from "@/components/ui/wizard"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Mapping kolom Excel ke kolom tabel user_profiles
const DATABASE_FIELDS = [
  { key: "nik", label: "NIK", required: true },
  { key: "nama", label: "Nama Lengkap", required: true },
  { key: "nickname", label: "Nickname", required: false },
  { key: "nisn", label: "NISN", required: false },
  { key: "jenis_kelamin", label: "Jenis Kelamin", required: true }, // L / P
  { key: "tempat_lahir", label: "Tempat Lahir", required: false },
  { key: "tanggal_lahir", label: "Tanggal Lahir", required: false },
  { key: "agama", label: "Agama", required: false },
  { key: "jalan", label: "Jalan", required: false },
  { key: "rt", label: "RT", required: false },
  { key: "rw", label: "RW", required: false },
  { key: "dusun", label: "Dusun", required: false },
  { key: "kelurahan", label: "Kelurahan", required: false },
  { key: "kecamatan", label: "Kecamatan", required: false },
  { key: "no_telepon", label: "No Telepon", required: false },
  { key: "email", label: "Email", required: false },
  { key: "department_id", label: "Department/Group", required: false },
] as const

type ColumnMapping = {
  [key: string]: string | null
}

const WIZARD_STEPS: WizardStep[] = [
  { number: 1, title: "Upload File", description: "Pilih file Excel / CSV" },
  { number: 2, title: "Mapping", description: "Mapping kolom Excel ke field database" },
  { number: 3, title: "Test", description: "Uji data sebelum import" },
  { number: 4, title: "Import", description: "Proses import ke database" },
  { number: 5, title: "Result", description: "Lihat ringkasan hasil import" },
]

export default function MembersImportSimplePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { organizationId } = useOrgStore()

  const [currentStep, setCurrentStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [excelHeaders, setExcelHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [processing, setProcessing] = useState(false)
  const [importProgress, setImportProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  })
  const [headerRow, setHeaderRow] = useState<number>(0) // 0 = auto-detect
  const [headerRowCount, setHeaderRowCount] = useState<number>(1)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [sheetName, setSheetName] = useState<string>("")
  const [allowMatchingWithSubfields, setAllowMatchingWithSubfields] = useState(true)
  const [selectedGroupId, setSelectedGroupId] = useState<string>("")
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const isProcessingSheetChangeRef = useRef(false)
  const previousSheetNameRef = useRef<string>("")
  const importProgressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [testSummary, setTestSummary] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)
  const [fingerPagePreview, setFingerPagePreview] = useState<{
    totalRows: number
    withEmailCount: number
    withoutEmailCount: number
    sampleData: Array<{
      row: number
      nik: string
      nama: string
      email: string
      department?: string
    }>
    message: string
  } | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [unmappedFields, setUnmappedFields] = useState<string[]>([])
  const [hasTested, setHasTested] = useState(false) // Track apakah sudah test
  const [importSummary, setImportSummary] = useState<{
    success: number
    failed: number
    errors: Array<{ row: number; message: string }>
  } | null>(null)
  const [importResults, setImportResults] = useState<Array<{
    row: number
    data: Record<string, string>
    status: "success" | "failed"
    error?: string
  }>>([])

  // Load groups on mount and when organizationId changes
  // Use stable value for dependency array to avoid React warning
  const orgId = organizationId ?? null
  React.useEffect(() => {
    const fetchGroups = async () => {
      if (!orgId) {
        console.log('[GROUPS] No organizationId, skipping fetch')
        // Don't update if already empty to prevent re-renders
        setGroups((prevGroups) => prevGroups.length === 0 ? prevGroups : [])
        return
      }

      setLoadingGroups(true)
      try {
        // Include organizationId and includeInactive in query params
        // For import, we want all groups (including inactive ones)
        const url = new URL("/api/groups", window.location.origin)
        url.searchParams.append('organizationId', String(orgId))
        url.searchParams.append('includeInactive', 'true')

        console.log('[GROUPS] Fetching groups for organizationId:', orgId)
        const response = await fetch(url.toString())
        if (!response.ok) {
          console.error("[GROUPS] Failed to fetch groups:", response.status, response.statusText)
          const errorText = await response.text()
          console.error("[GROUPS] Error response:", errorText)
          // Don't update if already empty to prevent re-renders
          setGroups((prevGroups) => prevGroups.length === 0 ? prevGroups : [])
          return
        }
        const data = await response.json()
        console.log('[GROUPS] API response:', data)

        if (data.success && data.data && Array.isArray(data.data)) {
          console.log('[GROUPS] Raw groups data:', data.data)
          // Map data to ensure id is string and we have name
          const mappedGroups = data.data
            .filter((group: any) => group.id && group.name) // Filter out invalid groups
            .map((group: any) => ({
              id: String(group.id), // Ensure id is string
              name: String(group.name || '') // Ensure name is string
            }))
          console.log('[GROUPS] Mapped groups:', mappedGroups.length, 'groups', mappedGroups)

          // Only update if groups actually changed (prevent unnecessary re-renders)
          setGroups((prevGroups) => {
            // Check if groups are the same by comparing IDs
            if (prevGroups.length === mappedGroups.length &&
              prevGroups.every((prev, idx) => prev.id === mappedGroups[idx]?.id && prev.name === mappedGroups[idx]?.name)) {
              return prevGroups // Return previous array if unchanged
            }
            return mappedGroups
          })
        } else {
          console.warn('[GROUPS] No groups data or invalid format:', data)
          setGroups((prevGroups) => prevGroups.length === 0 ? prevGroups : [])
        }
      } catch (error) {
        console.error("Error fetching groups:", error)
        // Only update if groups is not already empty to prevent unnecessary re-renders
        setGroups((prevGroups) => prevGroups.length === 0 ? prevGroups : [])
        // Don't show error toast, just silently fail
      } finally {
        setLoadingGroups(false)
      }
    }

    // Only fetch if orgId exists and is valid
    if (orgId) {
      fetchGroups()
    } else {
      // If no orgId, ensure groups is empty (but don't update if already empty)
      setGroups((prevGroups) => prevGroups.length === 0 ? prevGroups : [])
    }
  }, [orgId])

  const handleFileSelect = useCallback(async (selectedFile: File, sheetOverride?: string) => {
    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error("Please upload an Excel or CSV file (.xlsx, .xls, or .csv)")
      return
    }

    setFile(selectedFile)
    setLoading(true)
    setExcelHeaders([])
    setPreview([])
    setMapping({})
    setTestSummary(null)
    setFingerPagePreview(null)
    setHasTested(false) // Reset test status ketika file baru
    setImportSummary(null)
    setImportResults([])

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      // Send 0 to trigger auto-detect, or use manual headerRow if user has set it
      formData.append("headerRow", String(headerRow || 0))
      formData.append("headerRowCount", String(headerRowCount || 1))
      const chosenSheet = sheetOverride || sheetName
      if (chosenSheet) {
        formData.append("sheetName", chosenSheet)
      }

      const response = await fetch("/api/members/import/headers", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.message || "Failed to read Excel file")
        setFile(null)
        return
      }

      // Update headerRow and headerRowCount from response (in case auto-detect was used)
      if (data.headerRow) {
        setHeaderRow(data.headerRow)
      }
      if (data.headerRowCount) {
        setHeaderRowCount(data.headerRowCount)
      }

      setExcelHeaders(data.headers || [])
      setPreview(data.preview || [])
      setTotalRows(data.totalRows || 0)
      setSheetNames(data.sheetNames || [])
      // Only update sheetName if no sheetOverride was provided (to avoid loops)
      if (!sheetOverride) {
        setSheetName(data.sheetName || data.sheetNames?.[0] || "")
      }

      // Show success message with auto-detect info
      if (data.autoDetected) {
        toast.success(`Header row otomatis terdeteksi di baris ${data.headerRow}. File berhasil dimuat!`)
      } else {
        toast.success(`Excel file loaded. Found ${data.totalRows} rows and ${data.headers.length} columns`)
      }

      // Auto-map kolom umum ke field user_profiles (dengan matching yang lebih ketat)
      // IMPORTANT: One header can only map to one field (prevent duplicate mapping)
      const autoMapping: ColumnMapping = {}
      const usedHeaders = new Set<string>() // Track which headers have been mapped

      // Words that should NOT be matched (common document titles/metadata)
      const excludeWords = [
        'daftar', 'list', 'tabel', 'table', 'laporan', 'report',
        'peserta', 'didik', 'siswa', 'student', 'murid',
        'tanggal unduh', 'download', 'unduh', 'pengunduh',
        'kecamatan', 'kabupaten', 'provinsi', 'kota', 'kabupaten kota',
        'smk', 'sma', 'smp', 'sd', 'sekolah', 'school', 'malang'
      ]

      // Field-specific matching with word boundaries to avoid false matches
      // IMPORTANT: Patterns must be very specific to avoid false matches
      const matchPatterns: Record<string, (h: string) => boolean> = {
        nik: (h: string) => {
          // Only match exact "NIK" or "NIPD" (case-insensitive)
          // Don't match partial words or similar patterns
          return /^nik$/i.test(h) || /^nipd$/i.test(h) || /^nomor\s+induk\s+kependudukan$/i.test(h)
        },
        nama: (h: string) => /^nama(\s+lengkap)?$/i.test(h) || /^name$/i.test(h),
        nickname: (h: string) => /^nickname$/i.test(h) || /^nick$/i.test(h) || /^panggilan$/i.test(h),
        nisn: (h: string) => /^nisn$/i.test(h),
        jenis_kelamin: (h: string) => /^jenis\s+kelamin$/i.test(h) || /^jk$/i.test(h) || /^gender$/i.test(h),
        tempat_lahir: (h: string) => /^tempat(\s+lahir)?$/i.test(h) || /^kota\s+lahir$/i.test(h),
        tanggal_lahir: (h: string) => /^tanggal\s+lahir$/i.test(h) || /^tgl\s+lahir$/i.test(h) || /^ttl$/i.test(h),
        agama: (h: string) => /^agama$/i.test(h),
        jalan: (h: string) => /^jalan$/i.test(h) || /^alamat$/i.test(h),
        rt: (h: string) => /^rt$/i.test(h), // Exact match only
        rw: (h: string) => /^rw$/i.test(h), // Exact match only
        dusun: (h: string) => /^dusun$/i.test(h),
        kelurahan: (h: string) => /^kelurahan$/i.test(h) || /^desa$/i.test(h),
        kecamatan: (h: string) => /^kecamatan$/i.test(h),
        no_telepon: (h: string) => /^no\s*(telepon|hp|telp)$/i.test(h) || /^telepon$/i.test(h) || /^phone$/i.test(h),
        email: (h: string) => /^e-?mail$/i.test(h) || /^surel$/i.test(h) || /^e\s*mail$/i.test(h),
        department_id: (h: string) => /^department$/i.test(h) || /^departemen$/i.test(h) || /^divisi$/i.test(h) || /^group$/i.test(h) || /^kelompok$/i.test(h) || /^jurusan$/i.test(h),
      }

      // First pass: Find exact matches (highest priority)
      // Normalize by removing common separators (dash, space) for comparison
      const normalizeForMatch = (text: string): string => {
        return text.toLowerCase().trim().replace(/[-_\s]/g, '')
      }

      DATABASE_FIELDS.forEach((field) => {
        const fieldNormalized = normalizeForMatch(field.label)
        const exactMatch = data.headers.find((header: string) => {
          if (!header || header.trim().length === 0) return false
          if (usedHeaders.has(header)) return false // Already mapped

          const headerNormalized = normalizeForMatch(header)
          return headerNormalized === fieldNormalized
        })

        if (exactMatch) {
          autoMapping[field.key] = exactMatch
          usedHeaders.add(exactMatch)
          console.log(`[AUTO-MAP] Exact match: "${exactMatch}" -> "${field.key}"`)
        }
      })

      // Second pass: Find pattern matches (for fields not yet mapped)
      DATABASE_FIELDS.forEach((field) => {
        if (autoMapping[field.key]) return // Already mapped

        const matcher = matchPatterns[field.key]
        if (!matcher) return

        const matchingHeader = data.headers.find((header: string) => {
          if (!header || header.trim().length === 0) return false
          if (usedHeaders.has(header)) return false // Already mapped to another field

          const headerLower = header.toLowerCase().trim()

          // Skip headers that contain exclude words
          const hasExcludeWord = excludeWords.some(word => {
            return headerLower.startsWith(word + ' ') ||
              headerLower.includes(' ' + word + ' ') ||
              headerLower.endsWith(' ' + word) ||
              headerLower === word
          })
          if (hasExcludeWord) return false

          // Skip very long headers
          if (headerLower.length > 50) return false

          // Try pattern matching
          return matcher(headerLower)
        })

        if (matchingHeader) {
          // Double-check: make sure this header hasn't been mapped already
          if (usedHeaders.has(matchingHeader)) {
            console.log(`[AUTO-MAP] WARNING: Header "${matchingHeader}" already mapped, skipping for field "${field.key}"`)
            autoMapping[field.key] = null
          } else {
            autoMapping[field.key] = matchingHeader
            usedHeaders.add(matchingHeader)
            console.log(`[AUTO-MAP] Pattern match: "${matchingHeader}" -> "${field.key}"`)
          }
        } else {
          autoMapping[field.key] = null // Explicitly set to null if no match
        }
      })

      // Validate: Check for duplicate mappings (one header mapped to multiple fields)
      const mappingValues = Object.values(autoMapping).filter(v => v !== null)
      const duplicateHeaders = mappingValues.filter((header, index) => mappingValues.indexOf(header) !== index)
      if (duplicateHeaders.length > 0) {
        console.error(`[AUTO-MAP] ERROR: Found duplicate mappings:`, duplicateHeaders)
        // Fix duplicates by keeping only the first mapping
        const seen = new Set<string>()
        Object.keys(autoMapping).forEach(key => {
          const header = autoMapping[key]
          if (header && seen.has(header)) {
            console.log(`[AUTO-MAP] Removing duplicate mapping: ${key} -> ${header}`)
            autoMapping[key] = null
          } else if (header) {
            seen.add(header)
          }
        })
      }

      // Log final mapping for debugging
      console.log(`[AUTO-MAP] Final mapping:`, autoMapping)
      console.log(`[AUTO-MAP] Used headers:`, Array.from(usedHeaders))
      console.log(`[AUTO-MAP] Total headers:`, data.headers.length)
      console.log(`[AUTO-MAP] Mapped headers:`, usedHeaders.size)
      console.log(`[AUTO-MAP] Unmapped headers:`, data.headers.filter((h: string) => !usedHeaders.has(h)))

      setMapping(autoMapping)
      toast.success(`File loaded. Found ${data.totalRows || 0} rows and ${data.headers.length} columns`)
    } catch (error) {
      console.error("Error reading Excel:", error)
      toast.error("Failed to read Excel file")
      setFile(null)
    } finally {
      setLoading(false)
    }
  }, [headerRow, headerRowCount]) // Dependencies for handleFileSelect

  // Handle sheet name changes separately to avoid infinite loops
  useEffect(() => {
    // Skip if no file, already processing, or sheetName hasn't actually changed
    if (!file || isProcessingSheetChangeRef.current || sheetName === previousSheetNameRef.current) {
      return
    }

    // Skip if this is the initial load (when sheetName is set from API response)
    if (!previousSheetNameRef.current && sheetName) {
      previousSheetNameRef.current = sheetName
      return
    }

    // Only reload if sheetName actually changed by user
    if (sheetName && sheetName !== previousSheetNameRef.current) {
      isProcessingSheetChangeRef.current = true
      previousSheetNameRef.current = sheetName

      handleFileSelect(file, sheetName).finally(() => {
        isProcessingSheetChangeRef.current = false
      })
    }
  }, [sheetName, file, handleFileSelect]) // Include handleFileSelect in dependencies

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) handleFileSelect(droppedFile)
  }

  const validateMapping = (): boolean => {
    if (!mapping.nik) {
      toast.error("Please map the NIK column (required)")
      return false
    }
    if (!mapping.nama) {
      toast.error("Please map the Nama Lengkap column (required)")
      return false
    }
    return true
  }

  const handleTest = async () => {
    if (!file || !validateMapping()) return

    setProcessing(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("mapping", JSON.stringify(mapping))
      formData.append("mode", "test")
      formData.append("allowMatchingWithSubfields", String(allowMatchingWithSubfields))
      // Use detected headerRow (should be > 0 after auto-detect)
      formData.append("headerRow", String(headerRow > 0 ? headerRow : 1))
      formData.append("headerRowCount", String(headerRowCount || 1))
      if (sheetName) formData.append("sheetName", sheetName)
      if (selectedGroupId) formData.append("groupId", selectedGroupId)

      const response = await fetch("/api/members/import/process", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.message || "Test failed")
        return
      }

      const summary = data.summary || { success: 0, failed: 0, errors: [] }
      setTestSummary(summary)
      setHasTested(true) // Mark bahwa test sudah dilakukan

      // Set preview data untuk halaman finger
      if (data.fingerPagePreview) {
        setFingerPagePreview(data.fingerPagePreview)
      }

      if (summary.failed === 0) {
        toast.success(`Test passed! All ${summary.success} rows are valid.`)
      } else {
        toast.warning(`Test completed: ${summary.success} valid, ${summary.failed} errors found`)
      }
    } catch (error) {
      console.error("Error testing import:", error)
      toast.error("Failed to test import")
    } finally {
      setProcessing(false)
    }
  }

  const handleImport = async () => {
    if (!file || !validateMapping()) return

    // Siapkan progres import berbasis totalRows (fallback ke hasil test jika ada)
    const estimatedTotal =
      totalRows || (testSummary ? testSummary.success + testSummary.failed : 0) || 0

    if (importProgressTimerRef.current) {
      clearInterval(importProgressTimerRef.current)
    }

    if (estimatedTotal > 0) {
      setImportProgress({ current: 0, total: estimatedTotal })

      // Fake incremental progress selama proses import berjalan
      // Akan diset ke nilai sebenarnya ketika server selesai memproses
      importProgressTimerRef.current = setInterval(() => {
        setImportProgress((prev) => {
          if (!prev.total) return prev
          // Batasi maksimum ke 85% agar tidak penuh duluan sebelum server selesai
          // Ini memberikan ruang untuk proses yang lebih lama
          const maxDuringProcessing = Math.max(Math.floor(prev.total * 0.85), 1)
          if (prev.current >= maxDuringProcessing) return prev

          // Increment lebih kecil untuk progress yang lebih halus
          const increment = Math.max(1, Math.floor(prev.total / 100)) // ~100 langkah untuk lebih halus
          const nextCurrent = Math.min(prev.current + increment, maxDuringProcessing)
          return { ...prev, current: nextCurrent }
        })
      }, 200) // Update lebih sering untuk animasi lebih halus
    } else {
      // Jika tidak tahu totalnya, tetap reset progres
      setImportProgress({ current: 0, total: 0 })
    }

    setProcessing(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("mapping", JSON.stringify(mapping))
      formData.append("mode", "import")
      formData.append("allowMatchingWithSubfields", String(allowMatchingWithSubfields))
      // Use detected headerRow (should be > 0 after auto-detect)
      formData.append("headerRow", String(headerRow > 0 ? headerRow : 1))
      formData.append("headerRowCount", String(headerRowCount || 1))
      if (sheetName) formData.append("sheetName", sheetName)
      if (selectedGroupId) formData.append("groupId", selectedGroupId)

      const response = await fetch("/api/members/import/process", {
        method: "POST",
        body: formData,
      })

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Import failed"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorMessage
        } catch {
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`
        }
        toast.error(errorMessage)
        console.error("Import API error:", errorMessage)
        return
      }

      const data = await response.json()

      if (!data.success) {
        toast.error(data.message || "Import failed")
        console.error("Import failed:", data)
        return
      }

      const summary = data.summary || { success: 0, failed: 0, errors: [] }
      setImportSummary(summary)

      // Set progres ke nilai sebenarnya setelah server selesai memproses
      if (estimatedTotal > 0) {
        setImportProgress({
          current: summary.success + summary.failed,
          total: estimatedTotal,
        })
      }

      // Bentuk hasil per baris dari preview + error summary
      // Perlu menghitung row number dengan benar berdasarkan headerRow
      const headerRowNum = headerRow > 0 ? headerRow : 1
      const headerRowCountNum = headerRowCount || 1
      const startDataRow = headerRowNum + headerRowCountNum

      const results = preview.map((rowData, index) => {
        // Row number = header row + header row count + index (1-based dari data rows)
        const rowNumber = startDataRow + index
        const error = summary.errors.find((err: any) => err.row === rowNumber)

        return {
          row: rowNumber,
          data: rowData,
          status: error ? "failed" as const : "success" as const,
          error: error?.message || (error ? "Unknown error" : undefined),
        }
      })

      setImportResults(results)

      setCurrentStep(5)
    } catch (error) {
      console.error("Error importing members:", error)
      const errorMessage = error instanceof Error ? error.message : "Unexpected error processing import"
      toast.error(errorMessage)
    } finally {
      setProcessing(false)
      if (importProgressTimerRef.current) {
        clearInterval(importProgressTimerRef.current)
        importProgressTimerRef.current = null
      }
    }
  }

  const getPreviewValue = (header: string) => {
    const firstRow = preview[0]
    return firstRow?.[header] || ""
  }

  // Fungsi untuk check field yang belum ter-mapping
  const checkUnmappedFields = (): string[] => {
    const unmapped: string[] = []

    DATABASE_FIELDS.forEach((field) => {
      // Skip NIK karena sudah wajib (di-validasi di canGoNext)
      if (field.key === "nik") return

      // Skip department_id jika selectedGroupId sudah dipilih
      if (field.key === "department_id" && selectedGroupId && selectedGroupId.trim() !== "") {
        return
      }

      // Check jika field belum ter-mapping
      if (!mapping[field.key] || mapping[field.key] === "" || mapping[field.key] === null) {
        unmapped.push(field.label)
      }
    })

    return unmapped
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!file) {
        toast.error("Please upload a file first")
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (!validateMapping()) return
      setCurrentStep(3) // Go to Test step
    } else if (currentStep === 3) {
      // Test step - user must click Test button, then can proceed
      if (!hasTested) {
        toast.error("Silakan lakukan test terlebih dahulu")
        return
      }

      // Check unmapped fields dan test summary
      const unmapped = checkUnmappedFields()
      const hasFailed = testSummary && testSummary.failed > 0

      // Jika ada unmapped fields atau ada data yang gagal, tampilkan dialog konfirmasi gabungan
      if (unmapped.length > 0 || hasFailed) {
        setUnmappedFields(unmapped)
        setShowConfirmDialog(true)
      } else {
        // Jika semua lolos validasi dan tidak ada unmapped fields, langsung lanjut ke import
        setCurrentStep(4)
      }
    } else if (currentStep === 4) {
      // tombol Import yang menjalankan proses
    } else if (currentStep === 5) {
      // Prefetch sebelum navigasi untuk navigasi lebih cepat
      router.prefetch("/members")
      router.push("/members")
    }
  }

  const handleConfirmImport = () => {
    setShowConfirmDialog(false)
    setUnmappedFields([])
    setCurrentStep(4)
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canGoNext = () => {
    if (currentStep === 1) return !!file
    if (currentStep === 2) return !!mapping.nik && !!mapping.nama // Mapping step - just need valid mapping
    if (currentStep === 3) return hasTested // Test step - must have tested
    if (currentStep === 4) return false // Import step - button handles it
    if (currentStep === 5) return true // Result step
    return false
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Import Members</h1>
          <p className="text-muted-foreground">
            Import data member dari file Excel atau CSV dengan proses bertahap.
          </p>
        </div>

        <Wizard
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          onNext={currentStep === 4 ? undefined : handleNext}
          onPrevious={handlePrevious}
          canGoNext={canGoNext()}
          showNavigation={currentStep !== 4}
        >
          {/* Step 1: Upload */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0]
                  if (selectedFile) handleFileSelect(selectedFile)
                }}
                disabled={loading}
              />

              {!file ? (
                <div
                  className={`w-full p-12 border-2 border-dashed rounded-lg transition-colors ${isDragActive ? "bg-primary/5 border-primary" : "border-muted"
                    }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => !loading && fileInputRef.current?.click()}
                >
                  <div className="text-center space-y-4">
                    {loading ? (
                      <>
                        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                        <p className="text-muted-foreground">Loading file...</p>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-center">
                          <div className="relative">
                            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl"></div>
                            <div className="relative bg-purple-100 dark:bg-purple-900/30 rounded-full p-8">
                              <FileText className="h-16 w-16 text-purple-600 dark:text-purple-400" />
                            </div>
                          </div>
                        </div>
                        <h2 className="text-xl font-semibold">Drop or upload a file to import</h2>
                        <p className="text-muted-foreground">
                          Excel files are recommended as formatting is automatic. But, you can also use .csv files
                        </p>
                        <div className="pt-2">
                          <a
                            href="/templates/members-import-template.xlsx"
                            download
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="h-4 w-4" />
                            Download Template
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFile(null)
                          setExcelHeaders([])
                          setPreview([])
                          setMapping({})
                          setTestSummary(null)
                        }}
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Mapping */}
          {currentStep === 2 && (
            <div className="flex relative overflow-hidden">
              {/* Left panel */}
              <div className="w-80 pr-4 border-r pt-6 pb-6 relative z-10 flex flex-col shrink-0">
                <div className="space-y-6 pb-8 border-b">
                  <div>
                    <h2 className="font-semibold text-lg mb-4">Data to import</h2>

                    {file ? (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">File</p>
                          <p className="text-sm font-medium wrap-break-word whitespace-pre-wrap">{file.name}</p>
                        </div>

                        <div className="space-y-2 pb-2">
                          <Label htmlFor="sheet" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Sheet
                          </Label>
                          <Select
                            value={sheetName || sheetNames[0] || ""}
                            onValueChange={(value) => {
                              // Only update if value actually changed
                              if (value !== sheetName) {
                                setSheetName(value)
                                setHasTested(false) // Reset test status ketika sheet berubah
                                setFingerPagePreview(null) // Reset preview ketika sheet berubah
                                // Don't call handleFileSelect here - let useEffect handle it
                              }
                            }}
                            disabled={!sheetNames.length || loading || isProcessingSheetChangeRef.current}
                          >
                            <SelectTrigger id="sheet" className="w-full">
                              <SelectValue placeholder="Pilih sheet" />
                            </SelectTrigger>
                            <SelectContent>
                              {sheetNames.map((name) => (
                                <SelectItem key={name} value={name}>
                                  {name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 pb-2">
                          <Label htmlFor="group-select" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Pilih Group (Opsional)
                          </Label>
                          <Select
                            key={`group-select-${groups.length}-${selectedGroupId || 'none'}`}
                            value={selectedGroupId || "none"}
                            onValueChange={(value) => {
                              // Prevent infinite loops by checking if value actually changed
                              const newValue = value === "none" ? "" : value
                              // Only update if value actually changed and not already processing
                              if (newValue !== selectedGroupId) {
                                setSelectedGroupId(newValue)
                              }
                            }}
                            disabled={loadingGroups}
                          >
                            <SelectTrigger id="group-select" className="w-full">
                              <SelectValue placeholder={loadingGroups ? "Loading groups..." : "Pilih group untuk semua member"} />
                            </SelectTrigger>
                            <SelectContent>
                              {groups.length > 0 ? (
                                <>
                                  <SelectItem value="none">-- Tidak Ada Group --</SelectItem>
                                  {groups.map((group) => (
                                    <SelectItem key={group.id} value={String(group.id)}>
                                      {group.name}
                                    </SelectItem>
                                  ))}
                                </>
                              ) : (
                                <SelectItem value="none" disabled={loadingGroups}>
                                  {loadingGroups ? "Loading groups..." : "Tidak ada group tersedia"}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Jika dipilih, semua member yang di-import akan otomatis dimasukkan ke group ini
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No file selected</p>
                    )}
                  </div>
                </div>

                {/* Advanced Options */}
                <div className="pt-6 pb-6 border-t space-y-4">
                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Advanced
                    </Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="allow-matching-subfields"
                          checked={allowMatchingWithSubfields}
                          onCheckedChange={(checked) => setAllowMatchingWithSubfields(checked === true)}
                        />
                        <Label
                          htmlFor="allow-matching-subfields"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Allow matching with subfields
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t space-y-4">
                  <Alert className="border-blue-500/50 bg-blue-500/5">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription>
                      Mapping kolom Excel ke field member. NIK dan Nama harus diisi.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              {/* Right panel */}
              <div className="flex-1 pl-4 pt-6 pb-6 relative z-10 flex flex-col min-w-0 overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : excelHeaders.length > 0 ? (
                  <div className="flex flex-col space-y-4 min-w-0">
                    <div className="border rounded-lg overflow-hidden">
                      <div className="h-[500px] overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[200px] max-w-[250px]">File Column</TableHead>
                              <TableHead>Database Field</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {excelHeaders.map((header, idx) => {
                              const mappedField = Object.keys(mapping).find((key) => mapping[key] === header)
                              const previewValue = getPreviewValue(header)

                              return (
                                <TableRow key={`map-row-${idx}`}>
                                  <TableCell className="min-w-[200px] max-w-[250px] wrap-break-word whitespace-pre-wrap align-top">
                                    <div>
                                      <p className="font-medium wrap-break-word whitespace-pre-wrap">{header}</p>
                                      {previewValue && (
                                        <p className="text-xs text-muted-foreground mt-1 wrap-break-word whitespace-pre-wrap">
                                          {previewValue}
                                        </p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={mappedField || ""}
                                      onValueChange={(value) => {
                                        if (!value || value === "") {
                                          const newMapping = { ...mapping }
                                          Object.keys(newMapping).forEach((key) => {
                                            if (newMapping[key] === header) {
                                              delete newMapping[key]
                                            }
                                          })
                                          setMapping(newMapping)
                                          setHasTested(false) // Reset test status ketika mapping berubah
                                          setFingerPagePreview(null) // Reset preview ketika mapping berubah
                                        } else {
                                          const newMapping = { ...mapping }
                                          Object.keys(newMapping).forEach((key) => {
                                            if (newMapping[key] === header && key !== value) {
                                              delete newMapping[key]
                                            }
                                          })
                                          newMapping[value] = header
                                          setMapping(newMapping)
                                          setHasTested(false) // Reset test status ketika mapping berubah
                                          setFingerPagePreview(null) // Reset preview ketika mapping berubah
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="w-full max-w-[280px]">
                                        <SelectValue placeholder="" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {DATABASE_FIELDS.map((field) => (
                                          <SelectItem key={field.key} value={field.key}>
                                            {field.label}
                                            {field.required ? " *" : ""}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Finger Page Preview */}
                    {fingerPagePreview && fingerPagePreview.totalRows > 0 && (
                      <Alert className="border-blue-500/50 bg-blue-500/5">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">
                                📋 Preview Halaman Fingerprint
                              </p>
                              <p className="text-sm text-blue-600 dark:text-blue-300">
                                {fingerPagePreview.message.split(" (")[0]}
                              </p>
                            </div>

                            {fingerPagePreview.sampleData.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">
                                  Sample data yang akan muncul ({fingerPagePreview.sampleData.length} dari {fingerPagePreview.totalRows}):
                                </p>
                                <div className="max-h-48 overflow-auto border rounded-md bg-background/50">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-muted/50">
                                        <TableHead className="w-12 text-xs">Row</TableHead>
                                        <TableHead className="text-xs">NIK</TableHead>
                                        <TableHead className="text-xs">Nama</TableHead>
                                        <TableHead className="text-xs">Email</TableHead>
                                        <TableHead className="text-xs">Department</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody className="[&>tr:nth-child(even)]:bg-muted/50">
                                      {fingerPagePreview.sampleData.map((item, idx) => (
                                        <TableRow key={idx} className="text-xs">
                                          <TableCell className="font-medium">{item.row}</TableCell>
                                          <TableCell>{item.nik}</TableCell>
                                          <TableCell className="font-medium">{item.nama}</TableCell>
                                          <TableCell className="text-muted-foreground">
                                            {item.email}
                                          </TableCell>
                                          <TableCell className="text-muted-foreground">
                                            {item.department || "-"}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                                {fingerPagePreview.totalRows > fingerPagePreview.sampleData.length && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    ... dan {fingerPagePreview.totalRows - fingerPagePreview.sampleData.length} data lainnya
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data to map. Please upload a file first.</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Test */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test Data</CardTitle>
                  <CardDescription>
                    Uji data sebelum melakukan import. Pastikan semua data valid.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        File: <span className="font-medium">{file?.name}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total rows: <span className="font-medium">{totalRows}</span>
                      </p>
                    </div>
                    <Button
                      onClick={handleTest}
                      disabled={!file || processing || !mapping.nik || !mapping.nama}
                      variant="outline"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        "Test"
                      )}
                    </Button>
                  </div>

                  {/* Test Results */}
                  {testSummary && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        {testSummary.success > 0 && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <p className="text-sm font-medium text-green-600">
                              Success: <span className="font-bold">{testSummary.success}</span>
                            </p>
                          </div>
                        )}
                        {testSummary.failed > 0 && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            <p className="text-sm font-medium text-destructive">
                              Failed: <span className="font-bold">{testSummary.failed}</span>
                            </p>
                          </div>
                        )}
                      </div>

                      {testSummary.failed > 0 && (
                        <Alert className="border-destructive/50 bg-destructive/5">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <AlertDescription>
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-destructive mb-1">Data yang tidak bisa di-import:</p>
                              <div className="max-h-64 overflow-auto">
                                <ul className="text-xs list-disc list-inside space-y-1">
                                  {testSummary.errors.slice(0, 10).map((error, idx) => {
                                    const row = typeof error === "object" && error !== null ? (error as any).row : null
                                    const message =
                                      typeof error === "string"
                                        ? error
                                        : typeof error === "object" && error !== null
                                          ? (error as any).message || JSON.stringify(error)
                                          : String(error)
                                    const displayMessage = row ? `Baris ${row}: ${message}` : message
                                    return <li key={idx} className="text-destructive">{displayMessage}</li>
                                  })}
                                </ul>
                              </div>
                              {testSummary.errors.length > 10 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  ... dan {testSummary.errors.length - 10} error lainnya
                                </p>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {testSummary.success > 0 && testSummary.failed === 0 && (
                        <Alert className="border-green-500/50 bg-green-500/5">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription>
                            <p className="text-sm font-medium text-green-600">
                              Semua data valid! Anda dapat melanjutkan ke step Import.
                            </p>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Preview Data yang Berhasil */}
                      {testSummary && testSummary.success > 0 && preview.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">
                              Preview Data yang Berhasil ({testSummary.success} data)
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Menampilkan {Math.min(10, preview.length)} dari {preview.length} baris pertama
                            </p>
                          </div>
                          <div className="border rounded-lg overflow-hidden">
                            <div className="max-h-96 overflow-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-16">No</TableHead>
                                    {excelHeaders.slice(0, 8).map((header, idx) => (
                                      <TableHead key={idx} className="min-w-[120px]">
                                        {header}
                                      </TableHead>
                                    ))}
                                    {excelHeaders.length > 8 && (
                                      <TableHead className="text-muted-foreground">
                                        +{excelHeaders.length - 8} kolom lainnya
                                      </TableHead>
                                    )}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {preview.slice(0, 10).map((row, idx) => {
                                    // Check if this row would be valid (basic check)
                                    const nikValue = row[mapping.nik || ""] || ""
                                    const namaValue = row[mapping.nama || ""] || ""
                                    const isValid = nikValue && namaValue

                                    return (
                                      <TableRow
                                        key={idx}
                                        className={isValid ? "bg-green-50/50 dark:bg-green-950/20" : ""}
                                      >
                                        <TableCell className="font-medium">{idx + 1}</TableCell>
                                        {excelHeaders.slice(0, 8).map((header, headerIdx) => (
                                          <TableCell key={headerIdx} className="min-w-[120px]">
                                            <div className="max-w-[200px] truncate" title={String(row[header] || "")}>
                                              {String(row[header] || "") || "-"}
                                            </div>
                                          </TableCell>
                                        ))}
                                        {excelHeaders.length > 8 && (
                                          <TableCell className="text-muted-foreground text-xs">
                                            ...
                                          </TableCell>
                                        )}
                                      </TableRow>
                                    )
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                          {preview.length > 10 && (
                            <p className="text-xs text-muted-foreground text-center">
                              ... dan {preview.length - 10} baris lainnya
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {!testSummary && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Klik tombol "Test" untuk memvalidasi data sebelum import.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Import */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ready to Import</CardTitle>
                  <CardDescription>
                    Review your mapping and click Import to start the process
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">File:</span> {file?.name}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Total Rows:</span> {totalRows}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Mapped Fields:</span>{" "}
                      {Object.keys(mapping).filter((key) => mapping[key]).length} of {DATABASE_FIELDS.length}
                    </p>
                  </div>

                  {testSummary && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Test Results: {testSummary.success} valid, {testSummary.failed} errors
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Progress bar saat proses import berjalan */}
                  {processing && importProgress.total > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Mengimport{" "}
                        <span className="font-semibold">
                          {importProgress.current.toLocaleString()} /{" "}
                          {importProgress.total.toLocaleString()}
                        </span>{" "}
                        baris...
                      </p>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-2 bg-primary transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              (importProgress.current / importProgress.total) * 100 || 0
                            )
                              }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handlePrevious}
                      disabled={processing}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={processing || !mapping.nik || !mapping.nama}
                      className="flex-1"
                      size="lg"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Start Import
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 5: Result */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Import Complete</CardTitle>
                  <CardDescription>Summary of the import process</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {importSummary && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="font-semibold">Success</span>
                          </div>
                          <p className="text-2xl font-bold text-green-600">{importSummary.success}</p>
                        </div>
                        <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="font-semibold">Failed</span>
                          </div>
                          <p className="text-2xl font-bold text-red-600">{importSummary.failed}</p>
                        </div>
                      </div>

                      {/* Error Summary */}
                      {importSummary.failed > 0 && importSummary.errors.length > 0 && (
                        <Alert className="border-destructive/50 bg-destructive/5">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <AlertDescription>
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-destructive mb-2">
                                Ringkasan Error ({importSummary.failed} data gagal):
                              </p>
                              <div className="max-h-40 overflow-auto space-y-1">
                                {/* Group errors by message type */}
                                {(() => {
                                  const errorGroups = new Map<string, number>()
                                  importSummary.errors.forEach((err: any) => {
                                    const msg = err.message || "Unknown error"
                                    errorGroups.set(msg, (errorGroups.get(msg) || 0) + 1)
                                  })

                                  return Array.from(errorGroups.entries())
                                    .sort((a, b) => b[1] - a[1]) // Sort by count
                                    .slice(0, 5) // Show top 5 error types
                                    .map(([message, count], idx) => (
                                      <div key={idx} className="text-xs flex items-start gap-2">
                                        <span className="text-destructive font-medium min-w-[60px]">
                                          {count}x:
                                        </span>
                                        <span className="text-destructive">{message}</span>
                                      </div>
                                    ))
                                })()}
                              </div>
                              {importSummary.errors.length > 5 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Lihat kolom "Error Message" di tabel untuk detail lengkap setiap baris.
                                </p>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {importResults.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-4">Import Results</h3>
                          <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                              <Table className="min-w-full">
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-16 sticky left-0 bg-background z-10">Row</TableHead>
                                    {excelHeaders.map((header, idx) => (
                                      <TableHead key={`${header}-${idx}`} className="min-w-[150px]">{header}</TableHead>
                                    ))}
                                    <TableHead className="min-w-[200px]">Import Result</TableHead>
                                    <TableHead className="min-w-[300px]">Error Message</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {importResults.map((result, idx) => {
                                    const isSuccess = result.status === "success"
                                    return (
                                      <TableRow
                                        key={idx}
                                        className={isSuccess ? "bg-green-50/50 dark:bg-green-950/20" : "bg-red-50/50 dark:bg-red-950/20"}
                                      >
                                        <TableCell className="font-medium sticky left-0 bg-inherit z-10">
                                          {result.row}
                                        </TableCell>
                                        {excelHeaders.map((header, idx2) => (
                                          <TableCell key={`${header}-${idx2}`} className="min-w-[150px]">
                                            {result.data[header] || "-"}
                                          </TableCell>
                                        ))}
                                        <TableCell className="min-w-[200px]">
                                          {isSuccess ? (
                                            <div className="flex items-center gap-2">
                                              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                              <span className="text-sm text-green-600 font-medium">Success</span>
                                            </div>
                                          ) : (
                                            <div className="flex items-start gap-2">
                                              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                                              <div className="flex flex-col min-w-0">
                                                <span className="text-sm text-red-600 font-medium">Failed</span>
                                              </div>
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell className="min-w-[300px]">
                                          {!isSuccess && result.error ? (
                                            <div className="text-xs text-red-600 whitespace-normal break-words">
                                              {result.error}
                                            </div>
                                          ) : isSuccess ? (
                                            <span className="text-xs text-muted-foreground">-</span>
                                          ) : (
                                            <span className="text-xs text-muted-foreground italic">No error message available</span>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    )
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          asChild
                          className="flex-1"
                        >
                          <Link
                            href="/members"
                            prefetch={false}
                          // onMouseEnter={(e) => {
                          //   const href = e.currentTarget.getAttribute('href')
                          //   if (href && router) {
                          //     router.prefetch(href)
                          //   }
                          // }}
                          >
                            Back to Members Page
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCurrentStep(1)
                            setFile(null)
                            setImportSummary(null)
                            setImportResults([])
                            setTestSummary(null)
                            setMapping({})
                            setExcelHeaders([])
                            setPreview([])
                          }}
                        >
                          Import Another File
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </Wizard>

        {/* Confirmation Dialog - Gabungan untuk unmapped fields dan test summary */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Apakah Anda yakin ingin lanjut?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 pt-2">
                  {/* Unmapped Fields Section */}
                  {unmappedFields.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Beberapa database field belum ter-mapping ke kolom Excel. Field-field berikut akan diabaikan saat import (nilai akan kosong atau menggunakan default):
                      </p>
                      <div className="max-h-40 overflow-auto bg-muted/50 rounded-lg p-4">
                        <ul className="space-y-2">
                          {unmappedFields.map((field, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-muted-foreground mt-0.5">•</span>
                              <span className="flex-1">{field}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Test Summary Section */}
                  {testSummary && testSummary.failed > 0 && (
                    <div className={`space-y-3 ${unmappedFields.length > 0 ? 'pt-3 border-t' : ''}`}>
                      <p className="text-sm">
                        Beberapa data tidak lolos validasi. Hanya data yang lolos validasi yang akan di-import.
                      </p>
                      <div className="space-y-3 pt-2">
                        {/* Summary statistik */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                                Data yang BISA di-import:
                              </span>
                              <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                                {testSummary.success} row
                              </span>
                            </div>
                          </div>
                          <div className="p-3 border rounded-lg bg-red-50 dark:bg-red-950">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-medium text-red-700 dark:text-red-400">
                                Data yang TIDAK BISA di-import:
                              </span>
                              <span className="text-2xl font-bold text-red-700 dark:text-red-400">
                                {testSummary.failed} row
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* List errors */}
                        {testSummary.errors && testSummary.errors.length > 0 && (
                          <div className="pt-2 border-t">
                            <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">
                              Alasan data tidak bisa di-import:
                            </p>
                            <div className="max-h-40 overflow-auto bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
                              <ul className="text-xs space-y-1.5">
                                {testSummary.errors.slice(0, 10).map((error, idx) => {
                                  const row = typeof error === "object" && error !== null ? (error as any).row : null
                                  const message =
                                    typeof error === "string"
                                      ? error
                                      : typeof error === "object" && error !== null
                                        ? (error as any).message || JSON.stringify(error)
                                        : String(error)
                                  const displayMessage = row ? `Baris ${row}: ${message}` : message
                                  return (
                                    <li key={idx} className="text-red-700 dark:text-red-400 flex items-start gap-1">
                                      <span className="text-red-500 mt-0.5">•</span>
                                      <span className="flex-1">{displayMessage}</span>
                                    </li>
                                  )
                                })}
                                {testSummary.errors.length > 10 && (
                                  <li className="text-red-600 dark:text-red-500 font-medium pt-1 border-t border-red-200 dark:border-red-900">
                                    ... dan {testSummary.errors.length - 10} error lainnya
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowConfirmDialog(false)
                setUnmappedFields([])
              }}>
                Tidak
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmImport}>
                Ya
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}


