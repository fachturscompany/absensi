"use client"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/profile&image/avatar"
import { ClientActionsDropdown } from "./ClientActionsDropdown"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"

export interface Client {
    id: string
    name: string
    budget: string
    autoInvoicing: boolean
    isArchived: boolean
    address?: string
    phone?: string
    emails?: string[]
    projectCount?: number
    taskCount?: number
    // New fields for mapping back to form
    budgetType?: string
    budgetAmount?: number
    notifyPercentage?: number
    invoiceNotes?: string
    netTermsDays?: number
    autoInvoiceFrequency?: string
    projectIds?: string[]
    createdAt?: string
}

interface ClientsTableProps {
    clients: Client[]
    selectedIds: string[]
    onSelectClient: (id: string, selected: boolean) => void
    onSelectAll: (selected: boolean) => void
    onEdit: (client: Client) => void
    onArchive: (id: string) => void
    onRestore: (id: string) => void
    onDelete: (id: string) => void
}

export function ClientsTable({
    clients,
    selectedIds,
    onSelectClient,
    onSelectAll,
    onEdit,
    onArchive,
    onRestore,
    onDelete,
}: ClientsTableProps) {
    const allSelected = clients.length > 0 && selectedIds.length === clients.length

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-10">
                        <Checkbox
                            checked={allSelected}
                            onCheckedChange={(checked) => onSelectAll(!!checked)}
                            aria-label="Select all"
                        />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Auto Invoicing</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {clients.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                            No clients found
                        </TableCell>
                    </TableRow>
                ) : (
                    clients.map((client) => {
                        const isSelected = selectedIds.includes(client.id)
                        const initials = client.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        const projectCount = client.projectCount || 0
                        const taskCount = client.taskCount || 0

                        return (
                            <TableRow key={client.id}>
                                <TableCell className="align-top">
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => onSelectClient(client.id, !!checked)}
                                        aria-label={`Select client ${client.name}`}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-gray-100 text-gray-700">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <span className="font-medium text-sm block truncate">{client.name}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    <Link
                                        href={`/projects?client=${encodeURIComponent(client.name)}`}
                                        className="hover:underline hover:text-primary transition-colors"
                                    >
                                        {projectCount} project{projectCount !== 1 ? "s" : ""}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    <Link
                                        href={`/projects/tasks/list?client=${encodeURIComponent(client.name)}`}
                                        className="hover:underline hover:text-primary transition-colors"
                                    >
                                        {taskCount} task{taskCount !== 1 ? "s" : ""}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {client.autoInvoicing ? "On" : "Off"}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {client.createdAt ? new Date(client.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <ClientActionsDropdown
                                        isArchived={client.isArchived}
                                        onEdit={() => onEdit(client)}
                                        onArchive={() => onArchive(client.id)}
                                        onRestore={() => onRestore(client.id)}
                                        onDelete={() => onDelete(client.id)}
                                    />
                                </TableCell>
                            </TableRow>
                        )
                    })
                )}
            </TableBody>
        </Table>
    )
}

