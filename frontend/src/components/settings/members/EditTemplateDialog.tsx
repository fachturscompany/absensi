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

interface EditTemplateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    template: any
    onSave: (updatedTemplate: any) => Promise<void>
}

export function EditTemplateDialog({ open, onOpenChange, template, onSave }: EditTemplateDialogProps) {
    const [subject, setSubject] = useState(template?.subject || "")
    const [body, setBody] = useState(template?.body_html || "")
    const [loading, setLoading] = useState(false)

    React.useEffect(() => {
        if (template) {
            setSubject(template.subject || "")
            setBody(template.body_html || "")
        }
    }, [template])

    const handleSave = async () => {
        setLoading(true)
        try {
            await onSave({
                ...template,
                subject,
                body_html: body
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
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Email Template</DialogTitle>
                    <DialogDescription>
                        Modify the subject line and content of the {template?.name || "template"}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="subject">Subject Line</Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Enter email subject"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="body">Email Body (HTML/Text)</Label>
                        <Textarea
                            id="body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Tulis isi email di sini..."
                            className="min-h-[300px] text-sm leading-relaxed"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-slate-900 text-white hover:bg-slate-800">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
