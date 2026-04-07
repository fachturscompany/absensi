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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {projects.map((project) => (
                <div key={project.id} className="relative group h-full">
                    <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <Checkbox
                            checked={selectedIds.includes(project.id)}
                            onCheckedChange={() => onToggleSelect(project.id)}
                            className="bg-white/80 backdrop-blur-sm border-gray-300 data-[state=checked]:bg-primary"
                        />
                    </div>
                    <Link href={`/projects/${project.id}/tasks`} className="block h-full">
                        <Card className={cn(
                            "transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full flex flex-col border-border/50 dark:border-border",
                            selectedIds.includes(project.id) && "ring-2 ring-primary border-primary/50 bg-primary/[0.02]"
                        )}>
                            <CardHeader className="pb-2 pt-6 px-5">
                                <div className="flex justify-between items-start gap-3">
                                    <CardTitle className="text-base font-semibold leading-tight line-clamp-2" title={project.name}>
                                        {project.name}
                                    </CardTitle>
                                    {project.archived && (
                                        <Badge variant="secondary" className="shrink-0 text-[10px] font-bold uppercase tracking-wider h-5 px-2">
                                            Archived
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col pt-0 px-5 pb-5">
                                <div 
                                    className="text-muted-foreground mb-4 text-xs font-medium tracking-wide line-clamp-1" 
                                    title={project.teams.length > 0 ? project.teams.join(" • ") : "No teams assigned"}
                                >
                                    {project.teams.length > 0 ? project.teams.join(" • ") : "No teams assigned"}
                                </div>

                                <div className="mt-auto mb-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Tasks</span>
                                        <span className="text-xs font-bold text-primary">{project.taskCount}</span>
                                    </div>
                                    <Progress value={Math.min(100, (project.taskCount / 10) * 100)} className="h-1.5 bg-secondary" />
                                </div>

                                <div className="flex items-center justify-between pt-4 mt-auto border-t border-border">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-bold text-muted-foreground tracking-wide">{project.members.length} MEMBERS</span>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] font-bold border-primary/20 bg-primary/5 text-primary tracking-wider uppercase px-2 py-0.5"
                                    >
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