
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { WeeklyLimitEntry } from "@/lib/data/dummy-data"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export const columns: ColumnDef<WeeklyLimitEntry>[] = [
    {
        accessorKey: "memberName",
        header: () => <div className="font-bold text-black">Member</div>,
        cell: ({ row }) => <div className="font-medium text-gray-900">{row.original.memberName}</div>
    },
    {
        accessorKey: "role",
        header: () => <div className="font-bold text-black">Role</div>,
        cell: ({ row }) => (
            <Badge variant="outline" className="font-normal">
                {row.original.role}
            </Badge>
        )
    },
    {
        accessorKey: "weeklyLimit",
        header: () => <div className="text-right font-bold text-black">Weekly Limit</div>,
        cell: ({ row }) => <div className="font-medium text-gray-900">{row.original.weeklyLimit} hrs</div>
    },
    {
        accessorKey: "hoursTracked",
        header: () => <div className="text-right font-bold text-black">Time spent</div>,
        cell: ({ row }) => <div className="text-gray-700">{row.original.hoursTracked.toFixed(2)} hrs</div>
    },
    {
        id: "percentageUsed",
        header: () => <div className="font-bold text-black">Percentage used</div>,
        cell: ({ row }) => {
            const percentage = row.original.weeklyLimit > 0
                ? (row.original.hoursTracked / row.original.weeklyLimit) * 100
                : 0
            const clampedPercentage = Math.min(percentage, 100)

            return (
                <div className="w-full max-w-[140px] space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="font-medium">{clampedPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={cn("h-full rounded-full", percentage >= 100 ? "bg-red-500" : percentage >= 80 ? "bg-yellow-500" : "bg-green-500")}
                            style={{ width: `${clampedPercentage}%` }}
                        />
                    </div>
                </div>
            )
        }
    },
    {
        id: "remaining",
        header: () => <div className="text-right font-bold text-black">Remaining</div>,
        cell: ({ row }) => {
            const remaining = row.original.weeklyLimit - row.original.hoursTracked
            return (
                <div className={cn(
                    "font-bold",
                    remaining < 0 ? "text-red-600" : "text-green-600"
                )}>
                    {remaining.toFixed(2)} hrs
                </div>
            )
        }
    },
    {
        accessorKey: "status",
        header: () => <div className="font-bold text-black">Status</div>,
        cell: ({ row }) => {
            const status = row.original.status
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        "font-normal",
                        status === 'Exceeded' ? "bg-red-50 text-red-700 border-red-200" :
                            status === 'Approaching Limit' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                "bg-green-50 text-green-700 border-green-200"
                    )}
                >
                    {status}
                </Badge>
            )
        }
    },
    {
        id: "week",
        header: () => <div className="font-bold text-black">Week</div>,
        cell: ({ row }) => (
            <div className="text-xs text-muted-foreground whitespace-nowrap">
                {row.original.weekStartDate} — {row.original.weekEndDate}
            </div>
        )
    },
]
