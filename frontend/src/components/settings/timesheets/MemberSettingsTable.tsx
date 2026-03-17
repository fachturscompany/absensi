"use client"

import React from "react"
import { User, Loader2, Info, ChevronLeft, ChevronRight } from "lucide-react"
import { Switch } from "@/components/ui/switch"

export type ModifyTimeOption = "add-edit" | "off"

export interface MemberWithSettings {
    id: string
    name: string
    avatarUrl?: string | null
    modifyTimeSetting: ModifyTimeOption
    requireApproval: boolean
}

interface MemberSettingsTableProps {
    members: MemberWithSettings[]
    loading: boolean
    currentPage: number
    totalPages: number
    totalMembers: number
    itemsPerPage: number
    modifyOptions: { value: ModifyTimeOption; label: string }[]
    onMemberModifyChange: (id: string, value: ModifyTimeOption) => void
    onMemberApprovalChange: (id: string, value: boolean) => void
    onPageChange: (page: number) => void
}

export function MemberSettingsTable({
    members,
    loading,
    currentPage,
    totalPages,
    totalMembers,
    itemsPerPage,
    modifyOptions,
    onMemberModifyChange,
    onMemberApprovalChange,
    onPageChange
}: MemberSettingsTableProps) {
    return (
        <>
            <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
                {/* Table Header */}
                <div className="hidden sm:grid grid-cols-3 py-3 bg-slate-50 border-b border-slate-200 px-4">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Name</span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider text-center">Modify time (manual time)</span>
                    <div className="flex items-center gap-1 justify-end">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Require approval</span>
                        <span title="Settings for require approval"><Info className="w-3 h-3 text-slate-400" /></span>
                    </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-slate-100 min-h-[300px]">
                    {loading && members.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                            <span className="text-xs font-light uppercase tracking-widest">Loading members...</span>
                        </div>
                    ) : members.length === 0 ? (
                        <div className="py-20 text-center text-slate-400">
                            <span className="text-xs font-light uppercase tracking-widest">No members found</span>
                        </div>
                    ) : members.map((member) => (
                        <div key={member.id} className="flex flex-col sm:grid sm:grid-cols-3 sm:items-center py-4 px-4 gap-4 sm:gap-0 hover:bg-slate-50/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                    {member.avatarUrl ? (
                                        <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="w-4 h-4 text-slate-400" />
                                    )}
                                </div>
                                <span className="text-sm font-medium text-slate-900">{member.name}</span>
                            </div>
                            <div className="flex justify-center">
                                <div className="inline-flex rounded-full bg-slate-100 p-0.5 w-fit">
                                    {modifyOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => onMemberModifyChange(member.id, option.value)}
                                            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${member.modifyTimeSetting === option.value
                                                ? "bg-white text-gray-900 shadow-sm"
                                                : "text-gray-500 hover:text-gray-700 font-light"
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-2">
                                <span className="text-[10px] font-normal text-slate-400 sm:hidden uppercase tracking-wider font-light">Require approval:</span>
                                <Switch
                                    checked={member.requireApproval}
                                    onCheckedChange={(checked) => onMemberApprovalChange(member.id, checked)}
                                    className="data-[state=checked]:!bg-slate-900 data-[state=unchecked]:bg-slate-200 [&>span]:!bg-white"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination */}
            {!loading && members.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 gap-4 px-2 mb-8">
                    <div className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalMembers)} of {totalMembers} members
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-[10px] font-normal text-slate-500 uppercase tracking-widest px-2">
                            Page {currentPage} of {totalPages || 1}
                        </span>
                        <button
                            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
