"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface ActionConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (reason: string) => void
    mode: 'approve' | 'reject'
}

export function ActionConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    mode
}: ActionConfirmDialogProps) {
    const [reason, setReason] = useState("")

    useEffect(() => {
        if (open) setReason("")
    }, [open])

    const handleConfirm = () => {
        onConfirm(reason)
        onOpenChange(false)
    }

    const isApprove = mode === 'approve'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isApprove ? "Approve Timesheet" : "Reject Timesheet"}</DialogTitle>
                    <DialogDescription>
                        {isApprove
                            ? "Please provide notes for this approval. This will be visible to the member."
                            : "Please provide a reason for rejecting this timesheet. This will be sent to the member."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="message">{isApprove ? "Notes" : "Reason"}</Label>
                        <Textarea
                            id="message"
                            placeholder={isApprove ? "Add approval notes..." : "Reason for rejection..."}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        variant={isApprove ? "default" : "destructive"}
                        className={isApprove ? "bg-green-600 hover:bg-green-700" : ""}
                        onClick={handleConfirm}
                        disabled={!isApprove && !reason.trim()}
                    >
                        {isApprove ? "Approve" : "Reject"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
