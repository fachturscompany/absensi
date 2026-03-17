"use client"

import React, { useState, useEffect } from "react"
import { Users, Bell, Plus, Trash2, Clock, AlertTriangle, UserMinus, Loader2, Mail, Edit2 } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useOrgStore } from "@/store/org-store"
import { toast } from "sonner"
import { getAlertRules, upsertAlertRule, deleteAlertRule, toggleAlertRule, type AlertRule } from "@/action/alert-rules"
import { getEmailTemplates } from "@/action/email-templates"
import { AlertRuleDialog } from "@/components/settings/members/AlertRuleDialog"

export default function AlertRulesPage() {
    const { organizationId } = useOrgStore()
    const [loading, setLoading] = useState(true)
    const [rules, setRules] = useState<AlertRule[]>([])
    const [templates, setTemplates] = useState<any[]>([])
    const [selectedRule, setSelectedRule] = useState<AlertRule | undefined>(undefined)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

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

    const staticTemplates = [
        { key: "welcome-email", name: "Email Selamat Datang" },
        { key: "daily-report", name: "Laporan Aktivitas Harian" },
        { key: "weekly-summary", name: "Ringkasan Performa Mingguan" },
        { key: "idle-alert", name: "Notifikasi Waktu Idle" },
    ]

    const loadData = async () => {
        if (!organizationId) return
        setLoading(true)
        try {
            const [rulesRes, templatesRes] = await Promise.all([
                getAlertRules(String(organizationId)),
                getEmailTemplates(String(organizationId))
            ])

            if (rulesRes.success) setRules(rulesRes.data)

            // Combine static names with any custom templates found in DB
            const dbTemplates = templatesRes.success ? templatesRes.data : []
            const allTemplates = [...staticTemplates]
            dbTemplates.forEach(dt => {
                if (!allTemplates.find(at => at.key === dt.template_key)) {
                    allTemplates.push({ key: dt.template_key, name: dt.name || dt.template_key })
                } else {
                    // Update static name with db name if custom
                    const existing = allTemplates.find(at => at.key === dt.template_key)
                    if (existing && dt.name) existing.name = dt.name
                }
            })
            setTemplates(allTemplates)

        } catch (err) {
            console.error(err)
            toast.error("Gagal memuat data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [organizationId])

    const handleSave = async (payload: AlertRule) => {
        if (!organizationId) return
        try {
            const res = await upsertAlertRule({
                ...payload,
                organization_id: Number(organizationId)
            })
            if (res.success) {
                toast.success("Aturan berhasil disimpan")
                loadData()
            } else {
                throw new Error(res.message)
            }
        } catch (err) {
            toast.error("Gagal menyimpan aturan")
            throw err
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Hapus aturan ini?")) return
        try {
            const res = await deleteAlertRule(id)
            if (res.success) {
                toast.success("Aturan dihapus")
                setRules(rules.filter(r => r.id !== id))
            } else {
                throw new Error(res.message)
            }
        } catch (err) {
            toast.error("Gagal menghapus aturan")
        }
    }

    const handleToggle = async (id: number, currentStatus: boolean) => {
        try {
            const res = await toggleAlertRule(id, !currentStatus)
            if (res.success) {
                setRules(rules.map(r => r.id === id ? { ...r, is_enabled: !currentStatus } : r))
            } else {
                throw new Error(res.message)
            }
        } catch (err) {
            toast.error("Gagal mengubah status")
        }
    }

    const getTriggerIcon = (type: string) => {
        switch (type) {
            case 'late_arrival': return Clock
            case 'inactivity': return UserMinus
            case 'absent_reminder': return Bell
            default: return AlertTriangle
        }
    }

    const getTriggerLabel = (type: string) => {
        if (type.startsWith("custom:")) {
            return type.replace("custom:", "")
        }
        switch (type) {
            case 'late_arrival': return "Keterlambatan"
            case 'inactivity': return "Tanpa Aktivitas"
            case 'absent_reminder': return "Pengingat Absen"
            default: return "Kustom"
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-white w-full">
            <SettingsHeader
                title="Members"
                Icon={Users}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="alerts"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="alerts">
                <div className="space-y-8 w-full -mr-4 md:-mr-6">
                    <div className="flex justify-between items-end">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <h2 className="text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em]">ALERT RULES</h2>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                                Atur notifikasi otomatis berdasarkan aktivitas tim. Tetap terinformasi mengenai kehadiran, produktivitas, dan kebiasaan kerja.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="border-slate-200 text-slate-600 gap-2 h-10 px-4 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                                onClick={() => window.location.href = '/settings/members/email-notifications/templates'}
                            >
                                <Mail className="h-4 w-4" />
                                <span className="text-sm font-medium">Kelola Template</span>
                            </Button>
                            <Button
                                className="bg-slate-900 hover:bg-slate-800 text-white gap-2 h-10 px-5 rounded-xl shadow-sm transition-all active:scale-95"
                                onClick={() => {
                                    setSelectedRule(undefined)
                                    setIsDialogOpen(true)
                                }}
                            >
                                <Plus className="h-4 w-4" />
                                <span className="text-sm font-medium">Tambah Aturan</span>
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                            <span className="text-xs font-light uppercase tracking-widest text-pretty">Memuat aturan...</span>
                        </div>
                    ) : rules.length === 0 ? (
                        <div className="py-32 border border-dashed border-slate-200 rounded-3xl bg-slate-50/20 flex flex-col items-center justify-center text-center min-h-[400px]">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-6 border border-slate-100 shadow-sm">
                                <Bell className="h-10 w-10 opacity-50" />
                            </div>
                            <h4 className="text-lg font-medium text-slate-900 mb-2">Belum ada aturan aktif</h4>
                            <p className="text-sm text-slate-500 max-w-sm mb-8 leading-relaxed">
                                Buat aturan pemicu pertama Anda untuk mulai mengirim email otomatis berdasarkan aktivitas tim secara real-time.
                            </p>
                            <Button
                                className="bg-slate-900 hover:bg-slate-800 text-white px-8 h-12 rounded-full shadow-lg hover:shadow-xl transition-all gap-2"
                                onClick={() => setIsDialogOpen(true)}
                            >
                                <Plus className="h-5 w-5" />
                                Buat Aturan Sekarang
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rules.map((rule) => {
                                const Icon = getTriggerIcon(rule.trigger_type)
                                const template = templates.find(t => t.key === rule.template_key)
                                return (
                                    <div key={rule.id} className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-lg ${rule.is_enabled ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-slate-900 text-sm">{rule.name}</h3>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                        {getTriggerLabel(rule.trigger_type)} {rule.threshold_minutes ? `> ${rule.threshold_minutes} mnt` : ''}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                        Template: {template?.name || rule.template_key}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-3 pr-6 border-r border-slate-100">
                                                <span className={`text-[11px] font-medium uppercase tracking-wider ${rule.is_enabled ? 'text-slate-900' : 'text-slate-400'}`}>
                                                    {rule.is_enabled ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                                <Switch
                                                    checked={rule.is_enabled}
                                                    onCheckedChange={() => handleToggle(rule.id!, rule.is_enabled)}
                                                />
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-slate-400 hover:text-slate-900 h-9 w-9 p-0"
                                                    onClick={() => {
                                                        setSelectedRule(rule)
                                                        setIsDialogOpen(true)
                                                    }}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-9 w-9 p-0"
                                                    onClick={() => handleDelete(rule.id!)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                </div>
            </SettingsContentLayout>

            <AlertRuleDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSave={handleSave}
                rule={selectedRule}
                templates={templates}
            />
        </div>
    )
}
