import { useEffect, useState } from 'react';

/**
 * Hook untuk detect apakah component sudah di-hydrate di client
 * Gunakan ini untuk conditional rendering yang berbeda antara server dan client
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

/**
 * Hook untuk safely initialize date values
 * Hindari hydration mismatch dengan initialize placeholder terlebih dahulu
 */
export function useSafeDate(initialValue: Date = new Date(0)) {
  const [date, setDate] = useState<Date>(initialValue);
  const isHydrated = useHydration();

  useEffect(() => {
    if (isHydrated) {
      setDate(new Date());
    }
  }, [isHydrated]);

  return { date, isHydrated };
}

/**
 * Hook untuk safely initialize date range
 * Gunakan untuk DateFilterState atau similar
 */
export function useSafeDateRange() {
  const [dateRange, setDateRange] = useState({
    from: new Date(0),
    to: new Date(0),
    preset: 'today' as const,
  });
  const isHydrated = useHydration();

  useEffect(() => {
    if (isHydrated) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      setDateRange({
        from: today,
        to: endOfToday,
        preset: 'today',
      });
    }
  }, [isHydrated]);

  return { dateRange, isHydrated };
}
