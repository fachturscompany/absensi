"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Search, Lightbulb, Info, Globe, Monitor } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    getProductivityCategories,
    getUnclassifiedItems,
    upsertProductivityCategory
} from "@/action/productivity"
import { useOrgStore } from "@/store/org-store"
import { toast } from "sonner"
import { SettingsHeader, SettingTab } from "@/components/settings/SettingsHeader"
import { SidebarItem } from "@/components/settings/SettingsSidebar"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Filter } from "lucide-react"

// Keep interfaces but update UrlEntry to match DB structure better
interface UrlEntry {
    id: string | number
    name: string
    icon: "globe" | "monitor"
    classification: "core-work" | "non-core-work" | "unproductive"
    category: string
    match_type: 'app_name' | 'domain' | 'url_pattern'
    productivity_score: number
    db_id?: number
}

export default function AppUrlPage() {
    const { organizationId } = useOrgStore()
    const [urls, setUrls] = useState<UrlEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [jobType, setJobType] = useState("all")
    const [sortBy, setSortBy] = useState("most-common")
    const [showFilterDialog, setShowFilterDialog] = useState(false)

    // Fetch data from DB
    const fetchData = useCallback(async () => {
        if (!organizationId) return
        setIsLoading(true)

        const [catRes, unRes] = await Promise.all([
            getProductivityCategories(organizationId),
            getUnclassifiedItems(organizationId)
        ])

        const mergedItems: UrlEntry[] = []

        // 1. Add classified items
        if (catRes.success && catRes.data) {
            catRes.data.forEach(item => {
                mergedItems.push({
                    id: item.id || `db-${item.match_pattern}`,
                    db_id: item.id,
                    name: item.match_pattern,
                    icon: item.match_type === 'app_name' ? 'monitor' : 'globe',
                    classification: item.is_productive,
                    category: item.name,
                    match_type: item.match_type,
                    productivity_score: item.productivity_score
                })
            })
        }

        // 2. Add unclassified items (if not already in mergedItems)
        if (unRes.success && unRes.data) {
            unRes.data.forEach(item => {
                const alreadyExists = mergedItems.find(m => m.match_type === item.type && m.name === item.name)
                if (!alreadyExists) {
                    mergedItems.push({
                        id: `unc-${item.type}-${item.name}`,
                        name: item.name,
                        icon: item.type === 'app_name' ? 'monitor' : 'globe',
                        classification: 'non-core-work', // default
                        category: 'Uncategorized',
                        match_type: item.type,
                        productivity_score: 0
                    })
                }
            })
        }

        setUrls(mergedItems)
        setIsLoading(false)
    }, [organizationId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Handle ESC key to close dialog
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && showFilterDialog) {
                setShowFilterDialog(false)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [showFilterDialog])
    const [filterClassification, setFilterClassification] = useState("")
    const [filterTypeOfItems, setFilterTypeOfItems] = useState("")

    // Filter data berdasarkan search query dan sidebar filters
    const filteredUrls = urls.filter(url => {
        const matchesSearch = url.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesClassification = !filterClassification || url.classification === filterClassification

        let matchesType = true
        if (filterTypeOfItems === 'apps') matchesType = url.match_type === 'app_name'
        else if (filterTypeOfItems === 'urls') matchesType = url.match_type === 'domain' || url.match_type === 'url_pattern'

        return matchesSearch && matchesClassification && matchesType
    })

    // Handle classification change
    const handleClassificationChange = async (url: UrlEntry, newClassification: "core-work" | "non-core-work" | "unproductive") => {
        if (!organizationId) return

        // Optimistic UI update
        setUrls(prev =>
            prev.map(item =>
                item.id === url.id ? { ...item, classification: newClassification } : item
            )
        )

        // Generate score based on classification
        let score = 0
        if (newClassification === 'core-work') score = 90
        else if (newClassification === 'non-core-work') score = 0
        else score = -90

        const res = await upsertProductivityCategory({
            organization_id: Number(organizationId),
            name: url.category,
            match_type: url.match_type,
            match_pattern: url.name,
            productivity_score: score,
            is_productive: newClassification
        })

        if (!res.success) {
            toast.error("Failed to save classification")
            // Rollback if failure
            fetchData()
        } else {
            toast.success("Classification saved")
        }
    }

    // Handle Category change
    const handleCategoryChange = async (url: UrlEntry, newCategory: string) => {
        if (!organizationId) return

        // Optimistic UI update
        setUrls(prev =>
            prev.map(item =>
                item.id === url.id ? { ...item, category: newCategory } : item
            )
        )

        const res = await upsertProductivityCategory({
            organization_id: Number(organizationId),
            name: newCategory,
            match_type: url.match_type,
            match_pattern: url.name,
            productivity_score: url.productivity_score,
            is_productive: url.classification
        })

        if (!res.success) {
            toast.error("Failed to save category")
            fetchData()
        } else {
            toast.success("Category updated")
        }
    }

    const tabs: SettingTab[] = [
        { label: "APP/URL", href: "/settings/app-url", active: true },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "classification", label: "Classification", href: "/settings/app-url" },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Insights"
                Icon={Lightbulb}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="classification"
            />

            <div className="flex flex-1 w-full">
                {/* Main Content */}
                <div className="flex-1 p-4 md:p-6 w-full overflow-x-hidden">
                    {/* Section Title */}
                    <div className="mb-2">
                        <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                            APP/URL CLASSIFICATION
                        </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-6">
                        Classify apps & URLs for different job roles across your organization. Default ratings can be overridden at the job title level.
                    </p>

                    {/* Notice & Search Row */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-2 text-gray-600">
                            <div className="w-4 h-4 rounded-full border-2 border-gray-500 flex items-center justify-center shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                            </div>
                            <span className="text-sm">
                                You&apos;ll be notified via Email about any fake activity generator apps or URLs being used
                            </span>
                        </div>
                        <div className="relative w-full lg:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search apps & URLs"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-10 border-gray-300 rounded-full bg-white"
                            />
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                            {/* Job Type Filter */}
                            <div className="flex flex-col w-full sm:w-auto">
                                <span className="text-[10px] font-normal text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                                    JOB TYPE
                                    <Info className="w-3 h-3" />
                                </span>
                                <Select value={jobType} onValueChange={setJobType}>
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
                                <Select value={sortBy} onValueChange={setSortBy}>
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
                        <Sheet open={showFilterDialog} onOpenChange={setShowFilterDialog}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-10 px-6 border-gray-900 text-gray-900 hover:bg-gray-100 rounded-full font-medium w-full sm:w-auto"
                                >
                                    <Filter className="w-4 h-4 mr-2" />
                                    Filters
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] sm:w-[500px] p-6">
                                <SheetHeader className="mb-6">
                                    <SheetTitle className="text-sm font-normal text-gray-400 uppercase tracking-wider text-left">FILTERS</SheetTitle>
                                    <div className="w-16 h-0.5 bg-gray-400"></div>
                                </SheetHeader>

                                {/* Classification Filter */}
                                <div className="mb-6">
                                    <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider block mb-2">
                                        CLASSIFICATION
                                    </span>
                                    <Select value={filterClassification} onValueChange={setFilterClassification}>
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
                                    <Select value={filterTypeOfItems} onValueChange={setFilterTypeOfItems}>
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
                                    onClick={() => {
                                        setFilterClassification("")
                                        setFilterTypeOfItems("")
                                    }}
                                >
                                    Clear filters
                                </Button>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Table Header - Hidden on mobile */}
                    <div className="hidden sm:grid grid-cols-3 gap-4 py-3 border-b border-gray-200">
                        <span className="text-xs font-normal text-gray-600 uppercase">App/URL</span>
                        <span className="text-xs font-normal text-gray-600 uppercase text-center">Classification</span>
                        <span className="text-xs font-normal text-gray-600 uppercase text-right flex items-center justify-end gap-1">
                            Category
                            <Info className="w-3 h-3 text-gray-400" />
                        </span>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-200">
                        {isLoading ? (
                            <div className="py-12 text-center text-sm text-gray-500">
                                Loading apps & URLs...
                            </div>
                        ) : filteredUrls.length === 0 ? (
                            <div className="py-12 text-center text-sm text-gray-500">
                                No apps or URLs found matching your search.
                            </div>
                        ) : (
                            filteredUrls.map((url) => (
                                <div key={url.id} className="flex flex-col gap-4 sm:grid sm:grid-cols-3 sm:gap-4 py-6 sm:py-5 items-start sm:items-center hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0 px-1">
                                    {/* App/URL Column */}
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                            {url.icon === "globe" ? (
                                                <Globe className="w-5 h-5 text-slate-400" />
                                            ) : (
                                                <Monitor className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-medium text-slate-900 truncate uppercase tracking-tight">{url.name}</span>
                                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest sm:hidden">App/URL Name</span>
                                        </div>
                                    </div>

                                    {/* Classification Column */}
                                    <div className="w-full flex flex-col gap-1.5 sm:block">
                                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest sm:hidden ml-1">Classification</span>
                                        <div className="inline-flex rounded-2xl bg-slate-100 p-1 w-full sm:w-fit shadow-inner">
                                            <button
                                                onClick={() => handleClassificationChange(url, "core-work")}
                                                className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 text-[10px] sm:text-xs font-medium rounded-xl transition-all uppercase tracking-widest ${url.classification === "core-work"
                                                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                                    : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                                                    }`}
                                            >
                                                Core
                                            </button>
                                            <button
                                                onClick={() => handleClassificationChange(url, "non-core-work")}
                                                className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 text-[10px] sm:text-xs font-medium rounded-xl transition-all uppercase tracking-widest ${url.classification === "non-core-work"
                                                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                                    : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                                                    }`}
                                            >
                                                Non-core
                                            </button>
                                            <button
                                                onClick={() => handleClassificationChange(url, "unproductive")}
                                                className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 text-[10px] sm:text-xs font-medium rounded-xl transition-all uppercase tracking-widest ${url.classification === "unproductive"
                                                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                                    : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                                                    }`}
                                            >
                                                Unproductive
                                            </button>
                                        </div>
                                    </div>

                                    {/* Category Column */}
                                    <div className="flex flex-col w-full sm:items-end gap-1.5 min-w-0">
                                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest sm:hidden ml-1">Category</span>
                                        <Select
                                            value={url.category}
                                            onValueChange={(val) => handleCategoryChange(url, val)}
                                        >
                                            <SelectTrigger className="w-full sm:w-[180px] h-10 border-slate-200 bg-white rounded-xl text-xs font-medium text-slate-700 hover:border-slate-300 transition-all focus:ring-slate-900">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-200">
                                                <SelectItem value="Entertainment" className="text-xs font-medium uppercase tracking-wider">Entertainment</SelectItem>
                                                <SelectItem value="Uncategorized" className="text-xs font-medium uppercase tracking-wider">Uncategorized</SelectItem>
                                                <SelectItem value="Development" className="text-xs font-medium uppercase tracking-wider">Development</SelectItem>
                                                <SelectItem value="Communication" className="text-xs font-medium uppercase tracking-wider">Communication</SelectItem>
                                                <SelectItem value="Design" className="text-xs font-medium uppercase tracking-wider">Design</SelectItem>
                                                <SelectItem value="Productivity" className="text-xs font-medium uppercase tracking-wider">Productivity</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
