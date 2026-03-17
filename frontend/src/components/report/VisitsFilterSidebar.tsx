"use client"

import { useState } from "react"
import { FilterSidebar, FilterSection, FilterSubsection } from "@/components/report/FilterSidebar"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { PickerItem } from "@/components/insights/types"

interface VisitsFilterSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    members: PickerItem[]
    teams: PickerItem[]
    jobSites: PickerItem[]
    onApply: (filters: { memberId: string; teamId: string; jobSiteId: string }) => void
}

export function VisitsFilterSidebar({
    open,
    onOpenChange,
    members,
    teams,
    jobSites,
    onApply
}: VisitsFilterSidebarProps) {
    const [selectedMember, setSelectedMember] = useState<string>("all")
    const [selectedTeam, setSelectedTeam] = useState<string>("all")
    const [selectedJobSite, setSelectedJobSite] = useState<string>("all")

    const handleApply = () => {
        onApply({
            memberId: selectedMember,
            teamId: selectedTeam,
            jobSiteId: selectedJobSite,
        })
        onOpenChange(false)
    }

    const handleReset = () => {
        setSelectedMember("all")
        setSelectedTeam("all")
        setSelectedJobSite("all")
    }

    const memberOptions = [
        { value: "all", label: "All Members" },
        ...members.map(m => ({ value: m.id, label: m.name }))
    ]

    const teamOptions = [
        { value: "all", label: "All Teams" },
        ...teams.map(t => ({ value: t.id, label: t.name }))
    ]

    const jobSiteOptions = [
        { value: "all", label: "All Job Sites" },
        ...jobSites.map(j => ({ value: j.id, label: j.name }))
    ]

    return (
        <FilterSidebar
            open={open}
            onOpenChange={onOpenChange}
            onApply={handleApply}
            onReset={handleReset}
            onClear={handleReset}
        >
            <FilterSection title="Filters">
                <FilterSubsection title="Job Sites" onClear={() => setSelectedJobSite("all")}>
                    <SearchableSelect
                        options={jobSiteOptions}
                        value={selectedJobSite}
                        onValueChange={setSelectedJobSite}
                        placeholder="Select job site"
                    />
                </FilterSubsection>

                <FilterSubsection title="Teams" onClear={() => setSelectedTeam("all")}>
                    <SearchableSelect
                        options={teamOptions}
                        value={selectedTeam}
                        onValueChange={setSelectedTeam}
                        placeholder="Select team"
                    />
                </FilterSubsection>

                <FilterSubsection title="Members" onClear={() => setSelectedMember("all")}>
                    <SearchableSelect
                        options={memberOptions}
                        value={selectedMember}
                        onValueChange={setSelectedMember}
                        placeholder="Select member"
                    />
                </FilterSubsection>
            </FilterSection>
        </FilterSidebar>
    )
}
