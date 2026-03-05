"use client"

import React, { useState, useMemo } from "react"
import { Info, Search, User, Clock } from "lucide-react"

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
    weeklyHoursGoal: number
}

export default function TimeHeroPage() {
    const initialMembers: MemberWithSettings[] = useMemo(() =>
        SHARED_MEMBERS.map(m => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            enabled: true,
            weeklyHoursGoal: 40
        })), []
    )

    const [globalEnabled, setGlobalEnabled] = useState(true)
    const [globalWeeklyHoursGoal, setGlobalWeeklyHoursGoal] = useState(40)
    const [members, setMembers] = useState<MemberWithSettings[]>(initialMembers)
    const [searchQuery, setSearchQuery] = useState("")



    const handleApplyToAll = () => {
        setMembers(prev =>
            prev.map(member => ({
                ...member,
                enabled: globalEnabled,
                weeklyHoursGoal: globalWeeklyHoursGoal
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

    const handleMemberGoalChange = (id: string, weeklyHoursGoal: number) => {
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, weeklyHoursGoal } : member
            )
        )
    }

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const tabs: SettingTab[] = [
        { label: "EFFICIENCY PRO", href: "/settings/Achievements", active: false },
        { label: "PRODUCTIVITY CHAMP", href: "/settings/Achievements/productivity-champ", active: false },
        { label: "TIME HERO", href: "/settings/Achievements/time-hero", active: true },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Achievements"
                Icon={Trophy}
                tabs={tabs}
                sidebarItems={[
                    { id: "efficiency-pro", label: "Efficiency pro", href: "/settings/Achievements" },
                    { id: "productivity-champ", label: "Productivity champ", href: "/settings/Achievements/productivity-champ" },
                    { id: "time-hero", label: "Time hero", href: "/settings/Achievements/time-hero" },
                ]}
                activeItemId="time-hero"
            />

            {/* Main Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-6 w-full overflow-x-hidden">
                    {/* Section Title */}
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                            TIME HERO
                        </span>
                        <Info className="w-3.5 h-3.5 text-slate-300" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-500 mb-8 max-w-2xl leading-relaxed">
                        This achievement badge is given to members every week their hours meet the weekly hours goal. They can win this badge multiple weeks in a row to create hot streaks.
                    </p>

                    {/* Default Label */}
                    <div className="flex items-center gap-1 mb-4">
                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                            DEFAULT SETTINGS:
                        </span>
                        <Info className="w-3.5 h-3.5 text-slate-300" />
                    </div>

                    {/* Default Settings Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-4">
                            <Switch
                                checked={globalEnabled}
                                onCheckedChange={setGlobalEnabled}
                                className="data-[state=checked]:bg-slate-900"
                            />
                            {/* Badge Icon - Hexagon with Clock */}
                            <div className="relative w-14 h-14 flex items-center justify-center shrink-0 drop-shadow-md">
                                <svg viewBox="0 0 100 100" className="w-14 h-14">
                                    <polygon
                                        points="50,3 93,25 93,75 50,97 7,75 7,25"
                                        fill="#3b82f6"
                                        stroke="#2563eb"
                                        strokeWidth="2"
                                    />
                                </svg>
                                <Clock className="w-6 h-6 text-white absolute" />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-base font-normal text-slate-900">Time hero</h4>
                            <p className="text-sm text-slate-500">Reach the goal for total hours worked each week</p>
                        </div>
                    </div>

                    {/* Weekly Hours Goal */}
                    <div className="flex items-center gap-1 mb-4">
                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                            WEEKLY HOURS GOAL
                        </span>
                        <Info className="w-3.5 h-3.5 text-slate-300" />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-12">
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-slate-400 transition-all w-full sm:w-fit">
                            <Input
                                type="number"
                                value={globalWeeklyHoursGoal}
                                onChange={(e) => setGlobalWeeklyHoursGoal(Number(e.target.value))}
                                className="w-full sm:w-24 border-0 text-center font-normal text-slate-900 h-10 focus-visible:ring-0"
                            />
                            <span className="px-4 py-2 bg-slate-50 text-[10px] font-normal text-slate-500 border-l border-slate-200 uppercase tracking-widest">hours</span>
                        </div>
                        <Button
                            onClick={handleApplyToAll}
                            className="px-8 bg-slate-900 text-white hover:bg-slate-800 h-10 rounded-xl font-normal transition-all active:scale-95 shadow-lg shadow-slate-100 w-full sm:w-auto"
                        >
                            Apply to all members
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
                            <span className="text-sm font-normal text-gray-900">Time hero</span>
                            <span className="text-sm font-normal text-gray-900">Weekly hours goal</span>
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
                                                value={member.weeklyHoursGoal}
                                                onChange={(e) => handleMemberGoalChange(member.id, Number(e.target.value))}
                                                className="w-16 border-0 text-center text-sm"
                                            />
                                            <span className="px-2 py-1.5 bg-gray-100 text-xs text-gray-600 border-l border-gray-300">hours</span>
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
