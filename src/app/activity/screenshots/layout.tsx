"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
    User,
    Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { DownloadDialog } from "@/components/activity/DownloadDialog"
import { SelectedMemberProvider } from "@/components/settings/screenshot/selected-member-provider"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { DateRange, SelectedFilter } from "@/components/insights/types"
import { useTimezone } from "@/components/providers/timezone-provider"
import { BlurProvider } from "@/components/settings/screenshot/blur-provider"
import { getMembersForScreenshot, type ISimpleMember } from "@/action/activity/screenshot"
import { useOrgStore } from "@/store/org-store"

export default function ScreenshotsLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const memberIdFromUrl = searchParams.get("memberId")
    const { organizationId } = useOrgStore()

    // State member dari DB
    const [realMembers, setRealMembers] = useState<ISimpleMember[]>([])

    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false)

    // Fetch real members dari DB
    useEffect(() => {
        console.log("ScreenshotsLayout: organizationId is", organizationId);
        if (!organizationId) return
        getMembersForScreenshot(String(organizationId)).then(res => {
            console.log("ScreenshotsLayout: fetched members response", res);
            if (res.success && res.data && res.data.length > 0) {
                setRealMembers(res.data)
            }
        })
    }, [organizationId])

    // Get initial memberId: URL > sessionStorage > first real member
    const getInitialMemberId = (): string => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search)
            const memberIdFromLocation = urlParams.get("memberId")
            if (memberIdFromLocation) return memberIdFromLocation
        }
        if (memberIdFromUrl) return memberIdFromUrl
        if (typeof window !== "undefined") {
            const savedMemberId = sessionStorage.getItem("screenshotSelectedMemberId")
            if (savedMemberId) return savedMemberId
        }
        return realMembers[0]?.id ?? ""
    }

    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({
        type: "members",
        all: false,
        id: getInitialMemberId(),
    })

    // Set default member ID saat data real pertama kali datang
    useEffect(() => {
        if (realMembers.length > 0 && !selectedFilter.id) {
            setSelectedFilter(prev => ({ ...prev, id: realMembers[0]?.id ?? "" }))
        }
    }, [realMembers])

    // Update filter when memberId from URL changes
    useEffect(() => {
        if (memberIdFromUrl && memberIdFromUrl !== selectedFilter.id) {
            setSelectedFilter({
                type: "members",
                all: false,
                id: memberIdFromUrl,
            })
            if (typeof window !== "undefined") {
                sessionStorage.setItem("screenshotSelectedMemberId", memberIdFromUrl)
            }
        } else if (!memberIdFromUrl && typeof window !== "undefined") {
            const savedMemberId = sessionStorage.getItem("screenshotSelectedMemberId")
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
        // Jika all: true, ubah ke member pertama
        if (filter.all) {
            const firstMemberId = realMembers[0]?.id ?? ""
            const newFilter: SelectedFilter = {
                type: "members",
                all: false,
                id: firstMemberId,
            }
            setSelectedFilter(newFilter)
            if (typeof window !== "undefined") {
                sessionStorage.setItem("screenshotSelectedMemberId", firstMemberId)
                const params = new URLSearchParams(searchParams.toString())
                params.set("memberId", firstMemberId)
                router.push(`${pathname}?${params.toString()}`)
            }
            return
        }

        setSelectedFilter(filter)
        if (!filter.all && filter.id && typeof window !== "undefined") {
            sessionStorage.setItem("screenshotSelectedMemberId", filter.id)
            const params = new URLSearchParams(searchParams.toString())
            params.set("memberId", filter.id)
            router.push(`${pathname}?${params.toString()}`)
        }
    }

    const selectedMemberId = selectedFilter.all ? null : (selectedFilter.id ?? null)

    const filterPanelRef = useRef<HTMLDivElement>(null)
    const timezone = useTimezone()

    const isAllScreenshots = pathname?.includes("/all")
    const isEvery10Min = !isAllScreenshots
    const isSettingsPage = pathname?.includes("/setting")

    // Get initial date range: sessionStorage > default (Today untuk 10min, Last 7 days untuk all)
    const getInitialDateRange = (): DateRange => {
        if (typeof window !== "undefined") {
            // Gunakan sessionStorage terpisah untuk setiap halaman
            const storageKey = isAllScreenshots ? "screenshotDateRangeAll" : "screenshotDateRange10min"
            const savedDateRange = sessionStorage.getItem(storageKey)
            if (savedDateRange) {
                try {
                    const parsed = JSON.parse(savedDateRange)
                    return {
                        startDate: new Date(parsed.startDate),
                        endDate: new Date(parsed.endDate),
                    }
                } catch (e) {
                    // Jika parsing gagal, gunakan default
                }
            }
        }
        // Default berdasarkan halaman
        if (isAllScreenshots) {
            // Default untuk all screenshots: Last 7 days
            const end = new Date()
            end.setHours(23, 59, 59, 999)
            const start = new Date()
            start.setDate(start.getDate() - 6)
            start.setHours(0, 0, 0, 0)
            return { startDate: start, endDate: end }
        } else {
            // Default untuk 10min: Today
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const end = new Date()
            end.setHours(23, 59, 59, 999)
            return { startDate: today, endDate: end }
        }
    }

    const [dateRange, setDateRange] = useState<DateRange>(getInitialDateRange)

    // Update date range saat pathname berubah (pindah antara 10min dan all)
    useEffect(() => {
        const currentIsAll = pathname?.includes("/all")
        const storageKey = currentIsAll ? "screenshotDateRangeAll" : "screenshotDateRange10min"

        if (typeof window !== "undefined") {
            const savedDateRange = sessionStorage.getItem(storageKey)
            if (savedDateRange) {
                try {
                    const parsed = JSON.parse(savedDateRange)
                    setDateRange({
                        startDate: new Date(parsed.startDate),
                        endDate: new Date(parsed.endDate),
                    })
                } catch (e) {
                    // Jika parsing gagal, set default
                    if (currentIsAll) {
                        const end = new Date()
                        end.setHours(23, 59, 59, 999)
                        const start = new Date()
                        start.setDate(start.getDate() - 6)
                        start.setHours(0, 0, 0, 0)
                        setDateRange({ startDate: start, endDate: end })
                    } else {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const end = new Date()
                        end.setHours(23, 59, 59, 999)
                        setDateRange({ startDate: today, endDate: end })
                    }
                }
            } else {
                // Jika tidak ada saved date range, set default berdasarkan halaman
                if (currentIsAll) {
                    // Default untuk all screenshots: Last 7 days
                    const end = new Date()
                    end.setHours(23, 59, 59, 999)
                    const start = new Date()
                    start.setDate(start.getDate() - 6)
                    start.setHours(0, 0, 0, 0)
                    const newDateRange = { startDate: start, endDate: end }
                    setDateRange(newDateRange)
                    sessionStorage.setItem(storageKey, JSON.stringify({
                        startDate: newDateRange.startDate.toISOString(),
                        endDate: newDateRange.endDate.toISOString(),
                    }))
                } else {
                    // Default untuk 10min: Today
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const end = new Date()
                    end.setHours(23, 59, 59, 999)
                    const newDateRange = { startDate: today, endDate: end }
                    setDateRange(newDateRange)
                    sessionStorage.setItem(storageKey, JSON.stringify({
                        startDate: newDateRange.startDate.toISOString(),
                        endDate: newDateRange.endDate.toISOString(),
                    }))
                }
            }
        }
    }, [pathname])

    // Handler untuk update date range dengan persistensi
    const handleDateRangeChange = (newDateRange: DateRange) => {
        setDateRange(newDateRange)
        if (typeof window !== "undefined") {
            // Gunakan sessionStorage terpisah untuk setiap halaman
            const storageKey = isAllScreenshots ? "screenshotDateRangeAll" : "screenshotDateRange10min"
            sessionStorage.setItem(storageKey, JSON.stringify({
                startDate: newDateRange.startDate.toISOString(),
                endDate: newDateRange.endDate.toISOString(),
            }))
        }
    }

    // Persist date range ke sessionStorage saat berubah (backup)
    useEffect(() => {
        if (typeof window !== "undefined") {
            const storageKey = isAllScreenshots ? "screenshotDateRangeAll" : "screenshotDateRange10min"
            sessionStorage.setItem(storageKey, JSON.stringify({
                startDate: dateRange.startDate.toISOString(),
                endDate: dateRange.endDate.toISOString(),
            }))
        }
    }, [dateRange, isAllScreenshots])

    // Map ISimpleMember -> Member shape yang dibutuhkan InsightsHeader
    const demoMembers = useMemo(() => realMembers.map(m => ({
        id: m.id,
        name: m.name,
        email: "",
        avatar: m.avatarUrl ?? undefined,
        activityScore: 0,
    })), [realMembers])

    const demoTeams = useMemo(() => [], [])

    const selectedMember = useMemo(
        () =>
            demoMembers.find((member) => member.id === selectedMemberId) ??
            demoMembers[0] ??
            null,
        [selectedMemberId, demoMembers]
    )



    useEffect(() => {
        if (!isFilterOpen) {
            return
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (filterPanelRef.current && !filterPanelRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isFilterOpen])


    return (
        <BlurProvider>
            <SelectedMemberProvider value={{ selectedMemberId, selectedMember, dateRange }}>
                <div className={`flex min-h-screen flex-col bg-white text-slate-800 ${isSettingsPage ? '' : 'gap-6 px-6 py-8'}`}>
                    <DownloadDialog
                        isOpen={isDownloadDialogOpen}
                        onClose={() => setIsDownloadDialogOpen(false)}
                    />

                    {/* Header - hanya tampil jika bukan settings page */}
                    {!isSettingsPage && (
                        <>
                            <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative">
                                {/* Baris pertama: Judul & Tombol Settings (Mobile) */}
                                <div className="flex w-full items-center justify-between sm:flex-1 sm:min-w-0">
                                    <h1 className="text-xl font-semibold sm:mb-5">Screenshot</h1>
                                    <div className="sm:hidden">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700"
                                            onClick={() => router.push("/settings/screenshot")}
                                        >
                                            <Settings className="h-4 w-4 text-slate-700" />
                                            Settings
                                        </Button>
                                    </div>
                                </div>

                                {/* Tab Navigation */}
                                <div className="flex justify-center sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:transform">
                                    <div
                                        className="flex min-w-[250px] justify-center gap-1 rounded-full px-1 py-1 shadow-sm"
                                        style={{ backgroundColor: "#A9A9A9" }}
                                    >
                                        <button
                                            onClick={() => router.push("/activity/screenshots/10min")}
                                            className={`rounded-full px-5 py-1.5 text-sm font-normal transition-all focus-visible:outline-none focus-visible:ring-0 ${isEvery10Min
                                                ? "bg-white text-slate-900 shadow-sm"
                                                : "bg-transparent text-slate-900 hover:bg-white/40"
                                                }`}
                                        >
                                            Every 10 min
                                        </button>
                                        <button
                                            onClick={() => router.push("/activity/screenshots/all")}
                                            className={`rounded-full px-5 py-1.5 text-sm font-normal transition-all focus-visible:outline-none focus-visible:ring-0 ${isAllScreenshots
                                                ? "bg-white text-slate-900 shadow-sm"
                                                : "bg-transparent text-slate-900 hover:bg-white/40"
                                                }`}
                                        >
                                            All screenshots
                                        </button>
                                    </div>
                                </div>

                                {/* Settings Button (Desktop Only) */}
                                <div className="hidden sm:flex min-w-[160px] justify-end">
                                    <Button
                                        variant="outline"
                                        className="flex items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700"
                                        onClick={() => router.push("/settings/screenshot")}
                                    >
                                        <Settings className="h-4 w-4 text-slate-700" />
                                        Settings
                                    </Button>
                                </div>
                            </div>

                            {/* Date & User Controls */}
                            <div className="flex w-full items-center justify-between gap-4">
                                <InsightsHeader
                                    selectedFilter={selectedFilter}
                                    onSelectedFilterChange={handleFilterChange}
                                    dateRange={dateRange}
                                    onDateRangeChange={handleDateRangeChange}
                                    members={demoMembers}
                                    teams={demoTeams}
                                    timezone={timezone}
                                    hideAllOption={true}
                                    hideTeamsTab={true}
                                />
                            </div>
                        </>
                    )}

                    {/* Child Content */}
                    {children}

                    {isFilterOpen && (
                        <>
                            <div
                                className="pointer-events-auto fixed inset-x-0 top-[220px] bottom-0 bg-slate-900/10"
                                onClick={() => setIsFilterOpen(false)}
                            />
                            <div className="pointer-events-none fixed top-[220px] right-0 bottom-0 z-30 flex max-w-[320px] flex-col px-6 py-8">
                                <div
                                    className="pointer-events-auto flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-[0_25px_40px_rgba(15,23,42,0.18)]"
                                    ref={filterPanelRef}
                                    style={{ maxHeight: "calc(100vh - 220px)" }}
                                >
                                    <div className="border-b border-slate-100 px-6 py-5">
                                        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-600">Filters</p>
                                    </div>
                                    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
                                        <div className="space-y-2 rounded-2xl border border-slate-200 bg-[#f5f8ff] px-4 py-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Member</p>
                                            <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-[inset_0_1px_0_rgba(15,23,42,0.04)]">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-600">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <div className="text-sm font-semibold text-slate-700">
                                                    {selectedMember?.name ?? "Member"}
                                                </div>
                                            </div>
                                        </div>
                                        {["Project", "Time Type", "Source", "Activity Level"].map((label) => (
                                            <div key={label} className="space-y-2">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">{label}</p>
                                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 shadow-sm">
                                                    <span>All {label.toLowerCase()}</span>
                                                    <span className="text-base text-slate-400">Γîä</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-slate-100 px-6 py-5">
                                        <button
                                            onClick={() => setIsFilterOpen(false)}
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                                        >
                                            Clear filters
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </SelectedMemberProvider>
        </BlurProvider>
    )
}
