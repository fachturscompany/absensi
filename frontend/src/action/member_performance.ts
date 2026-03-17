"use server";
import { createClient } from "@/utils/supabase/server";
import { ApiResponse, IMemberPerformance } from "@/interface";

async function getSupabase() {
  return await createClient();
}

/**
 * Fetch basic performance metrics for a single organization_member
 * Returns counts for present/late/absent/excused, lastSeen (latest attendance_date),
 * average work_duration_minutes (where available) and recent 30-day summary.
 */
export const getMemberPerformance = async (memberId: string): Promise<ApiResponse<IMemberPerformance>> => {
  const supabase = await getSupabase();

  // Calculate date ranges once
  const since90Date = new Date();
  since90Date.setDate(since90Date.getDate() - 89);
  const since90 = since90Date.toISOString().split("T")[0] as string;

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 30);
  const since = sinceDate.toISOString().split("T")[0] as string;

  // Single optimized query to get all data at once
  const [allRecordsRes, latestRes, recentRes] = await Promise.all([
    // Get all attendance records for statistics (no limit for accurate counts)
    supabase
      .from("attendance_records")
      .select("status,work_duration_minutes,actual_check_in,actual_check_out,attendance_date")
      .eq("organization_member_id", memberId),
    
    // Latest attendance
    supabase
      .from("attendance_records")
      .select("attendance_date")
      .eq("organization_member_id", memberId)
      .order("attendance_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    
    // Recent 30 days
    supabase
      .from("attendance_records")
      .select("id,status,attendance_date,work_duration_minutes,actual_check_in,actual_check_out")
      .eq("organization_member_id", memberId)
      .gte("attendance_date", since)
      .order("attendance_date", { ascending: true }),
  ]);

  // Process counts from single query result
  const countsMap: Record<string, number> = {
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
  };

  if (allRecordsRes.data) {
    for (const record of allRecordsRes.data) {
      const status = record.status?.toLowerCase() as keyof typeof countsMap | undefined;
      if (status && countsMap[status] !== undefined) {
        countsMap[status]++;
      }
    }
  }

  // Calculate averages from the same dataset (last 90 days)
  function parseMinutes(value: string | null | undefined) {
    if (!value) return null;
    const timestamp = Date.parse(value);
    if (!Number.isNaN(timestamp)) {
      const dt = new Date(timestamp);
      return dt.getHours() * 60 + dt.getMinutes();
    }
    const match = String(value).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
  }

  const ins: number[] = [];
  const outs: number[] = [];
  const durations: number[] = [];

  // Process all records for last 90 days
  if (allRecordsRes.data) {
    const since90DateObj = new Date(since90);
    for (const row of allRecordsRes.data) {
      // Only process records from last 90 days for averages
      const recordDate = new Date(row.attendance_date);
      if (recordDate >= since90DateObj) {
        const ci = row.actual_check_in;
        const co = row.actual_check_out;
        const dur = Number(row.work_duration_minutes || 0);

        if (ci) {
          const t = Date.parse(ci);
          if (!isNaN(t)) {
            ins.push(new Date(t).getHours() * 60 + new Date(t).getMinutes());
          } else {
            const m = String(ci).match(/(\d{1,2}):(\d{2})/);
            if (m) ins.push(Number(m[1]) * 60 + Number(m[2]));
          }
        }

        if (co) {
          const t2 = Date.parse(co);
          if (!isNaN(t2)) {
            outs.push(new Date(t2).getHours() * 60 + new Date(t2).getMinutes());
          } else {
            const m2 = String(co).match(/(\d{1,2}):(\d{2})/);
            if (m2) outs.push(Number(m2[1]) * 60 + Number(m2[2]));
          }
        }

        if (Number.isFinite(dur) && dur > 0) {
          durations.push(dur);
        } else {
          const start = parseMinutes(ci);
          const end = parseMinutes(co);
          if (start != null && end != null && end > start) {
            durations.push(end - start);
          }
        }
      }
    }
  }

  const avgMinutes = (arr: number[]) => 
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  const avgIn = avgMinutes(ins);
  const avgOut = avgMinutes(outs);
  const avg = durations.length 
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) 
    : 0;

  const avgCheckInStr = avgIn != null 
    ? `${String(Math.floor(avgIn / 60)).padStart(2, "0")}:${String(avgIn % 60).padStart(2, "0")}` 
    : null;
  const avgCheckOutStr = avgOut != null 
    ? `${String(Math.floor(avgOut / 60)).padStart(2, "0")}:${String(avgOut % 60).padStart(2, "0")}` 
    : null;

  const recent = recentRes && recentRes.data ? recentRes.data : [];

  return {
    success: true,
    data: {
      counts: {
        present: countsMap.present || 0,
        late: countsMap.late || 0,
        absent: countsMap.absent || 0,
        excused: countsMap.excused || 0,
      },
      lastSeen: latestRes && latestRes.data ? (latestRes.data as any).attendance_date : null,
      averageWorkDurationMinutes: avg,
      averageCheckInTime: avgCheckInStr,
      averageCheckOutTime: avgCheckOutStr,
      recent30: recent,
    },
  }
}
