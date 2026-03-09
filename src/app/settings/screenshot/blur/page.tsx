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

export default function ScreenshotBlurPage() {
  const { organizationId } = useOrgStore()

  const [members, setMembers] = useState<ISimpleMember[]>([])
  const [totalMembers, setTotalMembers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [globalBlur, setGlobalBlurState] = useState(false)
  const [memberBlurs, setMemberBlurs] = useState<Record<string, boolean>>({})

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
            setGlobalBlurState(settingsRes.data.global.blur_screenshots)
          }

          // Set Member Blurs
          const overrides: Record<string, boolean> = {}
          Object.entries(settingsRes.data.members).forEach(([memIdStr, setting]) => {
            overrides[memIdStr] = setting.blur_screenshots
          })
          setMemberBlurs(overrides)
        }
      } catch (err) {
        console.error("Failed to load screenshot blur settings", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [organizationId, currentPage, searchQuery])

  const getMemberBlur = (memberId: string) => {
    return memberBlurs[memberId] !== undefined ? memberBlurs[memberId] : globalBlur
  }

  const setGlobalBlur = async (value: boolean) => {
    setGlobalBlurState(value)

    if (!organizationId) return
    try {
      await upsertScreenshotSetting({
        organization_id: Number(organizationId),
        organization_member_id: null,
        blur_screenshots: value
      })
    } catch (e) {
      console.error("Failed to update global blur", e)
    }
  }

  const setMemberBlur = async (memberId: string, value: boolean) => {
    setMemberBlurs(prev => ({
      ...prev,
      [memberId]: value
    }))

    if (!organizationId) return
    try {
      await upsertScreenshotSetting({
        organization_id: Number(organizationId),
        organization_member_id: Number(memberId),
        blur_screenshots: value
      })
    } catch (e) {
      console.error("Failed to update member blur", e)
    }
  }

  const totalPages = Math.ceil(totalMembers / itemsPerPage)

  // Reset to first page when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }


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
    <div className="flex flex-col min-h-screen bg-white">
      <SettingsHeader
        title="Activity & tracking"
        Icon={Activity}
        tabs={tabs}
        sidebarItems={sidebarItems}
        activeItemId="blur"
      />
      {/* Main Content */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
          {/* Screenshot Blur Section */}
          <div className="space-y-6">
            {/* Global Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-normal text-slate-900">SCREENSHOT BLUR</h2>
                <Info className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600">
                Control whether the desktop app blurs screenshots for security and privacy.
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
                      onClick={() => setGlobalBlur(false)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${!globalBlur
                        ? "bg-white text-slate-900 shadow-sm"
                        : "bg-transparent text-slate-600"
                        }`}
                    >
                      Off
                    </button>
                    <button
                      onClick={() => setGlobalBlur(true)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${globalBlur
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
                        Blur
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
                    ) : (
                      members.map((member) => {
                        const memberBlur = getMemberBlur(member.id)
                        return (
                          <tr key={member.id} className="hover:bg-slate-50 flex flex-col sm:table-row py-4 sm:py-0 border-b border-slate-100 last:border-0">
                            <td className="px-4 py-3 sm:table-cell">
                              <div className="flex items-center gap-3">
                                <MemberAvatar
                                  src={member.avatarUrl}
                                  name={member.name}
                                  className="h-8 w-8"
                                />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-slate-900">{member.name}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 sm:table-cell">
                              <div className="flex justify-between sm:justify-end items-center gap-2">
                                <span className="text-xs font-medium text-slate-500 sm:hidden uppercase tracking-wider">Blur:</span>
                                {/* Toggle Switch with Off/On labels */}
                                <div className="flex items-center gap-1 rounded-full border border-slate-300 bg-slate-200 p-1">
                                  <button
                                    onClick={() => {
                                      console.log("Setting blur OFF for member:", member.id, member.name)
                                      setMemberBlur(member.id, false)
                                    }}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${!memberBlur
                                      ? "bg-white text-slate-900 shadow-sm border border-slate-200 sm:border-0"
                                      : "bg-transparent text-slate-600"
                                      }`}
                                  >
                                    Off
                                  </button>
                                  <button
                                    onClick={() => {
                                      console.log("Setting blur ON for member:", member.id, member.name)
                                      setMemberBlur(member.id, true)
                                    }}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${memberBlur
                                      ? "bg-white text-slate-900 shadow-sm border border-slate-200 sm:border-0"
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
                    )}
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

