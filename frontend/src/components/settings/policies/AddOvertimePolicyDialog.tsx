"use client"

import { useState, useEffect } from "react"
import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Info, Search } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { MemberSelectionModal } from "@/components/settings/MemberSelectionModal"

interface AddOvertimePolicyDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (policy: any) => void
    initialData?: any
}

export function AddOvertimePolicyDialog({ open, onOpenChange, onSave, initialData: _initialData }: AddOvertimePolicyDialogProps) {
    const [policyName, setPolicyName] = useState("")
    const [weeklyThreshold, setWeeklyThreshold] = useState("40")
    const [payRateMultiplier, setPayRateMultiplier] = useState("1.5")
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const [isMemberSelectionOpen, setIsMemberSelectionOpen] = useState(false)

    useEffect(() => {
        console.log('Dialog open state changed:', open)
    }, [open])

    const handleSave = () => {
        if (!policyName.trim()) return

        onSave({
            name: policyName,
            weeklyThreshold,
            payRateMultiplier,
            members: selectedMembers,
            status: "ACTIVE"
        })

        // Reset form
        setPolicyName("")
        setWeeklyThreshold("40")
        setPayRateMultiplier("1.5")
        setSelectedMembers([])
        onOpenChange(false)
    }

    const handleSelectAll = () => {
        // Filter all members to match current organizational filter
        const allMemberIds = DUMMY_MEMBERS.map(m => m.id)
        setSelectedMembers(allMemberIds)
    }

    const handleMemberSelectionSave = (members: string[]) => {
        setSelectedMembers(members)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border-none shadow-2xl rounded-2xl">
                    <DialogHeader className="p-2">
                        <DialogTitle className="text-2xl font-bold text-slate-900">
                            Create weekly overtime policy
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-8 py-6">
                        {/* Policy Name */}
                        <div className="space-y-3">
                            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                POLICY NAME*
                            </Label>
                            <Input
                                value={policyName}
                                onChange={(e) => setPolicyName(e.target.value)}
                                placeholder="e.g. Standard 40h Overtime"
                                className="h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:ring-slate-900"
                            />
                        </div>

                        {/* Weekly Overtime Section */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                Weekly overtime
                                <div className="h-px flex-1 bg-slate-100" />
                            </h3>

                            {/* Weekly Overtime Threshold */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                        WEEKLY OVERTIME THRESHOLD
                                    </Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="cursor-help">
                                                    <Info className="w-3.5 h-3.5 text-slate-400" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-slate-900 text-white border-slate-800 p-3 rounded-xl max-w-64">
                                                <p className="text-sm font-medium">
                                                    The number of hours per week after which overtime pay begins
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative flex items-center">
                                        <Input
                                            type="number"
                                            value={weeklyThreshold}
                                            onChange={(e) => setWeeklyThreshold(e.target.value)}
                                            className="w-32 h-11 bg-white border-slate-200 text-slate-900 rounded-xl pr-12 focus:ring-slate-900"
                                        />
                                        <span className="absolute right-4 text-xs font-bold text-slate-400 uppercase tracking-wider">hrs</span>
                                    </div>
                                </div>
                            </div>

                            {/* Weekly Overtime Pay Rate Multiplier */}
                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                    WEEKLY OVERTIME PAY RATE MULTIPLIER
                                </Label>
                                <div className="flex items-center gap-3">
                                    <div className="relative flex items-center">
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={payRateMultiplier}
                                            onChange={(e) => setPayRateMultiplier(e.target.value)}
                                            className="w-32 h-11 bg-white border-slate-200 text-slate-900 rounded-xl pr-8 focus:ring-slate-900"
                                        />
                                        <span className="absolute right-4 text-xs font-bold text-slate-400 uppercase tracking-wider">x</span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-500 italic">member's pay rate</span>
                                </div>
                            </div>
                        </div>

                        {/* Notifications Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                Notifications
                                <div className="h-px flex-1 bg-slate-100" />
                            </h3>

                            {/* Notification Items */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        1 HOUR BEFORE LIMIT
                                    </div>
                                    <div className="text-sm font-medium text-slate-700 leading-relaxed">
                                        Members & owners will receive an email notification
                                    </div>
                                </div>

                                <div className="p-5 bg-slate-50 rounded-2xl space-y-2 border border-slate-100 text-indigo-900 bg-indigo-50/50 border-indigo-100">
                                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                        THRESHOLD REACHED
                                    </div>
                                    <div className="text-sm font-medium text-indigo-800 leading-relaxed">
                                        Real-time notification when member begins overtime
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Policy Members Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                Policy members
                                <div className="h-px flex-1 bg-slate-100" />
                            </h3>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                        MEMBERS
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
                                    >
                                        Select all members
                                    </button>
                                </div>
                                <div
                                    onClick={() => setIsMemberSelectionOpen(true)}
                                    className="w-full h-14 px-4 flex items-center justify-between border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-sm font-medium text-slate-500 cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400">
                                            <Search className="w-4 h-4" />
                                        </div>
                                        {selectedMembers.length > 0
                                            ? <span className="text-slate-900 font-bold">{selectedMembers.length} members selected</span>
                                            : "Search and select members for this policy"}
                                    </div>
                                    <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform">Edit List &rarr;</span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium px-1">
                                    Note: Members can only be assigned to one overtime policy at a time.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex items-center justify-end gap-3 p-2 pt-6 border-t border-slate-100">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="px-8 h-12 rounded-xl text-slate-500 font-bold hover:bg-slate-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!policyName.trim()}
                            className="px-10 h-12 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-300 shadow-xl shadow-slate-200 transition-all"
                        >
                            Create Policy
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <MemberSelectionModal
                open={isMemberSelectionOpen}
                onOpenChange={setIsMemberSelectionOpen}
                selectedMembers={selectedMembers}
                onSave={handleMemberSelectionSave}
                title="Select Policy Members"
            />
        </>
    )
}
