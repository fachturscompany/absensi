"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { DataTable } from "@/components/tables/data-table-move"
import { ColumnDef, useReactTable, getCoreRowModel, getPaginationRowModel, RowSelectionState } from "@tanstack/react-table"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { PlusCircle, Search, RotateCcw } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useSearchParams, useRouter } from 'next/navigation'
import { getGroupById, getAllGroups, createGroup } from '@/action/group'
import { createClient } from '@/utils/supabase/client'
import { moveMembersToGroup } from '@/action/members'
import { getCache, setCache } from '@/lib/local-cache'
import { IGroup, IOrganization_member, IUser } from '@/interface'
import { toast } from 'sonner'

type MemberRow = {
  id: string
  user_id: string
  department_id: string
  organization_id: string
  created_at?: string
  user_profiles?: {
    id: string
    first_name?: string
    last_name?: string
    display_name?: string | null
    email?: string
    phone?: string
    mobile?: string
    profile_photo_url?: string | null
    jenis_kelamin?: string | null
    agama?: string | null
  } | {
    id: string
    first_name?: string
    last_name?: string
    display_name?: string | null
    email?: string
    phone?: string
    mobile?: string
    profile_photo_url?: string | null
    jenis_kelamin?: string | null
    agama?: string | null
  }[] | null
}

type MemberWithExtras = IOrganization_member & { religionStr?: string | null }

const createGroupSchema = z.object({
  name: z.string().min(2, "Group name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
  description: z.string().optional(),
  is_active: z.boolean(),
})

export default function MoveGroupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupId = searchParams.get('id')

  const orgIdParam = searchParams.get('orgId')

  const handleMemberClick = (memberId: string) => {
    if (memberId) {
      router.push(`/members/${memberId}`)
    }
  }

  const [group, setGroup] = useState<IGroup | null>(null)
  const [members, setMembers] = useState<MemberWithExtras[]>([])
  const [loading, setLoading] = useState(true)
  const [allGroups, setAllGroups] = useState<IGroup[]>([])
  const [targetGroupId, setTargetGroupId] = useState<string>("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState("newest")
  const [totalItems, setTotalItems] = useState(0)

  const form = useForm<z.infer<typeof createGroupSchema>>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      is_active: true,
    },
  })

  // Helper function to refresh group list
  const refreshGroupList = React.useCallback(async (orgId: string | number) => {
    try {
      const allGroupsRes = await getAllGroups(Number(orgId));
      if (allGroupsRes.success && allGroupsRes.data) {
        const destinationGroups = allGroupsRes.data.filter((g: IGroup) => g.id !== groupId);
        setAllGroups(destinationGroups);
        if (destinationGroups.length === 0) {
          toast.info("No other groups available to move to.");
        }
      }
    } catch (error) {
      console.error('Failed to refresh group list:', error);
    }
  }, [groupId]);

  const fetchData = React.useCallback(async () => {
    if (!groupId) {
      toast.error('Group ID is missing')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      let currentGroup: IGroup | null = null;
      let effectiveOrgId: number | null = null;

      if (groupId === 'no-group') {
        if (!orgIdParam) {
          throw new Error("Organization ID is required for 'No Group' view");
        }
        effectiveOrgId = Number(orgIdParam);
        currentGroup = {
          id: 'no-group',
          organization_id: String(effectiveOrgId ?? ''),
          code: 'NO_GROUP',
          name: 'No Group',
          description: 'Members without a group',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setGroup(currentGroup)
      } else {
        const groupRes = await getGroupById(groupId)
        if (!groupRes.success || !groupRes.data) throw new Error(groupRes.message)
        currentGroup = groupRes.data
        effectiveOrgId = currentGroup.organization_id ? Number(currentGroup.organization_id) : null
        setGroup(groupRes.data)
      }


      const currentPage = pagination.pageIndex + 1
      const pageSize = pagination.pageSize
      const cacheKey = `group:move:members:${groupId}:p=${currentPage}:l=${pageSize}:sort=${sortOrder}`
      const cached = getCache<{ items: MemberWithExtras[]; total: number }>(cacheKey)
      if (cached) {
        setMembers(cached.items)
        setTotalItems(cached.total)
      }

      const supabase = createClient()
      const from = pagination.pageIndex * pagination.pageSize
      const to = from + pagination.pageSize - 1

      let query = supabase
        .from('organization_members')
        .select(`
            id,
            user_id,
            department_id,
            organization_id,
            created_at,
            user_profiles (
              id,
              first_name,
              last_name,
              display_name,
              email,
              phone,
              mobile,
              profile_photo_url,
              nik,
              jenis_kelamin,
              agama
            )
          `, { count: 'exact' })
        .eq('is_active', true)

      if (groupId === 'no-group') {
        query = query.is('department_id', null)
        if (effectiveOrgId) {
          query = query.eq('organization_id', effectiveOrgId)
        }
      } else {
        query = query.eq('department_id', groupId)
      }

      query = query.order('created_at', { ascending: sortOrder === 'oldest' })

      const { data: membersData, error: membersError, count } = await query.range(from, to)

      if (membersError) throw new Error(membersError.message)
      if (!membersData) throw new Error('Members not found')

      const mapGender = (raw?: string | null): IUser['gender'] | null => {
        if (!raw) return null
        const s = String(raw).trim().toLowerCase()
        if (["l", "m", "male", "pria", "lk", "laki-laki"].includes(s)) return "male"
        if (["p", "f", "female", "wanita", "perempuan"].includes(s)) return "female"
        return "other"
      }

      // Transform ke struktur IOrganization_member dengan field user
      const transformed = (membersData as unknown as MemberRow[]).map((m: MemberRow) => {
        const up = Array.isArray(m.user_profiles) ? (m.user_profiles[0] || undefined) : (m.user_profiles || undefined)
        const gender: IUser['gender'] | null = up ? mapGender(up.jenis_kelamin ?? null) : null
        return {
          ...(m as unknown as object),
          user: up ? {
            id: up.id,
            first_name: up.first_name,
            last_name: up.last_name,
            display_name: up.display_name,
            email: up.email,
            phone: up.phone,
            mobile: up.mobile,
            profile_photo_url: up.profile_photo_url,
            gender: gender,
          } : undefined,
          religionStr: up?.agama ?? null,
        }
      })

      const finalItems = transformed as MemberWithExtras[]
      setMembers(finalItems)
      setTotalItems(count || 0)

      try { setCache(cacheKey, { items: finalItems, total: count || 0 }, 1000 * 180) } catch { }

      // Get organization_id from the source group
      if (!effectiveOrgId) {
        throw new Error('Organization ID not found in source group.');
      }

      // Refresh group list
      await refreshGroupList(effectiveOrgId);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [groupId, refreshGroupList, orgIdParam]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [pagination.pageIndex, pagination.pageSize, sortOrder, groupId])

  const columns = useMemo<ColumnDef<MemberWithExtras>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "user.first_name",
        header: "Nickname",
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div
              onClick={() => handleMemberClick(member.id)}
              className="text-primary hover:underline cursor-pointer"
            >
              {member.user?.first_name || '-'}
            </div>
          )
        },
      },
      {
        id: "fullName",
        header: "Full Name",
        cell: ({ row }) => {
          const member = row.original;
          const fullName = `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim();
          return (
            <div
              onClick={() => handleMemberClick(member.id)}
              className="text-primary hover:underline cursor-pointer"
            >
              {fullName || '-'}
            </div>
          )
        },
      },
      {
        id: "gender",
        header: "Gender",
        cell: ({ row }) => {
          const member = row.original as any;
          return <div>{(() => {
            const gender = member.user?.jenis_kelamin
            if (gender === 'male') return 'L'
            if (gender === 'female') return 'P'
            return gender || '-'
          })()}</div>
        },
      },
      {
        id: "religion",
        header: "Religion",
        cell: ({ row }) => {
          const member = row.original;
          return <div>{member.religionStr || '-'}</div>
        },
      }
    ],
    [handleMemberClick]
  )

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const filteredAndSortedMembers = useMemo(() => {
    return members;
  }, [members]);

  const table = useReactTable({
    data: filteredAndSortedMembers,
    columns,
    getRowId: (row) => {
      console.log('[DEBUG] getRowId called for:', { id: row.id, user: row.user?.first_name });
      return row.id;
    },
    state: {
      rowSelection,
      pagination,
    },
    onRowSelectionChange: (updater) => {
      console.log('[DEBUG] onRowSelectionChange called');
      console.log('[DEBUG] Current rowSelection:', rowSelection);
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      console.log('[DEBUG] New rowSelection:', newSelection);
      setRowSelection(newSelection);
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
  })

  const handleCreateGroup = async (values: z.infer<typeof createGroupSchema>): Promise<void> => {
    if (!group?.organization_id) {
      toast.error("Source organization not found!")
      return
    }

    try {
      const payload = {
        ...values,
        organization_id: group.organization_id
      }
      const result = await createGroup(payload)
      if (!result.success || !result.data) throw new Error(result.message)

      toast.success(`Group "${result.data.name}" created successfully.`)
      setIsCreateModalOpen(false)
      form.reset()

      // Refresh group list and select the new one
      await refreshGroupList(group.organization_id);
      setTargetGroupId(result.data.id)

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create group")
    }
  }

  const handleMoveMembers = async () => {
    // rowSelection now contains member IDs as keys (not indexes)
    const selectedMemberIds = Object.keys(rowSelection);

    console.log('[DEBUG] handleMoveMembers called');
    console.log('[DEBUG] rowSelection:', rowSelection);
    console.log('[DEBUG] selectedMemberIds:', selectedMemberIds);
    console.log('[DEBUG] filteredAndSortedMembers:', filteredAndSortedMembers.map(m => ({ id: m.id, name: m.user?.first_name })));

    if (selectedMemberIds.length === 0) {
      toast.warning("Please select at least one member to move.");
      return;
    }

    if (!targetGroupId) {
      toast.warning("Please select a destination group.");
      return;
    }

    try {
      const result = await moveMembersToGroup(selectedMemberIds, targetGroupId);
      if (!result.success) throw new Error(result.message);

      toast.success(result.message);
      setRowSelection({}); // Reset selection

      // Refresh data with current pagination
      await fetchData();

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to move members');
    }
  };


  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 md:p-6 bg-white rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Move from
            <Badge variant="outline">{group?.name || '...'}</Badge>
            to
          </div>
          <Select value={targetGroupId} onValueChange={setTargetGroupId}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Select destination group" />
            </SelectTrigger>
            <SelectContent>
              <div
                className="flex items-center p-2 cursor-pointer hover:bg-accent"
                onMouseDown={(e) => {
                  e.preventDefault()
                  setIsCreateModalOpen(true)
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add New Group
              </div>
              {allGroups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button
                disabled={!targetGroupId || Object.keys(rowSelection).length === 0}
              >
                Move Selected ({Object.keys(rowSelection).length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Move</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to move {Object.keys(rowSelection).length} selected members to the "{allGroups.find(g => g.id === targetGroupId)?.name || ''}" group?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleMoveMembers}>Move</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-4">
          <Button variant="outline" size="sm" onClick={fetchData} className="whitespace-nowrap">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3 sm:gap-2 flex-wrap">
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-2">
          {loading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : (
            <DataTable
              table={table}
              server={{
                isLoading: loading,
                page: pagination.pageIndex + 1,
                totalPages: Math.max(1, Math.ceil(totalItems / pagination.pageSize)),
                from: totalItems > 0 ? (pagination.pageIndex * pagination.pageSize) + 1 : 0,
                to: Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalItems),
                total: totalItems,
                pageSize: pagination.pageSize,
                onPageSizeChange: (size) => setPagination({ pageIndex: 0, pageSize: size }),
              }}
            />
          )}
        </div>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateGroup)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., x_rpl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., X RPL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Rekayasa Perangkat Lunak" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Active</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
