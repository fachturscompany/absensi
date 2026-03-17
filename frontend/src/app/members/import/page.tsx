"use client"

import React, { useRef, useState } from "react"
import { CloudUpload, Loader2, FileText, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wizard, WizardStep } from "@/components/ui/wizard"
import { toast } from "sonner"

const DATABASE_FIELDS = [
  { key: "email", label: "Email", required: true, description: "Email address (required)" },
  { key: "full_name", label: "Full Name", required: false, description: "Complete name" },
  { key: "phone", label: "Phone Number", required: false, description: "Phone or mobile number" },
  { key: "department", label: "Department/Group", required: false, description: "Department or group name" },
  { key: "position", label: "Position", required: false, description: "Job title or position" },
  { key: "role", label: "Role", required: false, description: "User role (e.g., User, Admin)" },
  { key: "status", label: "Status", required: false, description: "Member status (Active/Inactive)" },
] as const

type ColumnMapping = {
  [key: string]: string | null
}

const WIZARD_STEPS: WizardStep[] = [
  { number: 1, title: "Upload File", description: "Select your Excel file" },
  { number: 2, title: "Mapping & Test", description: "Map columns and preview data" },
  { number: 3, title: "Import", description: "Complete the import process" },
]

export default function MembersImportPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [excelHeaders, setExcelHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [loading, setLoading] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const [importSummary, setImportSummary] = useState<{
    success: number
    failed: number
    errors: Array<{ row: number; message: string }>
  } | null>(null)
  const [testSummary, setTestSummary] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)
  const allowMatchingWithSubfields = true // Default: allow subfield matching enabled
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Please upload an Excel file (.xlsx or .xls)")
      return
    }

    setFile(selectedFile)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

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

      setExcelHeaders(data.headers || [])
      setPreview(data.preview || [])
      setTotalRows(data.totalRows || 0)

      // Auto-map common column names
      const autoMapping: ColumnMapping = {}
      DATABASE_FIELDS.forEach((field) => {
        const matchingHeader = data.headers.find((header: string) => {
          const headerLower = header.toLowerCase().trim()
          const fieldLower = field.label.toLowerCase()

          return (
            headerLower === fieldLower ||
            headerLower.includes(fieldLower) ||
            fieldLower.includes(headerLower) ||
            (field.key === "email" && (headerLower.includes("email") || headerLower.includes("surel"))) ||
            (field.key === "phone" && (headerLower.includes("phone") || headerLower.includes("telepon") || headerLower.includes("hp"))) ||
            (field.key === "full_name" && (headerLower.includes("name") || headerLower.includes("nama"))) ||
            (field.key === "department" && (headerLower.includes("department") || headerLower.includes("group") || headerLower.includes("departemen"))) ||
            (field.key === "position" && (headerLower.includes("position") || headerLower.includes("jabatan"))) ||
            (field.key === "role" && (headerLower.includes("role") || headerLower.includes("peran")))
          )
        })

        autoMapping[field.key] = matchingHeader || null
      })

      setMapping(autoMapping)
      setTestSummary(null) // Reset test summary when new file is loaded
      setCurrentStep(2)
      toast.success(`Excel file loaded. Found ${data.totalRows} rows and ${data.headers.length} columns`)
    } catch (error) {
      console.error("Error reading Excel:", error)
      toast.error("Failed to read Excel file")
      setFile(null)
    } finally {
      setLoading(false)
    }
  }

  const validateMapping = () => {
    if (!mapping.email) {
      toast.error("Please map the Email column (required)")
      return false
    }
    return true
  }

  const runImport = async (mode: "test" | "import") => {
    if (!file || !validateMapping()) return

    // Only go to step 3 for actual import, not for test
    if (mode === "import") {
      setCurrentStep(3)
    }
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("mapping", JSON.stringify(mapping))
      formData.append("mode", mode)
      formData.append("allowMatchingWithSubfields", String(allowMatchingWithSubfields))

      const response = await fetch("/api/members/import/process", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.message || (mode === "test" ? "Test import failed" : "Import failed"))
        if (mode === "import") {
          setCurrentStep(2)
        }
        return
      }

      const summary = data.summary || { success: 0, failed: 0, errors: [] }

      if (mode === "test") {
        // komentar
        // Hanya validasi, tidak ada perubahan data
        // Jangan set importSummary untuk test, hanya set testSummary
        setImportSummary(null) // Reset import summary untuk test
        setTestSummary({
          success: summary.success,
          failed: summary.failed,
          errors: summary.errors,
        })
        if (summary.failed > 0) {
          toast.error(
            `Test completed. Valid rows: ${summary.success}, Invalid rows: ${summary.failed}. Check error details below.`
          )
        } else {
          toast.success(
            `Test completed. All ${summary.success} rows are valid and ready to import.`
          )
        }
        // Tetap di step 2 untuk test
      } else {
        // Mode import: set importSummary dan tidak set testSummary
        setImportSummary(summary)
        if (summary.success > 0) {
          // Clear all members cache to force refresh after import
          if (typeof window !== 'undefined') {
            const keys = Object.keys(localStorage)
            keys.forEach(key => {
              if (key.startsWith('members:')) {
                localStorage.removeItem(key)
                console.log('[IMPORT] Cleared cache:', key)
              }
            })
          }
          toast.success(`Import completed! Success: ${summary.success}, Failed: ${summary.failed}. Cache cleared - please refresh members page.`)
        } else {
          toast.error(`Import failed. ${summary.errors.length} errors occurred.`)
        }
      }
    } catch (error) {
      console.error("Error processing import:", error)
      toast.error(mode === "test" ? "Failed to run test import" : "Failed to process import")
      if (mode === "import") {
        setCurrentStep(2)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (file) {
        setCurrentStep(2)
      } else {
        toast.error("Please select a file first")
      }
    } else if (currentStep === 2) {
      if (validateMapping()) {
        // Lanjut ke step 3 untuk import
        setCurrentStep(3)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      const previousStep = currentStep - 1
      setCurrentStep(previousStep)
      // Reset test summary when going back from step 2
      if (currentStep === 2) {
        setTestSummary(null)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Wizard
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          onNext={handleNext}
          onPrevious={handlePrevious}
          canGoNext={
            currentStep === 1
              ? !!file
              : currentStep === 2
                ? validateMapping() && testSummary !== null && testSummary.failed === 0
                : false
          }
          canGoPrevious={currentStep > 1 && !loading}
          showNavigation={currentStep !== 3}
        >
          {/* Step 1: Upload File */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div
                className={`flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-muted"
                  }`}
                onDragEnter={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDragActive(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDragActive(false)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDragActive(false)
                  const droppedFile = e.dataTransfer.files?.[0]
                  if (droppedFile) handleFileSelect(droppedFile)
                }}
                onClick={() => !loading && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0]
                    if (selectedFile) handleFileSelect(selectedFile)
                  }}
                  disabled={loading}
                />

                {loading ? (
                  <>
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Reading Excel file...</p>
                  </>
                ) : (
                  <>
                    <CloudUpload className="h-12 w-12 text-muted-foreground" />
                    <div className="text-center space-y-1">
                      <p className="text-base font-semibold">Drag & drop your Excel file here</p>
                      <p className="text-sm text-muted-foreground">
                        or click to choose a file from your computer
                      </p>
                    </div>
                  </>
                )}
              </div>

              {file && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    File selected: <strong>{file.name}</strong>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground pt-2">
                <p>Need a starter format? Download the official members import template.</p>
                <a
                  href="/templates/members-import-template.xlsx"
                  download
                  className="text-blue-600 hover:underline font-semibold dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Download Template
                </a>
              </div>
            </div>
          )}

          {/* Step 2: Mapping & Test */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Loading state saat test import */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 border-2 border-dashed rounded-lg bg-muted/30">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-lg font-medium">Processing test...</p>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we validate your data
                  </p>
                </div>
              )}

              {!loading && (
                <>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Map Excel columns to database fields. Unmapped fields will be skipped.
                      <strong className="ml-1">Email is required.</strong>
                    </AlertDescription>
                  </Alert>

                  {/* Data Preview */}
                  {preview.length > 0 && (
                    <div className="border rounded-lg">
                      <div className="p-3 bg-muted/50 border-b">
                        <p className="text-sm font-medium">
                          Data Preview (showing first {preview.length} of {totalRows} rows)
                        </p>
                      </div>
                      <ScrollArea className="h-48">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {excelHeaders.map((header) => (
                                <TableHead key={header} className="text-xs">
                                  {header}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody className="[&>tr:nth-child(even)]:bg-muted/50">
                            {preview.map((row, idx) => (
                              <TableRow key={idx}>
                                {excelHeaders.map((header) => (
                                  <TableCell key={header} className="text-xs">
                                    {String(row[header] || "")}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Mapping Table */}
                  <div className="border rounded-lg">
                    <ScrollArea className="max-h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[300px]">File Column</TableHead>
                            <TableHead>Database Field</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="[&>tr:nth-child(even)]:bg-muted/50">
                          {excelHeaders.map((header) => {
                            const mappedField = Object.keys(mapping).find(
                              (key) => mapping[key] === header
                            )
                            const previewValue = preview.length > 0 ? preview[0]?.[header] : ""

                            return (
                              <TableRow key={header}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{header}</p>
                                    {previewValue && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {String(previewValue)}
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={mappedField || "__UNMAPPED__"}
                                    onValueChange={(value) => {
                                      if (value === "__UNMAPPED__") {
                                        // Remove mapping
                                        const newMapping = { ...mapping }
                                        Object.keys(newMapping).forEach((key) => {
                                          if (newMapping[key] === header) {
                                            delete newMapping[key]
                                          }
                                        })
                                        setMapping(newMapping)
                                      } else {
                                        // Remove old mapping for this header
                                        const newMapping = { ...mapping }
                                        Object.keys(newMapping).forEach((key) => {
                                          if (newMapping[key] === header && key !== value) {
                                            delete newMapping[key]
                                          }
                                        })
                                        // Add new mapping
                                        newMapping[value] = header
                                        setMapping(newMapping)
                                      }
                                      // Reset test summary when mapping changes
                                      setTestSummary(null)
                                    }}
                                  >
                                    <SelectTrigger className="w-[300px]">
                                      <SelectValue placeholder="To import, select a field..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__UNMAPPED__">
                                        To import, select a field...
                                      </SelectItem>
                                      {DATABASE_FIELDS.map((field) => (
                                        <SelectItem key={field.key} value={field.key}>
                                          {field.label}
                                          {field.required && " *"}
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
                    </ScrollArea>
                  </div>

                  {/* Test Results - Error Details (at bottom) */}
                  {testSummary && testSummary.errors.length > 0 && (
                    <div className="border-2 rounded-lg border-destructive bg-destructive/10">
                      <div className="p-4 bg-destructive/20 border-b border-destructive">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-destructive" />
                          <p className="text-base font-semibold text-destructive">
                            Validation Errors Found
                          </p>
                        </div>
                        <p className="text-sm text-destructive/90">
                          {testSummary.failed} invalid row(s) found. Please fix the errors below before
                          importing.
                        </p>
                      </div>
                      <ScrollArea className="h-64">
                        <div className="p-4 space-y-3">
                          {testSummary.errors.map((error, idx) => (
                            <div
                              key={idx}
                              className="text-sm text-destructive bg-background p-3 rounded-md border-2 border-destructive/30 shadow-sm"
                            >
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-destructive mt-0.5">•</span>
                                <span className="font-medium">{error}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Test Results - Success Message */}
                  {testSummary && testSummary.failed === 0 && testSummary.success > 0 && (
                    <Alert className="border-green-500/50 bg-green-500/5">
                      <AlertCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700 dark:text-green-400">
                        <strong>All rows are valid!</strong> {testSummary.success} row(s) are ready to
                        import.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="secondary"
                      onClick={() => runImport("test")}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Test
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Import */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-lg font-medium">Processing import...</p>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we import your data
                  </p>
                </div>
              ) : importSummary ? (
                <div className="space-y-4">
                  <Alert variant={importSummary.success > 0 ? "default" : "destructive"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {importSummary.success > 0
                        ? `Import completed! ${importSummary.success} rows imported successfully.`
                        : "Import failed. No rows were imported."}
                      {importSummary.failed > 0 && (
                        <span className="ml-1">
                          {importSummary.failed} row(s) failed.
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>

                  {importSummary.errors.length > 0 && (
                    <div className="border rounded-lg">
                      <div className="p-3 bg-muted/50 border-b">
                        <p className="text-sm font-medium">Errors ({importSummary.errors.length})</p>
                      </div>
                      <ScrollArea className="h-48">
                        <div className="p-4 space-y-2">
                          {importSummary.errors.map((error, idx) => (
                            <div key={idx} className="text-sm text-destructive">
                              <strong>Row {error.row}:</strong> {error.message}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentStep(1)
                        setFile(null)
                        setExcelHeaders([])
                        setPreview([])
                        setMapping({})
                        setImportSummary(null)
                      }}
                    >
                      Start Over
                    </Button>
                    <Button
                      onClick={() => {
                        window.location.href = "/members"
                      }}
                    >
                      Go to Members
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Ready to import. Click the button below to start importing your data.
                    </AlertDescription>
                  </Alert>

                  {/* Import Summary Card */}
                  <div className="border rounded-lg p-6 space-y-4">
                    <h3 className="text-lg font-semibold">Import Summary</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">File Name</p>
                        <p className="text-sm font-medium">{file?.name || "N/A"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Rows</p>
                        <p className="text-sm font-medium">{totalRows} rows</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Columns Mapped</p>
                        <p className="text-sm font-medium">
                          {Object.keys(mapping).filter(key => mapping[key]).length} of {excelHeaders.length}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          Ready to Import
                        </p>
                      </div>
                    </div>

                    {/* Mapped Fields */}
                    <div className="space-y-2 pt-4 border-t">
                      <p className="text-sm font-medium">Mapped Fields</p>
                      <div className="flex flex-wrap gap-2">
                        {DATABASE_FIELDS.map((field) => {
                          const mappedColumn = mapping[field.key]
                          if (!mappedColumn) return null
                          return (
                            <div
                              key={field.key}
                              className="px-3 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium"
                            >
                              {field.label} → {mappedColumn}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Test Results Info */}
                    {testSummary && (
                      <div className="pt-4 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">Test Results</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Valid Rows</p>
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                              {testSummary.success}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Invalid Rows</p>
                            <p className="text-sm font-semibold text-destructive">
                              {testSummary.failed}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => runImport("import")}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Import
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </Wizard>
      </div>
    </div>
  )
}


