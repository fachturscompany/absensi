"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { SearchBar } from "@/components/customs/search-bar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"

interface MemberSelectionModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedMembers: string[]
    onSave: (members: string[]) => void
    title?: string
}

export function MemberSelectionModal({
    open,
    onOpenChange,
    selectedMembers,
    onSave,
    title = "Members"
}: MemberSelectionModalProps) {
    const [localSelected, setLocalSelected] = useState<string[]>(selectedMembers)
    const [searchQuery, setSearchQuery] = useState("")
    const [members, setMembers] = useState<{ id: string; name: string }[]>([])
    const [totalMembers, setTotalMembers] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 10

    useEffect(() => {
        if (open) {
            setLocalSelected(selectedMembers)
            setSearchQuery("")
            setCurrentPage(1)
        }
    }, [open, selectedMembers])

    useEffect(() => {
        setIsLoading(true)
        const filtered = DUMMY_MEMBERS.filter(member =>
            member.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
        const endIndex = startIndex + ITEMS_PER_PAGE
        const paginated = filtered.slice(startIndex, endIndex)

        setMembers(paginated.map(m => ({ id: m.id, name: m.name })))
        setTotalMembers(filtered.length)
        setIsLoading(false)
    }, [searchQuery, currentPage, open])

    const totalPages = Math.ceil(totalMembers / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE

    const handleToggle = (id: string) => {
        if (localSelected.includes(id)) {
            setLocalSelected(localSelected.filter(i => i !== id))
        } else {
            setLocalSelected([...localSelected, id])
        }
    }

    const handleSelectAll = () => {
        if (totalMembers > 0 && localSelected.length >= totalMembers) {
            setLocalSelected([])
        } else {
            const filtered = DUMMY_MEMBERS.filter(member =>
                member.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            const allIds = filtered.map(m => m.id)
            if (searchQuery) {
                const newSet = new Set([...localSelected, ...allIds])
                setLocalSelected(Array.from(newSet))
            } else {
                setLocalSelected(allIds)
            }
        }
    }

    const handleClearAll = () => setLocalSelected([])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden flex flex-col h-[85vh] bg-white border-none shadow-2xl">
                <DialogHeader className="p-6 pb-2 flex-shrink-0 border-b border-transparent">
                    <DialogTitle className="text-xl font-semibold text-slate-900">{title}</DialogTitle>
                </DialogHeader>

                <div className="px-6 pb-0">
                    <div className="flex border-b border-slate-900 w-max">
                        <button className="px-1 py-2 text-sm font-semibold text-slate-900 uppercase tracking-wider">
                            MEMBERS
                        </button>
                    </div>
                </div>

                <div className="px-6 pt-4 pb-4 flex-shrink-0">
                    <SearchBar
                        initialQuery={searchQuery}
                        onSearch={(value) => {
                            setSearchQuery(value)
                            setCurrentPage(1)
                        }}
                        placeholder="Search members..."
                        className="h-11 bg-white border-slate-200 text-slate-900 focus:ring-slate-900 rounded-lg"
                    />
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 pb-3 flex items-center justify-between flex-shrink-0">
                        <button
                            onClick={handleSelectAll}
                            className="text-sm font-medium text-slate-900 hover:text-slate-700 underline underline-offset-4"
                        >
                            {totalMembers > 0 && localSelected.length >= totalMembers ? "Deselect all" : "Select all"}
                        </button>
                        {localSelected.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="text-sm font-medium text-slate-500 hover:text-slate-900"
                            >
                                Clear all ({localSelected.length})
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto px-6">
                        <div className="space-y-1 border border-slate-100 rounded-xl overflow-hidden">
                            {!isLoading && members.length > 0 ? (
                                members.map((member) => (
                                    <div key={member.id} className="flex items-center space-x-3 p-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                                        <Checkbox
                                            id={`member-${member.id}`}
                                            checked={localSelected.includes(member.id)}
                                            onCheckedChange={() => handleToggle(member.id)}
                                            className="w-5 h-5 border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
                                        />
                                        <Label
                                            htmlFor={`member-${member.id}`}
                                            className="text-sm font-medium text-slate-700 cursor-pointer flex-1"
                                        >
                                            {member.name}
                                        </Label>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-sm text-slate-400">
                                    {isLoading ? "Loading members..." : "No members found"}
                                </div>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="py-4 flex items-center justify-between">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1 || isLoading}
                                    className="h-9 border-slate-200"
                                >
                                    Previous
                                </Button>
                                <span className="text-xs font-medium text-slate-500">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || isLoading}
                                    className="h-9 border-slate-200"
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="text-[10px] text-slate-400 px-6 py-3 uppercase tracking-widest font-bold flex-shrink-0">
                        Showing {startIndex + 1}-{Math.min(startIndex + members.length, totalMembers)} of {totalMembers} members
                    </div>
                </div>

                <DialogFooter className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="h-11 px-8 rounded-xl border-slate-200 text-slate-600 font-bold"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            onSave(localSelected)
                            onOpenChange(false)
                        }}
                        className="h-11 px-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-200"
                    >
                        Apply Selection
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
