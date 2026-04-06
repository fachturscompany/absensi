"use client"

import { useState, useEffect, useRef } from "react"
import { UseFormReturn } from "react-hook-form"
import { toast } from "sonner"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezonePlugin from "dayjs/plugin/timezone"
import { TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  LogIn, LogOut, Coffee, Clock, Search,
  AlertCircle, CheckCircle2, Loader2, CalendarOff,
} from "lucide-react"
import { cn } from "@/lib/utils"

import {
  getMemberSchedule,
  checkExistingAttendance,
  createManualAttendance,
  updateAttendanceRecord,
} from "@/action/attendance"
import type { MemberOption, ScheduleRule, AttendanceFormValues } from "@/types/attendance"
import type { DialogHandlers } from "@/components/attendance/add/dialogs/member-dialog"
import { PaginationFooterCompact } from "@/components/customs/pagination-footer-compact"
import { UserAvatar } from "@/components/profile&image/user-avatar"

dayjs.extend(utc)
dayjs.extend(timezonePlugin)

type AttendanceStep = "idle" | "checked_in" | "break_in" | "break_out" | "checked_out"

interface TimestampRecord {
  checkIn: string | null
  breakIn: string | null
  breakOut: string | null
  checkOut: string | null
}

export interface SingleFormProps {
  activeTab: "single" | "batch"
  members: MemberOption[]
  loading: boolean
  dialogHandlers: DialogHandlers
  selectedMemberId?: string
  onMemberSelect?: (memberId: string) => void
  timezone: string
  form: UseFormReturn<AttendanceFormValues>
}

const nowISO = () => new Date().toISOString()
const todayISO = (tz: string) => dayjs().tz(tz).format("YYYY-MM-DD")
const formatTime = (iso: string | null, tz: string) => {
  if (!iso) return "--:--"
  return dayjs.utc(iso).tz(tz).format("HH:mm")
}

const STEP_ORDER: AttendanceStep[] = [
  "idle", "checked_in", "break_in", "break_out", "checked_out",
]
function stepIndex(step: AttendanceStep) { return STEP_ORDER.indexOf(step) }
function isDone(current: AttendanceStep, target: AttendanceStep) {
  return stepIndex(current) > stepIndex(target)
}

function LiveClock({ timezone }: { timezone: string }) {
  const [time, setTime] = useState(() => dayjs().tz(timezone).format("HH:mm:ss"))
  useEffect(() => {
    const id = setInterval(
      () => setTime(dayjs().tz(timezone).format("HH:mm:ss")),
      1000,
    )
    return () => clearInterval(id)
  }, [timezone])
  return (
    <span className="font-mono tabular-nums text-sm font-semibold">{time}</span>
  )
}

interface ActionBtnProps {
  label: string
  time: string | null
  icon: React.ReactNode
  onClick: () => void
  disabled: boolean
  loading: boolean
  done: boolean
  active: boolean
  tz: string
}

function ActionBtn({
  label, time, icon, onClick, disabled, loading, done, active, tz,
}: ActionBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading || done}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 transition-all duration-150",
        "w-full h-[88px] sm:h-24",
        "disabled:opacity-35 disabled:cursor-not-allowed disabled:pointer-events-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        done
          ? "border-border bg-muted/40 text-muted-foreground"
          : active
            ? "border-border bg-muted text-foreground hover:cursor-pointer"
            : "border-border bg-background text-foreground hover:border-foreground/40 hover:bg-muted/30",
        !disabled && !done && !active && "active:scale-[0.97]",
      )}
    >
      {done && (
        <CheckCircle2 className="absolute top-2 right-2 h-3.5 w-3.5 text-muted-foreground/60" />
      )}
      <span className={cn("transition-all", loading ? "opacity-0" : "opacity-100")}>
        {icon}
      </span>
      {loading && <Loader2 className="absolute h-5 w-5 animate-spin pb-1" />}
      <span className="text-[11px] font-semibold tracking-wide uppercase leading-none">
        {label}
      </span>
      {time && (
        <span className="text-[10px] font-mono opacity-60 leading-none">
          {formatTime(time, tz)}
        </span>
      )}
    </button>
  )
}

export function SingleForm({
  members,
  dialogHandlers,
  selectedMemberId: externalMemberId = "",
  timezone,
  form,
}: SingleFormProps) {
  const [recordId, setRecordId] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<ScheduleRule | null>(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [isHoliday, setIsHoliday] = useState(false)
  const [step, setStep] = useState<AttendanceStep>("idle")

  const [timestamps, setTimestamps] = useState<TimestampRecord>({
    checkIn: null, breakIn: null, breakOut: null, checkOut: null,
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [memberSearch, setMemberSearch] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)

  const [inBreakWindow, setInBreakWindow] = useState(false)

  const [today, setToday] = useState(() => todayISO(timezone))

  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentDay = todayISO(timezone)
      if (currentDay !== today) {
        setToday(currentDay)
      }
    }, 60000)
    return () => clearInterval(intervalId)
  }, [timezone, today])

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  useEffect(() => { setCurrentPage(1) }, [memberSearch])

  useEffect(() => {
    const checkBreakWindow = () => {
      if (!schedule?.break_start || !schedule?.break_end) {
        setInBreakWindow(false)
        return
      }
      const cur =
        dayjs().tz(timezone).hour() * 60 + dayjs().tz(timezone).minute()
      const parse = (t: string) => {
        const parts = t.split(":").map(Number)
        return (parts[0] ?? 0) * 60 + (parts[1] ?? 0)
      }
      const bs = parse(schedule.break_start)
      const be = parse(schedule.break_end)
      setInBreakWindow(cur >= bs && cur <= be)
    }

    checkBreakWindow()
    const id = setInterval(checkBreakWindow, 30_000)
    return () => clearInterval(id)
  }, [schedule, timezone])

  useEffect(() => {
    if (!externalMemberId) return

    setRecordId(null)
    setStep("idle")
    setTimestamps({ checkIn: null, breakIn: null, breakOut: null, checkOut: null })
    setSchedule(null)
    setIsHoliday(false)
    setScheduleError(null)
    setInBreakWindow(false)
    form.setValue("remarks", "")

    const init = async () => {
      setScheduleLoading(true)

      const [scheduleRes, attendanceRes] = await Promise.all([
        getMemberSchedule(externalMemberId, today),
        checkExistingAttendance(externalMemberId, today),
      ])

      setScheduleLoading(false)

      if (scheduleRes.success && scheduleRes.data) {
        const rule = scheduleRes.data as ScheduleRule
        setSchedule(rule)
        setIsHoliday(false)
      } else {
        setIsHoliday(true)
        setScheduleError(scheduleRes.message || "Non-working day")
      }

      if (attendanceRes.exists && (attendanceRes as any).data) {
        const r = (attendanceRes as any).data
        setRecordId(String(r.id))

        setTimestamps({
          checkIn: r.actual_check_in ?? null,
          breakIn: r.actual_break_start ?? null,
          breakOut: r.actual_break_end ?? null,
          checkOut: r.actual_check_out ?? null,
        })

        if (r.actual_check_out) setStep("checked_out")
        else if (r.actual_break_end) setStep("break_out")
        else if (r.actual_break_start) setStep("break_in")
        else if (r.actual_check_in) setStep("checked_in")
      }
    }

    init()
  }, [externalMemberId, today])

  const handleCheckIn = async () => {
    setActionLoading("checkin")

    const existing = await checkExistingAttendance(externalMemberId, today)
    if (existing.exists) {
      toast.error("Already checked in today")
      setActionLoading(null)
      return
    }

    const now = nowISO()
    const res = await createManualAttendance({
      organization_member_id: externalMemberId,
      attendance_date: today,
      actual_check_in: now,
      actual_check_out: null,
      status: "present",
      remarks: form.getValues("remarks") || "",
      check_in_method: "MANUAL",
    })

    if (res.success) {
      const newRecord = await checkExistingAttendance(externalMemberId, today)
      if (newRecord.exists && (newRecord as any).data) {
        setRecordId(String((newRecord as any).data.id))
      }
      setTimestamps(p => ({ ...p, checkIn: now }))
      setStep("checked_in")
      toast.success("Check In recorded")
    } else {
      toast.error(res.message || "Failed to Check In")
    }
    setActionLoading(null)
  }

  const handleBreakIn = async () => {
    if (!recordId) return
    setActionLoading("break_in")
    const now = nowISO()

    const res = await updateAttendanceRecord({
      id: recordId,
      actual_break_start: now,
      remarks: form.getValues("remarks") || ""
    })

    if (res.success) {
      setTimestamps(p => ({ ...p, breakIn: now }))
      setStep("break_in")
      toast.success("Break started")
    } else {
      toast.error(res.message || "Failed to start break")
    }
    setActionLoading(null)
  }

  const handleBreakOut = async () => {
    if (!recordId) return
    setActionLoading("break_out")
    const now = nowISO()

    const res = await updateAttendanceRecord({
      id: recordId,
      actual_break_end: now,
      remarks: form.getValues("remarks") || ""
    })

    if (res.success) {
      setTimestamps(p => ({ ...p, breakOut: now }))
      setStep("break_out")
      toast.success("Break ended")
    } else {
      toast.error(res.message || "Failed to end break")
    }
    setActionLoading(null)
  }

  const handleCheckOut = async () => {
    if (!recordId) return
    setActionLoading("check_out")
    const now = nowISO()

    const res = await updateAttendanceRecord({
      id: recordId,
      actual_check_out: now,
      remarks: form.getValues("remarks") || "",
    })

    if (res.success) {
      setTimestamps(p => ({ ...p, checkOut: now }))
      setStep("checked_out")
      toast.success("Check Out recorded")
    } else {
      toast.error(res.message || "Failed to Check Out")
    }
    setActionLoading(null)
  }

  const filteredMembers = members.filter((m: MemberOption) =>
    m.label.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.department.toLowerCase().includes(memberSearch.toLowerCase()),
  )

  const totalMembers = filteredMembers.length
  const totalPages = Math.ceil(totalMembers / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + pageSize)

  const canCheckIn = !isHoliday && step === "idle" && !!externalMemberId && !!schedule
  const canBreakIn = !isHoliday && step === "checked_in" && !!schedule?.break_start && inBreakWindow
  const canBreakOut = !isHoliday && step === "break_in"
  const canCheckOut = !isHoliday && (step === "checked_in" || step === "break_out")

  const selectedMember = members.find((m: MemberOption) => m.id === externalMemberId)

  return (
    <TabsContent value="single" asChild>
      <div className="flex gap-4 h-[600px] overflow-hidden mb-2 mt-2">

        <div className="hidden md:flex w-[280px] shrink-0 flex-col gap-3 h-full border-r pr-2 border-border pb-1 mt-2 mb-2">
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search member..."
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
              className="w-full rounded-2xl border-2 bg-background pl-10 pr-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all border-border"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
            {totalMembers === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">
                No members found
              </p>
            ) : paginatedMembers.map((m: MemberOption) => (
              <button
                key={m.id}
                type="button"
                onClick={() =>
                  form.setValue("memberId", m.id, { shouldValidate: true })
                }
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                  m.id === externalMemberId
                    ? "bg-muted text-foreground"
                    : "bg-background text-foreground hover:border-foreground/40 hover:bg-muted/30",
                )}
              >
                <UserAvatar
                  name={m.label}
                  photoUrl={m.avatar}
                  userId={m.userId}
                  className={cn(
                    "h-9 w-9 border border-border shadow-sm shrink-0",
                    m.id === externalMemberId ? "bg-background" : "bg-muted",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate leading-tight">
                    {m.label}
                  </p>
                  <p className="text-[10px] opacity-60 truncate uppercase tracking-wider">{m.department}</p>
                </div>
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="shrink-0 pt-2 border-t border-border flex items-center justify-center">
              <PaginationFooterCompact
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-3 min-w-0 h-full overflow-y-auto pr-1">

          <div className="md:hidden shrink-0">
            <button
              type="button"
              onClick={() => dialogHandlers.setMemberDialogOpen(true)}
              className="w-full flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 text-left hover:border-foreground/40 transition-colors"
            >
              {selectedMember ? (
                <>
                  <UserAvatar
                    name={selectedMember.label}
                    photoUrl={selectedMember.avatar}
                    userId={selectedMember.userId}
                    className="h-9 w-9 border border-border shadow-sm shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {selectedMember.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate uppercase tracking-wider">
                      {selectedMember.department}
                    </p>
                  </div>
                </>
              ) : (
                <span className="text-sm text-muted-foreground flex-1">
                  Tap to select member...
                </span>
              )}
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </div>

          {externalMemberId && (
            <div className={cn(
              "flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-xs shrink-0",
              isHoliday
                ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
                : "bg-muted/40 border border-border",
            )}>
              <span className="flex items-center gap-3 text-muted-foreground">
                {scheduleLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isHoliday ? (
                  <span className="text-amber-700 flex items-center gap-1.5 font-medium">
                    <CalendarOff className="h-3.5 w-3.5" />
                    {scheduleError}
                  </span>
                ) : schedule ? (
                  <span className="flex items-center gap-1 text-foreground font-bold uppercase tracking-wide">
                    <Clock className="h-3.5 w-3.5 opacity-50 mr-1" />
                    {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                    {schedule.break_start && (
                      <span className="text-muted-foreground font-medium ml-2 border-l pl-2 border-border">
                        BREAK {schedule.break_start.slice(0, 5)} - {schedule.break_end?.slice(0, 5)}
                      </span>
                    )}
                  </span>
                ) : null}
              </span>
              <LiveClock timezone={timezone} />
            </div>
          )}

          {externalMemberId ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 shrink-0">
                <ActionBtn
                  label="Check In"
                  icon={<LogIn className="h-5 w-5" />}
                  time={timestamps.checkIn}
                  onClick={handleCheckIn}
                  disabled={!canCheckIn}
                  loading={actionLoading === "checkin"}
                  done={isDone(step, "checked_in")}
                  active={step === "idle" && canCheckIn}
                  tz={timezone}
                />
                <ActionBtn
                  label="Break In"
                  icon={<Coffee className="h-5 w-5" />}
                  time={timestamps.breakIn}
                  onClick={handleBreakIn}
                  disabled={!canBreakIn}
                  loading={actionLoading === "break_in"}
                  done={isDone(step, "break_in")}
                  active={step === "checked_in" && canBreakIn}
                  tz={timezone}
                />
                <ActionBtn
                  label="Break Out"
                  icon={<Coffee className="h-5 w-5" />}
                  time={timestamps.breakOut}
                  onClick={handleBreakOut}
                  disabled={!canBreakOut}
                  loading={actionLoading === "break_out"}
                  done={isDone(step, "break_out")}
                  active={step === "break_in"}
                  tz={timezone}
                />
                <ActionBtn
                  label="Check Out"
                  icon={<LogOut className="h-5 w-5" />}
                  time={timestamps.checkOut}
                  onClick={handleCheckOut}
                  disabled={!canCheckOut}
                  loading={actionLoading === "check_out"}
                  done={isDone(step, "checked_out")}
                  active={canCheckOut}
                  tz={timezone}
                />
              </div>

              {!isHoliday && (
                <div className="flex gap-1 shrink-0">
                  {(["checked_in", "break_in", "break_out", "checked_out"] as const).map((s) => (
                    <div key={s} className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                      <div className={cn(
                        "h-full transition-all duration-500",
                        stepIndex(step) > stepIndex(s)
                          ? "bg-foreground"
                          : stepIndex(step) === stepIndex(s)
                            ? "bg-foreground/30"
                            : "bg-transparent",
                      )} />
                    </div>
                  ))}
                </div>
              )}

              {step === "checked_in" && schedule?.break_start && !inBreakWindow && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 shrink-0">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    Break available{" "}
                    {schedule.break_start.slice(0, 5)} - {schedule.break_end?.slice(0, 5)}
                  </span>
                </div>
              )}

              {step !== "idle" && step !== "checked_out" && (
                <div className="space-y-2 shrink-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Session Remarks
                  </p>
                  <Textarea
                    value={form.watch("remarks") || ""}
                    onChange={e => form.setValue("remarks", e.target.value)}
                    placeholder="Notes (optional)..."
                    className="resize-none text-xs rounded-xl"
                    rows={3}
                  />
                </div>
              )}

              {step === "checked_out" && (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/20 px-4 py-3 text-slate-700 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl py-12 gap-3 text-center">
              <Search className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground px-4">
                Select a member from the list to start recording attendance
              </p>
            </div>
          )}
        </div>
      </div>
    </TabsContent>
  )
}