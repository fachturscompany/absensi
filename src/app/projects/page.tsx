"use client"

import React, { useMemo, useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search, Pencil, Plus, Upload, X, Trash2, Archive,
  ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal,
  Lock, CalendarClock,
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuCheckboxItem, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import AddProjectDialog from "@/components/projects/dialogs/add-project"
import EditProjectDialog from "@/components/projects/dialogs/edit-project"
import TransferProjectDialog from "@/components/projects/dialogs/transfer-project"
import {
  getAllProjects, createProject, updateProject, deleteProject,
  archiveProject, unarchiveProject, getSimpleMembersForDropdown,
} from "@/action/projects"
import { getTeams } from "@/action/teams"
import { useOrgStore } from "@/store/org-store"
import type { ITeams, ISimpleMember, Project, NewProjectForm } from "@/interface"
import { PaginationFooter } from "@/components/customs/pagination-footer"

// ─── Admin role codes ─────────────────────────────────────────────────────────
// Sesuaikan dengan role codes yang ada di sistem
const ADMIN_ROLE_CODES = ["admin", "owner", "super_admin", "administrator"]

// ─── Extended UI model ────────────────────────────────────────────────────────

interface ProjectRow extends Project {
  description: string | null
  priority: "high" | "medium" | "low" | null
  lifecycleStatus: string
  isBillable: boolean
  budgetAmount: number | null
  currencyCode: string
  startDate: string | null   // ISO date string "YYYY-MM-DD"
  endDate: string | null
  createdAt: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LIFECYCLE_OPTIONS = ["active", "on_hold", "completed", "archived"] as const
const PRIORITY_OPTIONS = ["high", "medium", "low"] as const

type SortField = "name" | "priority" | "lifecycleStatus" | "budgetAmount" | "startDate" | "endDate" | "createdAt"
type SortDir = "asc" | "desc"

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if today is before start_date (project hasn't started yet) */
function isBeforeStartDate(startDate: string | null): boolean {
  if (!startDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  return today < start
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

// ─── Badge components ─────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority) return <span className="text-muted-foreground text-xs">—</span>
  const styles: Record<string, string> = {
    high: "bg-red-50 text-red-700 border-red-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }
  return (
    <Badge variant="outline" className={`text-xs font-medium capitalize ${styles[priority] ?? ""}`}>
      {priority}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    on_hold: "bg-amber-50 text-amber-700 border-amber-200",
    completed: "bg-blue-50 text-blue-700 border-blue-200",
    archived: "bg-muted text-muted-foreground border-border",
    deleted: "bg-red-50 text-red-700 border-red-200",
  }
  const labels: Record<string, string> = {
    active: "Active", on_hold: "On Hold", completed: "Completed",
    archived: "Archived", deleted: "Deleted",
  }
  return (
    <Badge variant="outline" className={`text-xs font-medium ${styles[status] ?? ""}`}>
      {labels[status] ?? status}
    </Badge>
  )
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapProjectData(p: any): ProjectRow {
  const memberMap = new Map<string, { id: string; name: string; avatarUrl: string | null }>()
  p.team_projects?.forEach((tp: any) => {
    tp.teams?.team_members?.forEach((tm: any) => {
      const profile = tm.organization_members?.user
      if (profile) {
        const uid = profile.id ?? tm.organization_members?.user_id
        if (uid && !memberMap.has(uid)) {
          const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Unknown"
          memberMap.set(uid, { id: uid, name: fullName, avatarUrl: profile.profile_photo_url })
        }
      }
    })
  })

  const tNames = p.team_projects
    ?.map((tp: any) => tp.teams?.name)
    .filter((n: any): n is string => Boolean(n)) ?? []

  const budgetAmount = p.budget_amount ? Number(p.budget_amount) : null
  const currencyCode = p.currency_code?.trim() || "USD"

  let budgetLabel = "No budget"
  if (budgetAmount && budgetAmount > 0) {
    budgetLabel = `${currencyCode} ${budgetAmount.toLocaleString()}`
  } else if (p.budget_hours && Number(p.budget_hours) > 0) {
    budgetLabel = `${Number(p.budget_hours)} hours`
  }

  return {
    id: String(p.id),
    name: p.name,
    description: p.description ?? null,
    priority: p.priority ?? null,
    lifecycleStatus: p.lifecycle_status ?? "active",
    isBillable: p.is_billable ?? true,
    budgetAmount,
    currencyCode,
    startDate: p.start_date ?? null,
    endDate: p.end_date ?? null,
    createdAt: p.created_at ?? null,
    teams: tNames,
    members: Array.from(memberMap.values()),
    taskCount: p.tasks?.[0]?.count ?? 0,
    budgetLabel,
    memberLimitLabel: p.metadata?.memberLimits
      ? `${p.metadata.memberLimits.length} limits`
      : "0 limits",
    archived: p.lifecycle_status === "archived",
  }
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
  return dir === "asc"
    ? <ArrowUp className="h-3.5 w-3.5 text-foreground" />
    : <ArrowDown className="h-3.5 w-3.5 text-foreground" />
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const router = useRouter()
  const { organizationId, currentRole } = useOrgStore()

  // Detect admin/owner dari currentRole
  const isAdmin = Boolean(currentRole && ADMIN_ROLE_CODES.includes(currentRole.toLowerCase()))

  const [activeTab, setActiveTab] = useState<"active" | "archived">("active")
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [data, setData] = useState<ProjectRow[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [realMembers, setRealMembers] = useState<ISimpleMember[]>([])
  const [teams, setTeams] = useState<ITeams[]>([])

  // ── Filters ──────────────────────────────────────────────────────────────
  const [filterStatus, setFilterStatus] = useState<string[]>([])
  const [filterPriority, setFilterPriority] = useState<string[]>([])
  const [filterBillable, setFilterBillable] = useState<"all" | "billable" | "non_billable">("all")

  // ── Sort ─────────────────────────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const fetchProjects = async () => {
    setIsLoading(true)
    setFetchError(null)
    if (!organizationId) {
      setFetchError("No organization active")
      setData([])
      setIsLoading(false)
      return
    }
    const res = await getAllProjects(organizationId)
    if (res.success && res.data) {
      setData(res.data.map(mapProjectData))
    } else {
      setFetchError(res.message ?? "Failed to fetch projects")
    }
    setIsLoading(false)
  }

  const dropdownsFetched = useRef(false)
  const fetchDropdowns = React.useCallback(async () => {
    if (!organizationId || dropdownsFetched.current) return
    dropdownsFetched.current = true
    const [membersRes, teamsRes] = await Promise.all([
      getSimpleMembersForDropdown(organizationId),
      getTeams(Number(organizationId)),
    ])
    if (membersRes.success) setRealMembers(membersRes.data)
    if (teamsRes.success) setTeams(teamsRes.data)
  }, [organizationId])

  React.useEffect(() => { dropdownsFetched.current = false }, [organizationId])
  React.useEffect(() => {
    fetchProjects()
    const t = setTimeout(() => fetchDropdowns(), 200)
    return () => clearTimeout(t)
  }, [organizationId])

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ProjectRow | null>(null)
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [archiveTargets, setArchiveTargets] = useState<string[]>([])
  const [editing, setEditing] = useState<ProjectRow | null>(null)
  const [editTab, setEditTab] = useState<"general" | "members" | "budget" | "teams">("general")
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchBillable, setBatchBillable] = useState(true)
  const [batchDisableActivity, setBatchDisableActivity] = useState(false)
  const [batchAllowTracking, setBatchAllowTracking] = useState(true)
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferProject, setTransferProject] = useState<ProjectRow | null>(null)

  const today = (new Date().toISOString().split("T")[0] || "") as string

  const [form, setForm] = useState<NewProjectForm>({
    names: "", billable: true, disableActivity: false, allowTracking: true,
    disableIdle: false, members: [], teams: [], budgetType: "", budgetBasedOn: "",
    budgetCost: "", budgetNotifyMembers: false, budgetNotifyAt: "80",
    budgetNotifyWho: "", startDate: today, budgetStopTimers: false, budgetStopAt: "100",
    budgetResets: "never", budgetIncludeNonBillable: false,
    memberLimits: [{ members: [], type: "", basedOn: "", cost: "", resets: "never", startDate: "" }],
    memberLimitNotifyAt: "80", memberLimitNotifyMembers: false,
  })

  // ── Sort handler ──────────────────────────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortDir("asc") }
    setCurrentPage(1)
  }

  const activeFilterCount =
    filterStatus.length + filterPriority.length + (filterBillable !== "all" ? 1 : 0)

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = data.filter(p => activeTab === "active" ? !p.archived : p.archived)
    const q = search.trim().toLowerCase()
    if (q) result = result.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q)
    )
    if (filterStatus.length > 0)
      result = result.filter(p => filterStatus.includes(p.lifecycleStatus))
    if (filterPriority.length > 0)
      result = result.filter(p => p.priority && filterPriority.includes(p.priority))
    if (filterBillable === "billable") result = result.filter(p => p.isBillable)
    if (filterBillable === "non_billable") result = result.filter(p => !p.isBillable)

    result = [...result].sort((a, b) => {
      let cmp = 0
      if (sortField === "name") cmp = a.name.localeCompare(b.name)
      else if (sortField === "priority")
        cmp = (PRIORITY_ORDER[a.priority ?? ""] ?? 99) - (PRIORITY_ORDER[b.priority ?? ""] ?? 99)
      else if (sortField === "lifecycleStatus") cmp = a.lifecycleStatus.localeCompare(b.lifecycleStatus)
      else if (sortField === "budgetAmount") cmp = (a.budgetAmount ?? 0) - (b.budgetAmount ?? 0)
      else if (sortField === "startDate")
        cmp = (a.startDate ?? "").localeCompare(b.startDate ?? "")
      else if (sortField === "endDate")
        cmp = (a.endDate ?? "").localeCompare(b.endDate ?? "")
      else if (sortField === "createdAt")
        cmp = (a.createdAt ?? "").localeCompare(b.createdAt ?? "")
      return sortDir === "asc" ? cmp : -cmp
    })
    return result
  }, [activeTab, data, search, filterStatus, filterPriority, filterBillable, sortField, sortDir])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const allSelected = paginated.length > 0 && paginated.every(p => selectedIds.includes(p.id))

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(prev => prev.filter(id => !paginated.find(p => p.id === id)))
    else {
      const newIds = [...selectedIds]
      paginated.forEach(p => { if (!newIds.includes(p.id)) newIds.push(p.id) })
      setSelectedIds(newIds)
    }
  }

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteProject(Number(deleteTarget.id))
    setData(prev => prev.filter(p => p.id !== deleteTarget.id))
    setSelectedIds(prev => prev.filter(id => id !== deleteTarget.id))
    setDeleteOpen(false)
    setDeleteTarget(null)
  }

  const handleBatchDelete = async () => {
    await Promise.all(selectedIds.map(id => deleteProject(Number(id))))
    setData(prev => prev.filter(p => !selectedIds.includes(p.id)))
    setSelectedIds([])
    setBatchDeleteOpen(false)
  }

  const clearFilters = () => {
    setFilterStatus([]); setFilterPriority([]); setFilterBillable("all")
    setSearch(""); setCurrentPage(1)
  }

  // ── Row click handler — block if read-only ────────────────────────────────
  const handleRowClick = (p: ProjectRow) => {
    const readOnly = isBeforeStartDate(p.startDate) && !isAdmin
    if (readOnly) return
    router.push(`/projects/${p.id}/tasks/list`)
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 p-4 pt-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Projects</h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 text-sm border-b">
          {(["active", "archived"] as const).map(tab => (
            <button
              key={tab}
              className={`pb-2 border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-foreground font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => { setActiveTab(tab); setSelectedIds([]) }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}{" "}
              <span className="text-muted-foreground font-normal">
                ({data.filter(p => tab === "active" ? !p.archived : p.archived).length})
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                  className="pl-9 h-9"
                />
              </div>

              {/* Filters */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Status</DropdownMenuLabel>
                  {LIFECYCLE_OPTIONS.map(s => (
                    <DropdownMenuCheckboxItem
                      key={s} checked={filterStatus.includes(s)}
                      onCheckedChange={c => {
                        setFilterStatus(prev => c ? [...prev, s] : prev.filter(x => x !== s))
                        setCurrentPage(1)
                      }}
                      className="capitalize"
                    >
                      {s.replace("_", " ")}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Priority</DropdownMenuLabel>
                  {PRIORITY_OPTIONS.map(p => (
                    <DropdownMenuCheckboxItem
                      key={p} checked={filterPriority.includes(p)}
                      onCheckedChange={c => {
                        setFilterPriority(prev => c ? [...prev, p] : prev.filter(x => x !== p))
                        setCurrentPage(1)
                      }}
                      className="capitalize"
                    >
                      {p}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Billable</DropdownMenuLabel>
                  {(["all", "billable", "non_billable"] as const).map(b => (
                    <DropdownMenuCheckboxItem
                      key={b} checked={filterBillable === b}
                      onCheckedChange={() => { setFilterBillable(b); setCurrentPage(1) }}
                    >
                      {b === "all" ? "All" : b === "billable" ? "Billable" : "Non-billable"}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {activeFilterCount > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive text-xs" onSelect={clearFilters}>
                        Clear all filters
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Active filter chips */}
              {filterStatus.map(s => (
                <Badge key={s} variant="secondary" className="gap-1 h-7 text-xs">
                  {s.replace("_", " ")}
                  <button onClick={() => setFilterStatus(prev => prev.filter(x => x !== s))}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
              {filterPriority.map(p => (
                <Badge key={p} variant="secondary" className="gap-1 h-7 text-xs capitalize">
                  {p}
                  <button onClick={() => setFilterPriority(prev => prev.filter(x => x !== p))}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
              {filterBillable !== "all" && (
                <Badge variant="secondary" className="gap-1 h-7 text-xs">
                  {filterBillable === "billable" ? "Billable" : "Non-billable"}
                  <button onClick={() => setFilterBillable("all")}><X className="h-3 w-3" /></button>
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9 hidden md:inline-flex" onClick={() => setImportOpen(true)}>
                <Upload className="mr-2 h-3.5 w-3.5" />Import
              </Button>
              <Button size="sm" className="h-9" onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 h-3.5 w-3.5" />Add Project
              </Button>
            </div>
          </div>

          {/* Table */}
          <div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="rounded border-gray-300" />
                  </TableHead>
                  <TableHead>
                    <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => handleSort("name")}>
                      Name <SortIcon field="name" current={sortField} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <span className="text-xs font-medium uppercase tracking-wide">Description</span>
                  </TableHead>
                  <TableHead>
                    <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => handleSort("priority")}>
                      Priority <SortIcon field="priority" current={sortField} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => handleSort("lifecycleStatus")}>
                      Status <SortIcon field="lifecycleStatus" current={sortField} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    <span className="text-xs font-medium uppercase tracking-wide">Billable</span>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => handleSort("budgetAmount")}>
                      Budget <SortIcon field="budgetAmount" current={sortField} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">
                    <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => handleSort("startDate")}>
                      Start Date <SortIcon field="startDate" current={sortField} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">
                    <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => handleSort("endDate")}>
                      End Date <SortIcon field="endDate" current={sortField} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">
                    <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => handleSort("createdAt")}>
                      Created At <SortIcon field="createdAt" current={sortField} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead className="w-16">
                    <span className="text-xs font-medium uppercase tracking-wide">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground py-16">
                      {fetchError ? (
                        <div className="text-destructive font-medium">Error: {fetchError}</div>
                      ) : isLoading ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span className="text-sm">Loading projects...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-sm font-medium">No projects found</span>
                          {activeFilterCount > 0 && (
                            <button className="text-xs text-primary underline underline-offset-4" onClick={clearFilters}>
                              Clear filters
                            </button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : paginated.map(p => {
                  const notStarted = isBeforeStartDate(p.startDate)
                  // Read-only jika belum start dan bukan admin
                  const readOnly = notStarted && !isAdmin

                  return (
                    <TableRow
                      key={p.id}
                      className={`transition-colors ${
                        readOnly
                          ? "opacity-60 cursor-not-allowed bg-muted/20"
                          : "cursor-pointer hover:bg-muted/40"
                      }`}
                      onClick={() => handleRowClick(p)}
                    >
                      {/* Checkbox */}
                      <TableCell onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded border-gray-300"
                          disabled={readOnly}
                        />
                      </TableCell>

                      {/* Name */}
                      <TableCell className="max-w-[180px]">
                        <div className="flex items-center gap-1.5">
                          {readOnly ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-medium text-sm truncate block text-muted-foreground">
                                  {p.name}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="flex items-center gap-1.5">
                                <Lock className="h-3 w-3" />
                                <span>Project starts on {formatDate(p.startDate)}</span>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Link
                              href={`/projects/${p.id}/tasks/list`}
                              className="font-medium text-sm hover:underline truncate block"
                              onClick={e => e.stopPropagation()}
                            >
                              {p.name}
                            </Link>
                          )}
                          {/* Not Started badge */}
                          {notStarted && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Badge variant="outline" className="text-[10px] gap-1 border-orange-300 text-orange-600 bg-orange-50 shrink-0">
                                    <CalendarClock className="h-3 w-3" />
                                    Not started
                                  </Badge>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                Starts {formatDate(p.startDate)}
                                {isAdmin && " · You can access as admin"}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>

                      {/* Description */}
                      <TableCell className="hidden md:table-cell max-w-[200px]">
                        <span className="text-sm text-muted-foreground truncate block">
                          {p.description || <span className="italic opacity-40">No description</span>}
                        </span>
                      </TableCell>

                      {/* Priority */}
                      <TableCell><PriorityBadge priority={p.priority} /></TableCell>

                      {/* Status */}
                      <TableCell><StatusBadge status={p.lifecycleStatus} /></TableCell>

                      {/* Billable */}
                      <TableCell className="hidden sm:table-cell">
                        <span className={`text-xs font-medium ${p.isBillable ? "text-emerald-600" : "text-muted-foreground"}`}>
                          {p.isBillable ? "Billable" : "Non-billable"}
                        </span>
                      </TableCell>

                      {/* Budget */}
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground font-mono">{p.budgetLabel}</span>
                      </TableCell>

                      {/* Start Date */}
                      <TableCell className="hidden xl:table-cell">
                        <span className={`text-sm ${notStarted ? "text-orange-600 font-medium" : "text-muted-foreground"}`}>
                          {formatDate(p.startDate)}
                        </span>
                      </TableCell>

                      {/* End Date */}
                      <TableCell className="hidden xl:table-cell">
                        <span className="text-sm text-muted-foreground">{formatDate(p.endDate)}</span>
                      </TableCell>

                      {/* Created At */}
                      <TableCell className="hidden xl:table-cell">
                        <span className="text-sm text-muted-foreground">{formatDate(p.createdAt)}</span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={readOnly}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {!p.archived ? (
                              <>
                                <DropdownMenuItem onSelect={() => { setEditTab("general"); setEditing(p) }}>Edit project</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => { setEditTab("members"); setEditing(p) }}>Manage members</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => { setEditTab("budget"); setEditing(p) }}>Edit budget</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Duplicate project</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => { setArchiveTargets([p.id]); setArchiveOpen(true) }}>Archive project</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => { setTransferProject(p); setTransferOpen(true) }}>Transfer</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => { setDeleteTarget(p); setDeleteOpen(true) }}>Delete project</DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem disabled>Edit project</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => { setEditTab("members"); setEditing(p) }}>Manage members</DropdownMenuItem>
                                <DropdownMenuItem disabled>Duplicate project</DropdownMenuItem>
                                <DropdownMenuItem onSelect={async () => {
                                  await unarchiveProject(Number(p.id))
                                  setData(prev => prev.map(it => it.id === p.id ? { ...it, archived: false, lifecycleStatus: "active" } : it))
                                  setSelectedIds(prev => prev.filter(id => id !== p.id))
                                  setActiveTab("active")
                                }}>Restore project</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => { setDeleteTarget(p); setDeleteOpen(true) }}>Delete project</DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <PaginationFooter
            page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}
            isLoading={false}
            from={paginated.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            to={Math.min(currentPage * pageSize, filtered.length)}
            total={filtered.length} pageSize={pageSize}
            onPageSizeChange={size => { setPageSize(size); setCurrentPage(1) }}
          />

          {/* ── Dialogs ── */}
          <AddProjectDialog
            open={addOpen} onOpenChange={setAddOpen}
            form={form} onFormChange={setForm}
            members={realMembers} teams={teams}
            onSave={async () => {
              const names = form.names.split("\n").map(n => n.trim()).filter(Boolean)
              for (const name of names) {
                await createProject({
                  name, 
                  is_billable: form.billable,
                  start_date: form.startDate,
                  teams: form.teams.map(t => parseInt(t.replace(/\D/g, ""))).filter(t => !isNaN(t)),
                  metadata: { ...form, names: undefined, teams: undefined, startDate: undefined }
                }, organizationId ?? undefined)
              }
              await fetchProjects()
              setAddOpen(false)
              setForm(prev => ({ ...prev, names: "" }))
            }}
          />

          <EditProjectDialog
            open={Boolean(editing)} onOpenChange={(o: boolean) => { if (!o) setEditing(null) }}
            project={editing} initialTab={editTab}
            members={realMembers} teams={teams}
            onSave={async (updatedForm) => {
              if (editing) {
                await updateProject(Number(editing.id), {
                  name: updatedForm.names, 
                  is_billable: updatedForm.billable,
                  start_date: updatedForm.startDate,
                  teams: updatedForm.teams.map(t => parseInt(t.replace(/\D/g, ""))).filter(t => !isNaN(t)),
                  lifecycle_status: editing.archived ? "archived" : "active",
                  metadata: { ...updatedForm, names: undefined, teams: undefined, startDate: undefined }
                })
                await fetchProjects()
              }
              setEditing(null)
            }}
          />

          <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit {selectedIds.length} project{selectedIds.length !== 1 ? "s" : ""}</DialogTitle>
                <DialogDescription>Editing will override the existing settings for selected projects.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <label className="flex items-center justify-between gap-3">
                  <span className="text-sm">Billable</span>
                  <Switch checked={batchBillable} onCheckedChange={setBatchBillable} />
                </label>
                <label className="flex items-center justify-between gap-3 opacity-50 pointer-events-none">
                  <span className="text-sm">Disable activity</span>
                  <Switch checked={batchDisableActivity} onCheckedChange={setBatchDisableActivity} />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span className="text-sm">Allow project tracking</span>
                  <Switch checked={batchAllowTracking} onCheckedChange={setBatchAllowTracking} />
                </label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBatchOpen(false)}>Cancel</Button>
                <Button onClick={() => setBatchOpen(false)}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={archiveOpen} onOpenChange={o => { setArchiveOpen(o); if (!o) setArchiveTargets([]) }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{archiveTargets.length <= 1 ? "Archive project?" : `Archive ${archiveTargets.length} projects?`}</DialogTitle>
                <DialogDescription>This will move the project(s) to Archived. You can restore later.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setArchiveOpen(false); setArchiveTargets([]) }}>Cancel</Button>
                <Button variant="destructive" onClick={async () => {
                  await Promise.all(archiveTargets.map(id => archiveProject(Number(id))))
                  setData(prev => prev.map(it => archiveTargets.includes(it.id) ? { ...it, archived: true, lifecycleStatus: "archived" } : it))
                  setSelectedIds(prev => prev.filter(id => !archiveTargets.includes(id)))
                  setActiveTab("archived")
                  setArchiveOpen(false); setArchiveTargets([])
                }}>Archive</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog open={deleteOpen} onOpenChange={o => { setDeleteOpen(o); if (!o) setDeleteTarget(null) }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete
                  {deleteTarget && <span className="font-semibold text-foreground"> {deleteTarget.name}</span>} and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {selectedIds.length} project{selectedIds.length !== 1 ? "s" : ""}?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone. All selected projects and their data will be permanently deleted.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBatchDelete} className="bg-destructive text-white hover:bg-destructive/90">
                  Delete {selectedIds.length} project{selectedIds.length !== 1 ? "s" : ""}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={importOpen} onOpenChange={o => { setImportOpen(o); if (!o) setImportFile(null) }}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Import projects</DialogTitle>
                <DialogDescription />
              </DialogHeader>
              <div className="space-y-3">
                <div className="border-2 border-dashed rounded-lg p-8 grid place-items-center bg-muted/20">
                  <div className="space-y-2 text-center">
                    <input id="projects-file" type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={e => setImportFile(e.target.files?.[0] ?? null)} />
                    <Button variant="outline" onClick={() => document.getElementById("projects-file")?.click()}>Browse files</Button>
                    <div className="text-xs text-muted-foreground">Accepted: <span className="font-medium">.CSV, .XLS, .XLSX</span></div>
                    {importFile && <div className="text-xs">Selected: <span className="font-medium">{importFile.name}</span></div>}
                  </div>
                </div>
                <button type="button" className="text-sm text-primary hover:underline underline-offset-4">Download template</button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setImportOpen(false); setImportFile(null) }}>Cancel</Button>
                <Button onClick={() => { setImportOpen(false); setImportFile(null) }} disabled={!importFile}>Import</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <TransferProjectDialog
            open={transferOpen}
            onOpenChange={o => { setTransferOpen(o); if (!o) setTransferProject(null) }}
            project={transferProject}
            onTransfer={() => {
              if (transferProject) {
                setData(prev => prev.filter(p => p.id !== transferProject.id))
                setTransferProject(null)
              }
            }}
          />
        </div>

        {/* Floating batch bar */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background border shadow-xl rounded-full px-6 py-3 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-4 ring-1 ring-black/5">
            <span className="text-sm font-semibold border-r pr-4">
              {selectedIds.length} selected
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setBatchOpen(true)}>
                <Pencil className="w-3.5 h-3.5" />Edit
              </Button>
              <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => { setArchiveTargets(selectedIds); setArchiveOpen(true) }}>
                <Archive className="w-3.5 h-3.5" />Archive
              </Button>
              <Button size="sm" variant="destructive" className="h-8 gap-1.5" onClick={() => setBatchDeleteOpen(true)}>
                <Trash2 className="w-3.5 h-3.5" />Delete
              </Button>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setSelectedIds([])}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}