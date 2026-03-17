"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Lightbulb, X } from "lucide-react"

interface SaveReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (name: string) => void
}

export function SaveReportDialog({ open, onOpenChange, onSave }: SaveReportDialogProps) {
    const [name, setName] = useState("")
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [scheduleEnabled, setScheduleEnabled] = useState(false)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Save customized report</DialogTitle>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                    <p className="text-sm text-gray-500">
                        Saved reports are saved to your account only. If you want to share this report with others, you can export, send, or schedule it to be delivered automatically.
                    </p>

                    <div className="space-y-2">
                        <Label htmlFor="report-name" className="text-xs font-bold text-gray-500 uppercase">Name *</Label>
                        <Input
                            id="report-name"
                            placeholder="Give this report a name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen} className="space-y-2">
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-sm font-medium text-gray-700 bg-gray-50 rounded hover:bg-gray-100">
                            Saved settings
                            <ChevronDown className={`w-4 h-4 transition-transform ${settingsOpen ? "rotate-180" : ""}`} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-2 text-sm text-gray-500 space-y-1">
                            <p>These settings will be pre-selected when you open your saved report.</p>
                            {/* Placeholder for actual settings preview if needed */}
                        </CollapsibleContent>
                    </Collapsible>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase">Schedule report to be sent</Label>
                        <div className="flex items-center space-x-2">
                            <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
                        </div>
                    </div>

                    {scheduleEnabled && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex gap-3">
                            <div className="mt-0.5">
                                <div className="w-4 h-4 rounded-full border-2 border-blue-500 flex items-center justify-center">
                                    <div className="w-0.5 h-2 bg-blue-500 rounded-full" />
                                </div>
                            </div>
                            <div className="text-sm text-blue-700">
                                <span className="font-semibold block mb-1">Schedule report</span>
                                Saved reports can be scheduled to be sent out via email to specified recipients at the frequency and duration of your choice.
                            </div>
                        </div>
                    )}
                    {!scheduleEnabled && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex gap-3 relative">
                            <button className="absolute top-2 right-2 text-blue-400 hover:text-blue-600">
                                <X className="w-4 h-4" />
                            </button>
                            <div className="mt-0.5 text-blue-600">
                                <Lightbulb className="w-5 h-5" />
                            </div>
                            <div className="text-sm text-blue-700">
                                <span className="font-semibold block mb-1">Schedule report</span>
                                Saved reports can be scheduled to be sent out via email to specified recipients at the frequency and duration of your choice.
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-6 flex items-center justify-between sm:justify-between w-full">
                    <button className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                        <span className="text-lg">▷</span> Send preview
                    </button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button className="bg-gray-900 hover:bg-gray-800 text-white" onClick={() => onSave(name)}>Save</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
