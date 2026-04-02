"use client"

import React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Project } from "@/interface"
import { cn } from "@/lib/utils"

interface ProjectGridViewProps {
    projects: Project[]
    selectedIds: string[]
    onToggleSelect: (id: string) => void
}

export default function ProjectGridView({ projects, selectedIds, onToggleSelect }: ProjectGridViewProps) {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project) => (
                <div key={project.id} className="relative group">
                    <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <Checkbox
                            checked={selectedIds.includes(project.id)}
                            onCheckedChange={() => onToggleSelect(project.id)}
                            className="bg-white/80 backdrop-blur-sm border-gray-300 data-[state=checked]:bg-primary"
                        />
                    </div>
                    <Link href={`/projects/${project.id}/tasks`} className="block h-full">
                        <Card className={cn(
                            "transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col border-gray-200 dark:border-gray-800",
                            selectedIds.includes(project.id) && "ring-2 ring-primary border-primary/50 bg-primary/[0.02]"
                        )}>
                            <CardHeader className="pb-3 pt-5">
                                <div className="flex justify-between items-start gap-2">
                                    <CardTitle className="text-base font-bold tracking-tight line-clamp-1">{project.name}</CardTitle>
                                    {project.archived && (
                                        <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest h-5 px-1.5">
                                            Archived
                                        </Badge>
                                    )}
                                </div>

                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col pt-0">
                                <div className="text-muted-foreground mb-5 text-[11px] font-semibold tracking-tight line-clamp-2">
                                    {project.teams.length > 0 ? project.teams.join(" • ") : "No teams assigned"}
                                </div>

                                <div className="mb-6 mt-auto">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tasks</span>
                                        <span className="text-[10px] font-black text-primary">{project.taskCount}</span>
                                    </div>
                                    <Progress value={Math.min(100, (project.taskCount / 10) * 100)} className="h-1.5 bg-gray-100 dark:bg-gray-800" />
                                </div>

                                <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-50 dark:border-gray-800/50">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-muted-foreground">{project.members.length} MEMBERS</span>
                                    </div>

                                    <Badge
                                        variant="outline"
                                        className="text-[9px] font-black border-primary/20 bg-primary/5 text-primary tracking-widest uppercase">
                                        {project.budgetLabel}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            ))}
        </div>
    )
}
