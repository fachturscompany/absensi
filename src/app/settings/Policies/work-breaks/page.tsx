"use client"

import { useState, useEffect } from "react"
import { SettingsHeader, SettingTab } from "@/components/settings/SettingsHeader"
import { ShieldCheck } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { Button } from "@/components/ui/button"
import { Plus, Coffee, ChevronDown } from "lucide-react"
import { AddWorkBreakPolicyDialog } from "@/components/settings/policies/AddWorkBreakPolicyDialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User } from "lucide-react"

export default function WorkBreaksPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [policies, setPolicies] = useState<any[]>([])
    const [editingPolicy, setEditingPolicy] = useState<any | null>(null)
    const [activeTab, setActiveTab] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE")
    const [isViewMode, setIsViewMode] = useState(false)

    // Load policies from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("workBreakPolicies")
        if (saved) {
            try {
                setPolicies(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse break policies", e)
            }
        }
    }, [])

    const handleSavePolicy = (policy: any) => {
        let newPolicies
        if (editingPolicy) {
            // Update existing policy
            newPolicies = policies.map(p => p.id === editingPolicy.id ? { ...policy, id: editingPolicy.id } : p)
            setEditingPolicy(null)
        } else {
            // Add new policy
            newPolicies = [...policies, { ...policy, id: Date.now(), status: "ACTIVE" }]
        }
        setPolicies(newPolicies)
        localStorage.setItem("workBreakPolicies", JSON.stringify(newPolicies))
    }

    const handleEditPolicy = (policy: any) => {
        setEditingPolicy(policy)
        setIsViewMode(false)
        setIsDialogOpen(true)
    }

    const handleArchivePolicy = (policyId: number) => {
        const newPolicies = policies.map(p =>
            p.id === policyId ? { ...p, status: "ARCHIVED" } : p
        )
        setPolicies(newPolicies)
        localStorage.setItem("workBreakPolicies", JSON.stringify(newPolicies))
    }

    const handleRestorePolicy = (policyId: number) => {
        const newPolicies = policies.map(p =>
            p.id === policyId ? { ...p, status: "ACTIVE" } : p
        )
        setPolicies(newPolicies)
        localStorage.setItem("workBreakPolicies", JSON.stringify(newPolicies))
    }

    const handleViewPolicy = (policy: any) => {
        setEditingPolicy(policy)
        setIsViewMode(true)
        setIsDialogOpen(true)
    }

    const handleDialogClose = (open: boolean) => {
        setIsDialogOpen(open)
        if (!open) {
            setEditingPolicy(null)
            setIsViewMode(false)
        }
    }

    const tabs: SettingTab[] = [
        { label: "TIME OFF", href: "/settings/Policies", active: false },
        { label: "WORK BREAKS", href: "/settings/Policies/work-breaks", active: true },
        { label: "OVERTIME", href: "/settings/Policies/overtime", active: false },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "policies", label: "break policies", href: "/settings/Policies/work-breaks" },
        { id: "notifications", label: "break notifications", href: "/settings/Policies/work-breaks/notifications" },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Policies"
                Icon={ShieldCheck}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="policies"
            />
            {/* Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 mb-8">
                        <button
                            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "ACTIVE"
                                ? "text-slate-900 border-b-2 border-slate-900"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                            onClick={() => setActiveTab("ACTIVE")}
                        >
                            ACTIVE
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "ARCHIVED"
                                ? "text-slate-900 border-b-2 border-slate-900"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                            onClick={() => setActiveTab("ARCHIVED")}
                        >
                            ARCHIVED
                        </button>
                    </div>

                    {/* Empty State */}

                    {/* Content */}
                    {policies.filter(p => p.status === activeTab).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center max-w-2xl mx-auto">
                            <div className="w-64 h-64 mb-6 relative">
                                <div className="w-full h-full bg-slate-50 rounded-full flex items-center justify-center">
                                    <Coffee className="w-24 h-24 text-slate-300" />
                                </div>
                            </div>
                            <h2 className="text-xl font-normal text-slate-900 mb-2">
                                No active break policies
                            </h2>
                            <p className="text-slate-500 mb-8">
                                Set up automatic break policies
                            </p>
                            <Button
                                className="bg-slate-900 hover:bg-slate-800 text-white rounded-full h-11 px-6 font-medium"
                                onClick={() => setIsDialogOpen(true)}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add break policy
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-sm font-normal text-slate-500 uppercase tracking-wider mb-1">BREAK POLICIES</h2>
                                    <p className="text-slate-500 text-sm">Set up automatic break policies</p>
                                </div>
                                <Button
                                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-md h-10 px-4 font-medium w-full sm:w-auto"
                                    onClick={() => setIsDialogOpen(true)}
                                >
                                    Add policy
                                </Button>
                            </div>

                            <div className="rounded-md border border-slate-100">
                                <Table>
                                    <TableHeader className="bg-white">
                                        <TableRow className="hover:bg-transparent border-b-slate-100">
                                            <TableHead className="w-[300px] font-normal text-slate-900">Policy name</TableHead>
                                            <TableHead className="font-normal text-slate-900 hidden sm:table-cell">Members</TableHead>
                                            <TableHead className="font-normal text-slate-900 hidden sm:table-cell">Type</TableHead>
                                            <TableHead className="w-[100px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {policies.filter(p => p.status === activeTab).map((policy) => (
                                            <TableRow key={policy.id} className="hover:bg-slate-50 border-b-slate-100">
                                                <TableCell className="font-medium text-slate-700 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span>{policy.name}</span>
                                                        <div className="flex items-center gap-2 sm:hidden">
                                                            <span className="text-xs text-slate-500 capitalize">{policy.type}</span>
                                                            <span className="text-xs text-slate-300">•</span>
                                                            <span className="text-xs text-slate-500">{policy.members?.length || 0} members</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-slate-200 rounded-full w-6 h-6 flex items-center justify-center">
                                                            <User className="w-3 h-3 text-slate-500" />
                                                        </div>
                                                        <span className="text-sm text-slate-600">
                                                            {policy.members?.length || 0}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-600 capitalize hidden sm:table-cell">
                                                    {policy.type}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-max px-2 gap-2 text-slate-500 text-xs border border-slate-200 rounded-md hover:bg-white hover:text-slate-700">
                                                                Actions <ChevronDown className="w-3 h-3" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {activeTab === "ACTIVE" ? (
                                                                <>
                                                                    <DropdownMenuItem onClick={() => handleEditPolicy(policy)}>Edit policy</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleArchivePolicy(policy.id)}>Archive policy</DropdownMenuItem>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <DropdownMenuItem onClick={() => handleViewPolicy(policy)}>View</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleRestorePolicy(policy.id)}>Restore</DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="text-sm text-slate-500">
                                Showing {policies.filter(p => p.status === activeTab).length} of {policies.filter(p => p.status === activeTab).length} policy
                            </div>
                        </div>
                    )}

                    <AddWorkBreakPolicyDialog
                        open={isDialogOpen}
                        onOpenChange={handleDialogClose}
                        onSave={handleSavePolicy}
                        initialData={editingPolicy}
                        readOnly={isViewMode}
                    />
                </div>
            </div>
        </div>
    )
}
