"use client"

import React from "react"
import { CreditCard, Download, ExternalLink, Filter, Search, Calendar } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function BillingHistoryPage() {
    const tabs: SettingTab[] = [
        { label: "EMAIL NOTIFICATIONS", href: "/settings/members/email-notifications", active: false },
        { label: "WORK TIME LIMITS", href: "/settings/work-time-limit", active: false },
        { label: "PAYMENTS", href: "/settings/payments", active: true },
        { label: "ACHIEVEMENTS", href: "/settings/Achievements", active: false },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "payments", label: "Payments", href: "/settings/payments" },
        { id: "billing-history", label: "Billing history", href: "/settings/payments/billing-history" },
    ]

    const invoices = [
        { id: "INV-2024-001", date: "Mar 1, 2024", amount: "$149.00", status: "Paid", period: "Feb 2024" },
        { id: "INV-2024-002", date: "Feb 1, 2024", amount: "$149.00", status: "Paid", period: "Jan 2024" },
        { id: "INV-2023-142", date: "Jan 2, 2024", amount: "$149.00", status: "Paid", period: "Dec 2023" },
        { id: "INV-2023-128", date: "Dec 1, 2023", amount: "$129.00", status: "Paid", period: "Nov 2023" },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white w-full">
            <SettingsHeader
                title="Members"
                Icon={CreditCard}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="billing-history"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="billing-history">
                <div className="space-y-8 max-w-6xl">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <h2 className="text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em]">BILLING HISTORY</h2>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                            Easily access and download your invoices. Keep track of your subscription payments and managing your financial records.
                        </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="relative w-full sm:w-72 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                                <Input
                                    placeholder="Search invoice ID..."
                                    className="pl-10 h-10 border-slate-200 group-hover:border-slate-300 focus-visible:ring-slate-900 focus-visible:border-slate-900 transition-all rounded-lg"
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Button variant="outline" size="sm" className="h-10 border-slate-200 text-slate-600 gap-2 px-4 flex-1 sm:flex-none">
                                    <Filter className="h-4 w-4" />
                                    Filter
                                </Button>
                                <Button variant="outline" size="sm" className="h-10 border-slate-200 text-slate-600 gap-2 px-4 flex-1 sm:flex-none">
                                    <Calendar className="h-4 w-4" />
                                    Last 6 months
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[11px] text-slate-500 uppercase tracking-wider bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Invoice ID</th>
                                        <th className="px-6 py-4 font-medium">Billing Period</th>
                                        <th className="px-6 py-4 font-medium">Date</th>
                                        <th className="px-6 py-4 font-medium">Amount</th>
                                        <th className="px-6 py-4 font-medium">Status</th>
                                        <th className="px-6 py-4 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">{invoice.id}</td>
                                            <td className="px-6 py-4 text-slate-500">{invoice.period}</td>
                                            <td className="px-6 py-4 text-slate-500">{invoice.date}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{invoice.amount}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-emerald-600">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    {invoice.status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-900 font-medium transition-colors">
                                                    <Download className="h-4 w-4" />
                                                    <span className="hidden sm:inline">PDF</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
                            <button className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-all flex items-center gap-1.5 mx-auto">
                                View older invoices
                                <ExternalLink className="h-3 w-3" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm ring-1 ring-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 ring-4 ring-indigo-50/50">
                                <CreditCard className="h-7 w-7" />
                            </div>
                            <div>
                                <h4 className="text-slate-900 font-semibold mb-1">Current Plan: Pro Monthly</h4>
                                <p className="text-slate-500 text-sm">Next billing date: **April 1, 2024** for **$149.00**</p>
                            </div>
                        </div>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-11 px-8 rounded-xl shadow-lg shadow-indigo-100 transition-all">
                            Upgrade Plan
                        </Button>
                    </div>
                </div>
            </SettingsContentLayout>
        </div>
    )
}
