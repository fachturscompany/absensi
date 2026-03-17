"use client"

import { useState, useMemo } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import { InsightsRightSidebar } from "@/components/insights/InsightsRightSidebar"
import { DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { Avatar, AvatarFallback } from "@/components/profile&image/avatar"
import { DUMMY_UNUSUAL_ACTIVITIES, getActivityStats } from "@/lib/data/dummy-data"
import type { SelectedFilter, DateRange } from "@/components/insights/types"

function initialsFromName(name: string): string {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean)
    const first = parts[0]?.[0] ?? ""
    const second = parts[1]?.[0] ?? ""
    return (first + second).toUpperCase()
}

export default function UnusualActivityPage() {
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({
        type: "members",
        all: false,
        id: "1"
    })

    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(new Date().setDate(new Date().getDate() - 6)),
        endDate: new Date(),
    })

    const [sidebarOpen, setSidebarOpen] = useState(true)

    // Filter state for activity levels
    const [activityFilters, setActivityFilters] = useState({
        highlyUnusual: true,
        unusual: true,
        slightlyUnusual: true,
    })

    const toggleFilter = (filter: keyof typeof activityFilters) => {
        setActivityFilters(prev => ({
            ...prev,
            [filter]: !prev[filter]
        }))
    }

    // Filter activities based on selection, date range, and severity filters
    const filteredActivities = useMemo(() => {
        const filtered = DUMMY_UNUSUAL_ACTIVITIES.filter(activity => {
            // Date range filter
            const activityDate = new Date(activity.date)
            const inDateRange = activityDate >= dateRange.startDate && activityDate <= dateRange.endDate
            if (!inDateRange) return false

            // Member/Team filter
            if (!selectedFilter.all && selectedFilter.id) {
                if (selectedFilter.type === 'members') {
                    if (activity.memberId !== selectedFilter.id) return false
                }
                // For teams, we would need team membership data
            }

            // Severity filter
            if (activity.severity === 'highly_unusual' && !activityFilters.highlyUnusual) return false
            if (activity.severity === 'unusual' && !activityFilters.unusual) return false
            if (activity.severity === 'slightly_unusual' && !activityFilters.slightlyUnusual) return false

            return true
        })

        return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }, [selectedFilter, dateRange, activityFilters])

    // Calculate stats
    const stats = useMemo(() => getActivityStats(filteredActivities), [filteredActivities])

    // Members summary for table view
    const membersSummary = useMemo(() => {
        type Severity = 'highly_unusual' | 'unusual' | 'slightly_unusual'

        const rank: Record<Severity, number> = {
            highly_unusual: 3,
            unusual: 2,
            slightly_unusual: 1,
        }

        const map = new Map<string, { memberId: string; memberName: string; totalTime: number; severity: Severity }>()

        for (const a of filteredActivities) {
            const current = map.get(a.memberId)
            if (!current) {
                map.set(a.memberId, {
                    memberId: a.memberId,
                    memberName: a.memberName,
                    totalTime: a.duration,
                    severity: a.severity as Severity,
                })
            } else {
                current.totalTime += a.duration
                if (rank[a.severity as Severity] > rank[current.severity]) {
                    current.severity = a.severity as Severity
                }
            }
        }

        return Array.from(map.values()).sort((a, b) => b.totalTime - a.totalTime)
    }, [filteredActivities])

    // Format time helper
    const formatTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}:${mins.toString().padStart(2, '0')}`
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header full-width */}
            <div className="border-b border-gray-200">
                <div className="px-6 py-4">
                    <InsightsHeader
                        selectedFilter={selectedFilter}
                        onSelectedFilterChange={setSelectedFilter}
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                        members={DUMMY_MEMBERS}
                        teams={DUMMY_TEAMS}
                        sidebarOpen={sidebarOpen}
                        onToggleSidebar={() => setSidebarOpen(o => !o)}
                        timezone="Asia/Jakarta"
                    />
                </div>
            </div>

            {/* Layout 2 kolom di bawah header */}
            <div className="flex">
                {/* Konten kiri */}
                <div className="flex-1 min-w-0 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-xl font-semibold mb-5">Unusual activity</h1>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-900 border border-zinc-200 hover:bg-zinc-50 rounded-md">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                About unusual activity
                            </button>
                            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-900 border border-zinc-200 hover:bg-zinc-50 rounded-md">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Smart notifications
                            </button>
                            <button className="p-1.5 hover:bg-gray-100 rounded-md">
                                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            </button>
                            <button className="p-1.5 hover:bg-gray-100 rounded-md">
                                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-2 mb-6">
                        <button
                            onClick={() => toggleFilter('highlyUnusual')}
                            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${activityFilters.highlyUnusual
                                ? 'bg-red-50 border-red-500 text-red-700'
                                : 'bg-gray-50 border-gray-300 text-gray-500'
                                }`}
                        >
                            Highly unusual ({stats.bySeverity.highly_unusual})
                        </button>
                        <button
                            onClick={() => toggleFilter('unusual')}
                            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${activityFilters.unusual
                                ? 'bg-orange-50 border-orange-500 text-orange-700'
                                : 'bg-gray-50 border-gray-300 text-gray-500'
                                }`}
                        >
                            Unusual ({stats.bySeverity.unusual})
                        </button>
                        <button
                            onClick={() => toggleFilter('slightlyUnusual')}
                            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${activityFilters.slightlyUnusual
                                ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                                : 'bg-gray-50 border-gray-300 text-gray-500'
                                }`}
                        >
                            Slightly unusual ({stats.bySeverity.slightly_unusual})
                        </button>
                    </div>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="text-3xl font-bold text-gray-900">{stats.memberCount}</div>
                            <div className="text-sm text-gray-500 mt-1">Members</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="text-3xl font-bold text-gray-900">{stats.instanceCount}</div>
                            <div className="text-sm text-gray-500 mt-1">Instances</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="text-3xl font-bold text-gray-900">{formatTime(stats.totalTime)}</div>
                            <div className="text-sm text-gray-500 mt-1">Total time (h:m)</div>
                        </div>
                    </div>

                    {/* Members with unusual activity (table) */}
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-gray-700">Members with unusual activity</h2>
                            <button className="text-sm text-zinc-900 font-medium hover:underline">Export report</button>
                        </div>

                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full table-fixed">
                                <thead className="bg-gray-50">
                                    <tr className="text-xs text-gray-500">
                                        <th scope="col" className="text-left px-4 py-3 font-medium">Member</th>
                                        <th scope="col" className="text-right px-4 py-3 font-medium w-36">Total time</th>
                                        <th scope="col" className="text-right px-4 py-3 font-medium w-40">Previous 60 days</th>
                                        <th scope="col" className="text-left px-4 py-3 font-medium w-56">Activity classification</th>
                                        <th scope="col" className="px-4 py-3 w-24"></th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-200">
                                    {membersSummary.length > 0 ? (
                                        membersSummary.map((row) => {
                                            const severityBadge: Record<typeof row.severity, string> = {
                                                highly_unusual: 'bg-red-100 text-red-700',
                                                unusual: 'bg-orange-100 text-orange-700',
                                                slightly_unusual: 'bg-yellow-100 text-yellow-700',
                                            }

                                            return (
                                                <tr key={row.memberId} className="align-middle">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarFallback className="text-xs bg-zinc-100 text-zinc-900 font-semibold">{initialsFromName(row.memberName)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="font-medium text-gray-900">{row.memberName}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-700">
                                                        {formatTime(row.totalTime)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-400">
                                                        —
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 text-xs rounded ${severityBadge[row.severity]}`}>
                                                            {row.severity.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50">View</button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                                                No members with unusual activity
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar kanan (otomatis mulai di bawah header) */}
                <InsightsRightSidebar
                    open={sidebarOpen}
                    onOpenChange={setSidebarOpen}
                    members={DUMMY_MEMBERS}
                />
            </div>
        </div>
    )
}
