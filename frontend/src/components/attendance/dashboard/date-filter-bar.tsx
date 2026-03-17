'use client';

import { motion } from 'framer-motion';
import { Calendar, ChevronDown, Timer, BarChart3, History } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth,
  startOfWeek, 
  endOfWeek,
  startOfYear,
  endOfYear,
  subDays,
  subYears,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface DateFilterState {
  from: Date;
  to: Date;
  preset?: string;
}

interface DateFilterBarProps {
  dateRange: DateFilterState;
  onDateRangeChange: (dateRange: DateFilterState) => void;
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
];

export function DateFilterBar({ dateRange, onDateRangeChange, className }: DateFilterBarProps) {
  const handlePresetClick = (preset: typeof DATE_PRESETS[0]) => {
    const now = new Date();
    let from: Date;
    let to: Date;

    switch (preset.special) {
      case 'yesterday':
        // Yesterday: start to end of yesterday
        from = subDays(now, 1);
        from.setHours(0, 0, 0, 0);
        to = subDays(now, 1);
        to.setHours(23, 59, 59, 999);
        console.log('📅 Yesterday selected:', { from, to });
        break;

      case 'thisWeek':
        // This week: Monday to today (or Sunday)
        from = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        to = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
        console.log('📅 This week selected:', { from, to });
        break;

      case 'thisMonth':
        // This month: 1st to last day of current month
        from = startOfMonth(now);
        to = endOfMonth(now);
        console.log('📅 This month selected:', { from, to });
        break;

      case 'thisYear':
        // This year: Jan 1 to today (or Dec 31)
        from = startOfYear(now);
        to = endOfYear(now);
        console.log('📅 This year selected:', { from, to });
        break;

      case 'lastYear':
        // Last year: Jan 1 to Dec 31 of previous year
        const lastYear = subYears(now, 1);
        from = startOfYear(lastYear);
        to = endOfYear(lastYear);
        console.log('📅 Last year selected:', { from, to });
        break;

      default:
        // Today or custom days range
        if (preset.value === 'today') {
          from = new Date(now);
          from.setHours(0, 0, 0, 0);
          to = new Date(now);
          to.setHours(23, 59, 59, 999);
          console.log('📅 Today selected:', { from, to });
        } else if (preset.days !== undefined) {
          // Last X days
          from = subDays(now, preset.days);
          from.setHours(0, 0, 0, 0);
          to = new Date(now);
          to.setHours(23, 59, 59, 999);
          console.log(`📅 Last ${preset.days} days selected:`, { from, to });
        } else {
          // Fallback
          from = new Date(now);
          from.setHours(0, 0, 0, 0);
          to = new Date(now);
          to.setHours(23, 59, 59, 999);
        }
    }

    const newRange = { from, to, preset: preset.value };
    console.log('🔄 Date range changing to:', newRange);
    onDateRangeChange(newRange);
  };

  const getDateRangeLabel = () => {
    if (dateRange.from && dateRange.to) {
      const isSameDay = format(dateRange.from, 'yyyy-MM-dd') === format(dateRange.to, 'yyyy-MM-dd');
      if (isSameDay) {
        return format(dateRange.from, 'MMM dd, yyyy');
      }
      return `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`;
    }
    return 'Select date range';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-center gap-3', className)}
      suppressHydrationWarning
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start text-left font-normal min-w-[240px]',
              'hover:bg-accent hover:text-accent-foreground',
              'transition-all duration-200'
            )}
          >
            <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="flex-1 truncate">{getDateRangeLabel()}</span>
            <ChevronDown className="ml-2 h-4 w-4 opacity-50 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[240px]">
          {/* Quick Access */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Timer className="h-3.5 w-3.5" />
              <span>Quick</span>
            </span>
          </DropdownMenuLabel>
          {DATE_PRESETS.filter(p => p.group === 'quick').map((preset) => (
            <DropdownMenuItem
              key={preset.value}
              onClick={() => handlePresetClick(preset)}
              className={cn(
                'cursor-pointer',
                dateRange.preset === preset.value && 'bg-accent'
              )}
            >
              <span className="flex-1">{preset.label}</span>
              {dateRange.preset === preset.value && (
                <span className="text-xs text-muted-foreground">✓</span>
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          {/* Current Periods */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Period</span>
            </span>
          </DropdownMenuLabel>
          {DATE_PRESETS.filter(p => p.group === 'period').map((preset) => (
            <DropdownMenuItem
              key={preset.value}
              onClick={() => handlePresetClick(preset)}
              className={cn(
                'cursor-pointer',
                dateRange.preset === preset.value && 'bg-accent'
              )}
            >
              <span className="flex-1">{preset.label}</span>
              {dateRange.preset === preset.value && (
                <span className="text-xs text-muted-foreground">✓</span>
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          {/* Historical */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <History className="h-3.5 w-3.5" />
              <span>Historical</span>
            </span>
          </DropdownMenuLabel>
          {DATE_PRESETS.filter(p => p.group === 'historical').map((preset) => (
            <DropdownMenuItem
              key={preset.value}
              onClick={() => handlePresetClick(preset)}
              className={cn(
                'cursor-pointer',
                dateRange.preset === preset.value && 'bg-accent'
              )}
            >
              <span className="flex-1">{preset.label}</span>
              {dateRange.preset === preset.value && (
                <span className="text-xs text-muted-foreground">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
