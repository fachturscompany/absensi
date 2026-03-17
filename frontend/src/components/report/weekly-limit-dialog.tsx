
"use client"

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
import { useState, useEffect } from "react"
import { WeeklyLimitEntry } from "@/lib/data/dummy-data"
import { toast } from "sonner"

interface WeeklyLimitDialogProps {
    member: WeeklyLimitEntry | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave?: (newLimit: number) => void
}

export function WeeklyLimitDialog({ member, open, onOpenChange, onSave }: WeeklyLimitDialogProps) {
    const [limit, setLimit] = useState<number>(40)

    useEffect(() => {
        if (member) {
            setLimit(member.weeklyLimit)
        }
    }, [member])

    const handleSave = () => {
        if (!limit || limit < 0) return

        // In a real app, we would call an API here
        toast.success("Weekly limit updated", {
            description: `Limit for ${member?.memberName} set to ${limit} hours.`
        })

        if (onSave) onSave(limit)
        onOpenChange(false)
    }

    if (!member) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Weekly Limit</DialogTitle>
                    <DialogDescription>
                        Set the maximum number of hours {member.memberName} can track this week.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="limit" className="text-right">
                            Hours
                        </Label>
                        <Input
                            id="limit"
                            type="number"
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                            className="col-span-3"
                            min={0}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
