"use client"

import React, { useState, useMemo } from "react"
import { Info, Search, User } from "lucide-react"

import { DUMMY_MEMBERS as SHARED_MEMBERS } from "@/lib/data/dummy-data"
import { SettingsHeader, SettingTab } from "@/components/settings/SettingsHeader"
import { Calendar } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"

interface MemberWithSetting {
    id: string
    name: string
    avatar?: string
    enabled: boolean
}

export default function EnterExitNotificationsPage() {
    // Convert shared members to include setting
    const initialMembers: MemberWithSetting[] = useMemo(() =>
        SHARED_MEMBERS.map(m => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            enabled: true
        })), []
    )

    const [globalEnabled, setGlobalEnabled] = useState(true)
    const [members, setMembers] = useState<MemberWithSetting[]>(initialMembers)
    const [searchQuery, setSearchQuery] = useState("")



    const handleGlobalChange = (enabled: boolean) => {
        setGlobalEnabled(enabled)
        setMembers(prev =>
            prev.map(member => ({ ...member, enabled }))
        )
    }

    const handleMemberChange = (id: string, enabled: boolean) => {
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, enabled } : member
            )
        )
    }

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const tabs: SettingTab[] = [
        { label: "CALENDAR", href: "/settings/Calender", active: false },
        { label: "JOB SITES", href: "/settings/Job-sites", active: true },
        { label: "MAP", href: "/settings/Map", active: false },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "restrict-timer", label: "Restrict timer to job sites", href: "/settings/Job-sites" },
        { id: "enter-exit-notifications", label: "Enter/exit notifications", href: "/settings/Job-sites/enter-exit-notifications" },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Schedules"
                Icon={Calendar}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="enter-exit-notifications"
            />

            {/* Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                    {/* Section Title */}
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                            ENTER/EXIT NOTIFICATIONS
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-6">
                        Notify management when a job site is entered or exited
                    </p>

                    {/* Global Label */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                            GLOBAL:
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Global Toggle Buttons - Pill style like Shift Alerts */}
                    <div className="inline-flex rounded-full bg-gray-100 p-0.5 mb-10">
                        <button
                            onClick={() => handleGlobalChange(true)}
                            className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${globalEnabled
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            On
                        </button>
                        <button
                            onClick={() => handleGlobalChange(false)}
                            className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${!globalEnabled
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Off
                        </button>
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
                                    {/* Member Toggle Buttons - Pill style */}
                                    <div className="inline-flex rounded-full bg-gray-100 p-0.5">
                                        <button
                                            onClick={() => handleMemberChange(member.id, true)}
                                            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${member.enabled
                                                ? "bg-white text-gray-900 shadow-sm"
                                                : "text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            On
                                        </button>
                                        <button
                                            onClick={() => handleMemberChange(member.id, false)}
                                            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${!member.enabled
                                                ? "bg-white text-gray-900 shadow-sm"
                                                : "text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            Off
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="py-3 text-sm text-gray-500">
                            Showing {filteredMembers.length} of {members.length} members
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
