"use client"

import { Pencil } from "lucide-react"

interface ScreenshotCardProps {
    screenshot: {
        projectName: string
        todosLabel: string
        imageUrl?: string
        screenCount: number
        timeRange: string
        activityProgress: number
        minutes: number
        seconds?: boolean
        noActivity?: boolean
    }
}

export function ScreenshotCard({ screenshot }: ScreenshotCardProps) {
    const getProgressColor = (progress: number) => {
        if (progress < 30) return '#facc15'
        if (progress < 50) return '#fb923c'
        if (progress < 70) return '#a3e635'
        return '#22c55e'
    }

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="p-3">
                <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="truncate text-xs font-medium text-slate-700">{screenshot.projectName}</h3>
                        <p className="text-[10px] text-slate-400">{screenshot.todosLabel}</p>
                    </div>
                </div>

                {screenshot.noActivity ? (
                    <div className="mb-2 flex aspect-video items-center justify-center rounded border border-slate-200 bg-slate-50 text-xs text-slate-400">
                        No activity
                    </div>
                ) : (
                    <div className="relative mb-2 aspect-video overflow-hidden rounded border border-slate-200 bg-slate-50">
                        {screenshot.imageUrl && (
                            <img
                                src={screenshot.imageUrl}
                                alt="Screenshot"
                                className="h-full w-full object-cover"
                            />
                        )}
                    </div>
                )}

                <div className="mb-2 text-center text-xs font-medium text-blue-600">
                    {screenshot.screenCount} screen{screenshot.screenCount !== 1 ? 's' : ''}
                </div>

                <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-slate-600">{screenshot.timeRange}</span>
                    <button className="text-slate-400 hover:text-slate-600">
                        <Pencil className="h-3 w-3" />
                    </button>
                </div>

                <div className="space-y-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: `${screenshot.activityProgress}%`,
                                backgroundColor: getProgressColor(screenshot.activityProgress)
                            }}
                        />
                    </div>
                    <p className="text-[10px] text-slate-500">
                        {screenshot.activityProgress}% of {screenshot.seconds ? `${screenshot.minutes} seconds` : `${screenshot.minutes} minutes`}
                    </p>
                </div>
            </div>
        </div>
    )
}
