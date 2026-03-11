"use client"
import React, { useState, useEffect } from "react"
import { useOrgStore } from "@/store/org-store"
import { getOrgSettings, upsertOrgSetting } from "@/action/organization-settings"
import { toast } from "sonner"
import { Info } from "lucide-react"
import {  SettingsHeader, SettingTab , SettingsContentLayout } from "@/components/settings/SettingsHeader"
import { Building2 } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"

type PermissionType = "everyone" | "management-only"

export default function CompleteTodosPage() {
    const { organizationId } = useOrgStore()
    const [loading, setLoading] = useState(true)
    const [permission, setPermission] = useState<PermissionType>("everyone")

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
                    if (res.data.todo_complete_permission) {
                        setPermission(res.data.todo_complete_permission as PermissionType)
                    }
                }
            } catch (err) {
                console.error("Failed to load complete to-dos settings", err)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [organizationId])

    const handlePermissionChange = async (newPermission: PermissionType) => {
        setPermission(newPermission)
        if (!organizationId) return
        try {
            await upsertOrgSetting(String(organizationId), {
                todo_complete_permission: newPermission
            })
            toast.success("Permission updated")
        } catch (err) {
            toast.error("Failed to update setting")
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
                activeItemId="complete-todos"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="complete-todos">

            {/* Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                    {/* Section Title */}
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                            PERMISSION TO COMPLETE TO-DOS
                        </span>
                        <Info className="w-3.5 h-3.5 text-slate-300" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-500 mb-8 max-w-2xl leading-relaxed">
                        Allow tasks/to-dos completion within projects for <span className="text-slate-900 font-normal">everyone</span> (role: users) or <span className="text-slate-900 font-normal">management only</span> (roles: org owner and org managers)
                    </p>

                    {/* Default Setting */}
                    <div className="flex items-center gap-1 mb-4">
                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                            DEFAULT SETTING:
                        </span>
                        <Info className="w-3.5 h-3.5 text-slate-300" />
                    </div>

                    {/* Permission Selection Pills */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-100 rounded-2xl p-1.5 w-full sm:w-fit gap-1 shadow-inner">
                        <button
                            onClick={() => handlePermissionChange("everyone")}
                            className={`flex-1 sm:flex-none px-8 py-2.5 text-xs font-normal rounded-xl transition-all uppercase tracking-widest ${permission === "everyone"
                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                                }`}
                        >
                            Everyone
                        </button>
                        <button
                            onClick={() => handlePermissionChange("management-only")}
                            className={`flex-1 sm:flex-none px-8 py-2.5 text-xs font-normal rounded-xl transition-all uppercase tracking-widest ${permission === "management-only"
                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                                }`}
                        >
                            Management Only
                        </button>
                    </div>
                </div>
            </div>
        
            </SettingsContentLayout>
</div>
    )
}
