"use client"

import React, { useState, useMemo } from "react"
import { Info, Search, User, CheckSquare } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { DUMMY_MEMBERS as SHARED_MEMBERS } from "@/lib/data/dummy-data"
import { SettingsHeader, SettingTab } from "@/components/settings/SettingsHeader"
import { Trophy } from "lucide-react"

interface MemberWithSettings {
    id: string
    name: string
    avatar?: string
    enabled: boolean
    weeklyTodosGoal: number
}

export default function ProductivityChampPage() {
    const initialMembers: MemberWithSettings[] = useMemo(() =>
        SHARED_MEMBERS.map(m => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            enabled: true,
            weeklyTodosGoal: 5
        })), []
    )

    const [globalEnabled, setGlobalEnabled] = useState(true)
    const [globalWeeklyTodosGoal, setGlobalWeeklyTodosGoal] = useState(5)
    const [members, setMembers] = useState<MemberWithSettings[]>(initialMembers)
    const [searchQuery, setSearchQuery] = useState("")



    const handleApplyToAll = () => {
        setMembers(prev =>
            prev.map(member => ({
                ...member,
                enabled: globalEnabled,
                weeklyTodosGoal: globalWeeklyTodosGoal
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

    const handleMemberGoalChange = (id: string, weeklyTodosGoal: number) => {
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, weeklyTodosGoal } : member
            )
        )
    }

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const tabs: SettingTab[] = [
        { label: "MEMBERS", href: "/settings", active: false },
        { label: "ORG CHART", href: "/settings/org-chart", active: false },
        { label: "EMAIL NOTIFICATIONS", href: "/settings/email-notifications", active: false },
        { label: "WORK TIME LIMIT", href: "/settings/work-time-limit", active: false },
        { label: "PAYMENTS", href: "/settings/payments", active: false },
        { label: "ACHIEVEMENTS", href: "/settings/Achievements", active: true },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Members"
                Icon={Trophy}
                tabs={tabs}
                sidebarItems={[
                    { id: "efficiency-pro", label: "Efficiency pro", href: "/settings/Achievements" },
                    { id: "productivity-champ", label: "Productivity champ", href: "/settings/Achievements/productivity-champ" },
                    { id: "time-hero", label: "Time hero", href: "/settings/Achievements/time-hero" },
                ]}
                activeItemId="productivity-champ"
            />

            {/* Main Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-6 w-full overflow-x-hidden">
                    {/* Section Title */}
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                            PRODUCTIVITY CHAMP
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-6">
                        This achievement badge is given to members every week they meet the weekly to-dos goal. They can win this badge multiple weeks in a row to create hot streaks.
                    </p>

                    {/* Default Label */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
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
                            {/* Badge Icon - Hexagon with Checkmark */}
                            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                                <svg viewBox="0 0 100 100" className="w-12 h-12">
                                    <polygon
                                        points="50,3 93,25 93,75 50,97 7,75 7,25"
                                        fill="#10b981"
                                        stroke="#10b981"
                                        strokeWidth="2"
                                    />
                                </svg>
                                <CheckSquare className="w-5 h-5 text-white absolute" />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-normal text-gray-900">Productivity champ</h4>
                            <p className="text-sm text-gray-500">Reach the goal for completed to-dos each week</p>
                        </div>
                    </div>

                    {/* Weekly To-dos Goal */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                            WEEKLY TO-DOS GOAL
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-10">
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-full sm:w-fit">
                            <Input
                                type="number"
                                value={globalWeeklyTodosGoal}
                                onChange={(e) => setGlobalWeeklyTodosGoal(Number(e.target.value))}
                                className="w-full sm:w-20 border-0 text-center"
                            />
                            <span className="px-3 py-2 bg-gray-100 text-sm text-gray-600 border-l border-gray-300 whitespace-nowrap">to-dos</span>
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
                                className="pl-10 pr-4 py-2 w-full sm:w-64 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                            />
                        </div>
                    </div>

                    {/* Members Table */}
                    <div className="mt-6">
                        {/* Table Header - Hidden on mobile */}
                        <div className="hidden sm:grid grid-cols-3 py-3 border-b border-gray-200">
                            <span className="text-sm font-normal text-gray-900">Name</span>
                            <span className="text-sm font-normal text-gray-900">Productivity champ</span>
                            <span className="text-sm font-normal text-gray-900">Weekly to-dos goal</span>
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
                                        <span className="text-xs font-medium text-gray-500 sm:hidden">Goal:</span>
                                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit">
                                            <Input
                                                type="number"
                                                value={member.weeklyTodosGoal}
                                                onChange={(e) => handleMemberGoalChange(member.id, Number(e.target.value))}
                                                className="w-16 border-0 text-center text-sm"
                                            />
                                            <span className="px-2 py-1.5 bg-gray-100 text-xs text-gray-600 border-l border-gray-300">to-dos</span>
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
                </div>
            </div>
        </div>
    )
}
