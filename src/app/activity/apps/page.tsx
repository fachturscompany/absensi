"use client"

import React, { useMemo, useState, useEffect } from "react"
import { DUMMY_TEAMS, type AppActivityEntry } from "@/lib/data/dummy-data"
import { getAppsActivityByMemberAndDate } from "@/action/apps"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTimezone } from "@/components/providers/timezone-provider"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import { useActivityFilter } from "@/hooks/activity/use-activity-filter"

export const dynamic = "force-dynamic"

export default function AppsPage() {
  const timezone = useTimezone()

  const {
    realProjects,
    demoMembers,
    selectedFilter,
    selectedMemberId,
    handleFilterChange,
    dateRange,
    setDateRange,
    selectedProject,
    setSelectedProject,
  } = useActivityFilter({ storageKey: "appSelectedMemberId" })

  const [appActivities, setAppActivities] = useState<AppActivityEntry[]>([])

  // Fetch app activities
  useEffect(() => {
    if (!selectedMemberId) {
      setAppActivities([])
      return
    }

    // Convert ke timezone lokal member sebelum dikirim ke API
    const start = new Date(dateRange.startDate)
    const end = new Date(dateRange.endDate)

    // Format ke string YYYY-MM-DD
    const tzOffset = start.getTimezoneOffset() * 60000
    const startLocal = new Date(start.getTime() - tzOffset).toISOString().split('T')[0]
    const endLocal = new Date(end.getTime() - tzOffset).toISOString().split('T')[0]

    getAppsActivityByMemberAndDate(
      selectedMemberId,
      startLocal || '',
      endLocal || '',
      selectedProject
    ).then(res => {
      if (res.success && res.data) {
        setAppActivities(res.data)
      } else {
        setAppActivities([])
      }
    })
  }, [selectedMemberId, dateRange.startDate.getTime(), dateRange.endDate.getTime(), selectedProject])

  // Format time spent dari hours ke format H:MM:SS (seperti 0:01:17)
  const formatTimeSpent = (hours: number): string => {
    const totalSeconds = Math.floor(hours * 3600)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    // Format selalu H:MM:SS (termasuk 0:01:17)
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Filter dan group data berdasarkan date
  const groupedData = useMemo(() => {
    const filtered: AppActivityEntry[] = [...appActivities]

    // Group by date
    const grouped: Record<string, AppActivityEntry[]> = {}
    filtered.forEach(item => {
      const dateKey = item.date || ""
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(item)
    })

    // Convert to array and sort by date descending
    return Object.entries(grouped)
      .map(([date, items]) => ({
        date,
        items: items.sort((a, b) => {
          // Sort by time spent descending, then by app name
          if (b.timeSpent !== a.timeSpent) {
            return b.timeSpent - a.timeSpent
          }
          return a.appName.localeCompare(b.appName)
        })
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [appActivities])


  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">App activity</h1>
      </div>


      {/* Date & User Controls */}
      <div className="flex w-full items-center justify-between gap-4 px-6 py-3">
        <InsightsHeader
          selectedFilter={selectedFilter}
          onSelectedFilterChange={handleFilterChange}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          members={demoMembers}
          teams={DUMMY_TEAMS}
          timezone={timezone}
          hideAllOption={true}
          hideTeamsTab={true}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 px-6 py-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 font-bold uppercase mb-1">PROJECT</span>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {realProjects.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">App name</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Time spent (hrs)</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Sessions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groupedData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                  No app activity data available for the selected filters.
                </td>
              </tr>
            ) : (
              groupedData.map((group) => (
                <React.Fragment key={group.date}>
                  {/* Data Rows */}
                  {group.items.map((item) => {
                    return (
                      <React.Fragment key={item.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <span>{item.projectName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-900">{item.appName}</td>
                          <td className="px-6 py-3 text-sm text-gray-900 text-right">{formatTimeSpent(item.timeSpent)}</td>
                          <td className="px-6 py-3 text-sm text-gray-900 text-right">{item.sessions}</td>
                        </tr>
                      </React.Fragment>
                    )
                  })}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

