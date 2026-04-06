"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Globe, Save, RotateCcw, Copy, Search, Plus, Minus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import { formatTime } from "@/utils/format-time"
import { useTimeFormat } from "@/store/time-format-store"
import { getTimezoneLabel, getTimezoneOffset } from "@/constants/attendance-status"
import { getDayName } from "@/utils/date-helper"
import { useOrgStore } from "@/store/org-store"
import { IWorkScheduleDetail } from "@/interface"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  getWorkScheduleDetails,
  upsertWorkScheduleDetails,
} from "@/action/schedule"
import { getAllOrganization_member } from "@/action/members"
import { createMemberSchedulesBulk } from "@/action/member-schedule"
import { useFormatDate } from "@/hooks/use-format-date"

// Day keys for iteration
type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6
const DAYS: DayIndex[] = [0, 1, 2, 3, 4, 5, 6]
const WORKDAYS: DayIndex[] = [1, 2, 3, 4, 5] // Mon-Fri
const WEEKEND: DayIndex[] = [0, 6] // Sun, Sat

// Rule item for local state
interface RuleItem {
  day_of_week: DayIndex
  label: string
  is_working_day: boolean
  start_time: string
  end_time: string
  core_hours_start: string
  core_hours_end: string
  break_start: string
  break_end: string
  flexible_hours: boolean
  notes: string
}

// Preset configurations
const PRESETS = {
  normal: {
    label: "Normal Working Hours",
    is_working_day: true,
    start_time: "07:30",
    end_time: "17:30",
    core_hours_start: "08:00",
    core_hours_end: "17:00",
    break_start: "09:00",
    break_end: "10:00",
    flexible_hours: false,
    notes: "",
  },
  morning: {
    label: "Morning Shift",
    is_working_day: true,
    start_time: "06:30",
    end_time: "14:00",
    core_hours_start: "07:00",
    core_hours_end: "13:30",
    break_start: "10:00",
    break_end: "10:30",
    flexible_hours: false,
    notes: "Morning shift",
  },
  evening: {
    label: "Evening Shift",
    is_working_day: true,
    start_time: "13:00",
    end_time: "22:00",
    core_hours_start: "13:30",
    core_hours_end: "21:30",
    break_start: "18:00",
    break_end: "18:30",
    flexible_hours: false,
    notes: "Evening shift",
  },
  flexible: {
    label: "Flexible Hours",
    is_working_day: true,
    start_time: "08:00",
    end_time: "20:00",
    core_hours_start: "09:00",
    core_hours_end: "18:00",
    break_start: "12:00",
    break_end: "13:00",
    flexible_hours: true,
    notes: "Flexible working hours",
  },
  off: {
    label: "Day Off",
    is_working_day: false,
    start_time: "",
    end_time: "",
    core_hours_start: "",
    core_hours_end: "",
    break_start: "",
    break_end: "",
    flexible_hours: false,
    notes: "Holiday / Day off",
  },
}

// Default rule creator
const createDefaultRule = (day: DayIndex): RuleItem => {
  const isWeekend = WEEKEND.includes(day)
  return {
    day_of_week: day,
    label: isWeekend ? "Day Off" : "Normal Working Hours",
    is_working_day: !isWeekend,
    start_time: isWeekend ? "" : "06:30",
    end_time: isWeekend ? "" : "16:30",
    core_hours_start: isWeekend ? "" : "07:30",
    core_hours_end: isWeekend ? "" : "18:00",
    break_start: isWeekend ? "" : "12:00",
    break_end: isWeekend ? "" : "12:30",
    flexible_hours: false,
    notes: isWeekend ? "Weekend off" : "",
  }
}

export default function WorkScheduleDetailsPage() {
  const params = useParams()
  const scheduleId = Number(params.id)
  const { format: timeFormat } = useTimeFormat()
  const orgStore = useOrgStore()

  // Inisialisasi hook timezone di sini
  const { timezone } = useFormatDate()
  const organizationTimezone = timezone || "UTC"

  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rules, setRules] = useState<RuleItem[]>(() => DAYS.map(createDefaultRule))
  const [origRules, setOrigRules] = useState<RuleItem[]>([])
  const [selectedDay, setSelectedDay] = useState<DayIndex>(1) // Monday default
  const [daysDialogOpen, setDaysDialogOpen] = useState(false)
  const [tempDays, setTempDays] = useState<DayIndex[]>([])
  const [panelBump, setPanelBump] = useState(0)

  // Assignment states (below two panels)
  type MemberOption = { id: string; label: string; department: string }
  const [members, setMembers] = useState<MemberOption[]>([])
  const [memberSearch, setMemberSearch] = useState("")
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [effectiveDate, setEffectiveDate] = useState<string>("")
  const [departments, setDepartments] = useState<string[]>([])
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")

  // Fetch schedule details
  const loadDetails = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getWorkScheduleDetails(scheduleId)
      const typedRes = res as { success: boolean; data: IWorkScheduleDetail[]; message?: string }

      if (typedRes.success && typedRes.data) {
        // Convert IWorkScheduleDetail[] to RuleItem[]
        const loadedRules: RuleItem[] = DAYS.map((day) => {
          const detail = typedRes.data.find((d) => Number(d.day_of_week) === day)
          if (detail) {
            return {
              day_of_week: day,
              label: detail.is_working_day ? "Working Day" : "Day Off",
              is_working_day: detail.is_working_day,
              start_time: detail.start_time || "",
              end_time: detail.end_time || "",
              core_hours_start: detail.core_hours_start || "",
              core_hours_end: detail.core_hours_end || "",
              break_start: detail.break_start || "",
              break_end: detail.break_end || "",
              flexible_hours: detail.flexible_hours,
              notes: "",
            }
          }
          return createDefaultRule(day)
        })
        setRules(loadedRules)
        setOrigRules(JSON.parse(JSON.stringify(loadedRules)))
      }
    } catch (error) {
      toast.error("Failed to load schedule details")
    } finally {
      setLoading(false)
    }
  }, [scheduleId])

  useEffect(() => {
    loadDetails()
  }, [loadDetails])

  // Load members for assignment, and init effective date to today
  useEffect(() => {
    const init = async () => {
      try {
        const today = new Date()
        const yyyy = today.getFullYear()
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const dd = String(today.getDate()).padStart(2, '0')
        setEffectiveDate(`${yyyy}-${mm}-${dd}`)

        const rawOrgId = orgStore.organizationId
        let safeOrgId: number | undefined
        if (typeof rawOrgId === 'number' && Number.isFinite(rawOrgId)) {
          safeOrgId = rawOrgId
        } else if (typeof rawOrgId === 'string') {
          const parsed = Number(rawOrgId)
          if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
            safeOrgId = parsed
          }
        }

        const res = await getAllOrganization_member(safeOrgId)
        if (!res.success) {
          toast.error(res.message || 'Failed to load members')
          setMembers([])
          return
        }

        const data = Array.isArray(res.data) ? res.data : []
        const opts: MemberOption[] = data
          .filter((m: unknown) => {
            const o = m as { id?: unknown }
            const num = Number(o.id)
            return Number.isFinite(num) && num > 0
          })
          .map((m: unknown) => {
            const o = m as {
              id?: unknown
              user?: {
                first_name?: string | null;
                last_name?: string | null; email?: string | null; display_name?: string | null
              } | null
              departments?: { name?: string | null } | null
              groups?: { name?: string | null } | null
            }
            const idStr = String(Number(o.id))
            const u = o.user || null
            const labelBase =
              u?.display_name?.trim()
              || [u?.first_name, u?.last_name].filter(Boolean).join(' ').trim()
              || u?.email
              || 'No Name'
            const dept = o.departments?.name || o.groups?.name || ''
            return { id: idStr, label: labelBase, department: dept }
          })
        setMembers(opts)

        // derive departments (groups) sorted, unique
        const deptNames = Array.from(new Set(opts.map(m => m.department).filter(Boolean))).sort()
        setDepartments(deptNames)
        setDepartmentFilter("all")
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load members'
        console.error('[schedule-assign] load members:', e)
        toast.error(msg)
        setMembers([])
      }
    }
    init()
  }, [orgStore.organizationId])

  // Selected rule
  const selectedRule = useMemo(
    () => rules.find((r) => r.day_of_week === selectedDay) || null,
    [rules, selectedDay]
  )

  // Dirty check
  const isDirty = useMemo(
    () => JSON.stringify(rules) !== JSON.stringify(origRules),
    [rules, origRules]
  )

  // Update rule
  const updateRule = (day: DayIndex, patch: Partial<RuleItem>) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.day_of_week !== day) return r
        const updated = { ...r, ...patch }
        // Clear times if not working day
        if (!updated.is_working_day) {
          updated.start_time = ""
          updated.end_time = ""
          updated.core_hours_start = ""
          updated.core_hours_end = ""
          updated.break_start = ""
          updated.break_end = ""
        }
        return updated
      })
    )
  }
  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey]
    updateRule(selectedDay, preset)
    setPanelBump((k) => k + 1)
  }
  // Copy to days
  const copyToDays = (targetDays: DayIndex[]) => {
    if (!selectedRule) return
    setRules((prev) =>
      prev.map((r) => {
        if (!targetDays.includes(r.day_of_week)) return r
        return {
          ...r,
          label: selectedRule.label,
          is_working_day: selectedRule.is_working_day,
          start_time: selectedRule.start_time,
          end_time: selectedRule.end_time,
          core_hours_start: selectedRule.core_hours_start,
          core_hours_end: selectedRule.core_hours_end,
          break_start: selectedRule.break_start,
          break_end: selectedRule.break_end,
          flexible_hours: selectedRule.flexible_hours,
          notes: selectedRule.notes,
        }
      })
    )
  }

  const saveAll = async () => {
    setSaving(true)
    try {
      const id = Number(scheduleId)
      if (!Number.isFinite(id)) {
        toast.error("Invalid schedule id")
        return
      }

      const items = rules.map((r) => ({
        day_of_week: r.day_of_week,
        is_working_day: r.is_working_day,
        start_time: r.is_working_day ? (r.start_time || undefined) : undefined,
        end_time: r.is_working_day ? (r.end_time || undefined) : undefined,
        break_start: r.is_working_day ? (r.break_start || undefined) : undefined,
        break_end: r.is_working_day ? (r.break_end || undefined) : undefined,
        core_hours_start: r.is_working_day ? (r.core_hours_start || undefined) : undefined,
        core_hours_end: r.is_working_day ? (r.core_hours_end || undefined) : undefined,
        flexible_hours: r.flexible_hours,
        is_active: true,
      }))

      const res = await upsertWorkScheduleDetails(id, items)

      if (!res.success) {
        toast.error(res.message || "Failed to save schedule")
        return
      }

      if (selectedMemberIds.length > 0) {
        if (!effectiveDate) {

        } else {
          const bulk = await createMemberSchedulesBulk(String(scheduleId), selectedMemberIds, effectiveDate)
          if (!bulk.success) {
            toast.error(bulk.message || "Failed to assign members")
          } else {
            const inserted = bulk.data?.inserted ?? 0
            const updated = bulk.data?.updated ?? 0

            let msg = `Assigned to ${inserted} member(s)`
            if (updated > 0) msg += `, updated ${updated} existing schedule(s)`

            toast.success(msg)
          }
        }
      }

      await loadDetails() // refresh dari DB agar UI sesuai DB
    } catch (error) {
      toast.error("Failed to save schedule")
    } finally {
      setSaving(false)
    }
  }

  // Discard changes
  const discardChanges = () => {
    setRules(JSON.parse(JSON.stringify(origRules)))
    toast.info("Changes discarded")
  }

  // Reset to defaults
  const resetToDefaults = () => {
    const defaults = DAYS.map(createDefaultRule)
    setRules(defaults)
    toast.info("Reset to default schedule")
  }

  // Format time for display
  const formatTimeDisplay = (time: string) => {
    if (!time) return "—"
    return formatTime(time, timeFormat)
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 w-full">
        <TableSkeleton rows={7} columns={4} />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 w-full">

      {/* Two-Panel Editor */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Day Selector (Left Panel) */}
        <div className="border rounded-lg p-2 md:col-span-1 bg-card h-full">
          {/* Timezone Banner */}
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg border" role="status">
            <Globe className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm text-muted-foreground">
              Timezone: <strong>{getTimezoneLabel(organizationTimezone)}</strong>
              <span className="ml-1 text-xs">({getTimezoneOffset(organizationTimezone)})</span>
            </span>
            {(isDirty || selectedMemberIds.length > 0) && (
              <Badge variant="outline" className="ml-auto text-slate-500 border-orange-300">
                Unsaved Changes
              </Badge>
            )}
          </div>
          <div className="divide-y">
            {DAYS.map((day) => {
              const rule = rules.find((r) => r.day_of_week === day)
              const active = selectedDay === day
              const hours = rule?.is_working_day
                ? `${formatTimeDisplay(rule.start_time)} - ${formatTimeDisplay(rule.end_time)}`
                : "No schedule"

              return (
                <div
                  key={day}
                  role="button"
                  tabIndex={0}
                  className={`w-full text-left p-3 flex items-center justify-between transition-colors cursor-pointer ${active ? "bg-accent" : "hover:bg-muted/50"
                    }`}
                  onClick={() => setSelectedDay(day)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedDay(day)
                    }
                  }}
                >
                  <div>
                    <div className="font-medium">{getDayName(day)}</div>
                    <div className="text-xs text-muted-foreground">{hours}</div>
                  </div>
                  <button
                    className={`text-xs px-2 py-1 rounded-full font-medium transition-all hover:opacity-80 ${rule?.is_working_day
                      ? "bg-gray-900 dark:bg-gray-900 text-white hover:bg-gray-900"
                      : "bg-gray-500 dark:bg-gray-600 text-white hover:bg-gray-600"
                      }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      updateRule(day, { is_working_day: !rule?.is_working_day })
                    }}
                    title={`Click to toggle ${getDayName(day)} status`}
                  >
                    {rule?.is_working_day ? "Working" : "Off"}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Day Editor (Right Panel) */}
        <div className="border rounded-lg p-4 md:col-span-2 lg:col-span-3 bg-card h-full flex flex-col">
          {selectedRule && (
            <div key={`${selectedDay}-${panelBump}`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold">{getDayName(selectedDay)}</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Status:</span>
                  <Badge
                    variant={selectedRule.is_working_day ? "default" : "secondary"}
                    className={`${selectedRule.is_working_day
                      ? "bg-gray-900 hover:bg-gray-900 text-white"
                      : "bg-gray-500 hover:bg-gray-500 text-white"
                      } cursor-default`}
                  >
                    {selectedRule.is_working_day ? "Working Day" : "Day Off"}
                  </Badge>
                </div>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={() => applyPreset("normal")}>
                  Normal Hours
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyPreset("morning")}>
                  Morning Shift
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyPreset("evening")}>
                  Evening Shift
                </Button>
                {/* <Button variant="outline" size="sm" onClick={() => applyPreset("flexible")}>
                  Flexible
                </Button> */}
                <Button variant="outline" size="sm" onClick={() => applyPreset("off")}>
                  Day Off
                </Button>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Time Settings */}
                <div className="space-y-3 md:col-span-2">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1">
                      <div className="text-sm font-medium">Check In</div>
                      <Input
                        key={`start-${selectedDay}`}
                        type="time"
                        value={selectedRule.start_time}
                        disabled={!selectedRule.is_working_day}
                        onChange={(e) => updateRule(selectedDay, { start_time: e.target.value })}
                      />
                    </label>
                    <label className="space-y-1">
                      <div className="text-sm font-medium">Check Out</div>
                      <Input
                        key={`end-${selectedDay}`}
                        type="time"
                        value={selectedRule.end_time}
                        disabled={!selectedRule.is_working_day}
                        onChange={(e) => updateRule(selectedDay, { end_time: e.target.value })}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1">
                      <div className="text-sm font-medium">Break Start</div>
                      <Input
                        key={`bstart-${selectedDay}`}
                        type="time"
                        value={selectedRule.break_start}
                        disabled={!selectedRule.is_working_day}
                        onChange={(e) => updateRule(selectedDay, { break_start: e.target.value })}
                      />
                    </label>
                    <label className="space-y-1">
                      <div className="text-sm font-medium">Break End</div>
                      <Input
                        key={`bend-${selectedDay}`}
                        type="time"
                        value={selectedRule.break_end}
                        disabled={!selectedRule.is_working_day}
                        onChange={(e) => updateRule(selectedDay, { break_end: e.target.value })}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1">
                      <div className="text-sm font-medium">Core Hours Start</div>
                      <Input
                        key={`cstart-${selectedDay}`}
                        type="time"
                        value={selectedRule.core_hours_start}
                        disabled={!selectedRule.is_working_day}
                        onChange={(e) => updateRule(selectedDay, { core_hours_start: e.target.value })}
                      />
                    </label>
                    <label className="space-y-1">
                      <div className="text-sm font-medium">Core Hours End</div>
                      <Input
                        key={`cend-${selectedDay}`}
                        type="time"
                        value={selectedRule.core_hours_end}
                        disabled={!selectedRule.is_working_day}
                        onChange={(e) => updateRule(selectedDay, { core_hours_end: e.target.value })}
                      />
                    </label>
                  </div>
                  {/* Removed Grace Settings as per simplification rule */}
                </div>

                {/* Flexible Hours Toggle */}
                {/* <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedRule.flexible_hours}
                      disabled={!selectedRule.is_working_day}
                      onChange={(e) => updateRule(selectedDay, { flexible_hours: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium">Flexible Hours</span>
                    <span className="text-xs text-muted-foreground">(Allow adjustable work hours)</span>
                  </label>
                </div> */}

                {/* Copy Actions */}
                <div className="md:col-span-2 pt-4 border-t">
                  <div className="text-sm font-medium mb-2">Copy to other days:</div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTempDays(WORKDAYS.filter((d) => d !== selectedDay)) // default: semua selain hari aktif
                        setDaysDialogOpen(true)
                      }}
                      className="gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Select Days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToDays(WORKDAYS)}
                      className="gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Copy to Weekdays
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToDays(DAYS.filter((d) => d !== selectedDay))}
                      className="gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Copy to All Days
                    </Button>
                  </div>
                  <Dialog open={daysDialogOpen} onOpenChange={setDaysDialogOpen}>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle>Select days</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-2">
                        {DAYS.map((d) => (
                          <label key={d} className="flex items-center gap-2">
                            <Checkbox
                              checked={tempDays.includes(d)}
                              disabled={d === selectedDay}
                              onCheckedChange={(c) => {
                                setTempDays((prev) =>
                                  c === true ? (prev.includes(d) ? prev : [...prev, d]) : prev.filter((x) => x !== d)
                                )
                              }}
                            />
                            <span>{getDayName(d)}</span>
                          </label>
                        ))}

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTempDays(DAYS.filter((d) => d !== selectedDay))}
                          >
                            Select All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTempDays([])}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDaysDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            if (tempDays.length === 0) {
                              // Kosong => set Day Off untuk weekdays (Mon–Fri) kecuali hari aktif
                              const targets = WORKDAYS.filter((d) => d !== selectedDay)
                              setRules((prev) =>
                                prev.map((r) =>
                                  targets.includes(r.day_of_week)
                                    ? {
                                      ...r,
                                      is_working_day: false,
                                      start_time: "",
                                      end_time: "",
                                      break_start: "",
                                      break_end: "",
                                      flexible_hours: false,
                                      label: "Day Off",
                                      notes: "",
                                    }
                                    : r
                                )
                              )
                            } else {
                              // Ada pilihan hari = salin jadwal
                              copyToDays(tempDays)
                            }
                            setDaysDialogOpen(false)
                          }}
                        >
                          Apply
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Assign Members to this Schedule */}
      <div className="border rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Assign members to this schedule</div>
          <div className="text-xs text-muted-foreground">Schedule ID: {scheduleId}</div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center mb-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search member to add..."
              className="pl-8"
            />
          </div>

          {/* Group filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Group</label>
            <select
              className="appearance-none border rounded px-3 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All groups</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Add all members (respecting search + group filter) */}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const term = memberSearch.trim().toLowerCase()
              const filtered = members.filter(m => {
                const byGroup = departmentFilter === "all" || m.department === departmentFilter
                const bySearch = term === "" || m.label.toLowerCase().includes(term) || m.department.toLowerCase().includes(term)
                return byGroup && bySearch
              })
              if (filtered.length === 0) {
                toast.info("No members match current filter")
                return
              }
              const ids = filtered.map(m => m.id)
              setSelectedMemberIds(prev => Array.from(new Set([...prev, ...ids])))
            }}
          >
            <Plus className="mr-1 h-3 w-3" />Add all
          </Button>

          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Effective date</label>
            <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="w-[160px]" />
          </div>
        </div>

        {/* Quick list */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto pt-1">
            {members
              .filter(m => {
                const term = memberSearch.toLowerCase()
                const byGroup = departmentFilter === "all" || m.department === departmentFilter
                const bySearch = term === "" || m.label.toLowerCase().includes(term) || m.department.toLowerCase().includes(term)
                return byGroup && bySearch
              })
              .map(m => {
                const selected = selectedMemberIds.includes(m.id)
                return (
                  <Button
                    key={m.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`justify-start h-8 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm ${selected ? 'ring-1 ring-blue-300' : ''}`}
                    onClick={() => {
                      setSelectedMemberIds(prev => selected ? prev.filter(x => x !== m.id) : [...prev, m.id])
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    <span className="truncate text-xs">{m.label}{m.department ? ` (${m.department})` : ''}</span>
                  </Button>
                )
              })}
          </div>

          {/* Selected chips */}
          <div className="pt-2">
            <div className="text-xs font-semibold text-muted-foreground mb-1">
              Selected Member(s) ({selectedMemberIds.length})
            </div>
            <div className="max-h-48 overflow-y-auto overscroll-contain border rounded-md p-2 bg-white">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {selectedMemberIds.map(id => {
                  const mm = members.find(x => x.id === id)
                  const lbl = mm ? `${mm.label}${mm.department ? ` (${mm.department})` : ''}` : id
                  return (
                    <button
                      key={id}
                      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 w-full rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      onClick={() => setSelectedMemberIds(prev => prev.filter(x => x !== id))}
                      title="Remove"
                    >
                      <Minus className="h-3 w-3" />
                      <span className="truncate">{lbl}</span>
                    </button>
                  )
                })}
                {selectedMemberIds.length === 0 && (
                  <span className="text-xs text-muted-foreground">No members selected</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Moved to Bottom */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={resetToDefaults}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Default
        </Button>
        <Button
          variant="outline"
          onClick={discardChanges}
          disabled={!isDirty}
          className="gap-2 text-slate-500 border-orange-300 hover:bg-orange-50 disabled:text-muted-foreground disabled:border-muted"
        >
          Discard Changes
        </Button>
        <Button
          onClick={saveAll}
          disabled={((!isDirty && selectedMemberIds.length === 0) || saving)}
          className="gap-2 min-w-[140px]"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}