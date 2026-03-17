"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarCustomProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  mode?: "single";
  initialFocus?: boolean;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CalendarCustom({
  selected,
  onSelect,
  disabled,
  className,
}: CalendarCustomProps) {

  const [viewDate, setViewDate] = React.useState(() => {
    const date = selected || new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Get previous month's last days
  const prevMonth = new Date(year, month - 1, 0);
  const daysInPrevMonth = prevMonth.getDate();

  // Generate calendar days
  const calendarDays = [];

  // Previous month's days
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date = new Date(year, month - 1, day);
    calendarDays.push({
      date,
      day,
      isCurrentMonth: false,
      isPrevMonth: true,
      isNextMonth: false,
    });
  }

  // Current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    calendarDays.push({
      date,
      day,
      isCurrentMonth: true,
      isPrevMonth: false,
      isNextMonth: false,
    });
  }

  // Next month's days to fill the grid
  const remainingDays = 42 - calendarDays.length; // 6 rows × 7 days
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    calendarDays.push({
      date,
      day,
      isCurrentMonth: false,
      isPrevMonth: false,
      isNextMonth: true,
    });
  }

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    if (disabled && disabled(date)) return;
    onSelect?.(date);
  };

  const isSelected = (date: Date) => {
    if (!selected) return false;
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isDisabled = (date: Date) => {
    return disabled ? disabled(date) : false;
  };

  return (
    <div className={cn("p-4 bg-background border rounded-lg shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevMonth}
          className="h-8 w-8 hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold">
            {MONTHS[month]} {year}
          </h2>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleNextMonth}
          className="h-8 w-8 hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div
            key={day}
            className="h-10 flex items-center justify-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((calendarDay, index) => {
          const { date, day, isCurrentMonth } = calendarDay;
          const selected = isSelected(date);
          const today = isToday(date);
          const disabled = isDisabled(date);

          return (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => handleDateClick(date)}
              disabled={disabled}
              className={cn(
                "h-10 w-full p-0 font-normal hover:bg-accent hover:text-accent-foreground",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                !isCurrentMonth && "text-muted-foreground opacity-50",
                selected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                today && !selected && "bg-accent text-accent-foreground font-medium",
                disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
              )}
            >
              {day}
            </Button>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="mt-4 pt-3 border-t text-xs text-muted-foreground text-center">
        {selected ? (
          <span>Selected: {selected.toLocaleDateString()}</span>
        ) : (
          <span>Select a date</span>
        )}
      </div>
    </div>
  );
}
