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

  // Normalize input: if no timezone info, interpret as UTC
  // Examples treated as UTC: "2026-01-07 17:20:00", "2026-01-07T17:20:00", "2026-01-07"
  let normalized = utcString.trim();
  const hasTZ = /[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized);
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(normalized);
  const isNaiveDateTime = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?$/.test(normalized);

  if (isDateOnly) {
    normalized = `${normalized}T00:00:00Z`;
  } else if (!hasTZ && isNaiveDateTime) {
    // Append Z to mark as UTC
    normalized = `${normalized.replace(' ', 'T')}Z`;
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
