"use client"

import { Lightbulb } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"

export default function TeamExceptionsPage() {
    const tabs: SettingTab[] = [
        { label: "APP/URL", href: "/settings/app-url", active: true },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "classification", label: "Classification", href: "/settings/app-url" },
        { id: "exceptions", label: "Team exceptions", href: "/settings/app-url/exceptions" },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white w-full">
            <SettingsHeader
                title="Insights"
                Icon={Lightbulb}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="exceptions"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="exceptions">
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <h2 className="text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em]">TEAM EXCEPTIONS</h2>
                    </div>
                    <div className="space-y-4 text-sm text-slate-500 leading-relaxed max-w-2xl">
                        <p>
                            Set classification exceptions for specific teams. For example, Markering team might have different productivity ratings for social media apps.
                        </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                        <p className="text-slate-500 italic">Team exceptions configuration coming soon...</p>
                    </div>
                </div>
            </SettingsContentLayout>
        </div>
    )
}
