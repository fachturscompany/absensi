"use client"

import { useState, useEffect } from "react"

import { Info, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { useOrgStore } from "@/store/org-store"
import { getMembersForScreenshot, type ISimpleMember } from "@/action/screenshots"
import { getScreenshotSettings, upsertScreenshotSetting } from "@/action/screenshot-settings"
import { ActivityTrackingHeader } from "@/components/settings/ActivityTrackingHeader"
import { ScreenshotsSidebar } from "@/components/settings/ScreenshotsSidebar"

export default function ScreenshotDeletePage() {
  const { organizationId } = useOrgStore()

  const [members, setMembers] = useState<ISimpleMember[]>([])
  const [totalMembers, setTotalMembers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [globalDelete, setGlobalDelete] = useState(false)
  const [memberDeletes, setMemberDeletes] = useState<Record<string, boolean>>({})

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
            setGlobalDelete(settingsRes.data.global.allow_delete)
          }

          // Set Member Deletes
          const overrides: Record<string, boolean> = {}
          Object.entries(settingsRes.data.members).forEach(([memIdStr, setting]) => {
            overrides[memIdStr] = setting.allow_delete
          })
          setMemberDeletes(overrides)
        }
      } catch (err) {
        console.error("Failed to load screenshot delete settings", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [organizationId, currentPage, searchQuery])

  const getMemberDelete = (memberId: string) => {
    return memberDeletes[memberId] !== undefined ? memberDeletes[memberId] : globalDelete
  }

  // const setGlobalDeleteSetting = async (value: boolean) => {
  //   setGlobalDelete(value)
  //
  //   if (!organizationId) return
  //   try {
  //     await upsertScreenshotSetting({
  //       organization_id: Number(organizationId),
  //       organization_member_id: null,
  //       allow_delete: value
  //     })
  //   } catch (e) {
  //     console.error("Failed to update global delete", e)
  //   }
  // }

  const handleMemberDeleteChange = async (memberId: string, checked: boolean) => {
    setMemberDeletes(prev => ({
      ...prev,
      [memberId]: checked
    }))

    if (!organizationId) return
    try {
      await upsertScreenshotSetting({
        organization_id: Number(organizationId),
        organization_member_id: Number(memberId),
        allow_delete: checked
      })
    } catch (e) {
      console.error("Failed to update member delete setting", e)
    }
  }

  const totalPages = Math.ceil(totalMembers / itemsPerPage)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  return (
    <div className="flex flex-col min-h-screen bg-white w-full">
      <ActivityTrackingHeader activeTab="screenshots" />

      {/* Main Content */}
      <div className="flex flex-1 w-full">
        {/* Left Sidebar */}
        {/* Left Sidebar */}
        <ScreenshotsSidebar activeItem="delete" />

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {/* Delete Screenshots Section */}
          <div className="space-y-6">
            {/* Global Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">DELETE SCREENSHOTS</h2>
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
                      onClick={() => setGlobalDelete(false)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${!globalDelete
                        ? "bg-white text-slate-900 shadow-sm"
                        : "bg-transparent text-slate-600"
                        }`}
                    >
                      Off
                    </button>
                    <button
                      onClick={() => setGlobalDelete(true)}
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Individual settings</h3>
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
                    className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Members Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
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
                      const memberCanDelete = getMemberDelete(member.id)
                      return (
                        <tr key={member.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
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
                          <td className="px-4 py-3">
                            <div className="flex justify-end">
                              {/* Toggle Switch with Off/On labels */}
                              <div className="flex items-center gap-1 rounded-full border border-slate-300 bg-slate-200 p-1">
                                <button
                                  onClick={() => handleMemberDeleteChange(member.id, false)}
                                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${!memberCanDelete
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "bg-transparent text-slate-600"
                                    }`}
                                >
                                  Off
                                </button>
                                <button
                                  onClick={() => handleMemberDeleteChange(member.id, true)}
                                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${memberCanDelete
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "bg-transparent text-slate-600"
                                    }`}
                                >
                                  On
                                </button>
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

