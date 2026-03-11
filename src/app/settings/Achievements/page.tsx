"use client"

import React, { useState, useEffect } from "react"
import { Info, Search, Loader2, Clock, ChevronLeft, ChevronRight, Users } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useOrgStore } from "@/store/org-store"
import { getSettingsMembers, type SettingsMember } from "@/action/settings-members"
import { getAchievementSettings, upsertAchievementSetting, getAllMemberAchievementSettings } from "@/action/achievement-settings"
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"
import { MemberAvatar } from "@/components/profile&image/MemberAvatar"


export default function EfficiencyProPage() {
    const { organizationId } = useOrgStore()
    const [members, setMembers] = useState<SettingsMember[]>([])
    const [totalMembers, setTotalMembers] = useState(0)
    const [loading, setLoading] = useState(true)
    const [globalEnabled, setGlobalEnabled] = useState(true)
    const [globalActivityGoal, setGlobalActivityGoal] = useState(50)
    const [memberSettings, setMemberSettings] = useState<Record<string, { enabled: boolean, goal: number }>>({})
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Fetch Members and Settings
    useEffect(() => {
        async function loadData() {
            if (!organizationId) {
                setLoading(false)
                return
            }

            setLoading(true)
            try {
                const [membersRes, achievementSettingsRes, allMemberSettingsRes] = await Promise.all([
                    getSettingsMembers(String(organizationId)),
                    getAchievementSettings(String(organizationId), 'efficiency_pro'),
                    getAllMemberAchievementSettings(String(organizationId), 'efficiency_pro')
                ])

                if (membersRes.success && membersRes.data) {
                    // Manual filtering for search query as getSettingsMembers doesn't support it yet
                    const filtered = searchQuery
                        ? membersRes.data.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        : membersRes.data

                    const start = (currentPage - 1) * itemsPerPage
                    const paginated = filtered.slice(start, start + itemsPerPage)

                    setMembers(paginated)
                    setTotalMembers(filtered.length)
                }

                if (achievementSettingsRes.success && achievementSettingsRes.data) {
                    setGlobalEnabled(achievementSettingsRes.data.is_enabled)
                    setGlobalActivityGoal(Number(achievementSettingsRes.data.goal_value))
                }

                if (allMemberSettingsRes.success && allMemberSettingsRes.data) {
                    const overrides: Record<string, { enabled: boolean, goal: number }> = {}
                    Object.entries(allMemberSettingsRes.data).forEach(([mId, settings]) => {
                        overrides[mId] = {
                            enabled: settings.is_enabled,
                            goal: Number(settings.goal_value)
                        }
                    })
                    setMemberSettings(overrides)
                }
            } catch (err: any) {
                console.error("Failed to load efficiency pro data", err)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [organizationId, currentPage, searchQuery])

    const handleApplyToAll = async () => {
        if (!organizationId) return
        try {
            setLoading(true)
            await upsertAchievementSetting({
                organization_id: Number(organizationId),
                achievement_type: 'efficiency_pro',
                is_enabled: globalEnabled,
                goal_value: globalActivityGoal,
                organization_member_id: null
            })
            toast.success("Default settings updated")
        } catch (err) {
            toast.error("Failed to apply settings")
        } finally {
            setLoading(false)
        }
    }

    const handleGlobalEnabledChange = async (val: boolean) => {
        setGlobalEnabled(val)
        if (!organizationId) return
        try {
            await upsertAchievementSetting({
                organization_id: Number(organizationId),
                achievement_type: 'efficiency_pro',
                is_enabled: val,
                goal_value: globalActivityGoal,
                organization_member_id: null
            })
        } catch (e) {
            console.error(e)
        }
    }

    const handleGlobalGoalChange = async (val: number) => {
        setGlobalActivityGoal(val)
        if (!organizationId) return
        try {
            await upsertAchievementSetting({
                organization_id: Number(organizationId),
                achievement_type: 'efficiency_pro',
                is_enabled: globalEnabled,
                goal_value: val,
                organization_member_id: null
            })
        } catch (e) {
            console.error(e)
        }
    }

    const handleMemberEnabledChange = async (memberId: string, enabled: boolean) => {
        const goal = getMemberGoal(memberId)
        setMemberSettings(prev => ({
            ...prev,
            [memberId]: { enabled, goal }
        }))

        try {
            await upsertAchievementSetting({
                organization_id: Number(organizationId),
                achievement_type: 'efficiency_pro',
                organization_member_id: Number(memberId),
                is_enabled: enabled,
                goal_value: goal
            })
        } catch (e) {
            console.error(e)
        }
    }

    const handleMemberGoalChange = async (memberId: string, goal: number) => {
        const enabled = getMemberEnabled(memberId)
        setMemberSettings(prev => ({
            ...prev,
            [memberId]: { enabled, goal }
        }))

        try {
            await upsertAchievementSetting({
                organization_id: Number(organizationId),
                achievement_type: 'efficiency_pro',
                organization_member_id: Number(memberId),
                is_enabled: enabled,
                goal_value: goal
            })
        } catch (e) {
            console.error(e)
        }
    }

    const getMemberEnabled = (memberId: string) => {
        return memberSettings[memberId]?.enabled ?? globalEnabled
    }

    const getMemberGoal = (memberId: string) => {
        return memberSettings[memberId]?.goal ?? globalActivityGoal
    }

    const handleSearchChange = (val: string) => {
        setSearchQuery(val)
        setCurrentPage(1)
    }

    const totalPages = Math.ceil(totalMembers / itemsPerPage)

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
                    <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
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
                            onCheckedChange={handleGlobalEnabledChange}
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
                        <h4 className="text-sm font-normal text-gray-900">Efficiency pro</h4>
                        <p className="text-sm text-gray-500">Reach the goal for activity each day</p>
                    </div>
                </div>

                {/* Activity Goal */}
                <div className="flex items-center gap-1 mb-3">
                    <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                        ACTIVITY GOAL
                    </span>
                    <Info className="w-3.5 h-3.5 text-gray-400" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-10">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-full sm:w-fit">
                        <Input
                            type="number"
                            value={globalActivityGoal}
                            onChange={(e) => handleGlobalGoalChange(Number(e.target.value))}
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
                        <h3 className="text-lg font-normal text-gray-900 mb-1">Individual settings</h3>
                        <p className="text-sm text-gray-500">Override the organization default for specific members</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search members"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full sm:w-64 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                        />
                    </div>
                </div>

                {/* Members Table */}
                <div className="mt-6">
                    {/* Table Header - Hidden on mobile */}
                    <div className="hidden sm:grid grid-cols-3 py-3 border-b border-gray-200">
                        <span className="text-sm font-normal text-gray-900">Name</span>
                        <span className="text-sm font-normal text-gray-900">Efficiency pro</span>
                        <span className="text-sm font-normal text-gray-900">Activity goal</span>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-200">
                        {loading && members.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                                <span className="text-xs font-light uppercase tracking-widest">Loading members...</span>
                            </div>
                        ) : members.length === 0 ? (
                            <div className="py-20 text-center text-slate-400">
                                <span className="text-xs font-light uppercase tracking-widest">No members found</span>
                            </div>
                        ) : members.map((member) => (
                            <div key={member.id} className="flex flex-col gap-4 sm:grid sm:grid-cols-3 sm:items-center py-4 border-b border-gray-100 last:border-0">
                                <div className="flex items-center gap-3">
                                    <MemberAvatar
                                        src={member.avatar}
                                        name={member.name}
                                        className="w-8 h-8"
                                    />
                                    <span className="text-sm text-slate-900">{member.name}</span>
                                </div>
                                <div className="flex items-center justify-between sm:justify-start gap-2">
                                    <span className="text-xs font-medium text-gray-500 sm:hidden">Enabled:</span>
                                    <Switch
                                        checked={getMemberEnabled(member.id)}
                                        onCheckedChange={(checked) => handleMemberEnabledChange(member.id, checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between sm:justify-start gap-2">
                                    <span className="text-xs font-medium text-gray-500 sm:hidden">Activity Goal:</span>
                                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit">
                                        <Input
                                            type="number"
                                            value={getMemberGoal(member.id)}
                                            onChange={(e) => handleMemberGoalChange(member.id, Number(e.target.value))}
                                            className="w-16 border-0 text-center text-sm"
                                        />
                                        <span className="px-2 py-1.5 bg-gray-100 text-xs text-gray-600 border-l border-gray-300">%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {!loading && members.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-8 gap-4 px-2">
                            <div className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalMembers)} of {totalMembers} members
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="text-[10px] font-normal text-slate-500 uppercase tracking-widest px-2">
                                    Page {currentPage} of {totalPages || 1}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </SettingsContentLayout>
        </div>
    )
}
