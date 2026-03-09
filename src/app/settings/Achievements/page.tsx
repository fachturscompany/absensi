"use client"

import React, { useState, useMemo } from "react"
import { Info, Search, User, Clock } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { DUMMY_MEMBERS as SHARED_MEMBERS } from "@/lib/data/dummy-data"
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"
import { Users } from "lucide-react"

interface MemberWithSettings {
    id: string
    name: string
    avatar?: string
    enabled: boolean
    activityGoal: number
}

export default function EfficiencyProPage() {
    const initialMembers: MemberWithSettings[] = useMemo(() =>
        SHARED_MEMBERS.map(m => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            enabled: true,
            activityGoal: 50
        })), []
    )

    const [globalEnabled, setGlobalEnabled] = useState(true)
    const [globalActivityGoal, setGlobalActivityGoal] = useState(50)
    const [members, setMembers] = useState<MemberWithSettings[]>(initialMembers)
    const [searchQuery, setSearchQuery] = useState("")



    const handleApplyToAll = () => {
        setMembers(prev =>
            prev.map(member => ({
                ...member,
                enabled: globalEnabled,
                activityGoal: globalActivityGoal
            }))
        )
    }

    const handleMemberEnabledChange = (id: string, enabled: boolean) => {
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, enabled } : member
            )
        )
    }

    const handleMemberGoalChange = (id: string, activityGoal: number) => {
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, activityGoal } : member
            )
        )
    }

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const tabs: SettingTab[] = [
        { label: "EMAIL NOTIFICATIONS", href: "/settings/members/email-notifications", active: false },
        { label: "WORK TIME LIMITS", href: "/settings/work-time-limit", active: false },
        { label: "PAYMENTS", href: "/settings/payments", active: false },
        { label: "ACHIEVEMENTS", href: "/settings/Achievements", active: true },
    ]

    const sidebarItems = [
        { id: "efficiency-pro", label: "Efficiency pro", href: "/settings/Achievements" },
        { id: "productivity-champ", label: "Productivity champ", href: "/settings/Achievements/productivity-champ" },
        { id: "time-hero", label: "Time hero", href: "/settings/Achievements/time-hero" },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Members"
                Icon={Users}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="efficiency-pro"
            />

            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="efficiency-pro">
                {/* Section Title */}
                <div className="flex items-center gap-1 mb-2">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        EFFICIENCY PRO
                    </span>
                    <Info className="w-3.5 h-3.5 text-gray-400" />
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-6">
                    This achievement badge is given to members every day their activity meets the activity goal. They can win this badge multiple days in a row to create hot streaks.
                </p>

                {/* Default Label */}
                <div className="flex items-center gap-1 mb-3">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        DEFAULT:
                    </span>
                    <Info className="w-3.5 h-3.5 text-gray-400" />
                </div>

                {/* Default Settings Row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <Switch
                            checked={globalEnabled}
                            onCheckedChange={setGlobalEnabled}
                        />
                        {/* Badge Icon - Hexagon with Clock */}
                        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                            <svg viewBox="0 0 100 100" className="w-12 h-12">
                                <polygon
                                    points="50,3 93,25 93,75 50,97 7,75 7,25"
                                    fill="#ef4444"
                                    stroke="#ef4444"
                                    strokeWidth="2"
                                />
                            </svg>
                            <Clock className="w-5 h-5 text-white absolute" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900">Efficiency pro</h4>
                        <p className="text-sm text-gray-500">Reach the goal for activity each day</p>
                    </div>
                </div>

                {/* Activity Goal */}
                <div className="flex items-center gap-1 mb-3">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        ACTIVITY GOAL
                    </span>
                    <Info className="w-3.5 h-3.5 text-gray-400" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-10">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-full sm:w-fit">
                        <Input
                            type="number"
                            value={globalActivityGoal}
                            onChange={(e) => setGlobalActivityGoal(Number(e.target.value))}
                            className="w-full sm:w-20 border-0 text-center"
                        />
                        <span className="px-3 py-2 bg-gray-100 text-sm text-gray-600 border-l border-gray-300">%</span>
                    </div>
                    <Button
                        onClick={handleApplyToAll}
                        className="px-6 bg-gray-900 text-white hover:bg-gray-800 w-full sm:w-auto"
                    >
                        Apply to all
                    </Button>
                </div>

                {/* Individual Settings Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Individual settings</h3>
                        <p className="text-sm text-gray-500">Override the organization default for specific members</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search members"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full sm:w-64 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                        />
                    </div>
                </div>

                {/* Members Table */}
                <div className="mt-6">
                    {/* Table Header - Hidden on mobile */}
                    <div className="hidden sm:grid grid-cols-3 py-3 border-b border-gray-200">
                        <span className="text-sm font-semibold text-gray-900">Name</span>
                        <span className="text-sm font-semibold text-gray-900">Efficiency pro</span>
                        <span className="text-sm font-semibold text-gray-900">Activity goal</span>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-200">
                        {filteredMembers.map((member) => (
                            <div key={member.id} className="flex flex-col gap-4 sm:grid sm:grid-cols-3 sm:items-center py-4 border-b border-gray-100 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                        <User className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <span className="text-sm text-gray-900">{member.name}</span>
                                </div>
                                <div className="flex items-center justify-between sm:justify-start gap-2">
                                    <span className="text-xs font-medium text-gray-500 sm:hidden">Enabled:</span>
                                    <Switch
                                        checked={member.enabled}
                                        onCheckedChange={(checked) => handleMemberEnabledChange(member.id, checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between sm:justify-start gap-2">
                                    <span className="text-xs font-medium text-gray-500 sm:hidden">Activity Goal:</span>
                                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit">
                                        <Input
                                            type="number"
                                            value={member.activityGoal}
                                            onChange={(e) => handleMemberGoalChange(member.id, Number(e.target.value))}
                                            className="w-16 border-0 text-center text-sm"
                                        />
                                        <span className="px-2 py-1.5 bg-gray-100 text-xs text-gray-600 border-l border-gray-300">%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="py-3 text-sm text-gray-500">
                        Showing {filteredMembers.length} of {members.length} members
                    </div>
                </div>
            </SettingsContentLayout>
        </div>
    )
}