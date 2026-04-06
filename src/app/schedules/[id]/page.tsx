"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Globe, Save, RotateCcw, Copy, Search, Plus, Minus, Clock, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import { formatTime } from "@/utils/format-time"
import { useTimeFormat } from "@/store/time-format-store"
import { getTimezoneLabel, getTimezoneOffset } from "@/constants/attendance-status"
import { getDayName } from "@/utils/date-helper"
import { useOrgStore } from "@/store/org-store"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  getWorkScheduleById,
  upsertWorkScheduleDetails,
} from "@/action/schedule"
import { getAllOrganization_member } from "@/action/members"
import { createMemberSchedulesBulk } from "@/action/member-schedule"
import { useFormatDate } from "@/hooks/use-format-date"

// Day keys for iteration
type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6
const DAYS: DayIndex[] = [0, 1, 2, 3, 4, 5, 6]
const WORKDAYS: DayIndex[] = [1, 2, 3, 4, 5]
const WEEKEND: DayIndex[] = [0, 6]

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

// Day abbreviations for compact display
const DAY_ABBR: Record<DayIndex, string> = {
  0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat",
}

export default function WorkScheduleDetailsPage() {
  const params = useParams()
  const scheduleId = Number(params.id)
  const { format: timeFormat } = useTimeFormat()
  const orgStore = useOrgStore()

  const { timezone } = useFormatDate()
  const organizationTimezone = timezone || "UTC"

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rules, setRules] = useState<RuleItem[]>(() => DAYS.map(createDefaultRule))
  const [origRules, setOrigRules] = useState<RuleItem[]>([])
  const [scheduleName, setScheduleName] = useState<string>("")
  const [selectedDay, setSelectedDay] = useState<DayIndex>(1)
  const [daysDialogOpen, setDaysDialogOpen] = useState(false)
  const [tempDays, setTempDays] = useState<DayIndex[]>([])
  const [panelBump, setPanelBump] = useState(0)

  type MemberOption = { id: string; label: string; department: string }
  const [members, setMembers] = useState<MemberOption[]>([])
  const [memberSearch, setMemberSearch] = useState("")
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [effectiveDate, setEffectiveDate] = useState<string>("")
  const [departments, setDepartments] = useState<string[]>([])
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")

  const loadDetails = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getWorkScheduleById(String(scheduleId))
      
      if (res.success && res.data) {
        setScheduleName(res.data.name)
        const details = res.data.work_schedule_details || []
        
        const loadedRules: RuleItem[] = DAYS.map((day) => {
          const detail = details.find((d) => Number(d.day_of_week) === day)
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
      } else {
        toast.error(res.message || "Failed to load schedule")
      }
    } catch (error) {
      toast.error("Failed to load schedule details")
    } finally {
      setLoading(false)
    }
  }, [scheduleId])

  useEffect(() => {
    const title = scheduleName?.trim() || (scheduleId ? `Schedule #${scheduleId}` : "Work Schedule")
    document.title = `${title} | Attendance`
  }, [scheduleName, scheduleId])

  useEffect(() => {
    loadDetails()
  }, [loadDetails])

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

  const selectedRule = useMemo(
    () => rules.find((r) => r.day_of_week === selectedDay) || null,
    [rules, selectedDay]
  )

  const isDirty = useMemo(
    () => JSON.stringify(rules) !== JSON.stringify(origRules),
    [rules, origRules]
  )

  const updateRule = (day: DayIndex, patch: Partial<RuleItem>) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.day_of_week !== day) return r
        const updated = { ...r, ...patch }
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

      await loadDetails()
    } catch (error) {
      toast.error("Failed to save schedule")
    } finally {
      setSaving(false)
    }
  }

  const discardChanges = () => {
    setRules(JSON.parse(JSON.stringify(origRules)))
    toast.info("Changes discarded")
  }

  const resetToDefaults = () => {
    const defaults = DAYS.map(createDefaultRule)
    setRules(defaults)
    toast.info("Reset to default schedule")
  }

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

  // Count working days for summary
  const workingDaysCount = rules.filter(r => r.is_working_day).length

  return (
    <>
      <div>
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">
              {scheduleName?.trim() || (scheduleId ? `Schedule #${scheduleId}` : (params?.id ? `Schedule #${params.id}` : "Work Schedule"))}
            </h1>
          </div>

          {/* Summary chips */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {workingDaysCount} working days/week
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              {getTimezoneOffset(organizationTimezone)}
            </div>
            {(isDirty || selectedMemberIds.length > 0) && (
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                Unsaved changes
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {/* ── Main Content ── */}

        {/* ── Timezone info bar ── */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30 text-sm text-muted-foreground">
          <Globe className="h-4 w-4 shrink-0" />
          <span>
            All times are in <strong className="text-foreground font-medium">{getTimezoneLabel(organizationTimezone)}</strong>
            <span className="ml-1.5 text-xs">({getTimezoneOffset(organizationTimezone)})</span>
          </span>
          {/* Mobile unsaved badge */}
          {(isDirty || selectedMemberIds.length > 0) && (
            <Badge variant="outline" className="ml-auto md:hidden text-amber-600 border-amber-300 bg-amber-50">
              Unsaved
            </Badge>
          )}
        </div>

        {/* ── Two-Panel Editor ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">

          {/* ── Left Panel: Day Selector ── */}
          <div className="md:col-span-1 border rounded-xl overflow-hidden bg-card shadow-sm">
            <div className="px-4 py-3 border-b bg-muted/30">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Weekly Schedule
              </p>
            </div>
            <div className="divide-y">
              {DAYS.map((day) => {
                const rule = rules.find((r) => r.day_of_week === day)
                const active = selectedDay === day
                const hours = rule?.is_working_day
                  ? `${formatTimeDisplay(rule.start_time)} – ${formatTimeDisplay(rule.end_time)}`
                  : "Day off"

                return (
                  <div
                    key={day}
                    role="button"
                    tabIndex={0}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors cursor-pointer group ${
                      active
                        ? "bg-primary/5 border-l-2 border-l-primary"
                        : "hover:bg-muted/40 border-l-2 border-l-transparent"
                    }`}
                    onClick={() => setSelectedDay(day)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedDay(day)
                      }
                    }}
                  >
                    <div className="min-w-0">
                      <div className={`text-sm font-medium ${active ? "text-primary" : "text-foreground"}`}>
                        {getDayName(day)}
                      </div>
                      <div className={`text-xs mt-0.5 ${rule?.is_working_day ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                        {hours}
                      </div>
                    </div>
                    <button
                      className={`ml-2 shrink-0 text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                        rule?.is_working_day
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        updateRule(day, { is_working_day: !rule?.is_working_day })
                      }}
                      title={`Toggle ${getDayName(day)} status`}
                    >
                      {rule?.is_working_day ? "Working" : "Off"}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Right Panel: Day Editor ── */}
          <div className="border rounded-xl bg-card shadow-sm md:col-span-2 lg:col-span-3">
            {selectedRule && (
              <div key={`${selectedDay}-${panelBump}`}>
                {/* Panel Header */}
                <div className="px-5 py-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                      selectedRule.is_working_day
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {DAY_ABBR[selectedDay]}
                    </div>
                    <div>
                      <div className="font-semibold">{getDayName(selectedDay)}</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedRule.is_working_day
                          ? `${formatTimeDisplay(selectedRule.start_time)} – ${formatTimeDisplay(selectedRule.end_time)}`
                          : "Not scheduled"}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${
                      selectedRule.is_working_day
                        ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                        : "border-muted text-muted-foreground bg-muted/50"
                    }`}
                  >
                    {selectedRule.is_working_day ? "Working Day" : "Day Off"}
                  </Badge>
                </div>

                <div className="p-5 space-y-5">
                  {/* Quick Presets */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                      Quick Presets
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(["normal", "morning", "evening", "off"] as const).map((key) => (
                        <Button
                          key={key}
                          variant="outline"
                          size="sm"
                          onClick={() => applyPreset(key)}
                          className="text-xs h-8 rounded-full hover:cursor-pointer"
                        >
                          {PRESETS[key].label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Time Fields */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Time Configuration
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      {/* Check In / Out */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Check In
                        </label>
                        <Input
                          key={`start-${selectedDay}`}
                          type="time"
                          value={selectedRule.start_time}
                          disabled={!selectedRule.is_working_day}
                          onChange={(e) => updateRule(selectedDay, { start_time: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Check Out
                        </label>
                        <Input
                          key={`end-${selectedDay}`}
                          type="time"
                          value={selectedRule.end_time}
                          disabled={!selectedRule.is_working_day}
                          onChange={(e) => updateRule(selectedDay, { end_time: e.target.value })}
                          className="h-9"
                        />
                      </div>

                      {/* Break */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Break Start
                        </label>
                        <Input
                          key={`bstart-${selectedDay}`}
                          type="time"
                          value={selectedRule.break_start}
                          disabled={!selectedRule.is_working_day}
                          onChange={(e) => updateRule(selectedDay, { break_start: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Break End
                        </label>
                        <Input
                          key={`bend-${selectedDay}`}
                          type="time"
                          value={selectedRule.break_end}
                          disabled={!selectedRule.is_working_day}
                          onChange={(e) => updateRule(selectedDay, { break_end: e.target.value })}
                          className="h-9"
                        />
                      </div>

                      {/* Core Hours */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Core Hours Start
                        </label>
                        <Input
                          key={`cstart-${selectedDay}`}
                          type="time"
                          value={selectedRule.core_hours_start}
                          disabled={!selectedRule.is_working_day}
                          onChange={(e) => updateRule(selectedDay, { core_hours_start: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Core Hours End
                        </label>
                        <Input
                          key={`cend-${selectedDay}`}
                          type="time"
                          value={selectedRule.core_hours_end}
                          disabled={!selectedRule.is_working_day}
                          onChange={(e) => updateRule(selectedDay, { core_hours_end: e.target.value })}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Copy Actions */}
                  <div className="pt-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 mt-4">
                      Copy to Other Days
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTempDays(WORKDAYS.filter((d) => d !== selectedDay))
                          setDaysDialogOpen(true)
                        }}
                        className="gap-1.5 h-8 text-xs rounded-full"
                      >
                        <Copy className="h-3 w-3" />
                        Select Days
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToDays(WORKDAYS)}
                        className="gap-1.5 h-8 text-xs rounded-full"
                      >
                        <Copy className="h-3 w-3" />
                        Copy to Weekdays
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToDays(DAYS.filter((d) => d !== selectedDay))}
                        className="gap-1.5 h-8 text-xs rounded-full"
                      >
                        <Copy className="h-3 w-3" />
                        Copy to All Days
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Copy Days Dialog ── */}
        <Dialog open={daysDialogOpen} onOpenChange={setDaysDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Copy to Selected Days</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {DAYS.map((d) => (
                <label key={d} className="flex items-center gap-3 py-1.5 cursor-pointer">
                  <Checkbox
                    checked={tempDays.includes(d)}
                    disabled={d === selectedDay}
                    onCheckedChange={(c) => {
                      setTempDays((prev) =>
                        c === true ? (prev.includes(d) ? prev : [...prev, d]) : prev.filter((x) => x !== d)
                      )
                    }}
                  />
                  <span className={`text-sm ${d === selectedDay ? "text-muted-foreground" : ""}`}>
                    {getDayName(d)}
                    {d === selectedDay && <span className="ml-1.5 text-xs">(current)</span>}
                  </span>
                </label>
              ))}
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setTempDays(DAYS.filter((d) => d !== selectedDay))}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={() => setTempDays([])}>
                  Clear
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDaysDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  if (tempDays.length === 0) {
                    const targets = WORKDAYS.filter((d) => d !== selectedDay)
                    setRules((prev) =>
                      prev.map((r) =>
                        targets.includes(r.day_of_week)
                          ? { ...r, is_working_day: false, start_time: "", end_time: "", break_start: "", break_end: "", flexible_hours: false, label: "Day Off", notes: "" }
                          : r
                      )
                    )
                  } else {
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

        {/* ── Assign Members ── */}
        <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
          {/* Section Header */}
          <div className="px-5 py-4 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm">Assign Members</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {scheduleName?.trim() || `Schedule ID: ${scheduleId}`}
            </span>
          </div>

          <div className="p-5 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search members..."
                  className="pl-9 h-9"
                />
              </div>

              <select
                className="h-9 appearance-none border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="all">All groups</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 shrink-0"
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
                <Plus className="h-3.5 w-3.5" />
                Add All
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => {
                  if (selectedMemberIds.length > 0) {
                    setSelectedMemberIds([])
                    toast.info("All members unselected")
                  }
                }}
              >
                <Minus className="h-3.5 w-3.5" />
                Unselect All
              </Button>

              <div className="flex items-center gap-2 shrink-0 ml-auto">
                <label className="text-sm text-muted-foreground whitespace-nowrap">Effective date</label>
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-[148px] h-9"
                />
              </div>
            </div>

            {/* Member list */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Available Members
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1">
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
                      <button
                        key={m.id}
                        type="button"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium text-left transition-all ${
                          selected
                            ? "border-primary/40 bg-primary/5 text-primary"
                            : "border-border bg-background text-foreground hover:bg-muted/50"
                        }`}
                        onClick={() => {
                          setSelectedMemberIds(prev => selected ? prev.filter(x => x !== m.id) : [...prev, m.id])
                        }}
                      >
                        <Plus className={`h-3 w-3 shrink-0 transition-transform ${selected ? "rotate-45" : ""}`} />
                        <span className="truncate">{m.label}{m.department ? ` · ${m.department}` : ''}</span>
                      </button>
                    )
                  })}
              </div>
            </div>

            {/* Selected members */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Selected Members
                </p>
                <span className="text-xs text-muted-foreground">{selectedMemberIds.length} selected</span>
              </div>
              <div className="min-h-[56px] max-h-44 overflow-y-auto border rounded-lg p-2 bg-muted/20">
                {selectedMemberIds.length === 0 ? (
                  <div className="flex items-center justify-center h-10 text-xs text-muted-foreground">
                    No members selected
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {selectedMemberIds.map(id => {
                      const mm = members.find(x => x.id === id)
                      const lbl = mm ? `${mm.label}${mm.department ? ` · ${mm.department}` : ''}` : id
                      return (
                        <button
                          key={id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                          onClick={() => setSelectedMemberIds(prev => prev.filter(x => x !== id))}
                          title="Remove"
                        >
                          <Minus className="h-3 w-3 shrink-0" />
                          <span className="truncate">{lbl}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Bar ── */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToDefaults}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={discardChanges}
            disabled={!isDirty}
            className="gap-2 text-amber-600 border-amber-300 hover:bg-amber-50 disabled:text-muted-foreground disabled:border-muted"
          >
            Discard Changes
          </Button>
          <Button
            onClick={saveAll}
            disabled={((!isDirty && selectedMemberIds.length === 0) || saving)}
            className="gap-2 min-w-[120px]"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

      </div>
    </>
  )
}