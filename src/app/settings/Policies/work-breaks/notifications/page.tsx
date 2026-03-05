"use client"

import { useState } from "react"
import { SettingsHeader, SettingTab } from "@/components/settings/SettingsHeader"
import { ShieldCheck } from "lucide-react"
import { SidebarItem } from "@/components/settings/SettingsSidebar"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Member {
    id: string
    name: string
    notificationsEnabled: boolean
}

export default function WorkBreakNotificationsPage() {
    const [globalEnabled, setGlobalEnabled] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [members, setMembers] = useState<Member[]>([
        { id: "1", name: "Fatur rpl", notificationsEnabled: true },
        { id: "2", name: "Muhammad Ma'Arif", notificationsEnabled: true },
    ])

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const toggleMemberNotification = (memberId: string) => {
        setMembers(prev =>
            prev.map(member =>
                member.id === memberId
                    ? { ...member, notificationsEnabled: !member.notificationsEnabled }
                    : member
            )
        )
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const tabs: SettingTab[] = [
        { label: "POLICIES", href: "/settings/Policies", active: false },
        { label: "WORK BREAKS", href: "/settings/Policies/work-breaks", active: true },
        { label: "OVERTIME", href: "/settings/Policies/overtime", active: false },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "policies", label: "break policies", href: "/settings/Policies/work-breaks" },
        { id: "notifications", label: "break notifications", href: "/settings/Policies/work-breaks/notifications" },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Policies"
                Icon={ShieldCheck}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="notifications"
            />
            <div className="flex flex-1 w-full">
                <div className="flex-1 p-4 md:p-8 w-full overflow-x-hidden">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-sm font-normal text-slate-500 uppercase tracking-wider">
                                WORK BREAK NOTIFICATIONS
                            </h2>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="w-4 h-4 text-slate-400" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">Configure notifications for work breaks</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <p className="text-slate-500 mb-6">
                            Notify team members and management about work breaks
                        </p>

                        {/* Global Toggle */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-700 uppercase">GLOBAL</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="w-4 h-4 text-slate-400" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="max-w-xs">Enable or disable notifications globally for all members</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Switch
                                checked={globalEnabled}
                                onCheckedChange={setGlobalEnabled}
                                className="data-[state=checked]:bg-slate-900"
                            />
                        </div>
                    </div>

                    {/* Individual Settings Section */}
                    <div>
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-normal text-slate-900 mb-1">
                                    Individual settings
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Override the organization default for specific members
                                </p>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Search members"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-10 border-slate-200"
                                />
                            </div>
                        </div>

                        {/* Members List */}
                        <div className="border-t border-slate-200">
                            {/* Table Header */}
                            <div className="py-3 border-b border-slate-200">
                                <span className="text-sm font-normal text-slate-900">Name</span>
                            </div>

                            {/* Members */}
                            {filteredMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between py-4 border-b border-slate-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-8 h-8 bg-slate-200">
                                            <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                                                {getInitials(member.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm text-slate-700">{member.name}</span>
                                    </div>
                                    <Switch
                                        checked={member.notificationsEnabled}
                                        onCheckedChange={() => toggleMemberNotification(member.id)}
                                        className="data-[state=checked]:bg-slate-900"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="mt-4">
                            <p className="text-sm text-slate-500">
                                Showing {filteredMembers.length} of {members.length} members
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
