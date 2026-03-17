"use client"

import React from "react"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ScreenshotGlobalSettingsProps {
    globalFrequency: string
    onGlobalFrequencyChange: (value: string) => void
    onApplyToAll: () => void
    frequencyOptions: string[]
}

export function ScreenshotGlobalSettings({
    globalFrequency,
    onGlobalFrequencyChange,
    onApplyToAll,
    frequencyOptions
}: ScreenshotGlobalSettingsProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <h2 className="text-lg font-normal text-slate-900">SCREENSHOT FREQUENCY</h2>
                <Info className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-sm text-slate-600">
                Control the number of screenshots taken in a 10 minute period.
            </p>

            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">GLOBAL:</span>
                        <Info className="h-4 w-4 text-slate-400" />
                    </div>
                    <Select value={globalFrequency} onValueChange={onGlobalFrequencyChange}>
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
                    <Button
                        variant="default"
                        size="sm"
                        onClick={onApplyToAll}
                        className="bg-slate-900 hover:bg-slate-800 text-white"
                    >
                        Apply to all
                    </Button>
                </div>
            </div>
        </div>
    )
}
