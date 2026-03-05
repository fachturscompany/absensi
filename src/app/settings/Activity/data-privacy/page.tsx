"use client"

import { useState } from "react"

import { Info, Search } from "lucide-react"
import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"
import { SettingsHeader, SettingTab } from "@/components/settings/SettingsHeader"
import { Activity } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"

export default function DataPrivacyPage() {
  const [globalDataPrivacy, setGlobalDataPrivacy] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [memberDataPrivacy, setMemberDataPrivacy] = useState<Record<string, boolean>>({})

  const filteredMembers = DUMMY_MEMBERS.filter(member => {
    const fullName = member.name.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase())
  })

  const handleGlobalDataPrivacyChange = (value: boolean) => {
    setGlobalDataPrivacy(value)
  }

  const handleMemberDataPrivacyChange = (memberId: string, value: boolean) => {
    setMemberDataPrivacy(prev => ({
      ...prev,
      [memberId]: value
    }))
  }

  const getMemberDataPrivacy = (memberId: string): boolean => {
    return memberDataPrivacy[memberId] !== undefined ? memberDataPrivacy[memberId] : globalDataPrivacy
  }

  const tabs: SettingTab[] = [
    { label: "ACTIVITY", href: "/settings/Activity", active: true },
    { label: "TIMESHEETS", href: "/settings/Timesheet", active: false },
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

      {/* Main Content */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Data Privacy Section */}
          <div className="space-y-6">
            {/* Information Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-slate-200/50 flex items-center justify-center shrink-0">
                <Info className="h-5 w-5 text-slate-600" />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Apps & URLs data will be visible when looking at <span className="font-normal text-slate-900">All members</span> or <span className="font-normal text-slate-900">Teams data</span>.
              </p>
            </div>

            {/* Global Settings */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-2">
                <h2 className="text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em]">DATA PRIVACY</h2>
                <Info className="h-3.5 w-3.5 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                Turning this setting on will blur individual members apps and URLs info on dashboards. Apps & URLs reports and activity pages will be hidden.
              </p>

              <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl inline-block w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest whitespace-nowrap">GLOBAL SETTING:</span>
                    <Info className="h-3.5 w-3.5 text-slate-300" />
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Toggle Switch with Off/On labels */}
                    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1 shadow-inner">
                      <button
                        onClick={() => handleGlobalDataPrivacyChange(false)}
                        className={`px-5 py-1.5 text-xs font-normal rounded-full transition-all ${!globalDataPrivacy
                          ? "bg-white text-slate-900 shadow-sm"
                          : "bg-transparent text-slate-400"
                          }`}
                      >
                        Off
                      </button>
                      <button
                        onClick={() => handleGlobalDataPrivacyChange(true)}
                        className={`px-5 py-1.5 text-xs font-normal rounded-full transition-all ${globalDataPrivacy
                          ? "bg-white text-slate-900 shadow-sm"
                          : "bg-transparent text-slate-400"
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
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Override the organization default for specific members
                  </p>
                </div>
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full sm:w-64 border border-slate-200 rounded-full focus:outline-none focus:ring-1 focus:ring-slate-900 text-sm h-10 transition-all bg-white"
                  />
                </div>
              </div>

              {/* Members Table */}
              <div className="mt-8">
                {/* Table Header - Hidden on mobile */}
                <div className="hidden sm:grid grid-cols-2 py-3 border-b border-slate-100 px-2">
                  <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">Name</span>
                  <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest text-right">Privacy Mode</span>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-slate-100">
                  {filteredMembers.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-sm text-slate-500">No members found</p>
                    </div>
                  ) : (
                    filteredMembers.map((member) => {
                      const memberDataPrivacyValue = getMemberDataPrivacy(member.id)
                      return (
                        <div key={member.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-5 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 px-2 rounded-xl transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors text-slate-400 font-normal text-xs uppercase">
                              {member.name.charAt(0)}
                            </div>
                            <span className="text-sm font-normal text-slate-900 group-hover:text-slate-950 transition-colors uppercase tracking-tight">{member.name}</span>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-6 bg-slate-100 sm:bg-slate-50 rounded-2xl p-1 w-full sm:w-fit shadow-inner">
                            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest sm:hidden pl-3">Privacy:</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleMemberDataPrivacyChange(member.id, false)}
                                className={`px-5 py-1.5 text-[10px] font-normal rounded-xl transition-all uppercase tracking-widest ${!memberDataPrivacyValue
                                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                  : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                                  }`}
                              >
                                Off
                              </button>
                              <button
                                onClick={() => handleMemberDataPrivacyChange(member.id, true)}
                                className={`px-5 py-1.5 text-[10px] font-normal rounded-xl transition-all uppercase tracking-widest ${memberDataPrivacyValue
                                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                  : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                                  }`}
                              >
                                On
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

