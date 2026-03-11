"use client"

import React from "react"
import { SearchBar } from "@/components/customs/search-bar"
import { Info, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

interface ClassificationFiltersProps {
    searchQuery: string
    onSearchChange: (value: string) => void
    jobType: string
    onJobTypeChange: (value: string) => void
    sortBy: string
    onSortByChange: (value: string) => void
    showFilterDialog: boolean
    onOpenFilterDialog: (open: boolean) => void
    filterClassification: string
    onFilterClassificationChange: (value: string) => void
    filterTypeOfItems: string
    onFilterTypeOfItemsChange: (value: string) => void
    onClearFilters: () => void
}

export function ClassificationFilters({
    searchQuery,
    onSearchChange,
    jobType,
    onJobTypeChange,
    sortBy,
    onSortByChange,
    showFilterDialog,
    onOpenFilterDialog,
    filterClassification,
    onFilterClassificationChange,
    filterTypeOfItems,
    onFilterTypeOfItemsChange,
    onClearFilters
}: ClassificationFiltersProps) {
    return (
        <div className="space-y-8">
            {/* Notice & Search Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-500 flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                    </div>
                    <span className="text-sm">
                        You&apos;ll be notified via Email about any fake activity generator apps or URLs being used
                    </span>
                </div>
                <div className="relative w-full lg:w-64">
                    <SearchBar
                        placeholder="Search apps & URLs"
                        initialQuery={searchQuery}
                        onSearch={onSearchChange}
                        className="h-10 border-gray-300 rounded-full bg-white"
                    />
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    {/* Job Type Filter */}
                    <div className="flex flex-col w-full sm:w-auto">
                        <span className="text-[10px] font-normal text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                            JOB TYPE
                            <Info className="w-3 h-3" />
                        </span>
                        <Select value={jobType} onValueChange={onJobTypeChange}>
                            <SelectTrigger className="w-full sm:w-[180px] h-10 border-gray-300 bg-white">
                                <SelectValue placeholder="All job types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All job types</SelectItem>
                                <SelectItem value="developer">Developer</SelectItem>
                                <SelectItem value="designer">Designer</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sort By Filter */}
                    <div className="flex flex-col w-full sm:w-auto">
                        <span className="text-[10px] font-normal text-gray-400 uppercase mb-1.5">
                            SORT BY
                        </span>
                        <Select value={sortBy} onValueChange={onSortByChange}>
                            <SelectTrigger className="w-full sm:w-[180px] h-10 border-gray-300 bg-white">
                                <SelectValue placeholder="Most common" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="most-common">Most common</SelectItem>
                                <SelectItem value="alphabetical">Alphabetical</SelectItem>
                                <SelectItem value="recently-added">Recently added</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Filters Button with Sheet */}
                <Sheet open={showFilterDialog} onOpenChange={onOpenFilterDialog}>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            className="h-10 px-6 border-gray-900 text-gray-900 hover:bg-gray-100 rounded-full font-medium w-full sm:w-auto"
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filters
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] sm:w-[500px] p-6 text-slate-900">
                        <SheetHeader className="mb-6">
                            <SheetTitle className="text-sm font-normal text-gray-400 uppercase tracking-wider text-left">FILTERS</SheetTitle>
                            <div className="w-16 h-0.5 bg-gray-400"></div>
                        </SheetHeader>

                        {/* Classification Filter */}
                        <div className="mb-6">
                            <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider block mb-2">
                                CLASSIFICATION
                            </span>
                            <Select value={filterClassification} onValueChange={onFilterClassificationChange}>
                                <SelectTrigger className="w-full h-11 border-gray-300 bg-white">
                                    <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="core-work">Core work</SelectItem>
                                    <SelectItem value="non-core-work">Non-core work</SelectItem>
                                    <SelectItem value="unproductive">Unproductive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Type of Items Filter */}
                        <div className="mb-8">
                            <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider block mb-2">
                                TYPE OF ITEMS
                            </span>
                            <Select value={filterTypeOfItems} onValueChange={onFilterTypeOfItemsChange}>
                                <SelectTrigger className="w-full h-11 border-gray-300 bg-white">
                                    <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="apps">Apps</SelectItem>
                                    <SelectItem value="urls">URLs</SelectItem>
                                    <SelectItem value="all">All</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Clear Filters Button */}
                        <Button
                            variant="outline"
                            className="w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                            onClick={onClearFilters}
                        >
                            Clear filters
                        </Button>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    )
}
