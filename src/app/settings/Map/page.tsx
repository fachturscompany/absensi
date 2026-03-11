"use client"

import React, { useState, useMemo } from "react"
import { Info, Search, User } from "lucide-react"

import { DUMMY_MEMBERS as SHARED_MEMBERS } from "@/lib/data/dummy-data"
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { Calendar } from "lucide-react"

type TrackingOption = "off" | "tracking-time" | "always"

interface MemberWithSetting {
    id: string
    name: string
    avatar?: string
    trackingSetting: TrackingOption
}

export default function MapPage() {
    // Convert shared members to include tracking setting
    const initialMembers: MemberWithSetting[] = useMemo(() =>
        SHARED_MEMBERS.map(m => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            trackingSetting: "tracking-time" as TrackingOption
        })), []
    )

    const [globalSetting, setGlobalSetting] = useState<TrackingOption>("tracking-time")
    const [members, setMembers] = useState<MemberWithSetting[]>(initialMembers)
    const [searchQuery, setSearchQuery] = useState("")



    const trackingOptions: { value: TrackingOption; label: string }[] = [
        { value: "off", label: "Off" },
        { value: "tracking-time", label: "Tracking time" },
        { value: "always", label: "Always" },
    ]

    const handleGlobalChange = (setting: TrackingOption) => {
        setGlobalSetting(setting)
        setMembers(prev =>
            prev.map(member => ({ ...member, trackingSetting: setting }))
        )
    }

    const handleMemberChange = (id: string, setting: TrackingOption) => {
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, trackingSetting: setting } : member
            )
        )
    }

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

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
                                    className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${globalSetting === option.value
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
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
                                    onChange={(e) => setSearchQuery(e.target.value)}
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
                            <div className="divide-y divide-gray-200">
                                {filteredMembers.map((member) => (
                                    <div key={member.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4 border-b border-gray-100 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                <User className="w-4 h-4 text-gray-500" />
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
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="py-3 text-sm text-gray-500">
                                Showing {filteredMembers.length} of {members.length} members
                            </div>
                        </div>
                    </div>
                </div>

            </SettingsContentLayout>
        </div>
    )
}
