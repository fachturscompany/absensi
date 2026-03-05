"use client"

import React, { useState } from "react"
import {
    Info, Search
} from "lucide-react"


import { Switch } from "@/components/ui/switch"
import { SettingsHeader, SettingTab } from "@/components/settings/SettingsHeader"
import { Building2 } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"

interface ProjectWithTracking {
    id: string
    name: string
    tasks: number
    trackingEnabled: boolean
}

export default function AllowProjectTrackingPage() {
    const [globalEnabled, setGlobalEnabled] = useState(true)
    const [projects, setProjects] = useState<ProjectWithTracking[]>([
        { id: "1", name: "SMA Bradas", tasks: 0, trackingEnabled: true },
        { id: "2", name: "SMK 100 Brantas' Project", tasks: 3, trackingEnabled: false },
    ])
    const [searchQuery, setSearchQuery] = useState("")



    const handleProjectTrackingChange = (id: string, enabled: boolean) => {
        setProjects(prev =>
            prev.map(project =>
                project.id === id ? { ...project, trackingEnabled: enabled } : project
            )
        )
    }

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const tabs: SettingTab[] = [
        { label: "PROJECTS & TO-DOS", href: "/settings/project&task", active: true },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "default-roles", label: "Default project role", href: "/settings/project&task" },
        { id: "complete-todos", label: "Complete to-dos", href: "/settings/project&task/complete-todos" },
        { id: "manage-todos", label: "Manage to-dos", href: "/settings/project&task/manage-todos" },
        { id: "allow-project-tracking", label: "Allow project tracking", href: "/settings/project&task/allow-project-tracking" },
        { id: "global-todos", label: "Global to-dos", href: "/settings/project&task/global-todos" },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Organization"
                Icon={Building2}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="allow-project-tracking"
            />

            {/* Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                    {/* Section Title */}
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                            ALLOW PROJECT TRACKING
                        </span>
                        <Info className="w-3.5 h-3.5 text-slate-300" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-500 mb-8 max-w-2xl leading-relaxed">
                        When enabled, members will be allowed to track time directly to the project. Disabling this setting will set a restriction to time tracking, requiring members to select a to-do before they can begin tracking time.
                    </p>

                    {/* Global Setting */}
                    <div className="flex items-center gap-1 mb-4">
                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                            GLOBAL SETTING:
                        </span>
                        <Info className="w-3.5 h-3.5 text-slate-300" />
                    </div>

                    <div className="mb-12 bg-slate-50 p-6 rounded-2xl border border-slate-100 w-fit">
                        <div className="flex items-center gap-4">
                            <Switch
                                checked={globalEnabled}
                                onCheckedChange={setGlobalEnabled}
                                className="data-[state=checked]:bg-slate-900"
                            />
                            <span className="text-sm font-normal text-slate-900 uppercase tracking-tight">Enable tracking for all projects</span>
                        </div>
                    </div>

                    {/* Individual Settings Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-2">
                        <div>
                            <h3 className="text-lg font-normal text-slate-900 tracking-tight mb-1">Individual settings</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">Override the organization default for specific projects</p>
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full sm:w-64 border border-slate-200 rounded-full focus:outline-none focus:ring-1 focus:ring-slate-900 text-sm h-10 transition-all bg-white"
                            />
                        </div>
                    </div>

                    {/* Projects Table */}
                    <div className="mt-8">
                        {/* Table Header - Hidden on mobile */}
                        <div className="hidden sm:grid grid-cols-3 py-3 border-b border-slate-100 px-2">
                            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">Project</span>
                            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">Tasks</span>
                            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest text-right">Tracking</span>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-slate-100">
                            {filteredProjects.map((project) => (
                                <div key={project.id} className="flex flex-col gap-4 sm:grid sm:grid-cols-3 sm:items-center py-5 hover:bg-slate-50/50 px-2 rounded-xl transition-colors group">
                                    <span className="text-sm font-normal text-slate-900 group-hover:text-slate-950 transition-colors uppercase tracking-tight">{project.name}</span>
                                    <div className="flex items-center justify-between sm:justify-start gap-4">
                                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest sm:hidden">Tasks:</span>
                                        <span className="text-sm font-normal text-slate-500 bg-slate-100/50 px-2.5 py-0.5 rounded-full border border-slate-200/50">{project.tasks}</span>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-4">
                                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest sm:hidden">Tracking:</span>
                                        <Switch
                                            checked={project.trackingEnabled}
                                            onCheckedChange={(checked) => handleProjectTrackingChange(project.id, checked)}
                                            className="data-[state=checked]:bg-slate-900"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
