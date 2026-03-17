"use client"

import { useState } from "react"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { FilterSidebar } from "@/components/report/FilterSidebar"

interface AuditLogFilterSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onApply?: (filters: any) => void
    className?: string
}

const ACTION_TYPES = [
    "Added", "Approved", "Archived", "Created", "Deleted", "Denied", "Duplicated",
    "Enabled", "Merge Failed", "Merged", "Modified", "Opened", "Removed", "Restored",
    "Send Email", "Submitted", "Transfered", "Unsubmit", "Updated", "Accepted Invite"
].sort()

export function AuditLogFilterSidebar({ open, onOpenChange, onApply, className }: AuditLogFilterSidebarProps) {
    const [member, setMember] = useState("all")
    const [team, setTeam] = useState("all")
    const [action, setAction] = useState("all")

    const handleApply = () => {
        onApply?.({
            member,
            team,
            action
        })
    }

    const handleClear = () => {
        setMember("all")
        setTeam("all")
        setAction("all")
    }

    return (
        <FilterSidebar
            open={open}
            onOpenChange={onOpenChange}
            onApply={handleApply}
            onClear={handleClear}
            className={className}
        >
            {/* Members */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Members</Label>
                <SearchableSelect
                    value={member}
                    onValueChange={setMember}
                    options={[
                        { value: "all", label: "All members" },
                        ...DUMMY_MEMBERS.map(m => ({ value: m.id, label: m.name }))
                    ]}
                    placeholder="All members"
                    searchPlaceholder="Search members..."
                />
            </div>

            {/* Teams */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Teams</Label>
                <SearchableSelect
                    value={team}
                    onValueChange={setTeam}
                    options={[
                        { value: "all", label: "All teams" },
                        ...DUMMY_TEAMS.map(t => ({ value: t.id, label: t.name }))
                    ]}
                    placeholder="All teams"
                    searchPlaceholder="Search teams..."
                />
            </div>

            {/* Actions */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Action</Label>
                <SearchableSelect
                    value={action}
                    onValueChange={setAction}
                    options={[
                        { value: "all", label: "All actions" },
                        ...ACTION_TYPES.map(a => ({ value: a, label: a }))
                    ]}
                    placeholder="All actions"
                    searchPlaceholder="Search actions..."
                />
            </div>

            {/* Settings - Optional/Generic */}
            <div className="space-y-3 pt-2">
                <Label className="text-sm font-semibold text-gray-900">Settings</Label>
                <div className="flex items-center space-x-2">
                    <Checkbox id="removed" />
                    <label
                        htmlFor="removed"
                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-600 uppercase"
                    >
                        Include removed members
                    </label>
                </div>
            </div>
        </FilterSidebar>
    )
}
