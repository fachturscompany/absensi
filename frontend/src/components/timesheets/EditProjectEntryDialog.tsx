"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TimeEntry } from "@/lib/data/dummy-data"

interface Project {
    id: string
    name: string
    clientId: string
}

interface Task {
    id: string
    title: string
}

interface EditProjectEntryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData: TimeEntry | null
    projects: Project[]
    onSave: (updatedEntry: Partial<TimeEntry>) => void
    tasks?: Task[]
}

export function EditProjectEntryDialog({
    open,
    onOpenChange,
    initialData,
    projects,
    tasks = [],
    onSave
}: EditProjectEntryDialogProps) {
    const [projectId, setProjectId] = useState("")
    const [taskId, setTaskId] = useState("")
    const [notes, setNotes] = useState("")

    useEffect(() => {
        if (initialData) {
            setProjectId(initialData.projectId)
            setTaskId(initialData.taskId || "")
            setNotes(initialData.notes || "")
        }
    }, [initialData, open])

    const handleSave = () => {
        if (!initialData) return
        onSave({
            ...initialData,
            projectId,
            taskId: taskId === "none" ? undefined : taskId,
            notes
        })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Project Entry</DialogTitle>
                    <DialogDescription>
                        Change the project, task, or notes for this time entry.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="project">Project *</Label>
                        <Select value={projectId} onValueChange={setProjectId}>
                            <SelectTrigger id="project">
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
                        <Label htmlFor="task">Task</Label>
                        <Select value={taskId || "none"} onValueChange={setTaskId}>
                            <SelectTrigger id="task">
                                <SelectValue placeholder="Select task (optional)" />
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
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!projectId}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
