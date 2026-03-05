"use client"

import { useState } from "react"
import { Info, Search } from "lucide-react"
import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"
import { SettingsHeader, SettingTab } from "@/components/settings/SettingsHeader"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { Star, Activity } from "lucide-react"

type AllowedAppsOption = "all" | "desktop" | "mobile"

export default function AllowedAppsPage() {
  const [globalAllowedApps, setGlobalAllowedApps] = useState<AllowedAppsOption>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [memberAllowedApps, setMemberAllowedApps] = useState<Record<string, AllowedAppsOption>>({})

  const filteredMembers = DUMMY_MEMBERS.filter(member => {
    const fullName = member.name.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase())
  })

  const handleGlobalAllowedAppsChange = (value: AllowedAppsOption) => {
    setGlobalAllowedApps(value)
  }

  const handleMemberAllowedAppsChange = (memberId: string, value: AllowedAppsOption) => {
    setMemberAllowedApps(prev => ({
      ...prev,
      [memberId]: value
    }))
  }

  const getMemberAllowedApps = (memberId: string): AllowedAppsOption => {
    return memberAllowedApps[memberId] || globalAllowedApps
  }

  const tabs: SettingTab[] = [
    { label: "ACTIVITY", href: "/settings/Activity", active: false },
    { label: "TIMESHEETS", href: "/settings/Timesheet", active: false },
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

      {/* Content */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
          {/* Allowed Apps Section */}
          <div className="space-y-6">
            {/* Global Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-normal text-slate-900">ALLOWED APPS</h2>
                <Info className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600">
                Control which timer apps the team member can use.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">GLOBAL:</span>
                    <Info className="h-4 w-4 text-slate-400" />
                  </div>
                  {/* Toggle Switch with All apps, Desktop only, Mobile only */}
                  <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-300 bg-slate-200 p-1 w-fit">
                    <button
                      onClick={() => handleGlobalAllowedAppsChange("all")}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${globalAllowedApps === "all"
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200 sm:border-0"
                        : "bg-transparent text-slate-600"
                        }`}
                    >
                      All apps
                    </button>
                    <button
                      onClick={() => handleGlobalAllowedAppsChange("desktop")}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${globalAllowedApps === "desktop"
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200 sm:border-0"
                        : "bg-transparent text-slate-600"
                        }`}
                    >
                      Desktop only
                    </button>
                    <button
                      onClick={() => handleGlobalAllowedAppsChange("mobile")}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${globalAllowedApps === "mobile"
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200 sm:border-0"
                        : "bg-transparent text-slate-600"
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search members"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                        Allowed apps
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-8 text-center text-sm text-slate-500">
                          No members found
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((member) => {
                        const memberAllowedAppsValue = getMemberAllowedApps(member.id)
                        return (
                          <tr key={member.id} className="hover:bg-slate-50 flex flex-col sm:table-row py-4 sm:py-0 border-b border-slate-100 last:border-0">
                            <td className="px-4 py-3 sm:table-cell">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                                  <span className="text-xs font-medium text-slate-900">
                                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                  </span>
                                </div>
                                <span className="text-sm text-slate-900">
                                  {member.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 sm:table-cell">
                              <div className="flex justify-between sm:justify-end items-center gap-2">
                                <span className="text-xs font-medium text-slate-500 sm:hidden uppercase tracking-wider">Allowed apps:</span>
                                {/* Toggle Switch with All apps, Desktop only, Mobile only */}
                                <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-300 bg-slate-200 p-1 w-fit">
                                  <button
                                    onClick={() => handleMemberAllowedAppsChange(member.id, "all")}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${memberAllowedAppsValue === "all"
                                      ? "bg-white text-slate-900 shadow-sm border border-slate-200 sm:border-0"
                                      : "bg-transparent text-slate-600"
                                      }`}
                                  >
                                    All apps
                                  </button>
                                  <button
                                    onClick={() => handleMemberAllowedAppsChange(member.id, "desktop")}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${memberAllowedAppsValue === "desktop"
                                      ? "bg-white text-slate-900 shadow-sm border border-slate-200 sm:border-0"
                                      : "bg-transparent text-slate-600"
                                      }`}
                                  >
                                    Desktop only
                                  </button>
                                  <button
                                    onClick={() => handleMemberAllowedAppsChange(member.id, "mobile")}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${memberAllowedAppsValue === "mobile"
                                      ? "bg-white text-slate-900 shadow-sm border border-slate-200 sm:border-0"
                                      : "bg-transparent text-slate-600"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

