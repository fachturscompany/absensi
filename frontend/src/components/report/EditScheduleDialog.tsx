"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Trash2 } from "lucide-react"

interface EditScheduleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: any
    onSave: (data: any) => void
}

const DAYS = [
    { id: "Su", label: "Su" },
    { id: "Mo", label: "Mo" },
    { id: "Tu", label: "Tu" },
    { id: "We", label: "We" },
    { id: "Th", label: "Th" },
    { id: "Fr", label: "Fr" },
    { id: "Sa", label: "Sa" },
]

export function EditScheduleDialog({ open, onOpenChange, initialData, onSave }: EditScheduleDialogProps) {
    const data = initialData || {}

    // Controlled State
    const [frequency, setFrequency] = useState(data.frequency || "weekly")
    const [dateRange, setDateRange] = useState(data.dateRange || "last-week")
    const [selectedDays, setSelectedDays] = useState<string[]>(data.deliveryDays || ["Mo"])

    // Logic: Update Date Range based on Frequency
    const handleFrequencyChange = (value: string) => {
        setFrequency(value)
        if (value === "weekly") {
            setDateRange("last-week")
        } else if (value === "monthly") {
            setDateRange("last-month")
            // Monthly usually just one day, e.g. 1st. For simplicity, we might just reset days or keep as is if implied "1st Monday"
        } else if (value === "daily") {
            setDateRange("last-week") // Or appropriate default
            setSelectedDays(DAYS.map(d => d.id)) // Select all for daily
        }
    }

    const toggleDay = (dayId: string) => {
        if (frequency === "daily") return // Cannot change days for daily
        setSelectedDays(prev =>
            prev.includes(dayId)
                ? prev.filter(d => d !== dayId)
                : [...prev, dayId]
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit scheduled report</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase">NAME *</Label>
                        <Input className="pl-3" defaultValue={initialData?.name || "Time and Activity"} />
                    </div>

                    {/* Emails */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase">EMAIL ADDRESSES *</Label>
                        <Input className="pl-3" defaultValue={data.emails || ""} />
                        <p className="text-xs text-muted-foreground">Separate email addresses with commas</p>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase">MESSAGE *</Label>
                        <Textarea
                            className="min-h-[100px]"
                            defaultValue={data.message || ""}
                        />
                    </div>

                    {/* Grid Options */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase">FILE TYPE *</Label>
                            <Select defaultValue={data.fileType || "pdf"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pdf">PDF</SelectItem>
                                    <SelectItem value="csv">CSV</SelectItem>
                                    <SelectItem value="xls">Excel</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase">DELIVERY FREQUENCY *</Label>
                            <Select value={frequency} onValueChange={handleFrequencyChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase">DATE RANGE</Label>
                            <Select value={dateRange} onValueChange={setDateRange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="last-week">Last week</SelectItem>
                                    <SelectItem value="last-month">Last month</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase">DELIVERY TIME *</Label>
                            <Select defaultValue={data.deliveryTime || "09:00"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="09:00">09:00 am</SelectItem>
                                    <SelectItem value="17:00">05:00 pm</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Delivery Days */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase">DELIVERY DAYS *</Label>
                        <div className="flex gap-3">
                            {DAYS.map((day) => (
                                <button
                                    key={day.id}
                                    onClick={() => toggleDay(day.id)}
                                    // Disabled style if daily (since all are forced selected)
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors border ${selectedDays.includes(day.id)
                                        ? "bg-gray-800 text-white border-gray-800"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                        } ${frequency === 'daily' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                        {frequency === 'monthly' && (
                            <p className="text-xs text-muted-foreground mt-1">* For monthly reports, selected days indicate specific weekdays (e.g. every selected Monday of the month).</p>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
                    <Button variant="ghost" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-0 flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Clear schedule
                    </Button>
                    <div className="flex gap-2">
                        <DialogClose asChild>
                            <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50">Cancel</Button>
                        </DialogClose>
                        <Button className="bg-gray-900 hover:bg-black text-white" onClick={() => {
                            onSave({
                                frequency,
                                dateRange,
                                deliveryDays: selectedDays
                            })
                            onOpenChange(false)
                        }}>
                            Schedule & Save
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
