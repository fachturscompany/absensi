import { formatInTimeZone } from "date-fns-tz";

/**
 * Memformat string UTC ke waktu lokal berdasarkan timezone IANA (e.g. Asia/Jakarta)
 * Digunakan secara global di frontend berdasarkan preferensi Organisasi.
 */
export function formatLocalTime(
  utcString: string | null | undefined,
  timezone: string,
  timeFormat: '12h' | '24h' = '24h',
  includeDate: boolean = false
) {
  // 1. Handle null, undefined, atau string kosong
  if (!utcString || typeof utcString !== 'string' || ["-", ""].includes(utcString.trim())) {
    return "-";
  }

  try {
    let normalized = utcString.trim().replace(' ', 'T');

    // 2. Fix spesifik Supabase/Postgres: 
    // Mengubah format '+00' atau '+0000' menjadi 'Z' (UTC)
    normalized = normalized.replace(/[+-]00(?::00)?$/, 'Z');

    // 3. Jika tidak ada indikator zona waktu, paksa ke UTC (Z)
    if (!/[Z]|[+-]\d{2}(:?\d{2})?$/.test(normalized)) {
      normalized += 'Z';
    }

    const date = new Date(normalized);

    // 4. Validasi apakah tanggal valid
    if (isNaN(date.getTime())) return "-";

    // 5. Tentukan format string
    const formatStr = includeDate 
      ? (timeFormat === '12h' ? 'dd MMM yyyy, hh:mm a' : 'dd MMM yyyy, HH:mm')
      : (timeFormat === '12h' ? 'hh:mm a' : 'HH:mm');

    // 6. Konversi menggunakan date-fns-tz (Menangani DST otomatis)
    return formatInTimeZone(date, timezone, formatStr);
  } catch (error) {
    console.error("Date formatting error:", error);
    return "-";
  }
}

/** * --- HELPER ANDA SEBELUMNYA (TETAP DIPERTAHANKAN) ---
 */

export const getDayName = (
    dayIndex: number,
    locale?: string,
    format: "long" | "short" = "long"
): string => {
    const baseDate = new Date(2026, 0, 4 + dayIndex)
    return new Intl.DateTimeFormat(locale, { weekday: format }).format(baseDate)
}

export const getAllDayNames = (
    locale?: string,
    format: "long" | "short" = "long"
): string[] => {
    return [0, 1, 2, 3, 4, 5, 6].map((day) => getDayName(day, locale, format))
}

export const DAY_OF_WEEK = {
    SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
} as const

export const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}