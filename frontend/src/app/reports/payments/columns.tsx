"use client"

import { ColumnDef } from "@tanstack/react-table"
import { PaymentEntry } from "@/lib/data/dummy-data"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import { MoreHorizontal, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState } from "react"
import { PaymentDetailsDialog } from "@/components/report/payment-details-dialog"
import { toast } from "sonner"
import { generateReceipt } from "@/utils/receipt-generator"


const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)
}

export const columns: ColumnDef<PaymentEntry>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
                className="translate-y-[2px]"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                className="translate-y-[2px]"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: "member",
        accessorKey: "member.name",
        header: () => <div className="font-bold text-black">Member</div>,
        cell: ({ row }) => <div className="whitespace-nowrap font-medium text-black">{row.original.member.name}</div>
    },
    {
        accessorKey: "type",
        header: () => (
            <div className="flex items-center gap-2 font-bold text-black whitespace-nowrap">
                Payment Type
                <TooltipProvider>
                    <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px] p-4 text-xs">
                            <div className="space-y-2">
                                <p><span className="font-semibold text-green-600">Automatic:</span> Processed via payroll integration (PayPal, Wise, etc).</p>
                                <p><span className="font-semibold text-blue-600">Manual:</span> Recorded manually (Bank Transfer, Cash, etc).</p>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        ),
        cell: ({ row }) => <span className="text-gray-900 whitespace-nowrap">{row.original.type}</span>
    },
    {
        accessorKey: "method",
        header: () => <div className="font-bold text-black">Method</div>,
        cell: ({ row }) => <span className="text-gray-900 whitespace-nowrap">{row.original.method}</span>
    },
    {
        accessorKey: "status",
        header: () => <div className="font-bold text-black">Status</div>,
        cell: ({ row }) => <span className="text-gray-900 whitespace-nowrap">{row.original.status}</span>
    },
    {
        accessorKey: "date",
        header: () => <div className="font-bold text-black">Paid On</div>,
        cell: ({ row }) => <div className="whitespace-nowrap text-gray-900">{format(new Date(row.original.date), 'MMM d, yyyy')}</div>
    },
    {
        accessorKey: "project",
        header: () => <div className="font-bold text-black">Project</div>,
        cell: ({ row }) => <span className="text-gray-900 whitespace-nowrap">{row.original.project || "—"}</span>
    },
    {
        accessorKey: "hours",
        header: () => <div className="text-right font-bold text-black">Total Hours</div>,
        cell: ({ row }) => <div className="text-right text-gray-900 whitespace-nowrap font-medium">{row.original.hours.toFixed(2)}</div>
    },
    {
        accessorKey: "rate",
        header: () => <div className="text-right font-bold text-black">Hourly Pay</div>,
        cell: ({ row }) => <div className="text-right text-gray-900 whitespace-nowrap">{formatCurrency(row.original.rate)}</div>
    },
    {
        accessorKey: "fixedAmount",
        header: () => <div className="text-right font-bold text-black">Fixed Pay</div>,
        cell: ({ row }) => <div className="text-right text-gray-900 whitespace-nowrap">{formatCurrency(row.original.fixedAmount)}</div>
    },
    {
        accessorKey: "ptoAmount",
        header: () => <div className="text-right font-bold text-black">PTO & Holidays</div>,
        cell: ({ row }) => <div className="text-right text-gray-900 whitespace-nowrap">{formatCurrency(row.original.ptoAmount)}</div>
    },
    {
        accessorKey: "additions",
        header: () => <div className="text-right font-bold text-black">Additions</div>,
        cell: ({ row }) => <div className="text-right text-gray-900 whitespace-nowrap">{formatCurrency(row.original.additions)}</div>
    },
    {
        accessorKey: "deductions",
        header: () => <div className="text-right font-bold text-black">Deductions</div>,
        cell: ({ row }) => <div className="text-right text-gray-900 whitespace-nowrap">{formatCurrency(row.original.deductions)}</div>
    },
    {
        accessorKey: "bonus",
        header: () => <div className="text-right font-bold text-black">Bonus</div>,
        cell: ({ row }) => <div className="text-right text-gray-900 whitespace-nowrap">{formatCurrency(row.original.bonus)}</div>
    },
    {
        accessorKey: "amount",
        header: () => <div className="text-right font-bold text-black">Total Amount</div>,
        cell: ({ row }) => <div className="text-right text-gray-900 font-bold whitespace-nowrap">{formatCurrency(row.original.amount)}</div>
    },
    {
        accessorKey: "notes",
        header: () => <div className="font-bold text-black">Notes</div>,
        cell: ({ row }) => <div className="max-w-[200px] truncate text-gray-500" title={row.original.notes}>{row.original.notes || "—"}</div>
    },
    {
        id: "actions",
        header: () => <div className="text-center font-bold text-black px-4">Action</div>,
        cell: ({ row }) => (
            <div className="flex justify-center">
                <PaymentActions payment={row.original} />
            </div>
        )
    },
]

function PaymentActions({ payment }: { payment: PaymentEntry }) {
    const [showDetails, setShowDetails] = useState(false)

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        onClick={() => {
                            navigator.clipboard.writeText(payment.id)
                            toast.success("ID Copied", { description: payment.id })
                        }}
                    >
                        Copy ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowDetails(true)}>
                        View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                        generateReceipt(payment)
                        toast.success("Receipt Downloaded", { description: `receipt-${payment.id}.pdf saved` })
                    }}>
                        Download Receipt
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <PaymentDetailsDialog
                payment={payment}
                open={showDetails}
                onOpenChange={setShowDetails}
            />
        </>
    )
}
