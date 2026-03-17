"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { getProjectWithMembers } from "@/action/projects"
import { ChevronRight, Folder } from "lucide-react"

export default function ProjectLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ id: string }>
}) {
    const { id } = use(params)
    const [project, setProject] = useState<any>(null)

    useEffect(() => {
        getProjectWithMembers(id).then((res) => {
            if (res.success) {
                setProject(res.data)
            }
        })
    }, [id])

    return (
        <div className="flex flex-col h-full">
            <div className="px-6 py-4 flex flex-col gap-4">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/projects" className="hover:text-foreground flex items-center gap-1">
                        <Folder className="h-4 w-4" />
                        Projects
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                    <span className="font-medium text-foreground">{project?.name || "Loading..."}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold tracking-tight">{project?.name || "Project Details"}</h1>
                        {project?.clientName && (
                            <p className="text-sm text-muted-foreground">Client: {project.clientName}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    )
}
