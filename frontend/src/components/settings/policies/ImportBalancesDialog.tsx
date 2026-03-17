"use client"

import React, { useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, Download, Info } from "lucide-react"
import * as XLSX from "xlsx"
import { toast } from "sonner"

interface ImportBalancesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    members: any[]
    policies: any[]
    currentBalances: Record<string, Record<number, string>>
    onImportSuccess: (newBalances: Record<string, Record<number, string>>, count: number) => void
    onDownloadTemplate: () => void
}

export function ImportBalancesDialog({
    open,
    onOpenChange,
    members,
    policies,
    currentBalances,
    onImportSuccess,
    onDownloadTemplate
}: ImportBalancesDialogProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                if (!wsname) throw new Error("Worksheet not found")
                const ws = wb.Sheets[wsname as string]
                if (!ws) throw new Error("Worksheet data not found")
                const data = XLSX.utils.sheet_to_json(ws) as any[]

                processImportData(data)
            } catch (err) {
                console.error("Failed to parse file", err)
                toast.error("Failed to read file. Please ensure it's a valid CSV or Excel file.")
            }
        }
        reader.readAsBinaryString(file)

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const processImportData = (data: any[]) => {
        const newBalances: Record<string, any> = { ...currentBalances }
        let updatedCount = 0

        data.forEach(row => {
            // Support both exact headers from our export and case-insensitive versions
            const email = row["User email"] || row["email"] || row["Email"]
            const policyName = row["Policy name"] || row["policy"] || row["Policy"]
            const balance = row["Balance"] || row["balance"]

            if (!email || !policyName) return

            // Find member by email
            const member = members.find(m => m.email?.toLowerCase() === email.toLowerCase())
            // Find policy by name
            const policy = policies.find(p => p.name.toLowerCase() === policyName.toLowerCase())

            if (member && policy && balance !== undefined) {
                if (!newBalances[member.id]) {
                    newBalances[member.id] = {}
                }
                newBalances[member.id][policy.id] = String(balance)
                updatedCount++
            }
        });

        if (updatedCount > 0) {
            onImportSuccess(newBalances, updatedCount)
            onOpenChange(false)
        } else {
            toast.error("No matching members or policies found. Check your column headers and data.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                style={{ maxWidth: "650px", width: "95vw" }}
                className="p-0 overflow-hidden border-none shadow-2xl"
            >
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-xl font-normal text-slate-900">
                        Import time off balances
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Upload a CSV or Excel file with member emails and balances to update them in bulk.
                            Fill in the template with your data.
                        </p>
                        <Button
                            variant="outline"
                            onClick={onDownloadTemplate}
                            className="shrink-0 h-9 px-4 text-xs font-normal border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm whitespace-nowrap"
                        >
                            <Download className="w-3.5 h-3.5 mr-2" />
                            Download template
                        </Button>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImport}
                        accept=".csv, .xlsx, .xls"
                        className="hidden"
                    />

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center gap-3 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer group"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6 text-slate-600" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-normal text-slate-900">Click to upload or drag and drop</p>
                            <p className="text-xs text-slate-500 mt-1">CSV, XLS or XLSX (max. 10MB)</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 flex gap-3 border border-slate-100">
                        <Info className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div className="text-xs text-slate-500 leading-normal">
                            <p className="font-normal text-slate-700 mb-1">Matching criteria</p>
                            <p>The system will match members using their <strong className="text-slate-900">email addresses</strong> and time off policies using their <strong className="text-slate-900">names</strong>.</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2 flex items-center justify-between sm:justify-between border-t border-slate-50 bg-slate-50/50">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="h-11 px-8 border-slate-200 hover:bg-white transition-colors font-medium rounded-lg"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-slate-900 hover:bg-slate-800 text-white h-11 px-8 font-medium rounded-lg transition-all shadow-md active:scale-95"
                    >
                        Choose file
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
