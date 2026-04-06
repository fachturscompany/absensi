"use client"

import React, { useState, useEffect, useMemo } from "react"
import { MembersTable } from "@/components/tables/members-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { 
  Users, Plus, Search, RefreshCw, FileDown, FileSpreadsheet, Minus, Loader2, Mail, Shield, User, Settings
} from "lucide-react"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useDebounce } from "@/utils/debounce"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { cn } from "@/lib/utils"

import { computeName, computeGroupName, computeGender, MemberLike, computeNik } from "@/lib/members-mapping"
import { IOrganization_member, IDepartments, IPositions, IRole, IMemberInvitation, IUser } from "@/interface"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import { createInvitation, getAllInvitations } from "@/action/invitations"
import { getOrgRoles } from "@/lib/rbac"
import { useGroups } from "@/hooks/use-groups"
import { usePositions } from "@/hooks/use-positions"
import { useHydration } from "@/hooks/useHydration"
import { useUserStore, UserOrganization } from "@/store/user-store"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InvitationsTable } from "@/components/tables/invitations-table"
import { JoinRequestsTab } from "@/components/members/JoinRequestsTab"
import { getJoinRequests } from "@/action/join-organization"

// ─── LOCAL TYPE EXTENSIONS ──────────────────────────────────────────────────
// Menambahkan properti yang ada di payload API tapi belum ada di interface.ts
interface IUserExtended extends IUser {
  nisn?: string;
}

interface IMemberExtended extends IOrganization_member {
  user?: IUserExtended;
}

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role_id: z.string().optional(),
  department_id: z.string().optional(),
  position_id: z.string().optional(),
  message: z.string().max(500, "Message too long (max 500 characters)").optional(),
})

type InviteFormValues = z.infer<typeof inviteSchema>

type ExportFieldConfig = {
  key: string
  label: string
  getValue: (member: IMemberExtended) => string | number | boolean | null
}

const EXPORT_FIELDS: ExportFieldConfig[] = [
  { key: "nik", label: "NIK", getValue: (member) => computeNik(member as unknown as MemberLike) },
  { key: "full_name", label: "Full Name", getValue: (member) => computeName(member as unknown as MemberLike) },
  { key: "nickname", label: "Nickname", getValue: () => "-" },
  { key: "nisn", label: "NISN", getValue: (member) => member.user?.nisn || "-" },
  { key: "gender", label: "Gender", getValue: (member) => computeGender(member as unknown as MemberLike) },
  { key: "email", label: "Email", getValue: (member) => {
      const email = member.user?.email || ""
      if (email && email.toLowerCase().endsWith('@dummy.local')) return "-"
      return email || "-"
    },
  },
  { key: "phone", label: "Phone Number", getValue: (member) => member.user?.phone || member.user?.mobile || "-" },
  { key: "group", label: "Department / Group", getValue: (member) => computeGroupName(member as unknown as MemberLike) },
  { key: "position", label: "Position", getValue: (member) => member.positions?.title || "-" },
  { key: "role", label: "Role", getValue: (member) => member.role?.name || "-" },
  { key: "status", label: "Status", getValue: (member) => (member.is_active ? "Active" : "Inactive") },
  { key: "hire_date", label: "Hire Date", getValue: (member) => member.hire_date || "-" },
]

interface MembersApiPage {
  success: boolean
  data: IMemberExtended[]
  pagination: { cursor: string | null; limit: number; hasMore: boolean; total: number }
}

export default function MembersPage() {
  const { isHydrated, organizationId } = useHydration()
  const { userOrganizations } = useUserStore()
  const queryClient = useQueryClient()

  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterDepartment, setFilterDepartment] = useState<string>("all")
  const debouncedSearch = useDebounce(searchQuery, 400)

  const [activeTab, setActiveTab] = useState("members")
  const [exporting, setExporting] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [submittingInvite, setSubmittingInvite] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [selectedExportFields, setSelectedExportFields] = useState<string[]>(EXPORT_FIELDS.map((f) => f.key))
  const [inviteSearchQuery, setInviteSearchQuery] = useState<string>("")

  const currentOrg = useMemo<UserOrganization | undefined>(() => {
    if (!isHydrated || !organizationId) return undefined
    return userOrganizations?.find((org) => Number(org.organization_id) === Number(organizationId))
  }, [isHydrated, organizationId, userOrganizations])

  const isOwner = useMemo(() => {
    return currentOrg?.roles?.some((r) => r.code === "owner") || false
  }, [currentOrg])

  useEffect(() => { setPage(1) }, [debouncedSearch, filterDepartment])

  const { data: pageData, isLoading: loading, isFetching, refetch } = useQuery<MembersApiPage>({
    queryKey: ["members", "paged", organizationId, debouncedSearch, filterDepartment, page, pageSize],
    queryFn: async ({ signal }) => {
      const url = new URL('/api/members', window.location.origin)
      url.searchParams.set('limit', String(pageSize))
      url.searchParams.set('page', String(page))
      if (organizationId) url.searchParams.set('organizationId', String(organizationId))
      if (debouncedSearch) url.searchParams.set('search', debouncedSearch)
      if (filterDepartment !== 'all') url.searchParams.set('departmentId', filterDepartment)
      const res = await fetch(url.toString(), { credentials: 'same-origin', signal })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || 'Failed to fetch members')
      return json as MembersApiPage
    },
    enabled: isHydrated && !!organizationId,
  })

  const members = pageData?.data || []
  const total = pageData?.pagination?.total || 0
  const totalPages = Math.ceil(total / pageSize) || 1

  const { data: invitationsResult, refetch: refetchInvitations, isLoading: invitesLoading } = useQuery<{ success: boolean; data: IMemberInvitation[] }>({
    queryKey: ["invitations", organizationId],
    queryFn: () => getAllInvitations(),
    enabled: isHydrated,
  })

  const { data: joinRequestsResult } = useQuery({
    queryKey: ["join-requests", organizationId],
    queryFn: () => getJoinRequests(Number(organizationId)),
    enabled: isHydrated && isOwner,
  })
  const pendingJoinCount = joinRequestsResult?.data?.length ?? 0

  const { data: roles = [], isLoading: rolesLoading } = useQuery<IRole[]>({
    queryKey: ["org-roles"],
    queryFn: getOrgRoles,
    enabled: inviteDialogOpen,
  })
  
  const { data: departments = [] } = useGroups({ enabled: isHydrated }) as { data: IDepartments[] | undefined }
  const { data: positions = [] } = usePositions({ enabled: inviteDialogOpen }) as { data: IPositions[] | undefined }

  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role_id: "", department_id: "", position_id: "", message: "" },
  })

  const handleRefresh = async () => {
    await refetch()
    toast.success("Data refreshed!")
    queryClient.invalidateQueries({ queryKey: ['members'] })
  }

  const handleExportMembers = async () => {
    if (!members.length) {
      toast.warning("No data to export")
      return
    }

    try {
      setExporting(true)
      const XLSX = await import("xlsx")
      const rows = members.map((member) => {
        const row: Record<string, string | number | boolean | null> = {}
        EXPORT_FIELDS.forEach((field) => {
          if (selectedExportFields.includes(field.key)) row[field.label] = field.getValue(member)
        })
        return row
      })
      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Members")
      XLSX.writeFile(workbook, `members-${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success("Exported successfully")
    } catch {
      toast.error("Export failed")
    } finally {
      setExporting(false)
      setExportDialogOpen(false)
    }
  }

  const onSubmitInvite = async (values: InviteFormValues) => {
    setSubmittingInvite(true)
    const result = await createInvitation(values)
    if (result.success) {
      toast.success("Invitation sent!")
      setInviteDialogOpen(false)
      inviteForm.reset()
      refetch()
    } else {
      toast.error(result.message)
    }
    setSubmittingInvite(false)
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold capitalize">
            {activeTab === 'invites' ? 'Invites' : 'Members'}
          </h1>
          <div className="flex items-center gap-4">
            <Link href="/members/onboarding" className="flex items-center text-sm font-medium text-muted-foreground">
              <Users className="w-4 h-4 mr-2" /> Onboarding status
            </Link>
            {activeTab === 'invites' && (
              <Link href="/settings" className="text-sm font-medium flex items-center gap-1">
                <Settings className="w-4 h-4" /> Settings
              </Link>
            )}
          </div>
        </div>

        <TabsList className="bg-transparent p-0 border-b w-full justify-start rounded-none h-auto">
          <TabsTrigger value="members" className="rounded-none border-b-2 border-transparent px-4 py-2 uppercase text-xs font-semibold">
            MEMBERS ({total})
          </TabsTrigger>
          <TabsTrigger value="invites" className="rounded-none border-b-2 border-transparent px-4 py-2 uppercase text-xs font-semibold">
            INVITES ({invitationsResult?.data?.length || 0})
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="join-requests" className="rounded-none border-b-2 border-transparent px-4 py-2 uppercase text-xs font-semibold">
              JOIN REQUESTS {pendingJoinCount > 0 && <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold">{pendingJoinCount}</span>}
            </TabsTrigger>
          )}
        </TabsList>
      </div>

      <div className="mt-4">
        <TabsContent value="members" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 pl-10 bg-background"
                />
              </div>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-full sm:w-[220px] h-11"><SelectValue placeholder="All Groups" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {departments?.map((dept) => <SelectItem key={dept.id} value={String(dept.id)}>{dept.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2 justify-start xl:justify-end items-center">
              <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={loading || exporting} className="h-11">
                    <FileDown className="mr-2 h-4 w-4" /> Export
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader><DialogTitle>Export Members</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="border rounded-lg p-2 max-h-64 overflow-y-auto">
                      <p className="text-xs font-bold mb-2 px-1 text-muted-foreground">Available Fields</p>
                      {EXPORT_FIELDS.filter(f => !selectedExportFields.includes(f.key)).map(field => (
                        <div key={field.key} className="flex justify-between items-center p-1 text-sm">
                          <span>{field.label}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedExportFields(p => [...p, field.key])}><Plus size={14}/></Button>
                        </div>
                      ))}
                    </div>
                    <div className="border rounded-lg p-2 max-h-64 overflow-y-auto">
                      <p className="text-xs font-bold mb-2 px-1 text-muted-foreground">Columns to Export</p>
                      {selectedExportFields.map(key => {
                        const f = EXPORT_FIELDS.find(x => x.key === key);
                        return (
                          <div key={key} className="flex justify-between items-center p-1 text-sm">
                            <span>{f?.label}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedExportFields(p => p.filter(k => k !== key))}><Minus size={14}/></Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button onClick={handleExportMembers} disabled={exporting} className="w-full sm:w-auto">
                      {exporting ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <FileSpreadsheet className="mr-2 h-4 w-4"/>} 
                      Download Excel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="h-11">
                <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} /> Refresh
              </Button>

              <Button asChild variant="outline" size="sm" className="h-11">
                <Link href="/members/import-simple"><FileSpreadsheet className="mr-2 h-4 w-4" /> Import</Link>
              </Button>

              <Button size="sm" className="h-11 px-4 min-w-[100px]" onClick={() => setInviteDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Invite
              </Button>
            </div>
          </div>

          <div>
            {loading ? <TableSkeleton /> : (
              members.length === 0 ? (
                <div className="py-20">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><User className="h-14 w-14 text-muted-foreground mx-auto" /></EmptyMedia>
                      <EmptyTitle>No members yet</EmptyTitle>
                      <EmptyDescription>{searchQuery ? `No matching "${searchQuery}"` : "Add members using the invite button."}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              ) : (
                <div className="min-w-full overflow-x-auto relative">
                  <MembersTable members={members} isLoading={false} onDelete={() => refetch()} />
                </div>
              )
            )}
          </div>

          <PaginationFooter
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            isLoading={loading || isFetching}
            from={total > 0 ? (page - 1) * pageSize + 1 : 0}
            to={Math.min(page * pageSize, total)}
            total={total}
            pageSize={pageSize}
            onPageSizeChange={(size: number) => { setPageSize(size); setPage(1); }}
            pageSizeOptions={[10, 50, 100]}
          />
        </TabsContent>

        <TabsContent value="invites" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none"/>
              <Input placeholder="Search invites" value={inviteSearchQuery} onChange={(e) => setInviteSearchQuery(e.target.value)} className="h-11 pl-10 bg-background" />
            </div>
            <div className="flex justify-end"><Button size="sm" className="h-11 px-4" onClick={() => setInviteDialogOpen(true)}><Plus size={16} className="mr-2"/> Invite</Button></div>
          </div>
          <InvitationsTable 
            invitations={invitationsResult?.data?.filter((inv: IMemberInvitation) => 
              !inviteSearchQuery || inv.email?.toLowerCase().includes(inviteSearchQuery.toLowerCase())
            ) || []} 
            isLoading={invitesLoading} 
            onUpdate={refetchInvitations} 
          />
        </TabsContent>

        {isOwner && (
          <TabsContent value="join-requests" className="mt-6">
            <JoinRequestsTab organizationId={organizationId} />
          </TabsContent>
        )}
      </div>
    </Tabs>

    <Dialog open={inviteDialogOpen} onOpenChange={(o) => { setInviteDialogOpen(o); if(!o) inviteForm.reset(); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Invite New Member</DialogTitle><DialogDescription>Send email invitation.</DialogDescription></DialogHeader>
          <Form {...inviteForm}>
            <form onSubmit={inviteForm.handleSubmit(onSubmitInvite)} className="space-y-4">
              <FormField control={inviteForm.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email *</FormLabel><FormControl><div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-10" placeholder="email@example.com" {...field} disabled={submittingInvite} /></div></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={inviteForm.control} name="role_id" render={({ field }) => (
                <FormItem><FormLabel>Role (Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={submittingInvite || rolesLoading}><FormControl><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger></FormControl><SelectContent>{roles.map((r) => <SelectItem key={r.id} value={String(r.id)}><div className="flex items-center gap-2">{r.code === "A001" ? <Shield size={12}/> : <User size={12}/>} {r.name}</div></SelectItem>)}</SelectContent></Select></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={inviteForm.control} name="department_id" render={({ field }) => (
                  <FormItem><FormLabel>Dept (Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={submittingInvite}><FormControl><SelectTrigger><SelectValue placeholder="Dept" /></SelectTrigger></FormControl><SelectContent>{departments?.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent></Select></FormItem>
                )} />
                <FormField control={inviteForm.control} name="position_id" render={({ field }) => (
                  <FormItem><FormLabel>Pos (Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={submittingInvite}><FormControl><SelectTrigger><SelectValue placeholder="Pos" /></SelectTrigger></FormControl><SelectContent>{positions?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}</SelectContent></Select></FormItem>
                )} />
              </div>
              <FormField control={inviteForm.control} name="message" render={({ field }) => (
                <FormItem><FormLabel>Message (Optional)</FormLabel><FormControl><Textarea placeholder="Welcome to the team!" className="resize-none" rows={3} {...field} disabled={submittingInvite} /></FormControl></FormItem>
              )} />
              <Button type="submit" disabled={submittingInvite} className="w-full">{submittingInvite ? "Sending..." : "Send Invitation"}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}