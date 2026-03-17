"use client"

import { X, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DownloadDialogProps {
    isOpen: boolean
    onClose: () => void
}

export function DownloadDialog({ isOpen, onClose }: DownloadDialogProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-800">Download screenshots</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-5">
                    {/* Member Input */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-500">MEMBER*</label>
                        <div className="relative">
                            <select className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                                <option>Muhammad Ma'Arif</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Date Range Input */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-500">DATE RANGE*</label>
                        <div className="relative">
                            <input
                                type="text"
                                readOnly
                                value="Thu, Jan 15, 2026 - Thu, Jan 22, 2026"
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-blue-500">
                                <Calendar className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="rounded-lg border-slate-300 px-6 font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onClose}
                        className="rounded-lg bg-blue-500 px-8 font-medium hover:bg-blue-600"
                    >
                        Save
                    </Button>
                </div>
            </div>
        </div>
    )
}
