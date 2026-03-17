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
import { Calendar as CalendarIcon, Clock, HelpCircle, Plus, Trash2, Coffee } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TimeEntry, Break } from "@/lib/data/dummy-data"
import type { TimesheetMember, TimesheetProject, TimesheetTask } from "@/action/timesheets"
import { Avatar, AvatarFallback } from "@/components/profile&image/avatar"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"

interface AddTimeEntryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (entry: Partial<TimeEntry>) => void
    isAdmin?: boolean
    members?: TimesheetMember[]
    projects?: TimesheetProject[]
    tasks?: TimesheetTask[]
}

const REASONS = [
    "Forgot to start timer",
    "Technical issue",
    "Meeting offsite",
    "Correction",
    "Other"
]

export function AddTimeEntryDialog({
    open,
    onOpenChange,
    onSave,
    members = [],
    projects = [],
    tasks = [],
}: AddTimeEntryDialogProps) {
    const [formData, setFormData] = useState<Partial<TimeEntry>>({
        memberId: "",
        projectId: "",
        taskId: "",
        date: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "17:00",
        notes: "",
        source: "manual",
        activityPct: 100,
        billable: true,
        reason: "",
        breaks: []
    })

    const [date, setDate] = useState<Date | undefined>(new Date())
    const [touched, setTouched] = useState<Record<string, boolean>>({})
    const [otherReason, setOtherReason] = useState("")
    const [isWorkBreak, setIsWorkBreak] = useState(false)
    const [breaks, setBreaks] = useState<Break[]>([])

    const startTimeRef = useRef<HTMLInputElement>(null)
    const endTimeRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open) {
            const today = new Date()
            setFormData({
                memberId: members[0]?.id || "",
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
            setTouched({})
            setIsWorkBreak(false)
        }
    }, [open])

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
        if (diff < 0) diff = 0

        const hours = Math.floor(diff / 60)
        const minutes = diff % 60
        return `${hours}:${minutes.toString().padStart(2, '0')}:00`
    }

    const isValidTimes = () => {
        if (!formData.startTime || !formData.endTime) return false
        const start = parse(formData.startTime, "HH:mm", new Date())
        const end = parse(formData.endTime, "HH:mm", new Date())
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
            alert(breakError)
            return
        }

        if (formData.reason === "Other" && !otherReason.trim()) {
            setTouched(prev => ({ ...prev, otherReason: true }))
            return
        }

        const project = projects.find(p => p.id === formData.projectId)
        const task = tasks.find(t => t.id === formData.taskId)
        const finalReason = formData.reason === "Other" ? otherReason : formData.reason

        onSave({
            ...formData,
            memberId: formData.memberId || members[0]?.id,
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
                    <div className="flex items-center justify-between">
                        <DialogTitle>Add time</DialogTitle>
                        <HelpCircle className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer mr-6" />
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* User Info & Break Toggle */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                            <div className="text-xs font-semibold text-muted-foreground">MEMBER</div>
                            <Select
                                value={formData.memberId}
                                onValueChange={(v) => setFormData({ ...formData, memberId: v })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {members.map(m => (
                                        <SelectItem key={m.id} value={m.id}>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarFallback className="text-[10px]">{m.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                {m.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2 mt-8">
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
                                {projects.map(p => (
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
                                {tasks.filter(t => !formData.projectId || t.projectId === formData.projectId).map(t => (
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
                            <p className="text-xs text-destructive mt-1">can't be blank</p>
                        )}
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
