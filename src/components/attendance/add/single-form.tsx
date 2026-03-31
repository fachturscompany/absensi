"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  LogIn,
  LogOut,
  Coffee,
  Clock,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  CalendarOff,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getMemberSchedule,
  createManualAttendance,
  checkExistingAttendance,
} from "@/action/attendance";
import type { MemberOption } from "@/types/attendance";
import type { DialogHandlers } from "@/components/attendance/add/dialogs/member-dialog";

// ----------------------------------------------------------
// Types
// ----------------------------------------------------------
type AttendanceStep =
  | "idle"
  | "checked_in"
  | "break_in"
  | "break_out"
  | "checked_out";

interface ScheduleRule {
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  day_of_week: number;
}

interface TimestampRecord {
  checkIn: string | null;
  breakIn: string | null;
  breakOut: string | null;
  checkOut: string | null;
}

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------
function nowISO(): string {
  return new Date().toISOString();
}

function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function parseTimeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const parts = time.split(":").map(Number);
  const hh = parts[0] ?? NaN;
  const mm = parts[1] ?? NaN;
  if (isNaN(hh) || isNaN(mm)) return null;
  return hh * 60 + mm;
}

function currentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function formatTime(iso: string | null): string {
  if (!iso) return "--:--";
  try {
    return format(new Date(iso), "HH:mm");
  } catch {
    return "--:--";
  }
}

// ----------------------------------------------------------
// Step progress config
// ----------------------------------------------------------
const STEP_ORDER: AttendanceStep[] = [
  "idle",
  "checked_in",
  "break_in",
  "break_out",
  "checked_out",
];

const STEP_LABELS: Record<Exclude<AttendanceStep, "idle">, string> = {
  checked_in: "Check In",
  break_in: "Break In",
  break_out: "Break Out",
  checked_out: "Check Out",
};

function stepIndex(step: AttendanceStep): number {
  return STEP_ORDER.indexOf(step);
}

// ----------------------------------------------------------
// Live clock
// ----------------------------------------------------------
function LiveClock() {
  const [time, setTime] = useState(() => format(new Date(), "HH:mm:ss"));
  useEffect(() => {
    const id = setInterval(
      () => setTime(format(new Date(), "HH:mm:ss")),
      1000,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono tabular-nums text-xl font-semibold tracking-tight">
      {time}
    </span>
  );
}

// ----------------------------------------------------------
// Action button
// ----------------------------------------------------------
interface ActionButtonProps {
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  variant: "checkin" | "breakin" | "breakout" | "checkout";
  done: boolean;
}

const VARIANT_ACTIVE: Record<ActionButtonProps["variant"], string> = {
  checkin:
    "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950/40 dark:text-gray-400 dark:hover:bg-gray-950/60",
  breakin:
    "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950/40 dark:text-gray-400 dark:hover:bg-gray-950/60",
  breakout:
    "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950/40 dark:text-gray-400 dark:hover:bg-gray-950/60",
  checkout:
    "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950/40 dark:text-gray-400 dark:hover:bg-gray-950/60",
};

const VARIANT_DONE: Record<ActionButtonProps["variant"], string> = {
  checkin:
    "border-gray-300 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-950/60 dark:text-gray-500",
  breakin:
    "border-gray-300 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-950/60 dark:text-gray-500",
  breakout:
    "border-gray-300 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-950/60 dark:text-gray-500",
  checkout:
    "border-gray-300 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-950/60 dark:text-gray-500",
};

function ActionButton({
  label,
  sublabel,
  icon,
  onClick,
  disabled,
  loading,
  variant,
  done,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading || done}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-5 transition-all duration-200 w-full",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        done ? VARIANT_DONE[variant] : VARIANT_ACTIVE[variant],
        !disabled && !done && "shadow-sm hover:shadow-md active:scale-[0.98]",
      )}
    >
      {done && (
        <span className="absolute top-2 right-2">
          <CheckCircle2 className="h-4 w-4" />
        </span>
      )}
      <span className="text-2xl">
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : icon}
      </span>
      <span className="text-sm font-semibold leading-none">{label}</span>
      {sublabel && (
        <span className="text-[11px] font-normal opacity-70 text-center leading-tight">
          {sublabel}
        </span>
      )}
    </button>
  );
}

// ----------------------------------------------------------
// Main Component
// ----------------------------------------------------------
interface SingleFormProps {
  activeTab: "single" | "batch";
  members: MemberOption[];
  loading: boolean;
  dialogHandlers: DialogHandlers;
  // ✅ Prop baru — dipanggil dari parent saat MemberDialog confirm pilihan
  selectedMemberId?: string;
  onMemberSelect?: (memberId: string) => void;
  // Legacy props — dibiarkan agar tidak break parent
  form?: any;
  singleCheckInDate?: string | null;
  onSubmit?: (values: any) => Promise<void>;
}

export function SingleForm({
  activeTab: _activeTab,
  members,
  loading: membersLoading,
  dialogHandlers,
  selectedMemberId: externalMemberId = "",
  onMemberSelect: _onMemberSelect,
}: SingleFormProps) {
  const router = useRouter();

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------
  const [schedule, setSchedule] = useState<ScheduleRule | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isHoliday, setIsHoliday] = useState(false);

  const [step, setStep] = useState<AttendanceStep>("idle");
  const [timestamps, setTimestamps] = useState<TimestampRecord>({
    checkIn: null,
    breakIn: null,
    breakOut: null,
    checkOut: null,
  });

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");

  // ----------------------------------------------------------
  // Reset + fetch schedule saat member berubah
  // ----------------------------------------------------------
  useEffect(() => {
    if (!externalMemberId) return;

    // Reset semua state saat member berganti
    setStep("idle");
    setTimestamps({ checkIn: null, breakIn: null, breakOut: null, checkOut: null });
    setRemarks("");
    setSchedule(null);
    setScheduleError(null);
    setIsHoliday(false);

    const fetchSchedule = async () => {
      setScheduleLoading(true);
      const today = todayISO();
      const res = await getMemberSchedule(externalMemberId, today);
      setScheduleLoading(false);

      if (!res.success || !res.data) {
        setScheduleError(res.message || "No schedule found for today");
        setIsHoliday(true);
        return;
      }

      const rule = res.data as ScheduleRule;

      // start_time kosong = non-working day
      if (!rule.start_time) {
        setIsHoliday(true);
        setScheduleError("Today is a non-working day based on the assigned schedule");
        return;
      }

      setSchedule(rule);
    };

    fetchSchedule();
  }, [externalMemberId]);

  // ----------------------------------------------------------
  // Break window check — waktu sekarang dalam range break_start–break_end
  // ----------------------------------------------------------
  const isInBreakWindow = useCallback((): boolean => {
    if (!schedule?.break_start || !schedule?.break_end) return false;
    const current = currentMinutes();
    const bStart = parseTimeToMinutes(schedule.break_start);
    const bEnd = parseTimeToMinutes(schedule.break_end);
    if (bStart === null || bEnd === null) return false;
    return current >= bStart && current <= bEnd;
  }, [schedule]);

  // ----------------------------------------------------------
  // Selected member info
  // ----------------------------------------------------------
  const selectedMember = members.find((m) => m.id === externalMemberId);

  // ----------------------------------------------------------
  // Button enable/disable logic
  // ----------------------------------------------------------
  const canCheckIn =
    !isHoliday && step === "idle" && !!externalMemberId && !!schedule;

  const canBreakIn =
    !isHoliday &&
    step === "checked_in" &&
    !!schedule?.break_start &&
    isInBreakWindow();

  const canBreakOut = !isHoliday && step === "break_in";

  // Check out bisa dilakukan setelah CI, atau setelah BO (skip break juga boleh)
  const canCheckOut =
    !isHoliday && (step === "checked_in" || step === "break_out");

  const isDone = (targetStep: AttendanceStep) =>
    stepIndex(step) > stepIndex(targetStep);

  // ----------------------------------------------------------
  // Actions
  // ----------------------------------------------------------
  const handleCheckIn = async () => {
    if (!externalMemberId || !schedule) return;
    setActionLoading("checkin");
    try {
      const today = todayISO();
      const existing = await checkExistingAttendance(externalMemberId, today);
      if (existing.exists) {
        toast.error("Attendance already exists for today");
        return;
      }
      const now = nowISO();
      setTimestamps((prev) => ({ ...prev, checkIn: now }));
      setStep("checked_in");
      toast.success(`Check In recorded at ${formatTime(now)}`);
    } catch {
      toast.error("Failed to record Check In");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBreakIn = async () => {
    setActionLoading("breakin");
    try {
      const now = nowISO();
      setTimestamps((prev) => ({ ...prev, breakIn: now }));
      setStep("break_in");
      toast.success(`Break started at ${formatTime(now)}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBreakOut = async () => {
    setActionLoading("breakout");
    try {
      const now = nowISO();
      setTimestamps((prev) => ({ ...prev, breakOut: now }));
      setStep("break_out");
      toast.success(`Break ended at ${formatTime(now)}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async () => {
    if (!externalMemberId || !timestamps.checkIn) return;
    setActionLoading("checkout");
    try {
      const now = nowISO();
      const today = todayISO();

      const result = await createManualAttendance({
        organization_member_id: externalMemberId,
        attendance_date: today,
        actual_check_in: timestamps.checkIn,
        actual_check_out: now,
        actual_break_start: timestamps.breakIn ?? null,
        actual_break_end: timestamps.breakOut ?? null,
        status: "present",
        remarks: remarks.trim() || undefined,
        check_in_method: "manual",
        check_out_method: "manual",
      });

      if (!result.success) {
        toast.error(result.message || "Failed to save attendance");
        return;
      }

      setTimestamps((prev) => ({ ...prev, checkOut: now }));
      setStep("checked_out");
      toast.success("Attendance saved successfully!");

      setTimeout(() => router.push("/attendance"), 1500);
    } catch {
      toast.error("Failed to record Check Out");
    } finally {
      setActionLoading(null);
    }
  };

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <TabsContent value="single" className="space-y-5">

      {/* ── Member selector ── */}
      <Card className="border shadow-sm">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              {selectedMember ? (
                <>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {selectedMember.label.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {selectedMember.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedMember.department}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No member selected
                </p>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={membersLoading || step !== "idle"}
              onClick={() => {
                dialogHandlers.setActiveBatchEntryId(null);
                dialogHandlers.setMemberDialogOpen(true);
              }}
              className="shrink-0 gap-2"
            >
              <Search className="h-4 w-4" />
              {selectedMember ? "Change Member" : "Select Member"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Schedule info + live clock ── */}
      {externalMemberId && (
        <Card className="border shadow-sm">
          <CardContent className="pt-4 pb-4">
            {scheduleLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading schedule...
              </div>
            ) : isHoliday ? (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <CalendarOff className="h-4 w-4 shrink-0" />
                <span>{scheduleError || "Today is a non-working day"}</span>
              </div>
            ) : schedule ? (
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">
                    {schedule.start_time?.slice(0, 5)} –{" "}
                    {schedule.end_time?.slice(0, 5)}
                  </span>
                </div>
                {schedule.break_start && schedule.break_end && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Coffee className="h-3.5 w-3.5" />
                    <span>
                      Break:{" "}
                      <span className="font-medium text-foreground">
                        {schedule.break_start.slice(0, 5)} –{" "}
                        {schedule.break_end.slice(0, 5)}
                      </span>
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-muted-foreground ml-auto">
                  <Timer className="h-3.5 w-3.5" />
                  <LiveClock />
                </div>
              </div>
            ) : scheduleError ? (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{scheduleError}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* ── Step progress bar ── */}
      {externalMemberId && !isHoliday && (
        <div className="flex items-start gap-1 px-1">
          {(Object.keys(STEP_LABELS) as Exclude<AttendanceStep, "idle">[]).map(
            (s, i, arr) => {
              const idx = stepIndex(s);
              const currentIdx = stepIndex(step);
              const isCompleted = currentIdx > idx;
              const isActive = currentIdx === idx;
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "h-1.5 w-full rounded-full transition-all duration-300",
                        isCompleted
                          ? "bg-primary"
                          : isActive
                          ? "bg-primary/40"
                          : "bg-muted",
                      )}
                    />
                    <span
                      className={cn(
                        "mt-1.5 text-[10px] font-medium",
                        isCompleted || isActive
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      {STEP_LABELS[s]}
                    </span>
                  </div>
                  {i < arr.length - 1 && <div className="w-1 shrink-0" />}
                </div>
              );
            },
          )}
        </div>
      )}

      {/* ── 4 Action buttons ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ActionButton
          label="Check In"
          sublabel={
            timestamps.checkIn
              ? formatTime(timestamps.checkIn)
              : "Tap to start"
          }
          icon={<LogIn className="h-6 w-6" />}
          onClick={handleCheckIn}
          disabled={!canCheckIn}
          loading={actionLoading === "checkin"}
          variant="checkin"
          done={isDone("checked_in")}
        />
        <ActionButton
          label="Break In"
          sublabel={
            schedule?.break_start
              ? timestamps.breakIn
                ? formatTime(timestamps.breakIn)
                : `From ${schedule.break_start.slice(0, 5)}`
              : "No break scheduled"
          }
          icon={<Coffee className="h-6 w-6" />}
          onClick={handleBreakIn}
          disabled={!canBreakIn}
          loading={actionLoading === "breakin"}
          variant="breakin"
          done={isDone("break_in")}
        />
        <ActionButton
          label="Break Out"
          sublabel={
            timestamps.breakOut ? formatTime(timestamps.breakOut) : "End break"
          }
          icon={<Coffee className="h-6 w-6" />}
          onClick={handleBreakOut}
          disabled={!canBreakOut}
          loading={actionLoading === "breakout"}
          variant="breakout"
          done={isDone("break_out")}
        />
        <ActionButton
          label="Check Out"
          sublabel={
            timestamps.checkOut
              ? formatTime(timestamps.checkOut)
              : "Tap to finish"
          }
          icon={<LogOut className="h-6 w-6" />}
          onClick={handleCheckOut}
          disabled={!canCheckOut}
          loading={actionLoading === "checkout"}
          variant="checkout"
          done={isDone("checked_out")}
        />
      </div>

      {/* ── Timestamp summary ── */}
      {step !== "idle" && (
        <Card className="border shadow-sm bg-muted/30">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm">
              {[
                {
                  label: "Check In",
                  value: timestamps.checkIn,
                  color: "text-emerald-600 dark:text-emerald-400",
                },
                {
                  label: "Break In",
                  value: timestamps.breakIn,
                  color: "text-amber-600 dark:text-amber-400",
                },
                {
                  label: "Break Out",
                  value: timestamps.breakOut,
                  color: "text-blue-600 dark:text-blue-400",
                },
                {
                  label: "Check Out",
                  value: timestamps.checkOut,
                  color: "text-red-600 dark:text-red-400",
                },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p
                    className={cn(
                      "font-mono font-semibold tabular-nums",
                      item.value
                        ? item.color
                        : "text-muted-foreground/40",
                    )}
                  >
                    {item.value ? formatTime(item.value) : "--:--"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Remarks ── */}
      {step !== "idle" && step !== "checked_out" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Notes (Optional)</Label>
          <Textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add any notes about this attendance..."
            rows={2}
            maxLength={500}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {remarks.length}/500
          </p>
        </div>
      )}

      {/* ── Break In belum waktunya — hint ── */}
      {step === "checked_in" && schedule?.break_start && !isInBreakWindow() && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Break In will be available during the scheduled break window:{" "}
            <strong>
              {schedule.break_start.slice(0, 5)} –{" "}
              {schedule.break_end?.slice(0, 5)}
            </strong>
          </span>
        </div>
      )}

      {/* ── Holiday state ── */}
      {isHoliday && externalMemberId && (
        <div className="flex items-start gap-2 rounded-lg border border-muted bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <CalendarOff className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            All attendance actions are disabled. Today is marked as a
            non-working day in the member&apos;s schedule.
          </span>
        </div>
      )}

      {/* ── Success state ── */}
      {step === "checked_out" && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="font-medium">
            Attendance complete! Redirecting to attendance list...
          </span>
        </div>
      )}

      {/* ── Cancel ── */}
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={actionLoading !== null}
        >
          Cancel
        </Button>
      </div>
    </TabsContent>
  );
}