"use client"

import React from "react"
import { DataTable } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { Plus, Group as GroupIcon, Pencil, Trash, Search, RotateCcw, ChevronRight, FileSpreadsheet, X } from "lucide-react"
import {
  Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { IGroup } from "@/interface"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { deleteGroup, createGroup, getAllGroups, updateGroup } from "@/action/groups/group"
import { getAllOrganization } from "@/action/organization"
import { TableSkeleton, groupsColumns as groupsSkeletonColumns } from "@/components/skeleton/tables-loading"
import { getCache, setCache } from "@/lib/local-cache"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useHydration } from "@/hooks/useHydration"
import Link from "next/link"

import { GroupFormDialog, GroupForm, groupSchema } from "@/components/groups/dialogs/form-dialog"
import { GroupDeleteDialog } from "@/components/groups/dialogs/delete-dialog"

// ─── Helper: slug untuk URL ───────────────────────────────────────────────────
// Virtual "No Group" pakai id "no-group" sebagai slug khusus
// Group biasa pakai code yang di-encode
function getGroupSlug(group: IGroup): string {
  if (group.id === "no-group") return "no-group"
  return encodeURIComponent(group.code ?? group.id)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GroupsPage() {
  const queryClient = useQueryClient()
  const { isHydrated, organizationId } = useHydration()
  const searchParams = useSearchParams()
  const q = searchParams.get("q") || ""

  // ── Data state ─────────────────────────────────────────────────────────────
  const [groups, setGroups] = React.useState<IGroup[]>([])
  const [organizations, setOrganizations] = React.useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = React.useState(true)

  // ── Filter state ───────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = React.useState(q)
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [sortOrder] = React.useState("z-a")

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingGroup, setEditingGroup] = React.useState<IGroup | null>(null)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<IGroup | null>(null)

  // ── Form ───────────────────────────────────────────────────────────────────
  const form = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      organization_id: "",
      code: "",
      name: "",
      description: "",
      is_active: true,
    },
  })

  React.useEffect(() => {
    if (organizationId && !modalOpen) {
      form.setValue("organization_id", String(organizationId))
    }
  }, [organizationId, modalOpen, form])

  // ── Filtered & sorted ──────────────────────────────────────────────────────
  const filteredGroups = React.useMemo(() => {
    let result = [...groups]
    if (searchQuery) {
      const lq = searchQuery.toLowerCase()
      result = result.filter(
        (g) =>
          (g.code || "").toLowerCase().includes(lq) ||
          (g.name || "").toLowerCase().includes(lq) ||
          (g.description || "").toLowerCase().includes(lq)
      )
    }
    if (statusFilter !== "all") {
      result = result.filter((g) =>
        statusFilter === "active" ? g.is_active : !g.is_active
      )
    }
    result.sort((a, b) =>
      sortOrder === "a-z"
        ? (a.name || "").localeCompare(b.name || "")
        : (b.name || "").localeCompare(a.name || "")
    )
    return result
  }, [groups, searchQuery, statusFilter, sortOrder])

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchGroups = React.useCallback(async () => {
    if (!organizationId) return
    try {
      setLoading(true)
      const result = await getAllGroups(organizationId)
      if (!result.success) throw new Error(result.message)
      await queryClient.invalidateQueries({ queryKey: ["groups"] })
      const virtualNoGroup: IGroup = {
        id: "no-group",
        organization_id: String(organizationId),
        code: "no-group",   // FIX: pakai "no-group" bukan "-" agar slug match dengan getGroupByCode
        name: "No Group",
        description: "Members without a group",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const allGroups = [...result.data, virtualNoGroup]
      setGroups(allGroups)
      setCache<IGroup[]>(`groups:${organizationId}`, allGroups, 1000 * 300)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [organizationId, queryClient])

  const fetchOrganizations = React.useCallback(async () => {
    try {
      const response = await getAllOrganization()
      if (!response.success) throw new Error(response.message)
      setOrganizations(response.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error")
    }
  }, [])

  React.useEffect(() => {
    if (!isHydrated) return
    if (!organizationId) {
      fetchOrganizations()
      setLoading(false)
      return
    }
    const cached = getCache<IGroup[]>(`groups:${organizationId}`)
    if (cached && cached.length > 0) {
      setGroups(cached)
      setLoading(false)
      return
    }
    fetchGroups()
  }, [isHydrated, organizationId])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleRefresh = React.useCallback(async () => {
    try {
      if (typeof window !== "undefined") {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("groups:"))
          .forEach((k) => localStorage.removeItem(k))
      }
      await fetchGroups()
      await queryClient.invalidateQueries({ queryKey: ["groups"] })
      toast.success("Data has been refreshed!")
    } catch {
      toast.error("Failed to refresh data")
    }
  }, [fetchGroups, queryClient])

  const handleSubmit = async (values: GroupForm) => {
    try {
      const res = editingGroup
        ? await updateGroup(editingGroup.id, values)
        : await createGroup(values)
      if (!res.success) throw new Error(res.message)
      await queryClient.invalidateQueries({ queryKey: ["groups"] })
      toast.success(editingGroup ? "Saved successfully" : "Group created successfully")
      setModalOpen(false)
      setEditingGroup(null)
      fetchGroups()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const result = await deleteGroup(deleteTarget.id)
      if (!result.success) throw new Error(result.message || "Failed to delete")
      toast.success("Group deleted successfully")
      await queryClient.invalidateQueries({ queryKey: ["groups"] })
      fetchGroups()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setDeleteOpen(false)
      setDeleteTarget(null)
    }
  }

  const openAdd = () => {
    setEditingGroup(null)
    form.reset({
      organization_id: organizationId ? String(organizationId) : "",
      code: "", name: "", description: "", is_active: true,
    })
    setModalOpen(true)
  }

  const openEdit = (group: IGroup) => {
    setEditingGroup(group)
    form.reset({
      organization_id: String(group.organization_id),
      code: group.code || "",
      name: group.name,
      description: group.description || "",
      is_active: group.is_active ?? true,
    })
    setModalOpen(true)
  }

  const handleModalClose = (open: boolean) => {
    setModalOpen(open)
    if (!open) {
      setEditingGroup(null)
      form.reset({
        organization_id: organizationId ? String(organizationId) : "",
        code: "", name: "", description: "", is_active: true,
      })
    }
  }

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnDef<IGroup>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => {
        const slug = getGroupSlug(row.original)
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
        const slug = getGroupSlug(row.original)
        return (
          // FIX: tampilkan .name bukan .code
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
              onClick={() => { if (!isNoGroup) openEdit(row.original) }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Link href={`/group/move?id=${row.original.id}${isNoGroup ? `&orgId=${organizationId}` : ""}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:cursor-pointer"
                title="Move member(s)">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost" size="icon"
              disabled={isNoGroup}
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => { if (!isNoGroup) { setDeleteTarget(row.original); setDeleteOpen(true) } }}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!isHydrated) {
    return (
      <div className="flex flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Groups</h1>
        </div>
        <TableSkeleton rows={6} columns={groupsSkeletonColumns} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pt-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Groups</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Group
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-8"
            disabled={loading}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="h-9"
          >
            <RotateCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button asChild variant="outline" size="sm" className="h-9">
            <Link href="/group/import">
              <FileSpreadsheet className="mr-2 h-4 w-4" />Import
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <TableSkeleton rows={6} columns={groupsSkeletonColumns} />
        ) : groups.length === 0 ? (
          <div className="py-20">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <GroupIcon className="h-14 w-14 text-muted-foreground mx-auto" />
                </EmptyMedia>
                <EmptyTitle>No groups yet</EmptyTitle>
                <EmptyDescription>
                  {searchQuery ? `No groups found matching "${searchQuery}"` : "There are no groups for this organization."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredGroups} showColumnToggle={false} />
        )}
      </div>


      {/* Dialogs — di luar layout */}
      <GroupFormDialog
        open={modalOpen}
        onOpenChange={handleModalClose}
        editingId={editingGroup?.id ?? null}
        form={form}
        onSubmit={handleSubmit}
        organizationId={organizationId}
        organizations={organizations}
      />

      <GroupDeleteDialog
        open={deleteOpen}
        onOpenChange={(o) => { setDeleteOpen(o); if (!o) setDeleteTarget(null) }}
        target={deleteTarget}
        onConfirm={handleDelete}
      />
    </div>
  )
}