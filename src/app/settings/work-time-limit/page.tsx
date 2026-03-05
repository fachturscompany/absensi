"use client"

import React, { useState, useEffect } from "react"
import { Info } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { SettingsHeader, SettingTab } from "@/components/settings/SettingsHeader"
import { Users } from "lucide-react"
import { useWorkTimeLimitStore, DayOfWeek, WorkHourEntry } from "@/store/work-time-limit-store"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"

export default function WorkTimeLimitPage() {
    const {
        selectedDays: storedSelectedDays,
        disableTracking: storedDisableTracking,
        expectedHours: storedExpectedHours,
        weeklyLimit: storedWeeklyLimit,
        dailyLimit: storedDailyLimit,
        setSelectedDays: saveSelectedDays,
        setDisableTracking: saveDisableTracking,
        setExpectedHours: saveExpectedHours,
        setWeeklyLimit: saveWeeklyLimit,
        setDailyLimit: saveDailyLimit,
    } = useWorkTimeLimitStore()

    const [hydrated, setHydrated] = useState(false)

    // Local state for form
    const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(["Mon", "Tue", "Wed", "Thu", "Fri"])
    const [disableTracking, setDisableTracking] = useState(false)
    const [expectedHours, setExpectedHours] = useState<WorkHourEntry[]>([
        { id: "1", hours: 40, unit: "hrs/wk" }
    ])
    const [weeklyLimit, setWeeklyLimit] = useState(40)
    const [dailyLimit, setDailyLimit] = useState(8)

    useEffect(() => {
        setHydrated(true)
        // Sync local state with store
        setSelectedDays(storedSelectedDays)
        setDisableTracking(storedDisableTracking)
        setExpectedHours(storedExpectedHours)
        setWeeklyLimit(storedWeeklyLimit)
        setDailyLimit(storedDailyLimit)
    }, [storedSelectedDays, storedDisableTracking, storedExpectedHours, storedWeeklyLimit, storedDailyLimit])

    const days: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    const toggleDay = (day: DayOfWeek) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        )
    }

    const removeExpectedHours = (id: string) => {
        setExpectedHours(prev => prev.filter(entry => entry.id !== id))
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

    const handleCancel = () => {
        // Revert to stored values
        setSelectedDays(storedSelectedDays)
        setDisableTracking(storedDisableTracking)
        setExpectedHours(storedExpectedHours)
        setWeeklyLimit(storedWeeklyLimit)
        setDailyLimit(storedDailyLimit)
        // toast("Changes reverted", { description: "Restored to last saved settings" })
    }

    const handleSave = () => {
        saveSelectedDays(selectedDays)
        saveDisableTracking(disableTracking)
        saveExpectedHours(expectedHours)
        saveWeeklyLimit(weeklyLimit)
        saveDailyLimit(dailyLimit)

        toast("Settings saved", {
            description: "Work time limits have been updated successfully."
        })
    }

    if (!hydrated) {
        return null
    }

    const tabs: SettingTab[] = [
        { label: "EMAIL NOTIFICATIONS", href: "/settings/members/email-notifications", active: false },
        { label: "WORK TIME LIMITS", href: "/settings/work-time-limit", active: true },
        { label: "PAYMENTS", href: "/settings/payments", active: false },
        { label: "ACHIEVEMENTS", href: "/settings/Achievements", active: false },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "work-time-limit", label: "Work time limits", href: "/settings/work-time-limit" },
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

            {/* Content */}
            <div className="flex-1 p-4 md:p-6">
                {/* Default Settings Header */}
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
                            onClick={handleCancel}
                            className="text-slate-500 hover:text-slate-900 text-sm font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Left Column - Weekly Work Days */}
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

                        {/* Day Selection */}
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

                        {/* Disable Time Tracking */}
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

                    {/* Right Column - Work Hours */}
                    <div className="space-y-8">
                        {/* Expected Weekly Work Hours */}
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
                                    {expectedHours.length > 1 && (
                                        <button
                                            onClick={() => removeExpectedHours(entry.id)}
                                            className="text-slate-500 hover:text-slate-900 text-sm"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Weekly Limit */}
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

                        {/* Daily Limit */}
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
        </div>
    )
}
