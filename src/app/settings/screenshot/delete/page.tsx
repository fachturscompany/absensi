"use client"

import { useState, useEffect } from "react"

import { Info, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { useOrgStore } from "@/store/org-store"
import { getMembersForScreenshot, type ISimpleMember } from "@/action/screenshots"
import { getScreenshotSettings, upsertScreenshotSetting } from "@/action/screenshot-settings"
import { SettingsHeader, SettingTab } from "@/components/settings/SettingsHeader"
import { Activity } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { MemberAvatar } from "@/components/profile&image/MemberAvatar"

export default function ScreenshotDeletePage() {
  const { organizationId } = useOrgStore()

  const [members, setMembers] = useState<ISimpleMember[]>([])
  const [totalMembers, setTotalMembers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [globalAllowDelete, setGlobalAllowDelete] = useState(false)
  const [memberRetention, setMemberRetention] = useState<Record<string, number>>({})
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
        const [membersRes, settingsRes] = await Promise.all([
          getMembersForScreenshot(
            String(organizationId),
            { page: currentPage, limit: itemsPerPage },
            searchQuery
          ),
          getScreenshotSettings(String(organizationId))
        ])

        if (membersRes.success && membersRes.data) {
          setMembers(membersRes.data)
          setTotalMembers(membersRes.total ?? 0)
        }

        if (settingsRes.success && settingsRes.data) {
          // Set Global
          if (settingsRes.data.global) {
            setGlobalAllowDelete(settingsRes.data.global.allow_delete)
          }

          // Set Member Retentions
          const retentions: Record<string, number> = {}
          Object.entries(settingsRes.data.members).forEach(([memIdStr, setting]) => {
            retentions[memIdStr] = setting.retention_days
          })
          setMemberRetention(retentions)
        }
      } catch (err) {
        console.error("Failed to load screenshot delete settings", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [organizationId, currentPage, searchQuery])

  const getMemberRetention = (memberId: string) => {
    return memberRetention[memberId] !== undefined ? memberRetention[memberId] : 0
  }

  const handleGlobalDeleteSetting = async (val: boolean) => {
    setGlobalAllowDelete(val)

    if (!organizationId) return
    try {
      await upsertScreenshotSetting({
        organization_id: Number(organizationId),
        organization_member_id: null,
        allow_delete: val
      })
    } catch (e) {
      console.error("Failed to update global delete permission", e)
    }
  }

  const handleMemberRetentionChange = async (memberId: string, days: number) => {
    setMemberRetention(prev => ({
      ...prev,
      [memberId]: days
    }))

    if (!organizationId) return
    try {
      await upsertScreenshotSetting({
        organization_id: Number(organizationId),
        organization_member_id: Number(memberId),
        retention_days: days
      })
    } catch (e) {
      console.error("Failed to update member retention", e)
    }
  }

  // Reset to first page when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(totalMembers / itemsPerPage)

  const tabs: SettingTab[] = [
    { label: "ACTIVITY", href: "/settings/Activity", active: false },
    { label: "TIMESHEETS", href: "/settings/timesheets", active: false },
    { label: "TRACKING", href: "/settings/tracking", active: false },
    { label: "SCREENSHOTS", href: "/settings/screenshot", active: true },
  ]

  const sidebarItems: SidebarItem[] = [
    { id: "frequency", label: "Screenshot frequency", href: "/settings/screenshot" },
    { id: "blur", label: "Screenshot blur", href: "/settings/screenshot/blur" },
    { id: "delete", label: "Delete screenshots", href: "/settings/screenshot/delete" },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-white w-full">
      <SettingsHeader
        title="Activity & Tracking"
        Icon={Activity}
        tabs={tabs}
        sidebarItems={sidebarItems}
        activeItemId="delete"
      />

      {/* Content */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full text-slate-900 font-normal">
          {/* Delete Screenshots Section */}
          <div className="space-y-6">
            {/* Global Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-normal text-slate-900">DELETE SCREENSHOTS</h2>
                <Info className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600 font-light leading-relaxed">
                This setting allows Owners, Organization managers, Team leads with permission and Project managers to delete screenshots for themselves and other team members.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">GLOBAL:</span>
                    <Info className="h-4 w-4 text-slate-400" />
                  </div>
                  {/* Toggle Switch with Off/On labels */}
                  <div className="flex items-center gap-1 rounded-full border border-slate-300 bg-slate-200 p-1 shadow-inner h-10 overflow-hidden">
                    <button
                      onClick={() => handleGlobalDeleteSetting(false)}
                      className={`px-5 py-1.5 text-xs font-light rounded-xl transition-all h-full ${!globalAllowDelete
                        ? "bg-white text-slate-900 shadow-sm"
                        : "bg-transparent text-slate-400 hover:text-slate-600"
                        }`}
                    >
                      Off
                    </button>
                    <button
                      onClick={() => handleGlobalDeleteSetting(true)}
                      className={`px-5 py-1.5 text-xs font-light rounded-xl transition-all h-full ${globalAllowDelete
                        ? "bg-white text-slate-900 shadow-sm"
                        : "bg-transparent text-slate-400 hover:text-slate-600"
                        }`}
                    >
                      On
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Settings */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                  <h3 className="text-lg font-normal text-slate-900">Individual settings</h3>
                  <p className="text-sm text-slate-500 font-light mt-1">
                    Override the organization default for specific members
                  </p>
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
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200 hidden sm:table-header-group">
                    <tr>
                      <th className="px-5 py-3 text-left text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                        Name
                      </th>
                      <th className="px-5 py-3 text-right text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                        Retention policy
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={2} className="px-5 py-12 text-center text-sm text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                            <span className="text-[10px] font-light uppercase tracking-widest text-slate-400">Loading members...</span>
                          </div>
                        </td>
                      </tr>
                    ) : members.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-5 py-12 text-center text-sm text-slate-400">
                          <span className="text-[10px] font-light uppercase tracking-widest">No members found</span>
                        </td>
                      </tr>
                    ) : members.map(member => {
                      const retentionDays = getMemberRetention(member.id)
                      return (
                        <tr key={member.id} className="hover:bg-slate-50/50 flex flex-col sm:table-row py-4 sm:py-0 border-b border-slate-100 last:border-0 transition-colors group">
                          <td className="px-5 py-4 sm:table-cell align-middle">
                            <div className="flex items-center gap-3">
                              <MemberAvatar
                                src={member.avatarUrl}
                                name={member.name}
                                className="h-9 w-9"
                              />
                              <span className="text-sm font-normal text-slate-900 group-hover:text-slate-950 transition-colors uppercase tracking-tight">
                                {member.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 sm:table-cell align-middle text-right">
                            <div className="flex justify-between sm:justify-end items-center gap-4">
                              <span className="text-[10px] font-medium text-slate-400 sm:hidden uppercase tracking-widest">Retention:</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={retentionDays}
                                  onChange={(e) => handleMemberRetentionChange(member.id, parseInt(e.target.value) || 0)}
                                  className="w-16 h-10 px-3 py-1 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all font-light"
                                  min="0"
                                />
                                <span className="text-xs text-slate-500 font-light">days</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                    }
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!loading && members.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 gap-4 px-2">
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
    </div>
  )
}

