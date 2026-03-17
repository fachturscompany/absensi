"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { useTimezone } from "@/components/providers/timezone-provider"
import { exportToCSV, generateFilename, type ExportColumn } from "@/lib/export-utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { getAppsReportData, getUrlsReportData, ReportQueryParams } from "@/action/reports-activity"
import { getAllOrganization_member } from "@/action/members"
import { useOrgStore } from "@/store/org-store"

export const dynamic = 'force-dynamic'

export default function AppsUrlsPage() {
    const timezone = useTimezone()
    const storeOrgId = useOrgStore((s) => s.organizationId)
    const organizationId = storeOrgId ? String(storeOrgId) : null

    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of month
        endDate: new Date()
    })
    const [activeTab, setActiveTab] = useState<'apps' | 'urls'>('apps')
    const [page, setPage] = useState(1)
    const pageSize = 10

    // Dynamic Data State
    const [appsData, setAppsData] = useState<any[]>([])
    const [urlsData, setUrlsData] = useState<any[]>([])
    const [members, setMembers] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // 1. Fetch Members for filter (re-runs when organizationId changes)
    useEffect(() => {
        async function fetchMembers() {
            if (!organizationId) return
            const res = await getAllOrganization_member(Number(organizationId))
            if (res.success && res.data) {
                const mappedMembers = res.data.map((m: any) => ({
                    id: String(m.id),
                    name: m.user
                        ? `${m.user.first_name || ''} ${m.user.last_name || ''}`.trim() || m.user.display_name
                        : `Member #${m.id}`
                }))
                setMembers(mappedMembers)
            }
        }
        fetchMembers()
    }, [organizationId])

    // 2. Main Data Loader
    const loadData = useCallback(async () => {
        if (!organizationId) {
            setIsLoading(false)
            return
        }

        setIsLoading(true)

        const params: ReportQueryParams = {
            organizationId: organizationId as string,
            memberId: selectedFilter.id,
            startDate: dateRange.startDate ? format(dateRange.startDate, 'yyyy-MM-dd') : undefined,
            endDate: dateRange.endDate ? format(dateRange.endDate, 'yyyy-MM-dd') : undefined
        }

        try {
            const [appsRes, urlsRes] = await Promise.all([
                getAppsReportData(params),
                getUrlsReportData(params)
            ])

            if (appsRes.success) setAppsData(appsRes.data || [])
            if (urlsRes.success) setUrlsData(urlsRes.data || [])

        } catch (err: any) {
            toast.error("Failed to load report data")
        } finally {
            setIsLoading(false)
        }
    }, [organizationId, selectedFilter.id, dateRange.startDate, dateRange.endDate])

    // Load data when triggers change
    useEffect(() => {
        loadData()
    }, [loadData])

    // Summary calculations
    const appsSummary = useMemo(() => {
        const totalTime = appsData.reduce((sum, app) => sum + (app.timeSpent || 0), 0)
        const uniqueApps = new Set(appsData.map(a => a.name)).size
        return { totalTime, uniqueApps }
    }, [appsData])

    const urlsSummary = useMemo(() => {
        const totalTime = urlsData.reduce((sum, url) => sum + (url.timeSpent || 0), 0)
        const uniqueSites = new Set(urlsData.map(u => u.site)).size
        return { totalTime, uniqueSites }
    }, [urlsData])

    const formatMinutes = (mins: number) => {
        const hours = Math.floor(mins / 60)
        const minutes = Math.floor(mins % 60)
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    }

    const currentData = activeTab === 'apps' ? appsData : urlsData
    const paginatedData = currentData.slice((page - 1) * pageSize, page * pageSize)
    const totalPages = Math.ceil(currentData.length / pageSize)

    const handleExport = () => {
        if (activeTab === 'apps') {
            const columns: ExportColumn[] = [
                { label: 'Application', key: 'name' },
                { label: 'Category', key: 'category' },
                { label: 'Project', key: 'projectName' },
                { label: 'Member', key: 'memberName' },
                { label: 'Date', key: 'date' },
                {
                    label: 'Time Spent',
                    key: 'timeSpent',
                    format: (value: any) => formatMinutes(value as number)
                }
            ]
            const filename = generateFilename('apps-activity')
            exportToCSV({ data: appsData, columns, filename })
            toast.success('Apps data exported successfully')
        } else {
            const columns: ExportColumn[] = [
                { label: 'Website', key: 'site' },
                { label: 'Project', key: 'projectName' },
                { label: 'Member', key: 'memberName' },
                { label: 'Date', key: 'date' },
                {
                    label: 'Time Spent',
                    key: 'timeSpent',
                    format: (value: any) => formatMinutes(value as number)
                }
            ]
            const filename = generateFilename('urls-activity')
            exportToCSV({ data: urlsData, columns, filename })
            toast.success('URLs data exported successfully')
        }
    }

    return (
        <div className="px-6 py-4">
            <h1 className="text-xl font-semibold mb-5">Apps & URLs Report</h1>

            <InsightsHeader
                selectedFilter={selectedFilter}
                onSelectedFilterChange={setSelectedFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                members={members}
                teams={[]}
                hideTeamsTab={true}
                timezone={timezone}
            >
                <Button variant="outline" className="h-9" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </Button>
            </InsightsHeader>



            <div className="mt-6">
                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'apps' | 'urls'); setPage(1); }}>
                    <div className="px-4 py-4">
                        <TabsList className="grid w-[300px] grid-cols-2">
                            <TabsTrigger value="apps">Applications</TabsTrigger>
                            <TabsTrigger value="urls">Websites</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                        <div className="p-4">
                            <p className="text-sm font-medium text-gray-500">Total Time Spent</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatMinutes(activeTab === 'apps' ? appsSummary.totalTime : urlsSummary.totalTime)}
                            </p>
                        </div>
                        <div className="p-4">
                            <p className="text-sm font-medium text-gray-500">
                                Unique {activeTab === 'apps' ? 'Applications' : 'Sites'}
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {activeTab === 'apps' ? appsSummary.uniqueApps : urlsSummary.uniqueSites}
                            </p>
                        </div>
                        <div className="p-4">
                            <p className="text-sm font-medium text-gray-500">Records</p>
                            <p className="text-2xl font-bold text-gray-900">{currentData.length}</p>
                        </div>
                    </div>

                    <TabsContent value="apps" className="m-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-medium border-t border-b border-gray-200 dark:border-gray-800">
                                    <tr>
                                        <th className="p-4">Application</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Project</th>
                                        <th className="p-4">Member</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4 text-right">Time Spent</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {paginatedData.map((app, idx) => (
                                        <tr
                                            key={`${app.memberId}-${app.name}-${app.id}-${idx}`}
                                            className={`transition-colors hover:bg-gray-300 ${idx % 2 === 1 ? 'bg-slate-100' : 'bg-white'}`}
                                        >
                                            <td className="p-4 font-medium text-gray-900">{app.name}</td>
                                            <td className="p-4">
                                                <span className={`p-4 text-gray-600 ${app.isProductive} ? `}>
                                                    {app.category}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600">{app.projectName}</td>
                                            <td className="p-4 text-gray-600">{app.memberName}</td>
                                            <td className="p-4 text-gray-600">{app.date}</td>
                                            <td className="p-4 text-right font-medium">{formatMinutes(app.timeSpent)}</td>
                                            <td className="p-4 text-right text-gray-600">

                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedData.length === 0 && !isLoading && (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-gray-500">
                                                No activity data found
                                            </td>
                                        </tr>
                                    )}
                                    {isLoading && (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-gray-900 animate-pulse font-medium">
                                                Loading application data...
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>

                    <TabsContent value="urls" className="m-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-medium border-t border-b border-gray-200 dark:border-gray-800">
                                    <tr>
                                        <th className="p-4">Website</th>
                                        <th className="p-4">Project</th>
                                        <th className="p-4">Member</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4 text-right">Time Spent</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {paginatedData.map((url, idx) => (
                                        <tr
                                            key={`${url.id}-${idx}`}
                                            className={`transition-colors hover:bg-gray-300 ${idx % 2 === 1 ? 'bg-slate-100' : 'bg-white'}`}
                                        >
                                            <td className="p-4 font-medium text-gray-900" title={url.title}>{url.site}</td>
                                            <td className="p-4 text-gray-600">{url.projectName}</td>
                                            <td className="p-4 text-gray-600">{url.memberName}</td>
                                            <td className="p-4 text-gray-600">{url.date}</td>
                                            <td className="p-4 text-right font-medium">{formatMinutes(url.timeSpent)}</td>
                                        </tr>
                                    ))}
                                    {paginatedData.length === 0 && !isLoading && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500">
                                                No website activity data found
                                            </td>
                                        </tr>
                                    )}
                                    {isLoading && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-900 animate-pulse font-medium">
                                                Loading website data...
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Pagination */}
            <div className="mt-4">
                <PaginationFooter
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    from={currentData.length > 0 ? (page - 1) * pageSize + 1 : 0}
                    to={Math.min(page * pageSize, currentData.length)}
                    total={currentData.length}
                    pageSize={pageSize}
                    onPageSizeChange={() => { }}
                    className="bg-transparent shadow-none border-none p-0"
                />
            </div>
        </div>
    )
}
