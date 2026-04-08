"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BatchPreviewItem } from "@/hooks/attendance/add/use-batch-attendancev2"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezonePlugin from "dayjs/plugin/timezone"

dayjs.extend(utc)
dayjs.extend(timezonePlugin)

const STATUS_STYLES: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-700 border-emerald-200",
  late: "bg-amber-100 text-amber-700 border-amber-200",
  absent: "bg-red-100 text-red-700 border-red-200",
  excused: "bg-gray-100 text-gray-700 border-gray-200",
}

interface BatchPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: BatchPreviewItem[]
  date: string
  timezone: string
  isSubmitting: boolean
  onToggleItem: (memberId: string) => void
  onUpdateStatus: (memberId: string, status: "present" | "late" | "absent") => void
  onUpdateCheckIn: (memberId: string, timeValue: string) => void
  onUpdateCheckOut: (memberId: string, timeValue: string) => void
  onConfirm: () => void
}

export function BatchPreviewDialog({
  open,
  onOpenChange,
  items,
  date,
  timezone,
  isSubmitting,
  onToggleItem,
  onUpdateStatus,
  onUpdateCheckIn,   // <--- Terima props baru
  onUpdateCheckOut,  // <--- Terima props baru
  onConfirm,
}: BatchPreviewDialogProps) {
  const toSave = items.filter((i) => i.include)
  const warnings = items.filter((i) => i.hasWarning && i.include)
  const excluded = items.filter((i) => !i.include)

  // Fungsi helper: Mengubah format ISO dari database (2026-04-08T07:30:00Z) 
  // menjadi format jam "HH:mm" untuk ditampilkan di input type="time".
  const getHHmm = (iso: string | null) => {
    if (!iso) return ""
    return dayjs.utc(iso).tz(timezone).format("HH:mm")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-base font-semibold">
            Preview & Edit Batch Attendance
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {date} · You can adjust the Check In and Check Out times before saving.
          </p>

          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="gap-1 text-xs font-normal">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              {toSave.length} ready
            </Badge>
            {warnings.length > 0 && (
              <Badge variant="outline" className="gap-1 text-xs font-normal text-amber-600 border-amber-200 bg-amber-50">
                <AlertCircle className="h-3 w-3" />
                {warnings.length} warning
              </Badge>
            )}
            {excluded.length > 0 && (
              <Badge variant="outline" className="gap-1 text-xs font-normal text-muted-foreground">
                {excluded.length} excluded
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-3">
          <div className="space-y-1">
            <div className="grid grid-cols-[auto_1fr_100px_100px_100px_32px] gap-2 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span className="w-4" />
              <span>Member</span>
              <span className="text-center">Check In</span>
              <span className="text-center">Check Out</span>
              <span className="text-center">Status</span>
              <span />
            </div>

            {items.map((item) => (
              <div
                key={item.memberId}
                className={cn(
                  "grid grid-cols-[auto_1fr_100px_100px_100px_32px] gap-2 items-center px-2 py-2 rounded-lg transition-colors",
                  item.include ? "bg-background" : "bg-muted/30 opacity-50",
                  item.hasWarning && item.include && "bg-amber-50/50 dark:bg-amber-950/20",
                )}
              >
                <input
                  type="checkbox"
                  checked={item.include}
                  onChange={() => onToggleItem(item.memberId)}
                  className="h-4 w-4 rounded border-border cursor-pointer accent-foreground"
                />

                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate leading-tight">
                    {item.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {item.department}
                    {item.hasWarning && item.warningMessage && (
                      <span className="text-amber-600 ml-1">· {item.warningMessage}</span>
                    )}
                  </p>
                </div>

                {/* --- INPUT EDITABLE CHECK IN --- */}
                <input
                  type="time"
                  value={getHHmm(item.checkIn)}
                  onChange={(e) => onUpdateCheckIn(item.memberId, e.target.value)}
                  disabled={!item.include || isSubmitting}
                  className="w-full h-7 rounded border border-border bg-background px-2 text-xs font-mono text-center focus:outline-none focus:ring-1 focus:ring-foreground/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />

                {/* --- INPUT EDITABLE CHECK OUT --- */}
                <input
                  type="time"
                  value={getHHmm(item.checkOut)}
                  onChange={(e) => onUpdateCheckOut(item.memberId, e.target.value)}
                  disabled={!item.include || isSubmitting}
                  className="w-full h-7 rounded border border-border bg-background px-2 text-xs font-mono text-center text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />

                <Select
                  value={item.status}
                  onValueChange={(v) =>
                    onUpdateStatus(item.memberId, v as any)
                  }
                  disabled={!item.include || isSubmitting}
                >
                  <SelectTrigger
                    className={cn(
                      "h-7 text-[10px] font-medium border rounded-md px-2",
                      STATUS_STYLES[item.status],
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present" className="text-xs">Present</SelectItem>
                    <SelectItem value="late" className="text-xs">Late</SelectItem>
                    <SelectItem value="absent" className="text-xs">Absent</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center justify-center">
                  {item.hasWarning && item.include && (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            size="sm"
          >
            Back
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting || toSave.length === 0}
            size="sm"
            className="min-w-[120px] gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              `Save ${toSave.length} Records`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}