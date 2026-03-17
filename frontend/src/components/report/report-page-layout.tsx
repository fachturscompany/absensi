"use client"

import React, { ReactNode } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface ReportPageLayoutProps {
    title: string
    breadcrumbs: { label: string; href?: string }[]
    children: ReactNode
    actions?: ReactNode
    filters?: ReactNode
}

export function ReportPageLayout({
    title,
    breadcrumbs,
    children,
    actions,
    filters
}: ReportPageLayoutProps) {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 min-h-screen bg-gray-50/50">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4 bg-white px-4 -mx-4 sticky top-0 z-10 shadow-sm">
                <div className="flex flex-col gap-1">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-1 text-sm text-gray-500">
                        {breadcrumbs.map((crumb, idx) => (
                            <React.Fragment key={idx}>
                                {idx > 0 && <ChevronRight className="w-4 h-4" />}
                                {crumb.href ? (
                                    <Link href={crumb.href} className="hover:text-gray-900 transition-colors">
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="font-medium text-gray-900">{crumb.label}</span>
                                )}
                            </React.Fragment>
                        ))}
                    </nav>
                    <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {actions}
                </div>
            </div>

            {/* Filters Section (Optional) */}
            {filters && (
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    {filters}
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    )
}
