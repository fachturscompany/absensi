"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
    items: {
        href: string
        title: string
        icon: React.ReactNode
    }[]
}

export function UserSettingsSidebar({ className, items, ...props }: SidebarNavProps) {
    const pathname = usePathname()

    return (
        <nav
            className={cn(
                "flex space-x-2 overflow-x-auto pb-2 scrollbar-hide md:flex-col md:space-x-0 md:space-y-1 md:pb-0",
                className
            )}
            {...props}
        >
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "flex items-center gap-2 justify-start px-3 py-2 rounded-md text-sm font-normal transition-colors no-underline",
                        pathname === item.href
                            ? "bg-slate-100 text-slate-900"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                >
                    {item.icon}
                    {item.title}
                </Link>
            ))}
        </nav>
    )
}
