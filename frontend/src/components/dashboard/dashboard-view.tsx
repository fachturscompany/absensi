"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { ArrowRight, ChevronDown, Users, UserCheck, Clock, FileText, Calendar, Activity, BarChart3, Briefcase, MoreVertical, Info } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useDashboardStore } from "@/store/dashboard-store";
import { ManageWidgets } from "@/components/dashboard/manage-widgets";
import { useEffect, useRef, useState } from "react";

const DashboardMap = dynamic(() => import("@/components/dashboard/map-section"), {
    ssr: false,
    loading: () => <div className="w-full h-[500px] bg-muted/10 rounded-lg animate-pulse flex items-center justify-center text-muted-foreground">Loading Map...</div>,
})

// Dummy Data for Activity Table
const activityData = Array(5).fill({
    name: "Diah",
    division: "Design",
    position: "Owner",
    activity: "Absen Masuk (08 : 05 : 21)",
})

// Dummy Data for Staff Status Chart
const staffStatusData = [
    { name: "Staff Tetap", value: 10, color: "#00C49F" },    // Green
    { name: "Staff Kontrak", value: 3, color: "#FFBB28" },   // Orange/Yellow
    { name: "Staff Magang", value: 2, color: "#A78BFA" },    // Purple
]

// Dummy Data for Pending Requests
const pendingRequests = [
    { name: "Budi Santoso", type: "Cuti Tahunan", date: "15 Jan 2026", status: "Pending" },
    { name: "Siti Aminah", type: "Izin Sakit", date: "14 Jan 2026", status: "Pending" },
    { name: "Rudi Hermawan", type: "Lembur", date: "14 Jan 2026", status: "Pending" },
]

// Large Widgets (dummy)
type LateMissedItem = { name: string; shift: string; issue: string; lateBy?: string; missed?: boolean }
const lateMissedShifts: LateMissedItem[] = [
    { name: "Anisa Putri", shift: "15 Jan, 08:00–17:00", issue: "Late", lateBy: "15m" },
    { name: "Bagus Wibowo", shift: "15 Jan, 08:00–17:00", issue: "Missed", missed: true },
    { name: "Citra Lestari", shift: "15 Jan, 08:00–17:00", issue: "Late", lateBy: "7m" },
]

type ManualTimeItem = { name: string; date: string; change: string; note: string }
const manualTime: ManualTimeItem[] = [
    { name: "Dimas Pratama", date: "15 Jan", change: "+0:30", note: "Add meeting" },
    { name: "Eka Sari", date: "15 Jan", change: "-0:10", note: "Trim break" },
]



type TimeOffBalance = { policy: string; balance: string; used: string }
const timeOffBalances: TimeOffBalance[] = [
    { policy: "Cuti Tahunan", balance: "8d", used: "4d" },
    { policy: "Sakit", balance: "Unlimited", used: "2d" },
]

type TimeOffRequest = { name: string; policy: string; range: string; status: "Pending" | "Approved" | "Rejected" }
const timeOffRequested: TimeOffRequest[] = [
    { name: "Farhan Akbar", policy: "Cuti Tahunan", range: "20–22 Jan", status: "Pending" },
    { name: "Gita Puspa", policy: "Sakit", range: "15 Jan", status: "Pending" },
]

type TimesheetRow = { name: string; start: string; stop: string; total: string }
const timesheetRows: TimesheetRow[] = [
    { name: "Hasan Basri", start: "08:05", stop: "17:15", total: "8h 40m" },
    { name: "Ika Nirmala", start: "08:20", stop: "17:00", total: "8h 10m" },
]

type TodoItem = { title: string; assignee: string; due: string; status: "Open" | "Done" }
const todos: TodoItem[] = [
    { title: "Lengkapi profil karyawan baru", assignee: "HR", due: "16 Jan", status: "Open" },
    { title: "Review kebijakan lembur", assignee: "Admin", due: "18 Jan", status: "Open" },
]

type ProjectActivity = { project: string; hours: string; tasks: number }
const currentProjectActivity: ProjectActivity[] = [
    { project: "Website Revamp", hours: "12h", tasks: 6 },
    { project: "Mobile App", hours: "7h", tasks: 3 },
]

interface DashboardViewProps {
    initialView: 'all' | 'me'
}

export default function DashboardView({ initialView }: DashboardViewProps) {
    const router = useRouter()
    const view = initialView

    // Get today's date in Indonesian format
    const today = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    })

    const totalStaff = 10000
    const { visibleWidgets } = useDashboardStore();
    const [hydrated, setHydrated] = useState(false);
    const addButtonRef = useRef<HTMLButtonElement | null>(null)
    const addMenuRef = useRef<HTMLDivElement | null>(null)
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)

    // Prevent hydration mismatch for persisted store
    useEffect(() => {
        setHydrated(true);
    }, []);

    // Handle view change
    const handleViewChange = (newView: string) => {
        if (newView === 'me') {
            router.push('/attendance/dashboard/me')
        } else {
            router.push('/attendance/dashboard/team')
        }
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isAddMenuOpen &&
                !addMenuRef.current?.contains(event.target as Node) &&
                !addButtonRef.current?.contains(event.target as Node)
            ) {
                setIsAddMenuOpen(false)
            }
        }
        window.addEventListener("click", handleClickOutside)
        return () => window.removeEventListener("click", handleClickOutside)
    }, [isAddMenuOpen])

    if (!hydrated) {
        return <div className="p-6">Loading dashboard preferences...</div>
    }

    return (
        <div className="p-4 md:p-6 space-y-6 w-full bg-muted/10 min-h-screen">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <Tabs value={view} onValueChange={handleViewChange} className="w-auto">
                        <TabsList className="grid w-[200px] grid-cols-2">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="me">Me</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <div className="flex items-center gap-3 relative">
                    <ManageWidgets />
                    <div className="relative">
                        <Button
                            ref={addButtonRef}
                            className="rounded-full bg-blue-500 px-4 py-2 text-white shadow-lg hover:bg-blue-600 focus-visible:ring focus-visible:ring-blue-200 flex items-center gap-2"
                            onClick={() => setIsAddMenuOpen((prev) => !prev)}
                        >
                            <span className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4" />
                                Add
                            </span>
                        </Button>
                        {isAddMenuOpen && (
                            <div
                                ref={addMenuRef}
                                className="absolute right-0 z-20 mt-2 w-44 rounded-md border border-border bg-white shadow-lg"
                            >
                                <button className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-muted/50">
                                    Add to-do
                                </button>
                                <button className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-muted/50">
                                    Add global to-do
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Summary Cards */}
            {/* Top Summary Cards (Stats) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {visibleWidgets.summary_total_staff && view === 'all' && (
                    <Card className="shadow-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Total Pegawai</p>
                                <h3 className="text-2xl font-bold">156</h3>
                            </div>
                            <div className="p-3 rounded-full text-blue-600 bg-blue-100">
                                <Users className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                )}
                {visibleWidgets.summary_present && (
                    <Card className="shadow-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">
                                    {view === 'me' ? 'Status Saya' : 'Hadir'}
                                </p>
                                <h3 className="text-2xl font-bold">
                                    {view === 'me' ? 'Hadir' : '142'}
                                </h3>
                            </div>
                            <div className="p-3 rounded-full text-green-600 bg-green-100">
                                <UserCheck className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                )}
                {visibleWidgets.summary_late && view === 'all' && (
                    <Card className="shadow-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Terlambat</p>
                                <h3 className="text-2xl font-bold">8</h3>
                            </div>
                            <div className="p-3 rounded-full text-orange-600 bg-orange-100">
                                <Clock className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                )}
                {visibleWidgets.summary_permission && view === 'all' && (
                    <Card className="shadow-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Izin / Sakit</p>
                                <h3 className="text-2xl font-bold">4</h3>
                            </div>
                            <div className="p-3 rounded-full text-purple-600 bg-purple-100">
                                <FileText className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {visibleWidgets.earned_week && <Card className="shadow-sm"><CardContent className="p-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Earned this week</p><h3 className="text-2xl font-bold">Rp 3.450.000</h3></div><div className="p-3 rounded-full bg-blue-100 text-blue-600"><BarChart3 className="w-6 h-6" /></div></CardContent></Card>}
                {visibleWidgets.earned_today && <Card className="shadow-sm"><CardContent className="p-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Earned today</p><h3 className="text-2xl font-bold">Rp 550.000</h3></div><div className="p-3 rounded-full bg-blue-100 text-blue-600"><BarChart3 className="w-6 h-6" /></div></CardContent></Card>}
                {visibleWidgets.worked_week && <Card className="shadow-sm"><CardContent className="p-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Worked this week</p><h3 className="text-2xl font-bold">38h 25m</h3></div><div className="p-3 rounded-full bg-emerald-100 text-emerald-600"><Clock className="w-6 h-6" /></div></CardContent></Card>}
                {visibleWidgets.worked_today && <Card className="shadow-sm"><CardContent className="p-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Worked today</p><h3 className="text-2xl font-bold">6h 40m</h3></div><div className="p-3 rounded-full bg-emerald-100 text-emerald-600"><Clock className="w-6 h-6" /></div></CardContent></Card>}
                {visibleWidgets.projects_worked && <Card className="shadow-sm"><CardContent className="p-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Projects worked</p><h3 className="text-2xl font-bold">5</h3></div><div className="p-3 rounded-full bg-purple-100 text-purple-600"><Briefcase className="w-6 h-6" /></div></CardContent></Card>}
                {visibleWidgets.activity_today && <Card className="shadow-sm"><CardContent className="p-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Today&apos;s activity</p><h3 className="text-2xl font-bold">Normal</h3></div><div className="p-3 rounded-full bg-cyan-100 text-cyan-600"><Activity className="w-6 h-6" /></div></CardContent></Card>}
                {visibleWidgets.activity_week && <Card className="shadow-sm"><CardContent className="p-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Weekly activity</p><h3 className="text-2xl font-bold">↑ 12%</h3></div><div className="p-3 rounded-full bg-cyan-100 text-cyan-600"><Activity className="w-6 h-6" /></div></CardContent></Card>}
            </div>

            {/* Map Section */}
            {visibleWidgets.map && (
                <div className="w-full">
                    <DashboardMap />
                </div>
            )}

            {/* Weekly Metrics Section - Only show for 'all' view */}
            {view === 'all' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Weekly Activity */}
                    <Card className="shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">WEEKLY ACTIVITY</span>
                                    <Info className="w-3 h-3 text-muted-foreground" />
                                </div>
                                <button className="text-muted-foreground hover:text-foreground">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0">
                                    <h3 className="text-3xl font-bold">57%</h3>
                                    <div className="flex items-center gap-2 text-sm mt-1">
                                        <span className="text-emerald-600">▲ 1%</span>
                                    </div>
                                </div>
                                <div className="flex-1 h-16">
                                    <svg width="100%" height="64" viewBox="0 0 120 48" preserveAspectRatio="none" className="overflow-visible">
                                        <path
                                            d="M 0,35 L 20,15 L 40,35 L 120,35"
                                            fill="none"
                                            stroke="#a78bfa"
                                            strokeWidth="2"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Worked This Week */}
                    <Card className="shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <span className="text-sm text-muted-foreground">WORKED THIS WEEK</span>
                                <button className="text-muted-foreground hover:text-foreground">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0">
                                    <h3 className="text-3xl font-bold">4:56:48</h3>
                                    <div className="flex items-center gap-2 text-sm mt-1">
                                        <span className="text-emerald-600">▲ 4:56:48</span>
                                    </div>
                                </div>
                                <div className="flex-1 h-16">
                                    <svg width="100%" height="64" viewBox="0 0 120 48" preserveAspectRatio="none" className="overflow-visible">
                                        <path
                                            d="M 0,40 L 25,12 L 50,40 L 120,40"
                                            fill="none"
                                            stroke="#7dd3fc"
                                            strokeWidth="2"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Spent This Week */}
                    <Card className="shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">SPENT THIS WEEK</span>
                                    <Info className="w-3 h-3 text-muted-foreground" />
                                </div>
                                <button className="text-muted-foreground hover:text-foreground">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0">
                                    <h3 className="text-3xl font-bold">$237.44</h3>
                                    <div className="flex items-center gap-2 text-sm mt-1">
                                        <span className="text-emerald-600">▲ $237.44</span>
                                    </div>
                                </div>
                                <div className="flex-1 h-16">
                                    <svg width="100%" height="64" viewBox="0 0 120 48" preserveAspectRatio="none" className="overflow-visible">
                                        <path
                                            d="M 0,38 L 22,10 L 45,38 L 120,38"
                                            fill="none"
                                            stroke="#a78bfa"
                                            strokeWidth="2"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Projects Worked */}
                    <Card className="shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <span className="text-sm text-muted-foreground">PROJECTS WORKED</span>
                                <button className="text-muted-foreground hover:text-foreground">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0">
                                    <h3 className="text-3xl font-bold">1</h3>
                                    <div className="flex items-center gap-2 text-sm mt-1">
                                        <span className="text-muted-foreground">—</span>
                                    </div>
                                </div>
                                <div className="flex-1 h-16">
                                    <svg width="100%" height="64" viewBox="0 0 120 48" preserveAspectRatio="none" className="overflow-visible">
                                        <path
                                            d="M 0,42 L 18,18 L 36,42 L 120,42"
                                            fill="none"
                                            stroke="#7dd3fc"
                                            strokeWidth="2"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Recent Activity + Activity Table */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    {/* Recent Activity Widget - Only for 'all' view */}
                    {view === 'all' && (
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-blue-500" />
                                    Recent Activity
                                </CardTitle>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-sm ring-2 ring-blue-100">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">Radhitya Wicaksono</p>
                                            <p className="text-xs text-muted-foreground">Software Engineer</p>
                                        </div>
                                    </div>
                                    <Link href="#" className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 font-medium transition-colors">
                                        View all <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Screenshot 1 */}
                                    <div className="relative aspect-video bg-[#1e293b] rounded-lg overflow-hidden border shadow-sm group cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all">
                                        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm">
                                            18%
                                        </div>
                                        <Image
                                            src="/images/dashboard/activity-1.png"
                                            alt="Activity Screenshot 1"
                                            fill
                                            unoptimized
                                            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                    </div>

                                    {/* Screenshot 2 */}
                                    <div className="relative aspect-video bg-[#0f172a] rounded-lg overflow-hidden border shadow-sm group cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all">
                                        <div className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm">
                                            60%
                                        </div>
                                        <Image
                                            src="/images/dashboard/activity-2.png"
                                            alt="Activity Screenshot 2"
                                            fill
                                            unoptimized
                                            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                    </div>

                                    {/* Screenshot 3 */}
                                    <div className="relative aspect-video bg-[#171717] rounded-lg overflow-hidden border shadow-sm group cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all">
                                        <div className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm">
                                            75%
                                        </div>
                                        <Image
                                            src="/images/dashboard/activity-3.png"
                                            alt="Activity Screenshot 3"
                                            fill
                                            unoptimized
                                            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Table Widget */}
                    {visibleWidgets.todays_activity_table && (
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-semibold">
                                            {view === 'me' ? 'Aktivitas Saya Hari Ini' : 'Aktivitas Hari Ini'}
                                        </h2>
                                        <Badge variant="outline" className="text-xs">
                                            {view === 'me' ? 'Saya' : 'Semua'}
                                        </Badge>
                                    </div>
                                    <p className="text-muted-foreground text-sm capitalize">{today}</p>
                                </div>
                                <Link href="/attendance/list">
                                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-2 h-8 text-xs">
                                        Lihat Riwayat Absensi
                                        <ArrowRight className="h-3 w-3" />
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="pt-0">

                                {/* Pagination Control - Only show for 'all' view */}
                                {view === 'all' && (
                                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                                        <span>Menampilkan</span>
                                        <div className="relative">
                                            <select
                                                className="appearance-none border rounded px-2 py-0.5 bg-background pr-6 focus:outline-none focus:ring-1 focus:ring-ring text-xs"
                                                defaultValue={10}
                                            >
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                            </select>
                                            <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 opacity-50 pointer-events-none" />
                                        </div>
                                        <span>Baris per halaman</span>
                                    </div>
                                )}

                                {/* Table */}
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                {view === 'all' && <TableHead className="font-semibold text-foreground h-8 py-1">Nama Staff</TableHead>}
                                                {view === 'all' && <TableHead className="font-semibold text-foreground h-8 py-1">Divisi</TableHead>}
                                                {view === 'all' && <TableHead className="font-semibold text-foreground h-8 py-1">Jabatan</TableHead>}
                                                <TableHead className="font-semibold text-foreground h-8 py-1">Aktivitas</TableHead>
                                                {view === 'me' && <TableHead className="font-semibold text-foreground h-8 py-1">Waktu</TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {view === 'all' ? (
                                                activityData.map((row, index) => (
                                                    <TableRow key={index} className="hover:bg-muted/50">
                                                        <TableCell className="py-2">{row.name}</TableCell>
                                                        <TableCell className="py-2">{row.division}</TableCell>
                                                        <TableCell className="py-2">{row.position}</TableCell>
                                                        <TableCell className="py-2">{row.activity}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                // Show only current user's activity when view = 'me'
                                                <>
                                                    <TableRow className="hover:bg-muted/50">
                                                        <TableCell className="py-2">Absen Masuk</TableCell>
                                                        <TableCell className="py-2">08:05:21</TableCell>
                                                    </TableRow>
                                                    <TableRow className="hover:bg-muted/50">
                                                        <TableCell className="py-2">Absen Keluar</TableCell>
                                                        <TableCell className="py-2">17:10:15</TableCell>
                                                    </TableRow>
                                                </>
                                            )}
                                            {/* Empty state padding if needed */}
                                            {((view === 'all' && activityData.length === 0) || (view === 'me' && false)) && (
                                                <TableRow>
                                                    <TableCell colSpan={view === 'all' ? 4 : 2} className="h-16 text-center py-2">
                                                        No activity found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* To-dos Widget moved here */}
                    {visibleWidgets.todos && (
                        <Card className="shadow-sm flex-1">
                            <CardHeader>
                                <CardTitle className="text-base">To-dos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {todos.map((t, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <div>
                                                <div className="font-medium">{t.title}</div>
                                                <div className="text-muted-foreground">{t.assignee} • Due {t.due}</div>
                                            </div>
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">{t.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Panel Wrapper: Insights Widget */}
                <div className="space-y-6 h-full">
                    <Card className="shadow-sm h-full flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Insights</CardTitle>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-0 flex-1 divide-y">
                            {/* Work time classification */}
                            <div className="pb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-sm font-medium text-muted-foreground">Work time classification</h3>
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="text-3xl font-bold">68%</div>
                                        <div className="text-sm text-muted-foreground">Core work</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            <span className="font-medium text-muted-foreground">68% Core work</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#A9A9A9' }}></div>
                                            <span className="font-medium text-muted-foreground">30% Non-core work</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                            <span className="font-medium text-muted-foreground">2% Unproductive</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Stacked Progress Bar */}
                                <div className="h-3 w-full rounded-full flex overflow-hidden mb-1">
                                    <div className="h-full bg-blue-500" style={{ width: '68%' }}></div>
                                    <div className="h-full" style={{ width: '30%', backgroundColor: '#A9A9A9' }}></div>
                                    <div className="h-full bg-orange-500" style={{ width: '2%' }}></div>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                    <span>0%</span>
                                    <span>25%</span>
                                    <span>50%</span>
                                    <span>75%</span>
                                    <span>100%</span>
                                </div>
                            </div>

                            {/* Activity */}
                            <div className="py-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-sm font-medium text-muted-foreground">Activity</h3>
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <div className="flex items-center justify-between relative h-24">
                                    <div className="absolute left-0 flex items-end h-full" style={{ bottom: 0, height: '100%', paddingBottom: 'calc(43% * 96px / 100)' }}>
                                        <div className="flex flex-col items-start">
                                            <div className="text-3xl font-bold">57%</div>
                                            <div className="text-sm text-muted-foreground">Average</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-auto">
                                        {/* Labels Left with Ticks */}
                                        <div className="text-[10px] text-muted-foreground flex flex-col justify-between h-24 py-0 text-right">
                                            <div className="flex items-center justify-end gap-1"><span>100%</span><div className="w-1.5 h-px bg-muted-foreground"></div></div>
                                            <div className="flex items-center justify-end gap-1"><span>75%</span><div className="w-1.5 h-px bg-muted-foreground"></div></div>
                                            <div className="flex items-center justify-end gap-1"><span>50%</span><div className="w-1.5 h-px bg-muted-foreground"></div></div>
                                            <div className="flex items-center justify-end gap-1"><span>25%</span><div className="w-1.5 h-px bg-muted-foreground"></div></div>
                                            <div className="flex items-center justify-end gap-1"><span>0%</span><div className="w-1.5 h-px bg-muted-foreground"></div></div>
                                        </div>

                                        {/* Segmented Bar */}
                                        <div className="h-24 w-8 rounded-md overflow-hidden relative flex flex-col">
                                            {/* Top Green 50% */}
                                            <div className="w-full" style={{ height: '50%', backgroundColor: '#10B981' }}></div>
                                            {/* Middle Orange 25% */}
                                            <div className="w-full" style={{ height: '25%', backgroundColor: '#F59E0B' }}></div>
                                            {/* Bottom Red 25% */}
                                            <div className="w-full" style={{ height: '25%', backgroundColor: '#EF4444' }}></div>

                                            {/* Marker Line */}
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 bg-[#1e293b] rounded-t-sm" style={{ height: '57%' }}></div>
                                        </div>
                                    </div>

                                    {/* Horizontal Indicator Line at 57% */}
                                    <div className="absolute left-0 right-0 h-px z-10" style={{ bottom: 'calc(57% * 96px / 100)', backgroundColor: '#64748b' }}></div>
                                </div>
                            </div>

                            {/* Top core work members */}
                            <div className="py-6">
                                <h3 className="text-sm font-medium text-muted-foreground mb-4">Top core work members</h3>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-200">
                                        68
                                    </div>
                                    <span className="text-sm font-medium">Radhitya Wicaksono</span>
                                </div>
                            </div>

                            {/* Low core work members */}
                            <div className="pt-6">
                                <h3 className="text-sm font-medium text-muted-foreground mb-4">Low core work members</h3>
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center mb-2">
                                        <FileText className="h-6 w-6 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-sm font-medium">No data</p>
                                    <p className="text-xs text-muted-foreground">There was no data registered in the time period selected</p>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Moved Widgets Section */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Staff Status Chart - Only show for 'all' view */}
                {visibleWidgets.staff_status_chart && view === 'all' && (
                    <Card className="shadow-sm h-fit">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold">Data Status Staff</CardTitle>
                                <Badge variant="secondary" className="bg-blue-500 text-white hover:bg-blue-600">
                                    Jml Staff : {totalStaff}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center">
                            {/* Donut Chart */}
                            <div className="h-[250px] w-full mt-4 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={staffStatusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={0}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {staffStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => [value, 'Staff']}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                {/* Center Text */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                    <div className="text-2xl font-bold">66.67%</div>
                                </div>
                            </div>

                            {/* Custom Legend */}
                            <div className="w-full space-y-3 mt-4 self-start pl-4">
                                <h4 className="font-semibold text-sm mb-2">Keterangan:</h4>
                                {staffStatusData.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded-sm"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="text-muted-foreground">{item.name}</span>
                                        </div>
                                        <span className="font-medium">:{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Permission Requests List - Only show for 'all' view */}
                {visibleWidgets.permission_requests && view === 'all' && (
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3 border-b mb-2">
                            <CardTitle className="text-base font-semibold flex items-center justify-between">
                                Daftar Pengajuan
                                <Badge variant="outline" className="text-xs font-normal">3 Pending</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {pendingRequests.map((req, idx) => (
                                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{req.name}</p>
                                            <p className="text-xs text-muted-foreground">{req.type}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full inline-block mb-1">
                                                {req.status}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                                                <Calendar className="w-3 h-3" />
                                                {req.date}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-3 border-t text-center">
                                <Button variant="ghost" size="sm" className="w-full text-xs text-blue-600 hover:text-blue-700 h-8">
                                    Lihat Semua Pengajuan
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* My Performance Card - Only show for 'me' view */}
                {view === 'me' && (
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3 border-b mb-2">
                            <CardTitle className="text-base font-semibold">Performance Saya</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Jam Kerja Hari Ini</span>
                                    <span className="font-semibold">8h 40m</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Jam Kerja Minggu Ini</span>
                                    <span className="font-semibold">38h 25m</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Kehadiran Bulan Ini</span>
                                    <span className="font-semibold">95%</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Keterlambatan</span>
                                    <span className="font-semibold text-orange-600">2 kali</span>
                                </div>
                            </div>
                            <div className="pt-2 border-t">
                                <Link href="/attendance/list">
                                    <Button variant="outline" size="sm" className="w-full text-xs text-blue-600 border-blue-200 hover:bg-blue-50">
                                        Lihat Detail
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
            {/* Widgets Section */}
            <div className="mt-8 space-y-6">
                {/* Large widgets */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Late & Missed Shifts */}
                    {visibleWidgets.late_missed_shifts && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Late & Missed Shifts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {lateMissedShifts.map((it, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <div>
                                                <div className="font-medium">{it.name}</div>
                                                <div className="text-muted-foreground">{it.shift}</div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant={it.missed ? "destructive" : "secondary"} className={it.missed ? "" : "bg-orange-100 text-orange-700"}>
                                                    {it.missed ? "Missed" : `Late ${it.lateBy ?? ""}`}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Manual Time */}
                    {visibleWidgets.manual_time && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Manual Time</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {manualTime.map((it, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <div>
                                                <div className="font-medium">{it.name}</div>
                                                <div className="text-muted-foreground">{it.date} • {it.note}</div>
                                            </div>
                                            <div className="font-medium">{it.change}</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}



                    {/* Time off balances */}
                    {visibleWidgets.time_off_balances && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Time off balances</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Policy</TableHead>
                                            <TableHead>Balance</TableHead>
                                            <TableHead>Used</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {timeOffBalances.map((b, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{b.policy}</TableCell>
                                                <TableCell>{b.balance}</TableCell>
                                                <TableCell>{b.used}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {/* Time off requested */}
                    {visibleWidgets.time_off_requested && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Time off requested</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {timeOffRequested.map((r, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <div>
                                                <div className="font-medium">{r.name}</div>
                                                <div className="text-muted-foreground">{r.policy} • {r.range}</div>
                                            </div>
                                            <Badge variant="outline" className="text-xs">{r.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Timesheet */}
                    {visibleWidgets.timesheet && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Timesheet</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Member</TableHead>
                                            <TableHead>Start</TableHead>
                                            <TableHead>Stop</TableHead>
                                            <TableHead>Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {timesheetRows.map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{row.name}</TableCell>
                                                <TableCell>{row.start}</TableCell>
                                                <TableCell>{row.stop}</TableCell>
                                                <TableCell>{row.total}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}



                    {/* Current project activity */}
                    {visibleWidgets.current_project_activity && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Current project activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {currentProjectActivity.map((p, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <div className="font-medium">{p.project}</div>
                                            <div className="text-right text-muted-foreground">{p.hours} • {p.tasks} tasks</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
