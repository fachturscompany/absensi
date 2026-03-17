"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDashboardStore } from "@/store/dashboard-store";
import { Settings2 } from "lucide-react";

export function ManageWidgets() {
    const { visibleWidgets, toggleWidget } = useDashboardStore();

    const widgetGroups = [
        {
            label: "Extra large widgets",
            items: [
                { key: "map", label: "Map" },
            ],
        },
        {
            label: "Summary Stats",
            items: [
                { key: "summary_total_staff", label: "Total Pegawai" },
                { key: "summary_present", label: "Hadir" },
                { key: "summary_late", label: "Terlambat" },
                { key: "summary_permission", label: "Izin / Sakit" },
            ],
        },
        {
            label: "Small widgets",
            items: [
                { key: "earned_week", label: "Earned this week" },
                { key: "earned_today", label: "Earned today" },
                { key: "worked_week", label: "Worked this week" },
                { key: "worked_today", label: "Worked today" },
                { key: "projects_worked", label: "Projects worked" },
                { key: "activity_today", label: "Today's activity" },
                { key: "activity_week", label: "Weekly activity" },
            ],
        },
        {
            label: "Large widgets",
            items: [
                { key: "todays_activity_table", label: "Aktivitas Hari Ini" },
                { key: "staff_status_chart", label: "Data Status Staff" },
                { key: "permission_requests", label: "Daftar Pengajuan" },
                { key: "late_missed_shifts", label: "Late & Missed Shifts" },
                { key: "manual_time", label: "Manual Time" },
                { key: "payments", label: "Payments" },
                { key: "time_off_balances", label: "Time off balances" },
                { key: "time_off_requested", label: "Time off requested" },
                { key: "timesheet", label: "Timesheet" },
                { key: "todos", label: "To-dos" },
                { key: "current_project_activity", label: "Current project activity" },
            ],
        },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-background">
                    <Settings2 className="h-4 w-4" />
                    Manage widgets
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 max-h-[80vh] overflow-y-auto" align="end">
                {widgetGroups.map((group, index) => (
                    <div key={group.label}>
                        {index > 0 && <DropdownMenuSeparator />}
                        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                            {group.label}
                        </DropdownMenuLabel>
                        <DropdownMenuGroup>
                            {group.items.map((item) => (
                                <DropdownMenuCheckboxItem
                                    key={item.key}
                                    checked={visibleWidgets[item.key] ?? true}
                                    onCheckedChange={() => toggleWidget(item.key)}
                                    onSelect={(e) => e.preventDefault()}
                                >
                                    {item.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuGroup>
                    </div>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
