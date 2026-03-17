"use client"

import { useContext } from "react"
import { BlurContext } from "@/components/settings/screenshot/blur-provider"

export function useBlurSettings() {
    const context = useContext(BlurContext)
    if (context === undefined) {
        throw new Error("useBlurSettings must be used within a BlurProvider")
    }
    return context
}
