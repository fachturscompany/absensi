"use client"

import React, { useMemo, useState, useEffect } from "react"
import { DUMMY_TEAMS, type AppActivityEntry } from "@/lib/data/dummy-data"
import { getMembersForScreenshot, type ISimpleMember } from "@/action/screenshots"
import { getAppsActivityByMemberAndDate } from "@/action/apps"
import { getAllProjects, type IProject } from "@/action/projects"
import { useOrgStore } from "@/store/org-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTimezone } from "@/components/providers/timezone-provider"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { DateRange, SelectedFilter } from "@/components/insights/types"
import { useRouter, useSearchParams } from "next/navigation"

export default function AppsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const memberIdFromUrl = searchParams.get("memberId")
  const timezone = useTimezone()
  const { organizationId } = useOrgStore()

  const [realMembers, setRealMembers] = useState<ISimpleMember[]>([])
  const [realProjects, setRealProjects] = useState<IProject[]>([])
  const [appActivities, setAppActivities] = useState<AppActivityEntry[]>([])

  // Fetch real members & projects dari DB
  useEffect(() => {
    if (!organizationId) return

    // Fetch members
    getMembersForScreenshot(String(organizationId)).then(res => {
      if (res.success && res.data && res.data.length > 0) {
        setRealMembers(res.data)
      }
    })

    // Fetch projects
    getAllProjects(String(organizationId)).then(res => {
      if (res.success && res.data) {
        setRealProjects(res.data)
      }
    })
  }, [organizationId])

  const demoMembers = useMemo(() => realMembers.map(m => ({
    id: String(m.id),
    name: m.name,
    email: "",
    avatar: m.avatarUrl ?? undefined,
    activityScore: 0,
  })), [realMembers])

  // Get initial memberId: URL > sessionStorage > default
  const getInitialMemberId = (): string => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const memberIdFromLocation = urlParams.get("memberId")
      if (memberIdFromLocation) return memberIdFromLocation
    }
    if (memberIdFromUrl) return memberIdFromUrl
    if (typeof window !== "undefined") {
      const savedMemberId = sessionStorage.getItem("appSelectedMemberId")
      if (savedMemberId) return savedMemberId
    }
    return realMembers[0]?.id ?? ""
  }

  const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({
    type: "members",
    all: false,
    id: getInitialMemberId(),
  })

  // Update filter when memberId from URL changes
  useEffect(() => {
    if (memberIdFromUrl && memberIdFromUrl !== selectedFilter.id) {
      setSelectedFilter({
        type: "members",
        all: false,
        id: memberIdFromUrl,
      })
      if (typeof window !== "undefined") {
        sessionStorage.setItem("appSelectedMemberId", memberIdFromUrl)
      }
    } else if (!memberIdFromUrl && typeof window !== "undefined") {
      const savedMemberId = sessionStorage.getItem("appSelectedMemberId")
      if (savedMemberId && savedMemberId !== selectedFilter.id) {
        setSelectedFilter({
          type: "members",
          all: false,
          id: savedMemberId,
        })
      }
    }
  }, [memberIdFromUrl, selectedFilter.id])

  // Sync selectedFilter changes to sessionStorage and URL
  const handleFilterChange = (filter: SelectedFilter) => {
    // Jika all: true (tidak seharusnya terjadi karena hideAllOption), ubah ke member pertama
    if (filter.all) {
      const firstMemberId = realMembers[0]?.id ?? ""
      const newFilter: SelectedFilter = {
        type: "members",
        all: false,
        id: firstMemberId,
      }
      setSelectedFilter(newFilter)
      if (typeof window !== "undefined") {
        sessionStorage.setItem("appSelectedMemberId", firstMemberId)
        const params = new URLSearchParams(searchParams.toString())
        params.set("memberId", firstMemberId)
        router.push(`/activity/apps?${params.toString()}`)
      }
      return
    }

    setSelectedFilter(filter)
    if (!filter.all && filter.id && typeof window !== "undefined") {
      sessionStorage.setItem("appSelectedMemberId", filter.id)
      const params = new URLSearchParams(searchParams.toString())
      params.set("memberId", filter.id)
      router.push(`/activity/apps?${params.toString()}`)
    }
  }

  const selectedMemberId = selectedFilter.all ? null : (selectedFilter.id ?? null)

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    return { startDate: today, endDate: end }
  })
  // Set default member ID saat data real pertama kali datang
  useEffect(() => {
    if (realMembers.length > 0 && !selectedFilter.id) {
      setSelectedFilter(prev => ({ ...prev, id: realMembers[0]?.id ?? "" }))
    }
  }, [realMembers])

  const [selectedProject, setSelectedProject] = useState<string>("all")

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
        {/* <a href="/activity/apps/settings" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <Settings className="w-4 h-4" />
          Settings
        </a> */}
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
                  {group.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">{item.projectName}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">{item.appName}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 text-right">{formatTimeSpent(item.timeSpent)}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 text-right">{item.sessions}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

