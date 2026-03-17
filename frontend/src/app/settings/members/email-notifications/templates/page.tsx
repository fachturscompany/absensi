"use client"

import React, { useState, useEffect } from "react"
import { Users, Mail, Edit2, Eye, Loader2, Clock } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useOrgStore } from "@/store/org-store"
import { toast } from "sonner"
import { getEmailTemplates, upsertEmailTemplate, type EmailTemplate } from "@/action/email-templates"
import { EditTemplateDialog } from "@/components/settings/members/EditTemplateDialog"
import { CreateTemplateDialog } from "@/components/settings/members/CreateTemplateDialog"

export default function EmailTemplatesPage() {
    const { organizationId } = useOrgStore()
    const [loading, setLoading] = useState(true)
    const [dbTemplates, setDbTemplates] = useState<EmailTemplate[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

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
        {
            key: "welcome-email",
            name: "Email Selamat Datang",
            description: "Dikirim ke anggota tim baru saat mereka diundang ke organisasi.",
            defaultSubject: "Selamat bergabung di tim!",
            defaultBody: "Halo (nama), selamat bergabung di organisasi kami! Kami senang Anda ada di sini."
        },
        {
            key: "daily-report",
            name: "Laporan Aktivitas Harian",
            description: "Ringkasan jam kerja dan metrik produktivitas hari sebelumnya.",
            defaultSubject: "Laporan Aktivitas Harian Anda",
            defaultBody: "Berikut adalah ringkasan aktivitas Anda untuk tanggal (tanggal)..."
        },
        {
            key: "weekly-summary",
            name: "Ringkasan Performa Mingguan",
            description: "Rincian mingguan yang komprehensif tentang pencapaian tim.",
            defaultSubject: "Ringkasan Performa Mingguan",
            defaultBody: "Kerja bagus minggu ini! Berikut adalah statistik performa Anda..."
        },
        {
            key: "idle-alert",
            name: "Notifikasi Waktu Idle",
            description: "Peringatan dikirim ke anggota saat terdeteksi tidak ada aktivitas dalam waktu lama.",
            defaultSubject: "Apakah Anda masih di sana?",
            defaultBody: "Kami melihat Anda sudah tidak aktif selama beberapa waktu..."
        }
    ]

    useEffect(() => {
        async function loadTemplates() {
            if (!organizationId) {
                setLoading(false)
                return
            }
            setLoading(true)
            try {
                const res = await getEmailTemplates(String(organizationId))
                if (res.success) {
                    setDbTemplates(res.data)
                }
            } catch (err) {
                console.error("Failed to load templates", err)
            } finally {
                setLoading(false)
            }
        }
        loadTemplates()
    }, [organizationId])

    const handleSaveTemplate = async (updatedData: any) => {
        if (!organizationId) return

        try {
            const payload: EmailTemplate = {
                organization_id: Number(organizationId),
                template_key: updatedData.key,
                name: updatedData.name,
                subject: updatedData.subject,
                body_html: updatedData.body_html,
                is_enabled: true
            }

            const res = await upsertEmailTemplate(payload)
            if (res.success) {
                toast.success("Template berhasil disimpan")
                // Refresh local state
                const resTemplates = await getEmailTemplates(String(organizationId))
                if (resTemplates.success) setDbTemplates(resTemplates.data)
            } else {
                throw new Error(res.message)
            }
        } catch (err) {
            toast.error("Gagal menyimpan template")
            throw err
        }
    }

    // Merge static and custom db templates
    const staticKeys = staticTemplates.map(s => s.key)
    const customDbTemplates = dbTemplates.filter(t => !staticKeys.includes(t.template_key))

    const mappedStatic = staticTemplates.map(st => {
        const dbT = dbTemplates.find(t => t.template_key === st.key)
        return {
            ...st,
            id: dbT?.id || st.key,
            subject: dbT?.subject || st.defaultSubject,
            body_html: dbT?.body_html || st.defaultBody,
            status: dbT ? (dbT.is_enabled ? "Aktif" : "Nonaktif") : "Default",
            lastUpdated: dbT?.updated_at ? new Date(dbT.updated_at).toLocaleDateString() : "Belum pernah"
        }
    })

    const mappedCustom = customDbTemplates.map(ct => ({
        key: ct.template_key,
        name: ct.name || "Template Tanpa Nama",
        description: "Template kustom buatan Anda.",
        subject: ct.subject,
        body_html: ct.body_html,
        status: ct.is_enabled ? "Aktif" : "Nonaktif",
        lastUpdated: new Date(ct.updated_at!).toLocaleDateString()
    }))

    const templatesToShow = [...mappedStatic, ...mappedCustom]

    return (
        <div className="flex flex-col min-h-screen bg-white w-full">
            <SettingsHeader
                title="Members"
                Icon={Users}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="templates"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="templates">
                <div className="space-y-8 max-w-5xl">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <h2 className="text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em]">EMAIL TEMPLATES</h2>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Sesuaikan konten dan desain email otomatis yang dikirim ke tim Anda. Pastikan komunikasi Anda sesuai dengan gaya organisasi.
                        </p>
                    </div>

                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                            <span className="text-xs font-light uppercase tracking-widest">Memuat template...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templatesToShow.map((template) => (
                                <div key={template.key} className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <Badge variant={template.status === "Aktif" ? "default" : "secondary"} className={template.status === "Aktif" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-100"}>
                                            {template.status}
                                        </Badge>
                                    </div>
                                    <h3 className="font-medium text-slate-900 mb-1">{template.name}</h3>
                                    <p className="text-sm text-slate-500 mb-6 line-clamp-2">{template.description}</p>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                            <Clock className="h-3 w-3" />
                                            Update {template.lastUpdated}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2 text-slate-400 hover:text-slate-900"
                                                onClick={() => {
                                                    alert(`Preview Subjek: ${template.subject}\n\nIsi: ${template.body_html}`)
                                                }}
                                            >
                                                <Eye className="h-4 w-4 mr-1.5" />
                                                Pratinjau
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                                onClick={() => {
                                                    setSelectedTemplate(template)
                                                    setIsEditDialogOpen(true)
                                                }}
                                            >
                                                <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                                                Edit
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
                        <div className="relative z-10 max-w-md">
                            <h3 className="text-lg font-semibold mb-2">Butuh template kustom?</h3>
                            <p className="text-slate-400 text-sm mb-6">
                                Buat template email unik dari awal untuk kebutuhan khusus organisasi Anda.
                            </p>
                            <Button className="bg-white text-slate-900 hover:bg-slate-100" onClick={() => setIsCreateDialogOpen(true)}>
                                Buat Template Baru
                            </Button>
                        </div>
                        <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
                        <Mail className="absolute -bottom-10 -right-10 h-64 w-64 text-white/5 rotate-12 pointer-events-none" />
                    </div>
                </div>

                <EditTemplateDialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    template={selectedTemplate}
                    onSave={handleSaveTemplate}
                />

                <CreateTemplateDialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                    onSave={handleSaveTemplate}
                />
            </SettingsContentLayout>
        </div>
    )
}
