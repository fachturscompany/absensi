"use client"

import React from "react"
import Link from "next/link"
import { Users } from "lucide-react"

interface Tab {
    label: string
    href: string
    active: boolean
}

interface MembersHeaderProps {
    activeTab: "custom-fields" | "work-time-limits" | "payments" | "achievements"
}

export function MembersHeader({ activeTab }: MembersHeaderProps) {
    const tabs: Tab[] = [
        {
            label: "EMAIL NOTIFICATIONS",
            href: "/settings/members/email-notifications",
            active: activeTab === "custom-fields"
        },
        {
            label: "WORK TIME LIMITS",
            href: "/settings/work-time-limit",
            active: activeTab === "work-time-limits"
        },
        {
            label: "PAYMENTS",
            href: "/settings/payments",
            active: activeTab === "payments"
        },
        {
            label: "ACHIEVEMENTS",
            href: "/settings/Achievements",
            active: activeTab === "achievements"
        },
    ]

    return (
        <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 w-full">
                <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-slate-700" />
                    <h1 className="text-xl font-semibold text-slate-900">Members</h1>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-slate-200 w-full">
                <div className="flex gap-8">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.label}
                            href={tab.href}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab.active
                                ? "text-slate-900 border-slate-900"
                                : "text-slate-600 hover:text-slate-900 border-transparent hover:border-slate-300"
                                }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>
            </div>
        </>
    )
}
