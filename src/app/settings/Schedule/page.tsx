"use client"

import React, { useState } from "react"
import { Info } from "lucide-react"
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"
import { Calendar } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"

export default function SchedulePage() {
    const [calendarType, setCalendarType] = useState<"private" | "collaborative">("private")

    const sidebarItems: SidebarItem[] = [
        { id: "calendar-type", label: "Calendar type", href: "/settings/Schedule" },
        { id: "shift-alerts", label: "Shift alerts", href: "/settings/Schedule/shift-alerts" },
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

                {/* Content */}
                <div className="flex flex-1 w-full overflow-hidden">
                    {/* Main Content Area */}
                    <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                        {/* Section Title */}
                        <div className="flex items-center gap-1 mb-2">
                            <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                                CALENDAR TYPE
                            </span>
                            <Info className="w-3.5 h-3.5 text-gray-400" />
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-6">
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
                                onClick={() => setCalendarType("private")}
                                className={`px-6 py-2.5 text-sm font-medium rounded-full transition-all ${calendarType === "private"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Private
                            </button>
                            <button
                                onClick={() => setCalendarType("collaborative")}
                                className={`px-6 py-2.5 text-sm font-medium rounded-full transition-all ${calendarType === "collaborative"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
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
