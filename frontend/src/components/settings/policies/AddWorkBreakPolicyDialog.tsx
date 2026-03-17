"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, Search } from "lucide-react"
import { Switch } from "@/components/ui/switch"

import { MemberSelectionModal } from "@/components/settings/MemberSelectionModal"

interface AddWorkBreakPolicyDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (policy: any) => void
    initialData?: any
    readOnly?: boolean
}

export function AddWorkBreakPolicyDialog({ open, onOpenChange, onSave, initialData, readOnly = false }: AddWorkBreakPolicyDialogProps) {
    // Form states
    const [policyName, setPolicyName] = useState("")
    const [autoAdd, setAutoAdd] = useState(true)
    const [type, setType] = useState("paid")
    const [duration, setDuration] = useState("")
    const [restrictions, setRestrictions] = useState("none")
    const [notifyMembers, setNotifyMembers] = useState(true)
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const [repeatEvery, setRepeatEvery] = useState("")
    const [minWorkBefore, setMinWorkBefore] = useState("")
    const [enableMinWorkBefore, setEnableMinWorkBefore] = useState(false)

    // Custom restriction states
    const [customBreakCount, setCustomBreakCount] = useState("")
    const [customBreaks, setCustomBreaks] = useState<{ start: string, end: string }[]>([])

    // Member selection states
    const [isMemberSelectionOpen, setIsMemberSelectionOpen] = useState(false)

    // Populate data for Edit Mode
    useEffect(() => {
        if (open) {
            if (initialData) {
                setPolicyName(initialData.name || "")
                setAutoAdd(initialData.autoAdd !== undefined ? initialData.autoAdd : true)
                setType(initialData.type || "paid")
                setDuration(initialData.duration || "0:00")
                setRestrictions(initialData.restrictions || "none")
                setNotifyMembers(initialData.notifyMembers !== undefined ? initialData.notifyMembers : true)
                setSelectedMembers(initialData.members || [])
                setRepeatEvery(initialData.repeatEvery || "")
                setMinWorkBefore(initialData.minWorkBefore || "")
                setEnableMinWorkBefore(!!initialData.minWorkBefore)
                if (initialData.customBreaks && initialData.customBreaks.length > 0) {
                    setCustomBreakCount(initialData.customBreaks.length.toString())
                    setCustomBreaks(initialData.customBreaks)
                } else {
                    setCustomBreakCount("")
                    setCustomBreaks([])
                }
            } else {
                setPolicyName("")
                setAutoAdd(true)
                setType("paid")
                setDuration("")
                setRestrictions("none")
                setNotifyMembers(true)
                setSelectedMembers([])
                setRepeatEvery("")
                setMinWorkBefore("")
                setEnableMinWorkBefore(false)
                setCustomBreakCount("")
                setCustomBreaks([])
            }
        }
    }, [open, initialData])

    // Update customBreaks array when count changes
    useEffect(() => {
        const count = parseInt(customBreakCount) || 0
        if (count > 0) {
            setCustomBreaks(prev => {
                const newBreaks = [...prev]
                if (newBreaks.length < count) {
                    // Add missing
                    for (let i = newBreaks.length; i < count; i++) {
                        newBreaks.push({ start: "", end: "" })
                    }
                } else if (newBreaks.length > count) {
                    // Remove excess
                    newBreaks.splice(count)
                }
                return newBreaks
            })
        } else {
            setCustomBreaks([])
        }
    }, [customBreakCount])

    const handleCustomBreakChange = (index: number, field: 'start' | 'end', value: string) => {
        setCustomBreaks(prev => {
            const newBreaks = [...prev]
            if (newBreaks[index]) {
                newBreaks[index] = {
                    ...newBreaks[index],
                    [field]: value
                } as { start: string, end: string }
            }
            return newBreaks
        })
    }

    const handleSave = () => {
        if (!policyName) return

        onSave({
            name: policyName,
            autoAdd,
            type,
            duration: duration || "0:00",
            restrictions,
            notifyMembers,
            members: selectedMembers,
            status: "ACTIVE",
            repeatEvery: repeatEvery || "4",
            minWorkBefore: enableMinWorkBefore ? (minWorkBefore || "4") : undefined,
            customBreaks: restrictions === "custom" ? customBreaks : undefined
        })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[540px] p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[90vh] bg-white rounded-2xl">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-2xl font-bold text-slate-900 leading-tight">
                        {readOnly ? "View break policy" : initialData ? "Edit break policy" : "Add break policy"}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-8 pt-2 space-y-8 flex-1 overflow-y-auto">
                    {/* Policy Name */}
                    <div className="space-y-3">
                        <Label htmlFor="policyName" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                            POLICY NAME*
                        </Label>
                        <Input
                            id="policyName"
                            placeholder="Enter a name (ex: Lunch Break)"
                            value={policyName}
                            onChange={(e) => setPolicyName(e.target.value)}
                            className="h-12 border-slate-200 focus:ring-slate-900 rounded-xl text-base bg-slate-50/30 font-medium"
                            disabled={readOnly}
                        />
                    </div>

                    {/* Members Selection */}
                    <div className="space-y-3">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                            MEMBERS
                        </Label>
                        <div
                            className={`w-full h-14 px-4 flex items-center justify-between border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-sm font-medium text-slate-500 cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all group ${readOnly ? 'cursor-not-allowed opacity-60' : ''}`}
                            onClick={() => !readOnly && setIsMemberSelectionOpen(true)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400">
                                    <Search className="w-4 h-4" />
                                </div>
                                {selectedMembers.length > 0
                                    ? <span className="text-slate-900 font-bold">{selectedMembers.length} members selected</span>
                                    : "Select members for this policy"}
                            </div>
                            {!readOnly && <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform">Edit &rarr;</span>}
                        </div>
                    </div>

                    {/* Auto add new members */}
                    <div className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <Checkbox
                            id="autoAdd"
                            checked={autoAdd}
                            onCheckedChange={(checked) => setAutoAdd(checked as boolean)}
                            className="w-5 h-5 border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 text-white"
                            disabled={readOnly}
                        />
                        <Label htmlFor="autoAdd" className="text-slate-700 font-bold text-sm cursor-pointer select-none">
                            Automatically add new members to this policy
                        </Label>
                    </div>

                    {/* Type and Duration */}
                    <div className="grid grid-cols-2 gap-6 pt-2">
                        <div className="space-y-3">
                            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                TYPE
                            </Label>
                            <Select value={type} onValueChange={setType} disabled={readOnly}>
                                <SelectTrigger className="h-12 border-slate-200 rounded-xl focus:ring-slate-900 text-base font-bold text-slate-700">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="paid" className="font-medium">Paid</SelectItem>
                                    <SelectItem value="unpaid" className="font-medium">Unpaid</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="duration" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                DURATION*
                            </Label>
                            <div className="relative flex items-center">
                                <Input
                                    id="duration"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    placeholder="0:00"
                                    className="h-12 border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:ring-slate-900 pr-12"
                                    disabled={readOnly}
                                />
                                <span className="absolute right-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">min</span>
                            </div>
                        </div>
                    </div>

                    {/* Restrictions */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2">
                            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                RESTRICTIONS
                            </Label>
                            <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        <div className="space-y-2">
                            <Select value={restrictions} onValueChange={setRestrictions} disabled={readOnly}>
                                <SelectTrigger className="h-12 border-slate-200 rounded-xl focus:ring-slate-900 text-base font-bold text-slate-700">
                                    <SelectValue placeholder="No restrictions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No restrictions</SelectItem>
                                    <SelectItem value="once_per_session">Once per work session</SelectItem>
                                    <SelectItem value="within_hours">Allow within every few hours</SelectItem>
                                    <SelectItem value="after_hours">Allow after every few hours</SelectItem>
                                    <SelectItem value="custom">Custom Schedule</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {restrictions !== "none" && restrictions !== "custom" && (
                            <div className="space-y-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Restriction Settings
                                </p>

                                {(restrictions === "within_hours" || restrictions === "after_hours") && (
                                    <div className="flex items-center justify-between">
                                        <Label className="text-slate-700 font-bold text-sm">Repeats every</Label>
                                        <div className="flex items-center">
                                            <Input
                                                value={repeatEvery}
                                                onChange={e => setRepeatEvery(e.target.value)}
                                                placeholder="4"
                                                className="w-16 h-10 rounded-l-xl border-slate-200 text-center font-bold text-slate-900 focus:ring-0"
                                                type="number"
                                                disabled={readOnly}
                                            />
                                            <div className="h-10 px-3 bg-white border border-slate-200 border-l-0 rounded-r-xl flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                hrs
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            checked={enableMinWorkBefore}
                                            onCheckedChange={setEnableMinWorkBefore}
                                            disabled={readOnly}
                                            className="data-[state=checked]:bg-slate-900"
                                        />
                                        <Label className="text-slate-700 font-bold text-sm">
                                            {restrictions === "once_per_session" || restrictions === "after_hours"
                                                ? "After working"
                                                : "Must work min"}
                                        </Label>
                                    </div>
                                    <div className="flex items-center">
                                        <Input
                                            value={minWorkBefore}
                                            onChange={e => setMinWorkBefore(e.target.value)}
                                            placeholder="4"
                                            className="w-16 h-10 rounded-l-xl border-slate-200 text-center font-bold text-slate-900 focus:ring-0"
                                            disabled={!enableMinWorkBefore || readOnly}
                                            type="number"
                                        />
                                        <div className="h-10 px-3 bg-white border border-slate-200 border-l-0 rounded-r-xl flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            hrs
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {restrictions === "custom" && (
                            <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-slate-700 font-bold text-sm">Number of breaks</Label>
                                    <Input
                                        value={customBreakCount}
                                        onChange={e => setCustomBreakCount(e.target.value)}
                                        placeholder="0"
                                        className="w-20 h-10 bg-white border-slate-200 rounded-xl text-center font-bold"
                                        type="number"
                                        disabled={readOnly}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 mt-4">
                                    {customBreaks.map((brk, index) => (
                                        <div key={index} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm space-y-3">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Break {index + 1}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">START</Label>
                                                    <Input
                                                        value={brk.start}
                                                        onChange={e => {
                                                            let val = e.target.value.replace(/[^0-9:]/g, '')
                                                            if (val.length === 2 && brk.start.length === 1) val += ':'
                                                            if (val.length <= 5) handleCustomBreakChange(index, 'start', val)
                                                        }}
                                                        placeholder="00:00"
                                                        className="h-10 border-slate-100 rounded-lg text-sm font-bold bg-slate-50/50"
                                                        disabled={readOnly}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">END</Label>
                                                    <Input
                                                        value={brk.end}
                                                        onChange={e => {
                                                            let val = e.target.value.replace(/[^0-9:]/g, '')
                                                            if (val.length === 2 && brk.end.length === 1) val += ':'
                                                            if (val.length <= 5) handleCustomBreakChange(index, 'end', val)
                                                        }}
                                                        placeholder="00:00"
                                                        className="h-10 border-slate-100 rounded-lg text-sm font-bold bg-slate-50/50"
                                                        disabled={readOnly}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notify members */}
                    <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                        <Checkbox
                            id="notify"
                            checked={notifyMembers}
                            onCheckedChange={(checked: boolean | 'indeterminate') => setNotifyMembers(checked as boolean)}
                            className="w-5 h-5 border-indigo-200 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 text-white"
                        />
                        <div className="flex items-center gap-1.5 flex-1">
                            <Label htmlFor="notify" className="text-indigo-900 font-bold text-sm cursor-pointer select-none">
                                Notify members about their breaks
                            </Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="w-3.5 h-3.5 text-indigo-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 text-white p-3 rounded-xl">
                                        <p className="text-xs font-medium">Members get a push & email notification when break starts.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 h-12 rounded-xl text-slate-500 font-bold hover:bg-white"
                    >
                        {readOnly ? "Close" : "Cancel"}
                    </Button>
                    {!readOnly && (
                        <Button
                            onClick={handleSave}
                            disabled={!policyName}
                            className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xl shadow-slate-200 disabled:opacity-30"
                        >
                            {initialData ? "Apply Changes" : "Save Policy"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>

            <MemberSelectionModal
                open={isMemberSelectionOpen}
                onOpenChange={setIsMemberSelectionOpen}
                selectedMembers={selectedMembers}
                onSave={setSelectedMembers}
                title="Select Policy Members"
            />
        </Dialog>
    )
}
