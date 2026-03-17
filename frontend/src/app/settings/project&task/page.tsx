"use client"

import React, { useState, useEffect } from "react"
import { useOrgStore } from "@/store/org-store"
import { getOrgSettings, upsertOrgSetting } from "@/action/organization-settings"
import { toast } from "sonner"
import { Info } from "lucide-react"
import {  SettingsHeader, SettingTab , SettingsContentLayout } from "@/components/settings/SettingsHeader"
import { Building2 } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"

type ProjectRoleOption = "manager" | "member" | "viewer"

export default function ProjectAndTaskPage() {
    const { organizationId } = useOrgStore()
    const [loading, setLoading] = useState(true)
    const [defaultRole, setDefaultRole] = useState<ProjectRoleOption>("member")

    useEffect(() => {
        async function loadData() {
            if (!organizationId) {
                setLoading(false)
                return
            }

            setLoading(true)
            try {
                const res = await getOrgSettings(String(organizationId))
                if (res.success && res.data) {
                    if (res.data.default_project_role) {
                        setDefaultRole(res.data.default_project_role as ProjectRoleOption)
                    }
                }
            } catch (err) {
                console.error("Failed to load project & task settings", err)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [organizationId])

    const handleRoleChange = async (role: ProjectRoleOption) => {
        setDefaultRole(role)
        if (!organizationId) return
        try {
            await upsertOrgSetting(String(organizationId), {
                default_project_role: role
            })
            toast.success("Default project role updated")
        } catch (err) {
            toast.error("Failed to update settings")
        }
    }

    if (loading && !organizationId) {
        return null
    }

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
                activeItemId="default-roles"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="default-roles">

            {/* Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                    {/* Section Title */}
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                            DEFAULT PROJECT ROLE
                        </span>
                        <Info className="w-3.5 h-3.5 text-slate-300" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-500 mb-8 max-w-2xl leading-relaxed">
                        Set the default role assigned to members when they are added to a project. This role determines their level of access and permissions within the project.
                    </p>

                    {/* Default Setting */}
                    <div className="flex items-center gap-1 mb-4">
                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                            DEFAULT ROLE:
                        </span>
                        <Info className="w-3.5 h-3.5 text-slate-300" />
                    </div>

                    {/* Role Selection Pills */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-100 rounded-2xl p-1.5 w-full sm:w-fit gap-1 shadow-inner">
                        <button
                            onClick={() => handleRoleChange("manager")}
                            className={`flex-1 sm:flex-none px-8 py-2.5 text-xs font-normal rounded-xl transition-all uppercase tracking-widest ${defaultRole === "manager"
                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                                }`}
                        >
                            Manager
                        </button>
                        <button
                            onClick={() => handleRoleChange("member")}
                            className={`flex-1 sm:flex-none px-8 py-2.5 text-xs font-normal rounded-xl transition-all uppercase tracking-widest ${defaultRole === "member"
                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                                }`}
                        >
                            Member
                        </button>
                        <button
                            onClick={() => handleRoleChange("viewer")}
                            className={`flex-1 sm:flex-none px-8 py-2.5 text-xs font-normal rounded-xl transition-all uppercase tracking-widest ${defaultRole === "viewer"
                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                                }`}
                        >
                            Viewer
                        </button>
                    </div>
                </div>
            </div>
        
            </SettingsContentLayout>
</div>
    )
}
