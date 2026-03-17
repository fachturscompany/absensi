"use client"

import { useState, useRef } from "react"
import { UploadCloud, Loader2, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"

/**
 * Database fields that can be mapped from Excel
 * Each field has: key (database field), label (display name), required (is it required?)
 */
const DATABASE_FIELDS = [
  { key: "email", label: "Email", required: true, description: "Email address (required)" },
  { key: "full_name", label: "Full Name", required: false, description: "Complete name" },
  { key: "first_name", label: "First Name", required: false, description: "First name (if full_name not available)" },
  { key: "last_name", label: "Last Name", required: false, description: "Last name (if full_name not available)" },
  { key: "phone", label: "Phone Number", required: false, description: "Phone or mobile number" },
  { key: "department", label: "Department/Group", required: false, description: "Department or group name" },
  { key: "position", label: "Position", required: false, description: "Job title or position" },
  { key: "role", label: "Role", required: false, description: "User role (e.g., User, Admin)" },
  { key: "message", label: "Message/Notes", required: false, description: "Additional notes or message" },
] as const

/**
 * Column mapping type
 * Key: database field name
 * Value: Excel column name or null (if not mapped)
 */
type ColumnMapping = {
  [key: string]: string | null
}

interface FlexibleImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete?: (summary: { success: number; failed: number; errors: string[] }) => void
}

export function FlexibleImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: FlexibleImportDialogProps) {
  const [step, setStep] = useState<"upload" | "mapping" | "processing">("upload")
  const [file, setFile] = useState<File | null>(null)
  const [excelHeaders, setExcelHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [loading, setLoading] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset all state
      setStep("upload")
      setFile(null)
      setExcelHeaders([])
      setPreview([])
      setTotalRows(0)
      setMapping({})
      setIsDragActive(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
    onOpenChange(newOpen)
  }

  // Handle file selection
  const handleFileSelect = async (selectedFile: File) => {
    // Validate file type
    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Please upload an Excel file (.xlsx or .xls)")
      return
    }

    setFile(selectedFile)
    setLoading(true)

    try {
      // Read headers from Excel
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
        // Try to find matching header (case-insensitive)
        const matchingHeader = data.headers.find((header: string) => {
          const headerLower = header.toLowerCase().trim()
          const fieldLower = field.label.toLowerCase()

          // Exact match or contains
          return (
            headerLower === fieldLower ||
            headerLower.includes(fieldLower) ||
            fieldLower.includes(headerLower) ||
            // Common variations
            (field.key === "email" && (headerLower.includes("email") || headerLower.includes("surel"))) ||
            (field.key === "phone" && (headerLower.includes("phone") || headerLower.includes("telepon") || headerLower.includes("hp"))) ||
            (field.key === "full_name" && (headerLower.includes("name") || headerLower.includes("nama"))) ||
            (field.key === "department" && (headerLower.includes("department") || headerLower.includes("group") || headerLower.includes("departemen"))) ||
            (field.key === "position" && (headerLower.includes("position") || headerLower.includes("jabatan"))) ||
            (field.key === "role" && (headerLower.includes("role") || headerLower.includes("peran")))
          )
        })

        if (matchingHeader) {
          autoMapping[field.key] = matchingHeader
        } else {
          autoMapping[field.key] = null
        }
      })

      setMapping(autoMapping)
      setStep("mapping")
      toast.success(`Excel file loaded. Found ${data.totalRows} rows and ${data.headers.length} columns`)
    } catch (error) {
      console.error("Error reading Excel:", error)
      toast.error("Failed to read Excel file")
      setFile(null)
    } finally {
      setLoading(false)
    }
  }

  // Handle drag and drop
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
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  // Handle mapping change
  const handleMappingChange = (dbField: string, excelColumn: string | null) => {
    setMapping((prev) => ({
      ...prev,
      [dbField]: excelColumn,
    }))
  }

  // Validate mapping before processing
  const validateMapping = (): boolean => {
    // Email is required
    if (!mapping.email) {
      toast.error("Please map the Email column (required)")
      return false
    }
    return true
  }

  // Process import
  const handleProcessImport = async () => {
    if (!validateMapping()) return
    if (!file) return

    setStep("processing")
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("mapping", JSON.stringify(mapping))

      const response = await fetch("/api/members/import/process", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.message || "Import failed")
        setStep("mapping")
        return
      }

      const summary = data.summary || { success: 0, failed: 0, errors: [] }

      if (summary.success > 0) {
        toast.success(
          `Import completed! Success: ${summary.success}, Failed: ${summary.failed}`
        )
      } else {
        toast.error(`Import failed. ${summary.errors.length} errors occurred.`)
      }

      // Call callback if provided
      if (onImportComplete) {
        onImportComplete(summary)
      }

      // Close dialog after a short delay
      setTimeout(() => {
        handleOpenChange(false)
      }, 2000)
    } catch (error) {
      console.error("Error processing import:", error)
      toast.error("Failed to process import")
      setStep("mapping")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Flexible Import Members</DialogTitle>
          <DialogDescription>
            Upload any Excel file and map columns to database fields
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Step 1: Upload + Download Template */}
          {step === "upload" && (
            <div className="flex-1 flex flex-col gap-4">
              <div
                className={`flex-1 flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 ${isDragActive
                    ? "border-blue-500 bg-blue-50/60 dark:bg-blue-400/10"
                    : "border-muted"
                  }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => !loading && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0]
                    if (selectedFile) {
                      handleFileSelect(selectedFile)
                    }
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
                    <UploadCloud className="h-12 w-12 text-muted-foreground" />
                    <div className="text-center space-y-1">
                      <p className="text-base font-semibold">Drag & drop your Excel file here</p>
                      <p className="text-sm text-muted-foreground">
                        or click to choose a file from your computer
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Template download so users can start from the correct format */}
              <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                <p>Need a starter format? Download the official members import template.</p>
                <a
                  href="/templates/members-import-template.xlsx"
                  download
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Download Template
                </a>
              </div>
            </div>
          )}

          {/* Step 2: Mapping */}
          {step === "mapping" && (
            <div className="flex-1 overflow-hidden flex flex-col gap-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Map Excel columns to database fields. Unmapped fields will be skipped.
                  <strong className="ml-1">Email is required.</strong>
                </AlertDescription>
              </Alert>

              {/* Preview Table */}
              {preview.length > 0 && (
                <div className="border rounded-lg">
                  <div className="p-3 bg-muted/50 border-b">
                    <p className="text-sm font-medium">
                      Preview (showing first {preview.length} of {totalRows} rows)
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

              {/* Mapping Form */}
              <ScrollArea className="flex-1">
                <div className="space-y-4 pr-4">
                  {DATABASE_FIELDS.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={field.key} className="text-sm font-medium">
                          {field.label}
                          {field.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </Label>
                        {field.description && (
                          <span className="text-xs text-muted-foreground">
                            ({field.description})
                          </span>
                        )}
                      </div>
                      <Select
                        value={mapping[field.key] || ""}
                        onValueChange={(value) =>
                          handleMappingChange(field.key, value || null)
                        }
                      >
                        <SelectTrigger id={field.key}>
                          <SelectValue placeholder="" />
                        </SelectTrigger>
                        <SelectContent>
                          {excelHeaders.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setStep("upload")}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button onClick={handleProcessImport} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Process Import
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {step === "processing" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-base font-medium">Processing import...</p>
              <p className="text-sm text-muted-foreground">
                Please wait while we process your data
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

