"use client"

import React, { useRef, useState } from "react"
import { useRouter } from "next/navigation"
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

// Mapping kolom Excel ke kolom tabel group
const DATABASE_FIELDS = [
  { key: "code", label: "Code", required: false },
  { key: "name", label: "Name", required: true },
  { key: "description", label: "Description", required: false },
  { key: "is_active", label: "Active Status", required: false },
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

export default function GroupImportPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  const importProgressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [headerRow, setHeaderRow] = useState<number>(0) // 0 = auto-detect
  const [headerRowCount, setHeaderRowCount] = useState<number>(1)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [sheetName, setSheetName] = useState<string>("")
  const [allowMatchingWithSubfields, setAllowMatchingWithSubfields] = useState(true)
  const [testSummary, setTestSummary] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)
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

  const handleFileSelect = async (selectedFile: File, sheetOverride?: string) => {
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
    setHasTested(false) // Reset test status ketika file baru
    setImportSummary(null)
    setImportResults([])

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      // If sheet is being changed, reset headerRow to 0 for auto-detect
      // Otherwise use current headerRow (which might be from previous auto-detect)
      const shouldAutoDetect = sheetOverride !== undefined && sheetOverride !== sheetName
      const headerRowToUse = shouldAutoDetect ? 0 : (headerRow || 0)
      formData.append("headerRow", String(headerRowToUse))
      formData.append("headerRowCount", String(headerRowCount || 1))
      const chosenSheet = sheetOverride || sheetName
      if (chosenSheet) {
        formData.append("sheetName", chosenSheet)
      }

      const response = await fetch("/api/group/import/headers", {
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
      // Only update sheetName if it's not being overridden (to preserve user selection)
      if (!sheetOverride) {
        setSheetName(data.sheetName || data.sheetNames?.[0] || "")
      } else {
        // Keep the selected sheet name
        setSheetName(sheetOverride)
      }

      // Show success message with auto-detect info
      if (data.autoDetected) {
        toast.success(`Header row otomatis terdeteksi di baris ${data.headerRow}. File berhasil dimuat!`)
      } else {
        toast.success(`Excel file loaded. Found ${data.totalRows || 0} rows and ${data.headers.length} columns`)
      }

      //komentar
      // Auto-map kolom umum ke field group
      const autoMapping: ColumnMapping = {}
      DATABASE_FIELDS.forEach((field) => {
        const matchingHeader = data.headers.find((header: string) => {
          const headerLower = header.toLowerCase().trim()
          const fieldLower = field.label.toLowerCase()

          return (
            headerLower === fieldLower ||
            headerLower.includes(fieldLower) ||
            fieldLower.includes(headerLower) ||
            (field.key === "code" && (headerLower.includes("code") || headerLower.includes("kode"))) ||
            (field.key === "name" && (headerLower.includes("name") || headerLower.includes("nama"))) ||
            (field.key === "description" && (headerLower.includes("description") || headerLower.includes("deskripsi"))) ||
            (field.key === "is_active" && (headerLower.includes("active") || headerLower.includes("status") || headerLower.includes("aktif")))
          )
        })

        autoMapping[field.key] = matchingHeader || null
      })

      setMapping(autoMapping)
    } catch (error) {
      console.error("Error reading Excel:", error)
      toast.error("Failed to read Excel file")
      setFile(null)
    } finally {
      setLoading(false)
    }
  }

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
    // Minimal Name atau Code harus diisi
    if (!mapping.name && !mapping.code) {
      toast.error("Please map either Name or Code column (at least one is required)")
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

      const response = await fetch("/api/group/import/process", {
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
          // Batasi maksimum sebelum selesai agar masih ada ruang untuk loncat ke nilai akhir
          const maxDuringProcessing = Math.max(prev.total - 1, 1)
          if (prev.current >= maxDuringProcessing) return prev

          const increment = Math.max(1, Math.floor(prev.total / 50)) // ~50 langkah
          const nextCurrent = Math.min(prev.current + increment, maxDuringProcessing)
          return { ...prev, current: nextCurrent }
        })
      }, 300)
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

      const response = await fetch("/api/group/import/process", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.message || "Import failed")
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

      // Clear all groups cache to force refresh after import
      if (summary.success > 0) {
        if (typeof window !== 'undefined') {
          const keys = Object.keys(localStorage)
          keys.forEach(key => {
            if (key.startsWith('groups:')) {
              localStorage.removeItem(key)
              console.log('[IMPORT] Cleared cache:', key)
            }
          })
        }
        toast.success(`Import completed! ${summary.success} groups imported successfully. Cache cleared.`)
      } else if (summary.failed > 0) {
        toast.error(`Import failed. ${summary.failed} errors occurred.`)
      }

      // Bentuk hasil per baris dari preview + error summary
      const results = preview.map((rowData, index) => {
        const rowNumber = index + 2 // 1 baris header + index 1-based
        const error = summary.errors.find((err: any) => err.row === rowNumber)

        return {
          row: rowNumber,
          data: rowData,
          status: error ? "failed" as const : "success" as const,
          error: error?.message,
        }
      })

      setImportResults(results)

      setCurrentStep(5)
    } catch (error) {
      console.error("Error importing groups:", error)
      toast.error("Failed to import data")
    } finally {
      setProcessing(false)
      // Clear progress timer
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
      setCurrentStep(4) // Go to Import step
    } else if (currentStep === 4) {
      // tombol Import yang menjalankan proses
    } else if (currentStep === 5) {
      router.push("/group")
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canGoNext = () => {
    if (currentStep === 1) return !!file
    if (currentStep === 2) return validateMapping() // Mapping step - just need valid mapping
    if (currentStep === 3) return hasTested // Test step - must have tested
    if (currentStep === 4) return false // Import step - button handles it
    if (currentStep === 5) return true // Result step
    return false
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Import Groups</h1>
          <p className="text-muted-foreground">
            Import data group dari file Excel atau CSV dengan proses bertahap.
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
                  className={`w-full p-12 border-2 border-dashed rounded-lg transition-colors ${
                    isDragActive ? "bg-primary/5 border-primary" : "border-muted"
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
                  href="/templates/group-import-template.xlsx"
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
                              setSheetName(value)
                              setHasTested(false) // Reset test status ketika sheet berubah
                              // Reset headerRow to 0 for auto-detect when sheet changes
                              setHeaderRow(0)
                              if (file) handleFileSelect(file, value)
                            }}
                            disabled={!sheetNames.length || loading}
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
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No file selected</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-10 pb-6">
                  <h2 className="font-semibold text-lg">Advanced</h2>

                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="allow-matching"
                        checked={allowMatchingWithSubfields}
                        onCheckedChange={(checked) => setAllowMatchingWithSubfields(checked === true)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="allow-matching" className="text-sm cursor-pointer leading-relaxed">
                        Allow matching with subfields
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t space-y-4">
                  <Alert className="border-blue-500/50 bg-blue-500/5">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription>
                      Mapping kolom Excel ke field group. Minimal Name atau Code harus diisi.
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
                      disabled={!file || processing || (!mapping.name && !mapping.code)}
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
                                    const message =
                                      typeof error === "string"
                                        ? error
                                        : typeof error === "object" && error !== null
                                          ? (error as any).message || JSON.stringify(error)
                                          : String(error)
                                    return <li key={idx} className="text-destructive">{message}</li>
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
                  {importProgress.total > 0 && (
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
                            width: `${
                              Math.min(
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
                      disabled={processing || (!mapping.name && !mapping.code)}
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
                                                {result.error && (
                                                  <span className="text-xs text-red-500 mt-0.5 whitespace-normal">
                                                    {result.error}
                                                  </span>
                                                )}
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

                      <div className="flex gap-2">
                        <Button onClick={() => router.push("/group")} className="flex-1">
                          Back to Groups Page
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
      </div>
    </div>
  )
}
