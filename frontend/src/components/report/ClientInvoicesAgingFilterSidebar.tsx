"use client"

import { useState } from "react"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Label } from "@/components/ui/label"
import { FilterSidebar } from "@/components/report/FilterSidebar"
import { Client } from "@/lib/data/dummy-data"

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    onApply: (filters: { clientId: string }) => void
    clients: Client[]
}

export function ClientInvoicesAgingFilterSidebar({ open, onOpenChange, onApply, clients }: Props) {
    const [clientId, setClientId] = useState("all")

    const handleApply = () => {
        onApply({ clientId })
    }

    const handleClear = () => {
        setClientId("all")
    }

    const clientOptions = [
        { value: "all", label: "All Clients" },
        ...clients.map(c => ({ value: c.id, label: c.name }))
    ]

    return (
        <FilterSidebar
            open={open}
            onOpenChange={onOpenChange}
            onApply={handleApply}
            onClear={handleClear}
            title="Filter Aging Report"
        >
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase">Client</Label>
                    <SearchableSelect
                        value={clientId}
                        onValueChange={setClientId}
                        options={clientOptions}
                        placeholder="Select client"
                        searchPlaceholder="Search client..."
                    />
                </div>
            </div>
        </FilterSidebar>
    )
}
