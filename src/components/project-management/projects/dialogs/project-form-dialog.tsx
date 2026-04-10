"use client"

import React, { useEffect, useState, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Trash2, Search, Loader2 } from "lucide-react"
import type { NewProjectForm, Project, ITeams, ISimpleMember, IGroup } from "@/interface"

const getTodayString = () => {
    try {
        return (new Date().toISOString().split("T")[0] || "") as string
    } catch {
        return ""
    }
}

const emptyForm: NewProjectForm = {
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
    startDate: getTodayString(),
    budgetIncludeNonBillable: false,
    memberLimits: [{ members: [], type: "", basedOn: "", cost: "", resets: "never", startDate: "" }],
    memberLimitNotifyAt: "80",
    memberLimitNotifyMembers: false,
}

type ProjectFormDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    project?: Project | null // Presences signifies Edit Mode
    onSave: (form: NewProjectForm) => void | Promise<void>
    initialTab?: "general" | "members" | "budget" | "teams"
    members?: ISimpleMember[]
    teams?: ITeams[]
    groups?: IGroup[]
}

export default function ProjectFormDialog(props: ProjectFormDialogProps) {
    const { open, onOpenChange, project, onSave, initialTab, members = [], teams = [], groups = [] } = props
    const [form, setForm] = useState<NewProjectForm>(emptyForm)
    const [tab, setTab] = useState<"general" | "members" | "budget" | "teams">("general")
    
    // UI state
    const [memberSearch, setMemberSearch] = useState("")
    const [selectedDept, setSelectedDept] = useState<string>("all")

    // ── Track if dialog has been opened at least once (lazy init to prevent DOM blocking on long lists) ─────────────
    const hasOpened = useRef(false)
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        let t: ReturnType<typeof setTimeout> | undefined
        if (open && !hasOpened.current) {
            hasOpened.current = true
            t = setTimeout(() => setIsReady(true), 50)
        } else if (open) {
            setIsReady(true)
        }
        return () => { if (t) clearTimeout(t) }
    }, [open])

    useEffect(() => {
        if (open) {
            setTab(initialTab ?? "general")
            setMemberSearch("")
            setSelectedDept("all")
            
            if (project) {
                // Initializing existing project details for editing mode
                setForm(s => ({
                    ...s,
                    names: project.name,
                    members: project.members?.map(m => m.id) || [],
                    teams: project.teams?.map(t => {
                        const matched = teams.find(team => team.name === t)
                        return matched ? String(matched.id) : t
                    }) || [],
                    startDate: null,
                }))
            } else {
                // Unify states. For add project, we don't fully recreate emptyForm on *every* open, 
                // so consecutive form additions preserve previous settings. 
                // BUT we clear it if the last add finished successfully (handled in handleSave).
                if (!form.names) {
                    setForm(s => ({ ...s, startDate: getTodayString() }))
                }
            }
        } else {
            if (!open) {
                setIsReady(false)
            }
        }
    }, [open, project, teams, initialTab]) // removed form.names dependency intentionally

    const handleSave = async () => {
        await onSave(form)
        if (!project) {
            // Addition mode: keep the settings, reset only the "names" after save so we can add multiple consecutively
            setForm(prev => ({ ...prev, names: "" }))
        }
    }

    const filteredMembers = useMemo(() => {
        let result = members
        if (selectedDept !== "all") result = result.filter(m => m.department_id === selectedDept)
        const q = memberSearch.trim().toLowerCase()
        if (q) result = result.filter(m => m.name.toLowerCase().includes(q))
        return result
    }, [members, selectedDept, memberSearch])

    const selectedMemberIds = new Set(form.members || [])

    const toggleMember = (id: string) => {
        const current = new Set(form.members || [])
        if (current.has(id)) current.delete(id); else current.add(id)
        setForm(s => ({ ...s, members: Array.from(current) }))
    }

    const selectAllFiltered = () => {
        const current = new Set(form.members || [])
        filteredMembers.forEach(m => current.add(m.id))
        setForm(s => ({ ...s, members: Array.from(current) }))
    }

    const clearAllFiltered = () => {
        const filteredIds = new Set(filteredMembers.map(m => m.id))
        setForm(s => ({ ...s, members: (s.members || []).filter(id => !filteredIds.has(id)) }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
                    <DialogDescription />
                </DialogHeader>

                {!isReady ? (
                    <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading...</span>
                    </div>
                ) : (
                    <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="general">GENERAL</TabsTrigger>
                            <TabsTrigger value="members">
                                MEMBERS {project ? ((form.members?.length ?? 0) > 0 ? `(${form.members?.length})` : "") : ""}
                            </TabsTrigger>
                            <TabsTrigger value="budget">BUDGET & LIMITS</TabsTrigger>
                            <TabsTrigger value="teams">TEAMS</TabsTrigger>
                        </TabsList>

                        {/* ── General ── */}
                        <TabsContent value="general" className="space-y-4">
                            <div className="space-y-2">
                                <div className="text-sm font-medium">{project ? "PROJECT NAME*" : "PROJECT NAMES*"}</div>
                                <Textarea 
                                    value={form.names} 
                                    onChange={(e) => setForm(s => ({ ...s, names: e.target.value }))} 
                                    placeholder={project ? "Edit project name" : "Add project names separated by new lines"} 
                                    rows={4} 
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="flex items-center justify-between gap-3">
                                    <span className="text-sm">Billable</span>
                                    <Switch checked={form.billable} onCheckedChange={(v) => setForm(s => ({ ...s, billable: v }))} />
                                </label>
                                <label className="flex items-center justify-between gap-3">
                                    <span className="text-sm">Disable activity</span>
                                    <Switch checked={form.disableActivity} onCheckedChange={(v) => setForm(s => ({ ...s, disableActivity: v }))} />
                                </label>
                                <label className="flex items-center justify-between gap-3">
                                    <span className="text-sm">Allow project tracking</span>
                                    <Switch checked={form.allowTracking} onCheckedChange={(v) => setForm(s => ({ ...s, allowTracking: v }))} />
                                </label>
                                <label className="flex items-center justify-between gap-3">
                                    <span className="text-sm">Disable idle time</span>
                                    <Switch checked={form.disableIdle} onCheckedChange={(v) => setForm(s => ({ ...s, disableIdle: v }))} />
                                </label>
                            </div>
                        </TabsContent>

                        {/* ── Members ── */}
                        <TabsContent value="members" className="space-y-3">
                            {project ? (
                                /* List View for members (as seen in Edit mode previously) */
                                <>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                placeholder="Search members..."
                                                value={memberSearch}
                                                onChange={e => setMemberSearch(e.target.value)}
                                                className="pl-8 h-8 text-sm"
                                            />
                                        </div>
                                        <Select value={selectedDept} onValueChange={setSelectedDept}>
                                            <SelectTrigger className="w-[160px] h-8 text-sm">
                                                <SelectValue placeholder="Groups" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Groups</SelectItem>
                                                {groups.map(dept => (
                                                    <SelectItem key={dept.id} value={String(dept.id)}>{dept.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{filteredMembers.length} member{filteredMembers.length !== 1 ? "s" : ""} shown</span>
                                        <div className="flex gap-3">
                                            <button type="button" onClick={selectAllFiltered} className="text-foreground underline underline-offset-2 hover:opacity-70 bg-transparent border-0 cursor-pointer">Select all</button>
                                            <button type="button" onClick={clearAllFiltered} className="text-muted-foreground underline underline-offset-2 hover:opacity-70 bg-transparent border-0 cursor-pointer">Clear</button>
                                        </div>
                                    </div>

                                    <ScrollArea className="h-[240px] w-full rounded-md border p-3">
                                        <div className="space-y-1">
                                            {filteredMembers.length === 0 ? (
                                                <p className="text-xs text-muted-foreground py-4 text-center">No members found.</p>
                                            ) : filteredMembers.map(m => {
                                                const dept = groups.find(g => String(g.id) === m.department_id)
                                                return (
                                                    <label key={m.id} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted cursor-pointer">
                                                        <Checkbox
                                                            checked={selectedMemberIds.has(m.id)}
                                                            onCheckedChange={() => toggleMember(m.id)}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm leading-none">{m.name}</div>
                                                            {dept && <div className="text-xs text-muted-foreground mt-0.5">{dept.name}</div>}
                                                        </div>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </ScrollArea>

                                    {(form.members?.length ?? 0) > 0 && (
                                        <p className="text-xs text-muted-foreground">{form.members?.length} member{form.members?.length !== 1 ? "s" : ""} selected</p>
                                    )}
                                </>
                            ) : (
                                /* Role Selection fields (as seen in Add mode previously) */
                                <div className="space-y-5">
                                    {(["0", "1", "2"] as const).map((idx, i) => {
                                        const labels = ["MANAGERS", "USERS", "VIEWERS"]
                                        const descs = ["Oversees and manages the project", "Works on the project", "Can view team reports"]
                                        const placeholders = ["Select manager", "Select user", "Select viewer"]
                                        return (
                                            <div key={idx} className="space-y-1">
                                                <div className="text-xs font-semibold text-muted-foreground">{labels[i]}</div>
                                                <div className="text-xs text-muted-foreground">{descs[i]}</div>
                                                <Select
                                                    value={form.members?.[i] || "none"}
                                                    onValueChange={(v) => {
                                                        const newMembers = [...(form.members || [])] // Expand safe
                                                        newMembers[i] = v === "none" ? "" : v
                                                        setForm(prev => ({ ...prev, members: newMembers }))
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={placeholders[i]} />
                                                    </SelectTrigger>
                                                    <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                                                        <SelectItem value="none">— None —</SelectItem>
                                                        {members.map(m => {
                                                            const otherIndices = [0, 1, 2].filter(x => x !== i)
                                                            const isAssigned = otherIndices.some(x => form.members?.[x] === m.id)
                                                            return (
                                                                <SelectItem key={m.id} value={m.id} disabled={isAssigned}>
                                                                    {m.name}{isAssigned ? " (Already assigned)" : ""}
                                                                </SelectItem>
                                                            )
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </TabsContent>

                        {/* ── Budget & Limits ── */}
                        <TabsContent value="budget">
                            <Tabs defaultValue="project-budget" className="w-full">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="project-budget">Project budget</TabsTrigger>
                                    <TabsTrigger value="member-limits">Member limits</TabsTrigger>
                                </TabsList>

                                <TabsContent value="project-budget" className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-muted-foreground">TYPE*</label>
                                            <Select value={form.budgetType || "none"} onValueChange={(v) => setForm(s => ({ ...s, budgetType: v === "none" ? "" : v }))}>
                                                <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">— Select —</SelectItem>
                                                    <SelectItem value="hours">Hours</SelectItem>
                                                    <SelectItem value="cost">Cost</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-muted-foreground">BASED ON*</label>
                                            <Select value={form.budgetBasedOn || "none"} onValueChange={(v) => setForm(s => ({ ...s, budgetBasedOn: v === "none" ? "" : v }))}>
                                                <SelectTrigger><SelectValue placeholder="Select a rate" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">— Select —</SelectItem>
                                                    <SelectItem value="tracked-time">Tracked Time</SelectItem>
                                                    <SelectItem value="billable-time">Billable Time</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-muted-foreground">COST*</label>
                                            <div className="flex">
                                                <div className="flex items-center justify-center bg-muted px-3 border border-r-0 rounded-l-md text-sm text-muted-foreground">$</div>
                                                <Input type="number" placeholder="0.0" value={form.budgetCost} onChange={(e) => setForm(s => ({ ...s, budgetCost: e.target.value }))} className="rounded-l-none" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch checked={form.budgetNotifyMembers} onCheckedChange={(v) => setForm(s => ({ ...s, budgetNotifyMembers: v }))} />
                                        <label className="text-sm">Notify project members</label>
                                    </div>
                                    {form.budgetNotifyMembers && (
                                        <div className="grid grid-cols-2 gap-4 pl-8">
                                            <div className="space-y-2">
                                                <label className="text-xs">NOTIFY AT</label>
                                                <div className="flex gap-2">
                                                    <Input type="number" value={form.budgetNotifyAt} onChange={(e) => setForm(s => ({ ...s, budgetNotifyAt: e.target.value }))} className="flex-1" />
                                                    <div className="flex items-center px-3 bg-muted border rounded-md text-sm text-muted-foreground">% of budget</div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs">WHO TO NOTIFY</label>
                                                <Select value={form.budgetNotifyWho || "none"} onValueChange={(v) => setForm(s => ({ ...s, budgetNotifyWho: v === "none" ? "" : v }))}>
                                                    <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">— Select —</SelectItem>
                                                        <SelectItem value="managers">Managers only</SelectItem>
                                                        <SelectItem value="all">All members</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Switch checked={form.budgetStopTimers} onCheckedChange={(v) => setForm(s => ({ ...s, budgetStopTimers: v }))} />
                                        <label className="text-sm">Stop timers when budget is reached</label>
                                    </div>
                                    {form.budgetStopTimers && (
                                        <div className="pl-8 space-y-2">
                                            <label className="text-xs flex items-center gap-1">STOP TIMERS AT <span className="text-muted-foreground">ⓘ</span></label>
                                            <div className="flex gap-2">
                                                <Input type="number" value={form.budgetStopAt} onChange={(e) => setForm(s => ({ ...s, budgetStopAt: e.target.value }))} className="flex-1" />
                                                <div className="flex items-center px-3 bg-muted border rounded-md text-sm text-muted-foreground">% of budget</div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs">RESETS*</label>
                                            <Select value={form.budgetResets} onValueChange={(v) => setForm(s => ({ ...s, budgetResets: v }))}>
                                                <SelectTrigger><SelectValue placeholder="Never" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="never">Never</SelectItem>
                                                    <SelectItem value="daily">Daily</SelectItem>
                                                    <SelectItem value="weekly">Weekly</SelectItem>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs flex items-center gap-1">START DATE <span className="text-muted-foreground">ⓘ</span></label>
                                            <Input type="date" value={form.startDate || ""} onChange={(e) => setForm(s => ({ ...s, startDate: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch checked={form.budgetIncludeNonBillable} onCheckedChange={(v) => setForm(s => ({ ...s, budgetIncludeNonBillable: v }))} />
                                        <label className="text-sm">Include non-billable time</label>
                                    </div>
                                </TabsContent>

                                <TabsContent value="member-limits" className="space-y-4">
                                    <p className="text-sm text-muted-foreground">Member limits aim to stop time tracking at the set amount. Technical factors may occasionally cause a slight overrun.</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2 items-center">
                                            <label className="text-xs">NOTIFY AT</label>
                                            <div className="flex items-center gap-2">
                                                <Input type="number" value={form.memberLimitNotifyAt} onChange={(e) => setForm(s => ({ ...s, memberLimitNotifyAt: e.target.value }))} className="w-20" />
                                                <span className="text-sm bg-muted px-3 py-1.5 rounded-md border text-muted-foreground">% of limit</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch checked={form.memberLimitNotifyMembers} onCheckedChange={(v) => setForm(s => ({ ...s, memberLimitNotifyMembers: v }))} />
                                            <label className="text-sm">Notify project members</label>
                                        </div>
                                    </div>
                                    <div className={`w-full pr-4 space-y-4 ${form.memberLimits.length > 1 ? "max-h-[400px] overflow-y-auto" : ""}`}>
                                        {form.memberLimits.map((limit, index) => (
                                            <div key={index} className="border rounded-lg p-4 space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold">MEMBERS</label>
                                                    <Select value={limit.members?.[0] || "none"} onValueChange={(v) => {
                                                        const newLimits = [...form.memberLimits]
                                                        newLimits[index] = { ...limit, members: v === "none" ? [] : [v] }
                                                        setForm(s => ({ ...s, memberLimits: newLimits }))
                                                    }}>
                                                        <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                                                        <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                                                            <SelectItem value="none">— None —</SelectItem>
                                                            {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs">TYPE*</label>
                                                        <Select value={limit.type || "none"} onValueChange={(v) => { const n = [...form.memberLimits]; n[index] = { ...limit, type: v === "none" ? "" : v }; setForm(s => ({ ...s, memberLimits: n })) }}>
                                                            <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">— Select —</SelectItem>
                                                                <SelectItem value="daily">Daily</SelectItem>
                                                                <SelectItem value="weekly">Weekly</SelectItem>
                                                                <SelectItem value="total">Total</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs">BASED ON*</label>
                                                        <Select value={limit.basedOn || "none"} onValueChange={(v) => { const n = [...form.memberLimits]; n[index] = { ...limit, basedOn: v === "none" ? "" : v }; setForm(s => ({ ...s, memberLimits: n })) }}>
                                                            <SelectTrigger><SelectValue placeholder="Select a rate" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">— Select —</SelectItem>
                                                                <SelectItem value="hours">Hours</SelectItem>
                                                                <SelectItem value="cost">Cost</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs">COST*</label>
                                                        <div className="flex">
                                                            <div className="flex items-center justify-center bg-muted px-3 border border-r-0 rounded-l-md text-sm text-muted-foreground">$</div>
                                                            <Input type="number" placeholder="0.0" value={limit.cost} onChange={(e) => { const n = [...form.memberLimits]; n[index] = { ...limit, cost: e.target.value }; setForm(s => ({ ...s, memberLimits: n })) }} className="rounded-l-none" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs">RESETS*</label>
                                                        <Select value={limit.resets} onValueChange={(v) => { const n = [...form.memberLimits]; n[index] = { ...limit, resets: v }; setForm(s => ({ ...s, memberLimits: n })) }}>
                                                            <SelectTrigger><SelectValue placeholder="Never" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="never">Never</SelectItem>
                                                                <SelectItem value="daily">Daily</SelectItem>
                                                                <SelectItem value="weekly">Weekly</SelectItem>
                                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs">START DATE</label>
                                                        <Input type="date" value={limit.startDate || ""} onChange={(e) => { const n = [...form.memberLimits]; n[index] = { ...limit, startDate: e.target.value }; setForm(s => ({ ...s, memberLimits: n })) }} />
                                                    </div>
                                                </div>
                                                {form.memberLimits.length > 1 && (
                                                    <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setForm(s => ({ ...s, memberLimits: s.memberLimits.filter((_, i) => i !== index) }))}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Remove limit
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" className="text-sm text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity bg-transparent border-0 cursor-pointer" onClick={() => setForm(s => ({ ...s, memberLimits: [...s.memberLimits, { members: [], type: "", basedOn: "", cost: "", resets: "never", startDate: null }] }))}>
                                            + Add member limit
                                        </button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </TabsContent>

                        {/* ── Teams ── */}
                        <TabsContent value="teams" className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">TEAMS</div>
                                <button type="button" className="text-sm text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity bg-transparent border-0 cursor-pointer" onClick={() => setForm(s => ({ ...s, teams: teams.map(t => String(t.id)) }))}>Select all</button>
                            </div>
                            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                                <div className="space-y-4">
                                    {teams.length === 0 ? (
                                        <p className="text-xs text-muted-foreground">No teams available.</p>
                                    ) : teams.map((team) => (
                                        <div key={team.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`edit-team-${team.id}`}
                                                checked={!!form.teams?.includes(String(team.id))}
                                                onCheckedChange={(checked) => {
                                                    const current = new Set(form.teams || [])
                                                    if (checked) current.add(String(team.id)); else current.delete(String(team.id))
                                                    setForm(prev => ({ ...prev, teams: Array.from(current) }))
                                                }}
                                            />
                                            <label htmlFor={`edit-team-${team.id}`} className="text-sm leading-none">
                                                {team.name}
                                                {team.description && <span className="text-muted-foreground ml-1.5 text-xs">— {team.description}</span>}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!isReady || !form.names.trim()}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
