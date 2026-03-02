"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpDown,
} from "lucide-react"
import { MemberScreenshotItem } from "@/lib/data/dummy-data"
import { getScreenshotsByMemberAndDate, type IScreenshotWithActivity } from "@/action/screenshots"
import { formatDateLocal } from "@/utils/date-helper"
import { useSelectedMemberContext } from "../selected-member-context"
import { MemberScreenshotCard } from "@/components/activity/MemberScreenshotCard"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ScreenshotCardSkeleton } from "@/components/activity/ScreenshotCardSkeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

const formatDuration = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) {
    return `${minutes}m`
  }
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`
}

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
    const item = sorted[i]
    if (!item) continue

    const itemMinutes = parseTimeForSort(item.time)

    // Start a new block if:
    // 1. No block is started
    // 2. Current block has 6 items
    // 3. Current item's time is outside the 60-minute window of the block's start
    if (startMinutes === null || currentChunk.length >= chunkSize || itemMinutes >= startMinutes + 60) {
      if (currentChunk.length > 0 && startMinutes !== null) {
        blocks.push(finalizeBlock(currentChunk, startMinutes))
      }
      currentChunk = [item]
      startMinutes = itemMinutes
    } else {
      currentChunk.push(item)
    }
  }

  if (currentChunk.length > 0 && startMinutes !== null) {
    blocks.push(finalizeBlock(currentChunk, startMinutes))
  }

  function finalizeBlock(chunk: MemberScreenshotItem[], blockStartMins: number) {
    const totalMinutes = chunk.reduce((sum, item) => sum + (item.minutes ?? 0), 0)
    const summary = `Total time worked: ${formatDuration(totalMinutes)}`

    const startMinsPart = blockStartMins % 60
    const startHoursPart = Math.floor(blockStartMins / 60)
    const startTimeFormatted = formatTimeFromHoursMinutes(startHoursPart, startMinsPart)

    let endHours = startHoursPart + 1
    if (endHours >= 24) endHours -= 24
    const endTimeFormatted = formatTimeFromHoursMinutes(endHours, startMinsPart)

    const label = `${startTimeFormatted} - ${endTimeFormatted}`

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

interface DateGroupedBlocks {
  date: string
  dateLabel: string
  blocks: Array<{ label: string; summary: string; items: MemberScreenshotItem[] }>
}

export default function AllScreenshotsPage() {
  const { selectedMemberId, selectedMember, dateRange } = useSelectedMemberContext()
  const activeMemberId = selectedMemberId ?? selectedMember?.id ?? null
  const [modalOpen, setModalOpen] = useState(false)
  const [modalIndex, setModalIndex] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  // State untuk menyimpan daftar screenshot yang dihapus (berdasarkan item.id)
  const [deletedScreenshots, setDeletedScreenshots] = useState<Set<string>>(new Set())
  // State untuk dialog konfirmasi hapus
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [screenshotToDelete, setScreenshotToDelete] = useState<string | null>(null)
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
    try {
      const startDate = formatDateLocal(dateRange.startDate)
      const endDate = formatDateLocal(dateRange.endDate)
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
    } catch (err) {
      console.error("Error fetching screenshots:", err)
      setDbScreenshots([])
    } finally {
      setIsLoading(false)
      isFirstMount.current = false
    }
  }, [activeMemberId, dateRange.startDate, dateRange.endDate])

  // Check date range validity
  const dateStatus = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(dateRange.startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(dateRange.endDate)
    end.setHours(23, 59, 59, 999)
    if (start > today && end > today) return { isValid: false, isToday: false, isYesterday: false, isRange: false }
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    if (end < thirtyDaysAgo && start < thirtyDaysAgo) return { isValid: false, isToday: false, isYesterday: false, isRange: false }
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)
    const isToday = start.getTime() === today.getTime() && end.getTime() <= todayEnd.getTime()
    const yesterdayEnd = new Date(yesterday)
    yesterdayEnd.setHours(23, 59, 59, 999)
    const isYesterday = start.getTime() === yesterday.getTime() && end.getTime() <= yesterdayEnd.getTime()
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const isRange = daysDiff > 1
    return { isValid: true, isToday, isYesterday, isRange: isRange && !isToday && !isYesterday }
  }, [dateRange])

  const memberTimeBlocks = useMemo(() => {
    if (isLoading) return []
    if (!activeMemberId || !dateStatus.isValid) return []

    const baseItems: MemberScreenshotItem[] = dbScreenshots.map(mapDbToItem)
    if (baseItems.length === 0) return []

    let blocks: Array<{ label: string; summary: string; items: MemberScreenshotItem[] }> = []

    if (dateStatus.isRange && dateRange) {
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
        if (dayBlocks.length > 0) dateGroupedBlocks.push({ date: dateKey, dateLabel, blocks: dayBlocks })
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
    if (dateStatus.isRange && Array.isArray(memberTimeBlocks) && memberTimeBlocks.length > 0 && 'date' in (memberTimeBlocks[0] as unknown as DateGroupedBlocks)) {
      allItems = (memberTimeBlocks as unknown as DateGroupedBlocks[]).flatMap((dateGroup) =>
        dateGroup.blocks.flatMap((block) => block.items)
      )
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
  }, [])

  // Fetch saat member berubah
  useEffect(() => {
    setModalIndex(0)
    setModalOpen(false)
    setDeletedScreenshots(new Set())
    fetchScreenshots()
  }, [activeMemberId])

  // Fetch saat dateRange berubah (skip mount pertama)
  useEffect(() => {
    if (isFirstMount.current) return
    fetchScreenshots()
  }, [dateRange.startDate.getTime(), dateRange.endDate.getTime()])

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
  const goNext = useCallback(() => {
    if (!flattenedScreenshots.length) {
      return
    }
    setModalIndex((prev) => (prev + 1) % flattenedScreenshots.length)
  }, [flattenedScreenshots.length])
  const goPrev = useCallback(() => {
    if (!flattenedScreenshots.length) {
      return
    }
    setModalIndex((prev) => (prev - 1 + flattenedScreenshots.length) % flattenedScreenshots.length)
  }, [flattenedScreenshots.length])

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
  }, [modalOpen, goNext, goPrev])

  let runningIndex = 0

  return (
    <>
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
        ) : dateStatus.isRange && Array.isArray(memberTimeBlocks) && memberTimeBlocks.length > 0 && 'date' in (memberTimeBlocks[0] as unknown as DateGroupedBlocks) ? (
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
                        onDelete={() => handleDeleteClick(item.id)}
                        isDeleted={isDeleted}
                        memberId={selectedMemberId || undefined}
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
