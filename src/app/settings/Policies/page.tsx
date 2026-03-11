"use client"

import { useState, useEffect } from "react"
import {  SettingsHeader, SettingTab , SettingsContentLayout } from "@/components/settings/SettingsHeader"
import { ShieldCheck } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { Button } from "@/components/ui/button"
import { Plus, ChevronDown } from "lucide-react"
import { AddTimeOffPolicyDialog } from "@/components/settings/policies/AddTimeOffPolicyDialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function TimeOffPoliciesPage() {
    const [activeTab, setActiveTab] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE")
    const [activePolicies, setActivePolicies] = useState<any[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingPolicy, setEditingPolicy] = useState<any>(null)
    const [editMode, setEditMode] = useState<"default" | "members" | "policy">("default")
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("timeOffPolicies")
        if (saved) {
            try {
                setActivePolicies(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse policies", e)
            }
        }
        setIsLoaded(true)
    }, [])

    // Save to localStorage when policies change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("timeOffPolicies", JSON.stringify(activePolicies))
        }
    }, [activePolicies, isLoaded])

    const handleSavePolicy = (policy: any) => {
        if (editingPolicy) {
            // Update existing
            const updatedPolicies = activePolicies.map(p =>
                p.id === editingPolicy.id ? { ...p, ...policy } : p
            )
            setActivePolicies(updatedPolicies)
            setEditingPolicy(null)
        } else {
            // Add new
            const newPolicy = { ...policy, id: Date.now(), status: "ACTIVE" }
            setActivePolicies([...activePolicies, newPolicy])
        }
    }

    const handleArchivePolicy = (policyId: number) => {
        setActivePolicies(activePolicies.map(p =>
            p.id === policyId ? { ...p, status: "ARCHIVED" } : p
        ))
    }

    const handleRestorePolicy = (policyId: number) => {
        setActivePolicies(activePolicies.map(p =>
            p.id === policyId ? { ...p, status: "ACTIVE" } : p
        ))
    }

    const handleRemovePolicy = (policyId: number) => {
        setActivePolicies(activePolicies.filter(p => p.id !== policyId))
    }

    const handleEditPolicy = (policy: any, mode: "default" | "members" | "policy" = "default") => {
        setEditingPolicy(policy)
        setEditMode(mode)
        setIsDialogOpen(true)
    }

    const filteredPolicies = activePolicies.filter(p => p.status === activeTab)

    const tabs: SettingTab[] = [
        { label: "TIME OFF", href: "/settings/Policies", active: true },
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
                activeItemId="policies"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="policies">
            {/* Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
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
                    {filteredPolicies.length > 0 ? (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-sm font-normal text-slate-500 uppercase">TIME OFF POLICIES</h2>
                                        <div className="rounded-full border border-slate-300 w-4 h-4 flex items-center justify-center text-[10px] font-normal text-slate-500">
                                            i
                                        </div>
                                    </div>
                                    <p className="text-slate-500">
                                        Set up automatic accrual policies for time off
                                    </p>
                                </div>
                                {activeTab === "ACTIVE" && (
                                    <Button
                                        onClick={() => {
                                            setEditingPolicy(null)
                                            setIsDialogOpen(true)
                                        }}
                                        className="bg-slate-900 hover:bg-slate-800 text-white w-full sm:w-auto"
                                    >
                                        Add policy
                                    </Button>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 hidden sm:table-row">
                                            <th className="text-left py-4 font-normal text-slate-900">Policy name</th>
                                            <th className="text-left py-4 font-normal text-slate-900">Members</th>
                                            <th className="text-left py-4 font-normal text-slate-900">Accrual schedule</th>
                                            <th className="text-right py-4 font-normal text-slate-900"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPolicies.map((policy) => (
                                            <tr key={policy.id} className="border-b border-slate-50 flex flex-col sm:table-row py-4 sm:py-0">
                                                <td className="py-2 sm:py-4 text-slate-900 sm:table-cell">
                                                    <div className="font-medium sm:font-normal">{policy.name}</div>
                                                    <div className="sm:hidden text-xs text-slate-500 mt-1">
                                                        {policy.members} members
                                                    </div>
                                                </td>
                                                <td className="py-4 text-slate-900 hidden sm:table-cell">{policy.members}</td>
                                                <td className="py-2 sm:py-4 text-slate-900 sm:table-cell">
                                                    <div className="flex flex-col">
                                                        <div className="font-medium text-slate-900 text-sm sm:text-base">
                                                            {policy.accrualSchedule}
                                                        </div>
                                                        <div className="text-xs sm:text-sm text-slate-500">
                                                            {policy.accrualSchedule === "Annual" && policy.maxAccrual && (
                                                                `${policy.maxAccrual} hours per year`
                                                            )}
                                                            {policy.accrualSchedule === "Monthly" && policy.accrualAmount && (
                                                                `${policy.accrualAmount} hours / month`
                                                            )}
                                                            {policy.accrualSchedule === "Hours worked" && policy.accrualRate && policy.accrualPer && (
                                                                `${policy.accrualRate} hour(s) for every ${policy.accrualPer} hours worked`
                                                            )}
                                                            {policy.accrualSchedule === "None" && policy.startingBalance && (
                                                                `Starting balance: ${policy.startingBalance} hours`
                                                            )}
                                                            {policy.accrualSchedule === "Policy joined date" && policy.maxAccrual && (
                                                                `${policy.maxAccrual} hours per year`
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-2 sm:py-4 text-right sm:table-cell">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" className="h-9 w-full sm:w-auto justify-between sm:justify-center">
                                                                Actions <ChevronDown className="ml-2 h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-[160px]">
                                                            {activeTab === "ACTIVE" ? (
                                                                <>
                                                                    <DropdownMenuItem className="cursor-pointer" onClick={() => handleEditPolicy(policy, "policy")}>
                                                                        Edit time off
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem className="cursor-pointer" onClick={() => handleEditPolicy(policy, "members")}>
                                                                        Edit members
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="cursor-pointer"
                                                                        onClick={() => handleArchivePolicy(policy.id)}
                                                                    >
                                                                        Archive
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="cursor-pointer text-red-600 focus:text-red-600"
                                                                        onClick={() => handleRemovePolicy(policy.id)}
                                                                    >
                                                                        Remove
                                                                    </DropdownMenuItem>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <DropdownMenuItem className="cursor-pointer">
                                                                        View
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="cursor-pointer"
                                                                        onClick={() => handleRestorePolicy(policy.id)}
                                                                    >
                                                                        Restore
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        activeTab === "ACTIVE" ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center max-w-2xl mx-auto">
                                <div className="w-64 h-64 mb-6 bg-slate-50 rounded-full flex items-center justify-center">
                                    {/* Placeholder for illustration */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-20 bg-slate-200 rounded-sm flex items-center justify-center mb-2">
                                            <div className="w-10 h-1 bg-slate-400 rounded-full opacity-50 space-y-2">
                                                <div className="h-1 bg-slate-400 w-full" />
                                                <div className="h-1 bg-slate-400 w-3/4" />
                                                <div className="h-1 bg-slate-400 w-1/2" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <h2 className="text-xl font-normal text-slate-900 mb-2">
                                    No active time off policies
                                </h2>
                                <p className="text-slate-500 mb-8">
                                    Set up automatic accrual policies for time off
                                </p>
                                <Button
                                    onClick={() => setIsDialogOpen(true)}
                                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-full"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add policy
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                No archived policies found.
                            </div>
                        )
                    )}
                </div>
            </div>
            <AddTimeOffPolicyDialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                    setIsDialogOpen(open)
                    if (!open) {
                        setEditingPolicy(null)
                        setEditMode("default")
                    }
                }}
                onSave={handleSavePolicy}
                initialData={editingPolicy}
                mode={editMode}
            />
        
            </SettingsContentLayout>
</div>
    )
}
