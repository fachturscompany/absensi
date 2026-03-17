import { useState } from "react"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Label } from "@/components/ui/label"
import { DUMMY_PROJECTS } from "@/lib/data/dummy-data"
import { FilterSidebar } from "./FilterSidebar"

interface PaymentsFilterSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onApply?: (filters: any) => void
    className?: string
}

const PAYMENT_METHODS = [
    "PayPal", "Wise", "Bank Transfer", "Manual"
]

const STATUS_TYPES = [
    "Completed", "Pending", "Failed"
]

export function PaymentsFilterSidebar({ open, onOpenChange, onApply, className }: PaymentsFilterSidebarProps) {
    const [method, setMethod] = useState("all")
    const [status, setStatus] = useState("all")
    const [project, setProject] = useState("all")

    const handleApply = () => {
        onApply?.({
            method,
            status,
            project
        })
    }

    const handleClear = () => {
        setMethod("all")
        setStatus("all")
        setProject("all")
    }

    return (
        <FilterSidebar
            open={open}
            onOpenChange={onOpenChange}
            onApply={handleApply}
            onClear={handleClear}
            className={className}
        >
            {/* Methods */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Payment Method</Label>
                <SearchableSelect
                    value={method}
                    onValueChange={setMethod}
                    options={[
                        { value: "all", label: "All methods" },
                        ...PAYMENT_METHODS.map(m => ({ value: m, label: m }))
                    ]}
                    placeholder="All methods"
                    searchPlaceholder="Search method..."
                />
            </div>

            {/* Status */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Status</Label>
                <SearchableSelect
                    value={status}
                    onValueChange={setStatus}
                    options={[
                        { value: "all", label: "All statuses" },
                        ...STATUS_TYPES.map(s => ({ value: s, label: s }))
                    ]}
                    placeholder="All statuses"
                    searchPlaceholder="Search status..."
                />
            </div>

            {/* Projects */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Project</Label>
                <SearchableSelect
                    value={project}
                    onValueChange={setProject}
                    options={[
                        { value: "all", label: "All projects" },
                        ...DUMMY_PROJECTS.map(p => ({ value: p.id, label: p.name }))
                    ]}
                    placeholder="All projects"
                    searchPlaceholder="Search project..."
                />
            </div>
        </FilterSidebar>
    )
}
