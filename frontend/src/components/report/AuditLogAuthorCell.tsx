"use client"

import { Avatar, AvatarFallback } from "@/components/profile&image/avatar"
import { cn } from "@/lib/utils"

interface AuthorData {
    name: string
    initials: string
    color?: string
    avatarUrl?: string
}

interface AuditLogAuthorCellProps {
    author: AuthorData
    className?: string
    avatarClassName?: string
    showRing?: boolean
    showName?: boolean
}

export function AuditLogAuthorCell({ author, className, avatarClassName, showRing = true, showName = true }: AuditLogAuthorCellProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            {/* Colorful Avatar Logic matching Client Budget Report */}
            {(() => {
                const name = author.name || ""
                const colors = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-green-500", "bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-pink-500"]
                const colorClass = author.color || colors[name.length % colors.length] || "bg-gray-500"

                return (
                    <Avatar className={cn("h-8 w-8", showRing && "ring-1 ring-white", avatarClassName)}>
                        <AvatarFallback className={cn("text-xs text-white font-bold", colorClass)}>
                            {author.initials}
                        </AvatarFallback>
                    </Avatar>
                )
            })()}
            {showName && <span className="font-medium text-gray-900">{author.name}</span>}
        </div>
    )
}
