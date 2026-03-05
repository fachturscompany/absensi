"use client"

import { useState, useEffect } from "react"

import { Info, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { useOrgStore } from "@/store/org-store"
import { getMembersForScreenshot, type ISimpleMember } from "@/action/screenshots"
import { getScreenshotSettings, upsertScreenshotSetting } from "@/action/screenshot-settings"
import { SettingsHeader, SettingTab } from "@/components/settings/SettingsHeader"
import { Activity } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"

export default function ScreenshotDeletePage() {
  const { organizationId } = useOrgStore()

  const [members, setMembers] = useState<ISimpleMember[]>([])
  const [totalMembers, setTotalMembers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [memberSettings, setMemberSettings] = useState<Record<string, number>>({})
  const itemsPerPage = 10

  // Dummy states and functions to prevent reference errors (UI focus)
  const [globalDelete, setGlobalDelete] = useState(false)
  const setGlobalDeleteSetting = (val: boolean) => setGlobalDelete(val)

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
          ) as any,
          getScreenshotSettings(String(organizationId))
        ])

        if (membersRes.success && membersRes.data) {
          setMembers(membersRes.data)
          setTotalMembers(membersRes.total ?? 0)
        }

        if (settingsRes.success && settingsRes.data) {
          const hours: Record<string, number> = {}
          Object.entries(settingsRes.data.members).forEach(([memIdStr, setting]) => {
            hours[memIdStr] = (setting as any).delete_after_hours || 0
          })
          setMemberSettings(hours)
        }
      } catch (err) {
        console.error("Failed to load screenshot settings data", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [organizationId, currentPage, searchQuery])

  const getMemberHours = (memberId: string) => {
    return memberSettings[memberId] ?? 0
  }

  const handleMemberHoursChange = async (memberId: string, hours: number) => {
    setMemberSettings(prev => ({
      ...prev,
      [memberId]: hours
    }))

    if (!organizationId) return
    try {
      await upsertScreenshotSetting({
        organization_id: Number(organizationId),
        organization_member_id: Number(memberId),
        delete_after_hours: hours
      } as any)
    } catch (e) {
      console.error("Failed to update delete hours", e)
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
    { label: "TIMESHEETS", href: "/settings/Timesheet", active: false },
    { label: "TRACKING", href: "/settings/tracking", active: false },
    { label: "SCREENSHOTS", href: "/settings/screenshot", active: true },
  ]

  const sidebarItems: SidebarItem[] = [
    { id: "general", label: "General", href: "/settings/screenshot" },
    { id: "delete", label: "Delete Screenshots", href: "/settings/screenshot/delete" },
    { id: "blur", label: "Blur Screenshots", href: "/settings/screenshot/blur" },
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
        <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
          {/* Delete Screenshots Section */}
          <div className="space-y-6">
            {/* Global Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-normal text-slate-900">DELETE SCREENSHOTS</h2>
                <Info className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600">
                This setting allows Owners, Organization managers, Team leads with permission and Project managers to delete screenshots for themselves and other team members.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">GLOBAL:</span>
                    <Info className="h-4 w-4 text-slate-400" />
                  </div>
                  {/* Toggle Switch with Off/On labels */}
                  <div className="flex items-center gap-1 rounded-full border border-slate-300 bg-slate-200 p-1">
                    <button
                      onClick={() => setGlobalDeleteSetting(false)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${!globalDelete
                        ? "bg-white text-slate-900 shadow-sm"
                        : "bg-transparent text-slate-600"
                        }`}
                    >
                      Off
                    </button>
                    <button
                      onClick={() => setGlobalDeleteSetting(true)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${globalDelete
                        ? "bg-white text-slate-900 shadow-sm"
                        : "bg-transparent text-slate-600"
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-normal text-slate-900">Individual settings</h3>
                  <p className="text-sm text-slate-600 mt-1">
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
                    className="pl-10 pr-4 py-2 w-full sm:w-64 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Members Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200 hidden sm:table-header-group">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-normal text-slate-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-normal text-slate-700 uppercase tracking-wider">
                        Delete
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {loading ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-8 text-center text-sm text-slate-500">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading members...
                          </div>
                        </td>
                      </tr>
                    ) : members.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-8 text-center text-sm text-slate-500">
                          No members found
                        </td>
                      </tr>
                    ) : members.map(member => {
                      const memberHours = getMemberHours(member.id)
                      return (
                        <tr key={member.id} className="hover:bg-slate-50 flex flex-col sm:table-row py-4 sm:py-0 border-b border-slate-100 last:border-0">
                          <td className="px-4 py-3 sm:table-cell">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                {member.avatarUrl ? (
                                  <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-xs font-medium text-slate-900">
                                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-slate-900">
                                {member.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 sm:table-cell text-right">
                            <div className="flex justify-between sm:justify-end items-center gap-2">
                              <span className="text-xs font-medium text-slate-500 sm:hidden uppercase tracking-wider">Delete after:</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={memberHours}
                                  onChange={(e) => handleMemberHoursChange(member.id, parseInt(e.target.value) || 0)}
                                  className="w-16 px-2 py-1 border border-slate-300 rounded text-sm text-right"
                                  min="0"
                                />
                                <span className="text-sm text-slate-600">hours</span>
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
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-slate-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalMembers)} of {totalMembers} members
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-slate-700">
                      Page {currentPage} of {totalPages || 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

