"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ClientBudgetEntry } from "@/lib/data/dummy-client-budgets"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export const columns: ColumnDef<ClientBudgetEntry>[] = [
    {
        accessorKey: "clientName",
        header: () => <div className="font-bold text-black">Client</div>,
        cell: ({ row }) => {
            const name = row.original.clientName
            const initial = name.charAt(0).toUpperCase()
            const colors = ["bg-gray-500"]
            const colorClass = colors[name.length % colors.length]

            return (
                <div className="flex items-center gap-3">
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold", colorClass)}>
                        {initial}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{name}</div>
                    </div>
                </div>
            )
        }
    },
    {
        accessorKey: "budgetType",
        header: () => <div className="font-bold text-black">Type</div>,
        cell: ({ row }) => (
            <Badge variant="outline" className="font-normal capitalize">
                {row.original.budgetType}
            </Badge>
        )
    },
    {
        accessorKey: "budgetTotal",
        header: () => <div className="text-right font-bold text-black">Budget Amount</div>,
        cell: ({ row }) => {
            const isCost = row.original.budgetType === 'cost'
            const val = row.original.budgetTotal
            return (
                <div className="font-medium text-gray-900">
                    {isCost
                        ? `${row.original.currency}${val.toLocaleString()}`
                        : `${val} hrs`}
                </div>
            )
        }
    },
    {
        accessorKey: "timeTracked",
        header: () => <div className="text-right font-bold text-black">Time Tracked</div>,
        cell: ({ row }) => <div className="text-gray-700">{row.original.timeTracked.toFixed(2)} hrs</div>
    },
    {
        accessorKey: "costIncurred",
        header: () => <div className="text-right font-bold text-black">Cost Incurred</div>,
        cell: ({ row }) => <div className="text-justify-center text-gray-700">{row.original.currency}{row.original.costIncurred.toLocaleString()}</div>
    },
    {
        id: "budgetUsed",
        header: () => <div className="font-bold text-black">Budget Used (%)</div>,
        cell: ({ row }) => {
            const isCost = row.original.budgetType === 'cost'
            const total = row.original.budgetTotal
            const used = isCost ? row.original.costIncurred : row.original.timeTracked

            const percentage = total > 0 ? (used / total) * 100 : 0
            const clampedPercentage = Math.min(percentage, 100)

            return (
                <div className="w-full max-w-[140px] space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="font-medium">{percentage.toFixed(1)}%</span>
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
            const isCost = row.original.budgetType === 'cost'
            const total = row.original.budgetTotal
            const used = isCost ? row.original.costIncurred : row.original.timeTracked
            const remaining = total - used

            return (
                <div className={cn(
                    "text-justify-center font-bold",
                    remaining < 0 ? "text-red-600" : "text-green-600"
                )}>
                    {isCost
                        ? `${row.original.currency}${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `${remaining.toFixed(2)} hrs`}
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
]
