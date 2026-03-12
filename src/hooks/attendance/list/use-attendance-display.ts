'use client'

import { useMemo } from 'react'
import { formatLocalTime } from '@/utils/timezone'
import type { AttendanceListItem } from '@/action/attendance'

export interface TimeDisplay {
  date: string
  time: string
  method: string
}

interface DisplayData {
  checkIn: TimeDisplay
  checkOut: TimeDisplay
  breakIn: TimeDisplay
  breakOut: TimeDisplay
}

export function useAttendanceDisplay(
  items: AttendanceListItem[], 
  timezone: string
): DisplayData[] {
  return useMemo(() => {
    return items.map(item => ({
      checkIn: formatTimeDisplay(item.checkIn, item.checkInMethod || '', timezone),
      checkOut: formatTimeDisplay(item.checkOut, item.checkOutMethod || '', timezone),
      breakIn: formatTimeDisplay(item.actualBreakStart, item.breakInMethod || '', timezone),
      breakOut: formatTimeDisplay(item.actualBreakEnd, item.breakOutMethod || '', timezone),
    }))
  }, [items, timezone])
}

function formatTimeDisplay(
  timestamp: string | null | undefined,
  method: string,
  timezone: string
): TimeDisplay {
  if (!timestamp) {
    return { date: '-', time: '-', method }
  }

  try {
    const formatted = formatLocalTime(timestamp, timezone, '24h', true)
    const [datePart, timePart] = formatted.split(', ')
    return {
      date: datePart || '-',
      time: timePart || '-',
      method
    }
  } catch {
    return { date: '-', time: '-', method }
  }
}
