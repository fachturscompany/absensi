"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createTask, updateTask, deleteTask, getTasks, assignTaskMember } from "@/action/task"
import { toast } from "sonner"
import { ITask } from "@/interface"
import { ListDialogsProps } from "@/types/tasks"

export function ListDialogs({
    isNewTaskDialogOpen, setIsNewTaskDialogOpen,
    newTaskTitle, setNewTaskTitle,
    newTaskProject, setNewTaskProject,
    newTaskAssignee, setNewTaskAssignee,
    newTaskStatus, setNewTaskStatus,
    projects, members, taskStatuses, setTasks,
    taskToDelete, setTaskToDelete,
    editingTask, setEditingTask,
    editedTitle, setEditedTitle,
    editedStatus, setEditedStatus,
    editedAssignee, setEditedAssignee,
}: ListDialogsProps) {
    const handleCreateTask = async () => {
        if (!newTaskTitle || !newTaskProject) return
        const fd = new FormData()
        fd.append("name", newTaskTitle)
        fd.append("project_id", newTaskProject.toString())
        if (newTaskStatus) fd.append("status_id", newTaskStatus.toString())

        const res = await createTask(fd)
        if (res.success && res.data) {
            if (newTaskAssignee) await assignTaskMember(res.data.id, Number(newTaskAssignee))
            const tasksRes = await getTasks()
            if (tasksRes.success) setTasks(() => tasksRes.data)
            setIsNewTaskDialogOpen(false)
            toast.success("Task created")
        }
    }

    const handleDeleteTask = async () => {
        if (!taskToDelete) return
        const fd = new FormData()
        fd.append("id", taskToDelete.id.toString())
        const res = await deleteTask(fd)
        if (res.success) {
            setTasks((prev: ITask[]) => prev.filter((t) => t.id !== taskToDelete.id))
            toast.success("Task deleted")
        }
        setTaskToDelete(null)
    }

    const handleUpdateTask = async () => {
        if (!editingTask) return
        const fd = new FormData()
        fd.append("id", editingTask.id.toString())
        fd.append("name", editedTitle)
        if (editedStatus) fd.append("status_id", editedStatus.toString())

        const res = await updateTask(fd)
        if (res.success) {
            if (editedAssignee) await assignTaskMember(editingTask.id, Number(editedAssignee))
            const tasksRes = await getTasks()
            if (tasksRes.success) setTasks(() => tasksRes.data)
            setEditingTask(null)
            toast.success("Task updated")
        }
    }

    return (
        <>
            {/* New Task Dialog */}
            <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            placeholder="Task Name"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                        <Select
                            value={newTaskProject.toString()}
                            onValueChange={(v) => setNewTaskProject(Number(v))}
                        >
                            <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                            <SelectContent>
                                {projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={newTaskAssignee.toString()}
                            onValueChange={(v) => setNewTaskAssignee(Number(v))}
                        >
                            <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
                            <SelectContent>
                                {members.map((m) => (
                                    <SelectItem key={m.id} value={m.id.toString()}>
                                        {m.user?.display_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={newTaskStatus.toString()}
                            onValueChange={(v) => setNewTaskStatus(Number(v))}
                        >
                            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>
                                {taskStatuses.map((s) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewTaskDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateTask}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog
                open={Boolean(taskToDelete)}
                onOpenChange={(open) => !open && setTaskToDelete(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Task</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this task?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTaskToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteTask}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog
                open={Boolean(editingTask)}
                onOpenChange={(open) => !open && setEditingTask(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                        />
                        <Select
                            value={editedStatus.toString()}
                            onValueChange={(v) => setEditedStatus(Number(v))}
                        >
                            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>
                                {taskStatuses.map((s) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={editedAssignee.toString()}
                            onValueChange={(v) => setEditedAssignee(Number(v))}
                        >
                            <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
                            <SelectContent>
                                {members.map((m) => (
                                    <SelectItem key={m.id} value={m.id.toString()}>
                                        {m.user?.display_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
                        <Button onClick={handleUpdateTask}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
