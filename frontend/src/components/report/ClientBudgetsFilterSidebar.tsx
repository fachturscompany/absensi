import { useState } from "react"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Label } from "@/components/ui/label"
import { DUMMY_CLIENTS } from "@/lib/data/dummy-data"
import { FilterSidebar } from "./FilterSidebar"

interface ClientBudgetsFilterSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onApply: (filters: { client: string, budgetType: string }) => void
}

export function ClientBudgetsFilterSidebar({
    open,
    onOpenChange,
    onApply,
}: ClientBudgetsFilterSidebarProps) {
    const [client, setClient] = useState("all")
    const [budgetType, setBudgetType] = useState("all")

    const handleApply = () => {
        onApply({ client, budgetType })
    }

    const handleClear = () => {
        setClient("all")
        setBudgetType("all")
    }

    return (
        <FilterSidebar
            open={open}
            onOpenChange={onOpenChange}
            onApply={handleApply}
            onClear={handleClear}
            title="Filter Client Budgets"
        >
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Client</Label>
                <SearchableSelect
                    value={client}
                    onValueChange={setClient}
                    options={[
                        { value: "all", label: "All Clients" },
                        ...DUMMY_CLIENTS.map(c => ({ value: c.name, label: c.name }))
                    ]}
                    placeholder="All Clients"
                    searchPlaceholder="Search client..."
                />
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Budget Type</Label>
                <SearchableSelect
                    value={budgetType}
                    onValueChange={setBudgetType}
                    options={[
                        { value: "all", label: "All Types" },
                        { value: "hours", label: "Hours" },
                        { value: "cost", label: "Cost (Currency)" }
                    ]}
                    placeholder="All Types"
                    searchPlaceholder="Search type..."
                />
            </div>
        </FilterSidebar>
    )
}
