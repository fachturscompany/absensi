"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, differenceInMinutes, parse, isValid } from "date-fns"
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TimeEntry } from "@/lib/data/dummy-data"
import { Checkbox } from "@/components/ui/checkbox"

// Helper for calendar generation
const generateCalendarDays = (month: Date) => {
    const year = month.getFullYear()
    const monthIndex = month.getMonth()
    const firstDay = new Date(year, monthIndex, 1)
    const lastDay = new Date(year, monthIndex + 1, 0)
    let startDay = firstDay.getDay() - 1 // Mon start
    if (startDay < 0) startDay = 6
    const days: { day: number; isCurrentMonth: boolean; date: Date }[] = []
    const prevMonthLastDay = new Date(year, monthIndex, 0).getDate()

    // Previous month days
    for (let i = startDay - 1; i >= 0; i--) {
        const d = new Date(year, monthIndex - 1, prevMonthLastDay - i)
        days.push({ day: prevMonthLastDay - i, isCurrentMonth: false, date: d })
    }
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const d = new Date(year, monthIndex, i)
        days.push({ day: i, isCurrentMonth: true, date: d })
    }
    // Next month days to fill 42 (6 rows)
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, monthIndex + 1, i)
        days.push({ day: i, isCurrentMonth: false, date: d })
    }
    return days
}

interface QuickEditTimeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: TimeEntry | null
    onSave: (entry: Partial<TimeEntry>) => void
}

export function QuickEditTimeDialog({
    open,
    onOpenChange,
    initialData,
    onSave,
}: QuickEditTimeDialogProps) {
    const [formData, setFormData] = useState({
        date: new Date(),
        startTime: "",
        endTime: "",
        duration: "",
        billable: false,
        reason: ""
    })
    const [touched, setTouched] = useState(false)
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

    const startTimeRef = useRef<HTMLInputElement>(null)
    const endTimeRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (initialData) {
            const d = new Date(initialData.date)
            setFormData({
                date: d,
                startTime: initialData.startTime.slice(0, 5), // HH:mm
                endTime: initialData.endTime.slice(0, 5), // HH:mm
                duration: initialData.duration,
                billable: initialData.billable ?? false,
                reason: "" // Reset reason, must be provided for edit
            })
            setTouched(false)
            setCurrentMonth(d)
        } else {
            setCurrentMonth(new Date())
        }
    }, [initialData, open])

    // Calculate duration when start/end change
    useEffect(() => {
        if (formData.startTime && formData.endTime) {
            const start = parse(formData.startTime, "HH:mm", new Date())
            const end = parse(formData.endTime, "HH:mm", new Date())

            if (isValid(start) && isValid(end)) {
                let diff = differenceInMinutes(end, start)
                if (diff < 0) diff += 24 * 60 // Handle overnight? Assume same day for now or wrap

                const hours = Math.floor(diff / 60)
                const minutes = diff % 60
                const durationStr = `${hours}:${minutes.toString().padStart(2, '0')}:00`

                // Only update if different to avoid loop if we were doing bidirectional
                // For now just one-way: time -> duration
                setFormData(prev => ({ ...prev, duration: durationStr }))
            }
        }
    }, [formData.startTime, formData.endTime])

    const handleSave = () => {
        setTouched(true)
        if (!formData.reason.trim()) return

        onSave({
            ...initialData,
            date: format(formData.date, "yyyy-MM-dd"),
            startTime: formData.startTime,
            endTime: formData.endTime,
            duration: formData.duration,
            billable: formData.billable,
            // reason: formData.reason // In a real app we might store the edit reason in a history table
        })
        onOpenChange(false)
    }

    // Handlers for month navigation
    const prevMonth = (e: React.MouseEvent) => {
        e.stopPropagation()
        const newDate = new Date(currentMonth)
        newDate.setMonth(newDate.getMonth() - 1)
        setCurrentMonth(newDate)
    }
    const nextMonth = (e: React.MouseEvent) => {
        e.stopPropagation()
        const newDate = new Date(currentMonth)
        newDate.setMonth(newDate.getMonth() + 1)
        setCurrentMonth(newDate)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">TIME SPAN (+07)*</DialogTitle>
                    <DialogDescription className="sr-only">Quick edit time entry</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Date Picker */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-between text-left font-normal",
                                    !formData.date && "text-muted-foreground"
                                )}
                            >
                                {formData.date ? format(formData.date, "EEE, MMM d, yyyy") : <span>Pick a date</span>}
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-4" align="start">
                            {/* Custom Calendar Header */}
                            <div className="flex items-center justify-between mb-4">
                                <button className="p-1 hover:bg-gray-100 rounded" onClick={prevMonth}>
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="font-semibold text-sm">
                                    {format(currentMonth, "MMMM yyyy")}
                                </span>
                                <button className="p-1 hover:bg-gray-100 rounded" onClick={nextMonth}>
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Days Header */}
                            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                                    <div key={day} className="font-semibold text-gray-500 w-8">{day}</div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1 text-center text-sm">
                                {generateCalendarDays(currentMonth).map((d, i) => {
                                    const isSelected = formData.date &&
                                        d.date.getDate() === formData.date.getDate() &&
                                        d.date.getMonth() === formData.date.getMonth() &&
                                        d.date.getFullYear() === formData.date.getFullYear()

                                    const isToday = new Date().toDateString() === d.date.toDateString()

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setFormData({ ...formData, date: d.date })
                                            }}
                                            className={cn(
                                                "h-8 w-8 rounded flex items-center justify-center text-sm transition-colors",
                                                !d.isCurrentMonth && "text-gray-300",
                                                d.isCurrentMonth && !isSelected && "text-gray-700 hover:bg-gray-100",
                                                isSelected && "bg-black text-white hover:bg-gray-800",
                                                !isSelected && isToday && "text-gray-900 font-bold"
                                            )}
                                        >
                                            {d.day}
                                        </button>
                                    )
                                })}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Time Inputs */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Input
                                ref={startTimeRef}
                                type="time"
                                value={formData.startTime}
                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                className="pr-8 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
                                onClick={() => startTimeRef.current?.showPicker()}
                            />
                            <Clock
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => startTimeRef.current?.showPicker()}
                            />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase">TO</span>
                        <div className="relative flex-1">
                            <Input
                                ref={endTimeRef}
                                type="time"
                                value={formData.endTime}
                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                className="pr-8 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
                                onClick={() => endTimeRef.current?.showPicker()}
                            />
                            <Clock
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => endTimeRef.current?.showPicker()}
                            />
                        </div>
                    </div>

                    {/* Duration & Billable */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase">DURATION*</Label>
                            <Input
                                value={formData.duration}
                                onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                placeholder="0:00:00"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-5">
                            <Checkbox
                                id="quick-billable"
                                checked={formData.billable}
                                onCheckedChange={(c) => setFormData({ ...formData, billable: c === true })}
                            />
                            <Label htmlFor="quick-billable" className="cursor-pointer">Billable</Label>
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">REASON*</Label>
                        <Textarea
                            placeholder="Why are you editing this time entry? (ex: Forgot to start timer)"
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className={cn("resize-none min-h-[80px]", touched && !formData.reason.trim() && "border-red-500 focus-visible:ring-red-500")}
                        />
                        {touched && !formData.reason.trim() && (
                            <p className="text-xs text-red-500">Reason is required.</p>
                        )}
                    </div>
                </div>

                <DialogFooter className="sm:justify-between gap-2">
                    <span className="flex-1"></span>
                    <Button onClick={handleSave} className="bg-gray-900 hover:cursor-pointer text-white w-full">Apply</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
