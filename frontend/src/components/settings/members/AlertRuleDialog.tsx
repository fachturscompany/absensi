"use client"

import React, { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"

interface AlertRuleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (rule: any) => Promise<void>
    rule?: any
    templates: any[]
}

export function AlertRuleDialog({ open, onOpenChange, onSave, rule, templates }: AlertRuleDialogProps) {
    const [name, setName] = useState("")
    const [triggerType, setTriggerType] = useState("late_arrival")
    const [threshold, setThreshold] = useState("15")
    const [templateKey, setTemplateKey] = useState("")
    const [notifyAdmin, setNotifyAdmin] = useState(false)
    const [notifyMember, setNotifyMember] = useState(true)
    const [customTrigger, setCustomTrigger] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (rule) {
            setName(rule.name || "")
            setTriggerType(rule.trigger_type || "late_arrival")
            setThreshold(String(rule.threshold_minutes || "15"))
            setTemplateKey(rule.template_key || "")
            setNotifyAdmin(rule.notify_admin || false)
            setNotifyMember(rule.notify_member ?? true)

            if (rule.trigger_type && rule.trigger_type.startsWith("custom:")) {
                setTriggerType("custom")
                setCustomTrigger(rule.trigger_type.replace("custom:", ""))
            } else {
                setTriggerType(rule.trigger_type || "late_arrival")
                setCustomTrigger("")
            }
        } else {
            setName("")
            setTriggerType("late_arrival")
            setThreshold("15")
            setTemplateKey("")
            setNotifyAdmin(false)
            setNotifyMember(true)
            setCustomTrigger("")
        }
    }, [rule, open])

    const handleSave = async () => {
        if (!name || !templateKey) return

        setLoading(true)
        try {
            await onSave({
                id: rule?.id,
                name,
                trigger_type: triggerType === "custom" ? `custom:${customTrigger}` : triggerType,
                threshold_minutes: parseInt(threshold),
                template_key: templateKey,
                notify_admin: notifyAdmin,
                notify_member: notifyMember,
                is_enabled: rule ? rule.is_enabled : true
            })
            onOpenChange(false)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{rule ? "Edit Aturan" : "Tambah Aturan Baru"}</DialogTitle>
                    <DialogDescription>
                        Atur pemicu otomatis untuk mengirim email berdasarkan aktivitas tim.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama Aturan</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: Pengingat Terlambat"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Tipe Pemicu</Label>
                            <Select value={triggerType} onValueChange={setTriggerType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="late_arrival">Keterlambatan</SelectItem>
                                    <SelectItem value="inactivity">Tanpa Aktivitas</SelectItem>
                                    <SelectItem value="absent_reminder">Pengingat Absen</SelectItem>
                                    <SelectItem value="custom">Kustom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Ambang Batas (Menit)</Label>
                            <Input
                                type="number"
                                value={threshold}
                                onChange={(e) => setThreshold(e.target.value)}
                            />
                        </div>
                    </div>

                    {triggerType === "custom" && (
                        <div className="grid gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <Label htmlFor="customTrigger">Nama Pemicu Kustom</Label>
                            <Input
                                id="customTrigger"
                                value={customTrigger}
                                onChange={(e) => setCustomTrigger(e.target.value)}
                                placeholder="Misal: Selesai Rapat Mingguan"
                            />
                            <p className="text-[10px] text-slate-400 italic">*Pemicu ini akan muncul sebagai label di daftar aturan.</p>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label>Gunakan Template</Label>
                        <Select value={templateKey} onValueChange={setTemplateKey}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih template email" />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map((t) => (
                                    <SelectItem key={t.key} value={t.key}>
                                        {t.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Beritahu Admin</Label>
                                <p className="text-[11px] text-slate-500 text-pretty">Kirim email notifikasi ke administrator.</p>
                            </div>
                            <Switch checked={notifyAdmin} onCheckedChange={setNotifyAdmin} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Beritahu Anggota</Label>
                                <p className="text-[11px] text-slate-500 text-pretty">Kirim email ke anggota yang memicu aturan.</p>
                            </div>
                            <Switch checked={notifyMember} onCheckedChange={setNotifyMember} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Batal
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading || !name || !templateKey}
                        className="bg-slate-900 text-white"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan Aturan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
