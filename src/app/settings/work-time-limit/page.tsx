"use client"

import React, { useState, useEffect } from "react"
import { Info, Users } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useOrgStore } from "@/store/org-store"
import { getOrgSettings, upsertOrgSetting } from "@/action/organization-settings"
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"
import { type DayOfWeek, type WorkHourEntry } from "@/store/work-time-limit-store"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"

export default function WorkTimeLimitPage() {
    const { organizationId } = useOrgStore()
    const [loading, setLoading] = useState(true)

    // Local state for form
    const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(["Mon", "Tue", "Wed", "Thu", "Fri"])
    const [disableTracking, setDisableTracking] = useState(false)
    const [expectedHours, setExpectedHours] = useState<WorkHourEntry[]>([
        { id: "1", hours: 40, unit: "hrs/wk" }
    ])
    const [weeklyLimit, setWeeklyLimit] = useState(40)
    const [dailyLimit, setDailyLimit] = useState(8)

    // Fetch Settings
    useEffect(() => {
        async function loadData() {
            if (!organizationId) {
                setLoading(false)
                return
            }

            setLoading(true)
            try {
                const res = await getOrgSettings(String(organizationId))
                if (res.success && res.data) {
                    const s = res.data
                    if (s.work_days) setSelectedDays(s.work_days)
                    if (s.disable_tracking_days !== undefined) setDisableTracking(s.disable_tracking_days)
                    if (s.expected_weekly_hours) setExpectedHours([{ id: "1", hours: s.expected_weekly_hours, unit: "hrs/wk" }])
                    if (s.weekly_limit) setWeeklyLimit(s.weekly_limit)
                    if (s.daily_limit) setDailyLimit(s.daily_limit)
                }
            } catch (err) {
                console.error("Failed to load work time limits", err)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [organizationId])

    const days: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    const toggleDay = (day: DayOfWeek) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        )
    }

    const updateExpectedHours = (id: string, hours: number) => {
        setExpectedHours(prev =>
            prev.map(entry =>
                entry.id === id ? { ...entry, hours } : entry
            )
        )
    }

    const getExpectedDaysLabel = () => {
        if (selectedDays.length === 0) return "None"
        if (selectedDays.length === 7) return "Every day"
        if (selectedDays.length === 5 &&
            selectedDays.includes("Mon") &&
            selectedDays.includes("Tue") &&
            selectedDays.includes("Wed") &&
            selectedDays.includes("Thu") &&
            selectedDays.includes("Fri") &&
            !selectedDays.includes("Sat") &&
            !selectedDays.includes("Sun")) {
            return "Mon - Fri"
        }
        return selectedDays.join(", ")
    }

    const handleSave = async () => {
        if (!organizationId) return
        try {
            setLoading(true)
            const res = await upsertOrgSetting(String(organizationId), {
                work_days: selectedDays,
                disable_tracking_days: disableTracking,
                expected_weekly_hours: expectedHours[0]?.hours || 40,
                weekly_limit: weeklyLimit,
                daily_limit: dailyLimit
            })
            if (!res.success) throw new Error(res.message)
            toast.success("Settings saved successfully")
        } catch (err) {
            toast.error("Failed to save settings")
        } finally {
            setLoading(false)
        }
    }

    if (loading && !organizationId) {
        return null
    }

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
                activeItemId="work-time-limit"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="work-time-limit">
                <div className="flex-1 p-4 md:p-6">
                    <div className="flex flex-wrap items-center gap-4 mb-8">
                        <h2 className="text-lg font-normal text-gray-900">Default settings</h2>
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={handleSave}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-6"
                            >
                                Save
                            </Button>
                            <button
                                onClick={() => window.location.reload()}
                                className="text-slate-500 hover:text-slate-900 text-sm font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        <div>
                            <div className="mb-6">
                                <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                                    WEEKLY WORK DAYS
                                </span>
                            </div>

                            <p className="text-sm text-gray-600 mb-4">
                                Set the week days members are expected to work. You can also set which days members are not allowed to track time.
                            </p>

                            <p className="text-sm text-gray-900 mb-4">
                                Expected work days: <span className="font-medium">{getExpectedDaysLabel()}</span>
                            </p>

                            <div className="flex gap-2 mb-6">
                                {days.map((day) => (
                                    <button
                                        key={day}
                                        onClick={() => toggleDay(day)}
                                        className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${selectedDays.includes(day)
                                            ? "bg-slate-900 text-white"
                                            : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={disableTracking}
                                    onCheckedChange={setDisableTracking}
                                />
                                <span className="text-sm text-gray-700">
                                    Disable time tracking on specific days
                                </span>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <div className="flex items-center gap-1 mb-2">
                                    <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                                        EXPECTED WEEKLY WORK HOURS
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                    Set the hours members are expected to work weekly
                                </p>

                                {expectedHours.map((entry) => (
                                    <div key={entry.id} className="flex items-center gap-3 mb-2">
                                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                            <Input
                                                type="number"
                                                value={entry.hours}
                                                onChange={(e) => updateExpectedHours(entry.id, Number(e.target.value))}
                                                className="w-32 border-0 text-sm"
                                            />
                                            <span className="px-4 py-2 bg-gray-100 text-sm text-gray-600 border-l border-gray-300">
                                                hrs/wk
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <div className="flex items-center gap-1 mb-2">
                                    <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                                        WEEKLY LIMIT
                                    </span>
                                    <Info className="w-3.5 h-3.5 text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                    Set the hours members are allowed to work weekly
                                </p>
                                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit">
                                    <Input
                                        type="number"
                                        value={weeklyLimit}
                                        onChange={(e) => setWeeklyLimit(Number(e.target.value))}
                                        className="w-32 border-0 text-sm"
                                    />
                                    <span className="px-4 py-2 bg-gray-100 text-sm text-gray-600 border-l border-gray-300">
                                        hrs/wk
                                    </span>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-1 mb-2">
                                    <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                                        DAILY LIMIT
                                    </span>
                                    <Info className="w-3.5 h-3.5 text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                    Set the hours members are allowed to work daily
                                </p>
                                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit">
                                    <Input
                                        type="number"
                                        value={dailyLimit}
                                        onChange={(e) => setDailyLimit(Number(e.target.value))}
                                        className="w-32 border-0 text-sm"
                                    />
                                    <span className="px-4 py-2 bg-gray-100 text-sm text-gray-600 border-l border-gray-300">
                                        hrs/day
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsContentLayout>
        </div>
    )
}
