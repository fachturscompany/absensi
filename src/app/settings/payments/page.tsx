"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Info } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"
import { Users } from "lucide-react"
import { useOrgStore } from "@/store/org-store"
import { getOrgSettings, upsertOrgSetting } from "@/action/organization-settings"
import { SidebarItem } from "@/components/settings/SettingsSidebar"

export default function PaymentsPage() {
  const { organizationId } = useOrgStore()
  const [loading, setLoading] = useState(true)

  const DEFAULT_PROCESS: "manually" | "automatically" = "manually"
  const DEFAULT_DELAY_DAYS = "0"
  const DEFAULT_PROOF_ENABLED = true

  // Local state for form
  const [processPayments, setProcessPayments] = useState<"manually" | "automatically">(DEFAULT_PROCESS)
  const [delayDays, setDelayDays] = useState(DEFAULT_DELAY_DAYS)
  const [proofOfPaymentEnabled, setProofOfPaymentEnabled] = useState(DEFAULT_PROOF_ENABLED)

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
          const s = res.data
          if (s.payment_process) setProcessPayments(s.payment_process)
          if (s.payment_delay_days !== undefined) setDelayDays(String(s.payment_delay_days))
          if (s.proof_of_payment_enabled !== undefined) setProofOfPaymentEnabled(s.proof_of_payment_enabled)
        }
      } catch (err) {
        console.error("Failed to load payment settings", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [organizationId])

  const handleCancel = () => {
    window.location.reload()
  }

  const handleSave = async () => {
    if (!organizationId) return
    try {
      setLoading(true)
      const res = await upsertOrgSetting(String(organizationId), {
        payment_process: processPayments,
        payment_delay_days: parseInt(delayDays) || 0,
        proof_of_payment_enabled: proofOfPaymentEnabled
      })
      if (!res.success) throw new Error(res.message)
      toast.success("Payment settings saved")
    } catch (err) {
      toast.error("Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  if (loading && !organizationId) {
    return null
  }

  const tabs: SettingTab[] = [
    { label: "EMAIL NOTIFICATIONS", href: "/settings/members/email-notifications", active: false },
    { label: "WORK TIME LIMITS", href: "/settings/work-time-limit", active: false },
    { label: "PAYMENTS", href: "/settings/payments", active: true },
    { label: "ACHIEVEMENTS", href: "/settings/Achievements", active: false },
  ]

  const sidebarItems: SidebarItem[] = [
    { id: "payments", label: "Payments", href: "/settings/payments" },
    { id: "billing-history", label: "Billing history", href: "/settings/payments/billing-history" },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SettingsHeader
        title="Members"
        Icon={Users}
        tabs={tabs}
        sidebarItems={sidebarItems}
        activeItemId="payments"
      />
      <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="payments">
        <div className="flex flex-1 w-full">
          {/* Main Content */}
          <div className="flex-1 p-4 md:p-8 w-full overflow-x-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-x-16 gap-y-8 w-full max-w-[1500px] items-start">
              {/* Left Column: Settings Form */}
              <div className="space-y-10 order-1">
                {/* Process Payments Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-normal text-slate-900 uppercase tracking-tight">Process Payments</h2>
                    <Info className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 max-w-md">
                    Choose whether you want to manually send payments or have them automatically processed.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setProcessPayments("manually")}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${processPayments === "manually"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                      Manually
                    </button>
                    <button
                      type="button"
                      onClick={() => setProcessPayments("automatically")}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${processPayments === "automatically"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                      Automatically
                    </button>
                  </div>
                </div>

                {/* Delay payroll Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-normal text-slate-900 uppercase tracking-tight">Delay payroll</h2>
                    <Info className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 max-w-md">
                    Set a payroll delay so that all payments can be made at one time
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="delay-days" className="text-[10px] font-normal text-slate-400 uppercase tracking-wider">
                        SEND PAYMENTS AFTER
                      </Label>
                      <Info className="h-3 w-3 text-slate-300" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        id="delay-days"
                        type="number"
                        value={delayDays}
                        onChange={(e) => setDelayDays(e.target.value)}
                        className="w-24 h-10 border-slate-200 focus:ring-slate-900 rounded-lg text-center"
                        min="0"
                      />
                      <span className="text-sm font-medium text-slate-600">days</span>
                    </div>
                  </div>
                </div>

                {/* Proof of Payment PDF Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-normal text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      Proof of Payment PDF
                      <span className="px-2 py-0.5 text-[10px] uppercase font-normal text-white bg-slate-700 rounded-md">
                        New
                      </span>
                    </h2>
                    <Info className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 max-w-md">
                    Choose whether you want members paid through payroll integrations (Wise, PayPal or Payoneer) to receive emails with PDF attachments.
                  </p>

                  <div className="flex items-center gap-2">
                    <div className="relative inline-flex items-center bg-slate-100 border border-slate-200 rounded-full p-1 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setProofOfPaymentEnabled(false)}
                        className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${!proofOfPaymentEnabled
                          ? "bg-white text-slate-900 shadow-sm"
                          : "bg-transparent text-slate-500"
                          }`}
                      >
                        Off
                      </button>
                      <button
                        type="button"
                        onClick={() => setProofOfPaymentEnabled(true)}
                        className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${proofOfPaymentEnabled
                          ? "bg-white text-slate-900 shadow-sm"
                          : "bg-transparent text-slate-500"
                          }`}
                      >
                        On
                      </button>
                    </div>
                  </div>

                  {proofOfPaymentEnabled && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center shrink-0">
                          <Info className="h-4 w-4 text-slate-600 font-normal" />
                        </div>
                        <div className="text-sm text-slate-600 leading-relaxed">
                          <p className="font-normal text-slate-900 mb-1">Information Details</p>
                          <p className="mb-3">Member and organization details will be included in the PDF attachment.</p>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-slate-400" />
                              Update member details in their profile
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-slate-400" />
                              Update organization details in settings
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="w-full sm:w-auto h-11 px-8 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    className="w-full sm:w-auto h-11 px-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200 transition-all"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>

              {/* Right Column: Illustration - Only show on desktop and when enabled */}
              {proofOfPaymentEnabled && (
                <div className="flex items-start justify-center pt-8 order-2 lg:order-2 lg:sticky lg:top-16">
                  <div className="relative w-full aspect-square lg:max-w-none mx-auto scale-110 xl:scale-125 transition-transform duration-500">
                    <Image
                      src="/images/payment.png"
                      alt="Payment Illustration"
                      fill
                      className="object-contain drop-shadow-2xl"
                      priority
                      unoptimized
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SettingsContentLayout>
    </div>
  )
}
