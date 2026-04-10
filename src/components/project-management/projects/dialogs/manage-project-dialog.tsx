"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Trash2, Loader2, Search } from "lucide-react"
// FIX: Menghapus MemberLimit yang tidak digunakan
import type { NewProjectForm, ITeams, ISimpleMember, IGroup, Project } from "@/interface"

type ManageProjectDialogProps = {
  mode: "add" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project | null
  form: NewProjectForm
  onFormChange: React.Dispatch<React.SetStateAction<NewProjectForm>>
  onSave: (formData?: NewProjectForm) => void
  members?: ISimpleMember[]
  teams?: ITeams[]
  groups?: IGroup[]
  initialTab?: string
}

export default function ManageProjectDialog(props: ManageProjectDialogProps) {
  const { 
    mode, open, onOpenChange, form, onFormChange, 
    onSave, members = [], teams = [], groups = [], initialTab 
  } = props

  const isAdd = mode === "add"
  const [isReady, setIsReady] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("general")
  const [memberSearch, setMemberSearch] = useState("")
  const [selectedDept, setSelectedDept] = useState<string>("all")
  const hasOpened = useRef(false)

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined
    if (open) {
      setActiveTab(initialTab ?? "general")
      setMemberSearch("")
      setSelectedDept("all")
      
      if (!hasOpened.current) {
        hasOpened.current = true
        t = setTimeout(() => setIsReady(true), 50)
      } else {
        setIsReady(true)
      }
    }
    return () => { if (t) clearTimeout(t) }
  }, [open, initialTab])

  const filteredMembers = useMemo(() => {
    let result = members
    if (selectedDept !== "all") result = result.filter(m => m.department_id === selectedDept)
    const q = memberSearch.trim().toLowerCase()
    if (q) result = result.filter(m => m.name.toLowerCase().includes(q))
    return result
  }, [members, selectedDept, memberSearch])

  const toggleMember = (id: string) => {
    const current = new Set(form.members || [])
    if (current.has(id)) current.delete(id); else current.add(id)
    onFormChange(s => ({ ...s, members: Array.from(current) }))
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { if(!val) setIsReady(false); onOpenChange(val); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isAdd ? "New project" : "Edit project"}</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        {!isReady ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="general">GENERAL</TabsTrigger>
              <TabsTrigger value="members">
                MEMBERS {!isAdd && (form.members?.length ?? 0) > 0 ? `(${form.members?.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="budget">BUDGET & LIMITS</TabsTrigger>
              <TabsTrigger value="teams">TEAMS</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium uppercase">{isAdd ? "Project Names*" : "Project Name*"}</div>
                <Textarea
                  value={form.names}
                  onChange={(e) => onFormChange(s => ({ ...s, names: e.target.value }))}
                  placeholder={isAdd ? "Add project names separated by new lines" : "Edit project name"}
                  rows={4}
                />
              </div>
              <div className="space-y-3">
                {[
                  { label: "Billable", key: "billable" },
                  { label: "Disable activity", key: "disableActivity" },
                  { label: "Allow project tracking", key: "allowTracking" },
                  { label: "Disable idle time", key: "disableIdle" }
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between gap-3">
                    <span className="text-sm">{item.label}</span>
                    <Switch 
                      checked={(form as any)[item.key]} 
                      onCheckedChange={(v) => onFormChange(s => ({ ...s, [item.key]: v }))} 
                    />
                  </label>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="members" className="space-y-5">
              {isAdd ? (
                (["0", "1", "2"] as const).map((idx, i) => {
                  const labels = ["MANAGERS", "USERS", "VIEWERS"] as const;
                  const descs = ["Oversees and manages the project", "Works on the project", "Can view team reports"] as const;
                  
                  // FIX: Gunakan variabel lokal agar TS tahu nilai tidak akan undefined saat dipakai
                  const currentLabel = labels[i] ?? "MEMBER";
                  const currentPlaceholder = labels[i]?.toLowerCase() ?? "member";

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="text-xs font-semibold text-muted-foreground">{currentLabel}</div>
                      <div className="text-xs text-muted-foreground">{descs[i]}</div>
                      <Select
                        value={form.members?.[i] || "none"}
                        onValueChange={(v) => {
                          const newMembers = [...(form.members || [])]
                          newMembers[i] = v === "none" ? "" : v
                          onFormChange(prev => ({ ...prev, members: newMembers }))
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={`Select ${currentPlaceholder}`} />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SelectItem value="none">— None —</SelectItem>
                          {members.map(m => {
                            const isAssigned = [0, 1, 2].filter(x => x !== i).some(x => form.members?.[x] === m.id)
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
                })
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="Search members..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="pl-8 h-8 text-sm" />
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
                    <span>{filteredMembers.length} member(s) shown</span>
                    <div className="flex gap-3">
                      <button type="button" className="text-foreground underline" onClick={() => {
                        const current = new Set(form.members || [])
                        filteredMembers.forEach(m => current.add(m.id))
                        onFormChange(s => ({ ...s, members: Array.from(current) }))
                      }}>Select all</button>
                      <button type="button" className="text-muted-foreground underline" onClick={() => {
                        const fIds = new Set(filteredMembers.map(m => m.id))
                        onFormChange(s => ({ ...s, members: (s.members || []).filter(id => !fIds.has(id)) }))
                      }}>Clear</button>
                    </div>
                  </div>
                  <ScrollArea className="h-[240px] w-full rounded-md border p-3">
                    <div className="space-y-1">
                      {filteredMembers.map(m => (
                        <label key={m.id} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted cursor-pointer">
                          <Checkbox checked={new Set(form.members).has(m.id)} onCheckedChange={() => toggleMember(m.id)} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm leading-none">{m.name}</div>
                            {m.department_id && <div className="text-xs text-muted-foreground mt-0.5">
                              {groups.find(g => String(g.id) === m.department_id)?.name}
                            </div>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </TabsContent>

            <TabsContent value="budget">
              <Tabs defaultValue="project-budget">
                <TabsList className="mb-4">
                  <TabsTrigger value="project-budget">Project budget</TabsTrigger>
                  <TabsTrigger value="member-limits">Member limits</TabsTrigger>
                </TabsList>
                <TabsContent value="project-budget" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Type*</label>
                      <Select value={form.budgetType || "none"} onValueChange={(v) => onFormChange(s => ({ ...s, budgetType: v === "none" ? "" : v }))}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent><SelectItem value="none">— Select —</SelectItem><SelectItem value="hours">Hours</SelectItem><SelectItem value="cost">Cost</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Based On*</label>
                      <Select value={form.budgetBasedOn || "none"} onValueChange={(v) => onFormChange(s => ({ ...s, budgetBasedOn: v === "none" ? "" : v }))}>
                        <SelectTrigger><SelectValue placeholder="Select rate" /></SelectTrigger>
                        <SelectContent><SelectItem value="none">— Select —</SelectItem><SelectItem value="tracked-time">Tracked Time</SelectItem><SelectItem value="billable-time">Billable Time</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Cost*</label>
                      <div className="flex">
                        <div className="flex items-center justify-center bg-muted px-3 border border-r-0 rounded-l-md text-sm text-muted-foreground">$</div>
                        <Input type="number" value={form.budgetCost} onChange={(e) => onFormChange(s => ({ ...s, budgetCost: e.target.value }))} className="rounded-l-none" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={form.budgetNotifyMembers} onCheckedChange={(v) => onFormChange(s => ({ ...s, budgetNotifyMembers: v }))} />
                      <label className="text-sm">Notify project members</label>
                    </div>
                    {form.budgetNotifyMembers && (
                      <div className="grid grid-cols-2 gap-4 pl-8">
                        <div className="space-y-2">
                          <label className="text-xs">NOTIFY AT</label>
                          <div className="flex gap-2">
                            <Input type="number" value={form.budgetNotifyAt} onChange={(e) => onFormChange(s => ({ ...s, budgetNotifyAt: e.target.value }))} className="flex-1" />
                            <div className="flex items-center px-3 bg-muted border rounded-md text-xs">% of budget</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs">WHO TO NOTIFY</label>
                          <Select value={form.budgetNotifyWho || "none"} onValueChange={(v) => onFormChange(s => ({ ...s, budgetNotifyWho: v === "none" ? "" : v }))}>
                            <SelectTrigger><SelectValue placeholder="Select who" /></SelectTrigger>
                            <SelectContent><SelectItem value="none">— Select —</SelectItem><SelectItem value="managers">Managers only</SelectItem><SelectItem value="all">All members</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Switch checked={form.budgetStopTimers} onCheckedChange={(v) => onFormChange(s => ({ ...s, budgetStopTimers: v }))} />
                      <label className="text-sm">Stop timers when budget is reached</label>
                    </div>
                    {form.budgetStopTimers && (
                      <div className="pl-8 space-y-2">
                        <label className="text-xs">STOP TIMERS AT</label>
                        <div className="flex gap-2">
                          <Input type="number" value={form.budgetStopAt} onChange={(e) => onFormChange(s => ({ ...s, budgetStopAt: e.target.value }))} className="flex-1" />
                          <div className="flex items-center px-3 bg-muted border rounded-md text-xs">% of budget</div>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase">Resets*</label>
                        <Select value={form.budgetResets} onValueChange={(v) => onFormChange(s => ({ ...s, budgetResets: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="never">Never</SelectItem><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase">Start Date</label>
                        <Input type="date" value={form.startDate || ""} onChange={(e) => onFormChange(s => ({ ...s, startDate: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="member-limits" className="space-y-4">
                  <div className={`space-y-4 ${form.memberLimits.length > 1 ? "max-h-[300px] overflow-y-auto pr-2" : ""}`}>
                    {form.memberLimits.map((limit, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4 relative">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold">MEMBER</label>
                          <Select value={limit.members?.[0] || "none"} onValueChange={(v) => {
                            const n = [...form.memberLimits]; n[index] = { ...limit, members: v === "none" ? [] : [v] };
                            onFormChange(s => ({ ...s, memberLimits: n }))
                          }}>
                            <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                            <SelectContent className="max-h-60">
                              <SelectItem value="none">— None —</SelectItem>
                              {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          {["type", "basedOn", "cost"].map((f) => (
                            <div key={f} className="space-y-2">
                              <label className="text-xs uppercase">{f}*</label>
                              {f === "cost" ? (
                                <Input type="number" value={limit.cost} onChange={(e) => {
                                  const n = [...form.memberLimits]; n[index] = { ...limit, cost: e.target.value };
                                  onFormChange(s => ({ ...s, memberLimits: n }))
                                }} />
                              ) : (
                                <Select value={(limit as any)[f] || "none"} onValueChange={(v) => {
                                  const n = [...form.memberLimits]; (n[index] as any)[f] = v === "none" ? "" : v;
                                  onFormChange(s => ({ ...s, memberLimits: n }))
                                }}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">— Select —</SelectItem>
                                    {f === "type" ? ["daily", "weekly", "total"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>) : ["hours", "cost"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          ))}
                        </div>
                        {form.memberLimits.length > 1 && (
                          <Button variant="ghost" size="sm" className="text-destructive h-8" onClick={() => onFormChange(s => ({ ...s, memberLimits: s.memberLimits.filter((_, i) => i !== index) }))}>
                            <Trash2 className="h-4 w-4 mr-2" /> Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="text-sm text-foreground underline" onClick={() => onFormChange(s => ({ ...s, memberLimits: [...s.memberLimits, { members: [], type: "", basedOn: "", cost: "", resets: "never", startDate: null }] }))}>+ Add member limit</button>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="teams" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-muted-foreground uppercase">Teams</div>
                <button type="button" className="text-sm text-foreground underline" onClick={() => onFormChange(s => ({ ...s, teams: teams.map(t => String(t.id)) }))}>Select all</button>
              </div>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                <div className="space-y-4">
                  {teams.map((team) => (
                    <div key={team.id} className="flex items-center space-x-2">
                      <Checkbox id={`team-${team.id}`} checked={!!form.teams?.includes(String(team.id))} onCheckedChange={(checked) => {
                        const current = new Set(form.teams || [])
                        if (checked) current.add(String(team.id)); else current.delete(String(team.id))
                        onFormChange(prev => ({ ...prev, teams: Array.from(current) }))
                      }} />
                      <label htmlFor={`team-${team.id}`} className="text-sm leading-none">{team.name} {team.description && <span className="text-muted-foreground ml-1.5 text-xs">— {team.description}</span>}</label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={!isReady || !form.names.trim()}>
            {isAdd ? "Save" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}