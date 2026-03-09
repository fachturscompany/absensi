"use client"
import React, { useState, useEffect } from "react"
import { Info, Search, Clock, Loader2, Trophy } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useOrgStore } from "@/store/org-store"
import { getMembersForScreenshot, type ISimpleMember } from "@/action/screenshots"
import { getOrgSettings, upsertOrgSetting, getAllMemberSettings, upsertMemberSetting } from "@/action/organization-settings"
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"
import { MemberAvatar } from "@/components/profile&image/MemberAvatar"

export default function TimeHeroPage() {
    const { organizationId } = useOrgStore()
    const [members, setMembers] = useState<ISimpleMember[]>([])
    const [totalMembers, setTotalMembers] = useState(0)
    const [loading, setLoading] = useState(true)
    const [globalEnabled, setGlobalEnabled] = useState(true)
    const [globalWeeklyHoursGoal, setGlobalWeeklyHoursGoal] = useState(40)
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
                const [membersRes, orgSettingsRes, allMemberSettingsRes] = await Promise.all([
                    getMembersForScreenshot(
                        String(organizationId),
                        { page: currentPage, limit: itemsPerPage },
                        searchQuery
                    ),
                    getOrgSettings(String(organizationId)),
                    getAllMemberSettings(String(organizationId))
                ])

                if (membersRes.success && membersRes.data) {
                    setMembers(membersRes.data)
                    setTotalMembers(membersRes.total ?? 0)
                }

                if (orgSettingsRes.success && orgSettingsRes.data) {
                    if (orgSettingsRes.data.achievement_timehero_enabled !== undefined) {
                        setGlobalEnabled(orgSettingsRes.data.achievement_timehero_enabled)
                    }
                    if (orgSettingsRes.data.achievement_timehero_goal !== undefined) {
                        setGlobalWeeklyHoursGoal(orgSettingsRes.data.achievement_timehero_goal)
                    }
                }

                if (allMemberSettingsRes.success && allMemberSettingsRes.data) {
                    const overrides: Record<string, { enabled: boolean, goal: number }> = {}
                    Object.entries(allMemberSettingsRes.data).forEach(([mId, settings]) => {
                        if (settings.achievement_timehero_enabled !== undefined || settings.achievement_timehero_goal !== undefined) {
                            overrides[mId] = {
                                enabled: settings.achievement_timehero_enabled ?? globalEnabled,
                                goal: settings.achievement_timehero_goal ?? globalWeeklyHoursGoal
                            }
                        }
                    })
                    setMemberSettings(overrides)
                }
            } catch (err) {
                console.error("Failed to load time hero data", err)
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
            await upsertOrgSetting(String(organizationId), {
                achievement_timehero_enabled: globalEnabled,
                achievement_timehero_goal: globalWeeklyHoursGoal
            })
            toast.success("Default settings updated and applied")
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
            await upsertOrgSetting(String(organizationId), { achievement_timehero_enabled: val })
        } catch (e) {
            console.error(e)
        }
    }

    const handleGlobalGoalChange = async (val: number) => {
        setGlobalWeeklyHoursGoal(val)
        if (!organizationId) return
        try {
            await upsertOrgSetting(String(organizationId), { achievement_timehero_goal: val })
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
            await upsertMemberSetting(memberId, { achievement_timehero_enabled: enabled })
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
            await upsertMemberSetting(memberId, { achievement_timehero_goal: goal })
        } catch (e) {
            console.error(e)
        }
    }

    const getMemberEnabled = (memberId: string) => {
        return memberSettings[memberId]?.enabled ?? globalEnabled
    }

    const getMemberGoal = (memberId: string) => {
        return memberSettings[memberId]?.goal ?? globalWeeklyHoursGoal
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
                title="Achievements"
                Icon={Trophy}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="time-hero"
            />

            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="time-hero">
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
                            onCheckedChange={handleGlobalEnabledChange}
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
                            onChange={(e) => handleGlobalGoalChange(Number(e.target.value))}
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
                        <span className="text-sm font-normal text-gray-900">Time hero</span>
                        <span className="text-sm font-normal text-gray-900">Weekly hours goal</span>
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
                                        src={member.avatarUrl}
                                        name={member.name}
                                        className="w-8 h-8"
                                    />
                                    <span className="text-sm text-gray-900">{member.name}</span>
                                </div>
                                <div className="flex items-center justify-between sm:justify-start gap-2">
                                    <span className="text-xs font-medium text-gray-500 sm:hidden">Enabled:</span>
                                    <Switch
                                        checked={getMemberEnabled(member.id)}
                                        onCheckedChange={(checked) => handleMemberEnabledChange(member.id, checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between sm:justify-start gap-2">
                                    <span className="text-xs font-medium text-gray-500 sm:hidden">Goal:</span>
                                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit">
                                        <Input
                                            type="number"
                                            value={getMemberGoal(member.id)}
                                            onChange={(e) => handleMemberGoalChange(member.id, Number(e.target.value))}
                                            className="w-16 border-0 text-center text-sm"
                                        />
                                        <span className="px-2 py-1.5 bg-gray-100 text-xs text-gray-600 border-l border-gray-300 whitespace-nowrap">hours</span>
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
                                    <Info className="h-4 w-4 rotate-90" />
                                </button>
                                <span className="text-[10px] font-normal text-slate-500 uppercase tracking-widest px-2">
                                    Page {currentPage} of {totalPages || 1}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Info className="h-4 w-4 -rotate-90" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </SettingsContentLayout>
        </div>
    )
}
