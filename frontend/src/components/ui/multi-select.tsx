"use client";

import * as React from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";

type Option = {
    label: string;
    value: string;
};

interface MultiSelectProps {
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Select items...",
    className,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);
    const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleUnselect = (item: string) => {
        onChange(selected.filter((i) => i !== item));
    };

    const handleBlur = () => {
        closeTimeoutRef.current = setTimeout(() => {
            setOpen(false);
        }, 150);
    };

    const handleSelect = (item: string) => {
        setInputValue("");

        // Cancel blur-triggered close
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }

        if (selected.includes(item)) {
            handleUnselect(item);
        } else {
            onChange([...selected, item]);
        }

        // Keep open and focused
        inputRef.current?.focus();
        setOpen(true);
    };

    const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            const input = inputRef.current;
            if (input) {
                if (e.key === "Delete" || e.key === "Backspace") {
                    if (input.value === "" && selected.length > 0) {
                        const lastSelected = selected[selected.length - 1];
                        if (lastSelected) handleUnselect(lastSelected);
                    }
                }
                if (e.key === "Escape") {
                    input.blur();
                    setOpen(false); // Explicitly close on Escape
                }
            }
        },
        [selected]
    );

    const selectables = options;

    // Clear timeout on unmount
    React.useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    return (
        <Command
            onKeyDown={handleKeyDown}
            className={`overflow-visible bg-transparent ${className}`}
        >
            <div
                className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            >
                <div className="flex gap-1 flex-wrap">
                    {selected.map((itemValue) => {
                        const option = options.find((o) => o.value === itemValue);
                        return (
                            <Badge key={itemValue} variant="secondary">
                                {option ? option.label : itemValue}
                                <button
                                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleUnselect(itemValue);
                                        }
                                    }}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onClick={() => handleUnselect(itemValue)}
                                >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                            </Badge>
                        );
                    })}
                    <CommandPrimitive.Input
                        ref={inputRef}
                        value={inputValue}
                        onValueChange={setInputValue}
                        onBlur={handleBlur}
                        onFocus={() => {
                            if (closeTimeoutRef.current) {
                                clearTimeout(closeTimeoutRef.current);
                            }
                            setOpen(true);
                        }}
                        placeholder={placeholder}
                        className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
                    />
                </div>
            </div>
            <div className="relative mt-2">
                {open && selectables.length > 0 ? (
                    <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                        <CommandList>
                            <CommandGroup className="h-full overflow-auto max-h-[200px]">
                                {selectables.map((option) => {
                                    const isSelected = selected.includes(option.value);
                                    return (
                                        <CommandItem
                                            key={option.value}
                                            onSelect={() => {
                                                handleSelect(option.value);
                                            }}
                                            onMouseDown={(e) => {
                                                if (closeTimeoutRef.current) {
                                                    clearTimeout(closeTimeoutRef.current);
                                                    closeTimeoutRef.current = null;
                                                }
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            className="cursor-pointer"
                                        >
                                            <div
                                                className={cn(
                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                    isSelected
                                                        ? "bg-primary text-primary-foreground"
                                                        : "opacity-50 [&_svg]:invisible"
                                                )}
                                            >
                                                <Check className={cn("h-4 w-4")} />
                                            </div>
                                            {option.label}
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </div>
                ) : null}
            </div>
        </Command>
    );
}
