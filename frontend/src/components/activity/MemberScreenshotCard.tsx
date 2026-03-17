"use client"

import { useState, useEffect } from "react"
import { Trash2, ImageMinus, ExternalLink, Check } from "lucide-react"
import type { MemberScreenshotItem } from "@/lib/data/dummy-data"

interface MemberScreenshotCardProps {
  item: MemberScreenshotItem
  onImageClick?: () => void
  onDelete?: () => void
  onDeleteImage?: () => void
  isSelected?: boolean
  onSelect?: (selected: boolean) => void
  isDeleted?: boolean
  memberId?: string
  onAddNote?: () => void
}

export function MemberScreenshotCard({
  item,
  onImageClick,
  onDelete,
  onDeleteImage,
  isSelected = false,
  onSelect,
  isDeleted = false,
  memberId,
  onAddNote
}: MemberScreenshotCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [shouldBlur, setShouldBlur] = useState(false)

  // Get blur setting for this member and listen for changes
  useEffect(() => {
    if (typeof window === "undefined" || !memberId) {
      setShouldBlur(false)
      return
    }

    const checkBlurSetting = () => {
      try {
        const saved = localStorage.getItem("screenshotBlurSettings")
        if (saved) {
          const blurSettings = JSON.parse(saved)
          console.log("Blur settings for memberId:", memberId, blurSettings)
          if (blurSettings.memberBlurs && blurSettings.memberBlurs[memberId] !== undefined) {
            const blurValue = blurSettings.memberBlurs[memberId]
            console.log("Member blur setting:", memberId, "=", blurValue)
            setShouldBlur(blurValue)
          } else {
            const globalValue = blurSettings.globalBlur || false
            console.log("Using global blur:", globalValue)
            setShouldBlur(globalValue)
          }
        } else {
          setShouldBlur(false)
        }
      } catch (e) {
        console.error("Error reading blur settings:", e)
        setShouldBlur(false)
      }
    }

    // Check immediately
    checkBlurSetting()

    // Listen for storage changes (when blur setting is updated in another tab/component)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "screenshotBlurSettings") {
        checkBlurSetting()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Also listen for custom event (for same-tab updates)
    const handleCustomStorageChange = () => {
      checkBlurSetting()
    }

    window.addEventListener("blurSettingsChanged", handleCustomStorageChange)

    // Poll for changes (fallback if events don't work)
    const interval = setInterval(checkBlurSetting, 500)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("blurSettingsChanged", handleCustomStorageChange)
      clearInterval(interval)
    }
  }, [memberId])

  const getProgressColor = (progress: number) => {
    if (progress < 30) return "#facc15"
    if (progress < 50) return "#fb923c"
    if (progress < 70) return "#a3e635"
    return "#22c55e"
  }

  const showNoActivity = isDeleted || item.noActivity || !item.image

  // Calculate mouse and keyboard percentages from overall progress
  // This is a simplified calculation - in real app, this would come from actual data
  const calculateActivityBreakdown = (overallProgress: number) => {
    // Simulate mouse and keyboard activity based on overall progress
    // Mouse activity is typically higher than keyboard
    const mousePercentage = Math.round(overallProgress * 0.68) // ~68% of overall
    const keyboardPercentage = Math.round(overallProgress * 0.49) // ~49% of overall
    return {
      overall: overallProgress,
      mouse: mousePercentage,
      keyboard: keyboardPercentage
    }
  }

  const activityBreakdown = showNoActivity ? { overall: 0, mouse: 0, keyboard: 0 } : calculateActivityBreakdown(item.progress)

  // Jika tidak ada activity DAN bukan dari delete (placeholder), hanya tampilkan block sederhana
  if (showNoActivity && !isDeleted && (!item.time || item.time === "")) {
    return (
      <div className="flex aspect-video items-center justify-center rounded border border-slate-200 bg-slate-50 text-xs text-slate-400">
        No activity
      </div>
    )
  }

  // Jika dihapus atau tidak ada activity, tampilkan card lengkap tapi gambar diganti "No activity"
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-md transition-all duration-200 hover:shadow-lg group/card relative hover:z-[60]">
      <div className="p-3">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="truncate text-[11px] font-bold text-slate-900 tracking-tight">PT Aman Sejahtera...</h3>
            <p className="text-[10px] text-slate-400 font-medium">No to-dos</p>
          </div>
        </div>

        <div
          className="relative mb-2 aspect-video w-full overflow-hidden rounded-lg border border-slate-100 bg-slate-50 group/image"
        >
          {showNoActivity ? (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-slate-400">
              No activity
            </div>
          ) : (
            <>
              <img
                src={item.image}
                alt="Screenshot"
                className={`h-full w-full object-cover transition-all duration-300 ${shouldBlur ? "blur-md scale-105" : "scale-100 group-hover/image:scale-105"}`}
                style={{
                  filter: shouldBlur ? "blur(8px)" : "none",
                  WebkitFilter: shouldBlur ? "blur(8px)" : "none"
                }}
              />

              {/* Hover Overlay */}
              <div className={`absolute inset-0 transition-opacity duration-200 flex flex-col justify-between p-2 z-10 ${isSelected ? "bg-black/40 opacity-100" : "bg-black/50 opacity-0 group-hover/image:opacity-100"
                }`}>
                {/* Top Controls */}
                <div className="flex items-start justify-between">
                  {/* Selection Circle */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect?.(!isSelected)
                    }}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${isSelected ? "bg-[#0070f3] border-[#0070f3]" : "border-white/80 hover:border-white bg-black/20"
                      }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteImage?.()
                      }}
                      className="p-1 rounded bg-black/20 hover:bg-black/40 text-white/90 transition-all"
                      title="Hapus screenshot saja"
                    >
                      <ImageMinus className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (item.image) window.open(item.image, "_blank")
                      }}
                      className="p-1 rounded bg-black/20 hover:bg-black/40 text-white/90 transition-all"
                      title="Buka gambar di tab baru"
                    >
                      <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete?.()
                      }}
                      className="p-1 rounded bg-black/20 hover:bg-black/60 text-white/90 transition-all hover:text-red-400"
                      title="Hapus seluruh card kerja"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Center Button */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <button
                    onClick={onImageClick}
                    className="pointer-events-auto bg-white text-slate-800 text-[11px] font-bold px-4 py-1.5 rounded-md shadow-lg transform translate-y-2 opacity-0 group-hover/image:translate-y-0 group-hover/image:opacity-100 transition-all duration-300"
                  >
                    View screens
                  </button>
                </div>

                {/* Bottom Center Pill */}
                <div className="flex justify-center w-full">
                  <div className="bg-white/90 backdrop-blur-sm text-[#0070f3] text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                    {item.screenCount || 1} screen{item.screenCount && item.screenCount > 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mb-3 mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-slate-600 tracking-tight">{item.time}</span>
            {item.notes && (
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Ada catatan" />
            )}
          </div>
          {!showNoActivity && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddNote?.()
              }}
              className={`${item.notes ? 'text-amber-500' : 'text-slate-400'} hover:text-amber-600 transition-colors`}
              title={item.notes ? "Edit catatan" : "Tambah catatan"}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
        </div>
        <div className="space-y-1 relative overflow-visible">
          <div
            className="h-2 w-full rounded-full bg-slate-200 relative overflow-visible"
            onMouseEnter={() => !showNoActivity && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${showNoActivity ? 0 : item.progress}%`,
                backgroundColor: showNoActivity ? "#e5e7eb" : getProgressColor(item.progress),
              }}
            />
          </div>
          {/* Tooltip - positioned below the progress bar, outside the progress bar container */}
          {isHovered && !showNoActivity && (
            <>
              {/* Vertical line connecting tooltip to progress bar */}
              <div
                className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none z-40"
                style={{
                  top: '100%',
                  height: '8px',
                  width: '1px',
                  backgroundColor: '#4b5563'
                }}
              />
              <div
                className="absolute px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg z-50 min-w-[180px] pointer-events-none opacity-90"
                style={{
                  top: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="space-y-1">
                  <div className="font-semibold">Overall: {activityBreakdown.overall}%</div>
                  <div className="h-px bg-gray-600 my-1"></div>
                  <div className="text-gray-300">
                    Mouse: {activityBreakdown.mouse}% Keyboard: {activityBreakdown.keyboard}%
                  </div>
                </div>
                {/* Arrow pointing up */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-2 h-2 bg-gray-800 transform rotate-45"></div>
                </div>
              </div>
            </>
          )}
          <p className="text-[10px] text-slate-500">
            {showNoActivity ? "0% of 0 minutes" : `${item.progress}% of ${item.seconds ? `${item.minutes} seconds` : `${item.minutes} minutes`}`}
          </p>
        </div>
      </div>
    </div>
  )
}

