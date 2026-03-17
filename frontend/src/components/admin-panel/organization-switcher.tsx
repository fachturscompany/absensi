"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, ShoppingBag, Box } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OrganizationSwitcherProps {
    isOpen: boolean | undefined;
}

export function OrganizationSwitcher({ isOpen }: OrganizationSwitcherProps) {
    const [selectedOrg, setSelectedOrg] = React.useState({
        name: "E-Commerce",
        icon: ShoppingBag,
        plan: "Free",
    });

    const organizations = [
        {
            name: "E-Commerce",
            icon: ShoppingBag,
            plan: "Free",
            status: "Active",
        },
        {
            name: "Blog Platform",
            icon: Box,
            plan: "Pro",
            status: "Inactive",
        },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        "flex items-center gap-2 px-2 w-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-300",
                        !isOpen ? "justify-center px-0 h-10 w-10" : "justify-start h-12"
                    )}
                >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <selectedOrg.icon className="size-4" />
                    </div>
                    <div className={cn(
                        "grid flex-1 text-left text-sm leading-tight transition-all duration-300",
                        !isOpen ? "w-0 opacity-0 overflow-hidden hidden" : "w-auto opacity-100"
                    )}>
                        <span className="truncate font-semibold">{selectedOrg.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{selectedOrg.plan}</span>
                    </div>
                    <ChevronsUpDown className={cn(
                        "ml-auto size-4 transition-all duration-300",
                        !isOpen ? "opacity-0 hidden" : "opacity-100"
                    )} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
            >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Organizations
                </DropdownMenuLabel>
                {organizations.map((org, index) => (
                    <DropdownMenuItem
                        key={index}
                        onClick={() => setSelectedOrg(org)}
                        className="gap-2 p-2 cursor-pointer"
                    >
                        <div className="flex size-6 items-center justify-center rounded-sm border">
                            <org.icon className="size-4 shrink-0" />
                        </div>
                        <div className="flex flex-col gap-0.5 leading-none px-1">
                            <div className="font-medium text-sm text-foreground">{org.name}</div>
                            <div className={cn("text-xs", org.status === "Active" ? "text-green-600 font-medium" : "text-muted-foreground")}>
                                {org.status}
                            </div>
                        </div>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 p-2 cursor-pointer">
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                        <Plus className="size-4" />
                    </div>
                    <div className="font-medium text-muted-foreground">New Organization</div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
