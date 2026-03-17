"use client"

import React from "react"
import { ReportPageLayout } from "@/components/report/report-page-layout"
import { Construction } from "lucide-react"

interface GenericReportPageProps {
    title: string
}

export function GenericReportPage({ title }: GenericReportPageProps) {
    return (
        <ReportPageLayout
            title={title}
            breadcrumbs={[
                { label: "Reports", href: "/reports/all" },
                { label: title }
            ]}
        >
            <div className="flex flex-col items-center justify-center py-20 bg-white border rounded-lg shadow-sm m-1">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <Construction className="w-8 h-8 text-gray-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Under Construction</h2>
                <p className="text-gray-500 text-center max-w-md">
                    The <strong>{title}</strong> report is currently being developed.
                    Please check back later for updates.
                </p>
            </div>
        </ReportPageLayout>
    )
}
