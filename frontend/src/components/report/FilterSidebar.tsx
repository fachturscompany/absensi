"use client"

import { X } from "lucide-react"
import { ReactNode, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"

interface FilterSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title?: string
    children: ReactNode
    onApply: () => void
    onClear: () => void
    className?: string
}

export function FilterSidebar({
    open,
    onOpenChange,
    title = "Filters",
    children,
    onApply,
    onClear,
    onReset,
    className
}: FilterSidebarProps & { onReset?: () => void }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && open) {
                onOpenChange(false)
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [open, onOpenChange])

    if (!mounted) return null

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={() => onOpenChange(false)}
            />

            {/* Sidebar */}
            <div className={`fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-950 shadow-xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"} ${className}`}>
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
                    <button onClick={() => onOpenChange(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {children}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col gap-2">
                    <Button
                        onClick={onApply}
                        className="w-full bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                    >
                        Apply filters
                    </Button>
                    <div className="flex gap-2">
                        {onReset && (
                            <Button
                                variant="outline"
                                onClick={onReset}
                                className="flex-1 text-gray-600 border-gray-300 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800"
                            >
                                Reset
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            onClick={onClear}
                            className={`text-gray-500 hover:text-gray-700 hover:bg-transparent dark:text-gray-400 dark:hover:text-gray-200 ${onReset ? 'flex-1' : 'w-full'}`}
                        >
                            Clear filters
                        </Button>
                    </div>
                </div>
            </div>
        </>,
        document.body
    )
}

export function FilterSection({ title, children }: { title?: string, children: ReactNode }) {
    return (
        <div className="space-y-3">
            {title && <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">{title}</h3>}
            <div className="space-y-4">
                {children}
            </div>
        </div>
    )
}

export function FilterSubsection({ title, children, onClear }: { title: string, children: ReactNode, onClear?: () => void }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</label>
                {onClear && (
                    <button
                        onClick={onClear}
                        className="text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                        CLEAR
                    </button>
                )}
            </div>
            {children}
        </div>
    )
}
