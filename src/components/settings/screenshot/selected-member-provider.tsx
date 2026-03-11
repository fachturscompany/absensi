"use client"

import { createContext, ReactNode } from "react"
import type { Member } from "@/lib/data/dummy-data"
import type { DateRange } from "@/components/insights/types"

export interface SelectedMemberContextValue {
    selectedMemberId: string | null
    selectedMember: Member | null
    dateRange: DateRange
}

export const SelectedMemberContext = createContext<SelectedMemberContextValue | undefined>(undefined)

export function SelectedMemberProvider({
    value,
    children,
}: {
    value: SelectedMemberContextValue
    children: ReactNode
}) {
    return (
        <SelectedMemberContext.Provider value={value}>
            {children}
        </SelectedMemberContext.Provider>
    )
}
