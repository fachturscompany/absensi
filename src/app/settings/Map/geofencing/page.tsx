"use client"

import React from "react"
import { Calendar, Info, MapPin } from "lucide-react"
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function GeofencingPage() {
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
                activeItemId="geofencing"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="geofencing">
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                            GEOFENCING
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    <p className="text-sm text-gray-600 mb-8">
                        Create virtual perimeters and get notified when members enter or leave specific locations.
                    </p>

                    <div className="max-w-2xl space-y-8">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-slate-200/50 flex items-center justify-center shrink-0">
                                    <MapPin className="h-6 w-6 text-slate-600" />
                                </div>
                                <div>
                                    <h3 className="text-base font-medium text-slate-900">Add New Geofence</h3>
                                    <p className="text-sm text-slate-500">Define a location and radius</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="location-name">Location Name</Label>
                                    <Input id="location-name" placeholder="e.g. Main Office" className="h-11" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="radius">Radius (meters)</Label>
                                        <Input id="radius" type="number" placeholder="100" className="h-11" />
                                    </div>
                                    <div className="flex items-end">
                                        <Button className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white">
                                            Create Geofence
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Active Geofences</h3>
                            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                                <div className="p-4 text-center py-12 text-sm text-slate-500 italic">
                                    No active geofences found. Create one above to get started.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsContentLayout>
        </div>
    )
}
