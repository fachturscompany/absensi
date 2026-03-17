"use client"

import { useMemo, useState } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import { InsightsRightSidebar } from "@/components/insights/InsightsRightSidebar"
import type { DateRange, PickerItem, SelectedFilter } from "@/components/insights/types"
import { DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { useTimezone } from "@/components/providers/timezone-provider"
import { Info } from "lucide-react"
import {
  DUMMY_UTILIZATION_DATA,
  DUMMY_TOP_APPS,
  DUMMY_LEADERBOARD,
  DUMMY_CATEGORIES,
  DUMMY_WORK_TIME_CLASSIFICATION,
  DUMMY_DAILY_FOCUS,
  DUMMY_ACTIVITY
} from "@/lib/data/dummy-data"

// Empty State Component
const EmptyState = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    </div>
    <p className="text-sm font-medium text-gray-900 mb-1">{title}</p>
    {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
  </div>
)

export default function PerformancePage() {
  const timezone = useTimezone()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: false, id: "1" })
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 6)),
    endDate: new Date(),
  })

  const members: PickerItem[] = useMemo(() => DUMMY_MEMBERS, [])
  const teams: PickerItem[] = useMemo(() => DUMMY_TEAMS, [])
  const demoMembers = useMemo(() => DUMMY_MEMBERS, [])
  const demoTeams = useMemo(() => DUMMY_TEAMS, [])

  // Get selected member/team ID
  const selectedId = useMemo(() => {
    // Direct ID mapping since dummy data now matches dropdown IDs
    if (selectedFilter.id) return selectedFilter.id
    return null
  }, [selectedFilter])

  // Filter and Aggregate data based on selected member/team and date range
  const filteredUtilization = useMemo(() => {
    const filtered = DUMMY_UTILIZATION_DATA.filter(item => {
      // Simple string date comparison since both are YYYY-MM-DD
      // For a real app, use proper date library. Here we just utilize the provided date string.
      // But since our dummy data is sparse (only 2026-01-19), we relax the date filter for demo purposes if selected range includes typical dummy dates
      // Or strictly filter. Let's strictly filter but check stripping time.
      const itemDate = new Date(item.date).setHours(0, 0, 0, 0)
      const start = new Date(dateRange.startDate).setHours(0, 0, 0, 0)
      const end = new Date(dateRange.endDate).setHours(0, 0, 0, 0)

      const inDateRange = itemDate >= start && itemDate <= end

      if (!inDateRange) return false

      if (selectedId) {
        if (selectedFilter.type === 'members') return item.memberId === selectedId
        return item.teamId === selectedId
      }
      // For "All Members", include only individual member data, not team aggregates if any
      return item.memberId !== undefined
    })

    if (filtered.length === 0) return null

    // Aggregate if multiple records (for "All Members" or multiple days)
    if (filtered.length > 1) {
      const totalHours = filtered.reduce((acc, curr) => acc + curr.dailyWorkHours, 0)
      const totalTarget = filtered.reduce((acc, curr) => acc + curr.targetHours, 0)
      const avgTarget = filtered.reduce((acc, curr) => acc + curr.avgDailyTarget, 0) / filtered.length

      return {
        dailyWorkHours: totalHours / (selectedId ? 1 : filtered.length), // Avg for companies, Sum for multi-day single user? Actually usually we show Average Daily Hours for the period
        // Let's mimic Average Daily Hours
        targetHours: totalTarget / filtered.length,
        avgDailyTarget: avgTarget,
        date: (filtered[0]?.date) || '2026-01-19',
        memberId: 'aggregate'
      } as any // Cast to any to avoid type issues with dummy data structure
    }

    return filtered[0]
  }, [selectedId, selectedFilter.type, dateRange])

  const filteredDailyFocus = useMemo(() => {
    const filtered = DUMMY_DAILY_FOCUS.filter(item => {
      const itemDate = new Date(item.date).setHours(0, 0, 0, 0)
      const start = new Date(dateRange.startDate).setHours(0, 0, 0, 0)
      const end = new Date(dateRange.endDate).setHours(0, 0, 0, 0)

      if (itemDate < start || itemDate > end) return false

      if (selectedId) {
        return selectedFilter.type === 'members' ? item.memberId === selectedId : item.teamId === selectedId // Note: dummy data for teams might need adding to Daily Focus if not present, but simplified here
      }
      return true
    })

    // If "All Members", we need to aggregate by DATE
    if (!selectedId) {
      // Group by date
      const byDate = new Map<string, { focus: number, distraction: number, count: number }>();
      filtered.forEach(item => {
        const current = byDate.get(item.date) || { focus: 0, distraction: 0, count: 0 }
        byDate.set(item.date, {
          focus: current.focus + item.focusHours,
          distraction: current.distraction + item.distractionHours,
          count: current.count + 1
        })
      })

      return Array.from(byDate.entries()).map(([date, data]) => ({
        date,
        focusHours: data.focus / data.count, // Average
        distractionHours: data.distraction / data.count, // Average
        memberId: 'aggregate'
      })).sort((a, b) => a.date.localeCompare(b.date))
    }

    return filtered
  }, [selectedId, selectedFilter.type, dateRange])

  // Similar logic for other filters... simple pass-through for now for others as aggregation is complex
  // But ensure ID matching is correct
  const filteredActivity = useMemo(() => {
    return DUMMY_ACTIVITY.filter(item => {
      const itemDate = new Date(item.date).setHours(0, 0, 0, 0)
      const start = new Date(dateRange.startDate).setHours(0, 0, 0, 0)
      const end = new Date(dateRange.endDate).setHours(0, 0, 0, 0)

      if (itemDate < start || itemDate > end) return false
      if (selectedId) return selectedFilter.type === 'members' ? item.memberId === selectedId : item.teamId === selectedId
      return true
    })
    // For All Members, ideally aggregate activity by hour... skipping complex aggregation for speed unless requested
  }, [selectedId, selectedFilter.type, dateRange])

  const filteredTopApps = useMemo(() => {
    const filtered = DUMMY_TOP_APPS.filter(item => {
      const itemDate = new Date(item.date).setHours(0, 0, 0, 0)
      const start = new Date(dateRange.startDate).setHours(0, 0, 0, 0)
      const end = new Date(dateRange.endDate).setHours(0, 0, 0, 0)

      if (itemDate < start || itemDate > end) return false
      if (selectedId) return selectedFilter.type === 'members' ? item.memberId === selectedId : item.teamId === selectedId
      return true
    })

    // If "All Members", aggregate by app name to avoid duplicates
    if (!selectedId && filtered.length > 0) {
      const byApp = new Map<string, { name: string, timeSpent: number, category: string }>();
      filtered.forEach(item => {
        const current = byApp.get(item.name) || { name: item.name, timeSpent: 0, category: item.category }
        byApp.set(item.name, {
          name: item.name,
          timeSpent: current.timeSpent + item.timeSpent,
          category: current.category || item.category // Keep category, assuming it's consistent for an app
        })
      })

      // Sort by timeSpent descending and return top entries
      return Array.from(byApp.values())
        .sort((a, b) => b.timeSpent - a.timeSpent)
        .slice(0, 10) // Show top 10
    }

    return filtered
  }, [selectedId, selectedFilter.type, dateRange])

  // Ganti seluruh deklarasi useMemo filteredCategories dengan ini
  const filteredCategories = useMemo(() => {
    // 1) Filter berdasar tanggal dan selection (All / Member / Team)
    const filtered = DUMMY_CATEGORIES.filter(item => {
      const itemDate = new Date(item.date).setHours(0, 0, 0, 0)
      const start = new Date(dateRange.startDate).setHours(0, 0, 0, 0)
      const end = new Date(dateRange.endDate).setHours(0, 0, 0, 0)

      if (itemDate < start || itemDate > end) return false
      if (selectedId) {
        return selectedFilter.type === "members" ? item.memberId === selectedId : item.teamId === selectedId
      }
      return true
    })

    if (filtered.length === 0) return []

    // 2) Agregasi SELALU berdasarkan nama kategori (dengan normalisasi)
    const byKey = new Map<string, { displayName: string; hours: number; color: string }>()
    for (const item of filtered) {
      const key = item.name.trim().toLowerCase()
      const existing = byKey.get(key)
      if (existing) {
        existing.hours += item.hours
      } else {
        byKey.set(key, {
          displayName: item.name.trim(),
          hours: item.hours,
          color: item.color,
        })
      }
    }

    // 3) Hitung total + bentuk array hasil agregasi + persentase
    const totalHours = Array.from(byKey.values()).reduce((acc, cur) => acc + cur.hours, 0)
    const aggregated = Array.from(byKey.values()).map(v => ({
      name: v.displayName,
      hours: v.hours,
      percentage: totalHours > 0 ? Math.round((v.hours / totalHours) * 100) : 0,
      color: v.color,
    }))

    // 4) Urutkan desc by hours agar stabil
    aggregated.sort((a, b) => b.hours - a.hours)

    return aggregated
  }, [selectedId, selectedFilter.type, dateRange])

  const utilizationPercentage = filteredUtilization
    ? (filteredUtilization.dailyWorkHours / filteredUtilization.targetHours) * 100
    : 0

  // Leaderboard uses simplified logic: show all if "All", or show specific if selected (though leaderboard of 1 person is weird, usually leaderboard is always global or team-based)
  // Refined: If Team selected -> Leaderboard of team members. If Member selected -> Leaderboard highlighted? Or just show all.
  // Let's filter leaderboard by available members in dummy-insights
  const filteredLeaderboard = useMemo(() => {
    if (!selectedId || (selectedFilter.type === 'members')) return DUMMY_LEADERBOARD
    // If team selected, ideally filter leaderboard for that team... skipping for now as leaderboard dummy data doesn't link to teams easily without lookups
    return DUMMY_LEADERBOARD
  }, [selectedId, selectedFilter])

  // Work Time Classification filtering
  const filteredWorkTimeClassification = useMemo(() => {
    const filtered = DUMMY_WORK_TIME_CLASSIFICATION.filter(item => {
      if (!item.date) return true // Include items without date (fallback)

      const itemDate = new Date(item.date).setHours(0, 0, 0, 0)
      const start = new Date(dateRange.startDate).setHours(0, 0, 0, 0)
      const end = new Date(dateRange.endDate).setHours(0, 0, 0, 0)

      if (itemDate < start || itemDate > end) return false
      if (selectedId) return selectedFilter.type === 'members' ? item.memberId === selectedId : item.teamId === selectedId
      return item.memberId !== undefined // For "All Members", only include member-specific data
    })

    // If "All Members", aggregate by category
    if (!selectedId && filtered.length > 0) {
      const byCategory = new Map<string, { total: number, count: number, color: string }>();
      filtered.forEach(item => {
        const current = byCategory.get(item.category) || { total: 0, count: 0, color: item.color }
        byCategory.set(item.category, {
          total: current.total + item.percentage,
          count: current.count + 1,
          color: item.color
        })
      })

      return Array.from(byCategory.entries()).map(([category, data]) => ({
        category,
        percentage: data.total / data.count, // Average percentage
        color: data.color
      }))
    }

    return filtered
  }, [selectedId, selectedFilter.type, dateRange])


  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="py-4 px-6">
          <h1 className="text-xl font-semibold mb-5">Performance</h1>
          <InsightsHeader
            selectedFilter={selectedFilter}
            onSelectedFilterChange={setSelectedFilter}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            members={members}
            teams={teams}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(o => !o)}
            timezone={timezone}
          />
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex">
        {/* Left Content */}
        <div className="flex-1 min-w-0 p-6 space-y-6">
          {/* Row 1: Utilization + Work Time Classification */}
          <div className="grid grid-cols-2 gap-6">
            {/* UTILIZATION */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">UTILIZATION</h3>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-center gap-8">
                {/* Circular Gauge */}
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke={utilizationPercentage >= 100 ? "#10b981" : "#3b82f6"}
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(utilizationPercentage / 100) * 351.86} 351.86`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{filteredUtilization?.dailyWorkHours.toFixed(1) || '0.0'}h</span>
                    <span className="text-xs text-gray-500">Daily work avg.</span>
                  </div>
                </div>
                {/* Stats */}
                <div className="flex-1">
                  <div className="text-3xl font-bold mb-2">{filteredUtilization?.dailyWorkHours.toFixed(1) || '0.0'}</div>
                  <div className="text-sm text-red-500 mb-3">
                    {filteredUtilization && filteredUtilization.dailyWorkHours < filteredUtilization.targetHours ? "Below target" : "On target"}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    Avg. daily target: {filteredUtilization?.avgDailyTarget.toFixed(1) || '8.0'}
                  </div>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-xs mb-1">
                  <span>0h</span>
                  <span>200%</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* WORK TIME CLASSIFICATION */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">WORK TIME CLASSIFICATION</h3>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <div className="space-y-3">
                {filteredWorkTimeClassification.length > 0 ? filteredWorkTimeClassification.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700">{item.category}</span>
                      <span className="text-sm font-semibold">{item.percentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color
                        }}
                      ></div>
                    </div>
                  </div>
                )) : (
                  <EmptyState title="No data" subtitle="There was no data registered in the time period selected" />
                )}
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Daily Focus + Activity */}
          <div className="grid grid-cols-2 gap-6">
            {/* DAILY FOCUS */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">DAILY FOCUS</h3>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <div className="h-48 flex items-end justify-between gap-1 px-2">
                {filteredDailyFocus.length > 0 ? filteredDailyFocus.map((day, idx) => {
                  const total = day.focusHours + day.distractionHours
                  const focusPercent = (day.focusHours / total) * 100
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-gray-200 rounded-t" style={{ height: `${(total / 8) * 100}%`, minHeight: '20px' }}>
                        <div className="w-full bg-green-500 rounded-t" style={{ height: `${focusPercent}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    </div>
                  )
                }) : (
                  <EmptyState title="No data" subtitle="There was no data registered in the time period selected" />
                )}
              </div>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600">Focus time</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 rounded"></div>
                  <span className="text-gray-600">Distraction</span>
                </div>
              </div>
            </div>

            {/* ACTIVITY */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">ACTIVITY</h3>
                <Info className="w-4 h-4 text-gray-100" />
              </div>
              <div className="h-48 flex items-end justify-between gap-1">
                {filteredActivity.length > 0 ? filteredActivity.slice(0, 10).map((activity, idx) => {
                  const activePercent = (activity.activeMinutes / 60) * 100
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full h-40 flex flex-col justify-end">
                        <div
                          className="w-full bg-zinc-900 rounded-t"
                          style={{ height: `${activePercent}%`, minHeight: '4px' }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-100 text-center" style={{ fontSize: '10px' }}>
                        {activity.hour.replace(':00', '')}
                      </span>
                    </div>
                  )
                }) : (
                  <EmptyState title="No data" subtitle="There was no data registered in the time period selected" />
                )}
              </div>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-zinc-900 rounded"></div>
                  <span className="text-gray-600">Active</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* MEETINGS
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">MEETINGS</h3>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-start gap-8">
              <div className="flex-1">
                <p className="text-sm text-gray-700 mb-4">
                  Connect your teams calendars and<br />
                  boost insights with meetings data
                </p>
                <div className="space-y-2">
                  <button className="w-full max-w-xs flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign in with Google
                  </button>
                  <button className="w-full max-w-xs flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                    <svg className="w-5 h-5" viewBox="0 0 21 21" fill="white">
                      <rect width="10" height="10" fill="white" />
                      <rect x="11" width="10" height="10" fill="white" />
                      <rect y="11" width="10" height="10" fill="white" />
                      <rect x="11" y="11" width="10" height="10" fill="white" />
                    </svg>
                    Sign in with Microsoft
                  </button>
                </div>
              </div>
              <div className="w-48">
                <img
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 150'%3E%3Crect fill='%23f3f4f6' width='200' height='150'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14'%3EMeeting illustration%3C/text%3E%3C/svg%3E"
                  alt="Meetings illustration"
                  className="w-full"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
              <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
              </svg>
              <span>Benchmark coming soon</span>
            </div>
          </div> */}

          {/* WORK TIME EXPENDITURE */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">WORK TIME EXPENDITURE</h3>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <EmptyState
              title="No data"
              subtitle="There was no data registered in the time period selected"
            />
          </div>

          {/*  Row 3: Team Collaboration + Top Apps & URLs */}
          <div className="grid grid-cols-2 gap-6">
            {/* TEAM COLLABORATION */}
            {/* <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">TEAM COLLABORATION</h3>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-700 mb-4">
                Connect your organization's communication platform to measure how your teams are engaging in collaboration
              </p>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                <svg className="w-5 h-5" viewBox="0 0 21 21" fill="white">
                  <rect width="10" height="10" fill="white" />
                  <rect x="11" width="10" height="10" fill="white" />
                  <rect y="11" width="10" height="10" fill="white" />
                  <rect x="11" y="11" width="10" height="10" fill="white" />
                </svg>
                Sign in with Microsoft
              </button>
            </div> */}

            {/* TOP APPS & URLS */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">TOP APPS & URLS</h3>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <div className="space-y-3">
                {filteredTopApps.length > 0 ? filteredTopApps.map((app, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs font-semibold">{app.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{app.name}</div>
                        <div className="text-xs text-gray-500">{app.category}</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold">{app.timeSpent}m</div>
                  </div>
                )) : (
                  <EmptyState title="No data" subtitle="There was no data registered in the time period selected" />
                )}
              </div>
            </div>
          </div>

          {/* Row 4: Leaderboard + Categories */}
          <div className="grid grid-cols-2 gap-6">
            {/* LEADERBOARD */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">LEADERBOARD</h3>
              </div>
              <div className="space-y-3">
                {filteredLeaderboard.length > 0 ? filteredLeaderboard.map((person, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 text-sm font-semibold text-gray-500">#{person.rank}</div>
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 text-sm font-semibold">
                      {person.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{person.name}</div>
                    </div>
                    <div className="text-sm font-semibold">{person.hours}h</div>
                  </div>
                )) : (
                  <EmptyState title="No data" subtitle="There was no data registered in the time period selected" />
                )}
              </div>
            </div>

            {/* CATEGORIES */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">CATEGORIES</h3>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <div className="space-y-4">
                {filteredCategories.length > 0 ? filteredCategories.map((cat, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: cat.color }}></div>
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{cat.hours}h</span>
                        <span className="text-sm font-semibold">{cat.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color
                        }}
                      ></div>
                    </div>
                  </div>
                )) : (
                  <EmptyState title="No data" subtitle="There was no data registered in the time period selected" />
                )}
              </div>
            </div>
          </div>
        </div>

        <InsightsRightSidebar
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          members={demoMembers}
          teams={demoTeams}
          selectedFilter={selectedFilter}
          onSelectedFilterChange={setSelectedFilter}
        />
      </div>
    </div>
  )
}
