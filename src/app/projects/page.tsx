"use client"

import React, { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Search, Plus, Upload } from "lucide-react"

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Custom Components
import { ProjectsTable } from "@/components/project-management/projects/projects-table"
import ManageProjectDialog from "@/components/project-management/projects/dialogs/manage-project-dialog"
import TransferProjectDialog from "@/components/project-management/projects/dialogs/transfer-project"
import { PaginationFooter } from "@/components/customs/pagination-footer"

// Actions & Logic
import {
  getAllProjects, createProject, updateProject, deleteProject,
  archiveProject, unarchiveProject, getSimpleMembersForDropdown,
} from "@/action/projects"
import { getTeams } from "@/action/teams"
import { useOrgStore } from "@/store/org-store"
import type { ITeams, ISimpleMember, Project, NewProjectForm } from "@/interface"

// ─── Types & Constants ───────────────────────────────────────────────────────

export interface ProjectRow extends Project {
  description: string | null
  priority: "high" | "medium" | "low" | null
  lifecycleStatus: string
  isBillable: boolean
  budgetAmount: number | null
  currencyCode: string
  startDate: string | null
  endDate: string | null
  createdAt: string | null
  archived: boolean
  budgetLabel: string
}

const ADMIN_ROLE_CODES = ["admin", "owner", "super_admin", "administrator"]
const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

const EMPTY_FORM: NewProjectForm = {
  names: "",
  description: "",
  billable: true,
  disableActivity: false,
  allowTracking: true,
  disableIdle: false,
  members: [],
  teams: [],
  budgetType: "",
  budgetBasedOn: "",
  budgetCost: "",
  budgetNotifyMembers: false,
  budgetNotifyAt: "80",
  budgetNotifyWho: "",
  startDate: new Date().toISOString().split("T")[0] ?? null,
  endDate: null,
  priority: "medium",
  lifecycleStatus: "active",
  budgetStopTimers: false,
  budgetStopAt: "100",
  budgetResets: "never",
  budgetIncludeNonBillable: false,
  memberLimits: [{ members: [], type: "", basedOn: "", cost: "", resets: "never", startDate: "" }],
  memberLimitNotifyAt: "80",
  memberLimitNotifyMembers: false,
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const router = useRouter()
  const { organizationId, currentRole } = useOrgStore()
  const isAdmin = Boolean(currentRole && ADMIN_ROLE_CODES.includes(currentRole.toLowerCase()))

  // Data States
  const [data, setData] = useState<ProjectRow[]>([])
  const [realMembers, setRealMembers] = useState<ISimpleMember[]>([])
  const [teams, setTeams] = useState<ITeams[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Table States
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active")
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortField, setSortField] = useState<string>("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  // Form & Dialog States
  const [form, setForm] = useState<NewProjectForm>(EMPTY_FORM)
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectRow | null>(null)
  const [editTab, setEditTab] = useState<string>("general")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ProjectRow | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferProject, setTransferProject] = useState<ProjectRow | null>(null)

  const fetchProjects = async () => {
    setIsLoading(true)
    setFetchError(null)
    if (!organizationId) { setData([]); setIsLoading(false); return }
    const res = await getAllProjects(organizationId)
    if (res.success && res.data) {
      setData(res.data.map((p: any) => ({
        ...p,
        id: String(p.id),
        description: p.description ?? null,
        priority: p.priority ?? "medium",
        lifecycleStatus: p.lifecycle_status ?? "active",
        isBillable: p.is_billable ?? true,
        budgetAmount: p.budget_amount ? Number(p.budget_amount) : null,
        startDate: p.start_date ?? null,
        endDate: p.end_date ?? null,
        createdAt: p.created_at ?? null,
        archived: p.lifecycle_status === "archived",
        budgetLabel: p.budget_amount
          ? `${p.currency_code || "USD"} ${Number(p.budget_amount).toLocaleString()}`
          : "No budget",
      })))
    } else {
      setFetchError(res.message || "Failed to fetch projects")
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchProjects()
    if (organizationId) {
      getSimpleMembersForDropdown(organizationId).then(res => res.success && setRealMembers(res.data))
      getTeams(Number(organizationId)).then(res => res.success && setTeams(res.data))
    }
  }, [organizationId])

  // Populate form when editing
  useEffect(() => {
    if (editing) {
      setForm({
        ...EMPTY_FORM,
        names: editing.name,
        description: editing.description ?? "",
        billable: editing.isBillable,
        priority: (editing.priority as "high" | "medium" | "low") ?? "medium",
        lifecycleStatus: editing.lifecycleStatus ?? "active",
        startDate: editing.startDate,
        endDate: editing.endDate,
        budgetCost: editing.budgetAmount ? String(editing.budgetAmount) : "",
        teams: editing.teams?.map(tName => String(teams.find(t => t.name === tName)?.id || "")) || [],
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [editing, teams])

  const filtered = useMemo(() => {
    let result = data.filter(p => activeTab === "active" ? !p.archived : p.archived)
    if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

    return [...result].sort((a, b) => {
      let cmp = 0
      if (sortField === "name") cmp = a.name.localeCompare(b.name)
      else if (sortField === "priority") cmp = (PRIORITY_ORDER[a.priority ?? ""] ?? 99) - (PRIORITY_ORDER[b.priority ?? ""] ?? 99)
      else if (sortField === "budgetAmount") cmp = (a.budgetAmount ?? 0) - (b.budgetAmount ?? 0)
      else cmp = (a[sortField as keyof ProjectRow] as string ?? "").localeCompare(b[sortField as keyof ProjectRow] as string ?? "")
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [activeTab, data, search, sortField, sortDir])

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totalPages = Math.ceil(filtered.length / pageSize) || 1

  const handleSave = async (formData?: NewProjectForm) => {
    const f = formData || form

    // Map NewProjectForm → API payload shape
    const payload = {
      description:      f.description || null,
      priority:         f.priority,
      lifecycle_status: f.lifecycleStatus,
      is_billable:      f.billable,
      start_date:       f.startDate,
      end_date:         f.endDate,
      teams:            f.teams.map(Number),
    }

    if (editing) {
      await updateProject(Number(editing.id), { name: f.names, ...payload })
    } else {
      const names = f.names.split("\n").filter(Boolean)
      for (const n of names) {
        await createProject({ name: n, ...payload }, organizationId!)
      }
    }
    setAddOpen(false)
    setEditing(null)
    fetchProjects()
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Projects</h1>
        </div>

        {/* Tabs: Active / Archived */}
        <div className="flex items-center gap-6 text-sm border-b">
          {(["active", "archived"] as const).map((tab) => (
            <button
              key={tab}
              className={`pb-2 border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? "border-foreground font-medium"
                  : "text-muted-foreground border-transparent"
              }`}
              onClick={() => { setActiveTab(tab); setSelectedIds([]); setCurrentPage(1) }}
            >
              {tab} ({data.filter(p => tab === "active" ? !p.archived : p.archived).length})
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-3.5 w-3.5" />Import
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-3.5 w-3.5" />Add
            </Button>
          </div>
        </div>

        {/* Table */}
        <ProjectsTable
          isLoading={isLoading}
          fetchError={fetchError}
          data={paginated}
          selectedIds={selectedIds}
          allSelected={paginated.length > 0 && paginated.every(p => selectedIds.includes(p.id))}
          isAdmin={isAdmin}
          sortField={sortField}
          sortDir={sortDir}
          activeFilterCount={search ? 1 : 0}
          onSort={(f) => {
            if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc")
            else { setSortField(f); setSortDir("asc") }
          }}
          onClearFilters={() => setSearch("")}
          onToggleSelectAll={() => {
            const isAllSelected = paginated.every(p => selectedIds.includes(p.id))
            if (isAllSelected) setSelectedIds(prev => prev.filter(id => !paginated.find(p => p.id === id)))
            else setSelectedIds(prev => [...new Set([...prev, ...paginated.map(p => p.id)])])
          }}
          onToggleSelect={(id) =>
            setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
          }
          onRowClick={(p) => router.push(`/projects/${p.id}/tasks/list`)}
          onEdit={(p, t) => { setEditTab(t); setEditing(p) }}
          onArchive={async (id) => { await archiveProject(Number(id)); fetchProjects() }}
          onRestore={async (id) => { await unarchiveProject(Number(id)); fetchProjects() }}
          onDelete={(p) => { setDeleteTarget(p); setDeleteOpen(true) }}
          onTransfer={(p) => { setTransferProject(p); setTransferOpen(true) }}
        />

        {/* Pagination */}
        <PaginationFooter
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={false}
          total={filtered.length}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          from={(currentPage - 1) * pageSize + 1}
          to={Math.min(currentPage * pageSize, filtered.length)}
        />

        {/* Add / Edit Dialog */}
        <ManageProjectDialog
          mode={editing ? "edit" : "add"}
          open={addOpen || !!editing}
          onOpenChange={(val) => { if (!val) { setAddOpen(false); setEditing(null) } }}
          project={editing}
          form={form}
          onFormChange={setForm}
          initialTab={editTab}
          members={realMembers}
          teams={teams}
          onSave={handleSave}
        />

        {/* Transfer Dialog */}
        <TransferProjectDialog
          open={transferOpen}
          onOpenChange={setTransferOpen}
          project={transferProject}
          onTransfer={fetchProjects}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete{" "}
                <strong>{deleteTarget?.name}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  if (deleteTarget) await deleteProject(Number(deleteTarget.id))
                  setDeleteOpen(false)
                  fetchProjects()
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}