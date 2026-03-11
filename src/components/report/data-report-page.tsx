"use client"

import React, { useState, useMemo } from "react"
import { ReportPageLayout } from "@/components/report/report-page-layout"
import { Button } from "@/components/ui/button"
import { Download, CalendarIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { PaginationFooter } from "@/components/tables/pagination-footer"
import { SearchBar } from "@/components/customs/search-bar"
import { exportToCSV, generateFilename } from "@/lib/export-utils"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export interface ColumnDef<T> {
    key: keyof T | string
    label: string
    align?: 'left' | 'center' | 'right'
    render?: (value: unknown, row: T) => React.ReactNode
    format?: (value: unknown) => string
}

export interface FilterOption {
    value: string
    label: string
}

export interface DataReportPageProps<T> {
    title: string
    data: T[]
    columns: ColumnDef<T>[]
    searchKeys?: (keyof T)[]
    searchPlaceholder?: string
    filterOptions?: {
        key: string
        label: string
        options: FilterOption[]
        dataKey: keyof T
    }[]
    summaryCards?: {
        label: string
        value: string | number
        format?: 'currency' | 'number' | 'hours' | 'percent'
    }[]
    exportFilename?: string
    getRowKey: (row: T) => string
}

export function DataReportPage<T>({
    title,
    data,
    columns,
    searchKeys = [],
    searchPlaceholder = "Search...",
    filterOptions = [],
    summaryCards = [],
    exportFilename,
    getRowKey,
}: DataReportPageProps<T>) {
    // Filters
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(2026, 0, 1),
        to: new Date(2026, 0, 31),
    })
    const [search, setSearch] = useState("")
    const [filters, setFilters] = useState<Record<string, string>>({})

    // Pagination
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Filtered Data
    const filteredData = useMemo(() => {
        return data.filter(item => {
            // Search filter
            if (search && searchKeys.length > 0) {
                const searchLower = search.toLowerCase()
                const matchesSearch = searchKeys.some(key => {
                    const value = item[key]
                    return String(value).toLowerCase().includes(searchLower)
                })
                if (!matchesSearch) return false
            }

            // Custom filters
            for (const filterOpt of filterOptions) {
                const filterValue = filters[filterOpt.key]
                if (filterValue && filterValue !== 'all') {
                    if (String(item[filterOpt.dataKey]) !== filterValue) {
                        return false
                    }
                }
            }

            return true
        })
    }, [data, search, searchKeys, filters, filterOptions])

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredData.slice(start, start + pageSize)
    }, [filteredData, page, pageSize])

    const totalPages = Math.ceil(filteredData.length / pageSize)

    // Export Handler
    const handleExport = () => {
        exportToCSV({
            filename: generateFilename(exportFilename || title.toLowerCase().replace(/\s+/g, '-')),
            columns: columns.map(col => ({
                key: String(col.key),
                label: col.label,
                format: col.format
            })),
            data: filteredData
        })
        toast.success("Exported successfully")
    }

    const formatSummaryValue = (value: string | number, format?: string) => {
        if (format === 'currency' && typeof value === 'number') {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)
        }
        if (format === 'hours' && typeof value === 'number') {
            return `${value.toFixed(1)} h`
        }
        if (format === 'percent' && typeof value === 'number') {
            return `${value.toFixed(1)}%`
        }
        return String(value)
    }

    const getValue = (row: T, key: keyof T | string): unknown => {
        if (typeof key === 'string' && key.includes('.')) {
            const keys = key.split('.')
            let value: object = row as object
            for (const k of keys) {
                value = (value as Record<string, unknown>)[k] as object
            }
            return value
        }
        return row[key as keyof T]
    }

    return (
        <ReportPageLayout
            title={title}
            breadcrumbs={[
                { label: "Reports", href: "/reports/all" },
                { label: title }
            ]}
            actions={
                <Button onClick={handleExport} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export
                </Button>
            }
            filters={
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Search */}
                        {searchKeys.length > 0 && (
                            <div className="relative w-[240px]">
                                <SearchBar
                                    placeholder={searchPlaceholder}
                                    initialQuery={search}
                                    onSearch={setSearch}
                                    className="bg-white"
                                />
                            </div>
                        )}

                        {/* Custom Filters */}
                        {filterOptions.map(filterOpt => (
                            <Select
                                key={filterOpt.key}
                                value={filters[filterOpt.key] || 'all'}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, [filterOpt.key]: value }))}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder={filterOpt.label} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All {filterOpt.label}</SelectItem>
                                    {filterOpt.options.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ))}

                        {/* Date Picker */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                        date.to ? (
                                            <>
                                                {format(date.from, "LLL dd, y")} -{" "}
                                                {format(date.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(date.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            }
        >
            <style jsx global>{`
                html body .custom-hover-row:hover,
                html body .custom-hover-row:hover > td {
                    background-color: #d1d5db !important;
                }
                html body.dark .custom-hover-row:hover,
                html body.dark .custom-hover-row:hover > td {
                    background-color: #374151 !important;
                }
            `}</style>

            <div className="bg-white border rounded-lg shadow-sm">
                {/* Summary Cards */}
                {summaryCards.length > 0 && (
                    <div className={cn(
                        "grid divide-y md:divide-y-0 md:divide-x border-b bg-gray-50/50",
                        `grid-cols-1 md:grid-cols-${Math.min(summaryCards.length, 4)}`
                    )}>
                        {summaryCards.map((card, idx) => (
                            <div key={idx} className="p-4">
                                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatSummaryValue(card.value, card.format)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                            <tr>
                                {columns.map((col, idx) => (
                                    <th
                                        key={idx}
                                        className={cn(
                                            "p-4",
                                            col.align === 'right' && "text-right",
                                            col.align === 'center' && "text-center"
                                        )}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="p-8 text-center text-gray-500">
                                        No data found for the selected filters
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((row, rowIdx) => (
                                    <tr
                                        key={getRowKey(row)}
                                        style={{ backgroundColor: rowIdx % 2 === 1 ? '#f1f5f9' : '#ffffff' }}
                                        className="transition-colors custom-hover-row"
                                    >
                                        {columns.map((col, colIdx) => {
                                            const value = getValue(row, col.key)
                                            return (
                                                <td
                                                    key={colIdx}
                                                    className={cn(
                                                        "p-4",
                                                        col.align === 'right' && "text-right",
                                                        col.align === 'center' && "text-center"
                                                    )}
                                                >
                                                    {col.render ? col.render(value, row) : String(value ?? '')}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="border-t">
                    <PaginationFooter
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        from={filteredData.length > 0 ? (page - 1) * pageSize + 1 : 0}
                        to={Math.min(page * pageSize, filteredData.length)}
                        total={filteredData.length}
                        pageSize={pageSize}
                        onPageSizeChange={setPageSize}
                        className="bg-transparent shadow-none border-none"
                    />
                </div>
            </div>
        </ReportPageLayout>
    )
}
