"use client"

import React from "react"
import { Search, Filter, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface TimesheetsToolbarProps {
    searchQuery: string
    onSearchQueryChange: (query: string) => void
    onFilterClick: () => void
    onAddTimeClick: () => void
}

export function TimesheetsToolbar({
    searchQuery,
    onSearchQueryChange,
    onFilterClick,
    onAddTimeClick,
}: TimesheetsToolbarProps) {
    return (
        <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center bg-white dark:!bg-black border border-gray-200 dark:!border-white/10 rounded-md overflow-hidden h-10 w-full sm:w-auto focus-within:ring-1 focus-within:ring-gray-400 dark:focus-within:ring-white/20 transition-all shadow-sm">
                <div className="flex items-center px-3 text-gray-400 shrink-0">
                    <Search className="w-4 h-4" />
                </div>
                <input
                    type="text"
                    placeholder="Search..."
                    className="flex-1 h-full bg-transparent border-none outline-none text-sm px-1 min-w-[120px] sm:w-48 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                />
                <div className="w-[1px] h-6 bg-gray-200 dark:bg-white/10 shrink-0" />
                <button
                    onClick={onFilterClick}
                    className="flex items-center gap-2 px-3 h-full hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors shrink-0"
                >
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filter</span>
                </button>
            </div>
            
            <Button
                variant="outline"
                className="h-10 dark:!bg-transparent dark:!border-white/10 dark:hover:!bg-white/5 w-full sm:w-auto shadow-sm"
                onClick={onAddTimeClick}
            >
                <Plus className="w-4 h-4 mr-2" />
                Add Time
            </Button>
        </div>
    )
}
