"use client"

import { createContext, useState, useEffect, ReactNode } from "react"

export interface BlurSettings {
    globalBlur: boolean
    memberBlurs: Record<string, boolean>
}

export interface BlurContextType {
    blurSettings: BlurSettings
    setGlobalBlur: (blur: boolean) => void
    setMemberBlur: (memberId: string, blur: boolean) => void
    getMemberBlur: (memberId: string) => boolean
}

export const BlurContext = createContext<BlurContextType | undefined>(undefined)

export function BlurProvider({ children }: { children: ReactNode }) {
    const [blurSettings, setBlurSettings] = useState<BlurSettings>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("screenshotBlurSettings")
            if (saved) {
                try {
                    return JSON.parse(saved)
                } catch (e) {
                    // If parsing fails, use default
                }
            }
        }
        return {
            globalBlur: false,
            memberBlurs: {}
        }
    })

    // Save to localStorage whenever settings change
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("screenshotBlurSettings", JSON.stringify(blurSettings))
            // Dispatch custom event to notify other components
            window.dispatchEvent(new Event("blurSettingsChanged"))
        }
    }, [blurSettings])

    const setGlobalBlur = (blur: boolean) => {
        setBlurSettings(prev => ({
            ...prev,
            globalBlur: blur
        }))
    }

    const setMemberBlur = (memberId: string, blur: boolean) => {
        setBlurSettings(prev => ({
            ...prev,
            memberBlurs: {
                ...prev.memberBlurs,
                [memberId]: blur
            }
        }))
    }

    const getMemberBlur = (memberId: string) => {
        // If member has specific setting, use it; otherwise use global
        if (blurSettings.memberBlurs[memberId] !== undefined) {
            return blurSettings.memberBlurs[memberId]
        }
        return blurSettings.globalBlur
    }

    return (
        <BlurContext.Provider value={{ blurSettings, setGlobalBlur, setMemberBlur, getMemberBlur }}>
            {children}
        </BlurContext.Provider>
    )
}
