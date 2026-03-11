"use client"

import { useState, useEffect } from "react"
import { Info, Search, Loader2, ChevronLeft, ChevronRight, Activity, Star } from "lucide-react"
import { useOrgStore } from "@/store/org-store"
import { getMembersForScreenshot, type ISimpleMember } from "@/action/activity/screenshot"
import { getOrgSettings, upsertOrgSetting, getAllMemberSettings, upsertMemberSetting } from "@/action/organization-settings"
import {  SettingsHeader, SettingTab , SettingsContentLayout } from "@/components/settings/SettingsHeader"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { toast } from "sonner"

type AllowedAppsOption = "all" | "desktop" | "mobile"

export default function AllowedAppsPage() {
  const { organizationId } = useOrgStore()
  const [members, setMembers] = useState<ISimpleMember[]>([])
  const [totalMembers, setTotalMembers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [globalAllowedApps, setGlobalAllowedApps] = useState<AllowedAppsOption>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [memberAllowedApps, setMemberAllowedApps] = useState<Record<string, AllowedAppsOption>>({})
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

        if (membersRes.success && membersRes.data) {
          setMembers(membersRes.data)
          setTotalMembers(membersRes.total ?? 0)
        }

        if (orgSettingsRes.success && orgSettingsRes.data) {
          if (orgSettingsRes.data.allowed_apps) {
            setGlobalAllowedApps(orgSettingsRes.data.allowed_apps as AllowedAppsOption)
          }
        }

        if (allMemberSettingsRes.success && allMemberSettingsRes.data) {
          const overrides: Record<string, AllowedAppsOption> = {}
          Object.entries(allMemberSettingsRes.data).forEach(([mId, settings]) => {
            if (settings.allowed_apps) {
              overrides[mId] = settings.allowed_apps as AllowedAppsOption
            }
          })
          setMemberAllowedApps(overrides)
        }
      } catch (err) {
        console.error("Failed to load allowed apps data", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [organizationId, currentPage, searchQuery])

  const handleGlobalAllowedAppsChange = async (value: AllowedAppsOption) => {
    const prev = globalAllowedApps
    setGlobalAllowedApps(value)
    if (!organizationId) return
    try {
      const res = await upsertOrgSetting(String(organizationId), { allowed_apps: value })
      if (!res.success) throw new Error(res.message)
      toast.success("Default allowed apps updated")
    } catch (err) {
      setGlobalAllowedApps(prev)
      toast.error("Failed to update default")
    }
  }

  const handleMemberAllowedAppsChange = async (memberId: string, value: AllowedAppsOption) => {
    const prev = memberAllowedApps[memberId]
    setMemberAllowedApps(prevMap => ({
      ...prevMap,
      [memberId]: value
    }))

    try {
      const res = await upsertMemberSetting(memberId, { allowed_apps: value })
      if (!res.success) throw new Error(res.message)
      toast.success("Member setting updated")
    } catch (err) {
      setMemberAllowedApps(prevMap => ({
        ...prevMap,
        [memberId]: prev || globalAllowedApps
      }))
      toast.error("Failed to update member setting")
    }
  }

  const getMemberAllowedApps = (memberId: string): AllowedAppsOption => {
    return memberAllowedApps[memberId] || globalAllowedApps
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(totalMembers / itemsPerPage)

  const tabs: SettingTab[] = [
    { label: "ACTIVITY", href: "/settings/Activity", active: false },
    { label: "TIMESHEETS", href: "/settings/timesheets", active: false },
    { label: "TRACKING", href: "/settings/tracking", active: true },
    { label: "SCREENSHOTS", href: "/settings/screenshot", active: false },
  ]

  const sidebarItems: SidebarItem[] = [
    { id: "keep-idle-time", label: "Keep idle time", href: "/settings/tracking" },
    { id: "idle-timeout", label: "Idle timeout", href: "/settings/tracking/idle-timeout" },
    { id: "allowed-apps", label: "Allowed apps", href: "/settings/tracking/allowed-apps", icon: Star },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-white w-full">
      <SettingsHeader
        title="Activity & Tracking"
        Icon={Activity}
        tabs={tabs}
        sidebarItems={sidebarItems}
        activeItemId="allowed-apps"
      />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="allowed-apps">

      {/* Content */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
          {/* Allowed Apps Section */}
          <div className="space-y-6">
            {/* Global Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-normal text-slate-900 uppercase tracking-wider">ALLOWED APPS</h2>
                <Info className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600 font-light">
                Control which timer apps the team member can use.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">GLOBAL:</span>
                    <Info className="h-4 w-4 text-slate-400" />
                  </div>
                  {/* Toggle Switch with All apps, Desktop only, Mobile only */}
                  <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-300 bg-slate-200 p-1 w-fit shadow-inner">
                    <button
                      onClick={() => handleGlobalAllowedAppsChange("all")}
                      className={`px-5 py-2 text-xs font-normal rounded-full transition-all ${globalAllowedApps === "all"
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200 sm:border-0"
                        : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                      All apps
                    </button>
                    <button
                      onClick={() => handleGlobalAllowedAppsChange("desktop")}
                      className={`px-5 py-2 text-xs font-normal rounded-full transition-all ${globalAllowedApps === "desktop"
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200 sm:border-0"
                        : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                      Desktop only
                    </button>
                    <button
                      onClick={() => handleGlobalAllowedAppsChange("mobile")}
                      className={`px-5 py-2 text-xs font-normal rounded-full transition-all ${globalAllowedApps === "mobile"
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200 sm:border-0"
                        : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                      Mobile only
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Settings */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-normal text-slate-900">Individual settings</h3>
                  <p className="text-sm text-slate-500 font-light">Override the organization default for specific members</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search members"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full sm:w-64 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-sm h-10 transition-all font-light"
                  />
                </div>
              </div>

              {/* Members Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200 hidden sm:table-header-group">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Allowed apps
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {loading && members.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-12 text-center text-sm text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                            <span className="text-xs font-light uppercase tracking-widest text-slate-400">Loading members...</span>
                          </div>
                        </td>
                      </tr>
                    ) : members.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-12 text-center text-sm text-slate-400">
                          <span className="text-xs font-light uppercase tracking-widest">No members found</span>
                        </td>
                      </tr>
                    ) : (
                      members.map((member) => {
                        const memberAllowedAppsValue = getMemberAllowedApps(member.id)
                        return (
                          <tr key={member.id} className="hover:bg-slate-50/50 flex flex-col sm:table-row py-4 sm:py-0 border-b border-slate-100 last:border-0 transition-colors group">
                            <td className="px-4 py-3 sm:table-cell align-middle">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                  {member.avatarUrl ? (
                                    <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <span className="text-[10px] font-normal text-slate-400 uppercase">
                                      {member.name.charAt(0)}
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm font-normal text-slate-900 group-hover:text-slate-950 transition-colors">
                                  {member.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 sm:table-cell align-middle">
                              <div className="flex justify-between sm:justify-end items-center gap-2">
                                <span className="text-xs font-light text-slate-400 sm:hidden uppercase tracking-wider">Allowed apps:</span>
                                <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-300 bg-slate-200 p-1 w-fit shadow-inner">
                                  <button
                                    onClick={() => handleMemberAllowedAppsChange(member.id, "all")}
                                    className={`px-4 py-1.5 text-[10px] font-normal rounded-full transition-all uppercase tracking-widest ${memberAllowedAppsValue === "all"
                                      ? "bg-white text-slate-900 shadow-sm border border-slate-200 sm:border-0"
                                      : "text-slate-400 hover:text-slate-600"
                                      }`}
                                  >
                                    All apps
                                  </button>
                                  <button
                                    onClick={() => handleMemberAllowedAppsChange(member.id, "desktop")}
                                    className={`px-4 py-1.5 text-[10px] font-normal rounded-full transition-all uppercase tracking-widest ${memberAllowedAppsValue === "desktop"
                                      ? "bg-white text-slate-900 shadow-sm border border-slate-200 sm:border-0"
                                      : "text-slate-400 hover:text-slate-600"
                                      }`}
                                  >
                                    Desktop only
                                  </button>
                                  <button
                                    onClick={() => handleMemberAllowedAppsChange(member.id, "mobile")}
                                    className={`px-4 py-1.5 text-[10px] font-normal rounded-full transition-all uppercase tracking-widest ${memberAllowedAppsValue === "mobile"
                                      ? "bg-white text-slate-900 shadow-sm border border-slate-200 sm:border-0"
                                      : "text-slate-400 hover:text-slate-600"
                                      }`}
                                  >
                                    Mobile only
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!loading && members.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 gap-4 px-2 tracking-tight">
                  <div className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalMembers)} of {totalMembers} members
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-[10px] font-normal text-slate-500 uppercase tracking-widest px-2">
                      Page {currentPage} of {totalPages || 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    
            </SettingsContentLayout>
</div>
  )
}
