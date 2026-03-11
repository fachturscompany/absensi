"use client"

import { useState, useEffect } from "react"
import { Info, Search, Loader2, ChevronLeft, ChevronRight, Activity } from "lucide-react"
import { useOrgStore } from "@/store/org-store"
import { getMembersForScreenshot, type ISimpleMember } from "@/action/activity/screenshot"
import { getOrgSettings, upsertOrgSetting, getAllMemberSettings, upsertMemberSetting } from "@/action/organization-settings"
import {  SettingsHeader, SettingTab , SettingsContentLayout } from "@/components/settings/SettingsHeader"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { toast } from "sonner"
import { MemberAvatar } from "@/components/profile&image/MemberAvatar"

type TrackAppsOption = "all" | "time-tracking" | "off"

export default function ActivityPage() {
    const { organizationId } = useOrgStore()
    const [members, setMembers] = useState<ISimpleMember[]>([])
    const [totalMembers, setTotalMembers] = useState(0)
    const [loading, setLoading] = useState(true)
    const [globalTrackApps, setGlobalTrackApps] = useState<TrackAppsOption>("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [memberTrackApps, setMemberTrackApps] = useState<Record<string, TrackAppsOption>>({})
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
                    if (orgSettingsRes.data.track_apps) {
                        setGlobalTrackApps(orgSettingsRes.data.track_apps as TrackAppsOption)
                    }
                }

                if (allMemberSettingsRes.success && allMemberSettingsRes.data) {
                    const overrides: Record<string, TrackAppsOption> = {}
                    Object.entries(allMemberSettingsRes.data).forEach(([mId, settings]) => {
                        if (settings.track_apps) {
                            overrides[mId] = settings.track_apps as TrackAppsOption
                        }
                    })
                    setMemberTrackApps(overrides)
                }
            } catch (err) {
                console.error("Failed to load activity data", err)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [organizationId, currentPage, searchQuery])

    const handleGlobalTrackAppsChange = async (value: TrackAppsOption) => {
        const previousValue = globalTrackApps
        setGlobalTrackApps(value)

        if (!organizationId) return
        try {
            const res = await upsertOrgSetting(String(organizationId), {
                track_apps: value
            })
            if (!res.success) throw new Error(res.message)
            toast.success("Global setting updated")
        } catch (err) {
            console.error("Failed to update global track apps", err)
            setGlobalTrackApps(previousValue)
            toast.error("Failed to update global setting")
        }
    }

    const handleMemberTrackAppsChange = async (memberId: string, value: TrackAppsOption) => {
        const previousValue = memberTrackApps[memberId]
        setMemberTrackApps(prev => ({
            ...prev,
            [memberId]: value
        }))

        try {
            const res = await upsertMemberSetting(memberId, {
                track_apps: value
            })
            if (!res.success) throw new Error(res.message)
            toast.success("Member setting updated")
        } catch (err) {
            console.error("Failed to update member track apps", err)
            setMemberTrackApps(prev => ({
                ...prev,
                [memberId]: previousValue || globalTrackApps
            }))
            toast.error("Failed to update member setting")
        }
    }

    const getMemberTrackApps = (memberId: string): TrackAppsOption => {
        return memberTrackApps[memberId] || globalTrackApps
    }

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        setCurrentPage(1)
    }

    const totalPages = Math.ceil(totalMembers / itemsPerPage)

    const tabs: SettingTab[] = [
        { label: "ACTIVITY", href: "/settings/Activity", active: true },
        { label: "TIMESHEETS", href: "/settings/timesheets", active: false },
        { label: "TRACKING", href: "/settings/tracking", active: false },
        { label: "SCREENSHOTS", href: "/settings/screenshot", active: false },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "track-apps-urls", label: "Apps & URLs tracking", href: "/settings/Activity" },
        { id: "record-activity", label: "Record activity", href: "/settings/Activity/record-activity" },
        { id: "track-apps-urls-detailed", label: "Track apps & URLs", href: "/settings/Activity/track-apps-urls" },
        { id: "data-privacy", label: "Data privacy", href: "/settings/Activity/data-privacy" },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white w-full">
            <SettingsHeader
                title="Activity & Tracking"
                Icon={Activity}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="track-apps-urls"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="track-apps-urls">

            {/* Main Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Right Content */}
                <div className="flex-1 p-4 md:p-8 w-full overflow-y-auto">
                    {/* Section Title */}
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[10px] font-normal text-slate-500 uppercase tracking-widest text-slate-400">
                            APPS & URLS TRACKING
                        </span>
                        <Info className="h-3.5 w-3.5 text-slate-300" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-600 mb-6 font-light">
                        Record which apps and URLs members use while tracking time
                    </p>

                    {/* Global Setting */}
                    <div className="flex items-center gap-1 mb-4">
                        <span className="text-[10px] font-normal text-slate-500 uppercase tracking-widest text-slate-400">
                            GLOBAL SETTING:
                        </span>
                        <Info className="h-3.5 w-3.5 text-slate-300" />
                    </div>

                    {/* Global Toggle - Pill Style */}
                    <div className="flex flex-wrap items-center bg-slate-100 rounded-2xl p-1.5 w-full sm:w-fit mb-12 gap-1 shadow-inner">
                        <button
                            onClick={() => handleGlobalTrackAppsChange("all")}
                            className={`flex-1 sm:flex-none px-6 py-2.5 text-xs font-normal rounded-xl transition-all ${globalTrackApps === "all"
                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => handleGlobalTrackAppsChange("time-tracking")}
                            className={`flex-1 sm:flex-none px-6 py-2.5 text-xs font-normal rounded-xl transition-all ${globalTrackApps === "time-tracking"
                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                                }`}
                        >
                            Time tracking only
                        </button>
                        <button
                            onClick={() => handleGlobalTrackAppsChange("off")}
                            className={`flex-1 sm:flex-none px-6 py-2.5 text-xs font-normal rounded-xl transition-all ${globalTrackApps === "off"
                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                                }`}
                        >
                            Off
                        </button>
                    </div>

                    {/* Individual Settings Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-2">
                        <div className="space-y-1">
                            <h3 className="text-lg font-normal text-slate-900 tracking-tight">Individual settings</h3>
                            <p className="text-sm text-slate-500 leading-relaxed font-light">Override the organization default for specific members</p>
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 font-light" />
                            <input
                                type="text"
                                placeholder="Search members..."
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full sm:w-64 border border-slate-200 rounded-full focus:outline-none focus:ring-1 focus:ring-slate-900 text-sm h-10 transition-all bg-white placeholder:text-slate-400 font-light"
                            />
                        </div>
                    </div>

                    {/* Members Table */}
                    <div className="mt-8">
                        {/* Table Header - Hidden on mobile */}
                        <div className="hidden sm:grid grid-cols-3 py-3 border-b border-slate-100 px-2">
                            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">Name</span>
                            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest text-center">Tracking Mode</span>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-slate-100 min-h-[400px]">
                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                                    <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                                    <span className="text-xs font-light uppercase tracking-widest">Loading members...</span>
                                </div>
                            ) : members.length === 0 ? (
                                <div className="py-20 text-center text-slate-400">
                                    <span className="text-xs font-light uppercase tracking-widest">No members found</span>
                                </div>
                            ) : members.map((member) => (
                                <div key={member.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-5 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 px-2 rounded-xl transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <MemberAvatar
                                            src={member.avatarUrl}
                                            name={member.name}
                                            className="w-9 h-9"
                                        />
                                        <span className="text-sm font-normal text-slate-900 group-hover:text-slate-950 transition-colors tracking-tight">{member.name}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 bg-slate-100 sm:bg-slate-50 rounded-2xl p-1 w-full sm:w-fit shadow-inner">
                                        <button
                                            onClick={() => handleMemberTrackAppsChange(member.id, "all")}
                                            className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-normal rounded-xl transition-all uppercase tracking-widest ${getMemberTrackApps(member.id) === "all"
                                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                                : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                                                }`}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={() => handleMemberTrackAppsChange(member.id, "time-tracking")}
                                            className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-normal rounded-xl transition-all uppercase tracking-widest ${getMemberTrackApps(member.id) === "time-tracking"
                                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                                : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                                                }`}
                                        >
                                            Time tracking
                                        </button>
                                        <button
                                            onClick={() => handleMemberTrackAppsChange(member.id, "off")}
                                            className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-normal rounded-xl transition-all uppercase tracking-widest ${getMemberTrackApps(member.id) === "off"
                                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                                : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                                                }`}
                                        >
                                            Off
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
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
            </div>
        
            </SettingsContentLayout>
</div>
    )
}
