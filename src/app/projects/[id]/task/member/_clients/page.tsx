"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { DUMMY_MEMBERS, DUMMY_PROJECTS, PROJECT_MEMBER_MAP, type Member } from "@/lib/data/dummy-data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function ProjectMembersClient({ projectId }: { projectId: string }) {
  const project = useMemo(() => DUMMY_PROJECTS.find(p => p.id === projectId), [projectId])
  const [query, setQuery] = useState("")

  const memberIds = PROJECT_MEMBER_MAP[projectId] ?? []
  const assignedMembers: Member[] = useMemo(() => {
    const base = DUMMY_MEMBERS.filter(m => memberIds.includes(m.id))
    if (!query.trim()) return base
    const q = query.toLowerCase()
    return base.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
  }, [memberIds, query])

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Project Members</h1>
          <p className="text-sm text-muted-foreground">
            {project ? project.name : "Unknown Project"}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/projects">Back to Projects</Link>
        </Button>
      </div>

      <div className="flex items-center gap-3 max-w-sm">
        <Input
          placeholder="Search members"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto w-full mt-2">
        <table className="w-full min-w-[720px]">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-3 text-left text-xs font-medium">Name</th>
              <th className="p-3 text-left text-xs font-medium">Email</th>
              <th className="p-3 text-left text-xs font-medium">Activity Score</th>
            </tr>
          </thead>
          <tbody className="[&>tr:nth-child(even)]:bg-muted/50">
            {assignedMembers.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-muted-foreground">
                  No members assigned
                </td>
              </tr>
            ) : (
              assignedMembers.map(m => (
                <tr key={m.id} className="border-b">
                  <td className="p-3 text-sm">{m.name}</td>
                  <td className="p-3 text-sm text-muted-foreground">{m.email}</td>
                  <td className="p-3 text-sm">{m.activityScore}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}