"use client"

import { useState } from "react"
import {  SettingsHeader, SettingTab , SettingsContentLayout } from "@/components/settings/SettingsHeader"
import { ShieldCheck } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { Button } from "@/components/ui/button"
import { Plus, Clock, MoreVertical } from "lucide-react"
import { AddOvertimePolicyDialog } from "@/components/settings/policies/AddOvertimePolicyDialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

export default function OvertimePage() {
    const [activeTab, setActiveTab] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [policies, setPolicies] = useState<any[]>([])

    const handleSavePolicy = (policy: any) => {
        const newPolicy = {
            ...policy,
            id: Date.now().toString(),
            status: "PENDING",
            createdAt: new Date(),
        }
        setPolicies([...policies, newPolicy])
    }

    const handleArchivePolicy = (id: string) => {
        setPolicies(policies.map(p =>
            p.id === id ? { ...p, status: "ARCHIVED" } : p
        ))
    }

    const handleRestorePolicy = (id: string) => {
        setPolicies(policies.map(p =>
            p.id === id ? { ...p, status: "PENDING" } : p
        ))
    }

    const activePolicies = policies.filter(p => p.status !== "ARCHIVED")
    const archivedPolicies = policies.filter(p => p.status === "ARCHIVED")
    const displayedPolicies = activeTab === "ACTIVE" ? activePolicies : archivedPolicies

    const sidebarItems: SidebarItem[] = [
        { id: "overtime", label: "Overtime policies", href: "/settings/Policies/overtime" },
        { id: "time-off", label: "Policies", href: "/settings/Policies" },
        { id: "balances", label: "Balances", href: "/settings/Policies/time-off-balances" },
        { id: "holidays", label: "Holidays", href: "/settings/Policies/holidays" },
    ]

    const tabs: SettingTab[] = [
        { label: "TIME OFF", href: "/settings/Policies", active: false },
        { label: "WORK BREAKS", href: "/settings/Policies/work-breaks", active: false },
        { label: "OVERTIME", href: "/settings/Policies/overtime", active: true },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Policies"
                Icon={ShieldCheck}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="overtime"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="overtime">
            {/* Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                    {/* Header with Add button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-normal text-slate-900">Overtime policies</h1>
                            <p className="text-slate-500 text-sm mt-1">Set up automatic overtime policies</p>
                        </div>
                        {displayedPolicies.length > 0 && (
                            <Button
                                onClick={() => setIsAddDialogOpen(true)}
                                className="bg-slate-900 hover:bg-slate-800 text-white w-full sm:w-auto"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add policy
                            </Button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 mb-8">
                        <button
                            onClick={() => setActiveTab("ACTIVE")}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === "ACTIVE"
                                ? "text-slate-900 border-slate-900"
                                : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300"
                                }`}
                        >
                            ACTIVE
                        </button>
                        <button
                            onClick={() => setActiveTab("ARCHIVED")}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === "ARCHIVED"
                                ? "text-slate-900 border-slate-900"
                                : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300"
                                }`}
                        >
                            ARCHIVED
                        </button>
                    </div>

                    {/* Content */}
                    {displayedPolicies.length > 0 ? (
                        <>
                            {/* Policy Table */}
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200 hidden sm:table-header-group">
                                        <tr>
                                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-900">
                                                Policy name
                                            </th>
                                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-900">
                                                Summary
                                            </th>
                                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-900">
                                                Members
                                            </th>
                                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-900">
                                                Status
                                            </th>
                                            <th className="w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {displayedPolicies.map((policy) => (
                                            <tr key={policy.id} className="hover:bg-slate-50 transition-colors flex flex-col sm:table-row py-4 sm:py-0 border-b border-slate-100 last:border-0">
                                                <td className="px-6 py-2 sm:py-4 sm:table-cell">
                                                    <div className="text-sm font-medium text-slate-900">
                                                        {policy.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-2 sm:py-4 sm:table-cell">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="text-sm text-slate-900">
                                                            After {policy.weeklyThreshold} hrs per week
                                                        </div>
                                                        <div className="text-sm text-slate-500">
                                                            {policy.payRateMultiplier} x member's pay rate
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-2 sm:py-4 sm:table-cell">
                                                    <div className="flex items-center justify-between sm:justify-start gap-2">
                                                        <span className="text-xs font-medium text-slate-500 sm:hidden uppercase tracking-wider">Members:</span>
                                                        <span className="text-sm text-slate-900">
                                                            {policy.members?.length || 0}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-2 sm:py-4 sm:table-cell">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center justify-between sm:justify-start gap-2">
                                                            <span className="text-xs font-medium text-slate-500 sm:hidden uppercase tracking-wider">Status:</span>
                                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium w-fit ${policy.status === "PENDING"
                                                                ? "bg-slate-100 text-slate-700"
                                                                : policy.status === "ACTIVE"
                                                                    ? "bg-slate-900 text-white"
                                                                    : "bg-slate-200 text-slate-600"
                                                                }`}>
                                                                {policy.status === "PENDING" ? "Pending" : policy.status === "ACTIVE" ? "Active" : "Archived"}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-slate-500">
                                                            Starts on: {format(policy.createdAt, "E, MMM d, yyyy")}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-2 sm:py-4 sm:table-cell">
                                                    <div className="flex justify-end">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                                                                >
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="bg-white border-slate-200">
                                                                {policy.status !== "ARCHIVED" ? (
                                                                    <>
                                                                        <DropdownMenuItem className="text-slate-900 hover:bg-slate-50 cursor-pointer">
                                                                            Edit policy
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleArchivePolicy(policy.id)}
                                                                            className="text-slate-900 hover:bg-slate-50 cursor-pointer"
                                                                        >
                                                                            Archive policy
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <DropdownMenuItem className="text-slate-900 hover:bg-slate-50 cursor-pointer">
                                                                            View policy
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleRestorePolicy(policy.id)}
                                                                            className="text-slate-900 hover:bg-slate-50 cursor-pointer"
                                                                        >
                                                                            Restore policy
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer */}
                            <div className="mt-4 text-sm text-slate-500">
                                Showing {displayedPolicies.length} of {displayedPolicies.length} policies
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center max-w-2xl mx-auto">
                            <div className="w-64 h-64 mb-6 bg-slate-50 rounded-full flex items-center justify-center">
                                <Clock className="w-24 h-24 text-slate-300" />
                            </div>
                            <h2 className="text-xl font-normal text-slate-900 mb-2">
                                {activeTab === "ACTIVE" ? "No active overtime policies" : "No archived policies"}
                            </h2>
                            <p className="text-slate-500 mb-8">
                                {activeTab === "ACTIVE" ? "Set up automatic overtime policies" : "No policies have been archived yet"}
                            </p>
                            {activeTab === "ACTIVE" && (
                                <Button
                                    onClick={() => setIsAddDialogOpen(true)}
                                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-full"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add overtime policy
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <AddOvertimePolicyDialog
                    open={isAddDialogOpen}
                    onOpenChange={setIsAddDialogOpen}
                    onSave={handleSavePolicy}
                />
            </div>
        
            </SettingsContentLayout>
</div>
    )
}
