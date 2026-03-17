"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { toast } from "sonner"
import { Check, Loader2, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useHydration } from "@/hooks/useHydration"
import { getAllOrganization_member } from "@/action/members"
import { getAllWorkSchedules } from "@/action/schedule"
import {
  createMemberSchedule,
  getActiveMemberScheduleMemberIds,
} from "@/action/member-schedule"
import { IOrganization_member, IWorkSchedule } from "@/interface"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { SearchBar } from "@/components/customs/search-bar"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const memberScheduleSchema = z.object({
  organization_member_id: z.string().min(1, "Member is required"),
  work_schedule_id: z.string().min(1, "Work schedule is required"),
  effective_date: z.string().min(1, "Effective date is required"),
})

const memberScheduleBatchSchema = z.object({
  work_schedule_id: z.string().min(1, "Work schedule is required"),
  effective_date: z.string().min(1, "Effective date is required"),
})

type MemberScheduleForm = z.infer<typeof memberScheduleSchema>
type MemberScheduleBatchForm = z.infer<typeof memberScheduleBatchSchema>

const toFriendlyAssignError = (raw: string) => {
  const message = String(raw || "").trim()
  const lower = message.toLowerCase()

  if (lower.includes("already has an active schedule")) {
    return "Member sudah memiliki jadwal aktif. Nonaktifkan jadwal lama terlebih dahulu."
  }

  return message || "Gagal menyimpan jadwal."
}

export function MemberScheduleAssignForm() {
  const router = useRouter()
  const { organizationId, isReady } = useHydration()

  const [members, setMembers] = React.useState<IOrganization_member[]>([])
  const [workSchedules, setWorkSchedules] = React.useState<IWorkSchedule[]>([])
  const [activeMemberIds, setActiveMemberIds] = React.useState<string[]>([])
  const [lookupsLoading, setLookupsLoading] = React.useState(false)

  const [memberDialogOpen, setMemberDialogOpen] = React.useState(false)
  const [memberDialogMode, setMemberDialogMode] = React.useState<"single" | "batch">("single")
  const [memberSearch, setMemberSearch] = React.useState("")
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("all")
  const [departments, setDepartments] = React.useState<string[]>([])

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [activeTab, setActiveTab] = React.useState("single")
  const [batchMemberIds, setBatchMemberIds] = React.useState<string[]>([])

  const membersWithActiveSchedule = React.useMemo(() => {
    return new Set<string>((activeMemberIds || []).map((id) => String(id)))
  }, [activeMemberIds])

  const getMemberDisplayName = React.useCallback((member: IOrganization_member) => {
    const user = member.user as
      | {
        first_name?: string;
        last_name?: string; email?: string
      }
      | undefined
    const name = user
      ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email
      : "Unknown"
    return name || "Unknown"
  }, [])

  const membersSorted = React.useMemo(() => {
    return [...members].sort((a, b) => {
      const nameA = getMemberDisplayName(a).toLowerCase()
      const nameB = getMemberDisplayName(b).toLowerCase()
      return nameA.localeCompare(nameB, "id")
    })
  }, [members, getMemberDisplayName])

  const getMemberDepartment = React.useCallback((member: IOrganization_member) => {
    const anyMember = member as any
    const dept = anyMember?.departments
    if (Array.isArray(dept) && dept.length > 0) return String(dept[0]?.name || "")
    if (dept && typeof dept === "object") return String(dept?.name || "")
    const groups = anyMember?.groups
    if (groups && typeof groups === "object") return String(groups?.name || "")
    return ""
  }, [])

  const form = useForm<MemberScheduleForm>({
    resolver: zodResolver(memberScheduleSchema),
    defaultValues: {
      organization_member_id: "",
      work_schedule_id: "",
      effective_date: new Date().toISOString().split("T")[0],
    },
    mode: "onChange",
  })

  React.useEffect(() => {
    if (!isReady) return
    if (organizationId === null) return

    const fetchLookups = async () => {
      try {
        setLookupsLoading(true)
        const [membersRes, workSchedulesRes, activeIdsRes] = await Promise.all([
          getAllOrganization_member(organizationId),
          getAllWorkSchedules(organizationId),
          getActiveMemberScheduleMemberIds(organizationId),
        ])

        if (membersRes && (membersRes as any)?.success && Array.isArray((membersRes as any).data)) {
          setMembers((membersRes as any).data as IOrganization_member[])
        }

        if (membersRes && (membersRes as any)?.success && Array.isArray((membersRes as any).data)) {
          const list = (membersRes as any).data as IOrganization_member[]
          const deptNames = Array.from(
            new Set(list.map((m) => getMemberDepartment(m)).filter(Boolean))
          ).sort()
          setDepartments(deptNames)
        }

        if (
          workSchedulesRes &&
          (workSchedulesRes as any)?.success &&
          Array.isArray((workSchedulesRes as any).data)
        ) {
          setWorkSchedules((workSchedulesRes as any).data as IWorkSchedule[])
        }

        if (activeIdsRes && (activeIdsRes as any)?.success && Array.isArray((activeIdsRes as any).data)) {
          setActiveMemberIds((activeIdsRes as any).data as string[])
        }
      } catch {
        // ignore; form still usable with limited options
      } finally {
        setLookupsLoading(false)
      }
    }

    fetchLookups()
  }, [isReady, organizationId])

  const onSubmit = async (values: MemberScheduleForm) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const payload = {
        organization_member_id: values.organization_member_id,
        work_schedule_id: values.work_schedule_id,
        effective_date: values.effective_date,
        is_active: true,
      }

      const result = await createMemberSchedule(payload)
      if (result?.success) {
        toast.success("Schedule assigned successfully")
        router.push("/schedule/member")
        return
      }

      const friendly = toFriendlyAssignError(String(result?.message || ""))
      const lower = String(result?.message || "").toLowerCase()
      if (lower.includes("already") || lower.includes("active") || lower.includes("exists") || lower.includes("duplicate")) {
        toast.warning(friendly)
      } else {
        toast.error(friendly)
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const batchForm = useForm<MemberScheduleBatchForm>({
    resolver: zodResolver(memberScheduleBatchSchema),
    defaultValues: {
      work_schedule_id: "",
      effective_date: new Date().toISOString().split("T")[0],
    },
    mode: "onChange",
  })

  const onSubmitBatch = async (values: MemberScheduleBatchForm) => {
    if (isSubmitting) return

    if (batchMemberIds.length === 0) {
      toast.warning("Pilih minimal 1 member")
      return
    }

    setIsSubmitting(true)
    try {
      let successCount = 0
      let failCount = 0

      for (const memberId of batchMemberIds) {
        const res = await createMemberSchedule({
          organization_member_id: memberId,
          work_schedule_id: values.work_schedule_id,
          effective_date: values.effective_date,
          is_active: true,
        })

        if (res?.success) successCount += 1
        else failCount += 1
      }

      if (successCount > 0 && failCount === 0) {
        toast.success(`Berhasil assign ke ${successCount} member`)
        router.push("/schedule/member")
        return
      }

      if (successCount > 0 && failCount > 0) {
        toast.warning(`Sebagian berhasil: ${successCount} berhasil, ${failCount} gagal`)
        router.push("/schedule/member")
        return
      }

      toast.error("Gagal assign jadwal")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getMemberLabelById = React.useCallback((id: string) => {
    const m = members.find((x) => String(x.id) === String(id))
    return m ? getMemberDisplayName(m) : "Unknown"
  }, [members, getMemberDisplayName])

  const openMemberDialog = (mode: "single" | "batch") => {
    setMemberDialogMode(mode)
    setMemberSearch("")
    setDepartmentFilter("all")
    setMemberDialogOpen(true)
  }

  const filteredMembersForDialog = React.useMemo(() => {
    const q = memberSearch.trim().toLowerCase()
    return membersSorted.filter((m) => {
      const dept = getMemberDepartment(m)
      if (departmentFilter !== "all" && dept !== departmentFilter) return false

      if (!q) return true
      const name = getMemberDisplayName(m).toLowerCase()
      const email = String((m as any)?.user?.email ?? "").toLowerCase()
      const deptLower = String(dept).toLowerCase()
      return name.includes(q) || email.includes(q) || deptLower.includes(q)
    })
  }, [departmentFilter, memberSearch, membersSorted, getMemberDepartment, getMemberDisplayName])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-base font-semibold">Assign Work Schedule</div>
        <div className="text-sm text-muted-foreground">
          Assign jadwal kerja ke member (Single atau Batch).
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="single">Single Entry</TabsTrigger>
          <TabsTrigger value="batch">Batch Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="organization_member_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Member *</FormLabel>
                    <FormControl>
                      <Button
                        variant="outline"
                        type="button"
                        className={cn(
                          "w-full justify-between font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={lookupsLoading}
                        onClick={() => openMemberDialog("single")}
                      >
                        {field.value
                          ? (() => {
                            const m = members.find((x) => String(x.id) === String(field.value))
                            const label = m ? getMemberDisplayName(m) : "Unknown"
                            const dept = m ? getMemberDepartment(m) : ""
                            return dept ? `${label} (${dept})` : label
                          })()
                          : "Choose a member..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="work_schedule_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Schedule *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={lookupsLoading}>
                          <SelectValue placeholder="Select work schedule" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workSchedules.map((schedule) => (
                          <SelectItem key={schedule.id} value={String(schedule.id)}>
                            {schedule.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="effective_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={lookupsLoading || isSubmitting}>
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Assign"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="batch" className="pt-4">
          <Form {...batchForm}>
            <form onSubmit={batchForm.handleSubmit(onSubmitBatch)} className="space-y-4">
              <FormItem>
                <FormLabel>Select Members *</FormLabel>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full justify-between font-normal"
                    disabled={lookupsLoading}
                    onClick={() => openMemberDialog("batch")}
                  >
                    {batchMemberIds.length > 0
                      ? `${batchMemberIds.length} selected`
                      : "Choose members..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>

                  {batchMemberIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {batchMemberIds.map((id) => (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                        >
                          <span className="max-w-[220px] truncate">{getMemberLabelById(id)}</span>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => setBatchMemberIds((prev) => prev.filter((x) => x !== id))}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </FormItem>

              <FormField
                control={batchForm.control}
                name="work_schedule_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Schedule *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={lookupsLoading}>
                          <SelectValue placeholder="Select work schedule" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workSchedules.map((schedule) => (
                          <SelectItem key={schedule.id} value={String(schedule.id)}>
                            {schedule.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={batchForm.control}
                name="effective_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={lookupsLoading || isSubmitting}>
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Assign"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>

      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent
          className="w-full max-w-[560px] max-h-[80vh] overflow-hidden p-0"
          aria-labelledby="member-dialog-title"
          aria-describedby="member-dialog-description"
        >
          <div className="flex h-full max-h-[80vh] flex-col">
            <div className="px-6 pt-6">
              <DialogHeader>
                <DialogTitle id="member-dialog-title">Select Member</DialogTitle>
                <p id="member-dialog-description" className="sr-only">
                  Search and select members to assign work schedules
                </p>
              </DialogHeader>
            </div>

            <div className="px-6 pt-3 space-y-3">
              <div className="space-y-2">
                <div className="text-sm font-medium">Filter by Department</div>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <SearchBar
                  placeholder="Search member name or department..."
                  initialQuery={memberSearch}
                  onSearch={setMemberSearch}
                  className="w-full md:w-[300px]"
                />
              </div>
            </div>

            <div className="px-6 py-3 flex-1 overflow-hidden">
              <div className="border rounded-md h-full overflow-hidden" role="listbox" aria-label="Available members">
                <div className="h-full overflow-y-auto">
                  {lookupsLoading && members.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">Loading...</div>
                  ) : filteredMembersForDialog.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">No results.</div>
                  ) : (
                    <div className="divide-y">
                      {filteredMembersForDialog.map((m) => {
                        const id = String(m.id)
                        const name = getMemberDisplayName(m)
                        const dept = getMemberDepartment(m)
                        const disabled = membersWithActiveSchedule.has(id)
                        const selected =
                          memberDialogMode === "batch"
                            ? batchMemberIds.includes(id)
                            : String(form.getValues("organization_member_id")) === id

                        return (
                          <button
                            key={id}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              if (memberDialogMode === "single") {
                                form.setValue("organization_member_id", id, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                })
                                setMemberDialogOpen(false)
                                return
                              }

                              setBatchMemberIds((prev) =>
                                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                              )
                            }}
                            className={cn(
                              "w-full text-left px-4 py-3 flex items-start gap-3",
                              disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/40"
                            )}
                          >
                            <div className="pt-0.5">
                              <Check className={cn("h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{name}</div>
                              <div className="text-xs text-muted-foreground truncate">{dept || "-"}</div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {memberDialogMode === "batch" && batchMemberIds.length > 0 && (
              <div className="px-6 pb-3">
                <div className="flex flex-wrap gap-2">
                  {batchMemberIds.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                    >
                      <span className="max-w-[220px] truncate">{getMemberLabelById(id)}</span>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => setBatchMemberIds((prev) => prev.filter((x) => x !== id))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="px-6 pb-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setMemberDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
