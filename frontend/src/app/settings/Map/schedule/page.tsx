"use client"

import React from "react"
import { Calendar, Info, Clock } from "lucide-react"
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

export default function TrackingSchedulePage() {
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

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Schedules"
                Icon={Calendar}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="schedule"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="schedule">
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                            TRACKING SCHEDULE
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    <p className="text-sm text-gray-600 mb-8">
                        Set specific times when location tracking should be active for your team.
                    </p>

                    <div className="max-w-3xl space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-slate-600" />
                                <div>
                                    <h3 className="text-sm font-medium text-slate-900">Track only during work hours</h3>
                                    <p className="text-xs text-slate-500">Automatically disable tracking outside of scheduled hours</p>
                                </div>
                            </div>
                            <Switch />
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-normal">Day</th>
                                        <th className="px-6 py-3 text-left font-normal">Tracking Window</th>
                                        <th className="px-6 py-3 text-right font-normal">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {days.map((day) => (
                                        <tr key={day}>
                                            <td className="px-6 py-4 font-medium text-slate-700">{day}</td>
                                            <td className="px-6 py-4 text-slate-500">08:00 AM - 05:00 PM</td>
                                            <td className="px-6 py-4 text-right">
                                                <Switch checked={day !== "Saturday" && day !== "Sunday"} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button className="bg-slate-900 hover:bg-slate-800 text-white px-8 h-11">
                                Save Schedule
                            </Button>
                        </div>
                    </div>
                </div>
            </SettingsContentLayout>
        </div>
    )
}
