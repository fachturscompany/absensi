"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  ArrowUpDown,
} from "lucide-react"
import { MemberScreenshotItem } from "@/lib/data/dummy-data"
import {
  getScreenshotsByMemberAndDate,
  getMemberInsightsSummary,
  type IScreenshotWithActivity
} from "@/action/screenshots"
import { useSelectedMemberContext } from "../selected-member-context"
import { MemberScreenshotCard } from "@/components/activity/MemberScreenshotCard"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ScreenshotCardSkeleton } from "@/components/activity/ScreenshotCardSkeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/store/user-store"

// Parse time string like "9:00 am - 9:10 am" to get start time for sorting
const parseTimeForSort = (timeStr: string): number => {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i)
  if (!match || !match[1] || !match[2] || !match[3]) return 0

  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const period = match[3].toLowerCase()

  // Convert to 24-hour format
  if (period === "pm" && hours !== 12) {
    hours += 12
  } else if (period === "am" && hours === 12) {
    hours = 0
  }

  return hours * 60 + minutes // Return total minutes for easy comparison
}

const buildMemberTimeBlocks = (items: MemberScreenshotItem[], chunkSize = 6) => {
  if (!items.length) {
    return []
  }

  // Sort items by time
  const sorted = [...items].sort((a, b) => {
    const timeA = parseTimeForSort(a.time)
    const timeB = parseTimeForSort(b.time)
    return timeA - timeB
  })

  const formatDuration = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours === 0) return `${minutes}m`
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`
  }

  const formatTimeFromHoursMinutes = (hours: number, minutes: number): string => {
    let displayHours = hours
    let period = 'am'
    if (hours >= 12) {
      period = 'pm'
      if (hours > 12) displayHours = hours - 12
    }
    if (displayHours === 0) displayHours = 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  const blocks = []
  let currentChunk: MemberScreenshotItem[] = []
  let startMinutes: number | null = null

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i]!
    const itemMinutes = parseTimeForSort(item.time)

    // Start a new block if:
    // 1. No block is started
    // 2. Current block has 6 items (Hubstaff grid is usually 6 wide)
    // 3. Current item's time is outside the 60-minute window of the block's start
    if (startMinutes === null || currentChunk.length >= chunkSize || itemMinutes >= startMinutes + 60) {
      if (currentChunk.length > 0) {
        // Finalize previous chunk
        blocks.push(finalizeBlock(currentChunk, startMinutes as number))
      }
      currentChunk = [item]
      startMinutes = itemMinutes
    } else {
      currentChunk.push(item)
    }
  }

  // Finalize the last chunk
  if (currentChunk.length > 0 && startMinutes !== null) {
    blocks.push(finalizeBlock(currentChunk, startMinutes as number))
  }

  function finalizeBlock(chunk: MemberScreenshotItem[], blockStartMins: number) {
    const totalMinutes = chunk.reduce((sum, item) => sum + (item.minutes ?? 0), 0)
    const summary = `Total time worked: ${formatDuration(totalMinutes)}`

    // Create labels
    const startMinsPart = blockStartMins % 60
    const startHoursPart = Math.floor(blockStartMins / 60)

    const startTimeFormatted = formatTimeFromHoursMinutes(startHoursPart, startMinsPart)

    let endHours = startHoursPart + 1
    if (endHours >= 24) endHours -= 24
    const endTimeFormatted = formatTimeFromHoursMinutes(endHours, startMinsPart)

    const label = `${startTimeFormatted} - ${endTimeFormatted}`

    // Pad chunk to 6 items
    const paddedChunk = [...chunk]
    while (paddedChunk.length < chunkSize) {
      paddedChunk.push({
        id: `placeholder-${blockStartMins}-${paddedChunk.length}`,
        time: "",
        progress: 0,
        minutes: 0,
        image: "",
        noActivity: true,
        screenCount: 0
      })
    }

    return { label, summary, items: paddedChunk }
  }

  return blocks
}

export default function Every10MinPage() {
  const router = useRouter()
  const { selectedMemberId, selectedMember, dateRange } = useSelectedMemberContext()
  const activeMemberId = selectedMemberId ?? selectedMember?.id ?? null
  const { userOrganizations } = useAuthStore()
  const currentMemberId = userOrganizations?.[0]?.id?.toString()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalIndex, setModalIndex] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  // State untuk menyimpan daftar screenshot yang dihapus (berdasarkan item.id)
  const [deletedScreenshots, setDeletedScreenshots] = useState<Set<string>>(new Set())
  // State untuk dialog konfirmasi hapus
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [screenshotToDelete, setScreenshotToDelete] = useState<string | null>(null)
  // State permission delete
  const [canDelete, setCanDelete] = useState(true)

  // State untuk loading
  const [isLoading, setIsLoading] = useState(true)
  // Ref untuk track apakah ini mount pertama kali
  const isFirstMount = useRef(true)
  // Ref untuk menyimpan scroll position sebelum modal dibuka
  const scrollPositionRef = useRef<number>(0)
  // State untuk sort order (ascending = true, descending = false)
  const [sortAscending, setSortAscending] = useState(true)

  // State data screenshots dari DB
  const [dbScreenshots, setDbScreenshots] = useState<IScreenshotWithActivity[]>([])
  // State untuk menyimpan data insight dari API
  const [insightData, setInsightData] = useState<{
    workedSeconds: number,
    focusSeconds: number,
    unusualCount: number,
    avgActivityPercent: number,
    classification?: {
      coreWork: { time: number, percentage: number, items: { name: string, percentage: number, time: number }[] },
      nonCoreWork: { time: number, percentage: number, items: { name: string, percentage: number, time: number }[] },
      unproductive: { time: number, percentage: number, items: { name: string, percentage: number, time: number }[] }
    }
  } | null>(null)


  // Helper: map DB row -> MemberScreenshotItem
  const mapDbToItem = (s: IScreenshotWithActivity): MemberScreenshotItem => {
    const timeSlot = new Date(s.time_slot)
    const timeSlotEnd = new Date(timeSlot.getTime() + 10 * 60 * 1000)
    const fmt = (d: Date) => {
      let h = d.getHours()
      const m = d.getMinutes()
      const period = h >= 12 ? 'pm' : 'am'
      if (h > 12) h -= 12
      if (h === 0) h = 12
      return `${h}:${m.toString().padStart(2, '0')} ${period}`
    }
    return {
      id: String(s.id),
      time: `${fmt(timeSlot)} - ${fmt(timeSlotEnd)}`,
      progress: s.activity_progress,
      minutes: 10,
      image: s.thumb_url ?? s.full_url,
      screenCount: s.screen_number,
      noActivity: false,
    }
  }

  // Fetch screenshots dari DB
  const fetchScreenshots = useCallback(async () => {
    if (!activeMemberId) {
      setDbScreenshots([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    const startDate = dateRange.startDate.toISOString().split('T')[0] ?? ''
    const endDate = dateRange.endDate.toISOString().split('T')[0] ?? ''
    const res = await getScreenshotsByMemberAndDate(
      Number(activeMemberId),
      startDate,
      endDate
    )
    if (res.success && res.data) {
      setDbScreenshots(res.data)
    } else {
      setDbScreenshots([])
    }
    setIsLoading(false)
    isFirstMount.current = false
  }, [activeMemberId, dateRange.startDate, dateRange.endDate])

  // Fetch member insights
  const fetchMemberInsights = useCallback(async () => {
    if (!activeMemberId) {
      setInsightData(null)
      return
    }
    const startDate = dateRange.startDate.toISOString().split('T')[0] ?? ''
    const endDate = dateRange.endDate.toISOString().split('T')[0] ?? ''
    const res = await getMemberInsightsSummary(Number(activeMemberId), startDate, endDate)
    if (res.success && res.data) {
      setInsightData(res.data)
    } else {
      setInsightData(null)
    }
  }, [activeMemberId, dateRange.startDate, dateRange.endDate])

  // Check date range validity and determine data display strategy
  const dateStatus = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const start = new Date(dateRange.startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(dateRange.endDate)
    end.setHours(23, 59, 59, 999)
    if (start > today && end > today) return { isValid: false, isToday: false, isYesterday: false, isRange: false }
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    if (end < thirtyDaysAgo && start < thirtyDaysAgo) return { isValid: false, isToday: false, isYesterday: false, isRange: false }
    const isToday = start.getTime() === today.getTime()
    const isYesterday = start.getTime() === yesterday.getTime() && end.getTime() <= today.getTime()
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const isRange = daysDiff > 1
    const includesToday = start <= today && end >= today
    const isWithinValidRange = (start <= today && end >= thirtyDaysAgo) || includesToday
    if (isToday) return { isValid: true, isToday: true, isYesterday: false, isRange }
    if (isYesterday) return { isValid: true, isToday: false, isYesterday: true, isRange: false }
    if (isRange && isWithinValidRange) return { isValid: true, isToday: false, isYesterday: false, isRange: true }
    if (isWithinValidRange && !isToday && !isYesterday) return { isValid: true, isToday: false, isYesterday: false, isRange: false }
    if (includesToday || isWithinValidRange) return { isValid: true, isToday: includesToday || isToday, isYesterday: false, isRange }
    return { isValid: false, isToday: false, isYesterday: false, isRange: false }
  }, [dateRange])

  // Struktur untuk menyimpan blocks per tanggal
  interface DateGroupedBlocks {
    date: string
    dateLabel: string
    blocks: Array<{ label: string; summary: string; items: MemberScreenshotItem[] }>
  }

  const memberTimeBlocks = useMemo(() => {
    if (isLoading) return []
    if (!activeMemberId || !dateStatus.isValid) return []

    const baseItems: MemberScreenshotItem[] = dbScreenshots.map(mapDbToItem)
    if (baseItems.length === 0) return []

    let blocks: Array<{ label: string; summary: string; items: MemberScreenshotItem[] }> = []

    if (dateStatus.isYesterday) {
      const filteredItems = baseItems.slice(0, Math.min(6, baseItems.length))
      blocks = buildMemberTimeBlocks(filteredItems, 6)
    } else if (dateStatus.isRange && dateRange) {
      // Grupkan berdasarkan screenshot_date dari DB
      const groupedByDate = new Map<string, MemberScreenshotItem[]>()
      dbScreenshots.forEach(s => {
        const dateKey = s.screenshot_date
        if (!dateKey) return
        if (!groupedByDate.has(dateKey)) groupedByDate.set(dateKey, [])
        groupedByDate.get(dateKey)!.push(mapDbToItem(s))
      })

      const dateGroupedBlocks: DateGroupedBlocks[] = []
      groupedByDate.forEach((items, dateKey) => {
        const dateObj = new Date(dateKey)
        const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        let dayBlocks = buildMemberTimeBlocks(items, 6)
        if (!sortAscending) dayBlocks = [...dayBlocks].reverse()
        if (dayBlocks.length > 0) {
          dateGroupedBlocks.push({ date: dateKey, dateLabel, blocks: dayBlocks })
        }
      })

      return dateGroupedBlocks as unknown as Array<{ label: string; summary: string; items: MemberScreenshotItem[] }>
    } else {
      blocks = buildMemberTimeBlocks(baseItems, 6)
    }

    if (!sortAscending) blocks = [...blocks].reverse()
    return blocks
  }, [activeMemberId, dateStatus, dateRange, isLoading, sortAscending, dbScreenshots])

  const flattenedScreenshots = useMemo(() => {
    let allItems: MemberScreenshotItem[] = []
    if (dateStatus.isRange && Array.isArray(memberTimeBlocks) && memberTimeBlocks.length > 0) {
      const firstBlock = memberTimeBlocks[0]
      if (firstBlock && 'date' in (firstBlock as any)) {
        allItems = (memberTimeBlocks as unknown as DateGroupedBlocks[]).flatMap((dateGroup) =>
          dateGroup.blocks.flatMap((block) => block.items)
        )
      }
    } else {
      allItems = (memberTimeBlocks as Array<{ label: string; summary: string; items: MemberScreenshotItem[] }>).flatMap((block) => block.items)
    }
    return allItems.filter(item => !deletedScreenshots.has(item.id))
  }, [memberTimeBlocks, dateStatus, deletedScreenshots])

  const currentScreenshot = flattenedScreenshots[modalIndex]

  // Fetch saat mount pertama
  useEffect(() => {
    setIsMounted(true)
    fetchScreenshots()
    fetchMemberInsights()
  }, [])

  // Fetch saat member berubah
  useEffect(() => {
    setModalIndex(0)
    setModalOpen(false)
    fetchScreenshots()
    fetchMemberInsights()
  }, [activeMemberId])

  // Fetch saat dateRange berubah (skip mount pertama)
  useEffect(() => {
    if (isFirstMount.current) return
    fetchScreenshots()
    fetchMemberInsights()
  }, [dateRange.startDate.getTime(), dateRange.endDate.getTime()])
  useEffect(() => {
    if (!currentMemberId) return

    const savedGlobal = localStorage.getItem("settings_screenshot_global_delete")
    const savedMembers = localStorage.getItem("settings_screenshot_member_deletes")

    let isDeleteEnabled = true // Default to true if no settings

    // Check global first
    if (savedGlobal !== null) {
      isDeleteEnabled = savedGlobal === "true"
    }

    // Check individual override
    if (savedMembers) {
      try {
        const memberDeletes = JSON.parse(savedMembers)
        if (memberDeletes[currentMemberId] !== undefined) {
          isDeleteEnabled = memberDeletes[currentMemberId]
        }
      } catch (e) {
        console.error("Failed to parse member deletes", e)
      }
    }

    setCanDelete(isDeleteEnabled)
  }, [currentMemberId])

  const openModal = (index: number) => {
    // Simpan scroll position sebelum membuka modal
    scrollPositionRef.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop
    setModalIndex(index)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    // Kembalikan scroll position setelah modal ditutup
    // Gunakan setTimeout untuk memastikan DOM sudah di-update
    setTimeout(() => {
      window.scrollTo(0, scrollPositionRef.current)
    }, 0)
  }
  const goNext = () => {
    if (!flattenedScreenshots.length) {
      return
    }
    setModalIndex((prev) => (prev + 1) % flattenedScreenshots.length)
  }
  const goPrev = () => {
    if (!flattenedScreenshots.length) {
      return
    }
    setModalIndex((prev) => (prev - 1 + flattenedScreenshots.length) % flattenedScreenshots.length)
  }

  // Handler untuk membuka dialog konfirmasi hapus
  const handleDeleteClick = (screenshotId: string) => {
    setScreenshotToDelete(screenshotId)
    setDeleteConfirmOpen(true)
  }

  // Handler untuk konfirmasi hapus
  const handleConfirmDelete = () => {
    if (screenshotToDelete) {
      setDeletedScreenshots((prev) => new Set(prev).add(screenshotToDelete))
      // Close modal if the deleted screenshot was the one currently open
      if (currentScreenshot?.id === screenshotToDelete) {
        setModalOpen(false)
      }
      setScreenshotToDelete(null)
    }
  }

  // Calculate dynamic stats for currently viewed member
  const memberSummary = useMemo(() => {
    if (!insightData || !activeMemberId) {
      return {
        memberId: activeMemberId || "",
        totalWorkedTime: "0h 0m",
        focusTime: "0h 0m",
        focusDescription: "No focus data yet.",
        avgActivity: "0%",
        unusualCount: 0,
        unusualMessage: "No unusual activity detected.",
        classificationLabel: "Balanced",
        classificationSummary: "Awaiting data.",
        classificationPercent: 0,
      }
    }

    const { workedSeconds, focusSeconds, unusualCount, avgActivityPercent } = insightData

    const formatSecondsToHM = (totalSecs: number) => {
      if (totalSecs === 0) return "0h 0m"
      const h = Math.floor(totalSecs / 3600)
      const m = Math.floor((totalSecs % 3600) / 60)
      if (h > 0 && m > 0) return `${h}h ${m}m`
      if (h > 0) return `${h}h`
      return `${m}m`
    }

    // Unusual Message logic (simple version)
    let unusualMessage = "- No unusual activity detected."
    if (unusualCount > 0) {
      if (unusualCount === 1) unusualMessage = "- Brief break before diving back into work."
      else if (unusualCount === 2) unusualMessage = "- Interrupted idle periods detected."
      else unusualMessage = "- Multiple activity shifts throughout the session."
    }

    // Classification Label based on worked seconds
    const totalWorkedMinutes = Math.floor(workedSeconds / 60)
    let classificationLabel = "Balanced"
    let classificationPercent = 60
    let classificationSummary = "Maintains consistent work pace."

    if (totalWorkedMinutes >= 480) { // 8+ hours
      classificationLabel = "High focus"
      classificationPercent = 85
      classificationSummary = "Sustained high productivity throughout the period."
    } else if (totalWorkedMinutes >= 360) { // 6+ hours
      classificationLabel = "Productive"
      classificationPercent = 75
      classificationSummary = "Maintains high focus on work tasks."
    } else if (totalWorkedMinutes >= 240) { // 4+ hours
      classificationLabel = "Balanced"
      classificationPercent = 65
      classificationSummary = "Punctuated focus with controlled rest."
    } else if (totalWorkedMinutes >= 120) { // 2+ hours
      classificationLabel = "Recovery"
      classificationPercent = 55
      classificationSummary = "Rebounds strong after periods of rest."
    } else {
      classificationLabel = "Creative"
      classificationPercent = 50
      classificationSummary = "Switches between tasks calmly."
    }

    return {
      memberId: activeMemberId,
      totalWorkedTime: formatSecondsToHM(workedSeconds),
      focusTime: formatSecondsToHM(focusSeconds),
      focusDescription: "Longest continuous block without idle time.",
      avgActivity: `${avgActivityPercent}%`,
      unusualCount,
      unusualMessage,
      classificationLabel,
      classificationSummary,
      classificationPercent,
    }
  }, [insightData, activeMemberId])

  // Calculate work classification data from URL and App activities
  const workClassificationData = useMemo(() => {
    if (!insightData || !insightData.classification) {
      return {
        coreWork: { percentage: 0, items: [] },
        nonCoreWork: { percentage: 0, items: [] },
        unproductive: { percentage: 0, items: [] },
      }
    }

    return {
      coreWork: {
        percentage: insightData.classification.coreWork?.percentage || 0,
        items: insightData.classification.coreWork?.items || [],
      },
      nonCoreWork: {
        percentage: insightData.classification.nonCoreWork?.percentage || 0,
        items: insightData.classification.nonCoreWork?.items || [],
      },
      unproductive: {
        percentage: insightData.classification.unproductive?.percentage || 0,
        items: insightData.classification.unproductive?.items || [],
      },
    }
  }, [insightData])

  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)

  let runningIndex = 0

  useEffect(() => {
    if (!modalOpen) return

    // Save original styles
    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow
    const originalPosition = document.body.style.position
    const originalWidth = document.body.style.width
    const originalTop = document.body.style.top

    // Simpan scroll position sebelum mengubah style
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop
    scrollPositionRef.current = scrollY

    // Hide scrollbar and prevent scrolling
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.top = `-${scrollY}px`
    document.documentElement.style.overflow = 'hidden'

    // Prevent touch move on mobile
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault()
    }

    document.body.addEventListener('touchmove', preventScroll, { passive: false })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal()
      } else if (event.key === "ArrowRight") {
        goNext()
      } else if (event.key === "ArrowLeft") {
        goPrev()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.removeEventListener('touchmove', preventScroll)
      document.body.style.overflow = originalBodyOverflow
      document.body.style.position = originalPosition
      document.body.style.width = originalWidth
      document.body.style.top = originalTop
      document.documentElement.style.overflow = originalHtmlOverflow

      // Kembalikan scroll position setelah style di-reset
      setTimeout(() => {
        window.scrollTo(0, scrollPositionRef.current)
      }, 0)
    }
  }, [modalOpen])

  return (
    <>
      {/* <ActivityDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} /> */}


      {/* How Activity Works Section */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            {/* Skeleton untuk Header (Worked time & Avg. activity) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex gap-6">
                <div className="flex flex-1 flex-col justify-between">
                  <Skeleton className="h-3 w-24 mb-2" />
                  <Skeleton className="h-9 w-20" />
                </div>
                <div className="flex flex-1 flex-col justify-between border-l border-slate-200 pl-6">
                  <Skeleton className="h-3 w-28 mb-2" />
                  <Skeleton className="h-9 w-16" />
                </div>
              </div>
            </div>
            {/* Skeleton untuk Summary Cards */}
            <div className="relative w-full rounded-t-2xl border-t border-l border-r border-slate-200 bg-white p-6 pb-10 shadow-sm mt-6 overflow-visible" style={{ borderBottom: 'none' }}>
              <div className="absolute left-0 right-0 bottom-0 flex items-center justify-center" style={{ transform: 'translateY(50%)' }}>
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-slate-200" />
                <div className="relative z-10 bg-white">
                  <Skeleton className="h-9 w-24 rounded-full" />
                </div>
              </div>
              <div className="flex flex-col md:flex-row">
                {/* Focus Time Skeleton */}
                <div className="flex flex-1 flex-col items-center justify-start gap-4 p-6 border-r border-slate-200">
                  <Skeleton className="h-3 w-24" />
                  <div className="flex flex-col items-center justify-center gap-3 py-4">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <Skeleton className="h-7 w-16" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                {/* Unusual Activity Instances Skeleton */}
                <div className="flex flex-1 flex-col items-center justify-start gap-4 p-6 border-r border-slate-200">
                  <Skeleton className="h-3 w-40" />
                  <div className="flex w-full flex-row items-center justify-center gap-4 py-8">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </div>
                {/* Work Time Classification Skeleton */}
                <div className="flex flex-1 flex-col items-center justify-start gap-4 p-6">
                  <div className="flex w-full items-center justify-between mb-2">
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="flex items-start justify-between w-full mb-3">
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full rounded-full mb-2" />
                  <div className="flex justify-between w-full mb-2">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <LineChart className="h-4 w-4" />
          How activity works
        </button> */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex gap-6">
                <div className="flex flex-1 flex-col justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Worked time</p>
                  <h2 className="text-3xl font-semibold text-slate-900">{memberSummary.totalWorkedTime}</h2>
                </div>
                <div className="flex flex-1 flex-col justify-between border-l border-slate-200 pl-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Avg. activity</p>
                  <span className="text-3xl font-semibold text-slate-700">{memberSummary.avgActivity}</span>
                </div>
              </div>
            </div>
            <div className="relative w-full rounded-t-2xl border-t border-l border-r border-slate-200 bg-white p-6 pb-10 shadow-sm mt-6 overflow-visible" style={{ borderBottom: 'none' }}>
              {/* Garis horizontal penuh yang melewati tengah tombol */}
              <div className="absolute left-0 right-0 bottom-0 flex items-center justify-center" style={{ transform: 'translateY(50%)' }}>
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-slate-200" />
                <div className="relative z-10 bg-white">
                  <Button
                    variant="outline"
                    className="rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-medium text-slate-700 shadow-sm"
                    onClick={() => {
                      console.log("View all clicked - activeMemberId:", activeMemberId)
                      console.log("selectedMemberId from context:", selectedMemberId)
                      if (activeMemberId) {
                        // Save memberId to sessionStorage for persistence
                        sessionStorage.setItem("screenshotSelectedMemberId", activeMemberId)
                        const url = `/insight/highlights?memberId=${encodeURIComponent(activeMemberId)}`
                        console.log("Navigating to:", url)
                        // Navigate to highlight page with memberId
                        router.push(url)
                      } else {
                        console.log("No activeMemberId, navigating without memberId")
                        router.push("/insight/highlights")
                      }
                    }}
                  >
                    View all
                  </Button>
                </div>
              </div>
              {/* <div className="absolute top-0 z-10 -translate-y-1/2" style={{ right: '1.5rem' }}>
            <Button variant="outline" size="sm" className="rounded-full border border-slate-200 bg-white px-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 shadow-sm">
              Insights
            </Button>
          </div> */}
              <div className="flex flex-col md:flex-row">
                {/* Focus Time */}
                <div className="flex flex-1 flex-col items-center justify-start gap-4 p-6 border-r border-slate-200">
                  <div className="flex w-full items-center gap-1 text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
                    Focus time
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div className="flex flex-col items-center justify-center gap-3 py-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                      <svg className="h-8 w-8 text-blue-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900">{memberSummary.focusTime}</h3>
                    <p className="text-center text-xs text-slate-500 max-w-[180px]">
                      {memberSummary.focusDescription}
                    </p>
                  </div>
                </div>

                {/* Unusual Activity Instances */}
                <div className="flex flex-1 flex-col items-center justify-start gap-4 p-6 border-r border-slate-200">
                  <div className="flex w-full items-center gap-1 text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
                    Unusual activity instances
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div className="flex w-full flex-row items-center justify-center gap-4 py-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-slate-100 bg-white text-slate-700">
                      <span className="text-lg font-semibold">{memberSummary.unusualCount}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-slate-700">
                        {memberSummary.unusualMessage.split("\n").map((line, index) => (
                          <p
                            key={`${activeMemberId}-${index}`}
                            className="text-left leading-snug"
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Work Time Classification */}
                <div className="flex flex-1 flex-col items-center justify-start gap-4 p-6">
                  <div className="flex w-full items-center justify-between mb-2">
                    <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
                      Work time classification
                      <Info className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>

                  <div className="flex items-start justify-between w-full mb-3">
                    {/* Left: Core work percentage */}
                    <div className="flex flex-col">
                      <span className="text-3xl font-semibold text-gray-900">{workClassificationData.coreWork.percentage}%</span>
                      <span className="text-sm text-gray-600 mt-1">Core work</span>
                    </div>

                    {/* Right: Legend */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm text-gray-700">{workClassificationData.coreWork.percentage}% Core work</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        <span className="text-sm text-gray-700">{workClassificationData.nonCoreWork.percentage}% Non-core work</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-sm text-gray-700">{workClassificationData.unproductive.percentage}% Unproductive</span>
                      </div>
                    </div>
                  </div>

                  {/* Bar chart */}
                  <div className="mb-2 relative w-full">
                    <div className="h-4 rounded-full bg-gray-100 overflow-visible flex relative mb-3">
                      {/* Core work segment */}
                      <div
                        className="bg-green-500 relative group cursor-pointer transition-opacity hover:opacity-90"
                        style={{ width: `${workClassificationData.coreWork.percentage}%` }}
                        onMouseEnter={() => setHoveredSegment('core')}
                        onMouseLeave={() => setHoveredSegment(null)}
                      />
                      {/* Non-core work segment */}
                      <div
                        className="bg-gray-400 relative group cursor-pointer transition-opacity hover:opacity-90"
                        style={{ width: `${workClassificationData.nonCoreWork.percentage}%` }}
                        onMouseEnter={() => setHoveredSegment('noncore')}
                        onMouseLeave={() => setHoveredSegment(null)}
                      />
                      {/* Unproductive segment */}
                      <div
                        className="bg-orange-500 relative group cursor-pointer transition-opacity hover:opacity-90"
                        style={{ width: `${workClassificationData.unproductive.percentage}%` }}
                        onMouseEnter={() => setHoveredSegment('unproductive')}
                        onMouseLeave={() => setHoveredSegment(null)}
                      />
                    </div>
                    {/* Vertical lines connecting percentage labels to bar chart */}
                    <div className="absolute top-3 left-0 right-0 flex justify-between pointer-events-none">
                      <div className="bg-black" style={{ width: '2px', height: '16px', marginTop: '16px' }}></div>
                      <div className="bg-black" style={{ width: '2px', height: '16px', marginTop: '16px' }}></div>
                      <div className="bg-black" style={{ width: '2px', height: '16px', marginTop: '16px' }}></div>
                      <div className="bg-black" style={{ width: '2px', height: '16px', marginTop: '16px' }}></div>
                      <div className="bg-black" style={{ width: '2px', height: '16px', marginTop: '16px' }}></div>
                    </div>
                    {/* Tooltip - positioned above the bar chart */}
                    {hoveredSegment === 'core' && workClassificationData.coreWork.percentage > 0 && (
                      <div
                        className="absolute px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg z-50 min-w-[200px] pointer-events-none opacity-90"
                        style={{
                          bottom: 'calc(100% + 8px)',
                          left: `${workClassificationData.coreWork.percentage / 2}%`,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        <div className="space-y-1">
                          {workClassificationData.coreWork.items.length > 0 ? (
                            workClassificationData.coreWork.items.map((item, idx) => (
                              <div key={idx} className="text-white">
                                {item.percentage}% {item.name}
                              </div>
                            ))
                          ) : (
                            <div className="text-gray-400">No data</div>
                          )}
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                          <div className="w-2 h-2 bg-gray-800 transform rotate-45"></div>
                        </div>
                      </div>
                    )}
                    {hoveredSegment === 'noncore' && workClassificationData.nonCoreWork.percentage > 0 && (
                      <div
                        className="absolute px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg z-50 min-w-[200px] pointer-events-none opacity-90"
                        style={{
                          bottom: 'calc(100% + 8px)',
                          left: `${workClassificationData.coreWork.percentage + (workClassificationData.nonCoreWork.percentage / 2)}%`,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        <div className="space-y-1">
                          {workClassificationData.nonCoreWork.items.length > 0 ? (
                            workClassificationData.nonCoreWork.items.map((item, idx) => (
                              <div key={idx} className="text-white">
                                {item.percentage}% {item.name}
                              </div>
                            ))
                          ) : (
                            <div className="text-gray-400">No data</div>
                          )}
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                          <div className="w-2 h-2 bg-gray-800 transform rotate-45"></div>
                        </div>
                      </div>
                    )}
                    {hoveredSegment === 'unproductive' && workClassificationData.unproductive.percentage > 0 && (
                      <div
                        className="absolute px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg z-50 min-w-[200px] pointer-events-none opacity-90"
                        style={{
                          bottom: 'calc(100% + 8px)',
                          left: `${workClassificationData.coreWork.percentage + workClassificationData.nonCoreWork.percentage + (workClassificationData.unproductive.percentage / 2)}%`,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        <div className="space-y-1">
                          {workClassificationData.unproductive.items.length > 0 ? (
                            workClassificationData.unproductive.items.map((item, idx) => (
                              <div key={idx} className="text-white">
                                {item.percentage}% {item.name}
                              </div>
                            ))
                          ) : (
                            <div className="text-gray-400">No data</div>
                          )}
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                          <div className="w-2 h-2 bg-gray-800 transform rotate-45"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Axis labels */}
                  <div className="flex justify-between text-xs text-gray-500 w-full mb-2">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Screenshots Grid */}
      <div className="space-y-6">
        {/* Sort Toggle Button */}
        {!isLoading && memberTimeBlocks.length > 0 && (
          <div className="flex items-center justify-start">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSortAscending(!sortAscending)}
              className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="text-sm">
                {sortAscending ? "Ascending" : "Descending"}
              </span>
            </Button>
          </div>
        )}
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-6">
            {[...Array(2)].map((_, dateIdx) => (
              <div key={dateIdx} className="space-y-6">
                <Skeleton className="h-5 w-32" />
                {[...Array(2)].map((_, blockIdx) => (
                  <div key={blockIdx} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                      {[...Array(6)].map((_, cardIdx) => (
                        <ScreenshotCardSkeleton key={cardIdx} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : !memberTimeBlocks.length ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
            No screenshots were captured for this member yet.
          </div>
        ) : dateStatus.isRange && Array.isArray(memberTimeBlocks) && memberTimeBlocks.length > 0 && 'date' in (memberTimeBlocks[0] as any) ? (
          // Render dengan pemisahan berdasarkan tanggal untuk range
          (memberTimeBlocks as unknown as DateGroupedBlocks[]).map((dateGroup) => (
            <div key={dateGroup.date} className="space-y-6">
              {/* Tanggal Header */}
              <div className="text-base font-semibold text-slate-700">
                {dateGroup.dateLabel}
              </div>
              {/* Time Blocks untuk tanggal ini */}
              {dateGroup.blocks.map((block) => {
                const blockStart = runningIndex
                // Hanya hitung item yang bukan placeholder untuk runningIndex
                const realItemsCount = block.items.filter(item => !(item.noActivity && !item.time)).length
                runningIndex += realItemsCount
                let itemIndex = 0
                return (
                  <div key={`${dateGroup.date}-${block.label}-${blockStart}`} className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="font-medium">{block.label}</span>
                      <span className="text-slate-400">{block.summary}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                      {block.items.map((item) => {
                        // Skip placeholder items yang tidak memiliki time (untuk menghindari error di modal)
                        if (item.noActivity && !item.time) {
                          return (
                            <MemberScreenshotCard
                              key={item.id}
                              item={item}
                              isDeleted={false}
                            />
                          )
                        }
                        const globalIndex = blockStart + itemIndex
                        itemIndex++
                        const isDeleted = deletedScreenshots.has(item.id)
                        return (
                          <MemberScreenshotCard
                            key={item.id}
                            item={item}
                            onImageClick={() => openModal(globalIndex)}
                            onDelete={() => handleDeleteClick(item.id)}
                            isDeleted={isDeleted}
                            memberId={activeMemberId || undefined}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        ) : (
          // Render normal (bukan range)
          (memberTimeBlocks as Array<{ label: string; summary: string; items: MemberScreenshotItem[] }>).map((block) => {
            const blockStart = runningIndex
            // Hanya hitung item yang bukan placeholder untuk runningIndex
            const realItemsCount = block.items.filter(item => !(item.noActivity && !item.time)).length
            runningIndex += realItemsCount
            let itemIndex = 0
            return (
              <div key={`${block.label}-${blockStart}`} className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="font-medium">{block.label}</span>
                  <span className="text-slate-400">{block.summary}</span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                  {block.items.map((item) => {
                    // Skip placeholder items yang tidak memiliki time (untuk menghindari error di modal)
                    if (item.noActivity && !item.time) {
                      return (
                        <MemberScreenshotCard
                          key={item.id}
                          item={item}
                          isDeleted={false}
                          memberId={activeMemberId || undefined}
                        />
                      )
                    }
                    const globalIndex = blockStart + itemIndex
                    itemIndex++
                    const isDeleted = deletedScreenshots.has(item.id)
                    return (
                      <MemberScreenshotCard
                        key={item.id}
                        item={item}
                        onImageClick={() => openModal(globalIndex)}
                        onDelete={canDelete ? () => handleDeleteClick(item.id) : undefined}
                        isDeleted={isDeleted}
                        memberId={activeMemberId || undefined}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {isMounted && modalOpen && currentScreenshot && createPortal(
        <>
          <style dangerouslySetInnerHTML={{
            __html: `
              body:has(#screenshot-modal-overlay) {
                overflow: hidden !important;
              }
              #screenshot-modal-overlay {
                scrollbar-width: none;
                -ms-overflow-style: none;
              }
              #screenshot-modal-overlay::-webkit-scrollbar {
                display: none;
              }
            `
          }} />
          <div
            id="screenshot-modal-overlay"
            className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center gap-4 p-8"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(2px)',
              overflow: 'hidden',
              zIndex: 99999
            }}
            onClick={closeModal}
          >
            {/* Tombol Previous - Kiri */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                goPrev()
              }}
              aria-label="Previous screenshot"
              className="rounded-full bg-white p-4 shadow-2xl hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all border-2 border-slate-200"
              disabled={flattenedScreenshots.length <= 1}
            >
              <ChevronLeft className="h-8 w-8 text-slate-900" />
            </button>

            {/* Kotak Putih Modal */}
            <div className="relative flex flex-col max-w-6xl w-full max-h-[90vh] rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {/* Tombol Close - Pojok Kanan Atas Kotak Putih */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeModal()
                }}
                aria-label="Close screenshot"
                className="absolute right-4 top-4 rounded-full bg-white p-3 shadow-2xl hover:bg-slate-100 z-20 border-2 border-slate-200 transition-all"
              >
                <X className="h-5 w-5 text-slate-900" />
              </button>
              <div className="flex items-center justify-center flex-1 min-h-0 mb-4 overflow-hidden">
                {currentScreenshot.image ? (
                  <img
                    src={currentScreenshot.image}
                    alt={currentScreenshot.time}
                    className="max-h-full max-w-full rounded-2xl object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full text-slate-400">
                    No image available
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center text-sm text-slate-600 shrink-0">
                <span>{currentScreenshot.time}</span>
              </div>
            </div>

            {/* Tombol Next - Kanan */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                goNext()
              }}
              aria-label="Next screenshot"
              className="rounded-full bg-white p-4 shadow-2xl hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all border-2 border-slate-200"
              disabled={flattenedScreenshots.length <= 1}
            >
              <ChevronRight className="h-8 w-8 text-slate-900" />
            </button>
          </div>
        </>,
        document.body
      )}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Hapus Screenshot"
        description="Apakah anda yakin ingin menghapusnya?"
        confirmText="Hapus"
        cancelText="Batal"
        destructive={true}
      />
    </>
  )
}