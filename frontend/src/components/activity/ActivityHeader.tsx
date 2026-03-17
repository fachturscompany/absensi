"use client"

import React, { useState, useEffect } from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DUMMY_MEMBERS, DUMMY_PROJECTS } from "@/lib/data/dummy-data"

interface DateRange {
    startDate: Date
    endDate: Date
}

interface ActivityHeaderProps {
    dateRange: DateRange
    onDateRangeChange: (range: DateRange) => void
    project: string
    onProjectChange: (p: string) => void
    member: string
    onMemberChange: (m: string) => void
}

export function ActivityHeader({
    dateRange,
    onDateRangeChange,
    project,
    onProjectChange,
    member,
    onMemberChange
}: ActivityHeaderProps) {
    // STATE UNTUK KALENDER (Copied from InsightsHeader)
    const [tempStartDate, setTempStartDate] = useState<Date>(dateRange.startDate)
    const [tempEndDate, setTempEndDate] = useState<Date>(dateRange.endDate)
    const [leftMonth, setLeftMonth] = useState<Date>(new Date(dateRange.startDate))
    const [rightMonth, setRightMonth] = useState<Date>(new Date(new Date(dateRange.startDate).setMonth(new Date(dateRange.startDate).getMonth() + 1)))
    const [selectingStart, setSelectingStart] = useState(true)
    const [dateRangeOpen, setDateRangeOpen] = useState(false)
    const [selectedPreset, setSelectedPreset] = useState<string>("today")

    // date display helper
    const fmt = (d: Date) =>
        d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })

    useEffect(() => {
        if (dateRangeOpen) {
            setTempStartDate(dateRange.startDate)
            setTempEndDate(dateRange.endDate)
            // pastikan pasangan bulan berdampingan
            const lm = new Date(dateRange.startDate)
            const rm = new Date(lm)
            rm.setMonth(rm.getMonth() + 1)
            setLeftMonth(lm)
            setRightMonth(rm)
            setSelectingStart(true)
        }
    }, [dateRangeOpen, dateRange])

    const generateCalendarDays = (month: Date) => {
        const year = month.getFullYear()
        const monthIndex = month.getMonth()
        const firstDay = new Date(year, monthIndex, 1)
        const lastDay = new Date(year, monthIndex + 1, 0)
        let startDay = firstDay.getDay() - 1
        if (startDay < 0) startDay = 6
        const days: { day: number; isCurrentMonth: boolean }[] = []
        const prevMonthLastDay = new Date(year, monthIndex, 0).getDate()
        for (let i = startDay - 1; i >= 0; i--) days.push({ day: prevMonthLastDay - i, isCurrentMonth: false })
        for (let i = 1; i <= lastDay.getDate(); i++) days.push({ day: i, isCurrentMonth: true })
        const remaining = 42 - days.length
        for (let i = 1; i <= remaining; i++) days.push({ day: i, isCurrentMonth: false })
        return days
    }

    const handleDateClick = (day: number, month: Date, isCurrentMonth: boolean) => {
        if (!isCurrentMonth) return
        const selectedDate = new Date(month.getFullYear(), month.getMonth(), day)
        selectedDate.setHours(0, 0, 0, 0)
        if (selectingStart) {
            setTempStartDate(selectedDate)
            setTempEndDate(selectedDate)
            setSelectingStart(false)
        } else {
            if (selectedDate < tempStartDate) {
                setTempEndDate(tempStartDate)
                setTempStartDate(selectedDate)
            } else {
                setTempEndDate(selectedDate)
            }
            setSelectingStart(true)
        }
    }

    const isDateInRange = (day: number, month: Date) => {
        const date = new Date(month.getFullYear(), month.getMonth(), day)
        date.setHours(0, 0, 0, 0)
        const start = new Date(tempStartDate); start.setHours(0, 0, 0, 0)
        const end = new Date(tempEndDate); end.setHours(0, 0, 0, 0)
        return date >= start && date <= end
    }

    const isStartOrEndDate = (day: number, month: Date) => {
        const date = new Date(month.getFullYear(), month.getMonth(), day)
        date.setHours(0, 0, 0, 0)
        const start = new Date(tempStartDate); start.setHours(0, 0, 0, 0)
        const end = new Date(tempEndDate); end.setHours(0, 0, 0, 0)
        return date.getTime() === start.getTime() || date.getTime() === end.getTime()
    }

    // Navigasi bulan kiri/kanan (jaga bersebelahan)
    const moveLeftMonth = (delta: number) => {
        const lm = new Date(leftMonth)
        lm.setMonth(lm.getMonth() + delta)
        const rm = new Date(lm); rm.setMonth(rm.getMonth() + 1)
        setLeftMonth(lm); setRightMonth(rm)
    }
    const moveRightMonth = (delta: number) => {
        const rm = new Date(rightMonth)
        rm.setMonth(rm.getMonth() + delta)
        const lm = new Date(rm); lm.setMonth(lm.getMonth() - 1)
        setLeftMonth(lm); setRightMonth(rm)
    }

    const applyDateRange = () => {
        onDateRangeChange({ startDate: tempStartDate, endDate: tempEndDate })
        setDateRangeOpen(false)
    }
    const cancelDateRange = () => {
        setTempStartDate(dateRange.startDate)
        setTempEndDate(dateRange.endDate)
        setDateRangeOpen(false)
    }

    // presets 
    const applyPreset = (preset: string) => {
        setSelectedPreset(preset)
        const now = new Date()
        let start = new Date()
        let end = new Date()

        switch (preset) {
            case "today": {
                start = new Date(now)
                start.setHours(0, 0, 0, 0)
                end = new Date(now)
                end.setHours(23, 59, 59, 999)
                break
            }
            case "yesterday": {
                start = new Date(now)
                start.setDate(start.getDate() - 1)
                start.setHours(0, 0, 0, 0)
                end = new Date(start)
                end.setHours(23, 59, 59, 999)
                break
            }
            case "this_week": {
                const dayOfWeek = now.getDay()
                const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
                start = new Date(now)
                start.setDate(start.getDate() - diff)
                start.setHours(0, 0, 0, 0)
                end = new Date(now)
                end.setHours(23, 59, 59, 999)
                break
            }
            case "last_7_days": {
                start = new Date(now)
                start.setDate(start.getDate() - 6)
                start.setHours(0, 0, 0, 0)
                end = new Date(now)
                end.setHours(23, 59, 59, 999)
                break
            }
            case "last_week": {
                const lastWeekEnd = new Date(now)
                lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay())
                lastWeekEnd.setHours(23, 59, 59, 999)
                const lastWeekStart = new Date(lastWeekEnd)
                lastWeekStart.setDate(lastWeekStart.getDate() - 6)
                lastWeekStart.setHours(0, 0, 0, 0)
                start = lastWeekStart
                end = lastWeekEnd
                break
            }
            case "last_2_weeks": {
                start = new Date(now)
                start.setDate(start.getDate() - 13)
                start.setHours(0, 0, 0, 0)
                end = new Date(now)
                end.setHours(23, 59, 59, 999)
                break
            }
            case "this_month": {
                start = new Date(now.getFullYear(), now.getMonth(), 1)
                start.setHours(0, 0, 0, 0)
                end = new Date(now)
                end.setHours(23, 59, 59, 999)
                break
            }
            case "last_month": {
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                start.setHours(0, 0, 0, 0)
                end = new Date(now.getFullYear(), now.getMonth(), 0)
                end.setHours(23, 59, 59, 999)
                break
            }
        }

        setTempStartDate(start)
        setTempEndDate(end)

        const lm = new Date(start)
        const rm = new Date(lm); rm.setMonth(rm.getMonth() + 1)
        setLeftMonth(lm)
        setRightMonth(rm)
        setSelectingStart(true)
    }

    return (
        <div className="flex flex-col border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                    {/* Calendar Dropdown */}
                    <DropdownMenu open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
                        <DropdownMenuTrigger asChild>
                            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 flex items-center gap-2 text-gray-800">
                                <CalendarIcon className="w-4 h-4 text-gray-500" />
                                {fmt(dateRange.startDate)} - {fmt(dateRange.endDate)}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-auto p-0">
                            <div className="flex">
                                <div className="w-40 border-r border-gray-200 p-3 space-y-1">
                                    {['today', 'yesterday', 'this_week', 'last_7_days', 'last_week', 'last_2_weeks', 'this_month', 'last_month'].map(preset => (
                                        <button
                                            key={preset}
                                            className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === preset ? 'bg-black text-white hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                                            onClick={() => applyPreset(preset)}
                                        >
                                            {preset.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                        </button>
                                    ))}
                                </div>
                                <div className="p-4">
                                    <div className="flex gap-4">
                                        {/* Left Month */}
                                        <div className="w-64">
                                            <div className="flex items-center justify-between mb-4">
                                                <button className="p-1 hover:bg-gray-100 rounded" onClick={() => moveLeftMonth(-1)}>
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>
                                                <span className="font-semibold text-gray-900">
                                                    {leftMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                                </span>
                                                <button className="p-1 hover:bg-gray-100 rounded" onClick={() => moveLeftMonth(1)}>
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                                                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => <div key={d} className="font-semibold p-1 text-gray-900">{d}</div>)}
                                            </div>

                                            <div className="grid grid-cols-7 gap-1 text-center text-sm">
                                                {generateCalendarDays(leftMonth).map((d, i) => {
                                                    const inRange = d.isCurrentMonth && isDateInRange(d.day, leftMonth)
                                                    const isEdge = d.isCurrentMonth && isStartOrEndDate(d.day, leftMonth)
                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleDateClick(d.day, leftMonth, d.isCurrentMonth)}
                                                            className={`p-2 rounded ${isEdge ? "bg-black text-white hover:bg-gray-800" :
                                                                inRange ? "bg-gray-100 hover:bg-gray-200 text-black" :
                                                                    d.isCurrentMonth ? "text-gray-800 hover:bg-gray-100" : "text-gray-400"}`}
                                                        >
                                                            {d.day}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Right Month */}
                                        <div className="w-64">
                                            <div className="flex items-center justify-between mb-4">
                                                <button className="p-1 hover:bg-gray-100 rounded" onClick={() => moveRightMonth(-1)}>
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>
                                                <span className="font-semibold text-gray-900">
                                                    {rightMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                                </span>
                                                <button className="p-1 hover:bg-gray-100 rounded" onClick={() => moveRightMonth(1)}>
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                                                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => <div key={d} className="font-semibold p-1 text-gray-900">{d}</div>)}
                                            </div>

                                            <div className="grid grid-cols-7 gap-1 text-center text-sm">
                                                {generateCalendarDays(rightMonth).map((d, i) => {
                                                    const inRange = d.isCurrentMonth && isDateInRange(d.day, rightMonth)
                                                    const isEdge = d.isCurrentMonth && isStartOrEndDate(d.day, rightMonth)
                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleDateClick(d.day, rightMonth, d.isCurrentMonth)}
                                                            className={`p-2 rounded ${isEdge ? "bg-black text-white hover:bg-gray-800" :
                                                                inRange ? "bg-gray-100 hover:bg-gray-200" :
                                                                    d.isCurrentMonth ? "hover:bg-gray-100" : "text-gray-400"}`}
                                                        >
                                                            {d.day}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-xs text-center text-gray-600 mt-2">
                                        {fmt(tempStartDate)} - {fmt(tempEndDate)}
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                                        <button className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 font-medium" onClick={applyDateRange}>
                                            Apply
                                        </button>
                                        <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50" onClick={cancelDateRange}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase mb-1">Project</span>
                        <Select value={project} onValueChange={onProjectChange}>
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                                <SelectValue placeholder="All projects" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All projects</SelectItem>
                                {DUMMY_PROJECTS.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase mb-1">Member</span>
                        <Select value={member} onValueChange={onMemberChange}>
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                                <SelectValue placeholder="Member" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All members</SelectItem>
                                {DUMMY_MEMBERS.map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    )
}
