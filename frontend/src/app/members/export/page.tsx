"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Wizard, WizardStep } from "@/components/ui/wizard"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FileSpreadsheet,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Users,
  Search,
  Filter,
  X,
  GripVertical,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Download
} from "lucide-react"
import { toast } from "sonner"
import { useHydration } from "@/hooks/useHydration"
import { useGroups } from "@/hooks/use-groups"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

const WIZARD_STEPS: WizardStep[] = [
  { number: 1, title: "Pilih Data", description: "Ringkasan data yang akan diexport" },
  { number: 2, title: "Konfigurasi Export", description: "Pilih format dan kolom" },
  { number: 3, title: "Preview Data", description: "Preview hasil export" },
  { number: 4, title: "Export", description: "Proses export ke file" },
  { number: 5, title: "Result", description: "Hasil export" },
]

// Available export fields - ONLY from biodata table
const EXPORT_FIELDS = [
  { key: "nik", label: "NIK", default: true },
  { key: "nama", label: "Nama Lengkap", default: true },
  { key: "nickname", label: "Nickname", default: false },
  { key: "nisn", label: "NISN", default: false },
  { key: "jenis_kelamin", label: "Jenis Kelamin", default: false },
  { key: "tempat_lahir", label: "Tempat Lahir", default: false },
  { key: "tanggal_lahir", label: "Tanggal Lahir", default: false },
  { key: "agama", label: "Agama", default: false },
  { key: "jalan", label: "Jalan", default: false },
  { key: "rt", label: "RT", default: false },
  { key: "rw", label: "RW", default: false },
  { key: "dusun", label: "Dusun", default: false },
  { key: "kelurahan", label: "Kelurahan", default: false },
  { key: "kecamatan", label: "Kecamatan", default: false },
  { key: "no_telepon", label: "No. Telepon", default: false },
  { key: "email", label: "Email", default: true },
  { key: "department_id", label: "Group", default: false },
] as const

type ExportFormat = "xlsx" | "csv"
type ExportConfig = {
  format: ExportFormat
  selectedFields: string[]
  includeHeader: boolean
  dateFormat: string
}

export default function MembersExportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isHydrated, organizationId } = useHydration()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: "xlsx",
    selectedFields: EXPORT_FIELDS.filter(f => f.default).map(f => f.key),
    includeHeader: true,
    dateFormat: "YYYY-MM-DD",
  })
  const [previewData, setPreviewData] = useState<Record<string, any>[]>([])
  const [memberRows, setMemberRows] = useState<Record<string, any>[]>([]) // Data untuk tabel di Step 1
  const [totalCount, setTotalCount] = useState(0)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set()) // Indeks row yang dipilih
  const [selectAllPages, setSelectAllPages] = useState(false) // Flag untuk menandai semua halaman dipilih
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(1000) // Maksimal 1000 data per halaman
  const [exportResult, setExportResult] = useState<{
    success: boolean
    fileUrl?: string
    fileName?: string
    exportedCount?: number
    message?: string
  } | null>(null)
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  })
  const exportProgressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const exportFinishTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Filter states - dynamic filter system (like Supabase)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [filters, setFilters] = useState<Array<{
    id: string
    column: string
    values: string[]
  }>>([])
  const [showAddFilterPopover, setShowAddFilterPopover] = useState(false)
  const [editingFilterId, setEditingFilterId] = useState<string | null>(null)
  const [filterOptions, setFilterOptions] = useState<Record<string, Array<{ value: string; label: string }>>>({})
  const [loadingFilterOptions, setLoadingFilterOptions] = useState<Record<string, boolean>>({})
  // State untuk 2-step filter (pilih kolom → pilih nilai + Apply)
  const [selectedColumnForFilter, setSelectedColumnForFilter] = useState<string | null>(null)
  const [tempNewFilterValues, setTempNewFilterValues] = useState<string[]>([])

  // Load groups
  const { data: groups = [] } = useGroups({
    enabled: isHydrated && !!organizationId
  })

  // Load filter options from database
  const loadFilterOptions = React.useCallback(async (columnKey: string) => {
    if (!organizationId || !columnKey) return
    if (filterOptions[columnKey] || loadingFilterOptions[columnKey]) return

    setLoadingFilterOptions(prev => ({ ...prev, [columnKey]: true }))
    try {
      const url = new URL("/api/members/export/filter-options", window.location.origin)
      url.searchParams.set("organizationId", String(organizationId))
      url.searchParams.set("column", columnKey)

      const res = await fetch(url.toString(), { credentials: "same-origin" })
      const json = await res.json()

      if (json.success) {
        setFilterOptions(prev => ({
          ...prev,
          [columnKey]: json.options || []
        }))
      }
    } catch (error) {
      console.error("Error loading filter options:", error)
    } finally {
      setLoadingFilterOptions(prev => ({ ...prev, [columnKey]: false }))
    }
  }, [organizationId, filterOptions, loadingFilterOptions])

  // Available filter columns (exclude already selected ones)
  const getAvailableFilterColumns = () => {
    const usedColumns = new Set(filters.map(f => f.column))
    return [
      {
        key: "group",
        label: "Group / Department",
        options: groups.map(g => ({ value: String(g.id), label: g.name }))
      },
      {
        key: "jenis_kelamin",
        label: "Jenis Kelamin",
        options: filterOptions.jenis_kelamin || []
      },
      {
        key: "agama",
        label: "Agama",
        options: filterOptions.agama || []
      },
    ].filter(col => !usedColumns.has(col.key))
  }

  // Get filter values for API
  const getFilterParams = () => {
    const params: Record<string, string[]> = {}
    filters.forEach(filter => {
      if (filter.column === "group") {
        params.groups = filter.values
      } else if (filter.column === "jenis_kelamin") {
        params.genders = filter.values
      } else if (filter.column === "agama") {
        params.agamas = filter.values
      } else if (filter.column === "status") {
        params.status = filter.values
      }
    })
    return params
  }

  // Add new filter - Step 1: Pilih kolom, lalu buka panel untuk pilih nilai
  const selectColumnForFilter = (columnKey: string) => {
    // Load filter options if needed
    if (columnKey !== "group" && !filterOptions[columnKey]) {
      loadFilterOptions(columnKey)
    }
    setSelectedColumnForFilter(columnKey)
    setTempNewFilterValues([])
    // Popover tetap terbuka untuk menampilkan panel nilai
  }

  // Apply new filter - Step 2: Setelah pilih nilai, klik Apply
  const applyNewFilter = () => {
    if (!selectedColumnForFilter || tempNewFilterValues.length === 0) {
      toast.error("Pilih minimal satu nilai untuk filter")
      return
    }
    const filterId = `${selectedColumnForFilter}-${Date.now()}`
    setFilters(prev => [...prev, { id: filterId, column: selectedColumnForFilter, values: tempNewFilterValues }])
    setSelectedColumnForFilter(null)
    setTempNewFilterValues([])
    setShowAddFilterPopover(false)
  }

  // Remove filter
  const removeFilter = (filterId: string) => {
    setFilters(prev => prev.filter(f => f.id !== filterId))
  }

  // Update filter values
  const updateFilterValues = (filterId: string, values: string[]) => {
    setFilters(prev => prev.map(f => f.id === filterId ? { ...f, values } : f))
  }

  // Get filter column config
  const getFilterColumnConfig = (columnKey: string) => {
    const allColumns = [
      {
        key: "group",
        label: "Group / Department",
        options: groups.map(g => ({ value: String(g.id), label: g.name }))
      },
      {
        key: "jenis_kelamin",
        label: "Jenis Kelamin",
        options: filterOptions.jenis_kelamin || []
      },
      {
        key: "agama",
        label: "Agama",
        options: filterOptions.agama || []
      },
    ]
    return allColumns.find(col => col.key === columnKey)
  }

  // Load filter options on mount
  useEffect(() => {
    if (isHydrated && organizationId) {
      loadFilterOptions("agama")
      loadFilterOptions("jenis_kelamin")
    }
  }, [isHydrated, organizationId, loadFilterOptions])

  // Reset selectAllPages ketika filter atau search berubah
  useEffect(() => {
    setSelectAllPages(false)
    setSelectedRows(new Set())
  }, [searchQuery, filters])

  // Step 1: Load member data summary and rows
  useEffect(() => {
    if (currentStep === 1 && isHydrated && organizationId) {
      loadMemberSummary()
      loadMemberRows()
    }
     
  }, [currentStep, isHydrated, organizationId, searchQuery, filters, currentPage, pageSize])

  // Cleanup progress timer on unmount
  useEffect(() => {
    return () => {
      if (exportProgressTimerRef.current) {
        clearInterval(exportProgressTimerRef.current)
        exportProgressTimerRef.current = null
      }
      if (exportFinishTimerRef.current) {
        clearInterval(exportFinishTimerRef.current)
        exportFinishTimerRef.current = null
      }
    }
  }, [])

  const loadMemberSummary = async () => {
    setLoading(true)
    try {
      const url = new URL("/api/members/export/count", window.location.origin)
      if (organizationId) url.searchParams.set("organizationId", String(organizationId))
      if (searchQuery) url.searchParams.set("search", searchQuery)

      const filterParams = getFilterParams()
      if (filterParams.groups?.length) url.searchParams.set("groups", filterParams.groups.join(","))
      if (filterParams.genders?.length) url.searchParams.set("genders", filterParams.genders.join(","))
      if (filterParams.agamas?.length) url.searchParams.set("agamas", filterParams.agamas.join(","))
      if (filterParams.status?.length) {
        const status = filterParams.status[0] // Status is single value
        if (status) {
          url.searchParams.set("active", status)
        }
      }

      const res = await fetch(url.toString(), { credentials: "same-origin" })
      const json = await res.json()

      if (json.success) {
        setTotalCount(json.count || 0)
      } else {
        toast.error(json.message || "Gagal memuat data member")
      }
    } catch (error) {
      console.error("Error loading member summary:", error)
      toast.error("Gagal memuat data member")
    } finally {
      setLoading(false)
    }
  }

  const loadMemberRows = async () => {
    setLoadingMembers(true)
    try {
      const url = new URL("/api/members/export/rows", window.location.origin)
      if (organizationId) url.searchParams.set("organizationId", String(organizationId))
      if (searchQuery) url.searchParams.set("search", searchQuery)
      url.searchParams.set("page", String(currentPage))
      url.searchParams.set("pageSize", String(pageSize))

      const filterParams = getFilterParams()
      if (filterParams.groups?.length) url.searchParams.set("groups", filterParams.groups.join(","))
      if (filterParams.genders?.length) url.searchParams.set("genders", filterParams.genders.join(","))
      if (filterParams.agamas?.length) url.searchParams.set("agamas", filterParams.agamas.join(","))
      if (filterParams.status?.length && filterParams.status[0]) {
        const status = filterParams.status[0]
        url.searchParams.set("active", status)
      }

      const res = await fetch(url.toString(), { credentials: "same-origin" })
      const json = await res.json()

      if (json.success) {
        setMemberRows(json.data || [])
        // Reset selected rows saat ganti halaman
        // Tapi jika selectAllPages true, tetap pilih semua row di halaman baru untuk visual feedback
        if (selectAllPages) {
          setSelectedRows(new Set(json.data?.map((_: any, idx: number) => idx) || []))
        } else {
          setSelectedRows(new Set())
        }
      } else {
        toast.error(json.message || "Gagal memuat data member")
      }
    } catch (error) {
      console.error("Error loading member rows:", error)
      toast.error("Gagal memuat data member")
    } finally {
      setLoadingMembers(false)
    }
  }

  const toggleRowSelection = (index: number) => {
    // Jika user memilih/deselect row secara manual, reset selectAllPages
    setSelectAllPages(false)
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectAllPages) {
      // Jika semua halaman sudah dipilih, hapus semua pilihan
      setSelectAllPages(false)
      setSelectedRows(new Set())
    } else {
      // Pilih semua halaman (semua data yang sesuai filter)
      setSelectAllPages(true)
      // Juga pilih semua row di halaman saat ini untuk visual feedback
      setSelectedRows(new Set(memberRows.map((_, idx) => idx)))
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  // Step 3: Load preview data (gunakan API rows agar konsisten dengan Data Member)
  const loadPreviewData = async () => {
    setLoading(true)
    // Jika user sudah memilih baris tertentu di Step 1,
    // preview cukup menampilkan baris yang dipilih saja (maks 10 baris),
    // supaya sesuai ekspektasi bahwa hanya data terpilih yang akan diexport.
    if (selectedRows.size > 0 && memberRows.length > 0) {
      const selected = memberRows
        .filter((_, idx) => selectedRows.has(idx))
        .slice(0, 10)
      setPreviewData(selected)
      setLoading(false)
      return
    }

    try {
      const url = new URL("/api/members/export/rows", window.location.origin)
      if (organizationId) url.searchParams.set("organizationId", String(organizationId))
      if (searchQuery) url.searchParams.set("search", searchQuery)
      // Preview selalu ambil halaman pertama, maksimal 10 baris
      url.searchParams.set("page", "1")
      url.searchParams.set("pageSize", "10")

      const filterParams = getFilterParams()
      if (filterParams.groups?.length) url.searchParams.set("groups", filterParams.groups.join(","))
      if (filterParams.genders?.length) url.searchParams.set("genders", filterParams.genders.join(","))
      if (filterParams.agamas?.length) url.searchParams.set("agamas", filterParams.agamas.join(","))
      if (filterParams.status?.length) {
        const status = filterParams.status[0]
        if (status) {
          url.searchParams.set("active", status)
        }
      }

      const res = await fetch(url.toString(), { credentials: "same-origin" })
      const json = await res.json()

      if (json.success) {
        setPreviewData(json.data || [])
      } else {
        toast.error(json.message || "Gagal memuat preview data")
      }
    } catch (error) {
      console.error("Error loading preview:", error)
      toast.error("Gagal memuat preview data")
    } finally {
      setLoading(false)
    }
  }

  // Step 4: Process export
  const processExport = async () => {
    setExporting(true)
    setExportResult(null) // Reset previous result
    
    // Hitung total rows yang akan diexport
    const estimatedTotal = selectAllPages ? totalCount : selectedRows.size
    
    // Setup progress tracking dengan timer incremental yang lebih realistis
    if (estimatedTotal > 0) {
      setExportProgress({ current: 0, total: estimatedTotal })

      // Estimasi waktu export berdasarkan jumlah data (lebih realistis)
      // Asumsi: ~100-500 rows per detik tergantung kompleksitas
      const estimatedSeconds = Math.max(2, Math.ceil(estimatedTotal / 200)) // Minimal 2 detik
      const targetProgress = Math.floor(estimatedTotal * 0.95) // Target 95% sebelum selesai
      const steps = estimatedSeconds * 5 // 5 update per detik = smooth animation
      const incrementPerStep = Math.ceil(targetProgress / steps)

      let stepCount = 0
      // Fake incremental progress selama proses export berjalan
      // Akan diset ke nilai sebenarnya ketika server selesai memproses
      exportProgressTimerRef.current = setInterval(() => {
        setExportProgress((prev) => {
          if (!prev.total) return prev
          stepCount++
          
          // Hitung progress berdasarkan waktu yang sudah berlalu
          const maxProgress = Math.min(
            targetProgress,
            stepCount * incrementPerStep
          )
          
          if (prev.current >= maxProgress) return prev
          
          // Update progress dengan increment yang lebih besar untuk lebih cepat
          const nextCurrent = Math.min(prev.current + incrementPerStep, maxProgress)
          return { ...prev, current: nextCurrent }
        })
      }, 200) // Update setiap 200ms untuk animasi halus
    } else {
      // Jika tidak tahu totalnya, tetap reset progres
      setExportProgress({ current: 0, total: 0 })
    }
    
    try {
      // Jika selectAllPages true, jangan kirim selectedNiks (biarkan API fetch semua data berdasarkan filter)
      // Jika selectAllPages false, kirim selectedNiks dari row yang dipilih
      let selectedNiks: string[] = []

      if (selectAllPages) {
        // Semua halaman dipilih - jangan kirim selectedNiks, biarkan API fetch semua data
        selectedNiks = []
      } else {
        // Ambil NIK dari row yang dipilih di halaman saat ini
        selectedNiks = Array.from(selectedRows)
          .map(idx => memberRows[idx]?.nik)
          .filter(nik => nik) // Filter NIK yang valid

        if (selectedNiks.length === 0) {
          toast.error("Tidak ada data yang dipilih untuk diexport")
          setExporting(false)
          return
        }
      }

      // Use POST request to avoid 431 error (Request Header Fields Too Large)
      // when sending large number of selectedNiks
      const url = new URL("/api/members/export", window.location.origin)

      // Only put small params in URL, large data goes in body
      url.searchParams.set("format", exportConfig.format)
      url.searchParams.set("includeHeader", String(exportConfig.includeHeader))
      url.searchParams.set("dateFormat", exportConfig.dateFormat)
      if (organizationId) url.searchParams.set("organizationId", String(organizationId))

      // Prepare request body with large data
      const requestBody: any = {
        format: exportConfig.format,
        includeHeader: exportConfig.includeHeader,
        dateFormat: exportConfig.dateFormat,
        organizationId: organizationId ? String(organizationId) : undefined,
        fields: exportConfig.selectedFields,
      }

      // Hanya kirim selectedNiks jika tidak selectAllPages
      if (!selectAllPages && selectedNiks.length > 0) {
        requestBody.selectedNiks = selectedNiks
      }

      // Kirim filter params agar API bisa fetch semua data yang sesuai filter
      const filterParams = getFilterParams()
      if (filterParams.groups?.length) requestBody.groups = filterParams.groups.join(",")
      if (filterParams.genders?.length) requestBody.genders = filterParams.genders.join(",")
      if (filterParams.agamas?.length) requestBody.agamas = filterParams.agamas.join(",")
      if (filterParams.status?.length && filterParams.status[0]) {
        requestBody.active = filterParams.status[0]
      }
      if (searchQuery) requestBody.search = searchQuery

      // Add timeout (5 minutes for large exports)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000) // 5 minutes

      try {
        console.log("[EXPORT] Starting export request (POST):", {
          url: url.toString(),
          selectedNiksCount: selectedNiks.length,
          format: exportConfig.format,
          fieldsCount: exportConfig.selectedFields.length
        })

        const res = await fetch(url.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          credentials: "same-origin",
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!res.ok) {
          // Try to get error message from response
          let errorMessage = `Export failed (Status: ${res.status} ${res.statusText})`

          try {
            // Clone response to read without consuming
            const clonedRes = res.clone()
            const contentType = res.headers.get("content-type") || ""

            if (contentType.includes("application/json")) {
              // API returns JSON error response
              const errorJson = await clonedRes.json()
              // Check if errorJson is empty or has no useful message
              if (errorJson && typeof errorJson === 'object' && Object.keys(errorJson).length > 0) {
                errorMessage = errorJson.message || errorJson.error || errorMessage
              } else if (errorJson && typeof errorJson === 'string') {
                errorMessage = errorJson
              } else {
                // If errorJson is empty or invalid, use status-based message
                if (res.status === 500) {
                  errorMessage = "Server error occurred. Please check server logs for details."
                } else if (res.status === 404) {
                  errorMessage = "Resource not found. Please check your request parameters."
                } else if (res.status === 403) {
                  errorMessage = "Access forbidden. You may not have permission to perform this action."
                } else if (res.status === 401) {
                  errorMessage = "Authentication required. Please log in again."
                } else {
                  errorMessage = `Request failed with status ${res.status}: ${res.statusText}`
                }
              }
              console.error("[EXPORT] API error response (JSON):", {
                status: res.status,
                statusText: res.statusText,
                error: errorJson,
                errorMessage
              })
            } else {
              // Read as text
              const errorText = await clonedRes.text()
              if (errorText && errorText.trim()) {
                errorMessage = errorText.length > 200
                  ? `${errorText.substring(0, 200)}...`
                  : errorText
              }
              console.error("[EXPORT] API error response (Text):", {
                status: res.status,
                statusText: res.statusText,
                errorText: errorText.substring(0, 500)
              })
            }
          } catch (parseError) {
            console.error("[EXPORT] Failed to parse error response:", parseError)
            // Keep default error message with status info
          }

          throw new Error(errorMessage)
        }

        // Get blob and create download link
        const blob = await res.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const fileName = `members-export-${new Date().toISOString().split("T")[0]}.${exportConfig.format}`

        // Trigger download
        const link = document.createElement("a")
        link.href = downloadUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)

        // Get count from selected rows atau totalCount jika selectAllPages
        const exportedCount = selectAllPages ? totalCount : selectedNiks.length

        // Set progress ke nilai sebenarnya setelah server selesai memproses
        // Pastikan progress sudah mendekati 100% sebelum set ke 100%
        if (estimatedTotal > 0) {
          // Clear timer utama dulu
          if (exportProgressTimerRef.current) {
            clearInterval(exportProgressTimerRef.current)
            exportProgressTimerRef.current = null
          }
          
          // Clear finish timer jika ada
          if (exportFinishTimerRef.current) {
            clearInterval(exportFinishTimerRef.current)
            exportFinishTimerRef.current = null
          }
          
          // Animate dari progress saat ini ke 100% dengan smooth transition
          // Gunakan setTimeout untuk mendapatkan current progress state
          setTimeout(() => {
            setExportProgress((prev) => {
              const currentProgress = prev.current
              const remaining = estimatedTotal - currentProgress
              
              if (remaining <= 0) {
                return { current: estimatedTotal, total: estimatedTotal }
              }
              
              // Buat finish timer untuk animasi smooth ke 100%
              const steps = Math.max(5, Math.min(20, Math.ceil(remaining / 10))) // 5-20 langkah
              const increment = Math.ceil(remaining / steps)
              let step = 0
              
              exportFinishTimerRef.current = setInterval(() => {
                step++
                setExportProgress((prevState) => {
                  const nextCurrent = Math.min(
                    prevState.current + increment,
                    estimatedTotal
                  )
                  
                  if (nextCurrent >= estimatedTotal || step >= steps) {
                    if (exportFinishTimerRef.current) {
                      clearInterval(exportFinishTimerRef.current)
                      exportFinishTimerRef.current = null
                    }
                    return { current: estimatedTotal, total: estimatedTotal }
                  }
                  
                  return { ...prevState, current: nextCurrent }
                })
              }, 50) // Update cepat untuk finish animation
              
              return prev // Return current state, finish timer akan handle update
            })
          }, 0)
        }

        setExportResult({
          success: true,
          fileName,
          exportedCount,
          message: "Export berhasil!",
        })

        toast.success("Export berhasil!")
        setCurrentStep(5)
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          throw new Error("Export timeout. Data terlalu banyak, silakan pilih data yang lebih sedikit atau coba lagi.")
        }
        throw fetchError
      }
    } catch (error: any) {
      console.error("Error exporting:", error)
      const errorMessage = error?.message || "Gagal melakukan export. Silakan coba lagi."
      setExportResult({
        success: false,
        message: errorMessage,
      })
      toast.error(errorMessage)
    } finally {
      setExporting(false)
      if (exportProgressTimerRef.current) {
        clearInterval(exportProgressTimerRef.current)
        exportProgressTimerRef.current = null
      }
      if (exportFinishTimerRef.current) {
        clearInterval(exportFinishTimerRef.current)
        exportFinishTimerRef.current = null
      }
    }
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (totalCount === 0) {
        toast.error("Tidak ada data untuk diexport")
        return
      }
      if (!selectAllPages && selectedRows.size === 0) {
        toast.error("Pilih minimal satu data member terlebih dahulu")
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (exportConfig.selectedFields.length === 0) {
        toast.error("Pilih minimal satu kolom untuk diexport")
        return
      }
      setCurrentStep(3)
      loadPreviewData()
    } else if (currentStep === 3) {
      setCurrentStep(4)
      // Don't auto-start export, wait for user to click "Start Export" button
    } else if (currentStep === 4) {
      // This step requires user to click "Start Export" button
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      // Allow going back from step 4 if not exporting
      if (currentStep === 4 && exporting) {
        return // Don't allow going back while exporting
      }
      setCurrentStep(currentStep - 1)
      // Reset export result when going back
      if (currentStep === 4) {
        setExportResult(null)
      }
    }
  }

  const toggleField = (fieldKey: string) => {
    setExportConfig(prev => ({
      ...prev,
      selectedFields: prev.selectedFields.includes(fieldKey)
        ? prev.selectedFields.filter(f => f !== fieldKey)
        : [...prev.selectedFields, fieldKey]
    }))
  }

  const canGoNext = () => {
    if (currentStep === 1) return totalCount > 0 && (selectAllPages || selectedRows.size > 0)
    if (currentStep === 2) return exportConfig.selectedFields.length > 0
    if (currentStep === 3) return true
    if (currentStep === 4) return false // User must click "Start Export" button
    return false
  }

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
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
            <Button variant="ghost" size="icon" aria-label="Kembali ke halaman members">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Export Data Member</h1>
            <p className="text-muted-foreground">
              Export data member ke file Excel atau CSV dengan proses bertahap
            </p>
          </div>
        </div>

        <Wizard
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          onNext={currentStep !== 4 ? handleNext : undefined}
          onPrevious={currentStep !== 4 ? handlePrevious : undefined}
          canGoNext={canGoNext()}
          canGoPrevious={currentStep > 1 && currentStep !== 4}
          showNavigation={currentStep !== 4}
        >
          {/* Step 1: Select Data */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filter
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Filter Button - 2-step seperti Supabase */}
                  <div className="space-y-2">
                    <Label>Filter</Label>
                    <Popover
                      open={showAddFilterPopover}
                      onOpenChange={(open) => {
                        setShowAddFilterPopover(open)
                        if (!open) {
                          setSelectedColumnForFilter(null)
                          setTempNewFilterValues([])
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          aria-label="Tambahkan filter baru"
                          aria-expanded={showAddFilterPopover}
                          aria-haspopup="dialog"
                        >
                          <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
                          {filters.length === 0 ? "Pick a column to filter by" : "Add filter"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[320px] p-0"
                        align="start"
                        role="dialog"
                        aria-label="Dialog pilih filter"
                        aria-describedby="filter-description"
                      >
                        <div id="filter-description" className="sr-only">
                          Pilih kolom untuk difilter, kemudian pilih nilai yang diinginkan
                        </div>
                        {!selectedColumnForFilter ? (
                          // Step 1: Pilih kolom
                          <Command role="combobox" aria-label="Pilih kolom filter">
                            <CommandInput placeholder="Cari kolom..." aria-label="Cari kolom untuk filter" />
                            <CommandList>
                              <CommandEmpty>Kolom tidak ditemukan</CommandEmpty>
                              <CommandGroup>
                                {getAvailableFilterColumns().map((column) => (
                                  <CommandItem
                                    key={column.key}
                                    onSelect={() => {
                                      selectColumnForFilter(column.key)
                                    }}
                                    aria-label={`Pilih kolom ${column.label} untuk filter`}
                                  >
                                    {column.label}
                                  </CommandItem>
                                ))}
                                {getAvailableFilterColumns().length === 0 && (
                                  <div className="p-4 text-center text-sm text-muted-foreground">
                                    Semua filter sudah ditambahkan
                                  </div>
                                )}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        ) : (
                          // Step 2: Pilih nilai + Apply button
                          <Command>
                            <div className="flex items-center justify-between px-3 py-2.5 border-b">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-muted"
                                  onClick={() => {
                                    setSelectedColumnForFilter(null)
                                    setTempNewFilterValues([])
                                  }}
                                  aria-label="Kembali ke pilihan kolom"
                                >
                                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                                </Button>
                                <span className="text-sm font-medium">
                                  {getFilterColumnConfig(selectedColumnForFilter)?.label || "Nilai"}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                className="h-7 px-3 text-xs"
                                onClick={applyNewFilter}
                                disabled={tempNewFilterValues.length === 0}
                                aria-label={`Terapkan filter dengan ${tempNewFilterValues.length} nilai yang dipilih`}
                                aria-disabled={tempNewFilterValues.length === 0}
                              >
                                Apply filter
                              </Button>
                            </div>
                            {getFilterColumnConfig(selectedColumnForFilter)?.options.length &&
                              getFilterColumnConfig(selectedColumnForFilter)!.options.length > 5 && (
                                <CommandInput
                                  placeholder={`Cari ${getFilterColumnConfig(selectedColumnForFilter)?.label.toLowerCase()}...`}
                                  className="h-9"
                                  aria-label={`Cari ${getFilterColumnConfig(selectedColumnForFilter)?.label.toLowerCase()}`}
                                />
                              )}
                            <CommandList className="max-h-[280px]">
                              <CommandEmpty role="status">Tidak ada pilihan</CommandEmpty>
                              <CommandGroup>
                                {loadingFilterOptions[selectedColumnForFilter] ? (
                                  <div className="flex items-center justify-center py-6" role="status" aria-live="polite" aria-busy="true">
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                    <span className="sr-only">Memuat opsi...</span>
                                  </div>
                                ) : (
                                  getFilterColumnConfig(selectedColumnForFilter)?.options.map((option) => {
                                    const checked = tempNewFilterValues.includes(option.value)
                                    return (
                                      <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        onSelect={() => {
                                          const newValues = checked
                                            ? tempNewFilterValues.filter(v => v !== option.value)
                                            : [...tempNewFilterValues, option.value]
                                          setTempNewFilterValues(newValues)
                                        }}
                                        className="flex items-center gap-2 py-2"
                                        aria-label={`${checked ? 'Hapus' : 'Pilih'} ${option.label}`}
                                      >
                                        <Checkbox
                                          checked={checked}
                                          onCheckedChange={(isChecked) => {
                                            const newValues = isChecked
                                              ? [...tempNewFilterValues, option.value]
                                              : tempNewFilterValues.filter(v => v !== option.value)
                                            setTempNewFilterValues(newValues)
                                          }}
                                          aria-label={`${checked ? 'Hapus' : 'Pilih'} ${option.label}`}
                                        />
                                        <span className="text-sm">{option.label}</span>
                                      </CommandItem>
                                    )
                                  })
                                )}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Active Filters */}
                  {filters.length > 0 && (
                    <div className="space-y-2">
                      <Label>Filter Aktif</Label>
                      <div className="flex flex-wrap gap-2">
                        {filters.map((filter) => {
                          const columnConfig = getFilterColumnConfig(filter.column)
                          const selectedLabels = filter.values
                            .map(val => {
                              if (filter.column === "group") {
                                const group = groups.find(g => String(g.id) === val)
                                return group?.name || val
                              }
                              return columnConfig?.options.find(opt => opt.value === val)?.label || val
                            })
                            .join(", ")

                          return (
                            <div key={filter.id} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-sm">{columnConfig?.label}:</span>
                                <span className="text-sm text-muted-foreground">
                                  {filter.values.length > 0 ? selectedLabels : "Pilih nilai..."}
                                </span>
                              </div>
                              <Popover open={editingFilterId === filter.id} onOpenChange={(open) => {
                                if (open) {
                                  setEditingFilterId(filter.id)
                                } else {
                                  setEditingFilterId(null)
                                }
                              }}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2"
                                    aria-label={`Edit filter ${columnConfig?.label}`}
                                    aria-expanded={editingFilterId === filter.id}
                                    aria-haspopup="dialog"
                                  >
                                    Edit
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-[300px] p-0"
                                  align="start"
                                  role="dialog"
                                  aria-label={`Edit filter ${columnConfig?.label}`}
                                >
                                  <Command role="combobox" aria-label={`Pilih nilai untuk ${columnConfig?.label}`}>
                                    <div className="px-3 py-2 border-b">
                                      <span className="text-sm font-medium">
                                        {columnConfig?.label || "Nilai"}
                                      </span>
                                    </div>

                                    {columnConfig && columnConfig.options.length > 5 && (
                                      <CommandInput
                                        placeholder={`Cari ${columnConfig.label.toLowerCase()}...`}
                                        aria-label={`Cari ${columnConfig.label.toLowerCase()}`}
                                      />
                                    )}
                                    <CommandList>
                                      <CommandEmpty role="status">Tidak ada pilihan</CommandEmpty>
                                      <CommandGroup>
                                        {loadingFilterOptions[filter.column] ? (
                                          <div className="flex items-center justify-center py-4" role="status" aria-live="polite" aria-busy="true">
                                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                            <span className="sr-only">Memuat opsi...</span>
                                          </div>
                                        ) : (
                                          columnConfig?.options.map((option) => {
                                            const checked = filter.values.includes(option.value)
                                            return (
                                              <CommandItem
                                                key={option.value}
                                                value={option.value}
                                                // Edit langsung - langsung update filter saat checkbox diubah
                                                onSelect={() => {
                                                  const newValues = checked
                                                    ? filter.values.filter(v => v !== option.value)
                                                    : [...filter.values, option.value]
                                                  updateFilterValues(filter.id, newValues)
                                                }}
                                                className="flex items-center gap-2"
                                                aria-label={`${checked ? 'Hapus' : 'Pilih'} ${option.label} untuk filter ${columnConfig?.label}`}
                                              >
                                                <Checkbox
                                                  checked={checked}
                                                  onCheckedChange={(isChecked) => {
                                                    const newValues = isChecked
                                                      ? [...filter.values, option.value]
                                                      : filter.values.filter(v => v !== option.value)
                                                    updateFilterValues(filter.id, newValues)
                                                  }}
                                                  aria-label={`${checked ? 'Hapus' : 'Pilih'} ${option.label}`}
                                                />
                                                {option.label}
                                              </CommandItem>
                                            )
                                          })
                                        )}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => removeFilter(filter.id)}
                                aria-label={`Hapus filter ${columnConfig?.label}`}
                              >
                                <X className="h-3 w-3" aria-hidden="true" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Data Member
                  </CardTitle>
                  <CardDescription>
                    Menampilkan {totalCount.toLocaleString()} row member berdasarkan filter
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading || loadingMembers ? (
                    <div className="flex items-center justify-center py-8" role="status" aria-live="polite" aria-busy="true">
                      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                      <span className="sr-only">Memuat data member...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Search - affects Data Member table */}
                      <div className="space-y-2">
                        <Label htmlFor="search-member">Search Member</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <Input
                            id="search-member"
                            placeholder="Cari nama, NIK, email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                            aria-label="Cari member berdasarkan nama, NIK, atau email"
                          />
                        </div>
                      </div>

                      {(searchQuery || filters.length > 0) && (
                        <Alert role="status" aria-live="polite">
                          <AlertCircle className="h-4 w-4" aria-hidden="true" />
                          <AlertDescription>
                            <strong>Filter Aktif:</strong>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              {searchQuery && <li>Search: &quot;{searchQuery}&quot;</li>}
                              {filters.map(filter => {
                                const columnConfig = getFilterColumnConfig(filter.column)
                                return (
                                  <li key={filter.id}>
                                    {columnConfig?.label}: {filter.values.length} nilai dipilih
                                  </li>
                                )
                              })}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {totalCount === 0 ? (
                        <Alert variant="destructive" role="alert">
                          <AlertCircle className="h-4 w-4" aria-hidden="true" />
                          <AlertDescription>
                            Tidak ada data member yang sesuai dengan filter. Silakan ubah filter atau kembali ke halaman member.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label id="data-member-label">Data Member ({totalCount.toLocaleString()} rows total, halaman {currentPage} dari {totalPages})</Label>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleSelectAll}
                                disabled={memberRows.length === 0}
                                aria-label={selectAllPages
                                  ? "Hapus semua pilihan (semua halaman)"
                                  : "Pilih semua data di semua halaman"}
                                aria-pressed={selectAllPages}
                              >
                                {selectAllPages
                                  ? "Hapus Semua"
                                  : "Pilih Semua"}
                              </Button>
                              {(selectAllPages || selectedRows.size > 0) && (
                                <Badge
                                  variant="secondary"
                                  role="status"
                                  aria-live="polite"
                                  aria-atomic="true"
                                >
                                  {selectAllPages ? `${totalCount.toLocaleString()} dipilih (semua halaman)` : `${selectedRows.size} dipilih`}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div
                            className="border rounded-lg overflow-auto custom-scrollbar"
                            style={{
                              maxHeight: '500px'
                            }}
                            role="region"
                            aria-labelledby="data-member-label"
                            aria-label="Tabel data member untuk export"
                          >
                            <Table
                              role="table"
                              aria-label="Tabel data member untuk export"
                              aria-rowcount={memberRows.length}
                              aria-colcount={17}
                            >
                              <TableHeader className="sticky top-0 bg-background z-10">
                                <TableRow role="row">
                                  <TableHead className="w-12" role="columnheader" scope="col">
                                    <span className="sr-only">Pilih baris</span>
                                    <Checkbox
                                      checked={selectAllPages || (selectedRows.size === memberRows.length && memberRows.length > 0)}
                                      onCheckedChange={toggleSelectAll}
                                      aria-label={selectAllPages ? "Semua halaman dipilih" : "Pilih semua baris di tabel"}
                                    />
                                  </TableHead>
                                  <TableHead className="whitespace-nowrap" role="columnheader" scope="col">NIK</TableHead>
                                  <TableHead className="whitespace-nowrap" role="columnheader" scope="col">Nama</TableHead>
                                  <TableHead className="whitespace-nowrap" role="columnheader" scope="col">Nickname</TableHead>
                                  <TableHead className="whitespace-nowrap" role="columnheader" scope="col">NISN</TableHead>
                                  <TableHead className="whitespace-nowrap" role="columnheader" scope="col">Jenis Kelamin</TableHead>
                                  <TableHead className="whitespace-nowrap" role="columnheader" scope="col">Tempat Lahir</TableHead>
                                  <TableHead className="whitespace-nowrap" role="columnheader" scope="col">Tanggal Lahir</TableHead>
                                  <TableHead className="whitespace-nowrap" role="columnheader" scope="col">Agama</TableHead>
                                  <TableHead className="whitespace-nowrap" role="columnheader" scope="col">Jalan</TableHead>
                                  <TableHead className="whitespace-nowrap" role="columnheader" scope="col">RT</TableHead>
                                  <TableHead className="whitespace-nowrap" role="columnheader" scope="col">RW</TableHead>
                                  <TableHead className="whitespace-nowrap" role="columnheader" scope="col">Dusun</TableHead>
                                  <TableHead className="whitespace-nowrap" role="columnheader" scope="col">Kelurahan</TableHead>
                                  <TableHead className="whitespace-nowrap" role="columnheader" scope="col">Kecamatan</TableHead>
                                  <TableHead className="whitespace-nowrap" role="columnheader" scope="col">No. Telepon</TableHead>
                                  <TableHead className="whitespace-nowrap" role="columnheader" scope="col">Email</TableHead>
                                  <TableHead className="whitespace-nowrap" role="columnheader" scope="col">Group</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody className="[&>tr:nth-child(even)]:bg-muted/50">
                                {memberRows.length === 0 ? (
                                  <TableRow role="row">
                                    <TableCell colSpan={17} className="text-center py-8 text-muted-foreground" role="gridcell">
                                      Tidak ada data
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  memberRows.map((row, idx) => (
                                    <TableRow key={idx} role="row" aria-rowindex={idx + 1}>
                                      <TableCell role="gridcell">
                                        <Checkbox
                                          checked={selectedRows.has(idx)}
                                          onCheckedChange={() => toggleRowSelection(idx)}
                                          aria-label={`Pilih baris ${idx + 1}, NIK: ${row.nik || 'tidak ada'}, Nama: ${row.nama || 'tidak ada'}`}
                                        />
                                      </TableCell>
                                      <TableCell className="whitespace-nowrap" role="gridcell">{row.nik || "-"}</TableCell>
                                      <TableCell className="whitespace-nowrap" role="gridcell">{row.nama || "-"}</TableCell>
                                      <TableCell className="whitespace-nowrap" role="gridcell">{row.nickname || "-"}</TableCell>
                                      <TableCell className="whitespace-nowrap" role="gridcell">{row.nisn || "-"}</TableCell>
                                      <TableCell className="whitespace-nowrap" role="gridcell">{row.jenis_kelamin || "-"}</TableCell>
                                      <TableCell className="whitespace-nowrap" role="gridcell">{row.tempat_lahir || "-"}</TableCell>
                                      <TableCell className="whitespace-nowrap" role="gridcell">{row.tanggal_lahir || "-"}</TableCell>
                                      <TableCell className="whitespace-nowrap" role="gridcell">{row.agama || "-"}</TableCell>
                                      <TableCell className="whitespace-nowrap" role="gridcell">{row.jalan || "-"}</TableCell>
                                      <TableCell className="whitespace-nowrap" role="gridcell">{row.rt || "-"}</TableCell>
                                      <TableCell className="whitespace-nowrap" role="gridcell">{row.rw || "-"}</TableCell>
                                      <TableCell className="whitespace-nowrap" role="gridcell">{row.dusun || "-"}</TableCell>
                                      <TableCell className="whitespace-nowrap" role="gridcell">{row.kelurahan || "-"}</TableCell>
                                      <TableCell className="whitespace-nowrap" role="gridcell">{row.kecamatan || "-"}</TableCell>
                                      <TableCell className="whitespace-nowrap" role="gridcell">{row.no_telepon || "-"}</TableCell>
                                      <TableCell className="whitespace-nowrap" role="gridcell">{row.email || "-"}</TableCell>
                                      <TableCell className="whitespace-nowrap" role="gridcell">{row.department_id || "-"}</TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                          {/* Pagination */}
                          {totalPages > 1 && (
                            <nav aria-label="Pagination untuk tabel data member" className="flex items-center justify-between mt-4 py-4 px-4 bg-muted/50 rounded-md border">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setCurrentPage(1)}
                                  disabled={currentPage === 1 || loadingMembers}
                                  className="h-8 w-8 p-0"
                                  title="First page"
                                  aria-label="Ke halaman pertama"
                                >
                                  <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                  disabled={currentPage === 1 || loadingMembers}
                                  className="h-8 w-8 p-0"
                                  title="Previous page"
                                  aria-label="Ke halaman sebelumnya"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <span className="text-sm text-muted-foreground">Page</span>

                                <input
                                  type="number"
                                  min="1"
                                  max={totalPages}
                                  value={currentPage}
                                  onChange={(e) => {
                                    const page = e.target.value ? Number(e.target.value) : 1
                                    const safe = Math.max(1, Math.min(page, totalPages))
                                    setCurrentPage(safe)
                                  }}
                                  className="w-12 h-8 px-2 border rounded text-sm text-center bg-background"
                                  disabled={loadingMembers || totalCount === 0}
                                  onKeyDown={(e) => {
                                    if (["-", "+", "e", "E", "."].includes(e.key)) {
                                      e.preventDefault();
                                    }
                                  }}
                                />

                                <span className="text-sm text-muted-foreground">/ {totalPages}</span>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                  disabled={currentPage === totalPages || loadingMembers}
                                  className="h-8 w-8 p-0"
                                  title="Next page"
                                  aria-label="Ke halaman berikutnya"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setCurrentPage(totalPages)}
                                  disabled={currentPage === totalPages || loadingMembers}
                                  className="h-8 w-8 p-0"
                                  title="Last page"
                                  aria-label="Ke halaman terakhir"
                                >
                                  <ChevronsRight className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-sm text-muted-foreground">
                                  Showing {totalCount > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString()} total records
                                </div>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={pageSize}
                                    onChange={(e) => {
                                      const newPageSize = Number(e.target.value)
                                      setPageSize(newPageSize)
                                      setCurrentPage(1) // Reset to first page when changing page size
                                    }}
                                    className="px-2 py-1 border rounded text-sm bg-background"
                                    disabled={loadingMembers}
                                  >
                                    <option value="100">100</option>
                                    <option value="500">500</option>
                                    <option value="1000">1000</option>
                                  </select>
                                </div>
                              </div>
                            </nav>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Configure Export */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Format Export</CardTitle>
                  <CardDescription>Pilih format file yang diinginkan</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={exportConfig.format}
                    onValueChange={(value) => setExportConfig(prev => ({ ...prev, format: value as ExportFormat }))}
                    aria-label="Pilih format file export"
                  >
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="xlsx" id="xlsx" aria-label="Format Excel" />
                      <Label htmlFor="xlsx" className="flex-1 cursor-pointer flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
                        <div>
                          <p className="font-medium">Excel (.xlsx)</p>
                          <p className="text-sm text-muted-foreground">Format Excel dengan multiple sheets</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="csv" id="csv" aria-label="Format CSV" />
                      <Label htmlFor="csv" className="flex-1 cursor-pointer flex items-center gap-2">
                        <FileText className="h-5 w-5" aria-hidden="true" />
                        <div>
                          <p className="font-medium">CSV (.csv)</p>
                          <p className="text-sm text-muted-foreground">Format CSV untuk kompatibilitas luas</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pilih Kolom</CardTitle>
                  <CardDescription>Pilih kolom yang akan disertakan dalam export</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {EXPORT_FIELDS.map((field) => (
                        <div key={field.key} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                          <Checkbox
                            id={field.key}
                            checked={exportConfig.selectedFields.includes(field.key)}
                            onCheckedChange={() => toggleField(field.key)}
                          />
                          <Label htmlFor={field.key} className="flex-1 cursor-pointer">
                            {field.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allFieldsSelected = exportConfig.selectedFields.length === EXPORT_FIELDS.length
                        setExportConfig(prev => ({ 
                          ...prev, 
                          selectedFields: allFieldsSelected ? [] : EXPORT_FIELDS.map(f => f.key)
                        }))
                      }}
                      aria-label={exportConfig.selectedFields.length === EXPORT_FIELDS.length 
                        ? "Hapus semua pilihan kolom" 
                        : "Pilih semua kolom untuk export"}
                    >
                      {exportConfig.selectedFields.length === EXPORT_FIELDS.length 
                        ? "Hapus Semua" 
                        : "Pilih Semua"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Opsi Tambahan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeHeader"
                      checked={exportConfig.includeHeader}
                      onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, includeHeader: checked as boolean }))}
                    />
                    <Label htmlFor="includeHeader" className="cursor-pointer">
                      Sertakan header kolom
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Preview Data */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preview Data</CardTitle>
                  <CardDescription>
                    Preview {previewData.length} baris pertama dari data yang akan diexport
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8" role="status" aria-live="polite" aria-busy="true">
                      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                      <span className="sr-only">Memuat preview data...</span>
                    </div>
                  ) : (
                    <ScrollArea className="w-full">
                      <Table
                        role="table"
                        aria-label="Preview data yang akan diexport"
                        aria-rowcount={previewData.length}
                        aria-colcount={exportConfig.selectedFields.length}
                      >
                        <TableHeader>
                          <TableRow role="row">
                            {exportConfig.selectedFields.map((fieldKey) => {
                              const field = EXPORT_FIELDS.find(f => f.key === fieldKey)
                              return (
                                <TableHead key={fieldKey} role="columnheader" scope="col">{field?.label || fieldKey}</TableHead>
                              )
                            })}
                          </TableRow>
                        </TableHeader>
                        <TableBody className="[&>tr:nth-child(even)]:bg-muted/50">
                          {previewData.length === 0 ? (
                            <TableRow role="row">
                              <TableCell colSpan={exportConfig.selectedFields.length} className="text-center py-8" role="gridcell">
                                Tidak ada data untuk ditampilkan
                              </TableCell>
                            </TableRow>
                          ) : (
                            previewData.map((row, idx) => (
                              <TableRow key={idx} role="row" aria-rowindex={idx + 1}>
                                {exportConfig.selectedFields.map((fieldKey) => (
                                  <TableCell key={fieldKey} role="gridcell">
                                    {row[fieldKey] ?? "-"}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Process Export */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ready to Export</CardTitle>
                  <CardDescription>
                    Review your configuration and click Export to start the process
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Format:</span> {exportConfig.format.toUpperCase()}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Selected Fields:</span>{" "}
                      {exportConfig.selectedFields.length} of {EXPORT_FIELDS.length}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Total Rows:</span> {selectAllPages ? totalCount.toLocaleString() : (selectedRows.size > 0 ? selectedRows.size.toLocaleString() : totalCount.toLocaleString())}
                    </p>
                    {exportConfig.includeHeader && (
                      <p className="text-sm">
                        <span className="font-medium">Include Header:</span> Yes
                      </p>
                    )}
                  </div>

                  {/* Progress bar saat proses export berjalan */}
                  {exporting && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Memproses export{" "}
                        <span className="font-semibold">
                          {selectAllPages ? totalCount.toLocaleString() : (selectedRows.size > 0 ? selectedRows.size.toLocaleString() : totalCount.toLocaleString())}
                        </span>{" "}
                        baris...
                      </p>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        {exportProgress.total > 0 ? (
                          <div
                            className="h-2 bg-primary transition-all duration-300 ease-out"
                            style={{
                              width: `${Math.min(
                                100,
                                (exportProgress.current / exportProgress.total) * 100 || 0
                              )}%`,
                            }}
                          />
                        ) : (
                          <>
                            <div className="h-full w-full bg-primary/20 rounded-full" />
                            <div className="h-full animate-progress-shimmer rounded-full" />
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {exportProgress.total > 0 
                          ? `${exportProgress.current.toLocaleString()} / ${exportProgress.total.toLocaleString()} baris (${Math.round((exportProgress.current / exportProgress.total) * 100)}%)`
                          : "Mohon tunggu, jangan tutup halaman ini"
                        }
                      </p>
                    </div>
                  )}

                  {exportResult && !exporting && (
                    <>
                      {exportResult.success ? (
                        <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription>
                            Export berhasil! {exportResult.exportedCount?.toLocaleString()} data berhasil diexport
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {exportResult.message || "Export gagal"}
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handlePrevious}
                      disabled={exporting}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={processExport}
                      disabled={exporting || (!selectAllPages && selectedRows.size === 0) || exportConfig.selectedFields.length === 0}
                      className="flex-1"
                      size="lg"
                    >
                      {exporting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Start Export
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 5: Result */}
          {currentStep === 5 && exportResult && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {exportResult.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" aria-hidden="true" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                    )}
                    {exportResult.success ? "Export Berhasil" : "Export Gagal"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {exportResult.success ? (
                    <>
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <p className="font-medium">File berhasil dibuat!</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          File: <strong>{exportResult.fileName}</strong>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total data: <strong>{exportResult.exportedCount?.toLocaleString()}</strong> member
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => router.push("/members")}
                          aria-label="Kembali ke halaman members"
                        >
                          Kembali ke Member
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentStep(1)}
                          aria-label="Mulai export baru"
                        >
                          Export Lagi
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Alert variant="destructive" role="alert">
                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                        <AlertDescription>
                          {exportResult.message || "Terjadi kesalahan saat melakukan export"}
                        </AlertDescription>
                      </Alert>
                      <div className="flex gap-2">
                        <Button
                          asChild
                          aria-label="Kembali ke halaman members"
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
                            Kembali ke Member
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentStep(1)}
                          aria-label="Coba export lagi"
                        >
                          Coba Lagi
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </Wizard>
      </div>
    </div>
  )
}

