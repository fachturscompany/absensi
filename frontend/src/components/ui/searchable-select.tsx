"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export interface Option {
    value: string
    label: string
}

interface SearchableSelectProps {
    value: string
    onValueChange: (value: string) => void
    options: Option[]
    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    className?: string
}

export function SearchableSelect({
    value,
    onValueChange,
    options,
    placeholder = "Select option",
    searchPlaceholder = "Search...",
    emptyMessage = "No option found.",
    className
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal text-sm", !value && "text-muted-foreground", className)}
                >
                    {value && value !== "all"
                        ? options.find((option) => option.value === value)?.label
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--trigger-width] p-0 dark:bg-gray-950 dark:border-gray-800" align="start" style={{ width: "100%" }}>
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {/* Always allow clearing or selecting 'all' if handled by parent logic, 
                                 but here we usually treat specific value. 
                                 Let's add an explicit "All" option if passed in options.
                             */}
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                        onValueChange(option.value === value ? "" : option.value)
                                        setOpen(false)
                                    }}
                                    className="data-[selected='true']:bg-gray-100 dark:data-[selected='true']:bg-gray-800 dark:text-gray-100 dark:aria-selected:bg-gray-800 dark:aria-selected:text-gray-100"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
