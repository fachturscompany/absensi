"use client"

import React, { useState, useEffect } from "react"
import { Info, Search, User, Loader2 } from "lucide-react"
import { Calendar } from "lucide-react"

import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"

import { getSettingsMembers, SettingsMember } from "@/action/settings-members"
import {
    getOrgSettings,
    upsertOrgSetting,
    getAllMemberSettings,
    upsertMemberSetting,
    getCurrentUserOrganization
} from "@/action/organization-settings"
import { toast } from "sonner"

type TrackingOption = "off" | "tracking-time" | "always"

interface MemberWithSetting {
    id: string
    name: string
    avatar?: string
    trackingSetting: TrackingOption
}

const SETTING_KEY = "track_locations"

export default function MapPage() {
    // const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(true)
    const [organizationId, setOrganizationId] = useState<string | null>(null)
    const [globalSetting, setGlobalSetting] = useState<TrackingOption>("tracking-time")
    const [members, setMembers] = useState<MemberWithSetting[]>([])
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [totalMembers, setTotalMembers] = useState(0);
    const [searchQuery, setSearchQuery] = useState("")

    const trackingOptions: { value: TrackingOption; label: string }[] = [
        { value: "off", label: "Off" },
        { value: "tracking-time", label: "Tracking time" },
        { value: "always", label: "Always" },
    ]

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            try {
                // 1. Get Organization
                const orgRes = await getCurrentUserOrganization()
                if (!orgRes.success || !orgRes.data?.id) {
                toast.error("Failed to load organization data")
                    setIsLoading(false)
                    return
                }
                const orgId = String(orgRes.data.id)
                setOrganizationId(orgId)

                // 2. Load Global Settings
                const globalRes = await getOrgSettings(orgId)
                let currentGlobalSetting: TrackingOption = "tracking-time"
                if (globalRes.success && globalRes.data) {
                    currentGlobalSetting = (globalRes.data[SETTING_KEY] as TrackingOption) || "tracking-time"
                    setGlobalSetting(currentGlobalSetting)
                }

                // 3. Load Members (paginated)
                const membersRes = await getSettingsMembers(orgId, { page, limit }, searchQuery)
                
                // 4. Load Individual Member Settings
                const settingsRes = await getAllMemberSettings(orgId)
                const allSettings = settingsRes.data || {}

                if (membersRes.success && membersRes.data) {
                    const membersWithSettings: MemberWithSetting[] = membersRes.data.map((m: SettingsMember) => ({
                        id: m.id,
                        name: m.name,
                        avatar: m.avatar,
                        trackingSetting: (allSettings[Number(m.id)]?.[SETTING_KEY] as TrackingOption) ?? 
                                         currentGlobalSetting
                    }))
                    setMembers(membersWithSettings)
                    setTotalMembers(membersRes.total || 0)
                } else {
                    setMembers([])
                    setTotalMembers(0)
                }
            } catch (error) {
                console.error("Error loading settings:", error)
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [page, searchQuery, organizationId])

    const handleGlobalChange = async (setting: TrackingOption) => {
        if (!organizationId) return

        const previousState = globalSetting
        setGlobalSetting(setting)
        
        const res = await upsertOrgSetting(organizationId, { [SETTING_KEY]: setting })
        if (!res.success) {
            setGlobalSetting(previousState)
            toast.error("Failed to save global setting")
        } else {
            toast.success(`Global tracking set to ${setting}`)
        }
    }

    const handleMemberChange = async (id: string, setting: TrackingOption) => {
        const previousMembers = [...members]
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, trackingSetting: setting } : member
            )
        )

        const res = await upsertMemberSetting(id, { [SETTING_KEY]: setting })
        if (!res.success) {
            setMembers(previousMembers)
            toast.error("Failed to save member setting")
        }
    }

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
        setPage(1)
    }

    const tabs: SettingTab[] = [
        { label: "CALENDAR", href: "/settings/Calender", active: false },
        { label: "JOB SITES", href: "/settings/Job-sites", active: false },
        { label: "MAP", href: "/settings/Map", active: true },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "track-locations", label: "Track locations", href: "/settings/Map" },
        { id: "geofencing", label: "Geofencing", href: "/settings/Map/geofencing" },
        { id: "schedule", label: "Tracking schedule", href: "/settings/Map/schedule" },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Schedules"
                Icon={Calendar}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="track-locations"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="track-locations">

                {/* Content */}
                <div className="flex flex-1 w-full overflow-hidden">
                    {/* Main Content Area */}
                    <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                        {/* Section Title */}
                        <div className="flex items-center gap-1 mb-2">
                            <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                                TRACK LOCATIONS (MOBILE ONLY)
                            </span>
                            <Info className="w-3.5 h-3.5 text-gray-400" />
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-6">
                            Control whether location tracking is enabled in the mobile app
                        </p>

                        {/* Global Label */}
                        <div className="flex items-center gap-1 mb-3">
                            <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                                GLOBAL:
                            </span>
                            <Info className="w-3.5 h-3.5 text-gray-400" />
                        </div>

                        {/* Global Toggle Buttons */}
                        <div className="inline-flex rounded-full bg-gray-100 p-0.5 mb-10">
                            {trackingOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleGlobalChange(option.value)}
                                    disabled={isLoading}
                                    className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${globalSetting === option.value
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    {option.label}
                                </button>
                            ))}
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
                                    onChange={handleSearch}
                                    className="pl-10 pr-4 py-2 w-full sm:w-64 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                                />
                            </div>
                        </div>

                        {/* Members Table */}
                        <div className="mt-6">
                            {/* Table Header */}
                            <div className="hidden sm:grid grid-cols-1 py-3 border-b border-gray-200">
                                <span className="text-sm font-normal text-gray-900">Name</span>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-gray-200 min-h-[200px] relative">
                                {isLoading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                    </div>
                                ) : members.length > 0 ? (
                                    members.map((member) => (
                                        <div key={member.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4 border-b border-gray-100 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                    {member.avatar ? (
                                                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-gray-500" />
                                                    )}
                                                </div>
                                                <span className="text-sm text-gray-900">{member.name}</span>
                                            </div>
                                            {/* Member Toggle Buttons - Pill style */}
                                            <div className="inline-flex flex-wrap rounded-full bg-gray-100 p-0.5 w-fit">
                                                {trackingOptions.map((option) => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => handleMemberChange(member.id, option.value)}
                                                        className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${member.trackingSetting === option.value
                                                            ? "bg-white text-gray-900 shadow-sm"
                                                            : "text-gray-500 hover:text-gray-700"
                                                            }`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-10 text-center text-sm text-gray-500">
                                        No members found.
                                    </div>
                                )}
                            </div>

                            {/* Footer / Pagination */}
                            {!isLoading && (
                                <div className="py-4 flex items-center justify-between border-t border-gray-100 mt-4">
                                    <div className="text-sm text-gray-500">
                                        Showing {Math.min((page - 1) * limit + 1, totalMembers)} to {Math.min(page * limit, totalMembers)} of {totalMembers} members
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1 || isLoading}
                                            className="px-3 py-1 text-xs font-medium border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setPage(p => p + 1)}
                                            disabled={page * limit >= totalMembers || isLoading}
                                            className="px-3 py-1 text-xs font-medium border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </SettingsContentLayout>
        </div>
    )
}

