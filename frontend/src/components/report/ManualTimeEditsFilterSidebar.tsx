"use client"

import { useState } from "react"
import { FilterSidebar, FilterSection, FilterSubsection } from "@/components/report/FilterSidebar"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { PickerItem } from "@/components/insights/types"

interface ManualTimeEditsFilterSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    members: PickerItem[]
    projects: PickerItem[]
    onApply: (filters: { memberId: string; projectId: string; action: string }) => void
}

export function ManualTimeEditsFilterSidebar({
    open,
    onOpenChange,
    members,
    projects,
    onApply
}: ManualTimeEditsFilterSidebarProps) {
    const [selectedMember, setSelectedMember] = useState<string>("all")
    const [selectedProject, setSelectedProject] = useState<string>("all")
    const [selectedAction, setSelectedAction] = useState<string>("all")

    const handleApply = () => {
        onApply({
            memberId: selectedMember,
            projectId: selectedProject,
            action: selectedAction
        })
        onOpenChange(false)
    }

    const handleReset = () => {
        setSelectedMember("all")
        setSelectedProject("all")
        setSelectedAction("all")
    }

    const memberOptions = [
        { value: "all", label: "All Members" },
        ...members.map(m => ({ value: m.id, label: m.name }))
    ]

    const projectOptions = [
        { value: "all", label: "All Projects" },
        ...projects.map(p => ({ value: p.id, label: p.name }))
    ]

    const actionOptions = [
        { value: "all", label: "All Actions" },
        { value: "add", label: "Add" },
        { value: "edit", label: "Edit" },
        { value: "delete", label: "Delete" }
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
                <FilterSubsection title="Member" onClear={() => setSelectedMember("all")}>
                    <SearchableSelect
                        options={memberOptions}
                        value={selectedMember}
                        onValueChange={setSelectedMember}
                        placeholder="Select member"
                    />
                </FilterSubsection>

                <FilterSubsection title="Project" onClear={() => setSelectedProject("all")}>
                    <SearchableSelect
                        options={projectOptions}
                        value={selectedProject}
                        onValueChange={setSelectedProject}
                        placeholder="Select project"
                    />
                </FilterSubsection>

                <FilterSubsection title="Action Type" onClear={() => setSelectedAction("all")}>
                    <SearchableSelect
                        options={actionOptions}
                        value={selectedAction}
                        onValueChange={setSelectedAction}
                        placeholder="Select action"
                    />
                </FilterSubsection>
            </FilterSection>
        </FilterSidebar>
    )
}
