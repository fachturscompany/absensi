"use client"

import { useState, useEffect } from "react"
import { Activity } from "lucide-react"
import { useOrgStore } from "@/store/org-store"
import { getMembersForScreenshot, type ISimpleMember } from "@/action/activity/screenshot"
import { getScreenshotSettings, upsertScreenshotSetting } from "@/action/screenshot-settings"
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { ScreenshotGlobalSettings } from "@/components/settings/screenshot/ScreenshotGlobalSettings"
import { ScreenshotMemberTable } from "@/components/settings/screenshot/ScreenshotMemberTable"

export default function ScreenshotSettingsPage() {
  const { organizationId } = useOrgStore()

  const [members, setMembers] = useState<ISimpleMember[]>([])
  const [totalMembers, setTotalMembers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [globalFrequency, setGlobalFrequency] = useState("1x")
  const [searchQuery, setSearchQuery] = useState("")
  const [memberFrequencies, setMemberFrequencies] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const frequencyOptions = ["Off", "1x", "2x", "3x", "4x", "5x", "6x"]

  // Map frequency seconds to string and vice-versa
  const mapSecondsToFrequencyString = (seconds: number): string => {
    if (seconds <= 0) return "Off"
    const times = Math.round(600 / seconds)
    return `${times}x`
  }
  const mapFrequencyStringToSeconds = (str: string): number => {
    if (str === "Off") return 0
    const times = parseInt(str.replace("x", ""), 10)
    if (isNaN(times) || times <= 0) return 600
    return Math.floor(600 / times)
  }

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
          if (settingsRes.data.global) {
            setGlobalFrequency(mapSecondsToFrequencyString(settingsRes.data.global.frequency_seconds))
          }

          const overrides: Record<string, string> = {}
          Object.entries(settingsRes.data.members).forEach(([memIdStr, setting]) => {
            overrides[memIdStr] = mapSecondsToFrequencyString(setting.frequency_seconds)
          })
          setMemberFrequencies(overrides)
        }
      } catch (err) {
        console.error("Failed to load screenshot settings data", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [organizationId, currentPage, searchQuery])

  const totalPages = Math.ceil(totalMembers / itemsPerPage)

  const handleApplyToAll = async () => {
    alert("Apply to All updates the default frequency for members without personal overrides.")
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleGlobalFrequencyChange = async (value: string) => {
    setGlobalFrequency(value)
    if (!organizationId) return
    try {
      await upsertScreenshotSetting({
        organization_id: Number(organizationId),
        organization_member_id: null,
        frequency_seconds: mapFrequencyStringToSeconds(value)
      })
    } catch (e) {
      console.error("Failed to update global frequency", e)
    }
  }

  const handleMemberFrequencyChange = async (memberId: string, value: string) => {
    setMemberFrequencies(prev => ({
      ...prev,
      [memberId]: value
    }))

    if (!organizationId) return
    try {
      await upsertScreenshotSetting({
        organization_id: Number(organizationId),
        organization_member_id: Number(memberId),
        frequency_seconds: mapFrequencyStringToSeconds(value)
      })
    } catch (e) {
      console.error("Failed to update member frequency", e)
    }
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
    <div className="flex flex-col min-h-screen bg-white w-full">
      <SettingsHeader
        title="Activity & Tracking"
        Icon={Activity}
        tabs={tabs}
        sidebarItems={sidebarItems}
        activeItemId="frequency"
      />
      <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="frequency">
        <div className="flex flex-1 w-full overflow-hidden">
          <div className="flex-1 p-4 md:p-6 w-full overflow-x-hidden">
            <div className="space-y-8">
              <ScreenshotGlobalSettings
                globalFrequency={globalFrequency}
                onGlobalFrequencyChange={handleGlobalFrequencyChange}
                onApplyToAll={handleApplyToAll}
                frequencyOptions={frequencyOptions}
              />

              <ScreenshotMemberTable
                members={members}
                loading={loading}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                currentPage={currentPage}
                totalPages={totalPages}
                totalMembers={totalMembers}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                memberFrequencies={memberFrequencies}
                globalFrequency={globalFrequency}
                frequencyOptions={frequencyOptions}
                onMemberFrequencyChange={handleMemberFrequencyChange}
              />
            </div>
          </div>
        </div>
      </SettingsContentLayout>
    </div>
  )
}
