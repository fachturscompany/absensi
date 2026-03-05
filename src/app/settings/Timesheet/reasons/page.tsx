"use client"

import React, { useState } from "react"
import { ChevronDown, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SettingsHeader, SettingTab } from "@/components/settings/SettingsHeader"
import { Activity } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"

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
    const [reasons, setReasons] = useState<Reason[]>(INITIAL_REASONS)
    const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null)



    const handleAddReason = () => {
        const newReason: Reason = {
            id: Date.now().toString(),
            text: "New reason"
        }
        setReasons([...reasons, newReason])
    }

    const handleDeleteReason = (id: string) => {
        setReasons(reasons.filter(r => r.id !== id))
        setShowActionsMenu(null)
    }

    const handleEditReason = (id: string) => {
        const newText = prompt("Enter new reason text:")
        if (newText) {
            setReasons(reasons.map(r =>
                r.id === id ? { ...r, text: newText } : r
            ))
        }
        setShowActionsMenu(null)
    }

    const tabs: SettingTab[] = [
        { label: "ACTIVITY", href: "/settings/Activity", active: false },
        { label: "TIMESHEETS", href: "/settings/Timesheet", active: true },
        { label: "TRACKING", href: "/settings/tracking", active: false },
        { label: "SCREENSHOTS", href: "/settings/screenshot", active: false },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "timesheet-approvals", label: "Timesheet approvals", href: "/settings/Timesheet" },
        { id: "require-reason", label: "Require reason", href: "/settings/Timesheet/require-reason" },
        { id: "reasons", label: "Reasons", href: "/settings/Timesheet/reasons" },
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

            {/* Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                            REASONS
                        </span>
                        <Button
                            onClick={handleAddReason}
                            className="px-4 bg-gray-900 text-white hover:bg-gray-800"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add reason
                        </Button>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-6">
                        Customize the list of reasons that members can select when modifying time.
                    </p>

                    {/* Reasons Table */}
                    <div className="mt-6">
                        {/* Table Header */}
                        <div className="py-3 border-b border-gray-200">
                            <span className="text-sm font-normal text-gray-900">Reason</span>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-200">
                            {reasons.map((reason) => (
                                <div key={reason.id} className="flex items-center justify-between py-4">
                                    <span className="text-sm text-gray-900">{reason.text}</span>
                                    <div className="relative">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowActionsMenu(showActionsMenu === reason.id ? null : reason.id)}
                                            className="px-4 py-2 text-sm border-gray-300 bg-white hover:bg-gray-50"
                                        >
                                            Actions
                                            <ChevronDown className="w-4 h-4 ml-1" />
                                        </Button>

                                        {showActionsMenu === reason.id && (
                                            <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                                <button
                                                    onClick={() => handleEditReason(reason.id)}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteReason(reason.id)}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
