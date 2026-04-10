"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Search, X, Users, UserPlus, Loader2, ChevronDown } from "lucide-react"
import type { ITeams, ISimpleMember, NewProjectForm } from "@/interface"
import type { ProjectRow } from "@/app/projects/page"
import {
  getProjectMembers, getProjectTeams,
  addProjectMember, removeProjectMember, updateProjectMemberRole,
  addProjectTeam, removeProjectTeam,
  type ProjectMemberRow, type ProjectTeamRow,
} from "@/action/projects"

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_OPTIONS = [
  { value: "high",   label: "High",   dot: "bg-red-500" },
  { value: "medium", label: "Medium", dot: "bg-amber-500" },
  { value: "low",    label: "Low",    dot: "bg-blue-500" },
]

const STATUS_OPTIONS = [
  { value: "active",    label: "Active" },
  { value: "on_hold",   label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "archived",  label: "Archived" },
]

const ROLE_OPTIONS: { value: "manager" | "lead" | "member" | "viewer"; label: string }[] = [
  { value: "manager", label: "Manager" },
  { value: "lead",    label: "Lead" },
  { value: "member",  label: "Member" },
  { value: "viewer",  label: "Viewer" },
]

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
  if (photoUrl) {
    return <img src={photoUrl} alt={name} className="h-7 w-7 rounded-full object-cover shrink-0" />
  }
  return (
    <span className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground shrink-0">
      {initials}
    </span>
  )
}

// ─── General Tab ──────────────────────────────────────────────────────────────

function GeneralTab({ form, onChange, mode }: {
  form: NewProjectForm
  onChange: (u: Partial<NewProjectForm>) => void
  mode: "add" | "edit"
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="proj-name" className="text-sm font-medium">
          Project Name <span className="text-destructive">*</span>
        </Label>
        {mode === "add" ? (
          <>
            <Textarea
              id="proj-name"
              placeholder={"Project Alpha\nProject Beta"}
              value={form.names}
              onChange={e => onChange({ names: e.target.value })}
              rows={3}
              className="resize-none font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">One name per line to create multiple projects.</p>
          </>
        ) : (
          <Input
            id="proj-name"
            value={form.names}
            onChange={e => onChange({ names: e.target.value })}
            placeholder="Project name"
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="proj-desc" className="text-sm font-medium">Description</Label>
        <Textarea
          id="proj-desc"
          placeholder="Brief description…"
          value={form.description}
          onChange={e => onChange({ description: e.target.value })}
          rows={2}
          className="resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Priority</Label>
          <Select value={form.priority} onValueChange={val => onChange({ priority: val as "high" | "medium" | "low" })}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full shrink-0", o.dot)} />
                    {o.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Status</Label>
          <Select value={form.lifecycleStatus} onValueChange={val => onChange({ lifecycleStatus: val })}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="start-date" className="text-sm font-medium">Start Date</Label>
          <Input id="start-date" type="date" className="h-9"
            value={form.startDate ?? ""}
            onChange={e => onChange({ startDate: e.target.value || null })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end-date" className="text-sm font-medium">End Date</Label>
          <Input id="end-date" type="date" className="h-9"
            value={form.endDate ?? ""}
            min={form.startDate ?? undefined}
            onChange={e => onChange({ endDate: e.target.value || null })}
          />
          {form.startDate && form.endDate && form.endDate < form.startDate && (
            <p className="text-xs text-destructive">Must be after start date.</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Billable</p>
          <p className="text-xs text-muted-foreground">Track billable hours and costs.</p>
        </div>
        <Switch checked={form.billable} onCheckedChange={val => onChange({ billable: val })} />
      </div>
    </div>
  )
}

// ─── Members Tab ──────────────────────────────────────────────────────────────

function MembersTab({ projectId, allMembers }: {
  projectId: number | null
  allMembers: ISimpleMember[]
}) {
  const [assigned, setAssigned]       = useState<ProjectMemberRow[]>([])
  const [loading, setLoading]         = useState(false)
  const [search, setSearch]           = useState("")
  const [adding, setAdding]           = useState<number | null>(null)
  const [removing, setRemoving]       = useState<number | null>(null)
  const [roleChanging, setRoleChanging] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    const res = await getProjectMembers(projectId)
    if (res.success) setAssigned(res.data)
    setLoading(false)
  }, [projectId])

  useEffect(() => { load() }, [load])

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
        <UserPlus className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">Save the project first</p>
        <p className="text-xs text-muted-foreground/60">Members can be added after creating the project.</p>
      </div>
    )
  }

  const assignedIds = new Set(assigned.map(m => m.organization_member_id))
  const available = allMembers.filter(m =>
    !assignedIds.has(Number(m.id)) &&
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async (memberId: number) => {
    setAdding(memberId)
    await addProjectMember(projectId, memberId)
    await load()
    setAdding(null)
  }

  const handleRemove = async (memberId: number) => {
    setRemoving(memberId)
    await removeProjectMember(projectId, memberId)
    await load()
    setRemoving(null)
  }

  const handleRoleChange = async (memberId: number, role: "manager" | "lead" | "member" | "viewer") => {
    setRoleChanging(memberId)
    await updateProjectMemberRole(projectId, memberId, role)
    await load()
    setRoleChanging(null)
  }

  return (
    <div className="space-y-4">
      {/* Assigned */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Assigned ({assigned.length})
        </p>
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />Loading…
          </div>
        ) : assigned.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No members assigned yet.</p>
        ) : (
          <div className="space-y-1 max-h-44 overflow-y-auto pr-0.5">
            {assigned.map(m => (
              <div key={m.organization_member_id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50">
                <Avatar name={m.name} photoUrl={m.photoUrl} />
                <span className="text-sm flex-1 truncate min-w-0">{m.name}</span>
                <Select
                  value={m.role}
                  onValueChange={val => handleRoleChange(m.organization_member_id, val as "manager" | "lead" | "member" | "viewer")}
                  disabled={roleChanging === m.organization_member_id}
                >
                  <SelectTrigger className="h-7 w-[90px] text-xs border border-border/60 bg-transparent px-2 gap-1 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(r => (
                      <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  onClick={() => handleRemove(m.organization_member_id)}
                  disabled={removing === m.organization_member_id}
                  className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                >
                  {removing === m.organization_member_id
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <X className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t" />

      {/* Add */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Add Members</p>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
        </div>
        <div className="space-y-1 max-h-44 overflow-y-auto pr-0.5">
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2 text-center">{search ? "No results" : "All members assigned"}</p>
          ) : available.map(m => (
            <div key={m.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50">
              <Avatar name={m.name} />
              <span className="text-sm flex-1 truncate min-w-0">{m.name}</span>
              <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs shrink-0"
                disabled={adding === Number(m.id)} onClick={() => handleAdd(Number(m.id))}>
                {adding === Number(m.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Teams Tab ────────────────────────────────────────────────────────────────

function TeamsTab({ projectId, allTeams }: {
  projectId: number | null
  allTeams: ITeams[]
}) {
  const [assigned, setAssigned] = useState<ProjectTeamRow[]>([])
  const [loading, setLoading]   = useState(false)
  const [search, setSearch]     = useState("")
  const [adding, setAdding]     = useState<number | null>(null)
  const [removing, setRemoving] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    const res = await getProjectTeams(projectId)
    if (res.success) setAssigned(res.data)
    setLoading(false)
  }, [projectId])

  useEffect(() => { load() }, [load])

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
        <Users className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">Save the project first</p>
        <p className="text-xs text-muted-foreground/60">Teams can be assigned after creating the project.</p>
      </div>
    )
  }

  const assignedIds = new Set(assigned.map(t => t.team_id))
  const available = allTeams.filter(t =>
    t.is_active &&
    !assignedIds.has(t.id) &&
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async (teamId: number) => {
    setAdding(teamId)
    await addProjectTeam(projectId, teamId)
    await load()
    setAdding(null)
  }

  const handleRemove = async (teamId: number) => {
    setRemoving(teamId)
    await removeProjectTeam(projectId, teamId)
    await load()
    setRemoving(null)
  }

  return (
    <div className="space-y-4">
      {/* Assigned */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Assigned Teams ({assigned.length})
        </p>
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />Loading…
          </div>
        ) : assigned.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No teams assigned yet.</p>
        ) : (
          <div className="space-y-1 max-h-44 overflow-y-auto pr-0.5">
            {assigned.map(t => (
              <div key={t.team_id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.member_count} member{t.member_count !== 1 ? "s" : ""}</p>
                </div>
                <button
                  onClick={() => handleRemove(t.team_id)}
                  disabled={removing === t.team_id}
                  className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                >
                  {removing === t.team_id
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <X className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t" />

      {/* Add */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Add Teams</p>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search teams…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
        </div>
        <div className="space-y-1 max-h-44 overflow-y-auto pr-0.5">
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2 text-center">{search ? "No results" : "All teams assigned"}</p>
          ) : available.map(t => (
            <div key={t.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50">
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{t.name}</p>
                {t.description && <p className="text-xs text-muted-foreground truncate">{t.description}</p>}
              </div>
              <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs shrink-0"
                disabled={adding === t.id} onClick={() => handleAdd(t.id)}>
                {adding === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

interface ManageProjectDialogProps {
  mode: "add" | "edit"
  open: boolean
  onOpenChange: (val: boolean) => void
  project: ProjectRow | null
  form: NewProjectForm
  onFormChange: (form: NewProjectForm) => void
  initialTab?: string
  members: ISimpleMember[]
  teams: ITeams[]
  onSave: (formData?: NewProjectForm) => Promise<void>
}

export default function ManageProjectDialog({
  mode, open, onOpenChange, project, form, onFormChange,
  initialTab = "general", members, teams, onSave,
}: ManageProjectDialogProps) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isSaving, setIsSaving]   = useState(false)

  useEffect(() => { setActiveTab(initialTab) }, [initialTab, open])

  const handleChange = (updated: Partial<NewProjectForm>) => onFormChange({ ...form, ...updated })

  const handleSave = async () => {
    setIsSaving(true)
    try { await onSave(form) } finally { setIsSaving(false) }
  }

  const projectId = project ? Number(project.id) : null
  const isFormValid = form.names.trim().length > 0
  const showFooter = activeTab === "general" || activeTab === "budget"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-0 p-0 overflow-hidden w-full max-w-lg max-h-[92dvh] sm:max-h-[85vh]">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <DialogTitle className="text-base font-semibold truncate pr-6">
            {mode === "add" ? "New Project" : `Edit: ${project?.name}`}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          <TabsList className="justify-start rounded-none border-b bg-transparent h-auto px-5 pb-0 pt-0.5 gap-0 shrink-0 overflow-x-auto">
            {(["general", "teams", "members", "budget"] as const).map(tab => (
              <TabsTrigger
                key={tab}
                value={tab}
                className={cn(
                  "rounded-none border-b-2 border-transparent px-3 pb-2 pt-1.5 capitalize text-sm font-medium whitespace-nowrap",
                  "data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  "text-muted-foreground data-[state=active]:text-foreground transition-colors"
                )}
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="general" className="m-0 p-5">
              <GeneralTab form={form} onChange={handleChange} mode={mode} />
            </TabsContent>
            <TabsContent value="teams" className="m-0 p-5">
              <TeamsTab projectId={projectId} allTeams={teams} />
            </TabsContent>
            <TabsContent value="members" className="m-0 p-5">
              <MembersTab projectId={projectId} allMembers={members} />
            </TabsContent>
            <TabsContent value="budget" className="m-0 p-5">
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2 text-muted-foreground">
                <p className="text-sm font-medium">Budget settings</p>
                <p className="text-xs opacity-60">Coming soon.</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer — only on tabs that have a save action */}
        {showFooter && (
          <DialogFooter className="px-5 py-3.5 border-t shrink-0 flex-row gap-2 sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!isFormValid || isSaving}>
              {isSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {isSaving ? "Saving…" : mode === "add" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}