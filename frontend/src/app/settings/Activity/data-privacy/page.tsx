"use client"

import { useState, useEffect } from "react"
import { Info, Search, Loader2 } from "lucide-react"
import {  SettingsHeader, SettingTab , SettingsContentLayout } from "@/components/settings/SettingsHeader"
import { Activity } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { useOrgStore } from "@/store/org-store"
import { getMembersForScreenshot } from "@/action/activity/screenshot"
import { getOrgSettings, upsertOrgSetting, getAllMemberSettings, upsertMemberSetting } from "@/action/organization-settings"
import { toast } from "sonner"
import { MemberAvatar } from "@/components/profile&image/MemberAvatar"

interface MemberWithSetting {
  id: string
  name: string
  avatar?: string | null
  dataPrivacy: boolean
}

export default function DataPrivacyPage() {
  const organizationId = useOrgStore((s) => s.organizationId)

  const [loading, setLoading] = useState(true)
  const [globalDataPrivacy, setGlobalDataPrivacy] = useState(false)
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

        let gOption = false
        if (orgSettingsRes.success && orgSettingsRes.data) {
          if (orgSettingsRes.data.data_privacy !== undefined) {
            setGlobalDataPrivacy(!!orgSettingsRes.data.data_privacy)
            gOption = !!orgSettingsRes.data.data_privacy
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
              dataPrivacy: settings.data_privacy !== undefined ? !!settings.data_privacy : gOption
            }
          })
          setMembers(mapped)
          setTotalMembers(membersRes.total ?? 0)
        }
      } catch (err) {
        console.error("Failed to load data privacy data", err)
        toast.error("Failed to load settings")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [organizationId, currentPage, searchQuery])

  const handleGlobalDataPrivacyChange = async (value: boolean) => {
    if (!organizationId) return

    const previous = globalDataPrivacy
    setGlobalDataPrivacy(value)

    try {
      const res = await upsertOrgSetting(String(organizationId), {
        data_privacy: value
      })
      if (!res.success) throw new Error(res.message)
      toast.success("Default setting updated")
    } catch (err) {
      setGlobalDataPrivacy(previous)
      toast.error("Failed to update default")
    }
  }

  const handleMemberDataPrivacyChange = async (memberId: string, value: boolean) => {
    const originalMember = members.find(m => m.id === memberId)
    if (!originalMember) return

    setMembers(prev =>
      prev.map(member =>
        member.id === memberId ? { ...member, dataPrivacy: value } : member
      )
    )

    try {
      const res = await upsertMemberSetting(memberId, {
        data_privacy: value
      })
      if (!res.success) throw new Error(res.message)
      toast.success("Member setting updated")
    } catch (err) {
      setMembers(prev =>
        prev.map(member =>
          member.id === memberId ? originalMember : member
        )
      )
      toast.error("Failed to update member setting")
    }
  }

  const tabs: SettingTab[] = [
    { label: "ACTIVITY", href: "/settings/Activity", active: true },
    { label: "TIMESHEETS", href: "/settings/timesheets", active: false },
    { label: "TRACKING", href: "/settings/tracking", active: false },
    { label: "SCREENSHOTS", href: "/settings/screenshot", active: false },
  ]

  const sidebarItems: SidebarItem[] = [
    { id: "track-apps-urls", label: "Apps & URLs tracking", href: "/settings/Activity" },
    { id: "record-activity", label: "Record activity", href: "/settings/Activity/record-activity" },
    { id: "track-apps-urls-detailed", label: "Track apps & URLs", href: "/settings/Activity/track-apps-urls" },
    { id: "data-privacy", label: "Data privacy", href: "/settings/Activity/data-privacy" },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-white w-full">
      <SettingsHeader
        title="Activity & Tracking"
        Icon={Activity}
        tabs={tabs}
        sidebarItems={sidebarItems}
        activeItemId="data-privacy"
      />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="data-privacy">

      {/* Main Content */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full text-slate-900 font-normal">
          {/* Data Privacy Section */}
          <div className="space-y-6">
            {/* Information Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-slate-200/50 flex items-center justify-center shrink-0">
                <Info className="h-5 w-5 text-slate-600 font-light" />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-light">
                Apps & URLs data will be visible when looking at <span className="font-normal text-slate-900">All members</span> or <span className="font-normal text-slate-900">Teams data</span>.
              </p>
            </div>

            {/* Global Settings */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-2">
                <h2 className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">DATA PRIVACY</h2>
                <Info className="h-3.5 w-3.5 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-2xl font-light">
                Turning this setting on will blur individual members apps and URLs info on dashboards. Apps & URLs reports and activity pages will be hidden.
              </p>

              <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl inline-block w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest whitespace-nowrap">GLOBAL SETTING:</span>
                    <Info className="h-3.5 w-3.5 text-slate-300" />
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Toggle Switch with Off/On labels */}
                    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1 shadow-inner h-10 overflow-hidden">
                      <button
                        onClick={() => handleGlobalDataPrivacyChange(false)}
                        className={`px-5 py-1.5 text-xs font-light rounded-xl transition-all h-full ${!globalDataPrivacy
                          ? "bg-white text-slate-900 shadow-sm"
                          : "bg-transparent text-slate-400 hover:text-slate-600"
                          }`}
                      >
                        Off
                      </button>
                      <button
                        onClick={() => handleGlobalDataPrivacyChange(true)}
                        className={`px-5 py-1.5 text-xs font-light rounded-xl transition-all h-full ${globalDataPrivacy
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
            </div>

            {/* Individual Settings */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-2">
                <div>
                  <h3 className="text-lg font-normal text-slate-900 tracking-tight mb-1">Individual settings</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-light">
                    Override the organization default for specific members
                  </p>
                </div>
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="pl-10 pr-4 py-2 w-full sm:w-64 border border-slate-200 rounded-full focus:outline-none focus:ring-1 focus:ring-slate-900 text-sm h-10 transition-all bg-white font-light"
                  />
                </div>
              </div>

              {/* Members Table */}
              <div className="mt-8">
                {/* Table Header - Hidden on mobile */}
                <div className="hidden sm:grid grid-cols-2 py-3 border-b border-slate-100 px-2">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Name</span>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest text-right">Privacy Mode</span>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-slate-100 min-h-[200px] relative">
                  {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                    </div>
                  ) : null}

                  {members.length === 0 && !loading ? (
                    <div className="py-12 text-center">
                      <p className="text-sm text-slate-500 font-light">No members found</p>
                    </div>
                  ) : (
                    members.map((member) => (
                      <div key={member.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-5 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 px-2 rounded-xl transition-colors group">
                        <div className="flex items-center gap-3">
                          <MemberAvatar
                            src={member.avatar}
                            name={member.name}
                            className="w-9 h-9"
                          />
                          <span className="text-sm font-normal text-slate-900 group-hover:text-slate-950 transition-colors uppercase tracking-tight">{member.name}</span>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 bg-slate-100 sm:bg-slate-50 rounded-2xl p-1 w-full sm:w-fit shadow-inner h-10 overflow-hidden">
                          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest sm:hidden pl-3">Privacy:</span>
                          <div className="flex items-center gap-1 h-full">
                            <button
                              onClick={() => handleMemberDataPrivacyChange(member.id, false)}
                              className={`px-5 py-1.5 text-[10px] font-light rounded-xl transition-all uppercase tracking-widest h-full ${!member.dataPrivacy
                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                                }`}
                            >
                              Off
                            </button>
                            <button
                              onClick={() => handleMemberDataPrivacyChange(member.id, true)}
                              className={`px-5 py-1.5 text-[10px] font-light rounded-xl transition-all uppercase tracking-widest h-full ${member.dataPrivacy
                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                                }`}
                            >
                              On
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination Footer */}
                {!loading && totalMembers > itemsPerPage && (
                  <div className="flex items-center justify-between py-6 border-t border-slate-50 mt-4">
                    <p className="text-xs text-slate-400 font-light">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalMembers)} of {totalMembers} members
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-50 hover:bg-slate-50 text-slate-600 font-light transition-colors"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={currentPage * itemsPerPage >= totalMembers}
                        className="px-4 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-50 hover:bg-slate-50 text-slate-600 font-light transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    
            </SettingsContentLayout>
</div>
  )
}

