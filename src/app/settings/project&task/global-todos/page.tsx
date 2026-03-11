"use client"

import React, { useState } from "react"
import { Plus, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import {  SettingsHeader, SettingTab , SettingsContentLayout } from "@/components/settings/SettingsHeader"
import { Building2 } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"

interface GlobalTodo {
    id: string
    name: string
    projects: string[]
}

export default function GlobalTodosPage() {
    const [todos] = useState<GlobalTodo[]>([])



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
                activeItemId="global-todos"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="global-todos">

            {/* Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
                        <div>
                            <h2 className="text-[10px] font-normal text-slate-400 uppercase tracking-widest mb-2">
                                GLOBAL TO-DOS
                            </h2>
                            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
                                Global to-dos can be added to any project. Once added to a project, all members of the project can track time to them, and they cannot be marked as complete so they'll always be visible. Data from these shared to-dos can be viewed across projects in <span className="text-slate-900 font-normal">'Time & activity'</span> report.
                            </p>
                        </div>
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white h-11 px-8 rounded-xl font-normal transition-all active:scale-95 shadow-lg shadow-slate-100 w-full sm:w-auto shrink-0">
                            <Plus className="w-4 h-4 mr-2" />
                            Add a global to-do
                        </Button>
                    </div>

                    {/* Table */}
                    <div className="mt-8">
                        {/* Table Header - Hidden on mobile */}
                        <div className="hidden sm:grid grid-cols-2 py-3 border-b border-slate-100 px-2">
                            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">Name</span>
                            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">Projects</span>
                        </div>

                        {/* Table Body - Empty State */}
                        {todos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 border border-slate-100">
                                    <Package className="w-12 h-12 text-slate-200" />
                                </div>
                                <h3 className="text-xl font-normal text-slate-900 mb-2">
                                    Add global to-dos
                                </h3>
                                <p className="text-sm text-slate-500 text-center max-w-xs leading-relaxed">
                                    Create global to-dos and easily add them to multiple projects in seconds.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {todos.map((todo) => (
                                    <div key={todo.id} className="grid grid-cols-2 items-center py-4">
                                        <span className="text-sm text-gray-900">{todo.name}</span>
                                        <span className="text-sm text-gray-500">
                                            {todo.projects.length} projects
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        
            </SettingsContentLayout>
</div>
    )
}
