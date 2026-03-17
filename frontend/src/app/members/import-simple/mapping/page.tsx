"use client"

import React, { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle2 } from "@/components/icons/lucide-exports"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

const DATABASE_FIELDS = [
  { key: "email", label: "Email", required: true },
  { key: "full_name", label: "Full Name", required: false },
  { key: "phone", label: "Phone Number", required: false },
  { key: "department", label: "Department/Group", required: false },
  { key: "position", label: "Position", required: false },
  { key: "role", label: "Role", required: false },
  { key: "status", label: "Status", required: false },
] as const

type ColumnMapping = {
  [key: string]: string | null
}

export default function MembersImportSimpleMappingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [excelHeaders, setExcelHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [useFirstRowAsHeader, setUseFirstRowAsHeader] = useState(true)
  const [allowMatchingWithSubfields, setAllowMatchingWithSubfields] = useState(true)
  const [sheetName, setSheetName] = useState("Sheet1")
  const [testSummary, setTestSummary] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)

  // Load file from URL params or sessionStorage
  useEffect(() => {
    const fileName = searchParams.get("file")
    if (fileName) {
      // Try to get file from sessionStorage
      const fileData = sessionStorage.getItem(`import_file_${fileName}`)
      if (fileData) {
        try {
          const fileBlob = JSON.parse(fileData)
          // Convert base64 back to ArrayBuffer
          const binaryString = atob(fileBlob.data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const arrayBuffer = bytes.buffer
          // Convert back to File object
          const file = new File([arrayBuffer], fileBlob.name, { type: fileBlob.type })
          setFile(file)
          loadFileHeaders(file)
        } catch (error) {
          console.error("Error loading file:", error)
          toast.error("Failed to load file. Please select a new file.")
        }
      }
    }
  }, [searchParams])

  const loadFileHeaders = async (selectedFile: File) => {
    if (!selectedFile) return

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
        return
      }

      setExcelHeaders(data.headers || [])
      setPreview(data.preview || [])
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

        if (matchingHeader) {
          autoMapping[field.key] = matchingHeader
        } else {
          autoMapping[field.key] = null
        }
      })

      setMapping(autoMapping)
      setTestSummary(null)
      toast.success(`File loaded. Found ${data.totalRows || 0} rows and ${data.headers.length} columns`)
    } catch (error) {
      console.error("Error reading Excel:", error)
      toast.error("Failed to read Excel file")
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error("Please upload an Excel or CSV file (.xlsx, .xls, or .csv)")
      return
    }

    setFile(selectedFile)
    await loadFileHeaders(selectedFile)
  }

  const handleTest = async () => {
    if (!file) {
      toast.error("Please select a file first")
      return
    }

    if (!mapping.email) {
      toast.error("Please map the Email column (required)")
      return
    }

    setProcessing(true)
    setTestSummary(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("mapping", JSON.stringify(mapping))
      formData.append("mode", "test")
      formData.append("allowMatchingWithSubfields", String(allowMatchingWithSubfields))

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
    if (!file) {
      toast.error("Please select a file first")
      return
    }

    if (!mapping.email) {
      toast.error("Please map the Email column (required)")
      return
    }

    setProcessing(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("mapping", JSON.stringify(mapping))
      formData.append("mode", "import")
      formData.append("allowMatchingWithSubfields", String(allowMatchingWithSubfields))

      const response = await fetch("/api/members/import/process", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.message || "Import failed")
        return
      }

      const summary = data.summary || { success: 0, failed: 0, errors: [] }

      if (summary.success > 0) {
        toast.success(`Import completed! Success: ${summary.success}, Failed: ${summary.failed}`)
        setTimeout(() => {
          router.push("/members")
        }, 1500)
      } else {
        toast.error(`Import failed. ${summary.errors.length} errors occurred.`)
      }
    } catch (error) {
      console.error("Error processing import:", error)
      toast.error("Failed to process import")
    } finally {
      setProcessing(false)
    }
  }

  const handleCancel = () => {
    router.push("/members/import-simple")
  }

  const getPreviewValue = (header: string) => {
    const firstRow = preview[0]
    return firstRow?.[header] || ""
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-6 pt-0">
        {/* Header */}
        <div className="flex items-center justify-start pb-4 pt-4 relative">
          {/* Garis horizontal yang menyatu dengan sidebar */}
          <div className="absolute bottom-0 left-0 right-0 border-b" style={{ left: '-24px', right: '-24px' }}></div>
          <div className="flex items-center gap-4 w-full">
            <Button
              onClick={handleImport}
              disabled={!file || processing || !mapping.email}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Import"
              )}
            </Button>
            <Button
              onClick={handleTest}
              disabled={!file || processing || !mapping.email}
              variant="outline"
            >
              Test
            </Button>
            <Button
              onClick={async () => {
                if (file) {
                  await loadFileHeaders(file)
                } else {
                  router.push("/members/import-simple")
                }
              }}
              disabled={processing || loading}
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Refresh"
              )}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={processing}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0]
            if (selectedFile) handleFileSelect(selectedFile)
          }}
          disabled={loading || processing}
        />

        {/* Main Content */}
        <div className="flex relative">
          {/* Garis horizontal bawah yang menyatu dengan sidebar */}
          <div className="absolute bottom-0 left-0 right-0 border-b" style={{ left: '-24px', right: '-24px' }}></div>
          {/* Left Panel */}
          <div className="w-80 pr-6 border-r pt-6 pb-6 relative z-10" style={{ marginTop: '-1px' }}>
            {/* Data to import */}
            <div className="space-y-4 pb-6 border-b">
              <h2 className="font-semibold text-lg">Data to import</h2>

              {file ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">File:</p>
                    <p className="text-sm">{file.name}</p>
                  </div>

                  <div>
                    <Label htmlFor="sheet" className="text-sm font-medium text-muted-foreground mb-2 block">
                      Sheet:
                    </Label>
                    <Select value={sheetName} onValueChange={setSheetName}>
                      <SelectTrigger id="sheet">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sheet1">Sheet1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use-header"
                      checked={useFirstRowAsHeader}
                      onCheckedChange={(checked) => setUseFirstRowAsHeader(checked === true)}
                    />
                    <Label htmlFor="use-header" className="text-sm cursor-pointer">
                      Use first row as header
                    </Label>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No file selected</p>
              )}
            </div>

            {/* Advanced */}
            <div className="space-y-4 pt-6">
              <h2 className="font-semibold text-lg">Advanced</h2>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow-matching"
                  checked={allowMatchingWithSubfields}
                  onCheckedChange={(checked) => setAllowMatchingWithSubfields(checked === true)}
                />
                <Label htmlFor="allow-matching" className="text-sm cursor-pointer">
                  Allow matching with subfields
                </Label>
              </div>
            </div>
          </div>

          {/* Right Panel - Mapping Table */}
          <div className="flex-1 pl-6 pt-6 pb-6 relative z-10">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : excelHeaders.length > 0 ? (
              <div>
                <ScrollArea className="h-[calc(100vh-250px)]">
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
                        const previewValue = getPreviewValue(header)

                        return (
                          <TableRow key={header}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{header}</p>
                                {previewValue && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {previewValue}
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

                {/* Test Summary */}
                {testSummary && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Test Results</h3>
                    </div>
                    <p className="text-sm mb-2">
                      Success: {testSummary.success} | Failed: {testSummary.failed}
                    </p>
                    {testSummary.errors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium text-destructive">Errors:</p>
                        <ScrollArea className="h-32">
                          {testSummary.errors.map((error, index) => (
                            <p key={index} className="text-xs text-destructive">
                              {error}
                            </p>
                          ))}
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">No file loaded. Please select a file.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

