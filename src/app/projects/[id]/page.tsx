"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ProjectRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  useEffect(() => {
    // Redirect to the members page by default (or overview logic in future)
    router.replace(`/projects/${id}/tasks`)
  }, [id, router])

  return (
    <div className="p-10 text-center text-muted-foreground">
      Redirecting to project details...
    </div>
  )
}