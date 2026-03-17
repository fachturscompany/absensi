import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

import { attendanceLogger } from '@/lib/logger';
type AttendanceRecord = {
  id: string;
  date: string;
  status: "present" | "late" | "absent" | "excused" | "leave";
  checkIn?: string;
  checkOut?: string;
  duration?: string;
  location?: string;
};

export function useMemberRecentAttendance(memberId: string, limit: number = 14) {
  return useQuery({
    queryKey: ["member-recent-attendance", memberId, limit],
    queryFn: async (): Promise<AttendanceRecord[]> => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("attendance_records")
        .select(`
          id,
          attendance_date,
          status,
          actual_check_in,
          actual_check_out,
          work_duration_minutes,
          check_in_location
        `)
        .eq("organization_member_id", memberId)
        .order("attendance_date", { ascending: false })
        .limit(limit);

      if (error) {
        attendanceLogger.error("Error fetching recent attendance:", error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Format data
      return data.map((record: any) => ({
        id: String(record.id),
        date: record.attendance_date,
        status: record.status || "absent",
        checkIn: record.actual_check_in
          ? new Date(record.actual_check_in).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : undefined,
        checkOut: record.actual_check_out
          ? new Date(record.actual_check_out).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : undefined,
        duration: record.work_duration_minutes
          ? formatDuration(record.work_duration_minutes)
          : undefined,
        location: record.check_in_location?.address || record.check_in_location?.name || undefined,
      }));
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (hours) parts.push(`${hours}h`);
  if (mins) parts.push(`${mins}m`);
  return parts.join(" ") || "0m";
}
