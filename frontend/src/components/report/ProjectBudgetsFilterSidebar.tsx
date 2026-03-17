"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { FilterSidebar } from "./FilterSidebar"
import { SearchableSelect } from "@/components/ui/searchable-select"

interface ProjectBudgetsFilterSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onApply?: (filters: any) => void
    className?: string
}

export function ProjectBudgetsFilterSidebar({ open, onOpenChange, onApply, className }: ProjectBudgetsFilterSidebarProps) {
    const [project, setProject] = useState("all")
    const [client, setClient] = useState("all")
    const [budgetType, setBudgetType] = useState("all")

    const handleApply = () => {
        onApply?.({
            project,
            client,
            budgetType
        })
    }

    const handleClear = () => {
        setProject("all")
        setClient("all")
        setBudgetType("all")
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
                <Label className="text-xs font-semibold text-gray-500 uppercase">Project</Label>
                <SearchableSelect
                    value={project}
                    onValueChange={setProject}
                    options={[
                        { value: "all", label: "All Projects" },
                        { value: "Website Redesign", label: "Website Redesign" },
                        { value: "Mobile App Development", label: "Mobile App Development" },
                        { value: "Marketing Campaign", label: "Marketing Campaign" },
                        { value: "Internal Tools", label: "Internal Tools" },
                        { value: "Legacy System Maintenance", label: "Legacy System Maintenance" }
                    ]}
                    placeholder="All Projects"
                    searchPlaceholder="Search project..."
                />
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Client</Label>
                <SearchableSelect
                    value={client}
                    onValueChange={setClient}
                    options={[
                        { value: "all", label: "All Clients" },
                        { value: "Patricia", label: "Patricia" },
                        { value: "Tech Corp", label: "Tech Corp" },
                        { value: "Internal", label: "Internal" },
                        { value: "Old Client", label: "Old Client" }
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
                        { value: "hours", label: "Hours Based" },
                        { value: "cost", label: "Total Cost" }
                    ]}
                    placeholder="All Types"
                    searchPlaceholder="Search type..."
                />
            </div>
        </FilterSidebar>
    )
}
