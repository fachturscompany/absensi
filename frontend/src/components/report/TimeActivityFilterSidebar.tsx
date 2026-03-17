"use client"

import { useState } from "react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { DUMMY_MEMBERS, DUMMY_TEAMS, DUMMY_PROJECTS, DUMMY_CLIENTS } from "@/lib/data/dummy-data"
import { FilterSidebar } from "@/components/report/FilterSidebar"

interface TimeActivityFilterSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onApply?: (filters: any) => void
    className?: string
}

export function TimeActivityFilterSidebar({ open, onOpenChange, onApply, className }: TimeActivityFilterSidebarProps) {
    const [member, setMember] = useState("all")
    const [project, setProject] = useState("all")
    const [team, setTeam] = useState("all")
    const [client, setClient] = useState("all")
    const [task, setTask] = useState("all")

    const handleApply = () => {
        onApply?.({
            member,
            project,
            team,
            client,
            task
        })
    }

    const handleClear = () => {
        setMember("all")
        setProject("all")
        setTeam("all")
        setClient("all")
        setTask("all")
    }

    return (
        <FilterSidebar
            open={open}
            onOpenChange={onOpenChange}
            onApply={handleApply}
            onClear={handleClear}
            className={className}
        >
            {/* Members */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Members</Label>
                <Select value={member} onValueChange={setMember}>
                    <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder="All members" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All members</SelectItem>
                        {DUMMY_MEMBERS.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Projects */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Projects</Label>
                <Select value={project} onValueChange={setProject}>
                    <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder="All projects" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All projects</SelectItem>
                        {DUMMY_PROJECTS.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Teams */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Teams</Label>
                <Select value={team} onValueChange={setTeam}>
                    <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder="All teams" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All teams</SelectItem>
                        {DUMMY_TEAMS.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Clients */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Clients</Label>
                <Select value={client} onValueChange={setClient}>
                    <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder="All clients" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All clients</SelectItem>
                        {DUMMY_CLIENTS.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Tasks */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Tasks</Label>
                <Select value={task} onValueChange={setTask}>
                    <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder="All tasks" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All tasks</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Tracked Time */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Tracked Time</Label>
                <Select defaultValue="tracked">
                    <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="tracked">Members with tracked time</SelectItem>
                        <SelectItem value="all">All members</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Settings */}
            <div className="space-y-3 pt-2">
                <Label className="text-sm font-semibold text-gray-900">Settings</Label>
                <div className="flex items-center space-x-2">
                    <Checkbox id="archived" defaultChecked />
                    <label
                        htmlFor="archived"
                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-600 uppercase"
                    >
                        Include archived projects
                    </label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="removed" />
                    <label
                        htmlFor="removed"
                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-600 uppercase"
                    >
                        Include removed members
                    </label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="workbreaks" />
                    <label
                        htmlFor="workbreaks"
                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-600 uppercase"
                    >
                        Exclude workbreaks
                    </label>
                </div>
            </div>
        </FilterSidebar>
    )
}
