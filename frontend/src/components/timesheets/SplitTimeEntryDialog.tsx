"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { TimeEntry } from "@/lib/data/dummy-data"

interface Project {
    id: string
    name: string
    clientId: string | null
}

interface Task {
    id: string
    title: string
}

interface SplitTimeEntryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData: TimeEntry | null
    projects: Project[]
    onSave: (originalId: string, entry1: Partial<TimeEntry>, entry2: Partial<TimeEntry>) => void
    tasks?: Task[]
}

export function SplitTimeEntryDialog({
    open,
    onOpenChange,
    initialData,
    projects,
    tasks = [],
    onSave
}: SplitTimeEntryDialogProps) {
    const [splitTime, setSplitTime] = useState("")

    // Entry 1 State
    const [projectId1, setProjectId1] = useState("")
    const [taskId1, setTaskId1] = useState("")
    const [notes1, setNotes1] = useState("")
    const [date1, setDate1] = useState<Date | undefined>(new Date())

    // Entry 2 State
    const [projectId2, setProjectId2] = useState("")
    const [taskId2, setTaskId2] = useState("")
    const [notes2, setNotes2] = useState("")
    const [date2, setDate2] = useState<Date | undefined>(new Date())

    useEffect(() => {
        if (initialData) {
            setProjectId1(initialData.projectId)
            setTaskId1(initialData.taskId || "")
            setNotes1(initialData.notes || "")
            setDate1(new Date(initialData.date))

            // Default Entry 2 to same project/task for convenience
            setProjectId2(initialData.projectId)
            setTaskId2(initialData.taskId || "")
            setNotes2(initialData.notes || "")
            setDate2(new Date(initialData.date))

            setSplitTime("")
        }
    }, [initialData, open])

    const handleSave = () => {
        if (!initialData || !splitTime) return

        // Validation: splitTime must be between startTime and endTime
        if (splitTime <= initialData.startTime || splitTime >= initialData.endTime) {
            alert("Split time must be between start and end time")
            return
        }

        const entry1: Partial<TimeEntry> = {
            startTime: initialData.startTime,
            endTime: splitTime,
            projectId: projectId1,
            taskId: taskId1 === "none" ? undefined : taskId1,
            notes: notes1,
            projectName: projects.find(p => p.id === projectId1)?.name || 'Unknown',
            taskName: tasks.find(t => t.id === taskId1)?.title,
            date: date1 ? format(date1, "yyyy-MM-dd") : initialData.date,
        }

        const entry2: Partial<TimeEntry> = {
            startTime: splitTime,
            endTime: initialData.endTime,
            projectId: projectId2,
            taskId: taskId2 === "none" ? undefined : taskId2,
            notes: notes2,
            projectName: projects.find(p => p.id === projectId2)?.name || 'Unknown',
            taskName: tasks.find(t => t.id === taskId2)?.title,
            date: date2 ? format(date2, "yyyy-MM-dd") : initialData.date,
        }

        onSave(initialData.id, entry1, entry2)
        onOpenChange(false)
    }

    if (!initialData) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Split Time Entry</DialogTitle>
                    <DialogDescription>
                        Split the entry from {initialData.startTime} - {initialData.endTime} into two.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="splitTime">Split At (Time) *</Label>
                        <Input
                            id="splitTime"
                            type="time"
                            step="1"
                            value={splitTime}
                            onChange={(e) => setSplitTime(e.target.value)}
                            className="w-full"
                        />
                        <p className="text-xs text-gray-500">Pick a time between {initialData.startTime} and {initialData.endTime}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Entry 1 */}
                        <div className="space-y-4 border rounded-md p-4 bg-gray-50/50">
                            <h3 className="font-semibold text-sm">First Entry ({initialData.startTime} - {splitTime || "?"})</h3>
                            <div className="grid gap-2">
                                <Label>Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-between text-left font-normal",
                                                !date1 && "text-muted-foreground"
                                            )}
                                        >
                                            {date1 ? format(date1, "EEE, MMM d, yyyy") : <span>Pick a date</span>}
                                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date1}
                                            onSelect={setDate1}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="grid gap-2">
                                <Label>Project</Label>
                                <Select value={projectId1} onValueChange={setProjectId1}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map((project) => (
                                            <SelectItem key={project.id} value={project.id}>
                                                {project.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Task</Label>
                                <Select value={taskId1 || "none"} onValueChange={setTaskId1}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select task" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- No Task --</SelectItem>
                                        {tasks.map((task) => (
                                            <SelectItem key={task.id} value={task.id}>
                                                {task.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Notes</Label>
                                <Textarea value={notes1} onChange={(e) => setNotes1(e.target.value)} placeholder="Notes..." />
                            </div>
                        </div>

                        {/* Entry 2 */}
                        <div className="space-y-4 border rounded-md p-4 bg-gray-50/50">
                            <h3 className="font-semibold text-sm">Second Entry ({splitTime || "?"} - {initialData.endTime})</h3>
                            <div className="grid gap-2">
                                <Label>Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-between text-left font-normal",
                                                !date2 && "text-muted-foreground"
                                            )}
                                        >
                                            {date2 ? format(date2, "EEE, MMM d, yyyy") : <span>Pick a date</span>}
                                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date2}
                                            onSelect={setDate2}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="grid gap-2">
                                <Label>Project</Label>
                                <Select value={projectId2} onValueChange={setProjectId2}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map((project) => (
                                            <SelectItem key={project.id} value={project.id}>
                                                {project.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Task</Label>
                                <Select value={taskId2 || "none"} onValueChange={setTaskId2}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select task" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- No Task --</SelectItem>
                                        {tasks.map((task) => (
                                            <SelectItem key={task.id} value={task.id}>
                                                {task.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Notes</Label>
                                <Textarea value={notes2} onChange={(e) => setNotes2(e.target.value)} placeholder="Notes..." />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!splitTime || !projectId1 || !projectId2}>Split</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
