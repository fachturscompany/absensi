"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TaskRedirect({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()

    useEffect(() => {
        // Redirect /projects/[id]/task to /projects/[id]/tasks
        router.replace(`/projects/${id}/tasks`)
    }, [id, router])

    return (
        <div className="p-10 text-center text-muted-foreground">
            Redirecting...
        </div>
    )
}
