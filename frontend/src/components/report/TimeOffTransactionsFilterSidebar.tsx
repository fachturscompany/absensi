"use client"

import { useState } from "react"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Label } from "@/components/ui/label"
import { FilterSidebar } from "@/components/report/FilterSidebar"
import { Switch } from "@/components/ui/switch"

interface TimeOffTransactionsFilterSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onApply: (filters: TransactionFilters) => void
    teams: { id: string; name: string }[]
    members: { id: string; name: string }[]
}

export interface TransactionFilters {
    teamId: string
    memberId: string
    policy: string
    type: string
    changedBy: string
    includeAccruals: boolean
}

const POLICIES = [
    "Annual Leave",
    "Sick Leave",
    "Personal Leave",
    "Unpaid Leave"
]

const TRANSACTION_TYPES = [
    "Accrual",
    "Usage",
    "Adjustment",
    "Scheduled",
    "Cancellation"
]

export function TimeOffTransactionsFilterSidebar({
    open,
    onOpenChange,
    onApply,
    teams,
    members
}: TimeOffTransactionsFilterSidebarProps) {
    const [teamId, setTeamId] = useState("all")
    const [memberId, setMemberId] = useState("all")
    const [policy, setPolicy] = useState("all")
    const [type, setType] = useState("all")
    const [changedBy, setChangedBy] = useState("all")
    const [includeAccruals, setIncludeAccruals] = useState(false)

    const handleApply = () => {
        onApply({
            teamId,
            memberId,
            policy,
            type,
            changedBy,
            includeAccruals
        })
    }

    const handleClear = () => {
        setTeamId("all")
        setMemberId("all")
        setPolicy("all")
        setType("all")
        setChangedBy("all")
        setIncludeAccruals(false)
    }

    return (
        <FilterSidebar
            open={open}
            onOpenChange={onOpenChange}
            onApply={handleApply}
            onClear={handleClear}
            title="Filter Transactions"
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase">Teams</Label>
                    <SearchableSelect
                        value={teamId}
                        onValueChange={setTeamId}
                        options={[
                            { value: "all", label: "All teams" },
                            ...teams.map(t => ({ value: t.id, label: t.name }))
                        ]}
                        placeholder="All teams"
                        searchPlaceholder="Search team..."
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase">Members</Label>
                    <SearchableSelect
                        value={memberId}
                        onValueChange={setMemberId}
                        options={[
                            { value: "all", label: "All members" },
                            ...members.map(m => ({ value: m.id, label: m.name }))
                        ]}
                        placeholder="All members"
                        searchPlaceholder="Search member..."
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase">Policy</Label>
                    <SearchableSelect
                        value={policy}
                        onValueChange={setPolicy}
                        options={[
                            { value: "all", label: "All policies" },
                            ...POLICIES.map(p => ({ value: p, label: p }))
                        ]}
                        placeholder="All policies"
                        searchPlaceholder="Search policy..."
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase">Type</Label>
                    <SearchableSelect
                        value={type}
                        onValueChange={setType}
                        options={[
                            { value: "all", label: "All types" },
                            ...TRANSACTION_TYPES.map(t => ({ value: t.toLowerCase(), label: t }))
                        ]}
                        placeholder="All types"
                        searchPlaceholder="Search type..."
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase">Changed By</Label>
                    <SearchableSelect
                        value={changedBy}
                        onValueChange={setChangedBy}
                        options={[
                            { value: "all", label: "All members" },
                            ...members.map(m => ({ value: m.id, label: m.name }))
                        ]}
                        placeholder="All members"
                        searchPlaceholder="Search member..."
                    />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                    <Switch
                        id="include-accruals"
                        checked={includeAccruals}
                        onCheckedChange={setIncludeAccruals}
                    />
                    <Label htmlFor="include-accruals" className="text-sm font-medium text-gray-900">Include accruals</Label>
                </div>
            </div>
        </FilterSidebar>
    )
}
