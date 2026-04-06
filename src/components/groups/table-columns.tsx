"use client"

import { ColumnDef } from "@tanstack/react-table"
import { IGroup } from "@/interface"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash, ChevronRight } from "lucide-react"
import Link from "next/link"

type GroupColumnsProps = {
  organizationId: string | number | null | undefined
  onEdit: (group: IGroup) => void
  onDelete: (group: IGroup) => void
}

export function getGroupColumns({
  organizationId,
  onEdit,
  onDelete,
}: GroupColumnsProps): ColumnDef<IGroup>[] {
  return [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => {
        const slug = encodeURIComponent(row.original.code ?? "no-group")
        return (
          <Link href={`/group/${slug}/members`} className="hover:underline text-sm font-mono">
            {row.original.code}
          </Link>
        )
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const slug = encodeURIComponent(row.original.code ?? "no-group")
        return (
          <Link href={`/group/${slug}/members`} className="hover:underline font-medium">
            {row.original.name}
          </Link>
        )
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.description}</span>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) =>
        row.original.is_active ? (
          <Badge className="bg-slate-600 text-primary-foreground">Active</Badge>
        ) : (
          <Badge variant="destructive">Inactive</Badge>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const isNoGroup = row.original.id === "no-group"
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              disabled={isNoGroup}
              onClick={() => { if (!isNoGroup) onEdit(row.original) }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Link href={`/group/move?id=${row.original.id}${isNoGroup ? `&orgId=${organizationId}` : ""}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Move member(s)">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost" size="icon"
              disabled={isNoGroup}
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => { if (!isNoGroup) onDelete(row.original) }}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]
}