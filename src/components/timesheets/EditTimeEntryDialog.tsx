"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogHeader } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, differenceInMinutes, parse, isValid, isAfter, isBefore } from "date-fns"
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Coffee } from "lucide-react"
import { cn } from "@/lib/utils"
import { DUMMY_PROJECTS, DUMMY_MEMBERS, DUMMY_TASKS } from "@/lib/data/dummy-data"
import type { TimeEntry, Break } from "@/lib/data/dummy-data"
import { Avatar, AvatarFallback } from "@/components/profile&image/avatar"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { SplitTimeEntryDialog } from "./SplitTimeEntryDialog"

interface EditTimeEntryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: TimeEntry | null
    onSave: (entry: Partial<TimeEntry>) => void
    isAdmin?: boolean
}

const REASONS = [
    "Forgot to start timer",
    "Technical issue",
    "Meeting offsite",
    "Correction",
    "Other"
]

export function EditTimeEntryDialog({
    open,
    onOpenChange,
    initialData,
    onSave,
}: EditTimeEntryDialogProps) {
    const [formData, setFormData] = useState<Partial<TimeEntry>>({
        memberId: "",
        projectId: "",
        taskId: "",
        date: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "17:00",
        notes: "",
        source: "manual",
        activityPct: 0,
        billable: true,
        reason: "",
        breaks: []
    })

    const [date, setDate] = useState<Date | undefined>(new Date())
    const [touched, setTouched] = useState<Record<string, boolean>>({})
    const [otherReason, setOtherReason] = useState("")
    const [isWorkBreak, setIsWorkBreak] = useState(false)
    const [breaks, setBreaks] = useState<Break[]>([])
    const [isSplitOpen, setIsSplitOpen] = useState(false)

    const startTimeRef = useRef<HTMLInputElement>(null)
    const endTimeRef = useRef<HTMLInputElement>(null)

    // Derived member state
    const member = DUMMY_MEMBERS.find(m => m.id === formData.memberId)

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                startTime: initialData.startTime.slice(0, 5),
                endTime: initialData.endTime.slice(0, 5),
                taskId: initialData.taskId || "",
                billable: initialData.billable ?? true,
                reason: initialData.reason || ""
            })
            setDate(new Date(initialData.date))
            setBreaks(initialData.breaks || [])

            if (initialData.reason && !REASONS.includes(initialData.reason) && initialData.reason !== "") {
                setFormData(prev => ({ ...prev, reason: "Other" }))
                setOtherReason(initialData.reason)
            } else {
                setOtherReason("")
            }

        } else {
            const today = new Date()
            setFormData({
                memberId: DUMMY_MEMBERS[0]?.id || "",
                projectId: "",
                taskId: "",
                date: today.toISOString().split('T')[0],
                startTime: "09:00",
                endTime: "17:00",
                notes: "",
                source: "manual",
                activityPct: 0,
                billable: true,
                reason: "",
                breaks: []
            })
            setDate(today)
            setBreaks([])
            setOtherReason("")
        }
        setTouched({})
        setIsWorkBreak(false)
    }, [initialData, open])

    useEffect(() => {
        if (date) {
            setFormData(prev => ({ ...prev, date: format(date, "yyyy-MM-dd") }))
        }
    }, [date])

    const calculateDuration = () => {
        if (!formData.startTime || !formData.endTime) return "0:00:00"

        const start = parse(formData.startTime, "HH:mm", new Date())
        const end = parse(formData.endTime, "HH:mm", new Date())

        if (!isValid(start) || !isValid(end)) return "Invalid"

        let diff = differenceInMinutes(end, start)
        if (diff < 0) diff += 24 * 60

        // Subtract breaks
        let breakMinutes = 0
        breaks.forEach(b => {
            const bStart = parse(b.startTime, "HH:mm", new Date())
            const bEnd = parse(b.endTime, "HH:mm", new Date())
            if (isValid(bStart) && isValid(bEnd)) {
                const bDiff = differenceInMinutes(bEnd, bStart)
                if (bDiff > 0) breakMinutes += bDiff
            }
        })

        diff -= breakMinutes
        if (diff < 0) diff = 0 // Should enforce validation instead, but clamp for display

        const hours = Math.floor(diff / 60)
        const minutes = diff % 60
        return `${hours}:${minutes.toString().padStart(2, '0')}:00`
    }

    const isValidTimes = () => {
        if (!formData.startTime || !formData.endTime) return false
        const start = parse(formData.startTime, "HH:mm", new Date())
        const end = parse(formData.endTime, "HH:mm", new Date())
        // Basic check
        if (!isValid(start) || !isValid(end) || start >= end) return false
        return true
    }

    const validateBreaks = () => {
        const start = parse(formData.startTime!, "HH:mm", new Date())
        const end = parse(formData.endTime!, "HH:mm", new Date())

        for (const b of breaks) {
            const bStart = parse(b.startTime, "HH:mm", new Date())
            const bEnd = parse(b.endTime, "HH:mm", new Date())

            if (!isValid(bStart) || !isValid(bEnd) || bStart >= bEnd) return "Invalid break times"
            if (isBefore(bStart, start) || isAfter(bEnd, end)) return "Break must be within work hours"
        }
        return null
    }

    const handleAddBreak = () => {
        setBreaks([...breaks, {
            id: Math.random().toString(),
            startTime: "12:00",
            endTime: "12:30",
            notes: ""
        }])
    }

    const handleRemoveBreak = (id: string) => {
        setBreaks(breaks.filter(b => b.id !== id))
    }

    const handleUpdateBreak = (id: string, field: keyof Break, value: string) => {
        setBreaks(breaks.map(b => b.id === id ? { ...b, [field]: value } : b))
    }

    const handleSave = () => {
        if (!formData.projectId) {
            setTouched(prev => ({ ...prev, projectId: true }))
            return
        }
        if (!isValidTimes()) {
            setTouched(prev => ({ ...prev, time: true }))
            return
        }
        const breakError = validateBreaks()
        if (breakError) {
            // Could show toast or error state
            alert(breakError)
            return
        }

        if (formData.reason === "Other" && !otherReason.trim()) {
            setTouched(prev => ({ ...prev, otherReason: true }))
            return
        }

        const project = DUMMY_PROJECTS.find(p => p.id === formData.projectId)
        const task = DUMMY_TASKS.find(t => t.id === formData.taskId)
        const finalReason = formData.reason === "Other" ? otherReason : formData.reason

        onSave({
            ...formData,
            projectName: project?.name,
            taskId: formData.taskId || undefined,
            taskName: task?.title,
            reason: finalReason,
            duration: calculateDuration(),
            breaks: breaks
        })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit time</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* User Info & Break Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gray-100 text-gray-500 text-xs font-bold">
                                    {member?.name?.match(/\b(\w)/g)?.join('')?.substring(0, 2) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{member?.name || "User"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={isWorkBreak}
                                onCheckedChange={setIsWorkBreak}
                                id="work-break"
                            />
                            <Label htmlFor="work-break" className="text-sm font-normal text-muted-foreground">Work break</Label>
                        </div>
                    </div>

                    {/* Project */}
                    <div className="space-y-2">
                        <div className="text-xs font-semibold text-muted-foreground">PROJECT*</div>
                        <Select
                            value={formData.projectId}
                            onValueChange={(v) => {
                                setFormData({ ...formData, projectId: v })
                                setTouched(prev => ({ ...prev, projectId: false }))
                            }}
                        >
                            <SelectTrigger className={cn("w-full", touched.projectId && !formData.projectId && "border-destructive")}>
                                <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent>
                                {DUMMY_PROJECTS.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {touched.projectId && !formData.projectId && (
                            <p className="text-xs text-destructive">Project is required.</p>
                        )}
                    </div>

                    {/* Task */}
                    <div className="space-y-2">
                        <div className="text-xs font-semibold text-muted-foreground">TASKS</div>
                        <Select
                            value={formData.taskId || "none"}
                            onValueChange={(v) => setFormData({ ...formData, taskId: v === "none" ? "" : v })}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="-- No Task --" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">-- No Task --</SelectItem>
                                {DUMMY_TASKS.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Time Span */}
                    <div className="space-y-2">
                        <div className="text-xs font-semibold text-muted-foreground">TIME SPAN (+07)*</div>

                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-between text-left font-normal",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            {date ? format(date, "EEE, MMM d, yyyy") : <span>Pick a date</span>}
                                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">FROM</span>
                                <div className="relative w-32">
                                    <Input
                                        ref={startTimeRef}
                                        type="time"
                                        step="1"
                                        value={formData.startTime}
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                        className="pr-8 [&::-webkit-calendar-picker-indicator]:hidden"
                                    />
                                    <Clock
                                        onClick={() => startTimeRef.current?.showPicker()}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary cursor-pointer hover:text-primary/80"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">TO</span>
                                <div className="relative w-32">
                                    <Input
                                        ref={endTimeRef}
                                        type="time"
                                        step="1"
                                        value={formData.endTime}
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                        className="pr-8 [&::-webkit-calendar-picker-indicator]:hidden"
                                    />
                                    <Clock
                                        onClick={() => endTimeRef.current?.showPicker()}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary cursor-pointer hover:text-primary/80"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Work Breaks Section */}
                    {isWorkBreak && (
                        <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                            <div className="flex justify-between items-center">
                                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                                    <Coffee className="h-4 w-4" /> BREAKS
                                </div>
                                <Button variant="ghost" size="sm" onClick={handleAddBreak} className="h-8 text-xs text-primary gap-1 hover:text-primary/80">
                                    <Plus className="h-3 w-3" /> Add Break
                                </Button>
                            </div>

                            {breaks.length === 0 && (
                                <p className="text-xs text-muted-foreground italic">No breaks added.</p>
                            )}

                            <div className="space-y-3">
                                {breaks.map((b) => (
                                    <div key={b.id} className="flex gap-2 items-center">
                                        <Input
                                            type="time"
                                            className="h-9 w-28 bg-background"
                                            value={b.startTime}
                                            onChange={(e) => handleUpdateBreak(b.id, 'startTime', e.target.value)}
                                        />
                                        <span className="text-muted-foreground">-</span>
                                        <Input
                                            type="time"
                                            className="h-9 w-28 bg-background"
                                            value={b.endTime}
                                            onChange={(e) => handleUpdateBreak(b.id, 'endTime', e.target.value)}
                                        />
                                        <Input
                                            placeholder="Notes"
                                            className="h-9 flex-1 bg-background"
                                            value={b.notes || ""}
                                            onChange={(e) => handleUpdateBreak(b.id, 'notes', e.target.value)}
                                        />
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveBreak(b.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Billable */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="billable"
                                checked={formData.billable}
                                onCheckedChange={(c) => setFormData({ ...formData, billable: c === true })}
                            />
                            <Label htmlFor="billable" className="font-normal text-sm">Billable</Label>
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <div className={cn("text-xs font-semibold uppercase", (formData.reason === "Other" && !otherReason) || !formData.reason ? "text-red-500" : "text-muted-foreground")}>
                            REASON*
                        </div>
                        <Select
                            value={formData.reason || ""}
                            onValueChange={(v) => {
                                setFormData({ ...formData, reason: v === "none" ? "" : v })
                                if (v !== "Other") setOtherReason("")
                            }}
                        >
                            <SelectTrigger className={cn("w-full", ((formData.reason === "Other" && !otherReason) || (touched.otherReason && !formData.reason)) && "border-destructive")}>
                                <SelectValue placeholder="Why are you editing this time entry?" />
                            </SelectTrigger>
                            <SelectContent>
                                {REASONS.map(r => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {formData.reason === "Other" && (
                            <Textarea
                                placeholder="Please specify..."
                                value={otherReason}
                                onChange={(e) => {
                                    setOtherReason(e.target.value)
                                    setTouched(prev => ({ ...prev, otherReason: false }))
                                }}
                                className="mt-2"
                                rows={2}
                            />
                        )}

                        {((formData.reason === "Other" && !otherReason && touched.otherReason) || (!formData.reason && touched.otherReason)) && (
                            <p className="text-xs text-destructive mt-1">can&apos;t be blank</p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>

            <SplitTimeEntryDialog
                open={isSplitOpen}
                onOpenChange={setIsSplitOpen}
                initialData={initialData as any}
                projects={DUMMY_PROJECTS}
                tasks={DUMMY_TASKS}
                onSave={(originalId, entry1, entry2) => {
                    console.log("Split Saved:", originalId, entry1, entry2)
                    // In a real app, this would call an API to split the entry
                    onOpenChange(false)
                }}
            />
        </Dialog>
    )
}
