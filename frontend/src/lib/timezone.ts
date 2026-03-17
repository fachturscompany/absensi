/**
 * Timezone utility functions for proper timestamp handling
 * Ensures consistent timezone handling across the application
 */

/**
 * Convert a Date object to ISO string format that preserves local timezone
 * Supabase will store this as timestamptz which includes timezone information
 * 
 * @param date - The date to convert
 * @returns ISO string with timezone preserved
 */
export function toTimestampWithTimezone(date: Date): string {
  // Return UTC ISO string directly. Postgres timestamptz stores an absolute
  // moment in time; the display conversion should be handled at read time.
  // Avoid manually shifting by timezone offset which caused +7h drift.
  return date.toISOString()
}

/**
 * Get current timestamp in proper format for database insertion
 * @returns Current timestamp as ISO string
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Parse timestamp from database and return as Date object
 * Simply returns the date without adjustment - timezone issues are handled at data filtering level
 * 
 * @param timestamp - ISO string from database
 * @returns Date object
 */
export function parseTimestamp(timestamp: string): Date {
  return new Date(timestamp)
}
