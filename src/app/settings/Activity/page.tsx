"use client"

import { useState } from "react"

import { Info, Search } from "lucide-react"
import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"
import { SettingsHeader, SettingTab } from "@/components/settings/SettingsHeader"
import { Activity } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"

type TrackAppsOption = "all" | "time-tracking" | "off"

export default function ActivityPage() {
    const [globalTrackApps, setGlobalTrackApps] = useState<TrackAppsOption>("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [memberTrackApps, setMemberTrackApps] = useState<Record<string, TrackAppsOption>>({})

    const filteredMembers = DUMMY_MEMBERS.filter(member => {
        const fullName = member.name.toLowerCase()
        return fullName.includes(searchQuery.toLowerCase())
    })

    const handleGlobalTrackAppsChange = (value: TrackAppsOption) => {
        setGlobalTrackApps(value)
    }

    const handleMemberTrackAppsChange = (memberId: string, value: TrackAppsOption) => {
        setMemberTrackApps(prev => ({
            ...prev,
            [memberId]: value
        }))
    }

    const getMemberTrackApps = (memberId: string): TrackAppsOption => {
        return memberTrackApps[memberId] || globalTrackApps
    }

    const tabs: SettingTab[] = [
        { label: "ACTIVITY", href: "/settings/Activity", active: true },
        { label: "TIMESHEETS", href: "/settings/Timesheet", active: false },
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

            {/* Main Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Right Content */}
                <div className="flex-1 p-4 md:p-8 w-full overflow-y-auto">
                    {/* Section Title */}
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                            APPS & URLS TRACKING
                        </span>
                        <Info className="h-3.5 w-3.5 text-slate-300" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-600 mb-6">
                        Record which apps and URLs members use while tracking time
                    </p>

                    {/* Global Setting */}
                    <div className="flex items-center gap-1 mb-4">
                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">
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
                        <div>
                            <h3 className="text-lg font-normal text-slate-900 tracking-tight mb-1">Individual settings</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">Override the organization default for specific members</p>
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search members..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full sm:w-64 border border-slate-200 rounded-full focus:outline-none focus:ring-1 focus:ring-slate-900 text-sm h-10 transition-all bg-white"
                            />
                        </div>
                    </div>

                    {/* Members Table */}
                    <div className="mt-8">
                        {/* Table Header - Hidden on mobile */}
                        <div className="hidden sm:grid grid-cols-3 py-3 border-b border-slate-100 px-2">
                            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">Name</span>
                            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">Tracking Mode</span>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-slate-100">
                            {filteredMembers.map((member) => (
                                <div key={member.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-5 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 px-2 rounded-xl transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors text-slate-400 font-normal text-xs uppercase">
                                            {member.name.charAt(0)}
                                        </div>
                                        <span className="text-sm font-normal text-slate-900 group-hover:text-slate-950 transition-colors uppercase tracking-tight">{member.name}</span>
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

                    {/* Footer */}
                    <div className="py-3 text-sm text-slate-500">
                        Showing {filteredMembers.length} of {DUMMY_MEMBERS.length} members
                    </div>
                </div>
            </div>
        </div>
    )
}
