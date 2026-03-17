/**
 * Utility Functions for Leave Management
 */

import { differenceInDays, addDays, isWeekend, format, parseISO } from 'date-fns';
import { ILeaveType } from './types';

// ============================================
// DATE CALCULATIONS
// ============================================

/**
 * Calculate working days between two dates
 * Excludes weekends (Saturday, Sunday)
 * TODO: Exclude public holidays from organization_holidays table
 */
export function calculateWorkingDays(
  startDate: Date | string,
  endDate: Date | string,
  excludeWeekends: boolean = true
): number {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  if (start > end) return 0;
  
  let workingDays = 0;
  let currentDate = start;
  
  while (currentDate <= end) {
    if (!excludeWeekends || !isWeekend(currentDate)) {
      workingDays++;
    }
    currentDate = addDays(currentDate, 1);
  }
  
  return workingDays;
}

/**
 * Calculate total leave days including half-day adjustments
 */
export function calculateTotalLeaveDays(
  startDate: Date | string,
  endDate: Date | string,
  startHalfDay: boolean = false,
  endHalfDay: boolean = false
): number {
  const workingDays = calculateWorkingDays(startDate, endDate);
  
  let totalDays = workingDays;
  
  // Adjust for half days
  if (startHalfDay) totalDays -= 0.5;
  if (endHalfDay) totalDays -= 0.5;
  
  return Math.max(0, totalDays);
}

/**
 * Check if dates overlap with existing leave
 */
export function datesOverlap(
  start1: Date | string,
  end1: Date | string,
  start2: Date | string,
  end2: Date | string
): boolean {
  const s1 = typeof start1 === 'string' ? parseISO(start1) : start1;
  const e1 = typeof end1 === 'string' ? parseISO(end1) : end1;
  const s2 = typeof start2 === 'string' ? parseISO(start2) : start2;
  const e2 = typeof end2 === 'string' ? parseISO(end2) : end2;
  
  return s1 <= e2 && s2 <= e1;
}

/**
 * Get days until leave start (for notice validation)
 */
export function getDaysUntilLeave(startDate: Date | string): number {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  
  return differenceInDays(start, today);
}

// ============================================
// REQUEST NUMBER GENERATION
// ============================================

/**
 * Generate unique leave request number
 * Format: LV-{YEAR}{MONTH}-{ORG_ID}-{SEQUENCE}
 * Example: LV-202501-001-0042
 */
export function generateRequestNumber(
  organizationId: number,
  sequence: number
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const orgId = String(organizationId).padStart(3, '0');
  const seq = String(sequence).padStart(4, '0');
  
  return `LV-${year}${month}-${orgId}-${seq}`;
}

// ============================================
// BALANCE CALCULATIONS
// ============================================

/**
 * Calculate entitled days based on accrual method
 */
export function calculateEntitledDays(
  leaveType: ILeaveType,
  hireDate: Date | string,
  year: number,
  accrualMethod: 'monthly' | 'annual' | 'academic_year' = 'monthly'
): number {
  const hire = typeof hireDate === 'string' ? parseISO(hireDate) : hireDate;
  const currentDate = new Date();
  
  // If unlimited (days_per_year = 0), return 0
  if (leaveType.days_per_year === 0) {
    return 0;
  }
  
  if (accrualMethod === 'annual') {
    // Full allocation on Jan 1
    // If joined mid-year, proportional allocation
    const hireYear = hire.getFullYear();
    if (hireYear === year) {
      const monthsWorked = 12 - hire.getMonth();
      return Math.floor((leaveType.days_per_year / 12) * monthsWorked);
    }
    return leaveType.days_per_year;
  }
  
  if (accrualMethod === 'monthly') {
    // Accrue 1/12 each month
    const hireYear = hire.getFullYear();
    const currentYear = currentDate.getFullYear();
    
    if (year < hireYear) return 0;
    if (year > currentYear) return leaveType.days_per_year;
    
    let monthsWorked = 12;
    
    if (year === hireYear) {
      monthsWorked = 12 - hire.getMonth();
    }
    
    if (year === currentYear) {
      const monthsSinceYearStart = currentDate.getMonth() + 1;
      if (year === hireYear) {
        monthsWorked = Math.min(monthsWorked, monthsSinceYearStart - hire.getMonth());
      } else {
        monthsWorked = monthsSinceYearStart;
      }
    }
    
    return Math.floor((leaveType.days_per_year / 12) * monthsWorked);
  }
  
  if (accrualMethod === 'academic_year') {
    // Academic year: August to July
    // Similar to monthly but based on academic calendar
    // For now, use same logic as monthly
    // TODO: Implement proper academic year calculation
    return calculateEntitledDays(leaveType, hireDate, year, 'monthly');
  }
  
  return leaveType.days_per_year;
}

/**
 * Calculate remaining balance
 */
export function calculateRemainingBalance(
  entitled: number,
  carriedForward: number,
  used: number,
  pending: number
): number {
  return Math.max(0, entitled + carriedForward - used - pending);
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate if leave request meets minimum notice requirement
 */
export function meetsNoticeRequirement(
  startDate: Date | string,
  minimumDaysNotice: number
): { valid: boolean; daysUntil: number } {
  const daysUntil = getDaysUntilLeave(startDate);
  
  return {
    valid: daysUntil >= minimumDaysNotice,
    daysUntil
  };
}

/**
 * Check if user has sufficient balance
 */
export function hasSufficientBalance(
  requestedDays: number,
  remainingDays: number
): boolean {
  return remainingDays >= requestedDays;
}

/**
 * Validate max consecutive days
 */
export function meetsMaxConsecutiveDays(
  requestedDays: number,
  maxDays?: number
): boolean {
  if (!maxDays) return true;
  return requestedDays <= maxDays;
}

// ============================================
// FORMATTING HELPERS
// ============================================

/**
 * Format leave date range
 */
export function formatLeaveDateRange(
  startDate: string,
  endDate: string,
  startHalfDay: boolean = false,
  endHalfDay: boolean = false
): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  const startStr = format(start, 'MMM d, yyyy');
  const endStr = format(end, 'MMM d, yyyy');
  
  if (startDate === endDate) {
    return startHalfDay || endHalfDay ? `${startStr} (Half day)` : startStr;
  }
  
  let result = `${startStr} - ${endStr}`;
  if (startHalfDay || endHalfDay) {
    const parts: string[] = [];
    if (startHalfDay) parts.push('start half-day');
    if (endHalfDay) parts.push('end half-day');
    result += ` (${parts.join(', ')})`;
  }
  
  return result;
}

/**
 * Get leave status badge color
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    approved: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-300'
  };
  
  return (colors[status] || colors.pending) as string;
}

/**
 * Get leave type color for UI
 */
export function getLeaveTypeColor(colorCode?: string): string {
  return colorCode || '#10B981'; // Default green
}
