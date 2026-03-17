"use client"

import React from "react"
import { Users, Info, MousePointer, Keyboard } from "lucide-react"
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function IdleDetectionPage() {
    const tabs: SettingTab[] = [
        { label: "EMAIL NOTIFICATIONS", href: "/settings/members/email-notifications", active: false },
        { label: "WORK TIME LIMITS", href: "/settings/work-time-limit", active: true },
        { label: "PAYMENTS", href: "/settings/payments", active: false },
        { label: "ACHIEVEMENTS", href: "/settings/Achievements", active: false },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "work-time-limit", label: "Work time limit", href: "/settings/work-time-limit" },
        { id: "idle-detection", label: "Idle detection", href: "/settings/work-time-limit/idle-detection" },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Members"
                Icon={Users}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="idle-detection"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="idle-detection">
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                            IDLE DETECTION
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    <p className="text-sm text-gray-600 mb-8">
                        Automatically stop tracking or notify members when no keyboard or mouse activity is detected.
                    </p>

                    <div className="max-w-3xl space-y-8">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                        <MousePointer className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <h3 className="text-base font-medium text-slate-900">Enable Idle Detection</h3>
                                </div>
                                <Switch />
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Idle timeout (minutes)</label>
                                        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden h-11 bg-white">
                                            <Input type="number" defaultValue={5} className="border-0 focus-visible:ring-0" />
                                            <span className="px-4 py-2 bg-slate-100 text-sm text-slate-500 border-l border-slate-300 h-full flex items-center">
                                                min
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 italic">Time before status marks as "Idle"</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Action on idle</label>
                                        <div className="h-11 border border-slate-300 rounded-lg bg-white px-3 flex items-center text-sm text-slate-700">
                                            Notify and keep tracking
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl text-sm">
                                <Keyboard className="h-5 w-5 text-slate-400 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-slate-900">Detect keyboard activity</h4>
                                    <p className="text-slate-500">Any key press resets the idle timer</p>
                                </div>
                                <Switch checked className="ml-auto" />
                            </div>
                            <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl text-sm">
                                <MousePointer className="h-5 w-5 text-slate-400 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-slate-900">Detect mouse movement</h4>
                                    <p className="text-slate-500">Cursor movement resets the idle timer</p>
                                </div>
                                <Switch checked className="ml-auto" />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button className="bg-slate-900 hover:bg-slate-800 text-white px-8 h-11">
                                Save Idle Settings
                            </Button>
                        </div>
                    </div>
                </div>
            </SettingsContentLayout>
        </div>
    )
}
