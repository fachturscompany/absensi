import { Check, X, Clock, Info } from "lucide-react"

// Static data - tidak perlu fetch dari DB
export const ATTENDANCE_STATUSES = [
  { value: "present", label: "Present", color: "bg-green-500 text-white", icon: Check },
  { value: "absent", label: "Absent", color: "bg-gray-300 text-black", icon: X },
  { value: "late", label: "Late", color: "bg-red-500 text-white", icon: Clock },
  { value: "excused", label: "Excused", color: "bg-blue-500 text-white", icon: Info },
] as const

export const TIME_FORMATS = [
  { value: "12h", label: "12 Hour (AM/PM)" },
  { value: "24h", label: "24 Hour" },
] as const

export const SCHEDULE_TYPES = [
  { value: "fixed", label: "Fixed Schedule" },
  { value: "shift", label: "Shift Schedule" },
  { value: "flexible", label: "Flexible Schedule" },
] as const

/**
 * Day of week constants following JavaScript Date convention
 * 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 * @deprecated Use DAY_OF_WEEK from '@/utils/date-helper' instead
 */
export const DAY_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const

// getDayName and getAllDayNames have been moved to '@/utils/date-helper'
// to avoid circular dependency and import issues

// Legacy constant for backward compatibility - prefer getDayName() for i18n
export const WEEKDAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
] as const

/**
 * Comprehensive IANA timezone list for international enterprise use
 * Grouped by region for easier selection in UI
 */
export const TIMEZONES = [
  // Asia - Southeast
  { value: "Asia/Jakarta", label: "Jakarta (WIB, UTC+7)", region: "Asia" },
  { value: "Asia/Makassar", label: "Makassar (WITA, UTC+8)", region: "Asia" },
  { value: "Asia/Jayapura", label: "Jayapura (WIT, UTC+9)", region: "Asia" },
  { value: "Asia/Singapore", label: "Singapore (SGT, UTC+8)", region: "Asia" },
  { value: "Asia/Bangkok", label: "Bangkok (ICT, UTC+7)", region: "Asia" },
  { value: "Asia/Ho_Chi_Minh", label: "Ho Chi Minh (ICT, UTC+7)", region: "Asia" },
  { value: "Asia/Manila", label: "Manila (PHT, UTC+8)", region: "Asia" },
  { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur (MYT, UTC+8)", region: "Asia" },
  // Asia - East
  { value: "Asia/Tokyo", label: "Tokyo (JST, UTC+9)", region: "Asia" },
  { value: "Asia/Seoul", label: "Seoul (KST, UTC+9)", region: "Asia" },
  { value: "Asia/Shanghai", label: "Shanghai (CST, UTC+8)", region: "Asia" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT, UTC+8)", region: "Asia" },
  { value: "Asia/Taipei", label: "Taipei (CST, UTC+8)", region: "Asia" },
  // Asia - South
  { value: "Asia/Kolkata", label: "India (IST, UTC+5:30)", region: "Asia" },
  { value: "Asia/Dhaka", label: "Dhaka (BST, UTC+6)", region: "Asia" },
  { value: "Asia/Karachi", label: "Karachi (PKT, UTC+5)", region: "Asia" },
  // Asia - Middle East
  { value: "Asia/Dubai", label: "Dubai (GST, UTC+4)", region: "Asia" },
  { value: "Asia/Riyadh", label: "Riyadh (AST, UTC+3)", region: "Asia" },
  { value: "Asia/Jerusalem", label: "Jerusalem (IST, UTC+2/3)", region: "Asia" },
  // Europe
  { value: "Europe/London", label: "London (GMT/BST, UTC+0/1)", region: "Europe" },
  { value: "Europe/Paris", label: "Paris (CET, UTC+1/2)", region: "Europe" },
  { value: "Europe/Berlin", label: "Berlin (CET, UTC+1/2)", region: "Europe" },
  { value: "Europe/Amsterdam", label: "Amsterdam (CET, UTC+1/2)", region: "Europe" },
  { value: "Europe/Madrid", label: "Madrid (CET, UTC+1/2)", region: "Europe" },
  { value: "Europe/Rome", label: "Rome (CET, UTC+1/2)", region: "Europe" },
  { value: "Europe/Zurich", label: "Zurich (CET, UTC+1/2)", region: "Europe" },
  { value: "Europe/Stockholm", label: "Stockholm (CET, UTC+1/2)", region: "Europe" },
  { value: "Europe/Moscow", label: "Moscow (MSK, UTC+3)", region: "Europe" },
  { value: "Europe/Istanbul", label: "Istanbul (TRT, UTC+3)", region: "Europe" },
  // Americas
  { value: "America/New_York", label: "New York (EST/EDT, UTC-5/-4)", region: "Americas" },
  { value: "America/Chicago", label: "Chicago (CST/CDT, UTC-6/-5)", region: "Americas" },
  { value: "America/Denver", label: "Denver (MST/MDT, UTC-7/-6)", region: "Americas" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT, UTC-8/-7)", region: "Americas" },
  { value: "America/Toronto", label: "Toronto (EST/EDT, UTC-5/-4)", region: "Americas" },
  { value: "America/Vancouver", label: "Vancouver (PST/PDT, UTC-8/-7)", region: "Americas" },
  { value: "America/Mexico_City", label: "Mexico City (CST, UTC-6)", region: "Americas" },
  { value: "America/Sao_Paulo", label: "São Paulo (BRT, UTC-3)", region: "Americas" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (ART, UTC-3)", region: "Americas" },
  { value: "America/Lima", label: "Lima (PET, UTC-5)", region: "Americas" },
  { value: "America/Bogota", label: "Bogotá (COT, UTC-5)", region: "Americas" },
  // Oceania
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT, UTC+10/11)", region: "Oceania" },
  { value: "Australia/Melbourne", label: "Melbourne (AEST/AEDT, UTC+10/11)", region: "Oceania" },
  { value: "Australia/Brisbane", label: "Brisbane (AEST, UTC+10)", region: "Oceania" },
  { value: "Australia/Perth", label: "Perth (AWST, UTC+8)", region: "Oceania" },
  { value: "Pacific/Auckland", label: "Auckland (NZST/NZDT, UTC+12/13)", region: "Oceania" },
  // Africa
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST, UTC+2)", region: "Africa" },
  { value: "Africa/Lagos", label: "Lagos (WAT, UTC+1)", region: "Africa" },
  { value: "Africa/Cairo", label: "Cairo (EET, UTC+2)", region: "Africa" },
  { value: "Africa/Nairobi", label: "Nairobi (EAT, UTC+3)", region: "Africa" },
  // UTC
  { value: "UTC", label: "UTC (Coordinated Universal Time)", region: "UTC" },
] as const

/**
 * Get timezone display label from IANA timezone ID
 */
export const getTimezoneLabel = (tz: string): string => {
  const found = TIMEZONES.find((t) => t.value === tz)
  return found?.label || tz
}

/**
 * Get current UTC offset for a timezone in format "+07:00" or "-05:00"
 */
export const getTimezoneOffset = (tz: string): string => {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    })
    const parts = formatter.formatToParts(now)
    const offsetPart = parts.find((p) => p.type === "timeZoneName")
    return offsetPart?.value?.replace("GMT", "UTC") || "UTC"
  } catch {
    return "UTC"
  }
}

/**
 * Weekly work hour compliance thresholds by region
 * Used to display warnings when schedules exceed legal limits
 */
export const WORK_HOUR_LIMITS = {
  // European Union Working Time Directive
  EU: { standard: 40, maximum: 48, label: "EU Working Time Directive" },
  // Indonesia: PP 35/2021
  ID: { standard: 40, maximum: 54, label: "Indonesia (PP 35/2021)" },
  // United States (federal, no limit but overtime after 40h)
  US: { standard: 40, maximum: null, label: "US Federal" },
  // Singapore
  SG: { standard: 44, maximum: 44, label: "Singapore Employment Act" },
  // Japan (karoshi prevention)
  JP: { standard: 40, maximum: 45, label: "Japan Labor Standards" },
  // Default/International
  DEFAULT: { standard: 40, maximum: 48, label: "International Standard" },
} as const

export type WorkHourLimitRegion = keyof typeof WORK_HOUR_LIMITS

