'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  X, 
  Users, 
  Building2, 
  Clock,
  ChevronDown,
  Check,
  RotateCcw,
} from 'lucide-react';
import { 
  format, 
  subDays, 
  subYears,
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface FilterState {
  dateRange: {
    from: Date;
    to: Date;
    preset?: string;
  };
  departments: string[];
  members: string[];
  statuses: string[];
}

interface Department {
  id: number;
  name: string;
}

interface Member {
  id: number;
  name: string;
  department: string;
}

interface AnalyticsFilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  departments: Department[];
  members: Member[];
  className?: string;
}

// Grouped filters for better UX
const DATE_PRESETS = [
  // Quick Access
  { label: 'Today', value: 'today', days: 0, group: 'quick' },
  { label: 'Yesterday', value: 'yesterday', special: 'yesterday', group: 'quick' },
  
  // Current Periods
  { label: 'This week', value: 'thisWeek', special: 'thisWeek', group: 'period' },
  { label: 'This month', value: 'thisMonth', special: 'thisMonth', group: 'period' },
  { label: 'This year', value: 'thisYear', special: 'thisYear', group: 'period' },
  { label: 'Last year', value: 'lastYear', special: 'lastYear', group: 'period' },
  
  // Historical
  { label: 'Last 7 days', value: 'last7', days: 7, group: 'historical' },
  { label: 'Last 30 days', value: 'last30', days: 30, group: 'historical' },
  { label: 'Custom range', value: 'custom', custom: true, group: 'historical' },
];

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', color: 'bg-green-500' },
  { value: 'late', label: 'Late', color: 'bg-amber-500' },
  { value: 'absent', label: 'Absent', color: 'bg-red-500' },
  { value: 'leave', label: 'Leave', color: 'bg-blue-500' },
];

export function AnalyticsFilterBar({
  filters,
  onFiltersChange,
  departments,
  members,
  className,
}: AnalyticsFilterBarProps) {
  const [dateOpen, setDateOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({
    from: filters.dateRange.from,
    to: filters.dateRange.to,
  });

  const getDateRangeFromPreset = (preset: string) => {
    const today = new Date();
    const yesterday = subDays(today, 1);
    
    switch (preset) {
      case 'today':
        return { from: today, to: today };
      case 'yesterday':
        return { from: yesterday, to: yesterday };
      case 'thisWeek':
        return { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) };
      case 'thisMonth':
        return { from: startOfMonth(today), to: endOfMonth(today) };
      case 'thisYear':
        return { from: startOfYear(today), to: endOfYear(today) };
      case 'lastYear': {
        const lastYear = subYears(today, 1);
        return { from: startOfYear(lastYear), to: endOfYear(lastYear) };
      }
      case 'last7':
        return { from: subDays(today, 7), to: today };
      case 'last30':
        return { from: subDays(today, 30), to: today };
      default:
        return { from: subDays(today, 30), to: today };
    }
  };

  const handleDatePresetSelect = (preset: string) => {
    if (preset === 'custom') {
      return;
    }
    const range = getDateRangeFromPreset(preset);
    onFiltersChange({
      ...filters,
      dateRange: { ...range, preset },
    });
    setDateOpen(false);
  };

  const handleCustomDateApply = () => {
    if (customDateRange.from && customDateRange.to) {
      onFiltersChange({
        ...filters,
        dateRange: {
          from: customDateRange.from,
          to: customDateRange.to,
          preset: 'custom',
        },
      });
      setDateOpen(false);
    }
  };

  const handleDepartmentToggle = (deptName: string) => {
    const newDepts = filters.departments.includes(deptName)
      ? filters.departments.filter(d => d !== deptName)
      : [...filters.departments, deptName];
    onFiltersChange({ ...filters, departments: newDepts });
  };

  const handleMemberToggle = (memberName: string) => {
    const newMembers = filters.members.includes(memberName)
      ? filters.members.filter(m => m !== memberName)
      : [...filters.members, memberName];
    onFiltersChange({ ...filters, members: newMembers });
  };

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const handleClearAll = () => {
    const today = new Date();
    onFiltersChange({
      dateRange: { from: subDays(today, 30), to: today, preset: 'last30' },
      departments: [],
      members: [],
      statuses: [],
    });
  };

  const activeFilterCount = 
    filters.departments.length + 
    filters.members.length + 
    filters.statuses.length +
    (filters.dateRange.preset !== 'last30' ? 1 : 0);

  const getDateLabel = () => {
    if (filters.dateRange.preset && filters.dateRange.preset !== 'custom') {
      return DATE_PRESETS.find(p => p.value === filters.dateRange.preset)?.label || 'Select date';
    }
    return `${format(filters.dateRange.from, 'MMM dd')} - ${format(filters.dateRange.to, 'MMM dd, yyyy')}`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-3"
      >
        {/* Date Range Filter */}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 min-w-[200px] justify-start"
            >
              <Calendar className="h-4 w-4" />
              <span className="flex-1 text-left">{getDateLabel()}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex">
              {/* Presets */}
              <div className="border-r p-2 space-y-1 min-w-[180px]">
                {/* Quick Access */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  📅 Quick
                </div>
                {DATE_PRESETS.filter(p => p.group === 'quick').map((preset) => (
                  <Button
                    key={preset.value}
                    variant={filters.dateRange.preset === preset.value ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleDatePresetSelect(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
                
                <div className="h-px bg-border my-1" />
                
                {/* Current Periods */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  📊 Period
                </div>
                {DATE_PRESETS.filter(p => p.group === 'period').map((preset) => (
                  <Button
                    key={preset.value}
                    variant={filters.dateRange.preset === preset.value ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleDatePresetSelect(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
                
                <div className="h-px bg-border my-1" />
                
                {/* Historical */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  🔙 Historical
                </div>
                {DATE_PRESETS.filter(p => p.group === 'historical').map((preset) => (
                  <Button
                    key={preset.value}
                    variant={filters.dateRange.preset === preset.value ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleDatePresetSelect(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              {/* Custom Calendar */}
              {filters.dateRange.preset === 'custom' && (
                <div className="p-3">
                  <CalendarComponent
                    mode="range"
                    selected={{ from: customDateRange.from, to: customDateRange.to }}
                    onSelect={(range) => setCustomDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                  <div className="flex gap-2 mt-3">
                    <Button onClick={handleCustomDateApply} size="sm" className="flex-1">
                      Apply
                    </Button>
                    <Button onClick={() => setDateOpen(false)} variant="outline" size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Department Filter */}
        <Popover open={deptOpen} onOpenChange={setDeptOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Building2 className="h-4 w-4" />
              Department
              {filters.departments.length > 0 && (
                <Badge variant="secondary" className="ml-1 rounded-full h-5 w-5 p-0 flex items-center justify-center">
                  {filters.departments.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search department..." />
              <CommandList>
                <CommandEmpty>No department found.</CommandEmpty>
                <CommandGroup>
                  {departments.map((dept) => (
                    <CommandItem
                      key={dept.id}
                      onSelect={() => handleDepartmentToggle(dept.name)}
                      className="cursor-pointer"
                    >
                      <div className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        filters.departments.includes(dept.name)
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50"
                      )}>
                        {filters.departments.includes(dept.name) && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      <span>{dept.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Member Filter */}
        <Popover open={memberOpen} onOpenChange={setMemberOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Members
              {filters.members.length > 0 && (
                <Badge variant="secondary" className="ml-1 rounded-full h-5 w-5 p-0 flex items-center justify-center">
                  {filters.members.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search member..." />
              <CommandList>
                <CommandEmpty>No member found.</CommandEmpty>
                <CommandGroup>
                  {members.map((member) => (
                    <CommandItem
                      key={member.id}
                      onSelect={() => handleMemberToggle(member.name)}
                      className="cursor-pointer"
                    >
                      <div className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        filters.members.includes(member.name)
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50"
                      )}>
                        {filters.members.includes(member.name) && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{member.name}</span>
                        <span className="text-xs text-muted-foreground">{member.department}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Status Filter */}
        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Clock className="h-4 w-4" />
              Status
              {filters.statuses.length > 0 && (
                <Badge variant="secondary" className="ml-1 rounded-full h-5 w-5 p-0 flex items-center justify-center">
                  {filters.statuses.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandList>
                <CommandGroup>
                  {STATUS_OPTIONS.map((status) => (
                    <CommandItem
                      key={status.value}
                      onSelect={() => handleStatusToggle(status.value)}
                      className="cursor-pointer"
                    >
                      <div className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        filters.statuses.includes(status.value)
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50"
                      )}>
                        {filters.statuses.includes(status.value) && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      <div className={cn("h-2 w-2 rounded-full mr-2", status.color)} />
                      <span>{status.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-8" />

        {/* Clear All Button */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Clear all ({activeFilterCount})
          </Button>
        )}
      </motion.div>

      {/* Active Filters Display */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="text-sm text-muted-foreground">Active filters:</span>
            
            {filters.departments.map((dept) => (
              <Badge key={dept} variant="secondary" className="gap-1">
                <Building2 className="h-3 w-3" />
                {dept}
                <button
                  onClick={() => handleDepartmentToggle(dept)}
                  className="ml-1 hover:bg-muted rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            {filters.members.map((member) => (
              <Badge key={member} variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {member}
                <button
                  onClick={() => handleMemberToggle(member)}
                  className="ml-1 hover:bg-muted rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            {filters.statuses.map((status) => {
              const statusOption = STATUS_OPTIONS.find(s => s.value === status);
              return (
                <Badge key={status} variant="secondary" className="gap-1">
                  {statusOption && <div className={cn("h-2 w-2 rounded-full", statusOption.color)} />}
                  {statusOption?.label}
                  <button
                    onClick={() => handleStatusToggle(status)}
                    className="ml-1 hover:bg-muted rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
