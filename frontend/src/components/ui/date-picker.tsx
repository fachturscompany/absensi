"use client"

import * as React from "react"
import { format, getMonth, getYear, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from "date-fns"
import { ChevronLeft, ChevronRight, CalendarDays as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
    selected?: Date
    onSelect?: (date: Date | undefined) => void
    className?: string
    placeholder?: string
    fromYear?: number
    toYear?: number
}

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

export function DatePicker({
    selected,
    onSelect,
    className,
    placeholder = "Pick a date",
    fromYear = 1900,
    toYear = new Date().getFullYear(),
}: DatePickerProps) {
    const [currentMonth, setCurrentMonth] = React.useState(new Date())
    const [isOpen, setIsOpen] = React.useState(false)

    React.useEffect(() => {
        if (selected) {
            setCurrentMonth(selected)
        }
    }, [selected])

    const years = React.useMemo(() => {
        const y = []
        for (let i = fromYear; i <= toYear; i++) {
            y.push(i)
        }
        return y.reverse() // Most recent years first
    }, [fromYear, toYear])

    const daysInMonth = React.useMemo(() => {
        const start = startOfMonth(currentMonth)
        const end = endOfMonth(currentMonth)
        return eachDayOfInterval({ start, end })
    }, [currentMonth])

    // Pad the start of the month
    const startingEmptyDays = React.useMemo(() => {
        const start = startOfMonth(currentMonth)
        const dayOfWeek = start.getDay() // 0 = Sunday
        return Array(dayOfWeek).fill(null)
    }, [currentMonth])

    const handleMonthChange = (value: string) => {
        const newMonth = new Date(currentMonth)
        newMonth.setDate(1) // Avoid month overflow
        newMonth.setMonth(parseInt(value))
        setCurrentMonth(newMonth)
    }

    const handleYearChange = (value: string) => {
        const newMonth = new Date(currentMonth)
        newMonth.setDate(1) // Avoid month overflow
        newMonth.setFullYear(parseInt(value))
        setCurrentMonth(newMonth)
    }

    const handlePrevMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1))
    }

    const handleNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1))
    }

    const handleDayClick = (date: Date) => {
        if (onSelect) {
            onSelect(date)
        }
        setIsOpen(false)
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !selected && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selected ? format(selected, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
                <div className="space-y-4">

                    {/* Header: Month/Year Dropdowns & Nav */}
                    <div className="flex items-center justify-between gap-2">
                        <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-7 w-7">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex flex-1 gap-2">
                            <Select
                                value={getMonth(currentMonth).toString()}
                                onValueChange={handleMonthChange}
                            >
                                <SelectTrigger className="h-7 w-[110px] text-xs">
                                    <SelectValue>{months[getMonth(currentMonth)]}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((month, index) => (
                                        <SelectItem key={month} value={index.toString()}>
                                            {month}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={getYear(currentMonth).toString()}
                                onValueChange={handleYearChange}
                            >
                                <SelectTrigger className="h-7 w-[80px] text-xs">
                                    <SelectValue>{getYear(currentMonth)}</SelectValue>
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {years.map((year) => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-7 w-7">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                        {/* Weekday Headers */}
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                            <div key={day} className="text-muted-foreground font-medium py-1">
                                {day}
                            </div>
                        ))}

                        {/* Empty days for padding */}
                        {startingEmptyDays.map((_, index) => (
                            <div key={`empty-${index}`} />
                        ))}

                        {/* Days */}
                        {daysInMonth.map((date) => {
                            const isSelected = selected ? isSameDay(date, selected) : false
                            const isTodayDate = isToday(date)

                            return (
                                <div key={date.toString()}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-8 w-8 p-0 font-normal",
                                            isSelected && "bg-black text-white hover:bg-black/90 focus:bg-black/90",
                                            !isSelected && isTodayDate && "bg-accent text-accent-foreground",
                                            !isSelected && "hover:bg-accent hover:text-accent-foreground"
                                        )}
                                        onClick={() => handleDayClick(date)}
                                    >
                                        {format(date, "d")}
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
