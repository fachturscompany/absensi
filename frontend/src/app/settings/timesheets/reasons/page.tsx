"use client"

import React, { useState, useEffect } from "react"
import { ChevronDown, Plus, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {  SettingsHeader, SettingTab , SettingsContentLayout } from "@/components/settings/SettingsHeader"
import { Activity } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { useOrgStore } from "@/store/org-store"
import { getOrgSettings, upsertOrgSetting } from "@/action/organization-settings"
import { toast } from "sonner"

interface Reason {
    id: string
    text: string
}

const INITIAL_REASONS: Reason[] = [
    { id: "1", text: "Forgot to start/stop timer" },
    { id: "2", text: "Used a wrong task/project" },
    { id: "3", text: "Was AFK on a call" },
    { id: "4", text: "Other" },
]

export default function ReasonsPage() {
    const organizationId = useOrgStore((s) => s.organizationId)
    const [reasons, setReasons] = useState<Reason[]>([])
    const [loading, setLoading] = useState(true)
    const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null)

    useEffect(() => {
        if (!organizationId) return

        const loadData = async () => {
            setLoading(true)
            try {
                const res = await getOrgSettings(String(organizationId))
                if (res.success && res.data && res.data.timesheet_reasons) {
                    setReasons(res.data.timesheet_reasons as Reason[])
                } else {
                    setReasons(INITIAL_REASONS)
                }
            } catch (err) {
                console.error("Failed to load reasons", err)
                toast.error("Failed to load reasons")
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [organizationId])

    const saveReasons = async (newReasons: Reason[]) => {
        if (!organizationId) return
        try {
            const res = await upsertOrgSetting(String(organizationId), {
                timesheet_reasons: newReasons
            })
            if (!res.success) throw new Error(res.message)
            return true
        } catch (err) {
            console.error("Failed to save reasons", err)
            toast.error("Failed to save changes")
            return false
        }
    }

    const handleAddReason = async () => {
        const text = prompt("Enter new reason:")
        if (!text) return

        const newReason: Reason = {
            id: Date.now().toString(),
            text: text
        }
        const updated = [...reasons, newReason]
        setReasons(updated)
        await saveReasons(updated)
    }

    const handleDeleteReason = async (id: string) => {
        const updated = reasons.filter(r => r.id !== id)
        const previous = reasons
        setReasons(updated)
        setShowActionsMenu(null)

        const success = await saveReasons(updated)
        if (!success) setReasons(previous)
    }

    const handleEditReason = async (id: string) => {
        const reason = reasons.find(r => r.id === id)
        if (!reason) return

        const newText = prompt("Enter new reason text:", reason.text)
        if (newText && newText !== reason.text) {
            const updated = reasons.map(r =>
                r.id === id ? { ...r, text: newText } : r
            )
            const previous = reasons
            setReasons(updated)

            const success = await saveReasons(updated)
            if (!success) setReasons(previous)
        }
        setShowActionsMenu(null)
    }

    const tabs: SettingTab[] = [
        { label: "ACTIVITY", href: "/settings/Activity", active: false },
        { label: "TIMESHEETS", href: "/settings/timesheets", active: true },
        { label: "TRACKING", href: "/settings/tracking", active: false },
        { label: "SCREENSHOTS", href: "/settings/screenshot", active: false },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "modify-time", label: "Modify time (manual time)", href: "/settings/timesheets" },
        { id: "require-reason", label: "Require reason", href: "/settings/timesheets/require-reason" },
        { id: "reasons", label: "Reasons", href: "/settings/timesheets/reasons" },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Activity & Tracking"
                Icon={Activity}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="reasons"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="reasons">

            {/* Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full text-slate-900 font-normal">
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                            REASONS
                        </span>
                        <Button
                            onClick={handleAddReason}
                            disabled={loading}
                            className="px-4 bg-gray-900 text-white hover:bg-gray-800 h-9 font-light"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add reason
                        </Button>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-6 font-light">
                        Customize the list of reasons that members can select when modifying time.
                    </p>

                    {/* Reasons Table */}
                    <div className="mt-6">
                        {/* Table Header */}
                        <div className="py-3 border-b border-gray-200">
                            <span className="text-sm font-medium text-gray-900">Reason</span>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-200 min-h-[100px] relative">
                            {loading ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                                </div>
                            ) : null}

                            {reasons.length === 0 && !loading ? (
                                <div className="py-10 text-center text-gray-500 text-sm italic">
                                    No reasons configured
                                </div>
                            ) : (
                                reasons.map((reason) => (
                                    <div key={reason.id} className="flex items-center justify-between py-4">
                                        <span className="text-sm text-gray-900">{reason.text}</span>
                                        <div className="relative">
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowActionsMenu(showActionsMenu === reason.id ? null : reason.id)}
                                                className="px-4 py-2 h-8 text-sm border-gray-300 bg-white hover:bg-gray-50 font-light"
                                            >
                                                Actions
                                                <ChevronDown className="w-3.5 h-3.5 ml-1" />
                                            </Button>

                                            {showActionsMenu === reason.id && (
                                                <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden text-sm">
                                                    <button
                                                        onClick={() => handleEditReason(reason.id)}
                                                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-100 transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteReason(reason.id)}
                                                        className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-gray-100 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        
            </SettingsContentLayout>
</div>
    )
}
