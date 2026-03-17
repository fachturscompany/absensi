"use client"

import { useState } from "react"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Label } from "@/components/ui/label"
import { FilterSidebar } from "@/components/report/FilterSidebar"
import { Client } from "@/lib/data/dummy-data"

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    onApply: (filters: { clientId: string, status: string }) => void
    clients: Client[]
}

const STATUS_OPTIONS = [
    { value: "Open", label: "Open" },
    { value: "Closed", label: "Closed" },
    { value: "Paid", label: "Paid" },
    { value: "Void", label: "Void" },
]

export function ClientInvoicesFilterSidebar({ open, onOpenChange, onApply, clients }: Props) {
    const [clientId, setClientId] = useState("all")
    const [status, setStatus] = useState("all")

    const handleApply = () => {
        onApply({ clientId, status })
    }

    const handleClear = () => {
        setClientId("all")
        setStatus("all")
    }

    const clientOptions = [
        { value: "all", label: "All Clients" },
        ...clients.map(c => ({ value: c.id, label: c.name }))
    ]

    const statusOptions = [
        { value: "all", label: "All Status" },
        ...STATUS_OPTIONS
    ]

    return (
        <FilterSidebar
            open={open}
            onOpenChange={onOpenChange}
            onApply={handleApply}
            onClear={handleClear}
            title="Filter Invoices"
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

                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase">Status</Label>
                    <SearchableSelect
                        value={status}
                        onValueChange={setStatus}
                        options={statusOptions}
                        placeholder="Select status"
                        searchPlaceholder="Search status..."
                    />
                </div>
            </div>
        </FilterSidebar>
    )
}
