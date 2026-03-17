"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon, Clock } from "lucide-react"
import { format, differenceInMinutes, parse, isValid } from "date-fns"
import type { TimeEntry } from "@/lib/data/dummy-data"

interface AddManualTimeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: TimeEntry | null
    onSave: (duration: string, notes: string, startTime: string, endTime: string) => void
}

export function AddManualTimeDialog({
    open,
    onOpenChange,
    initialData,
    onSave,
}: AddManualTimeDialogProps) {
    const [startTime, setStartTime] = useState("00:00")
    const [endTime, setEndTime] = useState("00:00")
    const [notes, setNotes] = useState("")

    const [durationStr, setDurationStr] = useState("00:00:00")

    useEffect(() => {
        if (open) {
            setStartTime("00:00")
            setEndTime("00:00")
            setNotes("")
            setDurationStr("00:00:00")
        }
    }, [open])

    useEffect(() => {
        if (startTime && endTime) {
            const start = parse(startTime, "HH:mm", new Date())
            const end = parse(endTime, "HH:mm", new Date())

            if (isValid(start) && isValid(end)) {
                let diff = differenceInMinutes(end, start)
                if (diff < 0) diff += 24 * 60 // Handle overnight

                const hours = Math.floor(diff / 60)
                const minutes = diff % 60
                setDurationStr(`${hours}:${minutes.toString().padStart(2, '0')}:00`)
            }
        }
    }, [startTime, endTime])

    const handleSave = () => {
        onSave(durationStr, notes, startTime, endTime)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">ADD MANUAL TIME</DialogTitle>
                    <DialogDescription className="sr-only">Add manual time to existing entry</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    {/* Date Picker (Disabled) */}
                    <div>
                        <Button
                            variant={"outline"}
                            className="w-full justify-between text-left font-normal bg-gray-50/50 cursor-not-allowed opacity-80"
                            disabled
                        >
                            {initialData?.date ? format(new Date(initialData.date), "EEE, MMM d, yyyy") : <span>Date</span>}
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </div>

                    {/* Time Inputs (Disabled) */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Input
                                type="time"
                                value={initialData?.startTime || "--:--"}
                                className="pr-8 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden bg-gray-50/50 text-gray-500 cursor-not-allowed"
                                disabled
                            />
                            <Clock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase">TO</span>
                        <div className="relative flex-1">
                            <Input
                                type="time"
                                value={initialData?.endTime || "--:--"}
                                className="pr-8 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden bg-gray-50/50 text-gray-500 cursor-not-allowed"
                                disabled
                            />
                            <Clock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Duration Input */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Manual Duration*</Label>
                        <div className="text-xs text-gray-500 mb-2">Original tracked duration: <span className="font-semibold">{initialData?.duration || "0:00:00"}</span></div>

                        <div className="flex items-center gap-2 mt-1">
                            <div className="relative flex-1">
                                <Input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="pr-8 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
                                />
                                <Clock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase">TO</span>
                            <div className="relative flex-1">
                                <Input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="pr-8 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
                                />
                                <Clock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2 text-right">
                            Calculated manual duration: <span className="font-semibold text-gray-900">{durationStr}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Reason / Notes</Label>
                        <Textarea
                            placeholder="Why are you adding manual time?"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Add Time</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
