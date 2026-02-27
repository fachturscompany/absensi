"use client"

import React, { useMemo, useState, useEffect } from "react"
import { Plus, Minus } from "lucide-react"
import { DUMMY_TEAMS, type UrlActivityEntry } from "@/lib/data/dummy-data"
import { getMembersForScreenshot, type ISimpleMember } from "@/action/screenshots"
import { getUrlsActivityByMemberAndDate } from "@/action/urls"
import { getAllProjects, type IProject } from "@/action/projects"
import { useOrgStore } from "@/store/org-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTimezone } from "@/components/providers/timezone-provider"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { DateRange, SelectedFilter } from "@/components/insights/types"
import { useRouter, useSearchParams } from "next/navigation"

export default function UrlsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const memberIdFromUrl = searchParams.get("memberId")
  const timezone = useTimezone()
  const { organizationId } = useOrgStore()

  const [realMembers, setRealMembers] = useState<ISimpleMember[]>([])
  const [realProjects, setRealProjects] = useState<IProject[]>([])
  const [urlActivities, setUrlActivities] = useState<UrlActivityEntry[]>([])

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
      const savedMemberId = sessionStorage.getItem("urlSelectedMemberId")
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
        sessionStorage.setItem("urlSelectedMemberId", memberIdFromUrl)
      }
    } else if (!memberIdFromUrl && typeof window !== "undefined") {
      const savedMemberId = sessionStorage.getItem("urlSelectedMemberId")
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
        sessionStorage.setItem("urlSelectedMemberId", firstMemberId)
        const params = new URLSearchParams(searchParams.toString())
        params.set("memberId", firstMemberId)
        router.push(`/activity/urls?${params.toString()}`)
      }
      return
    }

    setSelectedFilter(filter)
    if (!filter.all && filter.id && typeof window !== "undefined") {
      sessionStorage.setItem("urlSelectedMemberId", filter.id)
      const params = new URLSearchParams(searchParams.toString())
      params.set("memberId", filter.id)
      router.push(`/activity/urls?${params.toString()}`)
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
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Set default member ID saat data real pertama kali datang
  useEffect(() => {
    if (realMembers.length > 0 && !selectedFilter.id) {
      setSelectedFilter(prev => ({ ...prev, id: realMembers[0]?.id ?? "" }))
    }
  }, [realMembers])

  // Fetch url activities
  useEffect(() => {
    if (!selectedMemberId) {
      setUrlActivities([])
      return
    }

    const start = new Date(dateRange.startDate)
    const end = new Date(dateRange.endDate)
    const tzOffset = start.getTimezoneOffset() * 60000
    const startLocal = new Date(start.getTime() - tzOffset).toISOString().split('T')[0]
    const endLocal = new Date(end.getTime() - tzOffset).toISOString().split('T')[0]

    getUrlsActivityByMemberAndDate(
      selectedMemberId,
      startLocal || '',
      endLocal || '',
      selectedProject
    ).then(res => {
      if (res.success && res.data) {
        setUrlActivities(res.data)
      } else {
        setUrlActivities([])
      }
    })
  }, [selectedMemberId, dateRange.startDate.getTime(), dateRange.endDate.getTime(), selectedProject])

  // Format time spent dari hours ke format H:MM:SS (seperti 0:00:57)
  const formatTimeSpent = (hours: number): string => {
    const totalSeconds = Math.floor(hours * 3600)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }


  // Filter dan group data berdasarkan date
  const groupedData = useMemo(() => {
    const filtered: UrlActivityEntry[] = [...urlActivities]

    // Group by date, then by project+site
    const grouped: Record<string, Record<string, UrlActivityEntry[]>> = {}
    filtered.forEach(item => {
      const dateKey = item.date || ""
      const groupKey = `${item.projectId}-${item.site}`
      if (!grouped[dateKey]) {
        grouped[dateKey] = {}
      }
      if (!grouped[dateKey][groupKey]) {
        grouped[dateKey][groupKey] = []
      }
      grouped[dateKey][groupKey].push(item)
    })

    // Convert to array and sort by date descending
    return Object.entries(grouped)
      .map(([date, groups]) => ({
        date,
        groups: Object.entries(groups)
          .filter(([, items]) => items.length > 0)
          .map(([groupKey, items]) => {
            // Aggregate items in the same group
            const firstItem = items[0]!
            const totalTime = items.reduce((sum, item) => sum + item.timeSpent, 0)
            const allDetails = items.flatMap(item => item.details || [])

            return {
              id: groupKey,
              projectId: firstItem.projectId,
              projectName: firstItem.projectName,
              memberId: firstItem.memberId,
              site: firstItem.site,
              timeSpent: totalTime,
              date: firstItem.date,
              details: allDetails.length > 0 ? allDetails : undefined
            }
          })
          .sort((a, b) => {
            // Sort by time spent descending, then by site name
            if (b.timeSpent !== a.timeSpent) {
              return b.timeSpent - a.timeSpent
            }
            return a.site.localeCompare(b.site)
          })
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [urlActivities])



  // Toggle expand/collapse
  const toggleExpand = (rowId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(rowId)) {
        newSet.delete(rowId)
      } else {
        newSet.add(rowId)
      }
      return newSet
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">URL activity</h1>
        {/* <a href="/activity/urls/settings" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
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
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Site</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Time spent (hrs)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groupedData.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-500">
                  No URL activity data available for the selected filters.
                </td>
              </tr>
            ) : (
              groupedData.map((group) => (
                <React.Fragment key={group.date}>

                  {/* Data Rows */}
                  {group.groups.map((item) => {
                    const isExpanded = expandedRows.has(item.id)
                    const hasDetails = item.details && item.details.length > 0

                    return (
                      <React.Fragment key={item.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              {hasDetails && (
                                <button
                                  onClick={() => toggleExpand(item.id)}
                                  className="text-gray-500 hover:text-gray-700"
                                  aria-label={isExpanded ? "Collapse" : "Expand"}
                                >
                                  {isExpanded ? (
                                    <Minus className="h-4 w-4" />
                                  ) : (
                                    <Plus className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                              {!hasDetails && <span className="text-blue-600">+</span>}
                              <span>{item.projectName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-900">{item.site}</td>
                          <td className="px-6 py-3 text-sm text-gray-900 text-right">{formatTimeSpent(item.timeSpent)}</td>
                        </tr>
                        {isExpanded && hasDetails && (
                          <>
                            {/* Header row untuk sub-table */}
                            <tr>
                              <td className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</td>
                              <td className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">URL</td>
                              <td className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Time spent (hours)</td>
                            </tr>
                            {/* Data rows untuk sub-table */}
                            {item.details!.map((detail, idx) => (
                              <tr
                                key={detail.id}
                                className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                              >
                                <td className="px-6 py-2 text-sm text-gray-500">{detail.title || ""}</td>
                                <td className="px-6 py-2 text-sm">
                                  <a
                                    href={detail.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700 hover:underline"
                                  >
                                    {detail.url.length > 60 ? `${detail.url.substring(0, 60)}...` : detail.url}
                                  </a>
                                </td>
                                <td className="px-6 py-2 text-sm text-gray-900 text-right">{formatTimeSpent(detail.timeSpent)}</td>
                              </tr>
                            ))}
                          </>
                        )}
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