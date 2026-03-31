import { useQuery } from "@tanstack/react-query";
import { formatLocalTime } from "@/utils/date-helper";
import { useState, useEffect } from "react";

// Ganti sesuai cara Anda mendapatkan userId (misal dari session auth)
const userId = "user-123"; 

export function useFormatDate() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch timezone organisasi dari API Route yang baru Anda pindahkan
  const { data: orgSettings } = useQuery({
    queryKey: ["org-timezone", userId],
    queryFn: async () => {
      const res = await fetch(`/api/org-timezone?userId=${userId}`);
      return res.json();
    },
    staleTime: Infinity, // Timezone jarang berubah
  });

  const timezone = orgSettings?.timezone || "UTC";
  // Anda juga bisa menambah fetch untuk 'time_format' (12h/24h) di sini
  const timeFormat = "24h"; 

  const formatDate = (utcString: string | null | undefined, includeDate: boolean = true) => {
    if (!mounted) return "-"; // Cegah hydration error
    return formatLocalTime(utcString, timezone, timeFormat, includeDate);
  };

  return { formatDate, timezone, isLoaded: mounted };
}