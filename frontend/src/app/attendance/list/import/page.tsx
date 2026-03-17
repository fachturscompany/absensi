"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useOrgStore } from "@/store/org-store"
import { FileText, X, Download, Loader2, CheckCircle2, AlertCircle, Upload } from "lucide-react"
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

// Mapping kolom Excel ke kolom tabel attendance_records
const DATABASE_FIELDS = [
  { key: "nik", label: "NIK", required: true },
  { key: "attendance_date", label: "Tanggal Kehadiran", required: true },
  { key: "check_in_time", label: "Waktu Check In", required: false },
  { key: "check_out_time", label: "Waktu Check Out", required: false },
  { key: "status", label: "Status", required: false }, // present, late, absent, excused, leave
  { key: "validation_status", label: "Validation Status", required: false }, // pending, approved, rejected
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

export default function AttendanceImportPage() {
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
  const [selectedCheckInMethod, setSelectedCheckInMethod] = useState<string>("")
  const isProcessingSheetChangeRef = useRef(false)
  const previousSheetNameRef = useRef<string>("")
  const importProgressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [testSummary, setTestSummary] = useState<{
    success: number
    failed: number
    errors: Array<{ row: number; message: string }>
  } | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [hasTested, setHasTested] = useState(false)
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

  const handleFileSelect = useCallback(async (selectedFile: File, sheetOverride?: string) => {
    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error("Silakan upload file Excel atau CSV (.xlsx, .xls, atau .csv)")
      return
    }

    setFile(selectedFile)
    setLoading(true)
    setExcelHeaders([])
    setPreview([])
    setMapping({})
    setTestSummary(null)
    setHasTested(false)
    setImportSummary(null)
    setImportResults([])

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("headerRow", String(headerRow || 0))
      formData.append("headerRowCount", String(headerRowCount || 1))
      const chosenSheet = sheetOverride || sheetName
      if (chosenSheet) {
        formData.append("sheetName", chosenSheet)
      }

      const response = await fetch("/api/attendance/import/headers", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.message || "Gagal membaca file Excel")
        setFile(null)
        return
      }

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
      if (!sheetOverride) {
        setSheetName(data.sheetName || data.sheetNames?.[0] || "")
      }

      if (data.autoDetected) {
        toast.success(`Header row otomatis terdeteksi di baris ${data.headerRow}. File berhasil dimuat!`)
      } else {
        toast.success(`File Excel dimuat. Ditemukan ${data.totalRows} baris dan ${data.headers.length} kolom`)
      }

      // Auto-map kolom
      const autoMapping: ColumnMapping = {}
      const usedHeaders = new Set<string>()

      const matchPatterns: Record<string, (h: string) => boolean> = {
        nik: (h: string) => /^nik$/i.test(h) || /^nipd$/i.test(h),
        attendance_date: (h: string) => /^tanggal/i.test(h) || /^date$/i.test(h) || /^tgl$/i.test(h),
        check_in_time: (h: string) => /^check\s*in/i.test(h) || /^masuk/i.test(h) || /^jam\s*masuk/i.test(h),
        check_out_time: (h: string) => /^check\s*out/i.test(h) || /^pulang/i.test(h) || /^jam\s*pulang/i.test(h),
        status: (h: string) => /^status$/i.test(h) || /^kehadiran$/i.test(h),
        validation_status: (h: string) => /^validation\s*status$/i.test(h) || /^status\s*validasi$/i.test(h) || /^validasi$/i.test(h),
      }

      DATABASE_FIELDS.forEach((field) => {
        const fieldNormalized = field.label.toLowerCase().trim().replace(/[-_\s]/g, "")
        const exactMatch = data.headers.find((header: string) => {
          if (!header || header.trim().length === 0) return false
          if (usedHeaders.has(header)) return false
          const headerNormalized = header.toLowerCase().trim().replace(/[-_\s]/g, "")
          return headerNormalized === fieldNormalized
        })

        if (exactMatch) {
          autoMapping[field.key] = exactMatch
          usedHeaders.add(exactMatch)
        } else {
          const matcher = matchPatterns[field.key]
          if (matcher) {
            const matchingHeader = data.headers.find((header: string) => {
              if (!header || header.trim().length === 0) return false
              if (usedHeaders.has(header)) return false
              return matcher(header.toLowerCase().trim())
            })

            if (matchingHeader) {
              autoMapping[field.key] = matchingHeader
              usedHeaders.add(matchingHeader)
            } else {
              autoMapping[field.key] = null
            }
          } else {
            autoMapping[field.key] = null
          }
        }
      })

      setMapping(autoMapping)
    } catch (error) {
      console.error("Error reading Excel:", error)
      toast.error("Gagal membaca file Excel")
      setFile(null)
    } finally {
      setLoading(false)
    }
  }, [headerRow, headerRowCount, sheetName])

  useEffect(() => {
    if (!file || isProcessingSheetChangeRef.current || sheetName === previousSheetNameRef.current) {
      return
    }

    if (!previousSheetNameRef.current && sheetName) {
      previousSheetNameRef.current = sheetName
      return
    }

    if (sheetName && sheetName !== previousSheetNameRef.current) {
      isProcessingSheetChangeRef.current = true
      previousSheetNameRef.current = sheetName

      handleFileSelect(file, sheetName).finally(() => {
        isProcessingSheetChangeRef.current = false
      })
    }
  }, [sheetName, file, handleFileSelect])

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
      toast.error("Silakan map kolom NIK (wajib)")
      return false
    }
    if (!mapping.attendance_date) {
      toast.error("Silakan map kolom Tanggal Kehadiran (wajib)")
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
      formData.append("headerRow", String(headerRow > 0 ? headerRow : 1))
      formData.append("headerRowCount", String(headerRowCount || 1))
      formData.append("allowMatchingWithSubfields", String(allowMatchingWithSubfields))
      if (sheetName) formData.append("sheetName", sheetName)
      if (selectedCheckInMethod) formData.append("checkInMethod", selectedCheckInMethod)
      if (organizationId) formData.append("organization_id", String(organizationId))

      const response = await fetch("/api/attendance/import/process", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.message || "Test gagal")
        return
      }

      const summary = data.summary || { success: 0, failed: 0, errors: [] }
      setTestSummary(summary)
      setHasTested(true)

      if (summary.failed > 0) {
        toast.warning(`Test selesai: ${summary.success} berhasil, ${summary.failed} gagal`)
      } else {
        toast.success(`Test berhasil: ${summary.success} baris valid`)
      }
    } catch (error) {
      console.error("Error testing:", error)
      toast.error("Gagal melakukan test")
    } finally {
      setProcessing(false)
    }
  }

  const handleImport = async () => {
    if (!file || !validateMapping()) return

    if (!hasTested) {
      toast.error("Silakan lakukan test terlebih dahulu")
      return
    }

    setShowConfirmDialog(true)
  }

  const confirmImport = async () => {
    setShowConfirmDialog(false)
    setCurrentStep(4)
    setProcessing(true)
    setImportProgress({ current: 0, total: totalRows })

    // Start progress simulation
    if (importProgressTimerRef.current) {
      clearInterval(importProgressTimerRef.current)
    }
    const timer = setInterval(() => {
      setImportProgress((prev) => {
        if (prev.current >= prev.total) {
          clearInterval(timer)
          return prev
        }
        return { ...prev, current: Math.min(prev.current + 1, prev.total) }
      })
    }, 100)

    importProgressTimerRef.current = timer

    try {
      if (!file) {
        toast.error("File tidak ditemukan")
        return
      }
      const formData = new FormData()
      formData.append("file", file)
      formData.append("mapping", JSON.stringify(mapping))
      formData.append("mode", "import")
      formData.append("headerRow", String(headerRow > 0 ? headerRow : 1))
      formData.append("headerRowCount", String(headerRowCount || 1))
      formData.append("allowMatchingWithSubfields", String(allowMatchingWithSubfields))
      if (sheetName) formData.append("sheetName", sheetName)
      if (selectedCheckInMethod) formData.append("checkInMethod", selectedCheckInMethod)
      if (organizationId) formData.append("organization_id", String(organizationId))

      const response = await fetch("/api/attendance/import/process", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (importProgressTimerRef.current) {
        clearInterval(importProgressTimerRef.current)
        importProgressTimerRef.current = null
      }

      if (!data.success) {
        toast.error(data.message || "Import gagal")
        setImportProgress({ current: 0, total: 0 })
        return
      }

      setImportProgress({ current: totalRows, total: totalRows })
      const summary = data.summary || { success: 0, failed: 0, errors: [] }
      setImportSummary(summary)

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

      if (summary.failed > 0) {
        toast.warning(`Import selesai: ${summary.success} berhasil, ${summary.failed} gagal`)
      } else {
        toast.success(`Import berhasil: ${summary.success} baris diimpor`)
      }
    } catch (error) {
      console.error("Error importing:", error)
      toast.error("Gagal melakukan import")
      if (importProgressTimerRef.current) {
        clearInterval(importProgressTimerRef.current)
        importProgressTimerRef.current = null
      }
      setImportProgress({ current: 0, total: 0 })
    } finally {
      setProcessing(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!file) {
        toast.error("Silakan pilih file terlebih dahulu")
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (!validateMapping()) return
      setCurrentStep(3)
    } else if (currentStep === 3) {
      if (!hasTested) {
        toast.error("Silakan lakukan test terlebih dahulu")
        return
      }
      setCurrentStep(4)
    } else if (currentStep === 5) {
      router.prefetch("/attendance/list")
      router.push("/attendance/list")
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canGoNext = () => {
    if (currentStep === 1) return !!file
    if (currentStep === 2) return !!mapping.nik && !!mapping.attendance_date
    if (currentStep === 3) return hasTested
    if (currentStep === 4) return false // Import step - button handles it
    if (currentStep === 5) return true // Result step
    return false
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Import Attendance</h1>
          <p className="text-muted-foreground">
            Import data kehadiran dari file Excel atau CSV dengan proses bertahap.
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
                            href="/templates/attendance-import-template.xlsx"
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
                          setHasTested(false)
                          setImportSummary(null)
                          setImportResults([])
                          setSelectedCheckInMethod("")
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ""
                          }
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

                        {sheetNames.length > 0 && (
                          <div className="space-y-2 pb-2">
                            <Label htmlFor="sheet" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Sheet
                            </Label>
                            <Select
                              value={sheetName || sheetNames[0] || ""}
                              onValueChange={(value) => {
                                if (value !== sheetName) {
                                  setSheetName(value)
                                  setHasTested(false)
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
                        )}

                        <div className="space-y-2 pb-2">
                          <Label htmlFor="check-in-method-select" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Check In Method (Opsional)
                          </Label>
                          <Select
                            value={selectedCheckInMethod || "none"}
                            onValueChange={(value) => {
                              const newValue = value === "none" ? "" : value
                              if (newValue !== selectedCheckInMethod) {
                                setSelectedCheckInMethod(newValue)
                                setHasTested(false)
                              }
                            }}
                          >
                            <SelectTrigger id="check-in-method-select" className="w-full">
                              <SelectValue placeholder="Pilih check in method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">-- Tidak Dipilih --</SelectItem>
                              <SelectItem value="face_recognition_kiosk">Face Recognition Kiosk</SelectItem>
                              <SelectItem value="FINGERPRINT">Fingerprint</SelectItem>
                              <SelectItem value="MANUAL">Manual</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Jika dipilih, semua data attendance yang di-import akan menggunakan method ini
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
                      Mapping kolom Excel ke field attendance. NIK dan Tanggal Kehadiran harus diisi.
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
                              const previewValue = preview.length > 0 && preview[0]?.[header] ? preview[0][header] : null

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
                                          setHasTested(false)
                                        } else {
                                          const newMapping = { ...mapping }
                                          Object.keys(newMapping).forEach((key) => {
                                            if (newMapping[key] === header && key !== value) {
                                              delete newMapping[key]
                                            }
                                          })
                                          newMapping[value] = header
                                          setMapping(newMapping)
                                          setHasTested(false)
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="w-full max-w-[280px]">
                                        <SelectValue placeholder="-- Tidak dipilih --" />
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
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96">
                    <p className="text-muted-foreground">No headers found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Test */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Test Data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Uji data sebelum melakukan import
                </p>
              </div>

              {preview.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No</TableHead>
                          {excelHeaders.slice(0, 10).map((header) => (
                            <TableHead key={header}>{header}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.slice(0, 5).map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{idx + 1}</TableCell>
                            {excelHeaders.slice(0, 10).map((header) => (
                              <TableCell key={header}>
                                {row[header] || "-"}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <Button
                onClick={handleTest}
                disabled={processing || !file}
                className="w-full"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengetes...
                  </>
                ) : (
                  "Test Data"
                )}
              </Button>

              {testSummary && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p>
                        <strong>Berhasil:</strong> {testSummary.success} baris
                      </p>
                      <p>
                        <strong>Gagal:</strong> {testSummary.failed} baris
                      </p>
                      {testSummary.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium text-red-600">Error:</p>
                          <ul className="list-disc list-inside text-sm text-red-600">
                            {testSummary.errors.slice(0, 5).map((error, idx) => (
                              <li key={idx}>
                                Baris {error.row}: {error.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}


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
                      disabled={processing || !mapping.nik || !mapping.attendance_date}
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
          {currentStep === 5 && importSummary && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Import Complete</CardTitle>
                  <CardDescription>Summary of the import process</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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



                  {/* Import Results Table */}
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
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      asChild
                      className="flex-1"
                    >
                      <Link
                        href="/attendance/list"
                        prefetch={true}
                      >
                        Kembali ke Daftar
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
                        setSelectedCheckInMethod("")
                      }}
                    >
                      Import Lagi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </Wizard>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Import</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mengimpor {totalRows} baris data kehadiran?
              Data yang sudah ada dengan tanggal yang sama akan diupdate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>Import</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

