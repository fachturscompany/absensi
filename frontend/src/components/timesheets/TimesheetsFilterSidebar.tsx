"use client"

import { useState } from "react"
import { FilterSidebar, FilterSection, FilterSubsection } from "@/components/report/FilterSidebar"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Member, Project } from "@/lib/data/dummy-data"

interface TimesheetsFilterSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    members: Member[]
    projects: Project[]
    onApply: (filters: { memberId: string, projectId: string, source: string, status: string }) => void
}

export function TimesheetsFilterSidebar({
    open,
    onOpenChange,
    members,
    projects,
    onApply
}: TimesheetsFilterSidebarProps) {
    const [selectedMember, setSelectedMember] = useState("all")
    const [selectedProject, setSelectedProject] = useState("all")
    const [selectedSource, setSelectedSource] = useState("all")
    const [selectedStatus, setSelectedStatus] = useState("all")

    const handleApply = () => {
        onApply({
            memberId: selectedMember,
            projectId: selectedProject,
            source: selectedSource,
            status: selectedStatus
        })
        onOpenChange(false)
    }

    const handleReset = () => {
        setSelectedMember("all")
        setSelectedProject("all")
        setSelectedSource("all")
        setSelectedStatus("all")
    }

    const memberOptions = [
        { value: "all", label: "All Members" },
        ...members.map(m => ({ value: m.id, label: m.name }))
    ]

    const projectOptions = [
        { value: "all", label: "All Projects" },
        ...projects.map(p => ({ value: p.id, label: p.name }))
    ]

    const sourceOptions = [
        { value: "all", label: "All Sources" },
        { value: "desktop", label: "Desktop App" },
        { value: "mobile", label: "Mobile App" },
        { value: "web", label: "Web Timer" },
        { value: "manual", label: "Manual Entry" }
    ]

    const statusOptions = [
        { value: "all", label: "All Statuses" },
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" }
    ]

    return (
        <FilterSidebar
            open={open}
            onOpenChange={onOpenChange}
            onApply={handleApply}
            onReset={handleReset}
            onClear={handleReset}
        >
            <FilterSection>
                <FilterSubsection title="Member">
                    <SearchableSelect
                        options={memberOptions}
                        value={selectedMember}
                        onValueChange={setSelectedMember}
                        placeholder="Select member"
                        className="bg-white dark:bg-gray-950 dark:border-gray-800 dark:text-gray-100"
                    />
                </FilterSubsection>

                <FilterSubsection title="Project">
                    <SearchableSelect
                        options={projectOptions}
                        value={selectedProject}
                        onValueChange={setSelectedProject}
                        placeholder="Select project"
                        className="bg-white dark:bg-gray-950 dark:border-gray-800 dark:text-gray-100"
                    />
                </FilterSubsection>

                <FilterSubsection title="Source">
                    <SearchableSelect
                        options={sourceOptions}
                        value={selectedSource}
                        onValueChange={setSelectedSource}
                        placeholder="Select source"
                        className="bg-white dark:bg-gray-950 dark:border-gray-800 dark:text-gray-100"
                    />
                </FilterSubsection>

                <FilterSubsection title="Approval Status">
                    <SearchableSelect
                        options={statusOptions}
                        value={selectedStatus}
                        onValueChange={setSelectedStatus}
                        placeholder="Select status"
                        className="bg-white dark:bg-gray-950 dark:border-gray-800 dark:text-gray-100"
                    />
                </FilterSubsection>
            </FilterSection>
        </FilterSidebar>
    )
}

