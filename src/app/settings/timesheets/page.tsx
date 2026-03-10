"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Activity } from "lucide-react"
import { useOrgStore } from "@/store/org-store"
import { getMembersForScreenshot } from "@/action/screenshots"
import { getOrgSettings, upsertOrgSetting, getAllMemberSettings, upsertMemberSetting } from "@/action/organization-settings"
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { toast } from "sonner"
import { GlobalTimesheetSettings } from "@/components/settings/timesheets/GlobalTimesheetSettings"
import { MemberSettingsTable, type ModifyTimeOption, type MemberWithSettings } from "@/components/settings/timesheets/MemberSettingsTable"

export default function TimesheetPage() {
    const { organizationId } = useOrgStore()
    const [members, setMembers] = useState<MemberWithSettings[]>([])
    const [totalMembers, setTotalMembers] = useState(0)
    const [loading, setLoading] = useState(true)
    const [globalModifySetting, setGlobalModifySetting] = useState<ModifyTimeOption>("add-edit")
    const [globalRequireApproval, setGlobalRequireApproval] = useState(false)
    const [allowManagersApprove, setAllowManagersApprove] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Fetch Members and Settings
    useEffect(() => {
        async function loadData() {
            if (!organizationId) {
                setLoading(false)
                return
            }

            setLoading(true)
            try {
                const [membersRes, orgSettingsRes, allMemberSettingsRes] = await Promise.all([
                    getMembersForScreenshot(
                        String(organizationId),
                        { page: currentPage, limit: itemsPerPage },
                        searchQuery
                    ),
                    getOrgSettings(String(organizationId)),
                    getAllMemberSettings(String(organizationId))
                ])

                let gModify = globalModifySetting
                let gApproval = globalRequireApproval

                if (orgSettingsRes.success && orgSettingsRes.data) {
                    if (orgSettingsRes.data.modify_time) {
                        setGlobalModifySetting(orgSettingsRes.data.modify_time as ModifyTimeOption)
                        gModify = orgSettingsRes.data.modify_time as ModifyTimeOption
                    }
                    if (orgSettingsRes.data.require_approval !== undefined) {
                        setGlobalRequireApproval(!!orgSettingsRes.data.require_approval)
                        gApproval = !!orgSettingsRes.data.require_approval
                    }
                    if (orgSettingsRes.data.allow_managers_approve !== undefined) {
                        setAllowManagersApprove(!!orgSettingsRes.data.allow_managers_approve)
                    }
                }

                if (membersRes.success && membersRes.data) {
                    const memberOverrides = allMemberSettingsRes.success ? allMemberSettingsRes.data : {}

                    const mapped = membersRes.data.map(m => {
                        const settings = memberOverrides?.[Number(m.id)] || {}
                        return {
                            ...m,
                            modifyTimeSetting: (settings.modify_time as ModifyTimeOption) || gModify,
                            requireApproval: settings.require_approval !== undefined ? !!settings.require_approval : gApproval
                        }
                    })
                    setMembers(mapped)
                    setTotalMembers(membersRes.total ?? 0)
                }
            } catch (err) {
                console.error("Failed to load timesheet data", err)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [organizationId, currentPage, searchQuery])

    const modifyOptions: { value: ModifyTimeOption; label: string }[] = [
        { value: "add-edit", label: "Add & edit" },
        { value: "off", label: "Off" },
    ]

    const handleApplyToAll = async () => {
        if (!organizationId) return

        try {
            setLoading(true)
            // Save global defaults
            await upsertOrgSetting(String(organizationId), {
                modify_time: globalModifySetting,
                require_approval: globalRequireApproval
            })

            // Update local state for all currently loaded members
            setMembers(prev =>
                prev.map(member => ({
                    ...member,
                    modifyTimeSetting: globalModifySetting,
                    requireApproval: globalRequireApproval
                }))
            )

            toast.success("Applied to all members and updated defaults")
        } catch (err) {
            console.error("Failed to apply to all", err)
            toast.error("Failed to apply settings to all")
        } finally {
            setLoading(false)
        }
    }

    const handleGlobalModifyChange = async (value: ModifyTimeOption) => {
        const prev = globalModifySetting
        setGlobalModifySetting(value)
        if (!organizationId) return
        try {
            const res = await upsertOrgSetting(String(organizationId), { modify_time: value })
            if (!res.success) throw new Error(res.message)
            toast.success("Default modify time updated")
        } catch (err) {
            setGlobalModifySetting(prev)
            toast.error("Failed to update default")
        }
    }

    const handleGlobalApprovalChange = async (value: boolean) => {
        const prev = globalRequireApproval
        setGlobalRequireApproval(value)
        if (!organizationId) return
        try {
            const res = await upsertOrgSetting(String(organizationId), { require_approval: value })
            if (!res.success) throw new Error(res.message)
            toast.success("Default approval requirement updated")
        } catch (err) {
            setGlobalRequireApproval(prev)
            toast.error("Failed to update default")
        }
    }

    const handleAllowManagersApproveChange = async (value: boolean) => {
        const prev = allowManagersApprove
        setAllowManagersApprove(value)
        if (!organizationId) return
        try {
            const res = await upsertOrgSetting(String(organizationId), { allow_managers_approve: value })
            if (!res.success) throw new Error(res.message)
            toast.success("Approval permission updated")
        } catch (err) {
            setAllowManagersApprove(prev)
            toast.error("Failed to update permission")
        }
    }

    const handleMemberModifyChange = async (id: string, value: ModifyTimeOption) => {
        const original = members.find(m => m.id === id)
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, modifyTimeSetting: value } : member
            )
        )

        try {
            const res = await upsertMemberSetting(id, { modify_time: value })
            if (!res.success) throw new Error(res.message)
            toast.success("Member setting updated")
        } catch (err) {
            if (original) {
                setMembers(prev => prev.map(m => m.id === id ? original : m))
            }
            toast.error("Failed to update member setting")
        }
    }

    const handleMemberApprovalChange = async (id: string, value: boolean) => {
        const original = members.find(m => m.id === id)
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, requireApproval: value } : member
            )
        )

        try {
            const res = await upsertMemberSetting(id, { require_approval: value })
            if (!res.success) throw new Error(res.message)
            toast.success("Member setting updated")
        } catch (err) {
            if (original) {
                setMembers(prev => prev.map(m => m.id === id ? original : m))
            }
            toast.error("Failed to update member setting")
        }
    }

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        setCurrentPage(1)
    }

    const totalPages = Math.ceil(totalMembers / itemsPerPage)

    const tabs: SettingTab[] = [
        { label: "ACTIVITY", href: "/settings/Activity", active: false },
        { label: "TIMESHEETS", href: "/settings/timesheets", active: true },
        { label: "TRACKING", href: "/settings/tracking", active: false },
        { label: "SCREENSHOTS", href: "/settings/screenshot", active: false },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "modify-time", label: "Modify time (manual time)", href: "/settings/timesheets" },
        { id: "require-reason", label: "Require reason", href: "/settings/timesheets/require-reason" },
        { id: "reasons", label: "Reasons", href: "/settings/timesheets/reasons" },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Activity & Tracking"
                Icon={Activity}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="modify-time"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="modify-time">

                {/* Main Content */}
                <div className="flex flex-1 w-full overflow-hidden">
                    {/* Main Content Area */}
                    <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                        {/* Section Title */}
                        <div className="flex items-center gap-1 mb-2">
                            <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                                MODIFY TIME (MANUAL TIME)
                            </span>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-1 font-light">
                            Customize your team's ability to modify time (add manual time and edit previously tracked time).
                        </p>
                        <p className="text-sm text-gray-600 mb-6 font-light">
                            Ensure this setting is 'Off' to not allow time modifications. Members are able to delete their own time before it's paid. <Link href="#" className="text-gray-900 underline">View more</Link>
                        </p>

                        <GlobalTimesheetSettings
                            globalModifySetting={globalModifySetting}
                            globalRequireApproval={globalRequireApproval}
                            allowManagersApprove={allowManagersApprove}
                            loading={loading}
                            modifyOptions={modifyOptions}
                            onGlobalModifyChange={handleGlobalModifyChange}
                            onGlobalApprovalChange={handleGlobalApprovalChange}
                            onAllowManagersApproveChange={handleAllowManagersApproveChange}
                            onApplyToAll={handleApplyToAll}
                        />

                        {/* Individual Settings Section */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                            <div className="space-y-1">
                                <h3 className="text-lg font-normal text-gray-900">Individual settings</h3>
                                <p className="text-sm text-gray-500 font-light">Override the organization default for specific members</p>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 font-light" />
                                <input
                                    type="text"
                                    placeholder="Search members"
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full sm:w-64 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-sm h-10 transition-all font-light placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <MemberSettingsTable
                            members={members}
                            loading={loading}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalMembers={totalMembers}
                            itemsPerPage={itemsPerPage}
                            modifyOptions={modifyOptions}
                            onMemberModifyChange={handleMemberModifyChange}
                            onMemberApprovalChange={handleMemberApprovalChange}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            </SettingsContentLayout>
        </div>
    )
}
