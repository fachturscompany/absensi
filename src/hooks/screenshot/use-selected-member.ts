"use client"

import { useContext } from "react"
import { SelectedMemberContext } from "@/components/settings/screenshot/selected-member-provider"

export function useSelectedMemberContext() {
    const context = useContext(SelectedMemberContext)
    if (!context) {
        throw new Error("SelectedMemberContext must be used within its provider")
    }
    return context
}

// Backward compatibility: selectedDate is now dateRange.startDate
export function useSelectedDate() {
    const context = useSelectedMemberContext()
    return context.dateRange.startDate
}
