"use client"

import { useCallback, useMemo, useState } from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle,
  CalendarOff,
  Ban,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useBatchAttendanceV2, type BatchMemberRow } from "@/hooks/attendance/add/use-batch-attendancev2"
import { BatchPreviewDialog } from "./batch-preview-dialog"
import { UserAvatar } from "@/components/profile&image/user-avatar"
import type { MemberOption } from "@/types/attendance"

function ScheduleStatusBadge({ row }: { row: BatchMemberRow }) {
  if (row.scheduleStatus === "loading") {
    return (
      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading...
      </span>
    )
  }
  if (row.scheduleStatus === "no_schedule") {
    return (
      <span className="flex items-center gap-1 text-[10px] text-amber-600">
        <AlertCircle className="h-3 w-3" />
        No schedule
      </span>
    )
  }
  if (row.scheduleStatus === "holiday") {
    return (
      <span className="flex items-center gap-1 text-[10px] text-amber-600">
        <CalendarOff className="h-3 w-3" />
        Non-working
      </span>
    )
  }
  if (row.isDuplicate) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-red-500">
        <Ban className="h-3 w-3" />
        Duplicate
      </span>
    )
  }
  return null
}

interface MemberRowProps {
  row: BatchMemberRow
  mode: "realtime" | "retroactive"
  onToggle: () => void
  onOverride: (
    field: "overrideCheckIn" | "overrideCheckOut" | "overrideBreakIn" | "overrideBreakOut",
    value: string,
  ) => void
}

function MemberRowItem({ row, mode, onToggle, onOverride }: MemberRowProps) {
  const [expanded, setExpanded] = useState(false)

  const isDisabled = row.isDuplicate
  const hasWarning = row.hasWarning && !row.isDuplicate

  return (
    <div
      className={cn(
        "rounded-xl border transition-all",
        isDisabled
          ? "border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/10 opacity-60"
          : row.isSelected
          ? "border-border bg-background"
          : "border-border bg-muted/20",
        hasWarning && !isDisabled && "border-amber-200 bg-amber-50/30 dark:border-amber-900/30",
      )}
    >
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <button
          type="button"
          onClick={onToggle}
          disabled={isDisabled}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none"
        >
          {row.isSelected ? (
            <CheckSquare className="h-4 w-4 text-foreground" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </button>

        <UserAvatar
          name={row.label}
          photoUrl={row.avatar}
          // PERBAIKAN 2: Konversi null menjadi undefined
          userId={row.userId ?? undefined}
          className="h-8 w-8 shrink-0 border border-border"
        />

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate leading-tight">{row.label}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide truncate">
              {row.department}
            </p>
            <ScheduleStatusBadge row={row} />
          </div>
        </div>

        {row.scheduleStatus === "ok" && row.startTime && (
          <div className="flex items-center gap-1.5 shrink-0 hidden sm:flex">
            {/* Tambahkan Nama Schedule di sini */}
            {row.scheduleName && (
              <span className="text-[10px] font-medium text-foreground truncate max-w-[120px]" title={row.scheduleName}>
                {row.scheduleName}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground font-mono">
              {row.startTime.slice(0, 5)}–{row.endTime?.slice(0, 5)}
            </span>
          </div>
        )}

        {row.isSelected && row.scheduleStatus === "ok" && !isDisabled && (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 h-5 shrink-0",
              row.computedStatus === "present" && "text-emerald-600 border-emerald-200 bg-emerald-50",
              row.computedStatus === "late" && "text-amber-600 border-amber-200 bg-amber-50",
              row.computedStatus === "absent" && "text-red-600 border-red-200 bg-red-50",
            )}
          >
            {row.computedStatus}
          </Badge>
        )}

        {mode === "retroactive" && row.scheduleStatus === "ok" && !isDisabled && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {mode === "retroactive" && expanded && row.scheduleStatus === "ok" && !isDisabled && (
        <div className="px-3 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-2 border-t pt-2.5">
          {[
            { label: "Check In", field: "overrideCheckIn" as const, placeholder: row.startTime?.slice(0, 5) },
            { label: "Check Out", field: "overrideCheckOut" as const, placeholder: row.endTime?.slice(0, 5) },
            { label: "Break In", field: "overrideBreakIn" as const, placeholder: row.breakStart?.slice(0, 5) ?? "—" },
            { label: "Break Out", field: "overrideBreakOut" as const, placeholder: row.breakEnd?.slice(0, 5) ?? "—" },
          ].map(({ label, field, placeholder }) => (
            <div key={field} className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <input
                type="time"
                value={(row[field] as string | undefined) ?? ""}
                onChange={(e) => onOverride(field, e.target.value)}
                placeholder={placeholder ?? ""}
                className="w-full h-7 rounded-lg border bg-background px-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
              {placeholder && (
                <p className="text-[9px] text-muted-foreground">Schedule: {placeholder}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface GroupSectionProps {
  groupKey: string
  groupLabel: string
  rows: BatchMemberRow[]
  mode: "realtime" | "retroactive"
  onToggleAll: (rows: BatchMemberRow[]) => void
  onToggle: (memberId: string) => void
  onOverride: (
    memberId: string,
    field: "overrideCheckIn" | "overrideCheckOut" | "overrideBreakIn" | "overrideBreakOut",
    value: string,
  ) => void
}

function GroupSection({
  groupKey,
  groupLabel,
  rows,
  mode,
  onToggleAll,
  onToggle,
  onOverride,
}: GroupSectionProps) {
  const isWarningGroup =
    groupKey === "__no_schedule__" || groupKey === "__holiday__"
  const isLoadingGroup = groupKey === "__loading__"

  const selectableRows = rows.filter((r) => !r.isDuplicate)
  const allSelected = selectableRows.length > 0 && selectableRows.every((r) => r.isSelected)
  const selectedCount = rows.filter((r) => r.isSelected && !r.isDuplicate).length

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 px-1">
        {!isWarningGroup && !isLoadingGroup && selectableRows.length > 0 && (
          <button
            type="button"
            onClick={() => onToggleAll(selectableRows)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="h-3.5 w-3.5 text-foreground" />
            ) : (
              <Square className="h-3.5 w-3.5" />
            )}
          </button>
        )}

        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isWarningGroup ? (
            <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          ) : isLoadingGroup ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
          ) : (
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          <span
            className={cn(
              "text-xs font-semibold truncate",
              isWarningGroup && "text-amber-600 dark:text-amber-400",
              isLoadingGroup && "text-muted-foreground",
            )}
          >
            {groupLabel}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {selectedCount}/{rows.length}
          </span>
        </div>
      </div>

      <div className="space-y-1 pl-1">
        {rows.map((row) => (
          <MemberRowItem
            key={row.memberId}
            row={row}
            mode={mode}
            onToggle={() => onToggle(row.memberId)}
            onOverride={(field, value) => onOverride(row.memberId, field, value)}
          />
        ))}
      </div>
    </div>
  )
}

interface MemberPickerProps {
  members: MemberOption[]
  addedIds: Set<string>
  onAdd: (ids: string[]) => void
}

function MemberPicker({ members, addedIds, onAdd }: MemberPickerProps) {
  const [search, setSearch] = useState("")
  const [dept, setDept] = useState("all")

  const departments = useMemo(
    () => Array.from(new Set(members.map((m) => m.department))).sort(),
    [members],
  )

  const filtered = members.filter((m) => {
    const matchSearch =
      !search ||
      m.label.toLowerCase().includes(search.toLowerCase()) ||
      m.department.toLowerCase().includes(search.toLowerCase())
    const matchDept = dept === "all" || m.department === dept
    return matchSearch && matchDept
  })

  const allFilteredAdded = filtered.every((m) => addedIds.has(m.id))

  const handleAddAll = () => {
    const toAdd = filtered.filter((m) => !addedIds.has(m.id)).map((m) => m.id)
    if (toAdd.length > 0) onAdd(toAdd)
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="relative shrink-0">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search member..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border bg-background pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      {departments.length > 1 && (
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="h-8 text-xs rounded-xl shrink-0">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {filtered.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddAll}
          disabled={allFilteredAdded}
          className="h-7 text-xs rounded-xl shrink-0 gap-1"
        >
          <Users className="h-3 w-3" />
          Add All ({filtered.filter((m) => !addedIds.has(m.id)).length})
        </Button>
      )}

      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
        {filtered.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">No members found</p>
        ) : (
          filtered.map((m) => {
            const added = addedIds.has(m.id)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => !added && onAdd([m.id])}
                disabled={added}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all text-xs",
                  added
                    ? "opacity-40 cursor-not-allowed bg-muted/30"
                    : "hover:bg-muted/60 active:scale-[0.98]",
                )}
              >
                <UserAvatar
                  name={m.label}
                  photoUrl={m.avatar}
                  // PERBAIKAN 2: Konversi null menjadi undefined
                  userId={m.userId ?? undefined}
                  className="h-7 w-7 shrink-0 border border-border"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate leading-tight">{m.label}</p>
                  <p className="text-[10px] opacity-60 uppercase tracking-wide truncate">{m.department}</p>
                </div>
                {!added && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100" />}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

interface BatchFormProps {
  members: MemberOption[]
  timezone: string
  onCancel: () => void
  onSubmit?: () => Promise<void>
  batch?: any
}

export function BatchForm({ members, timezone, onCancel }: BatchFormProps) {
  const bv2 = useBatchAttendanceV2(members, timezone)

  const addedIds = useMemo(
    () => new Set<string>(bv2.rows.map((r: BatchMemberRow) => r.memberId)),
    [bv2.rows],
  )

  const handleAdd = useCallback(
    (ids: string[]) => { bv2.addMembers(ids) },
    [bv2],
  )

  return (
    <TabsContent value="batch" asChild>
      <div className="flex flex-col gap-3 mt-2">

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border overflow-hidden shrink-0">
            {(["realtime", "retroactive"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => bv2.setMode(m)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  bv2.mode === m
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground hover:bg-muted/60",
                )}
              >
                {m === "realtime" ? "Real-time" : "Retroactive"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">Date:</span>
            <input
              type="date"
              value={bv2.date}
              onChange={(e) => bv2.setDate(e.target.value)}
              className="h-8 rounded-xl border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          {bv2.rows.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground">
                {bv2.stats.selected} selected
              </span>
              {bv2.stats.duplicates > 0 && (
                <Badge variant="outline" className="text-[10px] text-red-500 border-red-200 bg-red-50 gap-1">
                  <Ban className="h-3 w-3" />
                  {bv2.stats.duplicates} duplicate
                </Badge>
              )}
              {bv2.stats.noSchedule > 0 && (
                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50 gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {bv2.stats.noSchedule} no schedule
                </Badge>
              )}
            </div>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground px-0.5">
          {bv2.mode === "realtime"
            ? "Real-time mode: Check-in time will be set to now() when submitted. Only Check In is recorded."
            : "Retroactive mode: Times are taken from each member's schedule. Expand a row to override."}
        </p>

        <div className="flex gap-4 h-[520px] overflow-hidden">
          <div className="hidden md:flex w-[260px] shrink-0 flex-col h-full border-r pr-3">
            <MemberPicker
              members={members}
              addedIds={addedIds}
              onAdd={handleAdd}
            />
          </div>

          <div className="md:hidden shrink-0">
          </div>

          <div className="flex-1 flex flex-col gap-2 min-w-0 h-full overflow-hidden">
            {bv2.rows.length > 0 && (
              <div className="flex gap-2 shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={bv2.search}
                    onChange={(e) => bv2.setSearch(e.target.value)}
                    className="w-full h-8 rounded-xl border bg-background pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {bv2.rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-2xl gap-3 text-center">
                  <Users className="h-8 w-8 text-muted-foreground/40" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      No members added yet
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Select members from the left panel
                    </p>
                  </div>
                </div>
              ) : (
                (Object.entries(bv2.groupedRows) as [string, { label: string; rows: BatchMemberRow[] }][]).map(([key, { label, rows }]) => (
                  <GroupSection
                    key={key}
                    groupKey={key}
                    groupLabel={label}
                    rows={rows}
                    mode={bv2.mode}
                    onToggleAll={bv2.toggleSelectAll}
                    onToggle={bv2.toggleSelect}
                    onOverride={bv2.updateOverride}
                  />
                ))
              )}
            </div>

            <div className="flex items-center justify-between gap-3 shrink-0 pt-2 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-xs"
              >
                Cancel
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={bv2.buildPreview}
                disabled={bv2.stats.selected === 0 || bv2.isLoadingSchedules}
                className="gap-2 min-w-[140px]"
              >
                {bv2.isLoadingSchedules ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading schedules...
                  </>
                ) : (
                  <>
                    Preview & Submit ({bv2.stats.selected})
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <BatchPreviewDialog
          open={bv2.showPreview}
          onOpenChange={bv2.setShowPreview}
          items={bv2.previewItems}
          date={bv2.date}
          timezone={timezone}
          isSubmitting={bv2.isSubmitting}
          onToggleItem={bv2.togglePreviewItem}
          onUpdateStatus={bv2.updatePreviewStatus}
          onConfirm={bv2.submitBatch}
        />
      </div>
    </TabsContent>
  )
}