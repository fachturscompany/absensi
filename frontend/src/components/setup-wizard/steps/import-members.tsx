"use client"

import { useEffect, useState } from "react"
import { useSetupWizardStore } from "@/store/setup-wizard-store"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Upload, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ImportMembersProps {
  onNext: () => void
  onPrev: () => void
}

export function ImportMembers({ onNext, onPrev }: ImportMembersProps) {
  const wizardStore = useSetupWizardStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const validateExcelFile = (file: File): boolean => {
    if (!file) {
      setError("No file selected")
      return false
    }

    // Check file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ]

    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Please upload an Excel file (.xlsx or .xls)")
      return false
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit")
      return false
    }

    return true
  }

  const handleFileSelect = async (file: File) => {
    setError(null)
    setSuccess(null)

    if (!validateExcelFile(file)) {
      return
    }

    try {
      setIsProcessing(true)

      // Store file in wizard store
      wizardStore.setImportMembers({
        file,
        previewData: [],
        importedCount: 0,
      })

      setSuccess(`File "${file.name}" selected successfully. ${file.size} bytes`)
    } catch (err) {
      console.error("Error processing file:", err)
      setError("Failed to process file")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files[0] as File)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      handleFileSelect(files[0] as File)
    }
  }

  const handleDownloadTemplate = () => {
    // Create a simple CSV template
    const template = "First Name,Last Name,Email,Phone,Department,Position\nJohn,Doe,john@example.com,081234567890,IT,Manager\nJane,Smith,jane@example.com,081234567891,HR,Staff"
    const blob = new Blob([template], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "member-import-template.csv"
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  if (!isHydrated) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Import Members</h2>
        <p className="text-muted-foreground">
          Upload an Excel file with member data. You can skip this step and add members later.
        </p>
      </div>

      {/* File Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <div className="space-y-4">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
          <div className="space-y-2">
            <p className="font-medium">Drag and drop your Excel file here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
          </div>

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileInputChange}
            disabled={isProcessing}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input">
            <Button
              asChild
              disabled={isProcessing}
              variant="outline"
              className="cursor-pointer"
            >
              <span>Select File</span>
            </Button>
          </label>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* File Info */}
      {wizardStore.importMembers.file && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selected File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{wizardStore.importMembers.file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(wizardStore.importMembers.file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Excel file should contain these columns:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>First Name (required)</li>
              <li>Last Name (required)</li>
              <li>Email (required)</li>
              <li>Phone (optional)</li>
              <li>Department (optional)</li>
              <li>Position (optional)</li>
            </ul>
            <Button
              onClick={handleDownloadTemplate}
              variant="link"
              className="p-0 h-auto text-sm"
            >
              Download template →
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-3 pt-6">
        <Button onClick={onPrev} variant="outline">
          Previous
        </Button>
        <Button onClick={onNext} disabled={isProcessing}>
          {wizardStore.importMembers.file ? "Next Step" : "Skip"}
        </Button>
      </div>
    </div>
  )
}
