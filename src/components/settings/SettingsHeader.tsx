"use client"

import Link from "next/link"
import { create } from "zustand"
import { LucideIcon, Menu } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { SettingsSidebar, SidebarItem } from "./SettingsSidebar"
import { Button } from "@/components/ui/button"

export interface SettingTab {
    label: string
    href: string
    active: boolean
}

export const useSettingsSidebarStore = create<{
    isOpen: boolean
    toggle: () => void
}>((set) => ({
    isOpen: true,
    toggle: () => set((state) => ({ isOpen: !state.isOpen }))
}))

interface SettingsHeaderProps {
    title: string
    Icon: LucideIcon
    tabs: SettingTab[]
    sidebarItems?: SidebarItem[]
    activeItemId?: string
}

export function SettingsHeader({ title, Icon, tabs, sidebarItems, activeItemId }: SettingsHeaderProps) {
    const toggleSidebar = useSettingsSidebarStore(state => state.toggle)

    return (
        <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 w-full bg-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {sidebarItems && (
                            <>
                                {/* Mobile Hamburger (buka Sheet) */}
                                <div className="md:hidden">
                                    <Sheet>
                                        <SheetTrigger asChild>
                                            <Button variant="ghost" size="sm" className="flex items-center -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2 h-9 w-9 p-0">
                                                <Menu className="h-5 w-5" />
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent side="left" className="p-0 w-72 border-r-0 shadow-2xl">
                                            <SheetHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
                                                <SheetTitle className="flex items-center gap-3 text-slate-900">
                                                    <div className="p-2 bg-white rounded-lg shadow-sm ring-1 ring-slate-200">
                                                        <Icon className="h-5 w-5 text-slate-700" />
                                                    </div>
                                                    <span className="font-bold tracking-tight">{title}</span>
                                                </SheetTitle>
                                            </SheetHeader>
                                            <div className="py-2 h-[calc(100vh-85px)] overflow-y-auto">
                                                <SettingsSidebar
                                                    items={sidebarItems}
                                                    activeItemId={activeItemId || ""}
                                                    className="w-full border-r-0 h-full min-h-0 bg-transparent"
                                                />
                                            </div>
                                        </SheetContent>
                                    </Sheet>
                                </div>
                                {/* Desktop Hamburger (toggle Sidebar layout) */}
                                <div className="hidden md:block">
                                    <Button onClick={toggleSidebar} variant="ghost" size="sm" className="flex items-center -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2 h-9 w-9 p-0">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </div>
                            </>
                        )}
                        <Icon className="h-6 w-6 text-slate-700" />
                        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-4 md:px-6 border-b border-slate-200 w-full bg-white">
                <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.label}
                            href={tab.href}
                            className={`px-2 md:px-4 py-3 text-xs md:text-sm font-normal no-underline border-b-2 transition-all whitespace-nowrap tracking-tight ${tab.active
                                ? "text-slate-900 border-slate-900"
                                : "text-slate-500 hover:text-slate-900 border-transparent hover:border-slate-300"
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

/**
 * Wrapper layout untuk halaman settings yang punya sidebar sub-menu.
 * Di desktop: sidebar muncul permanen di kiri.
 * Di mobile: konten penuh (sidebar diakses via hamburger di SettingsHeader).
 */
interface SettingsContentLayoutProps {
    sidebarItems: SidebarItem[]
    activeItemId: string
    children: React.ReactNode
}

export function SettingsContentLayout({ sidebarItems, activeItemId, children }: SettingsContentLayoutProps) {
    const isSidebarOpen = useSettingsSidebarStore(state => state.isOpen)

    return (
        <div className="flex flex-1 w-full overflow-hidden">
            {/* Sidebar Desktop - hanya muncul di md ke atas */}
            {isSidebarOpen && (
                <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-slate-200 bg-slate-50/30">
                    <SettingsSidebar
                        items={sidebarItems}
                        activeItemId={activeItemId}
                        className="w-full border-r-0 h-full bg-transparent"
                    />
                </aside>
            )}

            {/* Konten Utama */}
            <div className="flex-1 p-4 md:p-6 w-full overflow-x-hidden">
                {children}
            </div>
        </div>
    )
}
