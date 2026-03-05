"use client"

import React, { useState } from "react"
import { Info, Search, User } from "lucide-react"
import { SettingsHeader, SettingTab } from "@/components/settings/SettingsHeader"
import { Calendar } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"

interface Member {
    id: string
    name: string
    alertSetting: "both" | "management" | "user" | "no-one"
}

const DUMMY_MEMBERS: Member[] = [
    { id: "1", name: "fatur fris", alertSetting: "both" },
    { id: "2", name: "Muhammad Ma'Arif", alertSetting: "both" },
]

export default function ShiftAlertsPage() {
    const [globalSetting, setGlobalSetting] = useState<"both" | "management" | "user" | "no-one">("both")
    const [members, setMembers] = useState<Member[]>(DUMMY_MEMBERS)
    const [searchQuery, setSearchQuery] = useState("")

    const sidebarItems: SidebarItem[] = [
        { id: "calendar-type", label: "Calendar type", href: "/settings/Calender" },
        { id: "shift-alerts", label: "Shift alerts", href: "/settings/Calender/shift-alerts" },
        { id: "grace-period", label: "Grace period", href: "/settings/Calender/grace-period" },
    ]

    const alertOptions: { value: "both" | "management" | "user" | "no-one"; label: string }[] = [
        { value: "both", label: "Both" },
        { value: "management", label: "Management" },
        { value: "user", label: "User" },
        { value: "no-one", label: "No one" },
    ]

    const handleMemberAlertChange = (id: string, setting: "both" | "management" | "user" | "no-one") => {
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, alertSetting: setting } : member
            )
        )
    }

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const tabs: SettingTab[] = [
        { label: "CALENDAR", href: "/settings/Calender", active: true },
        { label: "JOB SITES", href: "/settings/Job-sites", active: false },
        { label: "MAP", href: "/settings/Map", active: false },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Schedules"
                Icon={Calendar}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="shift-alerts"
            />

            {/* Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {/* Section Title */}
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                            SHIFT ALERTS
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-6">
                        Control who receives alerts about a member
                    </p>

                    {/* Global Label */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                            GLOBAL:
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Global Toggle Buttons */}
                    <div className="inline-flex rounded-full bg-gray-100 p-0.5 mb-10">
                        {alertOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setGlobalSetting(option.value)}
                                className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${globalSetting === option.value
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {/* Individual Settings Section */}
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="text-lg font-normal text-gray-900 mb-1">Individual settings</h3>
                            <p className="text-sm text-gray-500">Override the organization default for specific members</p>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search members"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                            />
                        </div>
                    </div>

                    {/* Members Table */}
                    <div className="mt-6">
                        {/* Table Header */}
                        <div className="py-3 border-b border-gray-200">
                            <span className="text-sm font-normal text-gray-900">Name</span>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-200">
                            {filteredMembers.map((member) => (
                                <div key={member.id} className="flex items-center justify-between py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                            <User className="w-4 h-4 text-gray-500" />
                                        </div>
                                        <span className="text-sm text-gray-900">{member.name}</span>
                                    </div>
                                    <div className="inline-flex rounded-full bg-gray-100 p-0.5">
                                        {alertOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleMemberAlertChange(member.id, option.value)}
                                                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${member.alertSetting === option.value
                                                    ? "bg-white text-gray-900 shadow-sm"
                                                    : "text-gray-500 hover:text-gray-700"
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
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
