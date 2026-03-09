"use client"

import React, { useState } from "react"
import { User } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/profile&image/avatar"
import { cn } from "@/lib/utils"

interface MemberAvatarProps {
    src?: string | null
    name?: string
    className?: string
    fallbackClassName?: string
}

export function MemberAvatar({ src, name, className, fallbackClassName }: MemberAvatarProps) {
    const [hasError, setHasError] = useState(false)

    return (
        <Avatar className={cn("w-8 h-8 rounded-full border border-gray-200 shrink-0", className)}>
            {src && !hasError && (
                <AvatarImage
                    src={src}
                    alt={name || "Member"}
                    className="object-cover"
                    onError={() => setHasError(true)}
                />
            )}
            <AvatarFallback className={cn("bg-gray-100", fallbackClassName)}>
                <User className="w-4 h-4 text-gray-500" />
            </AvatarFallback>
        </Avatar>
    )
}
