"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Lightbulb } from "lucide-react"
import {
    getProductivityCategories,
    getUnclassifiedItems,
    upsertProductivityCategory
} from "@/action/productivity"
import { useOrgStore } from "@/store/org-store"
import { toast } from "sonner"
import { SettingsHeader, SettingsContentLayout, type SettingTab } from "@/components/settings/SettingsHeader"
import { type SidebarItem } from "@/components/settings/SettingsSidebar"
import { AppUrlClassificationTable, type UrlEntry } from "@/components/settings/app-url/AppUrlClassificationTable"
import { ClassificationFilters } from "@/components/settings/app-url/ClassificationFilters"


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
        }
    }
    const tabs: SettingTab[] = [
        { label: "APP/URL", href: "/settings/app-url", active: true },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "classification", label: "Classification", href: "/settings/app-url" },
        { id: "exceptions", label: "Team exceptions", href: "/settings/app-url/exceptions" },
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
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="classification">

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

                        <ClassificationFilters
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            jobType={jobType}
                            onJobTypeChange={setJobType}
                            sortBy={sortBy}
                            onSortByChange={setSortBy}
                            showFilterDialog={showFilterDialog}
                            onOpenFilterDialog={setShowFilterDialog}
                            filterClassification={filterClassification}
                            onFilterClassificationChange={setFilterClassification}
                            filterTypeOfItems={filterTypeOfItems}
                            onFilterTypeOfItemsChange={setFilterTypeOfItems}
                            onClearFilters={() => {
                                setFilterClassification("")
                                setFilterTypeOfItems("")
                            }}
                        />

                        <AppUrlClassificationTable
                            urls={filteredUrls}
                            isLoading={isLoading}
                            onClassificationChange={handleClassificationChange}
                            onCategoryChange={handleCategoryChange}
                        />

                    </div>
                </div>

            </SettingsContentLayout>
        </div >
    )
}
