"use client"

import React from "react"
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type ISimpleMember } from "@/action/activity/screenshot"

interface ScreenshotMemberTableProps {
    members: ISimpleMember[]
    loading: boolean
    searchQuery: string
    onSearchChange: (value: string) => void
    currentPage: number
    totalPages: number
    totalMembers: number
    itemsPerPage: number
    onPageChange: (page: number) => void
    memberFrequencies: Record<string, string>
    globalFrequency: string
    frequencyOptions: string[]
    onMemberFrequencyChange: (memberId: string, value: string) => void
}

export function ScreenshotMemberTable({
    members,
    loading,
    searchQuery,
    onSearchChange,
    currentPage,
    totalPages,
    totalMembers,
    itemsPerPage,
    onPageChange,
    memberFrequencies,
    globalFrequency,
    frequencyOptions,
    onMemberFrequencyChange
}: ScreenshotMemberTableProps) {
    const getMemberFrequency = (memberId: string) => {
        return memberFrequencies[memberId] || globalFrequency
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-base font-normal text-slate-900">Individual settings</h3>
                    <p className="text-sm text-slate-600 mt-1">
                        Override the organization default for specific members
                    </p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search members"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full sm:w-64 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                    />
                </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-normal text-slate-700 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-normal text-slate-700 uppercase tracking-wider">
                                Frequency
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {loading ? (
                            <tr>
                                <td colSpan={2} className="px-4 py-8 text-center text-sm text-slate-500">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading members...
                                    </div>
                                </td>
                            </tr>
                        ) : members.length === 0 ? (
                            <tr>
                                <td colSpan={2} className="px-4 py-8 text-center text-sm text-slate-500">
                                    No members found
                                </td>
                            </tr>
                        ) : (
                            members.map((member) => {
                                const memberFrequency = getMemberFrequency(member.id)
                                return (
                                    <tr key={member.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                                    {member.avatarUrl ? (
                                                        <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-medium text-slate-900">
                                                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-sm text-slate-900">
                                                    {member.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end">
                                                <Select
                                                    value={memberFrequency}
                                                    onValueChange={(value) => onMemberFrequencyChange(member.id, value)}
                                                >
                                                    <SelectTrigger className="w-20">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {frequencyOptions.map(option => (
                                                            <SelectItem key={option} value={option}>
                                                                {option}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && members.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-slate-500">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalMembers)} of {totalMembers} members
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm text-slate-700">
                            Page {currentPage} of {totalPages || 1}
                        </span>
                        <button
                            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
