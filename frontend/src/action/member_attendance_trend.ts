"use server";
import { createClient } from "@/utils/supabase/server";
import { ApiResponse, IMemberAttendancePoint } from "@/interface";

import { attendanceLogger } from '@/lib/logger';
async function getSupabase() {
  return await createClient();
}

export const getMemberAttendanceTrend = async (memberId: string): Promise<ApiResponse<IMemberAttendancePoint[]>> => {
  const supabase = await getSupabase();

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 29); // include today => 30 days
  const since = sinceDate.toISOString().split('T')[0];

  // Use client-side select and aggregate. (Avoid RPC/raw SQL to prevent missing-function RPC errors.)
  const { data: rows, error: qerr } = await supabase
    .from('attendance_records')
    .select('attendance_date, work_duration_minutes')
    .eq('organization_member_id', memberId)
    .gte('attendance_date', since)
    .order('attendance_date', { ascending: true });

  if (qerr) {
    attendanceLogger.error('getMemberAttendanceTrend query error', qerr);
    return { success: false, message: 'Query error', data: [] } as ApiResponse<IMemberAttendancePoint[]>;
  }

  type AttendanceRow = { attendance_date: string | null; work_duration_minutes: number | null };
  const map: Record<string, { count: number; sumMinutes: number; rows: number }> = {};
  (rows || []).forEach((row: AttendanceRow) => {
    const d = (row.attendance_date || '').toString().split('T')[0];
    if (!d) return;
    if (!map[d]) map[d] = { count: 0, sumMinutes: 0, rows: 0 };
    map[d].count += 1;
    const m = Number(row.work_duration_minutes || 0);
    map[d].sumMinutes += m;
    map[d].rows += (m ? 1 : 0);
  });

  // Build full 30-day series including zeros
  const result: IMemberAttendancePoint[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(today.getDate() - i);
    const key = dt.toISOString().split('T')[0] as string;
    const entry = map[key];
    result.push({
      date: key,
      count: entry ? entry.count : 0,
      averageWorkDurationMinutes: entry && entry.rows ? Math.round(entry.sumMinutes / entry.rows) : null,
    });
  }

  return { success: true, data: result } as ApiResponse<IMemberAttendancePoint[]>;
};
