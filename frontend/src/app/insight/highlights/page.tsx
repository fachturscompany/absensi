"use client"

import { Info, ChevronRight } from "lucide-react"
import { useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { DUMMY_BEHAVIOR_CHANGES, DUMMY_MEMBERS, DUMMY_SMART_NOTIFICATIONS, DUMMY_TEAMS, DUMMY_UNUSUAL_ACTIVITIES } from "@/lib/data/dummy-data"
import { useTimezone } from "@/components/providers/timezone-provider"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import { InsightsRightSidebar } from "@/components/insights/InsightsRightSidebar"
import type { DateRange, SelectedFilter } from "@/components/insights/types"

export default function HighlightsPage() {
  const timezone = useTimezone()
  const searchParams = useSearchParams()
  const memberIdFromUrl = searchParams.get("memberId")

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({
    type: "members",
    all: false,
    id: memberIdFromUrl || "m1",
  })

  // Update filter when memberId from URL changes
  // Handle filter changes from URL params
  useEffect(() => {
    if (memberIdFromUrl && memberIdFromUrl !== selectedFilter.id) {
      console.log("Syncing filter with URL:", memberIdFromUrl)
      setSelectedFilter({
        type: "members",
        all: false,
        id: memberIdFromUrl,
      })
    }
  }, [memberIdFromUrl]) // Only run when URL param changes

  // Handle initial restore from session storage (Once on mount)
  useEffect(() => {
    // Only restore if NO URL param is present
    if (!memberIdFromUrl && typeof window !== "undefined") {
      const savedMemberId = sessionStorage.getItem("screenshotSelectedMemberId")
      if (savedMemberId && savedMemberId !== selectedFilter.id) {
        console.log("Restoring filter from session storage:", savedMemberId)
        setSelectedFilter({
          type: "members",
          all: false,
          id: savedMemberId,
        })
      }
    }
     
  }, []) // Run ONCE on mount
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    return { startDate: start, endDate: end }
  })

  const demoMembers = useMemo(() => DUMMY_MEMBERS, [])
  const demoTeams = useMemo(() => DUMMY_TEAMS, [])

  const filteredUnusualActivities = useMemo(() => {
    let filtered = DUMMY_UNUSUAL_ACTIVITIES

    if (!selectedFilter.all) {
      if (selectedFilter.type === "members" && selectedFilter.id) {
        filtered = filtered.filter((activity) => activity.memberId === selectedFilter.id)
      } else if (selectedFilter.type === "teams" && selectedFilter.id) {
        const team = DUMMY_TEAMS.find((t) => t.id === selectedFilter.id)
        filtered = filtered.filter((activity) => team?.members.includes(activity.memberId))
      }
    }

    return filtered.filter((activity) => {
      const activityDate = new Date(activity.date)
      return activityDate >= dateRange.startDate && activityDate <= dateRange.endDate
    })
  }, [selectedFilter, dateRange])

  const filteredNotifications = useMemo(() => {
    let filtered = DUMMY_SMART_NOTIFICATIONS

    if (!selectedFilter.all) {
      if (selectedFilter.type === "members" && selectedFilter.id) {
        filtered = filtered.filter((notification) => notification.memberId === selectedFilter.id)
      } else if (selectedFilter.type === "teams" && selectedFilter.id) {
        const team = DUMMY_TEAMS.find((t) => t.id === selectedFilter.id)
        filtered = filtered.filter((notification) => team?.members.includes(notification.memberId))
      }
    }

    return filtered.filter((notification) => {
      const notifDate = new Date(notification.timestamp)
      return notifDate >= dateRange.startDate && notifDate <= dateRange.endDate
    })
  }, [selectedFilter, dateRange])

  const filteredBehaviorChanges = useMemo(() => {
    let filtered = DUMMY_BEHAVIOR_CHANGES

    if (!selectedFilter.all) {
      if (selectedFilter.type === "members" && selectedFilter.id) {
        filtered = filtered.filter((change) => change.memberId === selectedFilter.id)
      } else if (selectedFilter.type === "teams" && selectedFilter.id) {
        const team = DUMMY_TEAMS.find((t) => t.id === selectedFilter.id)
        filtered = filtered.filter((change) => team?.members.includes(change.memberId))
      }
    }

    return filtered.filter((change) => {
      const changeDate = new Date(change.detectedAt)
      return changeDate >= dateRange.startDate && changeDate <= dateRange.endDate
    })
  }, [selectedFilter, dateRange])

  const totalUnusualMinutes = filteredUnusualActivities.reduce((sum, activity) => sum + activity.duration, 0)

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200">
        <div className="py-4 px-6">
          <h1 className="text-xl font-semibold mb-5">Highlights</h1>
          <InsightsHeader
            selectedFilter={selectedFilter}
            onSelectedFilterChange={setSelectedFilter}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            members={demoMembers}
            teams={demoTeams}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            timezone={timezone}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 p-4 md:p-6 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Unusual Activity</h2>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <a
                href="/insight/unusual-activity"
                className="text-sm text-zinc-600 hover:text-zinc-900 flex items-center gap-1 font-medium"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
              <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 md:flex md:flex-col gap-4 min-w-[120px]">
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col justify-center">
                      <div className="text-2xl md:text-3xl font-bold">
                        {new Set(filteredUnusualActivities.map((activity) => activity.memberId)).size}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600 mt-1">Members</div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col justify-center">
                      <div className="text-2xl md:text-3xl font-bold">{filteredUnusualActivities.length}</div>
                      <div className="text-xs md:text-sm text-gray-600 mt-1">Instances</div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col justify-center">
                      <div className="text-2xl md:text-3xl font-bold">
                        {Math.floor(totalUnusualMinutes / 60)}:
                        {(totalUnusualMinutes % 60).toString().padStart(2, "0")}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600 mt-1">Total time (h:m)</div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="space-y-3">
                      {filteredUnusualActivities.slice(0, 4).map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 text-sm hover:bg-gray-50 p-2 rounded-md -mx-2 transition-colors cursor-pointer"
                        >
                          <div
                            className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${activity.severity === "highly_unusual"
                              ? "bg-red-500"
                              : activity.severity === "unusual"
                                ? "bg-orange-500"
                                : "bg-yellow-500"
                              }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-gray-900">{activity.memberName}</span>
                              <span className="text-xs text-gray-500 shrink-0">
                                {new Date(activity.timestamp).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="text-gray-600 mt-0.5">
                              <span className="font-medium">{activity.activityType}:</span>{" "}
                              {activity.description}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Duration: {Math.floor(activity.duration / 60)}h {activity.duration % 60}m
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredUnusualActivities.length === 0 && (
                        <div className="text-center py-6 text-gray-500">No unusual activity detected</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Smart Notifications</h2>
              <Info className="w-4 h-4 text-gray-400" />
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <div key={notification.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm">{notification.memberName}</span>
                          <span
                            className={`px-2 py-1 text-xs rounded ${notification.severity === "high"
                              ? "bg-red-100 text-red-700"
                              : notification.severity === "medium"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-yellow-100 text-yellow-700"
                              }`}
                          >
                            {notification.severity}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">{notification.message}</div>
                        <div className="text-xs text-gray-500">{new Date(notification.timestamp).toLocaleString()}</div>
                      </div>
                      <button className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">View Details</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Significant Changes in Behavior</h2>
              <Info className="w-4 h-4 text-gray-400" />
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <div className="space-y-3">
                {filteredBehaviorChanges.map((change) => (
                  <div key={`${change.memberId}-${change.detectedAt}`} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm">{change.memberName}</span>
                          <span
                            className={`px-2 py-1 text-xs rounded ${change.changeType === "productivity_increase"
                              ? "bg-green-100 text-green-700"
                              : change.changeType === "productivity_decrease"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                              }`}
                          >
                            {change.changeType.replace("_", " ")}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">{change.description}</div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <span>Previous: {change.previousValue}</span>
                          <span>→</span>
                          <span>Current: {change.currentValue}</span>
                          <span className={`font-semibold ${change.changePercent > 0 ? "text-green-600" : "text-red-600"}`}>
                            {change.changePercent > 0 ? "+" : ""}
                            {change.changePercent.toFixed(1)}%
                          </span>
                          <span>•</span>
                          <span>{change.detectedAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
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
