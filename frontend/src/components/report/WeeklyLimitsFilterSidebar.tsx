import { useState } from "react"
import { Label } from "@/components/ui/label"
import { FilterSidebar } from "./FilterSidebar"
import { SearchableSelect } from "@/components/ui/searchable-select"

interface WeeklyLimitsFilterSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onApply?: (filters: any) => void
    className?: string
}

export function WeeklyLimitsFilterSidebar({ open, onOpenChange, onApply, className }: WeeklyLimitsFilterSidebarProps) {
    const [role, setRole] = useState("all")
    const [status, setStatus] = useState("all")
    const [week, setWeek] = useState("current")

    const handleApply = () => {
        onApply?.({
            role,
            status,
            week
        })
    }

    const handleClear = () => {
        setRole("all")
        setStatus("all")
        setWeek("current")
    }

    return (
        <FilterSidebar
            open={open}
            onOpenChange={onOpenChange}
            onApply={handleApply}
            onClear={handleClear}
            className={className}
        >
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Role</Label>
                <SearchableSelect
                    value={role}
                    onValueChange={setRole}
                    options={[
                        { value: "all", label: "All Roles" },
                        { value: "Owner", label: "Owner" },
                        { value: "Manager", label: "Manager" },
                        { value: "Member", label: "Member" }
                    ]}
                    placeholder="All Roles"
                    searchPlaceholder="Search role..."
                />
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Status</Label>
                <SearchableSelect
                    value={status}
                    onValueChange={setStatus}
                    options={[
                        { value: "all", label: "All Status" },
                        { value: "within", label: "Within Limit" },
                        { value: "approaching", label: "Approaching Limit" },
                        { value: "exceeded", label: "Exceeded Limit" }
                    ]}
                    placeholder="All Status"
                    searchPlaceholder="Search status..."
                />
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Week</Label>
                <SearchableSelect
                    value={week}
                    onValueChange={setWeek}
                    options={[
                        { value: "current", label: "Current Week (Feb 1 - Feb 7)" },
                        { value: "last", label: "Last Week (Jan 25 - Jan 31)" }
                    ]}
                    placeholder="Select Week"
                    searchPlaceholder="Search week..."
                />
            </div>
        </FilterSidebar>
    )
}
