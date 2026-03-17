"use client"

import React, { useState, useEffect } from "react"
import { Info, Loader2 } from "lucide-react"
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"
import { Calendar } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"

import {
    getOrgSettings,
    upsertOrgSetting,
    getCurrentUserOrganization
} from "@/action/organization-settings"
import { toast } from "sonner"

const SETTING_KEY = "calendar_type"

export default function SchedulePage() {
    // const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(true)
    const [organizationId, setOrganizationId] = useState<string | null>(null)
    const [calendarType, setCalendarType] = useState<"private" | "collaborative">("private")

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            try {
                const orgRes = await getCurrentUserOrganization()
                if (orgRes.success && orgRes.data?.id) {
                    const orgId = String(orgRes.data.id)
                    setOrganizationId(orgId)

                    const globalRes = await getOrgSettings(orgId)
                    if (globalRes.success && globalRes.data) {
                        setCalendarType((globalRes.data[SETTING_KEY] as "private" | "collaborative") || "private")
                    }
                }
            } catch (error) {
                console.error("Error loading calendar settings:", error)
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [])

    const handleTypeChange = async (type: "private" | "collaborative") => {
        if (!organizationId) return

        const previousType = calendarType
        setCalendarType(type)

        const res = await upsertOrgSetting(organizationId, { [SETTING_KEY]: type })
        if (!res.success) {
            setCalendarType(previousType)
            toast.error("Failed to save calendar type")
        } else {
            toast.success(`Calendar set to ${type}`)
        }
    }

    const sidebarItems: SidebarItem[] = [
        { id: "calendar-type", label: "Calendar type", href: "/settings/Calender" },
        { id: "shift-alerts", label: "Shift alerts", href: "/settings/Calender/shift-alerts" },
    ]

    const tabs: SettingTab[] = [
        { label: "CALENDAR", href: "/settings/Calender", active: true },
        { label: "JOB SITES", href: "/settings/Job-sites", active: false },
        { label: "MAP", href: "/settings/Map", active: false },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Schedules"
                Icon={Calendar}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="calendar-type"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="calendar-type">

                {/* Main Content */}
                <div className="flex flex-1 w-full overflow-hidden">
                    {/* Main Content Area */}
                    <div className="flex-1 p-4 md:p-6 w-full overflow-x-hidden relative">
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                        )}
                        
                        {/* Section Title */}
                        <div className="flex items-center gap-1 mb-2">
                            <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                                CALENDAR TYPE
                            </span>
                            <Info className="w-3.5 h-3.5 text-gray-400" />
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-6 font-medium">
                            Making the calendar private restricts users so they can only view their own shifts and time off. If the calendar is collaborative, everyone is able to view all shifts and time off for all members of the organization.
                        </p>

                        {/* All Users Label */}
                        <div className="flex items-center gap-1 mb-3">
                            <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                                ALL USERS
                            </span>
                            <Info className="w-3.5 h-3.5 text-gray-400" />
                        </div>

                        {/* Toggle Buttons */}
                        <div className="inline-flex rounded-full bg-gray-100 p-0.5">
                            <button
                                onClick={() => handleTypeChange("private")}
                                disabled={isLoading}
                                className={`px-6 py-2.5 text-sm font-medium rounded-full transition-all ${calendarType === "private"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                    } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                Private
                            </button>
                            <button
                                onClick={() => handleTypeChange("collaborative")}
                                disabled={isLoading}
                                className={`px-6 py-2.5 text-sm font-medium rounded-full transition-all ${calendarType === "collaborative"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                    } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                Collaborative
                            </button>
                        </div>
                    </div>
                </div>

            </SettingsContentLayout>
        </div>
    )
}

