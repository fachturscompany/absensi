import { formatInTimeZone } from "date-fns-tz";

export function formatLocalTime(
  utcString: string | null | undefined,
  timezone: string,
  timeFormat: '12h' | '24h' = '24h',
  includeDate: boolean = false
) {
  // Return early for null, undefined, empty string, or "-"
  if (!utcString || utcString === "-" || typeof utcString !== 'string' || utcString.trim() === "") {
    return "-";
  }

  // 1. Force UTC parsing to prevent JS Date shifting to system local time
  let normalized = utcString.trim().replace(' ', 'T');
  
  // Fix supabase specific '+00' which JS Date() sometimes fails to parse natively as UTC
  if (normalized.endsWith('+00')) {
     normalized = normalized.slice(0, -3) + '+00:00'; 
  }

  // Check if it's already a date-only string like "yyyy-mm-dd"
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(normalized);
  if (isDateOnly) {
    normalized = `${normalized}T00:00:00.000Z`;
  } 
  // If it doesn't clearly declare a timezone, append Z to make it strict UTC
  else if (!normalized.includes('Z') && !/[+-]\d{2}:?\d{2}$/.test(normalized)) {
    normalized += 'Z';
  }

  // Create date and validate BEFORE any operations
  const date = new Date(normalized);
  
  // Check if date is valid - return immediately if not
  if (!date || isNaN(date.getTime()) || date.getTime() === 0) {
    return "-";
  }

  try {
    let formatStr: string;
    
    if (includeDate) {
      formatStr = timeFormat === '12h' ? 'dd MMM yyyy, hh:mm a' : 'dd MMM yyyy, HH:mm';
    } else {
      formatStr = timeFormat === '12h' ? 'hh:mm a' : 'HH:mm';
    }
    
    const formatted = formatInTimeZone(date, timezone, formatStr);
    return formatted;
  } catch {
    // Silently return "-" for any formatting errors
    return "-";
  }
}
