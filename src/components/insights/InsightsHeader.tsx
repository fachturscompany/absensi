"use client"
import { useEffect, useMemo, useState } from "react"
import { Menu, Search, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { DateRange, FilterTab, PickerItem, SelectedFilter } from "./types"

interface Props {
  selectedFilter: SelectedFilter
  onSelectedFilterChange: (next: SelectedFilter) => void

  dateRange: DateRange
  onDateRangeChange: (next: DateRange) => void

  members: PickerItem[]
  teams: PickerItem[]

  sidebarOpen?: boolean
  onToggleSidebar?: () => void

  timezone?: string

  children?: React.ReactNode

  hideAllOption?: boolean // Untuk menyembunyikan opsi "All Members" / "All Teams"
  hideTeamsTab?: boolean // Untuk menyembunyikan tab "Teams"
  hideFilter?: boolean // To hide the entire filter dropdown
}

export function InsightsHeader({
  selectedFilter,
  onSelectedFilterChange,
  dateRange,
  onDateRangeChange,
  members,
  teams,
  sidebarOpen,
  onToggleSidebar,
  timezone,
  children,
  hideAllOption = false,
  hideTeamsTab = false,
  hideFilter = false,
}: Props) {
  // STATE UNTUK KALENDER
  const [tempStartDate, setTempStartDate] = useState<Date>(dateRange.startDate)
  const [tempEndDate, setTempEndDate] = useState<Date>(dateRange.endDate)
  const [leftMonth, setLeftMonth] = useState<Date>(new Date(dateRange.startDate))
  const [rightMonth, setRightMonth] = useState<Date>(new Date(new Date(dateRange.startDate).setMonth(new Date(dateRange.startDate).getMonth() + 1)))
  const [selectingStart, setSelectingStart] = useState(true)
  const [filterTab, setFilterTab] = useState<FilterTab>("members")
  const [filterSearch, setFilterSearch] = useState("")
  const [dateRangeOpen, setDateRangeOpen] = useState(false)

  // Hydration fix for dates
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fungsi untuk mendeteksi preset dari dateRange
  const detectPreset = (start: Date, end: Date): string | null => {
    const now = new Date()
    now.setHours(23, 59, 59, 999)
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

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

    // Last 7 days
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

    return null
  }

  const [selectedPreset, setSelectedPreset] = useState<string | null>(() => {
    return detectPreset(dateRange.startDate, dateRange.endDate)
  })

  // STATE UNTUK FILTER MEMBER/TEAM (pending sebelum di-apply)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  // const [tempFilter, setTempFilter] = useState<SelectedFilter>(selectedFilter) // Removed tempFilter for immediate apply

  const filterLabel = useMemo(() => {
    if (selectedFilter.all) return selectedFilter.type === "members" ? "All Members" : "All Teams"
    const source = selectedFilter.type === "members" ? members : teams
    return source.find(x => x.id === selectedFilter.id)?.name || (selectedFilter.type === "members" ? "Member" : "Team")
  }, [selectedFilter, members, teams])

  // date display helper (timeZone "UTC" removed to sync with backend requests)
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })

  // timezone offset (e.g. +07, -05, +05:30)
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

  // Deteksi preset saat dateRange berubah
  useEffect(() => {
    const detectedPreset = detectPreset(dateRange.startDate, dateRange.endDate)
    setSelectedPreset(detectedPreset)

  }, [dateRange.startDate.getTime(), dateRange.endDate.getTime()])

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
      // Deteksi preset saat modal dibuka
      const detectedPreset = detectPreset(dateRange.startDate, dateRange.endDate)
      setSelectedPreset(detectedPreset)
    }
  }, [dateRangeOpen, dateRange])

  // Sync tempFilter when dropdown opens (Removed logic as we auto-apply now)
  useEffect(() => {
    if (filterDropdownOpen) {
      // setTempFilter(selectedFilter)
      // Jika hideTeamsTab true, paksa ke "members"
      setFilterTab(hideTeamsTab ? "members" : selectedFilter.type)
      setFilterSearch("")
    }
  }, [filterDropdownOpen, selectedFilter, hideTeamsTab])

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
      // Klik pertama - reset preset
      setSelectedPreset(null)
      setTempStartDate(selectedDate)
      setTempEndDate(selectedDate)
      setSelectingStart(false)
    } else {
      // Klik kedua - selesaikan range dan deteksi preset
      let newStart = tempStartDate
      let newEnd = selectedDate
      if (selectedDate < tempStartDate) {
        newStart = selectedDate
        newEnd = tempStartDate
        setTempStartDate(selectedDate)
        setTempEndDate(tempStartDate)
      } else {
        setTempEndDate(selectedDate)
      }
      setSelectingStart(true)
      // Deteksi preset setelah range selesai dipilih
      const detectedPreset = detectPreset(newStart, newEnd)
      setSelectedPreset(detectedPreset)
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
    // Deteksi preset sebelum apply
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

  // Helper to auto apply filter
  const handleFilterSelect = (filter: SelectedFilter) => {
    onSelectedFilterChange(filter)
    setFilterDropdownOpen(false)
  }

  // Removed manual applyFilter and cancelFilter functions

  // presets (mengikuti pola highlights: update temp state + highlight, commit saat Apply)
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
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Senin awal minggu
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

    // Update tanggal sementara untuk display
    setTempStartDate(start)
    setTempEndDate(end)

    // Deteksi preset dan apply IMMEDIATELY
    // const detectedPreset = detectPreset(start, end)
    // setSelectedPreset(detectedPreset)
    // onDateRangeChange({ startDate: start, endDate: end })
    // setDateRangeOpen(false)

    // IMPORTANT: Wait for state update or just call parent directly
    onDateRangeChange({ startDate: start, endDate: end })
    setDateRangeOpen(false)

    // We also need to update calendar view states just in case
    const lm = new Date(start)
    const rm = new Date(lm); rm.setMonth(rm.getMonth() + 1)
    setLeftMonth(lm)
    setRightMonth(rm)
    setSelectingStart(true)
  }

  // Jika hideTeamsTab true, paksa filterTab ke "members"
  const effectiveFilterTab = hideTeamsTab ? "members" : filterTab
  const source = effectiveFilterTab === "members" ? members : teams
  const filtered = source.filter(it => it.name.toLowerCase().includes(filterSearch.toLowerCase()))

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        {/* Members/Teams filter */}
        {!hideFilter && (
          <DropdownMenu open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 min-w-[150px] w-full sm:w-auto text-left text-gray-800 dark:text-gray-200 flex items-center justify-between">
                {filterLabel}
                <ChevronDown className="w-4 h-4 opacity-50 ml-2" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80 p-3 dark:bg-gray-950 dark:border-gray-800">
              {!hideTeamsTab && (
                <div className="flex items-center gap-2 mb-3">
                  <button
                    className={`px-3 py-1 rounded-full text-sm border ${filterTab === "members" ? "bg-gray-100 dark:bg-gray-700 border-black dark:border-gray-400 text-black dark:text-white" : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"}`}
                    onClick={() => { setFilterTab("members"); setFilterSearch("") }}
                  >Members</button>

                  <button
                    className={`px-3 py-1 rounded-full text-sm border ${filterTab === "teams" ? "bg-gray-100 dark:bg-gray-700 border-black dark:border-gray-400 text-black dark:text-white" : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"}`}
                    onClick={() => { setFilterTab("teams"); setFilterSearch("") }}
                  >Teams</button>
                </div>
              )}

              <div className="mb-3 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search items"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="ps-8 pl-8 pe-8 pr-8"
                />
                {filterSearch && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600"
                    onClick={() => setFilterSearch("")}
                    aria-label="Clear"
                  >×</button>
                )}
              </div>

              {!hideAllOption && (
                <div className="mb-2 pb-2 border-b border-gray-200 dark:border-gray-800">
                  <button
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded text-sm ${selectedFilter.all && selectedFilter.type === effectiveFilterTab ? "bg-gray-100 dark:bg-gray-800 text-black dark:text-white" : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
                    onClick={() => handleFilterSelect({ type: effectiveFilterTab, all: true })}
                  >
                    <span className={`inline-block w-2 h-2 rounded-full border ${selectedFilter.all && selectedFilter.type === effectiveFilterTab ? "bg-black border-black" : "border-gray-400"}`} />
                    All {effectiveFilterTab === "members" ? "Members" : "Teams"}
                  </button>
                </div>
              )}

              <div className="max-h-64 overflow-auto">
                {filtered.map(it => {
                  const isActive = !selectedFilter.all && selectedFilter.type === effectiveFilterTab && selectedFilter.id === it.id
                  return (
                    <button
                      key={it.id}
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded text-sm ${isActive ? "bg-gray-100 dark:bg-gray-800 text-black dark:text-white" : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
                      onClick={() => handleFilterSelect({ type: effectiveFilterTab, all: false, id: it.id })}
                    >
                      <span className={`inline-block w-2 h-2 rounded-full border ${isActive ? "bg-black border-black" : "border-gray-400"}`} />
                      {it.name}
                    </button>
                  )
                })}
              </div>

              {/* Apply/Cancel Buttons removed for Auto-Apply */}
              {/* <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
              <button className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 font-medium" onClick={applyFilter}>
                Apply
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50" onClick={cancelFilter}>
                Cancel
              </button>
            </div> */}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {/* Date range */}
        <DropdownMenu open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
          <DropdownMenuTrigger asChild>
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center gap-2 text-gray-800 dark:text-gray-200 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {isMounted ? (
                  <span>{fmt(dateRange.startDate)} - {fmt(dateRange.endDate)}</span>
                ) : (
                  <span className="opacity-0">Loading dates...</span>
                )}
              </div>
              <ChevronDown className="w-4 h-4 opacity-50 sm:hidden" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] sm:w-auto p-0 dark:bg-gray-950 dark:border-gray-800 overflow-hidden">
            <div className="flex flex-col sm:flex-row max-h-[80vh] overflow-y-auto sm:max-h-none">
              <div className="w-40 border-r border-gray-200 dark:border-gray-800 p-3 space-y-1">
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded dark:text-gray-200 ${selectedPreset === 'today' ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  onClick={() => applyPreset("today")}
                >Today</button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded dark:text-gray-200 ${selectedPreset === 'yesterday' ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  onClick={() => applyPreset("yesterday")}
                >Yesterday</button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded dark:text-gray-200 ${selectedPreset === 'this_week' ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  onClick={() => applyPreset("this_week")}
                >This week</button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded dark:text-gray-200 ${selectedPreset === 'last_7_days' ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  onClick={() => applyPreset("last_7_days")}
                >Last 7 days</button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded dark:text-gray-200 ${selectedPreset === 'last_week' ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  onClick={() => applyPreset("last_week")}
                >Last week</button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded dark:text-gray-200 ${selectedPreset === 'last_2_weeks' ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  onClick={() => applyPreset("last_2_weeks")}
                >Last 2 weeks</button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded dark:text-gray-200 ${selectedPreset === 'this_month' ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  onClick={() => applyPreset("this_month")}
                >This month</button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded dark:text-gray-200 ${selectedPreset === 'last_month' ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  onClick={() => applyPreset("last_month")}
                >Last month</button>
              </div>
              {/* Right Calendar */}
              <div className="p-2 sm:p-4">
                {timezone && (
                  <div className="flex justify-end mb-2">
                    <span className="text-xs text-gray-500">
                      {timezone}{tzOffset ? ` (${tzOffset})` : ""}
                    </span>
                  </div>
                )}
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Left Month */}
                  <div className="w-full sm:w-64">
                    <div className="flex items-center justify-between mb-4">
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" onClick={() => moveLeftMonth(-1)}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {isMounted ? leftMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" }) : ""}
                      </span>
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" onClick={() => moveLeftMonth(1)}>
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
                            className={`p-2 rounded ${isEdge ? "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200" :
                              inRange ? "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-black dark:text-white" :
                                d.isCurrentMonth ? "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800" : "text-gray-400 dark:text-gray-600"}`}
                          >
                            {d.day}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Right Month - Hidden on mobile, visible on medium screens+ */}
                  <div className="w-64 hidden md:block">
                    <div className="flex items-center justify-between mb-4">
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" onClick={() => moveRightMonth(-1)}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {isMounted ? rightMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" }) : ""}
                      </span>
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" onClick={() => moveRightMonth(1)}>
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
                            className={`p-2 rounded ${isEdge ? "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200" :
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

                {/* Footer tanggal terpilih + aksi */}
                <div className="text-xs text-center text-gray-600 dark:text-gray-400 mt-2 min-h-[16px]">
                  {isMounted ? `${fmt(tempStartDate)} - ${fmt(tempEndDate)}` : ""}
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <button className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-200 font-medium" onClick={applyDateRange}>
                    Apply
                  </button>
                  <button className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300" onClick={cancelDateRange}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Timezone label opsional */}
        {timezone && (
          <div className="flex justify-end mb-2">
            <span className="text-xs text-gray-600">
              {timezone}{tzOffset ? ` (${tzOffset})` : ""}
            </span>
          </div>
        )}
      </div>

      {/* Right cluster (ikon dsb) */}
      <div className="flex items-center gap-2">
        {children}
        {onToggleSidebar && (
          <button
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            onClick={onToggleSidebar}
            aria-expanded={typeof sidebarOpen === "boolean" ? sidebarOpen : undefined}
            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  )
}
