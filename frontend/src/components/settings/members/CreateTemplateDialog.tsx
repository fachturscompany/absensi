"use client"

import React, { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

interface CreateTemplateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (newTemplate: any) => Promise<void>
}

export function CreateTemplateDialog({ open, onOpenChange, onSave }: CreateTemplateDialogProps) {
    const [name, setName] = useState("")
    const [subject, setSubject] = useState("")
    const [body, setBody] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        if (!name || !subject || !body) return

        setLoading(true)
        try {
            await onSave({
                name,
                subject,
                body_html: body,
                key: `custom-${Date.now()}`
            })
            onOpenChange(false)
            // Reset form
            setName("")
            setSubject("")
            setBody("")
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Buat Template Baru</DialogTitle>
                    <DialogDescription>
                        Tambahkan template email kustom untuk organisasi Anda.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama Template</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: Pengingat Absensi"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="subject">Subjek Email</Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Masukkan subjek email"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="body">Isi Email</Label>
                        <Textarea
                            id="body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Tulis pesan Anda di sini. Gunakan (nama) untuk memanggil nama anggota."
                            className="min-h-[250px] text-sm leading-relaxed"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Batal
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading || !name || !subject || !body}
                        className="bg-slate-900 text-white hover:bg-slate-800"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Buat Template
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
