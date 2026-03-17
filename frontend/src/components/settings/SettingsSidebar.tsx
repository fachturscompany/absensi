"use client"

import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SidebarItem {
    id: string
    label: string
    href: string
    icon?: LucideIcon
}

interface SettingsSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    items: SidebarItem[]
    activeItemId: string
}

export function SettingsSidebar({ items, activeItemId, className, ...props }: SettingsSidebarProps) {
    return (
        <div className={cn("w-full bg-transparent min-h-0 overflow-y-auto", className)} {...props}>
            <div className="p-4 space-y-2">
                {items.map((item) => {
                    const Icon = item.icon
                    const isActive = activeItemId === item.id

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                                ? "text-slate-900 bg-white shadow-sm ring-1 ring-slate-200"
                                : "text-slate-500 hover:text-slate-900 hover:bg-white/60 hover:shadow-sm"
                                }`}
                        >
                            {Icon && <Icon className={cn("h-4 w-4", isActive ? "text-slate-900" : "text-slate-400")} />}
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
