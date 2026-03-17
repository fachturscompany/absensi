"use client"

import { useState, useEffect } from "react"
import { Info, Search, Loader2, ChevronLeft, ChevronRight, Activity, Star } from "lucide-react"
import { useOrgStore } from "@/store/org-store"
import { getMembersForScreenshot, type ISimpleMember } from "@/action/activity/screenshot"
import { getOrgSettings, upsertOrgSetting, getAllMemberSettings, upsertMemberSetting } from "@/action/organization-settings"
import {  SettingsHeader, SettingTab , SettingsContentLayout } from "@/components/settings/SettingsHeader"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { toast } from "sonner"

type KeepIdleTimeOption = "prompt" | "always" | "never"

export default function TrackingPage() {
    const { organizationId } = useOrgStore()
    const [members, setMembers] = useState<ISimpleMember[]>([])
    const [totalMembers, setTotalMembers] = useState(0)
    const [loading, setLoading] = useState(true)
    const [globalKeepIdleTime, setGlobalKeepIdleTime] = useState<KeepIdleTimeOption>("prompt")
    const [searchQuery, setSearchQuery] = useState("")
    const [memberKeepIdleTimes, setMemberKeepIdleTimes] = useState<Record<string, KeepIdleTimeOption>>({})
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
                // Fetch members, global settings, and member settings in parallel
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
                    if (orgSettingsRes.data.keep_idle_time) {
                        setGlobalKeepIdleTime(orgSettingsRes.data.keep_idle_time as KeepIdleTimeOption)
                    }
                }

                if (allMemberSettingsRes.success && allMemberSettingsRes.data) {
                    const overrides: Record<string, KeepIdleTimeOption> = {}
                    Object.entries(allMemberSettingsRes.data).forEach(([mId, settings]) => {
                        if (settings.keep_idle_time) {
                            overrides[mId] = settings.keep_idle_time as KeepIdleTimeOption
                        }
                    })
                    setMemberKeepIdleTimes(overrides)
                }
            } catch (err) {
                console.error("Failed to load tracking data", err)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [organizationId, currentPage, searchQuery])

    const getMemberKeepIdleTime = (memberId: string): KeepIdleTimeOption => {
        return memberKeepIdleTimes[memberId] || globalKeepIdleTime
    }

    // Reset to first page when search changes
    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        setCurrentPage(1)
    }

    const handleGlobalKeepIdleTimeChange = async (value: KeepIdleTimeOption) => {
        const previousValue = globalKeepIdleTime
        setGlobalKeepIdleTime(value)

        if (!organizationId) return
        try {
            const res = await upsertOrgSetting(String(organizationId), {
                keep_idle_time: value
            })
            if (!res.success) throw new Error(res.message)
            toast.success("Global setting updated")
        } catch (err) {
            console.error("Failed to update global keep idle time", err)
            setGlobalKeepIdleTime(previousValue)
            toast.error("Failed to update global setting")
        }
    }

    const handleMemberKeepIdleTimeChange = async (memberId: string, value: KeepIdleTimeOption) => {
        const previousValue = memberKeepIdleTimes[memberId]
        setMemberKeepIdleTimes(prev => ({
            ...prev,
            [memberId]: value
        }))

        try {
            const res = await upsertMemberSetting(memberId, {
                keep_idle_time: value
            })
            if (!res.success) throw new Error(res.message)
            toast.success("Member setting updated")
        } catch (err) {
            console.error("Failed to update member keep idle time", err)
            setMemberKeepIdleTimes(prev => ({
                ...prev,
                [memberId]: previousValue || globalKeepIdleTime
            }))
            toast.error("Failed to update member setting")
        }
    }

    const totalPages = Math.ceil(totalMembers / itemsPerPage)

    const tabs: SettingTab[] = [
        { label: "ACTIVITY", href: "/settings/Activity", active: false },
        { label: "TIMESHEETS", href: "/settings/timesheets", active: false },
        { label: "TRACKING", href: "/settings/tracking", active: true },
        { label: "SCREENSHOTS", href: "/settings/screenshot", active: false },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "keep-idle-time", label: "Keep idle time", href: "/settings/tracking" },
        { id: "idle-timeout", label: "Idle timeout", href: "/settings/tracking/idle-timeout" },
        { id: "allowed-apps", label: "Allowed apps", href: "/settings/tracking/allowed-apps", icon: Star },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white w-full">
            <SettingsHeader
                title="Activity & Tracking"
                Icon={Activity}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="keep-idle-time"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="keep-idle-time">

            {/* Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                    {/* Section Title */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-normal text-slate-500 uppercase tracking-wider">
                            KEEP IDLE TIME
                        </span>
                        <Info className="h-4 w-4 text-slate-400" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-600 mb-6">
                        Control whether idle time is kept or discarded when the timer is running
                    </p>

                    {/* Global Setting */}
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-normal text-slate-500 uppercase tracking-wider">
                            GLOBAL:
                        </span>
                        <Info className="h-4 w-4 text-slate-400" />
                    </div>

                    {/* Global Toggle - Pill Style */}
                    <div className="inline-flex rounded-full bg-slate-100 p-0.5 mb-8">
                        <button
                            onClick={() => handleGlobalKeepIdleTimeChange("prompt")}
                            className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${globalKeepIdleTime === "prompt"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Prompt
                        </button>
                        <button
                            onClick={() => handleGlobalKeepIdleTimeChange("always")}
                            className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${globalKeepIdleTime === "always"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Always
                        </button>
                        <button
                            onClick={() => handleGlobalKeepIdleTimeChange("never")}
                            className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${globalKeepIdleTime === "never"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Never
                        </button>
                    </div>

                    {/* Individual Settings Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <h3 className="text-lg font-normal text-slate-900">Individual settings</h3>
                            <p className="text-sm text-slate-500">Override the organization default for specific members</p>
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
                    <div className="border-t border-slate-200">
                        <div className="py-3 border-b border-slate-200">
                            <span className="text-sm font-normal text-slate-900">Name</span>
                        </div>
                        {loading ? (
                            <div className="py-8 text-center text-sm text-slate-500">
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading members...
                                </div>
                            </div>
                        ) : members.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-500">
                                No members found
                            </div>
                        ) : members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between py-4 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden text-slate-600">
                                        {member.avatarUrl ? (
                                            <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-medium">
                                                {member.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm text-slate-900">{member.name}</span>
                                </div>
                                <div className="inline-flex rounded-full bg-slate-100 p-0.5">
                                    <button
                                        onClick={() => handleMemberKeepIdleTimeChange(member.id, "prompt")}
                                        className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${getMemberKeepIdleTime(member.id) === "prompt"
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                            }`}
                                    >
                                        Prompt
                                    </button>
                                    <button
                                        onClick={() => handleMemberKeepIdleTimeChange(member.id, "always")}
                                        className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${getMemberKeepIdleTime(member.id) === "always"
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                            }`}
                                    >
                                        Always
                                    </button>
                                    <button
                                        onClick={() => handleMemberKeepIdleTimeChange(member.id, "never")}
                                        className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${getMemberKeepIdleTime(member.id) === "never"
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                            }`}
                                    >
                                        Never
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {!loading && members.length > 0 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-slate-500">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalMembers)} of {totalMembers} members
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="text-sm text-slate-700">
                                    Page {currentPage} of {totalPages || 1}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        
            </SettingsContentLayout>
</div>
    )
}
