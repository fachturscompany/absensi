"use client"

import React from "react"
import { MembersTable } from "@/components/tables/members-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { User, Users, Shield, Mail, Plus, FileDown, Loader2, Search, FileSpreadsheet, Minus, RefreshCw, Settings } from "lucide-react"
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
import { useQuery } from "@tanstack/react-query"
import { useDebounce } from "@/utils/debounce"
import { PaginationFooter } from "@/components/customs/pagination-footer"

import { computeName, computeGroupName, computeGender, computeNik, MemberLike } from "@/lib/members-mapping"

import { IOrganization_member } from "@/interface"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import { createInvitation } from "@/action/invitations"
import { getOrgRoles } from "@/lib/rbac"
import { useGroups } from "@/hooks/use-groups"
import { usePositions } from "@/hooks/use-positions"
import { useHydration } from "@/hooks/useHydration"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAllInvitations } from "@/action/invitations"
import { InvitationsTable } from "@/components/tables/invitations-table"


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
  getValue: (member: any) => string | number | boolean | null
}

const EXPORT_FIELDS: ExportFieldConfig[] = [
  {
    key: "nik",
    label: "NIK",
    getValue: (member: any) => member.user?.nik || member.biodata_nik || "-",
  },
  {
    key: "full_name",
    label: "Full Name",
    getValue: (member: any) => computeName(member as MemberLike),
  },
  {
    key: "nickname",
    label: "Nickname",
    getValue: (_member: any) => "-", // nickname tidak ada di user_profiles
  },
  {
    key: "nisn",
    label: "NISN",
    getValue: (member: any) => member.user?.nisn || "-",
  },
  {
    key: "gender",
    label: "Gender",
    getValue: (member: any) => computeGender(member as MemberLike),
  },
  {
    key: "email",
    label: "Email",
    getValue: (member: any) => {
      const email = member.email || member.user?.email || ""
      // Filter out dummy emails (ending with @dummy.local)
      if (email && email.toLowerCase().endsWith('@dummy.local')) {
        return "-"
      }
      return email || "-"
    },
  },
  {
    key: "phone",
    label: "Phone Number",
    getValue: (member: any) => member.user?.phone || member.user?.mobile || "-",
  },
  {
    key: "group",
    label: "Department / Group",
    getValue: (member: any) => computeGroupName(member as MemberLike),
  },
  {
    key: "position",
    label: "Position",
    getValue: (member: any) => member.position?.title || member.positions?.title || "-",
  },
  {
    key: "role",
    label: "Role",
    getValue: (member: any) => member.role?.name || "-",
  },
  {
    key: "status",
    label: "Status",
    getValue: (member: any) => (member.is_active ? "Active" : "Inactive"),
  },
  {
    key: "hire_date",
    label: "Hire Date",
    getValue: (member: any) => member.hire_date || "-",
  },
]

export default function MembersPage() {
  // const router = useRouter()
  const { isHydrated, organizationId } = useHydration()
  const queryClient = useQueryClient()
  const [exporting, setExporting] = React.useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false)

  const [activeTab, setActiveTab] = React.useState("members")
  const [submittingInvite, setSubmittingInvite] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [filterDepartment, setFilterDepartment] = React.useState<string>("all")
  const [inviteSearchQuery, setInviteSearchQuery] = React.useState<string>("")
  const [selectedMemberIds] = React.useState<string[]>([])
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false)
  const [selectedExportFields, setSelectedExportFields] = React.useState<string[]>(
    EXPORT_FIELDS.map((f) => f.key),
  )

  const [page, setPage] = React.useState<number>(1)
  const [pageSize, setPageSize] = React.useState<number>(10)
  const debouncedSearch = useDebounce(searchQuery, 400)

  interface MembersApiPage {
    success: boolean
    data: IOrganization_member[]
    pagination: { cursor: string | null; limit: number; hasMore: boolean; total: number }
  }

  const { data: pageData, isLoading: loading, isFetching, refetch } = useQuery<MembersApiPage>({
    queryKey: ["members", "paged", organizationId, debouncedSearch, filterDepartment, page, pageSize],
    queryFn: async ({ signal }) => {
      const url = new URL('/api/members', window.location.origin)
      url.searchParams.set('limit', String(pageSize))
      url.searchParams.set('active', 'all')
      url.searchParams.set('countMode', 'planned')
      url.searchParams.set('page', String(page))
      // Hanya pass organizationId jika ada; jika belum ada, biarkan API fallback ke org user
      if (organizationId) url.searchParams.set('organizationId', String(organizationId))
      if (debouncedSearch) url.searchParams.set('search', debouncedSearch)
      if (filterDepartment !== 'all') url.searchParams.set('departmentId', filterDepartment)
      const res = await fetch(url.toString(), { credentials: 'same-origin', signal })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || 'Failed to fetch members')
      return json as MembersApiPage
    },
    // RELAX: query jalan setelah hydration selesai
    enabled: isHydrated,
    staleTime: 60_000,
    gcTime: 300_000,
  })

  // Fetch invitations
  const { data: invitationsResult, refetch: refetchInvitations, isLoading: invitesLoading } = useQuery({
    queryKey: ["invitations", organizationId],
    queryFn: () => getAllInvitations(),
    enabled: isHydrated,
  })

  // Filter members client-side untuk search di semua fields
  // Ini memastikan search bekerja untuk semua field termasuk joined fields (nama, department)
  const members: IOrganization_member[] = React.useMemo(() => {
    const rawMembers = pageData?.data ?? []
    if (!searchQuery || !searchQuery.trim()) return rawMembers

    const searchTerm = searchQuery.toLowerCase().trim()
    return rawMembers.filter((member: any) => {
      const fullName = computeName(member as MemberLike).toLowerCase()
      const rawEmail = (member.email || member.user?.email || '').toLowerCase()
      // Filter out dummy emails from search
      const email = rawEmail && !rawEmail.endsWith('@dummy.local') ? rawEmail : ''
      const nik = (computeNik(member as MemberLike) || '').toLowerCase()
      const employeeId = ((member.employee_id || '') as string).toLowerCase()
      const departmentName = computeGroupName(member as MemberLike).toLowerCase()
      const positionName = (
        member.positions?.title ||
        (Array.isArray(member.positions) && member.positions[0]?.title) ||
        ''
      ).toLowerCase()
      const roleName = (member.role?.name || '').toLowerCase()

      return (
        fullName.includes(searchTerm) ||
        email.includes(searchTerm) ||
        nik.includes(searchTerm) ||
        employeeId.includes(searchTerm) ||
        departmentName.includes(searchTerm) ||
        positionName.includes(searchTerm) ||
        roleName.includes(searchTerm)
      )
    })
  }, [pageData?.data, searchQuery])

  const total: number = pageData?.pagination?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / (pageSize || 1)))

  // Debug: Log members data to check departments
  React.useEffect(() => {
    if (members && members.length > 0) {
      console.log('[MEMBERS UI] Total members:', members.length)

      // Check all members for department_id
      const membersWithDeptId = members.filter((m: any) => m.department_id != null && m.department_id !== undefined)
      console.log('[MEMBERS UI] Members with department_id:', membersWithDeptId.length)

      if (membersWithDeptId.length > 0 && membersWithDeptId[0]) {
        const sample = membersWithDeptId[0] as any;
        console.log('[MEMBERS UI] Sample member with department_id:', {
          id: sample.id,
          department_id: sample.department_id,
          department_id_type: typeof sample.department_id,
          departments: sample.departments,
          departments_type: typeof sample.departments,
          is_departments_array: Array.isArray(sample.departments),
          biodata_nik: sample.biodata_nik
        })
      }

      const membersWithDept = members.filter((m: any) => {
        if (!m.departments) return false
        if (Array.isArray(m.departments) && m.departments.length > 0 && m.departments[0]?.name) return true
        if (typeof m.departments === 'object' && m.departments.name) return true
        return false
      })
      const membersWithoutDept = members.filter((m: any) => {
        if (!m.department_id) return false
        const hasValidDept = m.departments &&
          ((typeof m.departments === 'object' && !Array.isArray(m.departments) && m.departments.name) ||
            (Array.isArray(m.departments) && m.departments.length > 0 && m.departments[0]?.name))
        return !hasValidDept
      })

      console.log('[MEMBERS UI] Members with departments:', membersWithDept.length)
      console.log('[MEMBERS UI] Members without departments (but have department_id):', membersWithoutDept.length)

      if (membersWithoutDept.length > 0 && membersWithoutDept[0]) {
        const sample = membersWithoutDept[0] as any;
        console.log('[MEMBERS UI] Sample member without departments:', {
          id: sample.id,
          department_id: sample.department_id,
          department_id_type: typeof sample.department_id,
          departments: sample.departments,
          departments_type: typeof sample.departments,
          is_departments_array: Array.isArray(sample.departments),
          biodata_nik: sample.biodata_nik
        })
      }
      if (membersWithDept.length > 0 && membersWithDept[0]) {
        const sampleMember = membersWithDept[0];
        console.log('[MEMBERS UI] Sample member with departments:', {
          id: sampleMember?.id,
          department_id: sampleMember?.department_id,
          departments: sampleMember?.departments,
          departments_name: sampleMember?.departments?.name || (Array.isArray(sampleMember?.departments) ? sampleMember?.departments[0]?.name : null),
          departments_keys: sampleMember?.departments ? Object.keys(sampleMember.departments) : null
        })
      }

      // Log first member structure for debugging
      if (members.length > 0) {
        console.log('[MEMBERS UI] First member full structure:', members[0])
      }
    }
  }, [members])

  React.useEffect(() => {
    setPage(1)
  }, [searchQuery, filterDepartment])

  //komentar
  // Fetch data for invite form
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["org-roles"],
    queryFn: getOrgRoles,
    enabled: inviteDialogOpen,
  })

  const { data: departments = [], isLoading: deptLoading } = useGroups({ enabled: isHydrated })
  const { data: positions = [], isLoading: posLoading } = usePositions({ enabled: inviteDialogOpen })

  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role_id: "",
      department_id: "",
      position_id: "",
      message: "",
    },
  })

  const isLoadingInviteData = rolesLoading || deptLoading || posLoading


  // Monitor organization changes
  React.useEffect(() => {
    if (organizationId) {
      console.log('[MEMBERS] Organization changed to:', organizationId)
    }
  }, [organizationId])

  // Initial fetch handled by useInfiniteQuery
  async function onSubmitInvite(values: InviteFormValues) {
    try {
      setSubmittingInvite(true)

      const result = await createInvitation({
        email: values.email,
        role_id: values.role_id || undefined,
        department_id: values.department_id || undefined,
        position_id: values.position_id || undefined,
        message: values.message || undefined,
      })

      if (result.success) {
        toast.success("Invitation sent successfully via email!")
        await queryClient.invalidateQueries({ queryKey: ['members', 'paged', organizationId, searchQuery, filterDepartment, page, pageSize] })
        setInviteDialogOpen(false)
        inviteForm.reset()
        await refetch()
      } else {
        toast.error(result.message || "Failed to send invitation")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setSubmittingInvite(false)
    }
  }

  const handleRefresh = async () => {
    try {
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith('members:')) {
            localStorage.removeItem(key)
          }
        })
      }
      // Force refresh data
      await refetch()
      toast.success("Data has been refreshed!")
      await queryClient.invalidateQueries({ queryKey: ['members', 'paged', organizationId, searchQuery, filterDepartment, page, pageSize] })
    } catch (error) {
      toast.error("Failed to refresh data")
    }
  }

  const handleExportMembers = async () => {
    try {
      const hasSelection = selectedMemberIds.length > 0
      const exportSource = hasSelection
        ? members.filter((m) => selectedMemberIds.includes(String(m.id)))
        : members

      if (!exportSource.length) {
        toast.warning("Tidak ada data member untuk diekspor")
        return
      }

      if (!selectedExportFields.length) {
        toast.error("Pilih minimal satu kolom untuk diekspor")
        return
      }

      setExporting(true)
      const XLSX = await import("xlsx")

      const rows = exportSource.map((member: any) => {
        const row: Record<string, any> = {}
        // Selalu buat semua kolom, tapi isi hanya yang dipilih.
        EXPORT_FIELDS.forEach((field) => {
          if (selectedExportFields.includes(field.key)) {
            row[field.label] = field.getValue(member)
          } else {
            row[field.label] = "" // kolom tetap ada tapi datanya kosong
          }
        })
        return row
      })

      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Members")

      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `members-${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success("Succesfully exported members")
      await queryClient.invalidateQueries({ queryKey: ['members'] })
    } catch (error) {
      console.error("Export members error:", error)
      toast.error("Gagal mengekspor data members")
    } finally {
      setExporting(false)
    }
  }


  const handleDialogOpenChange = (open: boolean) => {
    setInviteDialogOpen(open)
    if (!open) {
      inviteForm.reset()
    }
  }

  return (
    <div className="px-6 pb-6 space-y-6 w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <div className="space-y-4">
          {/* Header Area */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold  capitalize">
                {activeTab === 'invites' ? 'Invites' : 'Members'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/members/onboarding"
                className="flex items-center text-sm font-medium text-muted-foreground"
              >
                <Users className="w-4 h-4 mr-2" />
                Onboarding status
              </Link>
              {activeTab === 'invites' && (
                <Link href="/settings" className="text-sm font-medium flex items-center gap-1">
                  <Settings className="w-4 h-4" /> Settings
                </Link>
              )}
            </div>
          </div>

          {/* Tabs List */}
          <TabsList className="bg-transparent p-0 border-b w-full justify-start rounded-none h-auto">
            <TabsTrigger
              value="members"
              className="rounded-none border-b-2 border-transparent px-4 py-2 uppercase text-xs font-semibold"
            >
              MEMBERS ({total})
            </TabsTrigger>
            <TabsTrigger
              value="invites"
              className="rounded-none border-b-2 border-transparent px-4 py-2 uppercase text-xs font-semibold"
            >
              INVITES ({invitationsResult?.data?.length || 0})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="members" className="mt-6 space-y-4">
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

              {/* Department Filter */}
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-full sm:w-[220px] h-[44px]! px-3 py-2 flex items-center">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2 justify-start xl:justify-start items-center order-2 xl:oeder-1">
              <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loading || exporting}
                    className="h-11"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Export Members</DialogTitle>
                    <DialogDescription>
                      Choose the fields you want to include in the Excel file. If no members are selected in the table, all members will be exported.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="border rounded-lg">
                      <div className="px-3 py-2 border-b bg-muted/50 text-sm font-semibold">
                        Available Fields
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        <ul className="divide-y">
                          {EXPORT_FIELDS.filter((f) => !selectedExportFields.includes(f.key)).map(
                            (field) => (
                              <li
                                key={field.key}
                                className="flex items-center justify-between px-3 py-2 text-sm"
                              >
                                <span>{field.label}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    setSelectedExportFields((prev) => [...prev, field.key])
                                  }
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    </div>
                    <div className="border rounded-lg">
                      <div className="px-3 py-2 border-b bg-muted/50 text-sm font-semibold">
                        Columns to export
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {selectedExportFields.length === 0 ? (
                          <p className="px-3 py-4 text-sm text-muted-foreground">
                            No columns have been selected. Add from the list on the left.
                          </p>
                        ) : (
                          <ul className="divide-y">
                            {selectedExportFields.map((key) => {
                              const field = EXPORT_FIELDS.find((f) => f.key === key)
                              if (!field) return null
                              return (
                                <li
                                  key={field.key}
                                  className="flex items-center justify-between px-3 py-2 text-sm"
                                >
                                  <span>{field.label}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      setSelectedExportFields((prev) =>
                                        prev.filter((k) => k !== field.key),
                                      )
                                    }
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {selectedMemberIds.length > 0
                        ? `${selectedMemberIds.length} The selected member will be exported.`
                        : `No members are selected in the table, all ${members.length} members will be exported.`}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setExportDialogOpen(false)}
                        disabled={exporting}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={async () => {
                          await handleExportMembers()
                          setExportDialogOpen(false)
                        }}
                        disabled={exporting}
                      >
                        {exporting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Export
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="h-11"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <Button
                asChild
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoadingInviteData}
                className="h-11"
              >
                <Link href="/members/import-simple" prefetch={false}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Import
                </Link>
              </Button>

              <Button
                size="sm"
                className="h-11 px-4 min-w-[100px]"
                onClick={() => setInviteDialogOpen(true)}
              >
                Invite <Plus className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            {isFetching ? (
              <div>
                <TableSkeleton />
              </div>
            ) : members.length === 0 ? (
              <div className="py-20">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <User className="h-14 w-14 text-muted-foreground mx-auto" />
                    </EmptyMedia>
                    <EmptyTitle>No members yet</EmptyTitle>
                    <EmptyDescription>
                      {searchQuery
                        ? `No members found matching "${searchQuery}"`
                        : "There are no members for this organization. Use the \"Invite Member\" button to add one."}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </div>
            ) : (
              <div className="min-w-full overflow-x-auto relative">
                {isFetching && (
                  <div className="justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                <MembersTable
                  members={members}
                  isLoading={false}
                  onDelete={() => { refetch() }}
                  showPagination={false}
                />
              </div>
            )}
          </div>

          {/* Footer Pagination (server-based) */}
          <PaginationFooter
            page={page}
            totalPages={totalPages || 1}
            onPageChange={(p: number) => setPage(Math.max(1, Math.min(p, Math.max(1, totalPages))))}
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
          {/* Invites Toolbar */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start lg:items-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none"/>
              <Input
                placeholder="Search invites"
                value={inviteSearchQuery}
                onChange={(e) => setInviteSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-white w-full rounded-full border-gray-200 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-6">

              <Button
                className="bg-black hover:bg-gray-800 text-white font-medium px-6 h-10 shadow-sm"
                onClick={() => setInviteDialogOpen(true)}
              >
                Invite member
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
            <InvitationsTable
              invitations={invitationsResult?.data?.filter((inv: any) =>
                inviteSearchQuery ?
                  inv.email?.toLowerCase().includes(inviteSearchQuery.toLowerCase()) :
                  true
              ) || []}
              isLoading={invitesLoading}
              onUpdate={refetchInvitations}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Global Dialogs */}


      <Dialog open={inviteDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-[500px]" aria-describedby="invite-description">
          <DialogHeader>
            <DialogTitle>Invite New Member</DialogTitle>
            <DialogDescription id="invite-description">
              Send an email invitation to add a new member to your organization
            </DialogDescription>
          </DialogHeader>
          <Form {...inviteForm}>
            <form onSubmit={inviteForm.handleSubmit(onSubmitInvite)} className="space-y-4">
              <FormField
                control={inviteForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="john.doe@example.com"
                          className="ps-10 pl-10"
                          {...field}
                          disabled={submittingInvite}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Role Field */}
              <FormField
                control={inviteForm.control}
                name="role_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={submittingInvite || isLoadingInviteData}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role: any) => (
                          <SelectItem key={role.id} value={String(role.id)}>
                            <div className="flex items-center gap-2">
                              {role.code === "A001" ? (
                                <Shield className="w-3 h-3" />
                              ) : (
                                <User className="w-3 h-3" />
                              )}
                              {role.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Department Field */}
              <FormField
                control={inviteForm.control}
                name="department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={submittingInvite || isLoadingInviteData}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept: any) => (
                          <SelectItem key={dept.id} value={String(dept.id)}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Position Field */}
              <FormField
                control={inviteForm.control}
                name="position_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={submittingInvite || isLoadingInviteData}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {positions.map((pos: any) => (
                          <SelectItem key={pos.id} value={String(pos.id)}>
                            {pos.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Message Field */}
              <FormField
                control={inviteForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Welcome Message (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Welcome to the team!"
                        className="resize-none"
                        rows={3}
                        {...field}
                        disabled={submittingInvite}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={submittingInvite || isLoadingInviteData}
                className="w-full"
              >
                {submittingInvite ? "Sending..." : "Send Invitation"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    </div >
  )
}
