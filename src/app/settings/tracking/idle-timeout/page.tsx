"use client"

import { useState } from "react"
import { Info, Search, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"
import { SettingsHeader, SettingTab } from "@/components/settings/SettingsHeader"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { Star } from "lucide-react"

const idleTimeoutOptions = [
  "5 mins",
  "10 mins",
  "15 mins",
  "20 mins",
  "25 mins",
  "30 mins",
  "45 mins",
  "60 mins",
]

export default function IdleTimeoutPage() {
  const [globalIdleTimeout, setGlobalIdleTimeout] = useState("20 mins")
  const [searchQuery, setSearchQuery] = useState("")
  const [memberIdleTimeouts, setMemberIdleTimeouts] = useState<Record<string, string>>({})

  const filteredMembers = DUMMY_MEMBERS.filter(member => {
    const fullName = member.name.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase())
  })

  const handleGlobalIdleTimeoutChange = (value: string) => {
    setGlobalIdleTimeout(value)
  }

  const handleMemberIdleTimeoutChange = (memberId: string, value: string) => {
    setMemberIdleTimeouts(prev => ({
      ...prev,
      [memberId]: value
    }))
  }

  const handleApplyToAll = () => {
    const newTimeouts: Record<string, string> = {}
    DUMMY_MEMBERS.forEach(member => {
      newTimeouts[member.id] = globalIdleTimeout
    })
    setMemberIdleTimeouts(newTimeouts)
  }

  const getMemberIdleTimeout = (memberId: string): string => {
    return memberIdleTimeouts[memberId] || globalIdleTimeout
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
        activeItemId="idle-timeout"
      />

      {/* Content */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
          {/* Idle Timeout Section */}
          <div className="space-y-6">
            {/* Global Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-normal text-slate-900">IDLE TIMEOUT</h2>
                <Info className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600">
                Control how the desktop app detects idle time.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">GLOBAL:</span>
                    <Info className="h-4 w-4 text-slate-400" />
                  </div>
                  <Select value={globalIdleTimeout} onValueChange={handleGlobalIdleTimeoutChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {idleTimeoutOptions.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleApplyToAll}
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    Apply to all
                  </Button>
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
                        Idle timeout
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
                        const memberIdleTimeout = getMemberIdleTimeout(member.id)
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
                                <span className="text-xs font-medium text-slate-500 sm:hidden uppercase tracking-wider">Idle timeout:</span>
                                <Select
                                  value={memberIdleTimeout}
                                  onValueChange={(value) => handleMemberIdleTimeoutChange(member.id, value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {idleTimeoutOptions.map(option => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
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

