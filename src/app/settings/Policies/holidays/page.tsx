"use client"

import { SettingsHeader, SettingTab } from "@/components/settings/SettingsHeader"
import { ShieldCheck } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { Button } from "@/components/ui/button"
import { Plus, Gift, Info } from "lucide-react"
import { useState, useEffect } from "react"
import { AddHolidayDialog } from "@/components/settings/policies/AddHolidayDialog"
import { format } from "date-fns"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function HolidaysPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [dialogMode, setDialogMode] = useState<"add" | "edit-holiday" | "edit-members">("add")
    const [editingHoliday, setEditingHoliday] = useState<any>(null)
    const [holidays, setHolidays] = useState<any[]>([])
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("org_holidays")
        if (saved) {
            try {
                setHolidays(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse holidays", e)
            }
        }
        setIsLoaded(true)
    }, [])

    // Save to localStorage when holidays change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("org_holidays", JSON.stringify(holidays))
        }
    }, [holidays, isLoaded])

    const handleAddHoliday = () => {
        setDialogMode("add")
        setEditingHoliday(null)
        setIsDialogOpen(true)
    }

    const handleEditHoliday = (holiday: any) => {
        setDialogMode("edit-holiday")
        setEditingHoliday(holiday)
        setIsDialogOpen(true)
    }

    const handleEditMembers = (holiday: any) => {
        setDialogMode("edit-members")
        setEditingHoliday(holiday)
        setIsDialogOpen(true)
    }

    const handleSaveHoliday = (holidayData: any) => {
        if (holidayData.id) {
            // Update existing
            setHolidays(prev => prev.map(h => h.id === holidayData.id ? {
                ...holidayData,
                date: holidayData.date instanceof Date ? holidayData.date.toISOString() : holidayData.date
            } : h))
        } else {
            // Add new
            const newHoliday = {
                ...holidayData,
                id: Date.now(),
                date: holidayData.date instanceof Date ? holidayData.date.toISOString() : holidayData.date
            }
            setHolidays(prev => [...prev, newHoliday])
        }
    }

    const handleDeleteHoliday = (id: number) => {
        setHolidays(prev => prev.filter(h => h.id !== id))
    }

    const tabs: SettingTab[] = [
        { label: "TIME OFF", href: "/settings/Policies", active: false },
        { label: "WORK BREAKS", href: "/settings/Policies/work-breaks", active: false },
        { label: "OVERTIME", href: "/settings/Policies/overtime", active: false },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "policies", label: "Time off policies", href: "/settings/Policies" },
        { id: "holidays", label: "Holidays", href: "/settings/Policies/holidays" },
        { id: "balances", label: "Time off balances", href: "/settings/Policies/time-off-balances" },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Policies"
                Icon={ShieldCheck}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="holidays"
            />
            {/* Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-6 w-full overflow-y-auto">
                    {/* Header with Title and Add Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                                    HOLIDAYS
                                </h2>
                                <Info className="w-3.5 h-3.5 text-slate-300" />
                            </div>
                            <p className="text-xl font-normal text-slate-900 tracking-tight">
                                Set up holidays for time off
                            </p>
                        </div>
                        {holidays.length > 0 && (
                            <Button
                                onClick={handleAddHoliday}
                                className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-10 px-6 shadow-sm w-full sm:w-auto font-medium"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add holiday
                            </Button>
                        )}
                    </div>

                    {holidays.length > 0 ? (
                        <div className="mt-8">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 hidden sm:table-row">
                                        <th className="px-0 py-4 text-[13px] font-medium text-slate-500 w-1/3 uppercase tracking-wider">Holiday</th>
                                        <th className="px-6 py-4 text-[13px] font-medium text-slate-500 text-center uppercase tracking-wider">Members</th>
                                        <th className="px-6 py-4 text-[13px] font-medium text-slate-500 uppercase tracking-wider">Recurring</th>
                                        <th className="px-6 py-4 text-[13px] font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                        <th className="px-0 py-4 w-24"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {holidays.map((holiday) => (
                                        <tr key={holiday.id} className="hover:bg-slate-50/50 transition-colors group flex flex-col sm:table-row py-4 sm:py-0 border-b border-slate-100 last:border-0">
                                            <td className="px-0 py-2 sm:py-5 sm:table-cell">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[14px] text-slate-900 font-medium sm:font-normal">
                                                        {holiday.name}
                                                    </span>
                                                    <div className="flex items-center gap-2 sm:hidden text-xs text-slate-500">
                                                        <span>{holiday.date ? format(new Date(holiday.date), "MMM d, yyyy") : "-"}</span>
                                                        <span>•</span>
                                                        <span>{holiday.selectedMembers?.length || 0} members</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center hidden sm:table-cell">
                                                <span className="text-[14px] text-slate-600">
                                                    {holiday.selectedMembers?.length || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 hidden sm:table-cell">
                                                <span className="text-[14px] text-slate-600">
                                                    {holiday.occursAnnually ? "Yes" : "No"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 hidden sm:table-cell">
                                                <span className="text-[14px] text-slate-600">
                                                    {holiday.date ? format(new Date(holiday.date), "EEE, MMM d, yyyy") : "-"}
                                                </span>
                                            </td>
                                            <td className="px-0 py-2 sm:py-5 text-right sm:table-cell">
                                                <div className="flex justify-between items-center sm:justify-end gap-2">
                                                    <div className="sm:hidden flex flex-col items-start gap-1">
                                                        <span className="text-[11px] font-normal text-slate-400 uppercase tracking-wider">Recurring</span>
                                                        <span className="text-xs text-slate-600">{holiday.occursAnnually ? "Yes" : "No"}</span>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" size="sm" className="h-9 px-3 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 gap-2 font-medium shadow-none">
                                                                Actions
                                                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                </svg>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40">
                                                            <DropdownMenuItem
                                                                onClick={() => handleEditHoliday(holiday)}
                                                                className="cursor-pointer"
                                                            >
                                                                Edit holiday
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleEditMembers(holiday)}
                                                                className="cursor-pointer border-b border-slate-100 pb-2 mb-1"
                                                            >
                                                                Edit members
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteHoliday(holiday.id)}
                                                                className="text-red-600 focus:text-red-600 cursor-pointer"
                                                            >
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50/30 rounded-lg border border-dashed border-slate-200">
                            <Gift className="w-16 h-16 text-slate-200 mb-4" />
                            <h2 className="text-lg font-normal text-slate-900 mb-1">
                                No holidays added
                            </h2>
                            <p className="text-slate-500 mb-6 max-w-xs">
                                Add holidays to automatically assign time off to your members.
                            </p>
                            <Button
                                onClick={handleAddHoliday}
                                variant="outline"
                                className="border-slate-300"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add holiday
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            <AddHolidayDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSave={handleSaveHoliday}
                mode={dialogMode}
                initialData={editingHoliday}
            />
        </div>
    )
}
