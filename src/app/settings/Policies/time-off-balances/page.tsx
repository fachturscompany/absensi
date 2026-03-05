"use client"

import { useState, useEffect, useRef } from "react"
import { SettingsHeader, SettingTab } from "@/components/settings/SettingsHeader"
import { ShieldCheck } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Info, Download, Upload, Loader2, ChevronDown } from "lucide-react"
import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import * as XLSX from "xlsx"
import { toast } from "sonner"

export default function TimeOffBalancesPage() {
    const [allMembers, setAllMembers] = useState<any[]>([])
    const [membersLoading, setMembersLoading] = useState(true)
    const [policies, setPolicies] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const [balances, setBalances] = useState<Record<string, Record<number, string>>>({})
    const [isLoaded, setIsLoaded] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Load policies and members
    useEffect(() => {
        const loadData = async () => {
            setMembersLoading(true)

            // 1. Load policies from localStorage
            const savedPolicies = localStorage.getItem("timeOffPolicies")
            let activePolicies: any[] = []
            if (savedPolicies) {
                try {
                    const parsed = JSON.parse(savedPolicies)
                    activePolicies = parsed.filter((p: any) => p.status === "ACTIVE")
                    setPolicies(activePolicies)
                } catch (e) {
                    console.error("Failed to parse policies", e)
                }
            }

            // 2. Use dummy members
            const mapped = DUMMY_MEMBERS.map((m: any) => ({
                id: String(m.id),
                name: m.name,
                email: m.email || null,
                user_id: String(m.id) // Use same ID for user_id in dummy data
            }))
            setAllMembers(mapped)

            setMembersLoading(false)
            setIsLoaded(true)
        }

        loadData()
    }, [])

    // Get unique member IDs from all active policies
    const policyMemberIds = new Set(
        policies.flatMap(p => {
            const members = p.selectedMembers || p.member_ids || []
            return Array.isArray(members) ? members.map(id => String(id)) : []
        })
    )

    const filteredMembers = allMembers.filter(member => {
        const nameMatches = member.name.toLowerCase().includes(searchQuery.toLowerCase())
        if (!nameMatches) return false

        // Check if this member's ID or user_id is in any policy
        return policyMemberIds.has(String(member.id)) || (member.user_id && policyMemberIds.has(String(member.user_id)))
    })

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedMembers(filteredMembers.map(m => m.id))
        } else {
            setSelectedMembers([])
        }
    }

    const handleSelectMember = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedMembers(prev => [...prev, id])
        } else {
            setSelectedMembers(prev => prev.filter(mId => mId !== id))
        }
    }

    const handleExport = (type: 'csv' | 'xls', isTemplate: boolean = false) => {
        const headers = ["User email", "User name", "Policy name", "Balance"];
        const dataRows: any[] = [];

        if (isTemplate) {
            // Add an empty row for the template as requested
            dataRows.push(["", "", "", ""]);
        } else {
            filteredMembers.forEach(member => {
                policies.forEach(policy => {
                    const isAssigned = (policy.selectedMembers || []).some((id: any) =>
                        String(id) === String(member.id) || (member.user_id && String(id) === String(member.user_id))
                    );

                    if (isAssigned) {
                        const balance = balances[member.id]?.[policy.id] ||
                            (policy.startingBalance ? `${policy.startingBalance}:00` :
                                (policy.maxAccrual ? `${policy.maxAccrual}:00` : "0:00"));

                        dataRows.push([
                            member.email || "-",
                            member.name,
                            policy.name,
                            balance
                        ]);
                    }
                });
            });
        }

        const filename = isTemplate
            ? `time_off_balances_template.csv`
            : `time_off_balances_${new Date().toISOString().split('T')[0]}.csv`;

        if (type === 'csv') {
            const csvContent = [headers, ...dataRows].map(e => e.map((item: any) => `"${item}"`).join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            const exportFilename = isTemplate
                ? `time_off_balances_template.xlsx`
                : `time_off_balances_${new Date().toISOString().split('T')[0]}.xlsx`;
            const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Balances");
            XLSX.writeFile(wb, exportFilename);
        }
    };

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
        const newBalances: Record<string, any> = { ...balances }
        let updatedCount = 0

        data.forEach(row => {
            // Support both exact headers from our export and case-insensitive versions
            const email = row["User email"] || row["email"] || row["Email"]
            const policyName = row["Policy name"] || row["policy"] || row["Policy"]
            const balance = row["Balance"] || row["balance"]

            if (!email || !policyName) return

            // Find member by email
            const member = allMembers.find(m => m.email?.toLowerCase() === email.toLowerCase())
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
            setBalances(newBalances)
            toast.success(`Successfully imported ${updatedCount} balance records`)
            setIsImportModalOpen(false)
        } else {
            toast.error("No matching members or policies found. Check your column headers and data.")
        }
    }

    const handleBalanceChange = (memberId: string, policyId: number, value: string) => {
        setBalances(prev => ({
            ...prev,
            [memberId]: {
                ...(prev[memberId] || {}),
                [policyId]: value
            }
        }))
    }

    const loading = membersLoading || !isLoaded

    const tabs: SettingTab[] = [
        { label: "TIME OFF", href: "/settings/Policies", active: false },
        { label: "WORK BREAKS", href: "/settings/Policies/work-breaks", active: false },
        { label: "OVERTIME", href: "/settings/Policies/overtime", active: false },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "policies", label: "Time off policies", href: "/settings/Policies" },
        { id: "holidays", label: "Holidays", href: "/settings/Policies/holidays" },
        { id: "balances", label: "Time off balances", href: "/settings/Policies/time-off-balances" },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Policies"
                Icon={ShieldCheck}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="balances"
            />
            {/* Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                                    TIME OFF BALANCES
                                </h2>
                                <Info className="w-3.5 h-3.5 text-slate-300" />
                            </div>
                            <p className="text-xl font-normal text-slate-900 tracking-tight">
                                Manage member balances
                            </p>
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search members..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full sm:w-64 border border-slate-200 rounded-full focus:outline-none focus:ring-1 focus:ring-slate-900 text-sm h-10 transition-all bg-white"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mb-8 items-stretch sm:items-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="bg-white text-slate-600 border-slate-200 hover:bg-slate-50 h-10 px-4 font-medium rounded-lg transition-colors shadow-sm flex-1 sm:flex-none justify-center"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export
                                    <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer py-2.5">
                                    To CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('xls')} className="cursor-pointer py-2.5">
                                    To XLS
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImport}
                            accept=".csv, .xlsx, .xls"
                            className="hidden"
                        />
                        <Button
                            onClick={() => setIsImportModalOpen(true)}
                            className="bg-slate-900 hover:bg-slate-800 text-white h-10 px-8 font-medium rounded-lg transition-colors shadow-sm border-none flex-1 sm:flex-none justify-center"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Import
                        </Button>
                    </div>

                    {/* Import Dialog */}
                    <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
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
                                        onClick={() => handleExport('csv', true)}
                                        className="shrink-0 h-9 px-4 text-xs font-normal border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm whitespace-nowrap"
                                    >
                                        <Download className="w-3.5 h-3.5 mr-2" />
                                        Download template
                                    </Button>
                                </div>

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
                                    onClick={() => setIsImportModalOpen(false)}
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

                    {/* Table View */}
                    <div className="w-full overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="w-12 py-4 px-2">
                                        <Checkbox
                                            checked={filteredMembers.length > 0 && selectedMembers.length === filteredMembers.length}
                                            onCheckedChange={handleSelectAll}
                                            className="data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
                                        />
                                    </th>
                                    <th className="text-left py-4 font-normal text-slate-900 text-sm min-w-[200px]">Member</th>
                                    {policies.map(policy => (
                                        <th key={policy.id} className="text-center py-4 font-normal text-slate-900 text-sm min-w-[120px]">
                                            {policy.name}
                                        </th>
                                    ))}
                                    {policies.length === 0 && (
                                        <th className="text-center py-4 font-normal text-slate-900 text-sm w-32">lock in</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={3 + policies.length} className="py-12 text-center">
                                            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading balances...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={3 + policies.length} className="py-12 text-center text-slate-500 text-sm">
                                            No members found
                                        </td>
                                    </tr>
                                ) : filteredMembers.map((member) => (
                                    <tr key={member.id} className="border-b border-slate-50">
                                        <td className="py-4 px-2">
                                            <Checkbox
                                                checked={selectedMembers.includes(member.id)}
                                                onCheckedChange={(checked) => handleSelectMember(member.id, !!checked)}
                                                className="data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
                                            />
                                        </td>
                                        <td className="py-4 text-slate-900 text-sm">
                                            {member.name}
                                        </td>
                                        {policies.map(policy => {
                                            const isAssigned = (policy.selectedMembers || []).some((id: any) =>
                                                String(id) === String(member.id) || (member.user_id && String(id) === String(member.user_id))
                                            );

                                            if (!isAssigned) {
                                                return <td key={policy.id} className="py-4 text-center text-slate-300">-</td>;
                                            }

                                            // Determine display value: 
                                            // 1. Manually changed balance in this session
                                            // 2. Starting Balance from policy
                                            // 3. Max Accrual from policy (fallback)
                                            // 4. Default 0:00
                                            const displayValue = balances[member.id]?.[policy.id] ||
                                                (policy.startingBalance ? `${policy.startingBalance}:00` :
                                                    (policy.maxAccrual ? `${policy.maxAccrual}:00` : "0:00"));

                                            return (
                                                <td key={policy.id} className="py-4 text-center">
                                                    <input
                                                        type="text"
                                                        value={displayValue}
                                                        onChange={(e) => handleBalanceChange(member.id, policy.id, e.target.value)}
                                                        className="w-24 h-9 border border-slate-200 rounded-md text-center text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                                    />
                                                </td>
                                            );
                                        })}
                                        {policies.length === 0 && (
                                            <td className="py-4 text-center">
                                                <input
                                                    type="text"
                                                    defaultValue="300:00"
                                                    className="w-24 h-9 border border-slate-200 rounded-md text-center text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-slate-50 cursor-not-allowed"
                                                    readOnly
                                                />
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination / Footer */}
                        {!loading && filteredMembers.length > 0 && (
                            <div className="py-6 text-sm text-slate-500">
                                Showing {filteredMembers.length} of {filteredMembers.length} balances
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
