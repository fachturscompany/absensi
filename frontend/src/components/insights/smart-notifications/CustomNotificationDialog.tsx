"use client"

import { useEffect, useState } from "react"
import { X, Info, Check, ChevronDown } from "lucide-react"
import { DUMMY_MEMBERS, DUMMY_ROLES, DUMMY_TEAMS, DUMMY_JOB_TYPES } from "@/lib/data/dummy-data"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface CustomNotificationDialogProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: any) => void
    initialData?: any
}

export function CustomNotificationDialog({
    isOpen,
    onClose,
    onSave,
    initialData
}: CustomNotificationDialogProps) {
    const [formData, setFormData] = useState({
        id: undefined as string | undefined, // Keep ID for template selection tracking
        name: "",
        frequency: "weekly",
        metric: "Daily work time",
        condition: "above",
        value: "",
        unit: "hr/day",
        audienceType: "all",
        audienceTab: "members" as "members" | "teams" | "jobType",
        recipientTab: "roles" as "roles" | "members",
        selectedMembers: [] as string[],
        selectedTeams: [] as string[],
        selectedJobTypes: [] as string[],
        selectedRecipientRoles: [] as string[],
        selectedRecipientMembers: [] as string[],
        showHighlights: true,
        sendEmail: false,
        sendSlack: false
    })

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        if (isOpen) {
            window.addEventListener("keydown", handleEsc)
        }
        return () => window.removeEventListener("keydown", handleEsc)
    }, [isOpen, onClose])

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                id: initialData.id,
                name: initialData.name || "",
                frequency: initialData.frequency || "weekly",
                description: initialData.description || "",
                metric: initialData.metric || (initialData.target ? initialData.target : "Daily work time"),
                value: initialData.value?.toString() || "",
                unit: initialData.unit || "hr/day",
                condition: initialData.condition || "above",
                // Map audience
                audienceType: initialData.audienceType || (initialData.monitoredAudience?.all ? "all" : "custom"),
                selectedMembers: initialData.selectedMembers || initialData.monitoredAudience?.ids || [],
                selectedTeams: initialData.selectedTeams || [],
                selectedJobTypes: initialData.selectedJobTypes || [],
                // Map recipients
                selectedRecipientRoles: initialData.selectedRecipientRoles || initialData.recipients?.ids || [],
                selectedRecipientMembers: initialData.selectedRecipientMembers || [],
                // Map delivery methods
                sendEmail: initialData.sendEmail || initialData.delivery?.includes("email") || initialData.notifyVia?.includes("email") || false,
                sendSlack: initialData.sendSlack || initialData.delivery?.includes("slack") || initialData.notifyVia?.includes("slack") || false,
                showHighlights: initialData.showHighlights || initialData.delivery?.includes("highlights") || initialData.notifyVia?.includes("highlights") || true,
            }))
        } else {
            // Reset to default
            setFormData({
                id: undefined,
                name: "",
                frequency: "weekly",
                metric: "Daily work time",
                condition: "above",
                value: "",
                unit: "hr/day",
                audienceType: "all",
                audienceTab: "members",
                recipientTab: "roles",
                selectedMembers: [],
                selectedTeams: [],
                selectedJobTypes: [],
                selectedRecipientRoles: [],
                selectedRecipientMembers: [],
                showHighlights: true,
                sendEmail: false,
                sendSlack: false
            })
        }
    }, [initialData, isOpen])

    if (!isOpen) return null

    const toggleSelection = (type: 'members' | 'roles' | 'recipientMembers' | 'teams' | 'jobTypes', id: string) => {
        setFormData(prev => {
            let key: keyof typeof prev
            if (type === 'members') key = 'selectedMembers'
            else if (type === 'teams') key = 'selectedTeams'
            else if (type === 'jobTypes') key = 'selectedJobTypes'
            else if (type === 'roles') key = 'selectedRecipientRoles'
            else key = 'selectedRecipientMembers'

            const current = (prev[key] as string[])
            const isSelected = current.includes(id)
            return {
                ...prev,
                [key]: isSelected ? current.filter(i => i !== id) : [...current, id]
            }
        })
    }

    const clearSelection = (key: keyof typeof formData) => {
        setFormData(prev => ({ ...prev, [key]: [] }))
    }

    const frequencies = ["Every hour", "Every day", "Every week"]
    const metrics = ["Daily work time", "Activity rate", "Core work percentage", "Unproductive time", "Social media time", "Idle time percentage"]
    const conditions = ["Above", "Below", "Equals"]
    const units = ["hr/day", "%", "min/day", "instances"]

    const handleSave = () => {
        onSave(formData)
        onClose()
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-xl font-semibold text-gray-900">Add a smart notification</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Name & Frequency */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">NAME</label>
                            <input
                                type="text"
                                placeholder="Name your smart notification"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">FREQUENCY</label>
                            <select
                                value={formData.frequency}
                                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all cursor-pointer"
                            >
                                {frequencies.map((freq) => (
                                    <option key={freq} value={freq.toLowerCase().replace(' ', '-')}>{freq}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {/* When Section */}
                    <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">METRIC</label>
                                <select
                                    value={formData.metric}
                                    onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all cursor-pointer"
                                >
                                    {metrics.map((metric) => (
                                        <option key={metric} value={metric}>{metric}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">VALUE OF</label>
                                    <select
                                        value={formData.condition}
                                        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all cursor-pointer"
                                    >
                                        {conditions.map((cond) => (
                                            <option key={cond} value={cond.toLowerCase()}>{cond}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">&nbsp;</label>
                                    <input
                                        type="text"
                                        placeholder="00:30"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">&nbsp;</label>
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all cursor-pointer"
                                    >
                                        {units.map((unit) => (
                                            <option key={unit} value={unit}>{unit}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monitored Audience */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">MONITORED AUDIENCE</h3>
                            <Info className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <p className="text-[13px] text-gray-400 mb-4">Select as many teams, members, and job types as you like</p>

                        <div className="flex items-center gap-3 mb-6">
                            <button
                                onClick={() => setFormData({ ...formData, audienceType: formData.audienceType === 'all' ? 'custom' : 'all' })}
                                className={`group relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.audienceType === 'all' ? 'bg-zinc-900' : 'bg-gray-200'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.audienceType === 'all' ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                            <span className="text-sm font-medium text-gray-600">All current and future members</span>
                        </div>

                        {formData.audienceType !== 'all' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 relative">
                                <div className="flex gap-6 border-b border-gray-100">
                                    {[
                                        { id: 'members', label: 'MEMBERS', count: formData.selectedMembers.length },
                                        { id: 'teams', label: 'TEAMS', count: formData.selectedTeams.length },
                                        { id: 'jobType', label: 'JOB TYPE', count: formData.selectedJobTypes.length }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setFormData({ ...formData, audienceTab: tab.id as any })}
                                            className={`pb-2 text-sm font-semibold uppercase tracking-wider transition-all border-b-2 ${formData.audienceTab === tab.id ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                        >
                                            {tab.label} {tab.count > 0 && `(${tab.count})`}
                                        </button>
                                    ))}
                                </div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <div
                                            className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer flex items-center justify-between hover:border-zinc-900 transition-colors shadow-sm"
                                        >
                                            <span className={(formData.audienceTab === 'members' ? formData.selectedMembers.length : formData.audienceTab === 'teams' ? formData.selectedTeams.length : formData.selectedJobTypes.length) > 0 ? "text-gray-900 font-medium" : "text-gray-400"}>
                                                {(formData.audienceTab === 'members' ? formData.selectedMembers.length : formData.audienceTab === 'teams' ? formData.selectedTeams.length : formData.selectedJobTypes.length) > 0
                                                    ? `${formData.audienceTab === 'members' ? formData.selectedMembers.length : formData.audienceTab === 'teams' ? formData.selectedTeams.length : formData.selectedJobTypes.length} ${formData.audienceTab === 'members' ? 'member' : formData.audienceTab === 'teams' ? 'team' : 'job type'}${(formData.audienceTab === 'members' ? formData.selectedMembers.length : formData.audienceTab === 'teams' ? formData.selectedTeams.length : formData.selectedJobTypes.length) > 1 ? 's' : ''}`
                                                    : `Select ${formData.audienceTab === 'jobType' ? 'job type' : formData.audienceTab}`}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {(formData.audienceTab === 'members' ? formData.selectedMembers.length : formData.audienceTab === 'teams' ? formData.selectedTeams.length : formData.selectedJobTypes.length) > 0 && (
                                                    <X
                                                        className="w-4 h-4 text-gray-400 hover:text-gray-600"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            clearSelection(formData.audienceTab === 'members' ? 'selectedMembers' : formData.audienceTab === 'teams' ? 'selectedTeams' : 'selectedJobTypes')
                                                        }}
                                                    />
                                                )}
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>
                                    </PopoverTrigger>

                                    <PopoverContent
                                        className="p-0 border border-gray-100 rounded-lg shadow-xl bg-white w-[var(--radix-popover-trigger-width)]"
                                        align="start"
                                        sideOffset={4}
                                    >
                                        <div className="max-h-60 overflow-y-auto py-2">
                                            {formData.audienceTab === 'members' ? (
                                                DUMMY_MEMBERS.map(member => (
                                                    <div
                                                        key={member.id}
                                                        className="px-4 py-2 hover:bg-zinc-50 flex items-center gap-3 cursor-pointer group"
                                                        onClick={() => toggleSelection('members', member.id)}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${formData.selectedMembers.includes(member.id) ? 'bg-zinc-900 border-zinc-900' : 'bg-white border-gray-300 group-hover:border-zinc-900'}`}>
                                                            {formData.selectedMembers.includes(member.id) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                                        </div>
                                                        <span className="text-sm text-gray-700">{member.name}</span>
                                                    </div>
                                                ))
                                            ) : formData.audienceTab === 'teams' ? (
                                                DUMMY_TEAMS.map(team => (
                                                    <div
                                                        key={team.id}
                                                        className="px-4 py-2 hover:bg-zinc-50 flex items-center gap-3 cursor-pointer group"
                                                        onClick={() => toggleSelection('teams', team.id)}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${formData.selectedTeams.includes(team.id) ? 'bg-zinc-900 border-zinc-900' : 'bg-white border-gray-300 group-hover:border-zinc-900'}`}>
                                                            {formData.selectedTeams.includes(team.id) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                                        </div>
                                                        <span className="text-sm text-gray-700">{team.name}</span>
                                                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full ml-auto">{team.memberCount} members</span>
                                                    </div>
                                                ))
                                            ) : (
                                                DUMMY_JOB_TYPES.map(type => (
                                                    <div
                                                        key={type.id}
                                                        className="px-4 py-2 hover:bg-zinc-50 flex items-center gap-3 cursor-pointer group"
                                                        onClick={() => toggleSelection('jobTypes', type.id)}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${formData.selectedJobTypes.includes(type.id) ? 'bg-zinc-900 border-zinc-900' : 'bg-white border-gray-300 group-hover:border-zinc-900'}`}>
                                                            {formData.selectedJobTypes.includes(type.id) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                                        </div>
                                                        <span className="text-sm text-gray-700">{type.name}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}
                    </div>

                    {/* Then Section */}
                    <div className="bg-zinc-50/30 rounded-xl p-4 border border-zinc-100/50">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">THEN</h3>
                                <p className="text-[13px] text-gray-400 mb-4">Select who will receive the notifications and their delivery channel</p>

                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">SEND NOTIFICATION TO</div>
                                <div className="flex gap-4 mb-3 border-b border-gray-100">
                                    {[
                                        { id: 'roles', label: 'ROLES', count: formData.selectedRecipientRoles.length },
                                        { id: 'members', label: 'MEMBERS', count: formData.selectedRecipientMembers.length }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setFormData({ ...formData, recipientTab: tab.id as any })}
                                            className={`pb-2 text-sm font-semibold uppercase tracking-wider transition-all border-b-2 ${formData.recipientTab === tab.id ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                        >
                                            {tab.label} {tab.count > 0 && `(${tab.count})`}
                                        </button>
                                    ))}
                                </div>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <div
                                            className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer flex items-center justify-between hover:border-zinc-900 transition-colors shadow-sm"
                                        >
                                            <span className={(formData.recipientTab === 'roles' ? formData.selectedRecipientRoles.length : formData.selectedRecipientMembers.length) > 0 ? "text-gray-900 font-medium" : "text-gray-400"}>
                                                {(formData.recipientTab === 'roles' ? formData.selectedRecipientRoles.length : formData.selectedRecipientMembers.length) > 0
                                                    ? `${formData.recipientTab === 'roles' ? formData.selectedRecipientRoles.length : formData.selectedRecipientMembers.length} ${formData.recipientTab === 'roles' ? 'role' : 'member'}${(formData.recipientTab === 'roles' ? formData.selectedRecipientRoles.length : formData.selectedRecipientMembers.length) > 1 ? 's' : ''}`
                                                    : `Select ${formData.recipientTab}`}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {(formData.recipientTab === 'roles' ? formData.selectedRecipientRoles.length : formData.selectedRecipientMembers.length) > 0 && (
                                                    <X
                                                        className="w-4 h-4 text-gray-400 hover:text-gray-600"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            clearSelection(formData.recipientTab === 'roles' ? 'selectedRecipientRoles' : 'selectedRecipientMembers')
                                                        }}
                                                    />
                                                )}
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>
                                    </PopoverTrigger>

                                    <PopoverContent
                                        className="p-0 border border-gray-100 rounded-lg shadow-xl bg-white w-[var(--radix-popover-trigger-width)]"
                                        align="start"
                                        sideOffset={4}
                                    >
                                        <div className="max-h-60 overflow-y-auto py-2">
                                            {formData.recipientTab === 'roles' ? (
                                                DUMMY_ROLES.map(role => (
                                                    <div
                                                        key={role.id}
                                                        className="px-4 py-2 hover:bg-zinc-50 flex items-center gap-3 cursor-pointer group"
                                                        onClick={() => toggleSelection('roles', role.id)}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${formData.selectedRecipientRoles.includes(role.id) ? 'bg-zinc-900 border-zinc-900' : 'bg-white border-gray-300 group-hover:border-zinc-900'}`}>
                                                            {formData.selectedRecipientRoles.includes(role.id) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                                        </div>
                                                        <span className="text-sm text-gray-700">{role.name}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                DUMMY_MEMBERS.map(member => (
                                                    <div
                                                        key={member.id}
                                                        className="px-4 py-2 hover:bg-zinc-50 flex items-center gap-3 cursor-pointer group"
                                                        onClick={() => toggleSelection('recipientMembers', member.id)}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${formData.selectedRecipientMembers.includes(member.id) ? 'bg-zinc-900 border-zinc-900' : 'bg-white border-gray-300 group-hover:border-zinc-900'}`}>
                                                            {formData.selectedRecipientMembers.includes(member.id) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                                        </div>
                                                        <span className="text-sm text-gray-700">{member.name}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">DELIVERY CHANNEL</div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        { id: 'showHighlights', label: 'Highlights page', info: true },
                                        { id: 'sendEmail', label: 'Send via email', info: false },
                                        { id: 'sendSlack', label: 'Send to Slack', info: true }
                                    ].map((channel) => (
                                        <label key={channel.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-white transition-all bg-gray-50/50 group">
                                            <input
                                                type="checkbox"
                                                checked={(formData as any)[channel.id]}
                                                onChange={(e) => setFormData({ ...formData, [channel.id]: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-zinc-900 focus:ring-zinc-900"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm text-gray-700 group-hover:text-zinc-900 transition-colors uppercase font-medium text-[10px] tracking-tight">{channel.label}</span>
                                                    {channel.info && <Info className="w-3 h-3 text-gray-300" />}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/30">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 bg-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-2.5 text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-all shadow-md active:scale-95 bg-gradient-to-r from-zinc-900 to-zinc-800"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    )
}
