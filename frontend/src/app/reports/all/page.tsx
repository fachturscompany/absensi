"use client"

import React, { useState } from "react"

import { ReportCard } from "@/components/report/report-card"
import { Input } from "@/components/ui/input"
import { Search, DollarSign, Activity, BarChart3, StarOff, Trash2 } from "lucide-react"
import { DUMMY_CUSTOM_REPORTS } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Define Report Types
type ReportSection = {
    title: string
    items: {
        title: string
        description: string
        href: string
        isPopular?: boolean
        icon?: React.ReactNode
        isStarred?: boolean
    }[]
}

export default function AllReportsPage() {
    const [searchTerm, setSearchTerm] = useState("")

    // Define Report Data
    const reportSections: ReportSection[] = [
        {
            title: "Popular reports",
            items: [
                {
                    title: "Time & activity",
                    description: "See team members' time worked, activity levels, and amounts earned per project or to-do",
                    href: "/reports/time-activity",
                    isPopular: true,
                    isStarred: true,
                    icon: <div className="p-3 bg-gray-100 rounded-lg"><Activity className="w-8 h-8 text-gray-600" /></div>
                },
                {
                    title: "Amounts owed",
                    description: "See how much the hourly paid team members are currently owed",
                    href: "/reports/amounts-owed",
                    isPopular: true,
                    isStarred: true,
                    icon: <div className="p-3 bg-green-100 rounded-lg"><DollarSign className="w-8 h-8 text-green-600" /></div>
                },
                {
                    title: "Daily totals",
                    description: "See team members' time worked, activity levels, and amount earned per days",
                    href: "/reports/daily-totals",
                    isPopular: true,
                    isStarred: true,
                    icon: <div className="p-3 bg-purple-100 rounded-lg"><BarChart3 className="w-8 h-8 text-purple-600" /></div>
                }
            ]
        },
        {
            title: "General",
            items: [
                {
                    title: "Work sessions",
                    description: "See the start and stop times for team members",
                    href: "/reports/work-sessions"
                },
                {
                    title: "Apps & URLs",
                    description: "See team members' apps used and URLs visited while working",
                    href: "/reports/apps-urls"
                },
                {
                    title: "Manual time edits",
                    description: "See team members' time worked, project, to-do, and reason for each manual time entry",
                    href: "/reports/manual-time-edits"
                },
                {
                    title: "Timesheet approvals",
                    description: "See team member's timesheets and their status",
                    href: "/reports/timesheet-approvals"
                },
                {
                    title: "Expenses",
                    description: "See how much has been spent on expenses by member and project",
                    href: "/reports/expenses"
                },
                {
                    title: "Breaks",
                    description: "See how many work breaks team members are taking",
                    href: "/reports/work-breaks"
                },
                {
                    title: "Audit log",
                    description: "See who changed what, when, and how (HS People add-on)",
                    href: "/reports/audit-log"
                }
            ]
        },
        {
            title: "Payment",
            items: [
                {
                    title: "Payments",
                    description: "See how much team members were paid over a given period",
                    href: "/reports/payments",
                    isStarred: true
                }
            ]
        },
        {
            title: "Budgets and limits",
            items: [
                { title: "Weekly limits", description: "See team members' weekly limits usage", href: "/reports/weekly-limits" },
                { title: "Daily limits", description: "See team members' daily limits usage", href: "/reports/daily-limits" },
                { title: "Project budgets", description: "See how much of your projects' budgets have been spent", href: "/reports/project-budgets" },
                { title: "Client budgets", description: "See how much of your clients' budgets have been spent", href: "/reports/client-budgets" }
            ]
        },
        {
            title: "Time off",
            items: [
                { title: "Time off balances", description: "See your team's time off balances across the organization's time off policies", href: "/reports/time-off-balances" },
                { title: "Time off transactions", description: "See your team's time off transactions across the organization's time off policies", href: "/reports/time-off-transactions" }
            ]
        },
        {
            title: "Invoice",
            items: [
                { title: "Client invoices", description: "See client invoice totals, paid, and due amounts", href: "/reports/client-invoices" },
                { title: "Team invoices", description: "See team member invoice totals, paid, and due amounts", href: "/reports/team-invoices" },
                { title: "Client invoices aging", description: "See outstanding and past due client invoices", href: "/reports/client-invoices-aging" },
                { title: "Team invoices aging", description: "See outstanding and past due team member invoices", href: "/reports/team-invoices-aging" }
            ]
        },
        {
            title: "Schedule",
            items: [
                { title: "Shift attendance", description: "See team members' completed, late, abandoned, and missed shifts", href: "/reports/shift-attendance" },
            ]
        },
        {
            title: "Job sites",
            items: [
                { title: "Visits", description: "See when your team members' entered and left a job site", href: "/reports/visits" }
            ]
        }
    ]

    // Filter Logic
    const filteredSections = reportSections.map(section => ({
        ...section,
        items: section.items.filter(item =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(section => section.items.length > 0)

    return (
        <div className="w-full flex flex-1 flex-col gap-10 p-6 pt-2 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="w-full flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-200">Reports</h1>
                <div className="relative w-[300px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Search reports"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="ps-10 pl-10 border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-gray-950 shadow-sm focus:border-gray-500 transition-all dark:text-gray-200 dark:placeholder:text-gray-500"
                        suppressHydrationWarning
                    />
                </div>
            </div>

            {/* Customized Reports Section - Only show if no search term */}
            {!searchTerm && <FeaturedReportsSection />}


            {/* Main Reports Grid */}
            <div className="space-y-16 pb-16">
                {filteredSections.map((section, idx) => (
                    <section key={idx} className="space-y-6">
                        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{section.title}</h2>

                        <div className={cn(
                            "grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        )}>
                            {section.items.map((item, i) => (
                                <ReportCard
                                    key={i}
                                    title={item.title}
                                    description={item.description}
                                    href={item.href}
                                    hideStar
                                />

                            ))}
                        </div>
                    </section>
                ))}

                {filteredSections.length === 0 && (
                    <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                        <Search className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No reports found</h3>
                        <p>Try adjusting your search terms</p>
                    </div>
                )}
            </div>
        </div>
    )
}

function FeaturedReportsSection() {
    // Featured Reports Logic
    const [featuredReportIds, setFeaturedReportIds] = useState<string[]>([])
    const [mounted, setMounted] = useState(false)

    // Load featured IDs from localStorage on mount
    React.useEffect(() => {
        setMounted(true)
        const stored = localStorage.getItem("featured_report_ids")
        if (stored) {
            try {
                setFeaturedReportIds(JSON.parse(stored))
            } catch (e) {
                console.error("Failed to parse featured reports", e)
            }
        } else {
            // Default: Show first 2 if none set
            setFeaturedReportIds(DUMMY_CUSTOM_REPORTS.slice(0, 2).map(r => r.id))
        }
    }, [])

    if (!mounted) return null // Prevent hydration mismatch by not rendering until client-side

    const customizedReports = DUMMY_CUSTOM_REPORTS.filter(r => featuredReportIds.includes(r.id))

    // Keep section visible even when no customized reports

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Customized reports</h2>
                <a href="/reports/custom" className="text-sm font-medium text-gray-900 hover:text-blue-800 hover:underline">
                    View all &rarr;
                </a>
            </div>

            {/* Customized Report Cards */}
            {customizedReports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customizedReports.map((report) => (
                        <div key={report.id} className="group flex items-center justify-between p-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer">
                            <div className="flex flex-col gap-1">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">{report.name}</h3>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                    {report.type}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-yellow-500"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        const newIds = featuredReportIds.filter(id => id !== report.id)
                                        setFeaturedReportIds(newIds)
                                        localStorage.setItem("featured_report_ids", JSON.stringify(newIds))
                                        toast.success("Removed from dashboard")
                                    }}
                                    title="Unfavorite (Remove from dashboard)"
                                >
                                    <StarOff className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        // For demo: Remove from featured view AND show toast
                                        const newIds = featuredReportIds.filter(id => id !== report.id)
                                        setFeaturedReportIds(newIds)
                                        localStorage.setItem("featured_report_ids", JSON.stringify(newIds))
                                        toast.success("Report moved to trash")
                                    }}
                                    title="Move to trash"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="w-full rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 p-6 text-center text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No customized reports yet.</p>
                </div>
            )}
        </section>
    )
}


