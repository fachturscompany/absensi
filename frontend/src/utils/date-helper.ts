/**
 * Get locale-aware day name using Intl API
 * @param dayIndex - 0-6 where 0=Sunday, following JavaScript Date convention
 * @param locale - Optional BCP 47 language tag (e.g., 'en-US', 'id-ID'), defaults to browser locale
 * @param format - 'long' for full name, 'short' for abbreviated
 */
export const getDayName = (
    dayIndex: number,
    locale?: string,
    format: "long" | "short" = "long"
): string => {
    // Create a date that falls on the correct day of week
    // January 4, 2026 is a Sunday (dayIndex 0)
    const baseDate = new Date(2026, 0, 4 + dayIndex)
    return new Intl.DateTimeFormat(locale, { weekday: format }).format(baseDate)
}

/**
 * Get all day names for a locale
 */
export const getAllDayNames = (
    locale?: string,
    format: "long" | "short" = "long"
): string[] => {
    return [0, 1, 2, 3, 4, 5, 6].map((day) => getDayName(day, locale, format))
}

/**
 * Day of week constants following JavaScript Date convention
 * 0 = Sunday, 1 = Monday, ..., 6 = Saturday
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

/**
 * Format a Date object as YYYY-MM-DD using local time components
 * to avoid timezone shifts caused by .toISOString()
 */
export const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}
