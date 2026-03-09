"use client"

import React, { useState, useEffect } from "react"
import { Info, Search, Loader2 } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import { SettingsHeader, SettingTab } from "@/components/settings/SettingsHeader"
import { Activity } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { useOrgStore } from "@/store/org-store"
import { getMembersForScreenshot } from "@/action/screenshots"
import { getOrgSettings, upsertOrgSetting, getAllMemberSettings, upsertMemberSetting } from "@/action/organization-settings"
import { toast } from "sonner"
import { MemberAvatar } from "@/components/profile&image/MemberAvatar"

interface MemberWithSetting {
    id: string
    name: string
    avatar?: string | null
    requireReason: boolean
}

export default function RequireReasonPage() {
    const organizationId = useOrgStore((s) => s.organizationId)

    const [loading, setLoading] = useState(true)
    const [globalEnabled, setGlobalEnabled] = useState(true)
    const [members, setMembers] = useState<MemberWithSetting[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [totalMembers, setTotalMembers] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    useEffect(() => {
        if (!organizationId) return

        const loadData = async () => {
            setLoading(true)
            try {
                const [membersRes, orgSettingsRes, allMemberSettingsRes] = await Promise.all([
                    getMembersForScreenshot(String(organizationId), { page: currentPage, limit: itemsPerPage }, searchQuery),
                    getOrgSettings(String(organizationId)),
                    getAllMemberSettings(String(organizationId))
                ])

                let gEnabled = true
                if (orgSettingsRes.success && orgSettingsRes.data) {
                    if (orgSettingsRes.data.require_reason !== undefined) {
                        setGlobalEnabled(!!orgSettingsRes.data.require_reason)
                        gEnabled = !!orgSettingsRes.data.require_reason
                    }
                }

                if (membersRes.success && membersRes.data) {
                    const memberOverrides = allMemberSettingsRes.success ? allMemberSettingsRes.data : {}

                    const mapped = membersRes.data.map(m => {
                        const settings = memberOverrides?.[Number(m.id)] || {}
                        return {
                            id: m.id,
                            name: m.name,
                            avatar: m.avatarUrl,
                            requireReason: settings.require_reason !== undefined ? !!settings.require_reason : gEnabled
                        }
                    })
                    setMembers(mapped)
                    setTotalMembers(membersRes.total ?? 0)
                }
            } catch (err) {
                console.error("Failed to load require reason data", err)
                toast.error("Failed to load settings")
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [organizationId, currentPage, searchQuery])

    const handleGlobalChange = async (enabled: boolean) => {
        if (!organizationId) return

        const previous = globalEnabled
        setGlobalEnabled(enabled)

        try {
            const res = await upsertOrgSetting(String(organizationId), {
                require_reason: enabled
            })
            if (!res.success) throw new Error(res.message)
            toast.success("Default setting updated")

            // Optionally update all members who don't have overrides
            // For now, we rely on the logic that lack of override means using global
        } catch (err) {
            setGlobalEnabled(previous)
            toast.error("Failed to update default")
        }
    }

    const handleMemberChange = async (id: string, enabled: boolean) => {
        const originalMember = members.find(m => m.id === id)
        if (!originalMember) return

        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, requireReason: enabled } : member
            )
        )

        try {
            const res = await upsertMemberSetting(id, {
                require_reason: enabled
            })
            if (!res.success) throw new Error(res.message)
            toast.success("Member setting updated")
        } catch (err) {
            setMembers(prev =>
                prev.map(member =>
                    member.id === id ? originalMember : member
                )
            )
            toast.error("Failed to update member setting")
        }
    }


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
                activeItemId="require-reason"
            />

            {/* Main Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full text-slate-900 font-normal">
                    {/* Section Title */}
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                            REQUIRE REASON
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-6 font-light">
                        Require team members to provide a reason when adding or editing their time.
                    </p>

                    {/* Global Label */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                            GLOBAL:
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Global Toggle - Switch */}
                    <div className="mb-10">
                        <Switch
                            checked={globalEnabled}
                            onCheckedChange={handleGlobalChange}
                            className="data-[state=checked]:!bg-gray-500 data-[state=unchecked]:bg-gray-300 [&>span]:!bg-white"
                        />
                    </div>

                    {/* Individual Settings Section */}
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="text-lg font-normal text-gray-900 mb-1">Individual settings</h3>
                            <p className="text-sm text-gray-500 font-light">Override the organization default for specific members</p>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search members"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm font-light h-10"
                            />
                        </div>
                    </div>

                    {/* Members Table */}
                    <div className="mt-6">
                        {/* Table Header */}
                        <div className="py-3 border-b border-gray-200">
                            <span className="text-sm font-medium text-gray-900">Name</span>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-200 min-h-[200px] relative">
                            {loading ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                                </div>
                            ) : null}

                            {members.length === 0 && !loading ? (
                                <div className="py-10 text-center text-gray-500 text-sm italic">
                                    No members found
                                </div>
                            ) : (
                                members.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between py-4">
                                        <div className="flex items-center gap-3">
                                            <MemberAvatar
                                                src={member.avatar}
                                                name={member.name}
                                                className="w-8 h-8"
                                            />
                                            <span className="text-sm text-gray-900">{member.name}</span>
                                        </div>
                                        <Switch
                                            checked={member.requireReason}
                                            onCheckedChange={(checked) => handleMemberChange(member.id, checked)}
                                            className="data-[state=checked]:!bg-gray-500 data-[state=unchecked]:bg-gray-300 [&>span]:!bg-white"
                                        />
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination Footer */}
                        {!loading && totalMembers > itemsPerPage && (
                            <div className="flex items-center justify-between py-4 border-t border-gray-100 pt-6">
                                <p className="text-sm text-gray-500 font-light">
                                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalMembers)} of {totalMembers} members
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50 font-light transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        disabled={currentPage * itemsPerPage >= totalMembers}
                                        className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50 font-light transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Summary */}
                        {!loading && totalMembers <= itemsPerPage && members.length > 0 && (
                            <div className="py-3 text-sm text-gray-500 font-light">
                                Showing {members.length} of {totalMembers} members
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
