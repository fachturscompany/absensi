"use client"

import React, { useMemo, useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Pencil, Plus, Upload, X, Trash2, Archive } from "lucide-react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import type {
    ITeams, ISimpleMember, Project, NewProjectForm,
} from "@/interface"
import { PaginationFooter } from "@/components/customs/pagination-footer"

// ─── Mapper ──────────────────────────────────────────────────────────────────

function mapProjectData(p: any): Project {
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

    // Membaca budget langsung dari kolom database fisik
    let budgetLabel = "No budget"
    if (p.budget_amount && Number(p.budget_amount) > 0) {
        budgetLabel = `${p.currency_code?.trim() || "USD"} ${Number(p.budget_amount).toLocaleString()}`
    } else if (p.budget_hours && Number(p.budget_hours) > 0) {
        budgetLabel = `${Number(p.budget_hours)} hours`
    }

    return {
        id: String(p.id),
        name: p.name,
        teams: tNames,
        members: Array.from(memberMap.values()),
        taskCount: p.tasks?.[0]?.count ?? 0,
        budgetLabel: budgetLabel,
        memberLimitLabel: p.metadata?.memberLimits
            ? `${p.metadata.memberLimits.length} limits`
            : "0 limits",
        archived: p.lifecycle_status === "archived",
    }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
    const router = useRouter()

    const [activeTab, setActiveTab] = useState<"active" | "archived">("active")
    const [search, setSearch] = useState("")
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [data, setData] = useState<Project[]>([])
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [realMembers, setRealMembers] = useState<ISimpleMember[]>([])
    const [teams, setTeams] = useState<ITeams[]>([])

    const { organizationId } = useOrgStore()

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
            console.error("fetchProjects failed:", res.message)
            setFetchError(res.message ?? "Failed to fetch projects")
        }
        setIsLoading(false)
    }

    const dropdownsFetched = useRef(false)

    const fetchDropdowns = React.useCallback(async () => {
        if (!organizationId) return
        if (dropdownsFetched.current) return
        dropdownsFetched.current = true

        const [membersRes, teamsRes] = await Promise.all([
            getSimpleMembersForDropdown(organizationId),
            getTeams(Number(organizationId)),
        ])
        if (membersRes.success) setRealMembers(membersRes.data)
        if (teamsRes.success) setTeams(teamsRes.data)
    }, [organizationId])

    React.useEffect(() => {
        dropdownsFetched.current = false
    }, [organizationId])

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
    const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
    const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)

    const [archiveOpen, setArchiveOpen] = useState(false)
    const [archiveTargets, setArchiveTargets] = useState<string[]>([])

    const [editing, setEditing] = useState<Project | null>(null)
    const [editTab, setEditTab] = useState<"general" | "members" | "budget" | "teams">("general")

    const [batchOpen, setBatchOpen] = useState(false)
    const [batchBillable, setBatchBillable] = useState(true)
    const [batchDisableActivity, setBatchDisableActivity] = useState(false)
    const [batchAllowTracking, setBatchAllowTracking] = useState(true)

    const [transferOpen, setTransferOpen] = useState(false)
    const [transferProject, setTransferProject] = useState<Project | null>(null)

    const [form, setForm] = useState<NewProjectForm>({
        names: "",
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
        budgetStopTimers: false,
        budgetStopAt: "100",
        budgetResets: "never",
        budgetStartDate: null,
        budgetIncludeNonBillable: false,
        memberLimits: [{ members: [], type: "", basedOn: "", cost: "", resets: "never", startDate: null }],
        memberLimitNotifyAt: "80",
        memberLimitNotifyMembers: false,
    })

    // ── Derived ───────────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        let result = data.filter(p => activeTab === "active" ? !p.archived : p.archived)
        const q = search.trim().toLowerCase()
        if (q) result = result.filter(p => p.name.toLowerCase().includes(q))
        return result
    }, [activeTab, data, search])

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return filtered.slice(start, start + pageSize)
    }, [filtered, currentPage, pageSize])

    const totalPages = Math.ceil(filtered.length / pageSize) || 1
    const allSelected = paginated.length > 0 && paginated.every(p => selectedIds.includes(p.id))

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !paginated.find(p => p.id === id)))
        } else {
            const newIds = [...selectedIds]
            paginated.forEach(p => { if (!newIds.includes(p.id)) newIds.push(p.id) })
            setSelectedIds(newIds)
        }
    }

    const toggleSelect = (id: string) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

    // ── Handlers ──────────────────────────────────────────────────────────────
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

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Projects</h1>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 text-sm">
                <button
                    className={`pb-2 border-b-2 ${activeTab === "active" ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    onClick={() => { setActiveTab("active"); setSelectedIds([]) }}
                >
                    ACTIVE ({data.filter(p => !p.archived).length})
                </button>
                <button
                    className={`pb-2 border-b-2 ${activeTab === "archived" ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    onClick={() => { setActiveTab("archived"); setSelectedIds([]) }}
                >
                    ARCHIVED ({data.filter(p => p.archived).length})
                </button>
            </div>

            <div>
                <div className="space-y-3">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between flex-gap-3">
                        <div className="w-full sm:w-auto min-w-[260px] max-w-[360px] relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input placeholder="Search projects" value={search} onChange={e => setSearch(e.target.value)} className="ps-10 pl-10" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="px-3 hidden md:inline-flex" onClick={() => setImportOpen(true)}>
                                <Upload className="mr-2 h-4 w-4" />Import
                            </Button>
                            <Button className="px-3" onClick={() => setAddOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />Add
                            </Button>
                        </div>
                    </div>

                    {/* Content (Table List View Only) */}
                    <div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="rounded border-gray-300" />
                                    </TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Teams</TableHead>
                                    <TableHead>Members</TableHead>
                                    <TableHead>Tasks</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                                            {fetchError
                                                ? <div className="text-red-500 font-medium">Error loading projects: {fetchError}</div>
                                                : isLoading ? "Loading projects..." : "No projects found"}
                                        </TableCell>
                                    </TableRow>
                                ) : paginated.map(p => (
                                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push(`/projects/${p.id}/tasks/list`)}>
                                        <TableCell className="align-top" onClick={e => e.stopPropagation()}>
                                            <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} className="rounded border-gray-300" />
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/projects/${p.id}/tasks/list`} className="font-medium text-sm hover:underline block truncate">{p.name}</Link>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{p.teams.length === 0 ? "None" : p.teams.join(", ")}</TableCell>
                                        <TableCell><span className="text-sm text-muted-foreground">{p.members.length} members</span></TableCell>
                                        <TableCell className="text-muted-foreground">{p.taskCount}</TableCell>
                                        <TableCell onClick={e => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="sm" className="px-3"><Pencil className="h-4 w-4" /></Button>
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
                                                                setData(prev => prev.map(it => it.id === p.id ? { ...it, archived: false } : it))
                                                                setSelectedIds(prev => prev.filter(id => id !== p.id))
                                                                setActiveTab("active")
                                                            }}>Restore project</DropdownMenuItem>
                                                            <DropdownMenuItem disabled>Transfer</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => { setDeleteTarget(p); setDeleteOpen(true) }}>Delete project</DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
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

                    {/* Add Project */}
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
                                    teams: form.teams.map(t => parseInt(t.replace(/\D/g, ""))).filter(t => !isNaN(t)),
                                    metadata: { ...form, names: undefined, teams: undefined }
                                }, organizationId ?? undefined)
                            }
                            await fetchProjects()
                            setAddOpen(false)
                            setForm(prev => ({ ...prev, names: "" }))
                        }}
                    />

                    {/* Edit Project */}
                    <EditProjectDialog
                        open={Boolean(editing)} onOpenChange={(o: boolean) => { if (!o) setEditing(null) }}
                        project={editing} initialTab={editTab}
                        members={realMembers} teams={teams}
                        onSave={async (updatedForm) => {
                            if (editing) {
                                await updateProject(Number(editing.id), {
                                    name: updatedForm.names,
                                    is_billable: updatedForm.billable,
                                    teams: updatedForm.teams.map(t => parseInt(t.replace(/\D/g, ""))).filter(t => !isNaN(t)),
                                    lifecycle_status: editing.archived ? "archived" : "active",
                                    metadata: {
                                        ...updatedForm,
                                        names: undefined,
                                        teams: undefined
                                    }
                                })
                                await fetchProjects()
                            }
                            setEditing(null)
                        }}
                    />

                    {/* Batch Edit */}
                    <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Edit project ({selectedIds.length} project{selectedIds.length !== 1 ? "s" : ""})</DialogTitle>
                                <DialogDescription>Editing the selected project will override the existing settings.</DialogDescription>
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

                    {/* Archive */}
                    <Dialog open={archiveOpen} onOpenChange={o => { setArchiveOpen(o); if (!o) setArchiveTargets([]) }}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>{archiveTargets.length <= 1 ? "Archive project?" : `Archive ${archiveTargets.length} projects?`}</DialogTitle>
                                <DialogDescription>This will move {archiveTargets.length <= 1 ? "the project" : "the selected projects"} to Archived. You can unarchive later.</DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => { setArchiveOpen(false); setArchiveTargets([]) }}>Cancel</Button>
                                <Button variant="destructive" onClick={async () => {
                                    await Promise.all(archiveTargets.map(id => archiveProject(Number(id))))
                                    setData(prev => prev.map(it => archiveTargets.includes(it.id) ? { ...it, archived: true } : it))
                                    setSelectedIds(prev => prev.filter(id => !archiveTargets.includes(id)))
                                    setActiveTab("archived")
                                    setArchiveOpen(false)
                                    setArchiveTargets([])
                                }}>Archive</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Single Delete */}
                    <AlertDialog open={deleteOpen} onOpenChange={o => { setDeleteOpen(o); if (!o) setDeleteTarget(null) }}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the project
                                    {deleteTarget && <span className="font-semibold text-foreground"> {deleteTarget.name}</span>} and remove all associated data.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Batch Delete */}
                    <AlertDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete {selectedIds.length} project{selectedIds.length !== 1 ? "s" : ""}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. All selected projects and their associated data will be permanently deleted.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleBatchDelete} className="bg-destructive text-white hover:bg-destructive/90">
                                    Delete {selectedIds.length} project{selectedIds.length !== 1 ? "s" : ""}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Import */}
                    <Dialog open={importOpen} onOpenChange={o => { setImportOpen(o); if (!o) setImportFile(null) }}>
                        <DialogContent className="max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Import projects</DialogTitle>
                                <DialogDescription />
                            </DialogHeader>
                            <div className="space-y-3">
                                <div className="border-2 border-dashed rounded-md p-6 grid place-items-center bg-muted/30">
                                    <div className="space-y-2 text-center">
                                        <input id="projects-file" type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={e => setImportFile(e.target.files?.[0] ?? null)} />
                                        <Button variant="outline" onClick={() => document.getElementById("projects-file")?.click()}>Browse files</Button>
                                        <div className="text-xs text-muted-foreground">Accepted: <span className="font-medium">.CSV, .XLS, .XLSX</span></div>
                                        {importFile && <div className="text-xs text-foreground">Selected: <span className="font-medium">{importFile.name}</span></div>}
                                    </div>
                                </div>
                                <button type="button" className="text-sm text-primary hover:underline underline-offset-4" onClick={() => { }}>Download the template here</button>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => { setImportOpen(false); setImportFile(null) }}>Cancel</Button>
                                <Button onClick={() => { setImportOpen(false); setImportFile(null) }} disabled={!importFile}>Import</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Transfer */}
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

                {/* Floating Batch Bar */}
                {selectedIds.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl rounded-full px-6 py-3 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5 ring-1 ring-black/5">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 border-r border-gray-100 dark:border-gray-800 pr-4">
                            {selectedIds.length} selected
                        </span>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase tracking-wider" onClick={() => setBatchOpen(true)}>
                                <Pencil className="w-3.5 h-3.5 mr-2" />Edit
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase tracking-wider" onClick={() => { setArchiveTargets(selectedIds); setArchiveOpen(true) }}>
                                <Archive className="w-3.5 h-3.5 mr-2" />Archive
                            </Button>
                            <Button size="sm" variant="destructive" className="h-8 text-[10px] font-bold uppercase tracking-wider" onClick={() => setBatchDeleteOpen(true)}>
                                <Trash2 className="w-3.5 h-3.5 mr-2 text-white" />Delete
                            </Button>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 ml-2 rounded-full" onClick={() => setSelectedIds([])}>
                            <X className="w-4 h-4 text-gray-400" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}