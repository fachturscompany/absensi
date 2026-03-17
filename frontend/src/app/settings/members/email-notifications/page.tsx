"use client"

import { useState, useEffect } from "react"
import { useOrgStore } from "@/store/org-store"
import { getOrgSettings, upsertOrgSetting } from "@/action/organization-settings"
import { toast } from "sonner"
import { Lock, Info } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function EmailNotificationsPage() {
  const { organizationId } = useOrgStore()
  const [loading, setLoading] = useState(true)
  const [defaultEmailNotifications, setDefaultEmailNotifications] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!organizationId) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const res = await getOrgSettings(String(organizationId))
        if (res.success && res.data) {
          if (res.data.email_notifications_enabled !== undefined) {
            setDefaultEmailNotifications(res.data.email_notifications_enabled)
          }
        }
      } catch (err) {
        console.error("Failed to load email notifications settings", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [organizationId])

  const handleToggle = async (val: boolean) => {
    setDefaultEmailNotifications(val)
    if (!organizationId) return
    try {
      await upsertOrgSetting(String(organizationId), {
        email_notifications_enabled: val
      })
      toast.success("Email notification settings updated")
    } catch (err) {
      toast.error("Failed to update settings")
    }
  }

  if (loading && !organizationId) {
    return null
  }

  const tabs: SettingTab[] = [
    { label: "EMAIL NOTIFICATIONS", href: "/settings/members/email-notifications", active: true },
    { label: "WORK TIME LIMITS", href: "/settings/work-time-limit", active: false },
    { label: "PAYMENTS", href: "/settings/payments", active: false },
    { label: "ACHIEVEMENTS", href: "/settings/Achievements", active: false },
  ]

  const sidebarItems: SidebarItem[] = [
    { id: "email-notifications", label: "Email notifications", href: "/settings/members/email-notifications" },
    { id: "templates", label: "Email templates", href: "/settings/members/email-notifications/templates" },
    { id: "alerts", label: "Alert rules", href: "/settings/members/email-notifications/alerts" },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-white w-full">
      <SettingsHeader
        title="Members"
        Icon={Users}
        tabs={tabs}
        sidebarItems={sidebarItems}
        activeItemId="email-notifications"
      />
      <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="email-notifications">

        {/* Content */}
        <div className="flex flex-1 w-full overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
            {/* Email Notifications Section */}
            <div className="space-y-6">
              {/* Feature Upgrade Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200/50 flex items-center justify-center shrink-0">
                    <Lock className="h-5 w-5 text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    This feature can be purchased by upgrading to the <span className="font-normal text-slate-900">Enterprise plan</span>.
                  </p>
                </div>
                <Button
                  variant="default"
                  className="bg-slate-900 hover:bg-slate-800 text-white h-11 px-8 rounded-lg shadow-lg shadow-slate-200 transition-all active:scale-95 w-full sm:w-auto font-medium"
                >
                  View plans & add-ons
                </Button>
              </div>

              {/* Email Notifications Section */}
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em]">EMAIL NOTIFICATIONS</h2>
                </div>
                <div className="space-y-4 text-sm text-slate-500 leading-relaxed max-w-2xl">
                  <p>
                    When creating new accounts, this sets whether the members will receive ANY email communication from Hubstaff. This includes notifications about their own work as well as anyone they might manage.
                  </p>
                  <p className="italic">
                    This setting can be altered when creating the accounts or individually overridden afterwards in the table below.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl inline-block w-full sm:w-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest whitespace-nowrap">DEFAULT SETTING:</span>
                      <Info className="h-3.5 w-3.5 text-slate-300" />
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Toggle Switch with Off/On labels */}
                      <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1 shadow-inner">
                        <button
                          onClick={() => handleToggle(false)}
                          className={`px-5 py-1.5 text-xs font-normal rounded-full transition-all ${!defaultEmailNotifications
                            ? "bg-white text-slate-900 shadow-sm"
                            : "bg-transparent text-slate-400"
                            }`}
                        >
                          Off
                        </button>
                        <button
                          onClick={() => handleToggle(true)}
                          className={`px-5 py-1.5 text-xs font-normal rounded-full transition-all ${defaultEmailNotifications
                            ? "bg-white text-slate-900 shadow-sm"
                            : "bg-transparent text-slate-400"
                            }`}
                        >
                          On
                        </button>
                      </div>
                      <span className="text-sm font-medium text-slate-600 leading-tight">
                        Allow members to receive emails
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </SettingsContentLayout>
    </div >
  )
}

