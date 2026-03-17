"use client"

import { useEffect } from "react"
import { X, Bell, Grid3x3 } from "lucide-react"

interface AddNotificationChoiceDialogProps {
    isOpen: boolean
    onClose: () => void
    onSelectCustom: () => void
    onSelectTemplate: () => void
}

export function AddNotificationChoiceDialog({
    isOpen,
    onClose,
    onSelectCustom,
    onSelectTemplate
}: AddNotificationChoiceDialogProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        if (isOpen) {
            window.addEventListener("keydown", handleEsc)
        }
        return () => window.removeEventListener("keydown", handleEsc)
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transition-all transform scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-xl font-semibold text-gray-900">Add a smart notification</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 gap-6">
                        <button
                            onClick={onSelectCustom}
                            className="group flex flex-col items-center p-8 border-2 border-gray-100 rounded-2xl hover:border-zinc-900 hover:bg-zinc-50/50 transition-all text-center"
                        >
                            <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Bell className="w-8 h-8 text-zinc-900" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Create a custom notification</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Define your own metrics, conditions, and recipients from scratch.
                            </p>
                        </button>

                        <button
                            onClick={onSelectTemplate}
                            className="group flex flex-col items-center p-8 border-2 border-gray-100 rounded-2xl hover:border-zinc-900 hover:bg-zinc-50/50 transition-all text-center"
                        >
                            <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Grid3x3 className="w-8 h-8 text-zinc-900" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Choose from our templates</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Pick from our curated list of 12 proven notification templates.
                            </p>
                        </button>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200 bg-white"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
