"use client"

import React from "react"
import { DataTable } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { Plus, Group as GroupIcon, Pencil, Trash, Search, RotateCcw, ChevronRight, FileSpreadsheet } from "lucide-react"
import {
  Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia,
} from "@/components/ui/empty"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { IGroup } from "@/interface"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteGroup, createGroup, getAllGroups, updateGroup } from "@/action/group"
import { getAllOrganization } from "@/action/organization"
import { Can } from "@/components/common/can"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import { getCache, setCache } from "@/lib/local-cache"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useHydration } from "@/hooks/useHydration"
import Link from "next/link"

const groupSchema = z.object({
  organization_id: z.string().min(1, "Organization is required"),
  code: z.string().min(2, "min 2 characters"),
  name: z.string().min(2, "min 2 characters"),
  description: z.string().optional(),
  is_active: z.boolean(),
})
type GroupForm = z.infer<typeof groupSchema>

export default function GroupsPage() {
  const queryClient = useQueryClient()
  // useOrgGuard dihapus — guard dilakukan manual di bawah setelah isHydrated
  const { isHydrated, organizationId } = useHydration()

  const searchParams = useSearchParams()
  const q = searchParams.get("q") || ""

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingDetail, setEditingDetail] = React.useState<IGroup | null>(null)
  const [groups, setGroups] = React.useState<IGroup[]>([])
  const [organizations, setOrganizations] = React.useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState(q)
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [sortOrder] = React.useState("z-a")

  // ─── Filter & sort ──────────────────────────────────────────────────────────
  const filteredAndSortedGroups = React.useMemo(() => {
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
      result = result.filter((g) => statusFilter === "active" ? g.is_active : !g.is_active)
    }
    result.sort((a, b) =>
      sortOrder === "a-z"
        ? (a.name || "").localeCompare(b.name || "")
        : (b.name || "").localeCompare(a.name || "")
    )
    return result
  }, [groups, searchQuery, statusFilter, sortOrder])

  // ─── Fetch groups ───────────────────────────────────────────────────────────
  // Tidak dipanggil sampai isHydrated && organizationId keduanya tersedia
  const fetchGroups = React.useCallback(async () => {
    if (!organizationId) return   // silent return — tidak toast, tidak redirect

    try {
      setLoading(true)
      const result = await getAllGroups(organizationId)
      if (!result.success) throw new Error(result.message)
      await queryClient.invalidateQueries({ queryKey: ["groups"] })

      const virtualNoGroup: IGroup = {
        id: "no-group",
        organization_id: String(organizationId),
        code: "-",
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

  // Fetch orgs hanya kalau tidak ada organizationId sama sekali (super-admin view)
  const fetchOrganizations = React.useCallback(async () => {
    try {
      const response = await getAllOrganization()
      if (!response.success) throw new Error(response.message)
      setOrganizations(response.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error")
    }
  }, [])

  // ─── Effects ────────────────────────────────────────────────────────────────
  // KUNCI: Tunggu isHydrated = true DULU sebelum melakukan apapun.
  // Ini mencegah race condition antara cookie/store hydration dan fetch pertama.
  React.useEffect(() => {
    if (!isHydrated) return  // belum siap, tunggu

    if (!organizationId) {
      // Hydrated tapi tidak ada org → super-admin atau org belum dipilih
      // Fetch daftar org untuk dropdown, jangan redirect/toast
      fetchOrganizations()
      setLoading(false)
      return
    }

    // Hydrated + ada organizationId → coba cache dulu
    const cached = getCache<IGroup[]>(`groups:${organizationId}`)
    if (cached && cached.length > 0) {
      setGroups(cached)
      setLoading(false)
      return
    }

    fetchGroups()
  }, [isHydrated, organizationId])  // fetchGroups & fetchOrganizations sengaja tidak masuk dep
  // karena kedua fungsi ini akan berubah setiap render jika dimasukkan,
  // dan kita hanya ingin effect ini jalan saat hydration state atau org berubah.

  // ─── Form ───────────────────────────────────────────────────────────────────
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

  // Sync orgId ke form setelah hydration
  React.useEffect(() => {
    if (organizationId && !isModalOpen) {
      form.setValue("organization_id", String(organizationId))
    }
  }, [organizationId, isModalOpen, form])

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      const result = await deleteGroup(id)
      if (result.success) {
        toast.success("Group deleted successfully")
        await queryClient.invalidateQueries({ queryKey: ["groups"] })
        fetchGroups()
      } else {
        toast.error(result.message || "Failed to delete group")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    }
  }

  const handleSubmit = async (values: GroupForm) => {
    try {
      const res = editingDetail
        ? await updateGroup(editingDetail.id, values)
        : await createGroup(values)
      if (!res.success) throw new Error(res.message)
      await queryClient.invalidateQueries({ queryKey: ["groups"] })
      toast.success(editingDetail ? "Saved successfully" : "Group created successfully")
      setIsModalOpen(false)
      setEditingDetail(null)
      fetchGroups()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsModalOpen(open)
    if (!open) {
      setEditingDetail(null)
      form.reset({
        organization_id: organizationId ? String(organizationId) : "",
        code: "",
        name: "",
        description: "",
        is_active: true,
      })
    }
  }

  // ─── Columns ─────────────────────────────────────────────────────────────────
  const columns: ColumnDef<IGroup>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <Link href={`/group/${row.original.name}/members`} className="hover:underline">
          {row.original.code}
        </Link>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <Link href={`/group/${row.original.name}/members`} className="hover:underline font-medium">
          {row.original.name}
        </Link>
      ),
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
          <Badge className="bg-green-500 text-primary-foreground">Active</Badge>
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
            {/* Edit */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={isNoGroup}
              onClick={() => {
                if (isNoGroup) return
                setEditingDetail(row.original)
                form.reset({
                  organization_id: String(row.original.organization_id),
                  code: row.original.code || "",
                  name: row.original.name,
                  description: row.original.description || "",
                  is_active: row.original.is_active ?? true,
                })
                setIsModalOpen(true)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            {/* Move members */}
            <Link href={`/group/move?id=${row.original.id}${isNoGroup ? `&orgId=${organizationId}` : ""}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Move member(s)">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>

            {/* Delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isNoGroup}
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Group</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete <span className="font-semibold text-foreground">{row.original.name}</span>? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(row.original.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    },
  ]

  // ─── Render ──────────────────────────────────────────────────────────────────
  // Tampilkan skeleton selama belum hydrated — jangan render konten sama sekali
  if (!isHydrated) {
    return (
      <div className="p-4 md:p-6">
        <TableSkeleton rows={6} columns={4} />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 w-full">
      <div className="p-4 md:p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>

            <Button asChild variant="outline" size="sm">
              <Link href="/group/import">
                <FileSpreadsheet className="mr-2 h-4 w-4" />Import
              </Link>
            </Button>

            <Dialog open={isModalOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingDetail(null)
                    form.reset({
                      organization_id: organizationId ? String(organizationId) : "",
                      code: "",
                      name: "",
                      description: "",
                      is_active: true,
                    })
                    setIsModalOpen(true)
                  }}
                >
                  Add <Plus className="ml-2 h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle>{editingDetail ? "Edit Group" : "Add Group"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    {/* Organization: hidden jika sudah ada orgId, visible jika super-admin */}
                    {organizationId ? (
                      <input type="hidden" value={String(organizationId)} {...form.register("organization_id")} />
                    ) : (
                      <Can permission="view_departments">
                        <FormField
                          control={form.control}
                          name="organization_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger><SelectValue placeholder="Select Organization" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {organizations.map((org) => (
                                    <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </Can>
                    )}

                    <FormField control={form.control} name="code" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code</FormLabel>
                        <FormControl><Input placeholder="e.g., x_rpl" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl><Input placeholder="e.g., X RPL" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl><Input placeholder="e.g., Rekayasa Perangkat Lunak" {...field} /></FormControl>
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="is_active" render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Active</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )} />

                    <Button type="submit" className="w-full">
                      {editingDetail ? "Update" : "Create"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content */}
        <div className="mt-2">
          {loading ? (
            <TableSkeleton rows={6} columns={4} />
          ) : groups.length === 0 ? (
            <div className="mt-20">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <GroupIcon className="h-14 w-14 text-muted-foreground mx-auto" />
                  </EmptyMedia>
                  <EmptyTitle>No groups yet</EmptyTitle>
                  <EmptyDescription>
                    There are no groups for this organization. Use the "Add" button to create one.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <DataTable columns={columns} data={filteredAndSortedGroups} showColumnToggle={false} />
          )}
        </div>
      </div>
    </div>
  )
}