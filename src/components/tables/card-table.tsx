import * as React from "react"
import { cn } from "@/lib/utils"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

/**
 * CardTable
 * A wrapper around the Table component that applies a card-like styling
 * (white background, border, shadow, rounded corners) and specific
 * row striping/hover effects as seen in the Attendance Locations page.
 */

const CardTable = React.forwardRef<
    HTMLTableElement,
    React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
    <div className="bg-background dark:!bg-black border border-border !border-zinc-800 rounded-lg shadow-sm w-full">
        <div className="overflow-x-auto">
            <Table ref={ref} className={cn("w-full", className)} {...props} />
        </div>
    </div>
))
CardTable.displayName = "CardTable"

const CardTableHeader = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <TableHeader ref={ref} className={cn("bg-muted/50 border-b border-border dark:border-border", className)} {...props} />
))
CardTableHeader.displayName = "CardTableHeader"

const CardTableRow = React.forwardRef<
    HTMLTableRowElement,
    React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
    <TableRow
        ref={ref}
        className={cn(
            "hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors border-b border-border dark:border-border last:border-0 data-[state=selected]:bg-muted dark:data-[state=selected]:bg-muted",
            className
        )}
        {...props}
    />
))
CardTableRow.displayName = "CardTableRow"

const CardTableHead = React.forwardRef<
    HTMLTableCellElement,
    React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <TableHead
        ref={ref}
        className={cn(
            "font-semibold text-gray-600 dark:text-gray-400 h-10 px-4 text-left align-middle [&:has([role=checkbox])]:pr-0",
            className
        )}
        {...props}
    />
))
CardTableHead.displayName = "CardTableHead"

const CardTableBody = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <TableBody ref={ref} className={cn("[&>tr:nth-child(even)]:bg-transparent", className)} {...props} />
))
CardTableBody.displayName = "CardTableBody"

const CardTableCell = React.forwardRef<
    HTMLTableCellElement,
    React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <TableCell
        ref={ref}
        className={cn("text-gray-600 dark:text-gray-300", className)}
        {...props}
    />
))
CardTableCell.displayName = "CardTableCell"

export {
    CardTable,
    CardTableHeader,
    CardTableBody,
    CardTableHead,
    CardTableRow,
    CardTableCell,
}
