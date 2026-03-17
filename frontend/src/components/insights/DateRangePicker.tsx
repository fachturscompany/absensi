"use client"

import { useEffect, useMemo, useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { DateRange } from "./types"

interface Props {
  dateRange: DateRange
  onDateRangeChange: (next: DateRange) => void
  timezone?: string
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  timezone,
}: Props) {
  const [tempStartDate, setTempStartDate] = useState<Date>(dateRange.startDate)
  const [tempEndDate, setTempEndDate] = useState<Date>(dateRange.endDate)
  const [leftMonth, setLeftMonth] = useState<Date>(new Date(dateRange.startDate))
  const [rightMonth, setRightMonth] = useState<Date>(new Date(new Date(dateRange.startDate).setMonth(new Date(dateRange.startDate).getMonth() + 1)))
  const [selectingStart, setSelectingStart] = useState(true)
  const [dateRangeOpen, setDateRangeOpen] = useState(false)
  // Initialize selectedPreset dengan null, akan di-update oleh useEffect
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  // Deteksi preset saat pertama kali mount dan saat dateRange berubah
  useEffect(() => {
    // Selalu update preset berdasarkan dateRange, baik modal terbuka atau tidak
    // Tapi jika modal terbuka, preset akan di-override oleh useEffect yang lain
    const detectedPreset = detectPreset(dateRange.startDate, dateRange.endDate)
    setSelectedPreset(detectedPreset)
     
  }, [dateRange.startDate.getTime(), dateRange.endDate.getTime()])

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: timezone || "UTC" })

  const tzOffset = useMemo((): string => {
    if (!timezone) return ""
    try {
      const now = new Date()
      const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "short" }).formatToParts(now)
      const name = parts.find(p => p.type === "timeZoneName")?.value ?? ""
      const m = name.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/)
      if (m) {
        const raw = m[1] ?? ""
        const sign = raw.startsWith("-") ? "-" : "+"
        let hours = raw.replace(/[+-]/, "")
        if (hours.length === 0) hours = "00"
        else if (hours.length === 1) hours = `0${hours}`
        const minutes = m[2] ?? "00"
        return minutes !== "00" ? `${sign}${hours}:${minutes}` : `${sign}${hours}`
      }
    } catch { }
    return ""
  }, [timezone])

  // Fungsi untuk mendeteksi apakah date range sesuai dengan preset
  const detectPreset = (start: Date, end: Date): string | null => {
    const now = new Date()
    now.setHours(23, 59, 59, 999)
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    // Normalize dates untuk perbandingan - pastikan hanya membandingkan tanggal, bukan waktu
    const startDate = new Date(start)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(end)
    endDate.setHours(23, 59, 59, 999)

    const startTime = startDate.getTime()
    const endTime = endDate.getTime()
    const todayTime = today.getTime()
    const nowTime = now.getTime()

    // Today - harus start dan end sama dengan today
    if (startTime === todayTime && endTime === nowTime) {
      return "today"
    }

    // Yesterday
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayEnd = new Date(yesterday)
    yesterdayEnd.setHours(23, 59, 59, 999)
    if (startTime === yesterday.getTime() && endTime === yesterdayEnd.getTime()) {
      return "yesterday"
    }

    // Last 7 days - harus dari 6 hari yang lalu sampai hari ini
    const last7Start = new Date(today)
    last7Start.setDate(last7Start.getDate() - 6)
    last7Start.setHours(0, 0, 0, 0)
    if (startTime === last7Start.getTime() && endTime === nowTime) {
      return "last_7_days"
    }

    // This week
    const dayOfWeek = now.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(thisWeekStart.getDate() - diff)
    thisWeekStart.setHours(0, 0, 0, 0)
    if (startTime === thisWeekStart.getTime() && endTime === nowTime) {
      return "this_week"
    }

    // Last week
    const lastWeekEnd = new Date(today)
    lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay())
    lastWeekEnd.setHours(23, 59, 59, 999)
    const lastWeekStart = new Date(lastWeekEnd)
    lastWeekStart.setDate(lastWeekStart.getDate() - 6)
    lastWeekStart.setHours(0, 0, 0, 0)
    if (startTime === lastWeekStart.getTime() && endTime === lastWeekEnd.getTime()) {
      return "last_week"
    }

    // Last 2 weeks
    const last2WeeksStart = new Date(today)
    last2WeeksStart.setDate(last2WeeksStart.getDate() - 13)
    last2WeeksStart.setHours(0, 0, 0, 0)
    if (startTime === last2WeeksStart.getTime() && endTime === nowTime) {
      return "last_2_weeks"
    }

    // This month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    thisMonthStart.setHours(0, 0, 0, 0)
    if (startTime === thisMonthStart.getTime() && endTime === nowTime) {
      return "this_month"
    }

    // Last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    lastMonthStart.setHours(0, 0, 0, 0)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    lastMonthEnd.setHours(23, 59, 59, 999)
    if (startTime === lastMonthStart.getTime() && endTime === lastMonthEnd.getTime()) {
      return "last_month"
    }

    // Jika tidak sesuai dengan preset manapun, return null
    return null
  }

  useEffect(() => {
    if (dateRangeOpen) {
      setTempStartDate(dateRange.startDate)
      setTempEndDate(dateRange.endDate)
      const lm = new Date(dateRange.startDate)
      const rm = new Date(lm)
      rm.setMonth(rm.getMonth() + 1)
      setLeftMonth(lm)
      setRightMonth(rm)
      setSelectingStart(true)
      // Deteksi preset berdasarkan dateRange yang ada saat modal dibuka
      const detectedPreset = detectPreset(dateRange.startDate, dateRange.endDate)
      setSelectedPreset(detectedPreset)
    }
  }, [dateRangeOpen, dateRange.startDate, dateRange.endDate])

  // Update preset saat tempStartDate atau tempEndDate berubah (saat user memilih tanggal manual)
  useEffect(() => {
    if (!dateRangeOpen) return

    // Jika range sudah selesai dipilih (selectingStart = true)
    if (selectingStart) {
      // Deteksi preset berdasarkan tempStartDate dan tempEndDate
      const detectedPreset = detectPreset(tempStartDate, tempEndDate)
      setSelectedPreset(detectedPreset)
    }
    // Jika sedang memilih start date (klik pertama), reset preset
    else {
      setSelectedPreset(null)
    }
  }, [dateRangeOpen, tempStartDate, tempEndDate, selectingStart])

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
      // Klik pertama - reset preset dan set start date
      setSelectedPreset(null)
      setTempStartDate(selectedDate)
      setTempEndDate(selectedDate)
      setSelectingStart(false)
    } else {
      // Klik kedua - selesaikan range
      if (selectedDate < tempStartDate) {
        setTempStartDate(selectedDate)
        setTempEndDate(tempStartDate)
      } else {
        setTempEndDate(selectedDate)
      }
      setSelectingStart(true)
      // Preset akan di-detect oleh useEffect
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
    // Deteksi preset berdasarkan tanggal yang dipilih sebelum apply
    const detectedPreset = detectPreset(tempStartDate, tempEndDate)
    setSelectedPreset(detectedPreset)
    onDateRangeChange({ startDate: tempStartDate, endDate: tempEndDate })
    setDateRangeOpen(false)
  }
  const cancelDateRange = () => {
    setTempStartDate(dateRange.startDate)
    setTempEndDate(dateRange.endDate)
    setDateRangeOpen(false)
  }

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
    <DropdownMenu open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
      <DropdownMenuTrigger asChild>
        <button className="px-4 py-2 border border-gray-300 dark:border-gray-800 rounded-md text-sm bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center gap-2 text-gray-800 dark:text-gray-200">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {fmt(dateRange.startDate)} - {fmt(dateRange.endDate)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto p-0 dark:bg-gray-950 dark:border-gray-800">
        <div className="flex">
          <div className="w-40 border-r border-gray-200 dark:border-gray-800 p-3 space-y-1">
            <button
              className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'today' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300'}`}
              onClick={() => applyPreset("today")}
            >Today</button>
            <button
              className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'yesterday' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300'}`}
              onClick={() => applyPreset("yesterday")}
            >Yesterday</button>
            <button
              className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'this_week' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300'}`}
              onClick={() => applyPreset("this_week")}
            >This week</button>
            <button
              className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'last_7_days' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300'}`}
              onClick={() => applyPreset("last_7_days")}
            >Last 7 days</button>
            <button
              className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'last_week' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300'}`}
              onClick={() => applyPreset("last_week")}
            >Last week</button>
            <button
              className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'last_2_weeks' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300'}`}
              onClick={() => applyPreset("last_2_weeks")}
            >Last 2 weeks</button>
            <button
              className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'this_month' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300'}`}
              onClick={() => applyPreset("this_month")}
            >This month</button>
            <button
              className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'last_month' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300'}`}
              onClick={() => applyPreset("last_month")}
            >Last month</button>
          </div>
          <div className="p-4">
            {timezone && (
              <div className="flex justify-end mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {timezone}{tzOffset ? ` (${tzOffset})` : ""}
                </span>
              </div>
            )}
            <div className="flex gap-4">
              <div className="w-64">
                <div className="flex items-center justify-between mb-4">
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded dark:text-gray-300" onClick={() => moveLeftMonth(-1)}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {leftMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded dark:text-gray-300" onClick={() => moveLeftMonth(1)}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                  <div className="font-semibold p-1 text-gray-900 dark:text-gray-100">Mo</div>
                  <div className="font-semibold p-1 text-gray-900 dark:text-gray-100">Tu</div>
                  <div className="font-semibold p-1 text-gray-900 dark:text-gray-100">We</div>
                  <div className="font-semibold p-1 text-gray-900 dark:text-gray-100">Th</div>
                  <div className="font-semibold p-1 text-gray-900 dark:text-gray-100">Fr</div>
                  <div className="font-semibold p-1 text-gray-900 dark:text-gray-100">Sa</div>
                  <div className="font-semibold p-1 text-gray-900 dark:text-gray-100">Su</div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {generateCalendarDays(leftMonth).map((d, i) => {
                    const inRange = d.isCurrentMonth && isDateInRange(d.day, leftMonth)
                    const isEdge = d.isCurrentMonth && isStartOrEndDate(d.day, leftMonth)
                    return (
                      <button
                        key={i}
                        onClick={() => handleDateClick(d.day, leftMonth, d.isCurrentMonth)}
                        className={`p-2 rounded ${isEdge ? "bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200" :
                          inRange ? "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-black dark:text-white" :
                            d.isCurrentMonth ? "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800" : "text-gray-400 dark:text-gray-600"}`}
                      >
                        {d.day}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="w-64">
                <div className="flex items-center justify-between mb-4">
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded dark:text-gray-300" onClick={() => moveRightMonth(-1)}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {rightMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded dark:text-gray-300" onClick={() => moveRightMonth(1)}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                  <div className="font-semibold p-1 text-gray-900 dark:text-gray-100">Mo</div>
                  <div className="font-semibold p-1 text-gray-900 dark:text-gray-100">Tu</div>
                  <div className="font-semibold p-1 text-gray-900 dark:text-gray-100">We</div>
                  <div className="font-semibold p-1 text-gray-900 dark:text-gray-100">Th</div>
                  <div className="font-semibold p-1 text-gray-900 dark:text-gray-100">Fr</div>
                  <div className="font-semibold p-1 text-gray-900 dark:text-gray-100">Sa</div>
                  <div className="font-semibold p-1 text-gray-900 dark:text-gray-100">Su</div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {generateCalendarDays(rightMonth).map((d, i) => {
                    const inRange = d.isCurrentMonth && isDateInRange(d.day, rightMonth)
                    const isEdge = d.isCurrentMonth && isStartOrEndDate(d.day, rightMonth)
                    return (
                      <button
                        key={i}
                        onClick={() => handleDateClick(d.day, rightMonth, d.isCurrentMonth)}
                        className={`p-2 rounded ${isEdge ? "bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200" :
                          inRange ? "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-black dark:text-white" :
                            d.isCurrentMonth ? "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800" : "text-gray-400 dark:text-gray-600"}`}
                      >
                        {d.day}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="text-xs text-center text-gray-600 dark:text-gray-400 mt-2">
              {fmt(tempStartDate)} - {fmt(tempEndDate)}
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <button className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-200 font-medium" onClick={applyDateRange}>
                Apply
              </button>
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200 text-gray-800 hover:text-black" onClick={cancelDateRange}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
