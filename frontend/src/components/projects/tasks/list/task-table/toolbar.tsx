"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search } from "lucide-react"
import { updateTask } from "@/action/task"
import { toast } from "sonner"
import { ITask } from "@/interface"
import { ListToolbarProps, ListTabsProps } from "@/types/tasks"

export function ListTabs({ activeTab, setActiveTab, baseFilteredTasks }: ListTabsProps) {
    const tabs = [
        { key: "all" as const, label: "ALL", count: baseFilteredTasks.length },
        { key: "active" as const, label: "ACTIVE", count: baseFilteredTasks.filter(t => t.task_status?.code !== "done").length },
        { key: "completed" as const, label: "COMPLETED", count: baseFilteredTasks.filter(t => t.task_status?.code === "done").length },
    ]

    return (
        <div className="flex items-center gap-6 text-sm">
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    className={`pb-2 border-b-2 transition-colors ${
                        activeTab === tab.key
                            ? "border-foreground font-medium"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setActiveTab(tab.key)}
                >
                    {tab.label} ({tab.count})
                </button>
            ))}
        </div>
    )
}

export function ListToolbar({
    searchQuery, setSearchQuery,
    selectedProject, setSelectedProject,
    selectedAssignee, setSelectedAssignee,
    projects, members, selectedCount,
    taskTreeLength, activeTab, rowSelection,
    taskStatuses, setTasks, setRowSelection,
}: ListToolbarProps) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative w-full sm:w-auto min-w-[260px] max-w-[360px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Search tasks"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger className="w-[180px] border-gray-300">
                            <SelectValue placeholder="All projects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All projects</SelectItem>
                            {projects.map((project) => (
                                <SelectItem key={project.id} value={project.name}>
                                    {project.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                        <SelectTrigger className="w-[180px] border-gray-300">
                            <SelectValue placeholder="All assignees" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All assignees</SelectItem>
                            {members.map((member) => {
                                const name =
                                    `${member.user?.first_name || ""} ${member.user?.last_name || ""}`.trim() ||
                                    member.user?.display_name ||
                                    "Unknown"
                                return (
                                    <SelectItem key={member.id} value={name}>
                                        {name}
                                    </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="px-3" disabled={selectedCount === 0}>
                            Batch actions
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem
                            onSelect={async () => {
                                const selectedRowIds = Object.keys(rowSelection).filter((k) => rowSelection[k])
                                const newStatusCode = activeTab === "active" ? "done" : "todo"
                                const statusToApply = taskStatuses.find((s) => s.code === newStatusCode)
                                if (!statusToApply) return

                                const results = await Promise.all(
                                    selectedRowIds.map((id) => {
                                        const fd = new FormData()
                                        fd.append("id", id)
                                        fd.append("status_id", statusToApply.id.toString())
                                        return updateTask(fd)
                                    })
                                )

                                if (results.some((r) => r.success)) {
                                    setTasks((prev: ITask[]) =>
                                        prev.map((t) =>
                                            selectedRowIds.includes(t.id.toString())
                                                ? { ...t, status_id: statusToApply.id, task_status: statusToApply }
                                                : t
                                        )
                                    )
                                    toast.success("Tasks updated")
                                }
                                setRowSelection(() => ({}))
                            }}
                        >
                            {activeTab === "active" ? "Mark as completed" : "Reopen tasks"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <span className="text-sm text-muted-foreground min-w-[90px]">
                    {selectedCount} / {taskTreeLength} selected
                </span>
            </div>
        </div>
    )
}
