"use client"

import React from "react"
import { Globe, Monitor, Info } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface UrlEntry {
    id: string | number
    name: string
    icon: "globe" | "monitor"
    classification: "core-work" | "non-core-work" | "unproductive"
    category: string
    match_type: 'app_name' | 'domain' | 'url_pattern'
    productivity_score: number
    db_id?: number
}

interface AppUrlClassificationTableProps {
    urls: UrlEntry[]
    isLoading: boolean
    onClassificationChange: (url: UrlEntry, newClassification: "core-work" | "non-core-work" | "unproductive") => void
    onCategoryChange: (url: UrlEntry, newCategory: string) => void
}

export function AppUrlClassificationTable({
    urls,
    isLoading,
    onClassificationChange,
    onCategoryChange
}: AppUrlClassificationTableProps) {
    return (
        <div className="mt-8">
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
                ) : urls.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-500">
                        No apps or URLs found matching your search.
                    </div>
                ) : (
                    urls.map((url) => (
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
                                        onClick={() => onClassificationChange(url, "core-work")}
                                        className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 text-[10px] sm:text-xs font-medium rounded-xl transition-all uppercase tracking-widest ${url.classification === "core-work"
                                            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                            : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                                            }`}
                                    >
                                        Core
                                    </button>
                                    <button
                                        onClick={() => onClassificationChange(url, "non-core-work")}
                                        className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 text-[10px] sm:text-xs font-medium rounded-xl transition-all uppercase tracking-widest ${url.classification === "non-core-work"
                                            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                            : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                                            }`}
                                    >
                                        Non-core
                                    </button>
                                    <button
                                        onClick={() => onClassificationChange(url, "unproductive")}
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
                                    onValueChange={(val) => onCategoryChange(url, val)}
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
    )
}
