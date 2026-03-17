"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Settings2, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface ScheduleBatchActionsProps {
    selectedCount: number
    onClear: () => void
    onEditStatus: () => void
    onDelete: () => void
}

export default function ScheduleBatchActions({
    selectedCount,
    onClear,
    onEditStatus,
    onDelete,
}: ScheduleBatchActionsProps) {
    if (selectedCount === 0) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, y: 50, x: "-50%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={cn(
                    "fixed bottom-8 left-1/2 z-50",
                    "flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border",
                    "bg-white dark:bg-zinc-950",
                    "border-zinc-200 dark:border-zinc-800",
                    "text-zinc-900 dark:text-zinc-50",
                    "ring-1 ring-black/5 dark:ring-white/5",
                    "w-max h-14"
                )}
            >
                <div className="flex items-center gap-2 pr-4 border-r border-zinc-200 dark:border-zinc-800">
                    <span className="flex items-center justify-center h-6 min-w-[24px] px-1.5 text-xs font-bold rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {selectedCount}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Selected
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-3 text-xs font-bold uppercase tracking-tight hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={onEditStatus}
                    >
                        <Settings2 className="w-4 h-4 mr-2" />
                        Edit Status
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-3 text-xs font-bold uppercase tracking-tight text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-700 dark:hover:text-red-300"
                        onClick={onDelete}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                </div>

                <Separator orientation="vertical" className="h-6 bg-zinc-200 dark:bg-zinc-800 mx-1" />

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    onClick={onClear}
                >
                    <X className="w-4 h-4" />
                </Button>
            </motion.div>
        </AnimatePresence>
    )
}
