"use client"

import React from "react"
import { toast } from "sonner"
import { type Resolver, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, Plus, Trash } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { PaginationFooter } from "@/components/customs/pagination-footer"

import type { IShiftAssignment } from "@/interface"
import {
  createShiftAssignment,
  deleteShiftAssignment,
  getShiftAssignmentsRange,
  getShiftAssignmentMembersPage,
  updateShiftColor,
  ShiftAssignmentMemberOption,
  ShiftOption,
} from "@/action/shift-assignments"
import { useDebounce } from "@/utils/debounce"

type ApiSuccess<T> = { success: true; data: T }
type ApiFailure = { success: false; message?: string }
type ApiListPage<T> = (ApiSuccess<T[]> | ApiFailure) & { total?: number }

const assignmentSchema = z.object({
  organization_member_ids: z.array(z.string()).min(1, "Member is required"),
  shift_id: z.string().min(1, "Shift is required"),
  color_code: z.string().optional(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  repeat: z.enum(["never", "daily", "interval", "weekly"]).default("never"),
  repeat_interval_days: z.coerce.number().int().min(1).default(1),
  repeat_weekly_days: z.array(z.number().int().min(0).max(6)).default([]),
})

type AssignmentForm = z.infer<typeof assignmentSchema>

interface ShiftAssignmentClientProps {
  organizationId: string
  initialAssignments: IShiftAssignment[]
  members: ShiftAssignmentMemberOption[]
  shifts: ShiftOption[]
  isLoading?: boolean
  pageIndex?: number
  pageSize?: number
  totalRecords?: number
  onPageIndexChange?: (pageIndex: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onRefresh?: () => void
}

const pad2 = (n: number) => String(n).padStart(2, "0")

const toISODate = (d: Date) => {
  const dt = new Date(d)
  dt.setHours(0, 0, 0, 0)
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`
}

const addDays = (d: Date, days: number) => {
  const dt = new Date(d)
  dt.setDate(dt.getDate() + days)
  return dt
}



const startOfDay = (d: Date) => {
  const dt = new Date(d)
  dt.setHours(0, 0, 0, 0)
  return dt
}

const formatWeekRangeLabel = (weekStart: Date) => {
  const weekEnd = addDays(weekStart, 6)
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
  const start = weekStart.toLocaleDateString(undefined, options)
  const end = weekEnd.toLocaleDateString(undefined, options)
  return `${start} - ${end}`
}

const toMemberName = (m: ShiftAssignmentMemberOption) => {
  const u = m.user
  const fullName = [u?.first_name, u?.last_name]
    .filter((p) => p && String(p).trim() !== "")
    .join(" ")
  const name = fullName || u?.display_name
  return typeof name === "string" ? name.trim() : ""
}

const toMemberLabel = (m: ShiftAssignmentMemberOption) => {
  return toMemberName(m)
}

const toShiftLabel = (s: ShiftOption) => {
  const time = s.start_time && s.end_time ? ` ${String(s.start_time).slice(0, 5)}-${String(s.end_time).slice(0, 5)}` : ""
  return `${s.name || s.code || s.id}${time}`
}

const toShiftShortLabel = (s?: ShiftOption) => {
  if (!s) return "Shift"
  const time = s.start_time && s.end_time ? `${String(s.start_time).slice(0, 5)} - ${String(s.end_time).slice(0, 5)}` : ""
  const name = s.name || s.code || "Shift"
  return time ? `${name}\n${time}` : name
}

const colorFromString = (input?: string) => {
  const v = String(input || "")
  let hash = 0
  for (let i = 0; i < v.length; i++) hash = (hash * 31 + v.charCodeAt(i)) | 0
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 85% 45%)`
}

const isHexColor = (v?: string) => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v)

export default function ShiftAssignmentClient({
  organizationId,
  initialAssignments,
  members,
  shifts,
  isLoading = false,
  onRefresh,
}: ShiftAssignmentClientProps) {
  const [assignments, setAssignments] = React.useState<IShiftAssignment[]>(initialAssignments)
  const [open, setOpen] = React.useState(false)
  const [calendarLoading, setCalendarLoading] = React.useState(false)
  const [rangeStart, setRangeStart] = React.useState<Date>(() => startOfDay(new Date()))
  const [datePickerOpen, setDatePickerOpen] = React.useState(false)
  const [selectedMemberId, setSelectedMemberId] = React.useState<string>("all")
  const [membersOpen, setMembersOpen] = React.useState(false)

  const [membersData, setMembersData] = React.useState<ShiftAssignmentMemberOption[]>(members)
  const [membersTotal, setMembersTotal] = React.useState(-1)
  const [membersSearch, setMembersSearch] = React.useState("")
  const [membersPageIndex, setMembersPageIndex] = React.useState(0)
  const [membersLoading, setMembersLoading] = React.useState(false)
  const [membersLoadError, setMembersLoadError] = React.useState<string | null>(null)
  const [membersPageSize, setMembersPageSize] = React.useState(10)

  const debouncedMembersSearch = useDebounce(membersSearch, 300)
  const membersFetchSeqRef = React.useRef(0)
  const membersCacheRef = React.useRef(new Map<string, { rows: ShiftAssignmentMemberOption[]; total: number }>())

  const membersCacheKey = React.useMemo(() => {
    return `${organizationId}__${membersPageIndex}__${membersPageSize}__${debouncedMembersSearch || ""}`
  }, [organizationId, membersPageIndex, membersPageSize, debouncedMembersSearch])

  const shiftsById = React.useMemo(() => {
    const m = new Map<string, ShiftOption>()
    for (const s of shifts) m.set(String(s.id), s)
    return m
  }, [shifts])

  React.useEffect(() => {
    setAssignments(initialAssignments)
  }, [initialAssignments])

  const fetchMembersPage = React.useCallback(async () => {
    try {
      const seq = ++membersFetchSeqRef.current
      setMembersLoading(true)
      setMembersLoadError(null)

      const res = await getShiftAssignmentMembersPage(
        organizationId,
        membersPageIndex,
        membersPageSize,
        debouncedMembersSearch,
      )

      const page = res as unknown as ApiListPage<ShiftAssignmentMemberOption>

      if (seq !== membersFetchSeqRef.current) return

      if (!page?.success) throw new Error(("message" in page && page.message) || "Failed to load members")

      const rows = Array.isArray(page.data) ? page.data : []
      const total = typeof page.total === "number" ? page.total : -1
      if (total >= 0) setMembersTotal(total)
      setMembersData(rows)

      if (total >= 0) {
        membersCacheRef.current.set(membersCacheKey, { rows, total })
      }

      if (total >= 0) {
        const totalPages = Math.max(1, Math.ceil(total / (membersPageSize || 1)))
        const nextIndex = membersPageIndex + 1
        if (nextIndex < totalPages) {
          const nextKey = `${organizationId}__${nextIndex}__${membersPageSize}__${debouncedMembersSearch || ""}`
          if (!membersCacheRef.current.has(nextKey)) {
            void getShiftAssignmentMembersPage(organizationId, nextIndex, membersPageSize, debouncedMembersSearch).then((r) => {
              const p = r as unknown as ApiListPage<ShiftAssignmentMemberOption>
              if (!p?.success) return
              const nextRows = Array.isArray(p.data) ? p.data : []
              const nextTotal = typeof p.total === "number" ? p.total : -1
              if (nextTotal >= 0) membersCacheRef.current.set(nextKey, { rows: nextRows, total: nextTotal })
            })
          }
        }
      }
    } catch (err: unknown) {
      // ignore stale failures
      if (membersFetchSeqRef.current <= 0) return
      const msg = err instanceof Error ? err.message : "Failed to load members"
      setMembersLoadError(msg)
    } finally {
      setMembersLoading(false)
    }
  }, [organizationId, membersPageIndex, membersPageSize, debouncedMembersSearch, membersCacheKey])

  React.useEffect(() => {
    setSelectedMemberId("all")
  }, [organizationId])

  React.useEffect(() => {
    setMembersPageIndex(0)
  }, [organizationId, debouncedMembersSearch, membersPageSize])

  React.useEffect(() => {
    fetchMembersPage()
  }, [fetchMembersPage])

  React.useEffect(() => {
    const cached = membersCacheRef.current.get(membersCacheKey)
    if (!cached) return
    setMembersData(cached.rows)
    setMembersTotal(cached.total)
  }, [membersCacheKey])

  const fetchWeekAssignments = React.useCallback(
    async (ws: Date) => {
      try {
        setCalendarLoading(true)
        const startDate = toISODate(ws)
        const endDate = toISODate(addDays(ws, 6))
        const res = await getShiftAssignmentsRange(organizationId, startDate, endDate)
        const range = res as unknown as (ApiSuccess<IShiftAssignment[]> | ApiFailure)
        if (!range?.success) throw new Error(("message" in range && range.message) || "Failed to load assignments")
        setAssignments(Array.isArray(range.data) ? range.data : [])
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to load assignments")
        setAssignments([])
      } finally {
        setCalendarLoading(false)
      }
    },
    [organizationId],
  )

  React.useEffect(() => {
    fetchWeekAssignments(rangeStart)
  }, [fetchWeekAssignments, rangeStart])

  const form = useForm<AssignmentForm>({
    resolver: zodResolver(assignmentSchema) as unknown as Resolver<AssignmentForm>,
    defaultValues: {
      organization_member_ids: [],
      shift_id: "",
      color_code: "",
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date().toISOString().slice(0, 10),
      start_time: "09:00",
      end_time: "17:00",
      repeat: "never",
      repeat_interval_days: 1,
      repeat_weekly_days: [],
    },
  })

  const closeDialog = () => {
    setOpen(false)
    form.reset({
      organization_member_ids: [],
      shift_id: "",
      color_code: "",
      start_date: toISODate(rangeStart),
      end_date: toISODate(rangeStart),
      start_time: "09:00",
      end_time: "17:00",
      repeat: "never",
      repeat_interval_days: 1,
      repeat_weekly_days: [],
    })
  }

  const handleSubmit = async (values: AssignmentForm) => {
    try {
      const start = new Date(values.start_date)
      const end = new Date(values.end_date)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error("Invalid date")
      if (end < start) throw new Error("End date must be after start date")

      const repeat = values.repeat || "never"
      const stepDays = repeat === "interval" ? Math.max(1, Number(values.repeat_interval_days) || 1) : 1

      const allDates: string[] = []
      let cursor = new Date(start)
      cursor.setHours(0, 0, 0, 0)
      const endDt = new Date(end)
      endDt.setHours(0, 0, 0, 0)

      if (repeat === "never") {
        allDates.push(toISODate(cursor))
      } else if (repeat === "weekly") {
        const allowed = new Set<number>(Array.isArray(values.repeat_weekly_days) ? values.repeat_weekly_days : [])
        while (cursor <= endDt) {
          if (allowed.size === 0 || allowed.has(cursor.getDay())) {
            allDates.push(toISODate(cursor))
          }
          cursor = addDays(cursor, 1)
        }
      } else {
        while (cursor <= endDt) {
          allDates.push(toISODate(cursor))
          cursor = addDays(cursor, stepDays)
        }
      }

      const memberIds = Array.isArray(values.organization_member_ids) ? values.organization_member_ids : []
      if (memberIds.length === 0) throw new Error("Member is required")

      const pickedColor = typeof values.color_code === "string" ? values.color_code.trim() : ""
      if (pickedColor && isHexColor(pickedColor)) {
        const current = shiftsById.get(values.shift_id)
        const currentColor = typeof current?.color_code === "string" ? current.color_code.trim() : ""
        if (pickedColor !== currentColor) {
          const upd = await updateShiftColor(values.shift_id, pickedColor)
          if (!upd?.success) throw new Error(upd?.message || "Failed to update shift color")
        }
      }

      const created: IShiftAssignment[] = []
      for (const memberId of memberIds) {
        for (const dateStr of allDates) {
          const res = await createShiftAssignment({
            organization_member_id: memberId,
            shift_id: values.shift_id,
            assignment_date: dateStr,
          })
          if (!res.success || !res.data) throw new Error(res.message || "Failed to assign")
          created.push(res.data as IShiftAssignment)
        }
      }

      toast.success(created.length > 1 ? "Shifts created" : "Shift assigned")
      setAssignments((prev) => [...created, ...prev])
      onRefresh?.()
      await fetchWeekAssignments(rangeStart)
      closeDialog()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteShiftAssignment(id)
      if (!res.success) throw new Error(res.message || "Failed to delete")

      toast.success(res.message || "Assignment deleted")
      setAssignments((prev) => prev.filter((a) => a.id !== id))
      onRefresh?.()
      await fetchWeekAssignments(rangeStart)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const days = React.useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(rangeStart, i))
  }, [rangeStart])

  const assignmentsByMemberDate = React.useMemo(() => {
    const map = new Map<string, IShiftAssignment[]>()
    for (const a of assignments) {
      const key = `${a.organization_member_id}__${a.assignment_date}`
      const list = map.get(key)
      if (list) list.push(a)
      else map.set(key, [a])
    }
    return map
  }, [assignments])

  const anyAssignmentsByDate = React.useMemo(() => {
    const set = new Set<string>()
    for (const a of assignments) set.add(a.assignment_date)
    return set
  }, [assignments])

  const visibleMembers = React.useMemo(() => {
    const named = membersData.filter((m) => toMemberName(m) !== "")
    if (selectedMemberId === "all") return named
    return named.filter((m) => m.id === selectedMemberId)
  }, [membersData, selectedMemberId])

  const allMembersFilterOptions = React.useMemo(() => membersData.filter((m) => toMemberName(m) !== ""), [membersData])

  const membersTotalPages = Math.max(1, Math.ceil((membersTotal >= 0 ? membersTotal : 0) / (membersPageSize || 1)))
  const currentMembersPage = membersPageIndex + 1

  return (
    <div className="w-full h-full">
      <Card className="h-full border-0 shadow-none">
        <CardContent className="p-0">
          <div className="w-full">
            <div className="flex flex-col gap-3 p-4">
              <div className="w-full overflow-x-auto">
                <div className="flex items-center gap-2 flex-nowrap min-w-max">
                  <Button type="button" variant="outline" size="icon" onClick={() => setRangeStart((d) => addDays(d, -7))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" onClick={() => setRangeStart((d) => addDays(d, 7))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setRangeStart(startOfDay(new Date()))}>
                    Today
                  </Button>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="gap-2 min-w-[220px] justify-start">
                        <CalendarIcon className="h-4 w-4 opacity-70" />
                        <span className="text-sm tabular-nums flex-1 text-left">{formatWeekRangeLabel(rangeStart)}</span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3">
                        <Calendar
                          className="p-0"
                          captionLayout={"dropdown-buttons" as any}
                          fromYear={2000}
                          toYear={new Date().getFullYear() + 5}
                          classNames={{
                            months: "flex flex-col",
                            month: "space-y-3",
                            caption: "flex items-center justify-between gap-2",
                            caption_label: "hidden",
                            nav: "flex items-center gap-1",
                            nav_button: "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                            row: "flex w-full mt-2",
                            cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                            day: "h-9 w-9 p-0 font-normal",
                          }}
                          mode="single"
                          selected={rangeStart}
                          onSelect={(d) => {
                            if (!d) return
                            setRangeStart(startOfDay(d))
                            setDatePickerOpen(false)
                          }}
                          initialFocus
                        />
                        <div className="mt-3 flex items-center justify-between">
                          <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0"
                            onClick={() => {
                              setRangeStart(startOfDay(new Date()))
                              setDatePickerOpen(false)
                            }}
                          >
                            Clear
                          </Button>
                          <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0"
                            onClick={() => {
                              setRangeStart(startOfDay(new Date()))
                              setDatePickerOpen(false)
                            }}
                          >
                            Today
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Input
                    value={membersSearch}
                    onChange={(e) => {
                      setMembersSearch(e.target.value)
                      // debounce not added yet; this triggers refetch via effect dependency
                    }}
                    placeholder="Search members..."
                    className="w-[220px]"
                  />

                  <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Members" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All members</SelectItem>
                      {allMembersFilterOptions.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {toMemberLabel(m)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Dialog
                    open={open}
                    onOpenChange={(isOpen) => {
                      if (isOpen) {
                        setOpen(true)
                        const presetMemberIds = selectedMemberId !== "all" ? [selectedMemberId] : []
                        form.reset({
                          organization_member_ids: presetMemberIds,
                          shift_id: "",
                          color_code: "",
                          start_date: toISODate(rangeStart),
                          end_date: toISODate(rangeStart),
                          start_time: "09:00",
                          end_time: "17:00",
                          repeat: "never",
                          repeat_interval_days: 1,
                          repeat_weekly_days: [],
                        })
                      } else {
                        closeDialog()
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button onClick={() => setOpen(true)} className="gap-2 whitespace-nowrap">
                        <Plus className="h-4 w-4" />
                        Create shift
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create shift</DialogTitle>
                      </DialogHeader>

                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="organization_member_ids"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Member</FormLabel>
                                <Popover open={membersOpen} onOpenChange={setMembersOpen}>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button type="button" variant="outline" className="w-full justify-between">
                                        <span className="truncate">
                                          {Array.isArray(field.value) && field.value.length > 0
                                            ? `${field.value.length} member(s)`
                                            : "Select member(s)"}
                                        </span>
                                        <span className="text-muted-foreground">Search</span>
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[320px] p-0" align="start">
                                    <Command>
                                      <CommandInput placeholder="Search member..." />
                                      <CommandList>
                                        <CommandEmpty>No member found.</CommandEmpty>
                                        <ScrollArea className="max-h-[260px]">
                                          {allMembersFilterOptions.map((m) => {
                                            const checked = Array.isArray(field.value) ? field.value.includes(m.id) : false
                                            return (
                                              <CommandItem
                                                key={m.id}
                                                value={toMemberName(m)}
                                                onSelect={() => {
                                                  const current = Array.isArray(field.value) ? field.value : []
                                                  const next = checked ? current.filter((id) => id !== m.id) : [...current, m.id]
                                                  field.onChange(next)
                                                }}
                                              >
                                                <Checkbox checked={checked} className="mr-2" />
                                                <span className="truncate">{toMemberLabel(m)}</span>
                                              </CommandItem>
                                            )
                                          })}
                                        </ScrollArea>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="shift_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Shift</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={(v) => {
                                    field.onChange(v)
                                    const s = shiftsById.get(v)
                                    const st = s?.start_time ? String(s.start_time).slice(0, 5) : "09:00"
                                    const et = s?.end_time ? String(s.end_time).slice(0, 5) : "17:00"
                                    form.setValue("start_time", st)
                                    form.setValue("end_time", et)

                                    const c = typeof s?.color_code === "string" ? s.color_code.trim() : ""
                                    form.setValue("color_code", isHexColor(c) ? c : "#f97316")
                                  }}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      {field.value ? (
                                        (() => {
                                          const selectedShift = shiftsById.get(String(field.value)) || shifts.find((x) => String(x.id) === String(field.value))
                                          if (!selectedShift) return <SelectValue placeholder="Select shift" />
                                          return <span className="truncate">{toShiftLabel(selectedShift)}</span>
                                        })()
                                      ) : (
                                        <SelectValue placeholder="Select shift" />
                                      )}
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {shifts.map((s) => (
                                      <SelectItem key={String(s.id)} value={String(s.id)}>
                                        {toShiftLabel(s)}
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
                            name="color_code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Shift color</FormLabel>
                                <FormControl>
                                  <div className="flex items-center gap-3">
                                    <Input
                                      type="color"
                                      value={isHexColor(field.value) ? field.value : "#f97316"}
                                      onChange={(e) => field.onChange(e.target.value)}
                                      className="h-10 w-14 p-1"
                                    />
                                    <Input
                                      value={field.value || ""}
                                      onChange={(e) => field.onChange(e.target.value)}
                                      placeholder="#f97316"
                                      className="w-[140px]"
                                    />
                                    <div
                                      className="h-6 w-6 rounded border"
                                      style={{ backgroundColor: field.value || "transparent" }}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name="start_date"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="start_time"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start time</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name="end_time"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End time</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="end_date"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name="repeat"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Repeat</FormLabel>
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Repeat" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="never">Never</SelectItem>
                                      <SelectItem value="daily">Every day</SelectItem>
                                      <SelectItem value="interval">Every N days</SelectItem>
                                      <SelectItem value="weekly">Weekly</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="repeat_interval_days"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Interval (days)</FormLabel>
                                  <FormControl>
                                    <Input type="number" min={1} step={1} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {form.watch("repeat") === "weekly" && (
                            <FormField
                              control={form.control}
                              name="repeat_weekly_days"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Days of week</FormLabel>
                                  <div className="flex flex-wrap gap-2">
                                    {[
                                      { d: 1, label: "Mon" },
                                      { d: 2, label: "Tue" },
                                      { d: 3, label: "Wed" },
                                      { d: 4, label: "Thu" },
                                      { d: 5, label: "Fri" },
                                      { d: 6, label: "Sat" },
                                      { d: 0, label: "Sun" },
                                    ].map((it) => {
                                      const current = Array.isArray(field.value) ? field.value : []
                                      const active = current.includes(it.d)
                                      return (
                                        <Button
                                          key={it.d}
                                          type="button"
                                          variant={active ? "default" : "outline"}
                                          size="sm"
                                          onClick={() => {
                                            const next = active ? current.filter((x) => x !== it.d) : [...current, it.d]
                                            field.onChange(next)
                                          }}
                                        >
                                          {it.label}
                                        </Button>
                                      )
                                    })}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={closeDialog}>
                              Cancel
                            </Button>
                            <Button type="submit">Save</Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>

                </div>
              </div>
            </div>

            <div className="w-full max-h-[calc(100vh-260px)] overflow-auto">
              <div className="min-w-[980px]">
                <div className="grid" style={{ gridTemplateColumns: "260px repeat(7, minmax(140px, 1fr))" }}>
                  <div className="sticky left-0 z-10 bg-background border-b border-r px-3 py-3 text-sm font-medium">
                    Members
                  </div>
                  {days.map((d) => {
                    const dateStr = toISODate(d)
                    const hasAny = anyAssignmentsByDate.has(dateStr)
                    return (
                      <div
                        key={dateStr}
                        className={`border-b border-r px-3 py-3 ${hasAny ? "bg-muted/40" : "bg-background"}`}
                      >
                        <div className="text-xs text-muted-foreground">{d.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase()}</div>
                        <div className="text-2xl leading-none font-semibold tabular-nums">{d.getDate()}</div>
                      </div>
                    )
                  })}

                  {(calendarLoading || isLoading) && (
                    <div
                      style={{ gridColumn: "1 / -1" }}
                      className="border-b p-6 text-sm text-muted-foreground"
                    >
                      Loading schedules...
                    </div>
                  )}

                  {!calendarLoading && !isLoading && membersLoading && membersData.length === 0 && (
                    <div
                      style={{ gridColumn: "1 / -1" }}
                      className="border-b p-6 text-sm text-muted-foreground"
                    >
                      Loading members...
                    </div>
                  )}

                  {!calendarLoading && !isLoading && !membersLoading && visibleMembers.length === 0 && (
                    <div
                      style={{ gridColumn: "1 / -1" }}
                      className="border-b p-6 text-sm text-muted-foreground"
                    >
                      No members.
                    </div>
                  )}

                  {!calendarLoading && !isLoading &&
                    visibleMembers.map((m) => {
                      return (
                        <React.Fragment key={m.id}>
                          <div className="sticky left-0 z-10 bg-background border-b border-r px-3 py-3">
                            <div className="text-sm font-medium">{toMemberLabel(m)}</div>
                          </div>
                          {days.map((d) => {
                            const dateStr = toISODate(d)
                            const key = `${m.id}__${dateStr}`
                            const cellAssignments = assignmentsByMemberDate.get(key) || []

                            return (
                              <div
                                key={key}
                                className={`border-b border-r px-2 py-2 align-top ${cellAssignments.length === 0 ? "cursor-pointer hover:bg-muted/40" : ""}`}
                                onClick={() => {
                                  if (cellAssignments.length !== 0) return
                                  setOpen(true)
                                  form.reset({
                                    organization_member_ids: [m.id],
                                    shift_id: "",
                                    color_code: "",
                                    start_date: dateStr,
                                    end_date: dateStr,
                                    start_time: "09:00",
                                    end_time: "17:00",
                                    repeat: "never",
                                    repeat_interval_days: 1,
                                    repeat_weekly_days: [],
                                  })
                                }}
                              >
                                <div className="flex flex-col gap-2">
                                  {cellAssignments.map((a) => {
                                    const shift = shiftsById.get(a.shift_id)
                                    const bg = shift?.color_code || colorFromString(a.shift_id)
                                    const label = toShiftShortLabel(shift)
                                    return (
                                      <div
                                        key={a.id}
                                        className="rounded-md px-2 py-2 text-xs whitespace-pre-line text-white"
                                        style={{ backgroundColor: bg }}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="font-medium leading-tight">{label}</div>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-white/90 hover:text-white"
                                              >
                                                <Trash className="h-3.5 w-3.5" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Delete shift</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Are you sure you want to delete this shift assignment?
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(a.id)}>Delete</AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </React.Fragment>
                      )
                    })}

                  {membersLoadError && (
                    <div
                      style={{ gridColumn: "1 / -1" }}
                      className="border-b p-4 text-sm text-muted-foreground flex items-center justify-between gap-3"
                    >
                      <div className="truncate">{membersLoadError}</div>
                      <Button type="button" variant="outline" size="sm" onClick={fetchMembersPage} disabled={membersLoading}>
                        Try again
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-4 pb-4">
              <div className="text-sm text-muted-foreground flex-1 min-w-0 truncate flex items-center gap-2">
                {membersLoading && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />}
                <span>
                  {membersTotal >= 0
                    ? `Showing ${membersData.length === 0 ? 0 : membersPageIndex * membersPageSize + 1}-${Math.min((membersPageIndex + 1) * membersPageSize, membersTotal)
                    } of ${membersTotal}`
                    : `Showing ${membersData.length} member(s)`}
                </span>
              </div>
            </div>

            <PaginationFooter
              page={currentMembersPage}
              totalPages={membersTotalPages}
              onPageChange={(p) => {
                if (membersLoading) return
                const clamped = Math.max(1, Math.min(p, membersTotalPages))
                setMembersPageIndex(clamped - 1)
              }}
              isLoading={membersLoading}
              from={membersTotal > 0 ? membersPageIndex * membersPageSize + (membersData.length === 0 ? 0 : 1) : 0}
              to={membersTotal > 0 ? Math.min((membersPageIndex + 1) * membersPageSize, membersTotal) : 0}
              total={Math.max(0, membersTotal)}
              pageSize={membersPageSize}
              onPageSizeChange={(size) => {
                if (membersLoading) return
                setMembersPageSize(size)
                setMembersPageIndex(0)
              }}
              pageSizeOptions={[10, 20, 50, 100]}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
