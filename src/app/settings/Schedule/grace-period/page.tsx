"use client"

import React, { useState, useMemo } from "react"
import { Calendar, Search, Info, User } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { SettingsHeader, type SettingTab } from "@/components/settings/SettingsHeader"
import { Button } from "@/components/ui/button"
import { DUMMY_MEMBERS as SHARED_MEMBERS } from "@/lib/data/dummy-data"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface MemberWithGrace {
    id: string
    name: string
    avatar?: string
    gracePeriod: string
}

export default function GracePeriodPage() {
    // Convert shared members to include grace period settings
    const initialMembers: MemberWithGrace[] = useMemo(() =>
        SHARED_MEMBERS.map(m => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            gracePeriod: "5"
        })), []
    )

    const [globalGracePeriod, setGlobalGracePeriod] = useState("5")
    const [members, setMembers] = useState<MemberWithGrace[]>(initialMembers)
    const [searchQuery, setSearchQuery] = useState("")

    const sidebarItems: SidebarItem[] = [
        { id: "calendar-type", label: "Calendar type", href: "/settings/Schedule" },
        { id: "shift-alerts", label: "Shift alerts", href: "/settings/Schedule/shift-alerts" },
        { id: "grace-period", label: "Grace period", href: "/settings/Schedule/grace-period" },
    ]

    const gracePeriodOptions = ["1", "2", "3", "5", "10", "15", "20", "30"]

    const handleMemberGracePeriodChange = (id: string, value: string) => {
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, gracePeriod: value } : member
            )
        )
    }

    const handleApplyToAll = () => {
        setMembers(prev =>
            prev.map(member => ({ ...member, gracePeriod: globalGracePeriod }))
        )
    }

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const tabs: SettingTab[] = [
        { label: "CALENDAR", href: "/settings/Calender", active: true },
        { label: "SCHEDULE", href: "/settings/Schedule", active: false },
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
                activeItemId="grace-period"
            />

            {/* Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                    {/* Section Title */}
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                            GRACE PERIOD
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-6">
                        Set a grace period for determining if a shift is considered late.
                    </p>

                    {/* Global Label */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                            GLOBAL:
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Global Grace Period Row */}
                    <div className="flex items-center gap-4 mb-10">
                        <Select value={globalGracePeriod} onValueChange={setGlobalGracePeriod}>
                            <SelectTrigger className="w-[120px] h-10 border-gray-300 bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {gracePeriodOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option} min
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleApplyToAll}
                            className="h-10 px-6 bg-gray-900 text-white hover:bg-gray-800"
                        >
                            Apply to all
                        </Button>
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
                                    <Select
                                        value={member.gracePeriod}
                                        onValueChange={(value) => handleMemberGracePeriodChange(member.id, value)}
                                    >
                                        <SelectTrigger className="w-[100px] h-9 border-gray-300 bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {gracePeriodOptions.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option} min
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
