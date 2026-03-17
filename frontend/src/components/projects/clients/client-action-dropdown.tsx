"use client"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"

interface ClientActionsDropdownProps {
    isArchived: boolean
    onEdit: () => void
    onArchive?: () => void
    onRestore?: () => void
    onDelete?: () => void
}

export function ClientActionsDropdown({ isArchived, onEdit, onArchive, onRestore, onDelete }: ClientActionsDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <Pencil className="h-3 w-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                    Edit
                </DropdownMenuItem>
                {isArchived ? (
                    <DropdownMenuItem onClick={onRestore}>
                        Restore
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem onClick={onArchive} className="text-orange-600">
                        Archive
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
