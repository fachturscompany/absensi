export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { calculateAttendanceStatus, getDayOfWeek, type ScheduleRule } from '@/lib/attendance-status-calculator'

import { dashboardLogger } from '@/lib/logger';
async function getUserOrganizationId() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle()

  return member?.organization_id || null
}

export async function GET(request: Request) {
  try {
    let organizationId = await getUserOrganizationId()
    if (!organizationId) {
      try {
        const cookieStore = await cookies()
        const raw = cookieStore.get('org_id')?.value
        const fromCookie = raw ? Number(raw) : NaN
        if (!Number.isNaN(fromCookie)) organizationId = fromCookie
      } catch { }
    }
    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: 'Organization not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '15')

    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    // Get today's attendance records with member info
    const { data: records, error } = await supabase
      .from('attendance_records')
      .select(`
        id,
        status,
        actual_check_in,
        actual_check_out,
        late_minutes,
        attendance_date,
        organization_member_id,
        organization_members!inner (
          id,
          department_id,
          user_profiles!inner (
            first_name,
            last_name
          ),
          departments!organization_members_department_id_fkey (
            name
          )
        )
      `)
      .eq('organization_members.organization_id', organizationId)
      .eq('attendance_date', today)
      .not('actual_check_in', 'is', null)
      .order('actual_check_in', { ascending: false })
      .limit(limit)

    if (error) {
      dashboardLogger.error('Error fetching recent activity:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch recent activity' },
        { status: 500 }
      )
    }

    // Helpers to safely pick nested shapes (object or array)
    const pickFirstObject = (u: unknown): Record<string, unknown> | null => {
      if (Array.isArray(u)) return (u[0] && typeof u[0] === 'object') ? (u[0] as Record<string, unknown>) : null;
      return (u && typeof u === 'object') ? (u as Record<string, unknown>) : null;
    };
    const getProp = <T>(obj: Record<string, unknown> | null, key: string, fallback: T): T => {
      const v = obj?.[key];
      return (v as T) ?? fallback;
    };

    type Row = {
      id: number;
      status: string;
      actual_check_in: string | null;
      actual_check_out: string | null;
      late_minutes: number | null;
      attendance_date: string;
      organization_member_id: number;
      organization_members: unknown;
    };

    const activities = await Promise.all(((records ?? []) as Row[]).map(async (record) => {
      const member = pickFirstObject(record.organization_members);
      const profile = pickFirstObject(getProp(member, 'user_profiles', null));
      const department = pickFirstObject(getProp(member, 'departments', null));

      let status = record.status;
      // Try recompute using schedule rule (best-effort)
      try {
        const dayOfWeek = getDayOfWeek(record.attendance_date);
        const ms = await supabase
          .from('member_schedules')
          .select('work_schedule_id, effective_date, end_date, is_active')
          .eq('organization_member_id', record.organization_member_id)
          .eq('is_active', true)
          .lte('effective_date', record.attendance_date)
          .or('end_date.is.null,end_date.gte.' + record.attendance_date)
          .order('effective_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        const workScheduleId = (ms.data as { work_schedule_id: number } | null)?.work_schedule_id;
        if (workScheduleId) {
          const det = await supabase
            .from('work_schedule_details')
            .select('day_of_week,is_working_day,start_time,end_time,core_hours_start,core_hours_end,is_active')
            .eq('work_schedule_id', workScheduleId)
            .eq('day_of_week', dayOfWeek)
            .maybeSingle();

          const d = det.data as {
            day_of_week: number; is_working_day: boolean; start_time: string | null; end_time: string | null;
            core_hours_start: string | null; core_hours_end: string | null; is_active: boolean | null;
          } | null;
          if (d && d.is_working_day && d.is_active && d.start_time && d.end_time && d.core_hours_start && d.core_hours_end) {
            const rule: ScheduleRule = {
              day_of_week: d.day_of_week,
              start_time: d.start_time,
              end_time: d.end_time,
              core_hours_start: d.core_hours_start,
              core_hours_end: d.core_hours_end,
            };
            const calc = calculateAttendanceStatus(record.actual_check_in, record.actual_check_out, rule);
            status = calc.status;
          }
        }
      } catch { }

      const firstName = getProp<string | null>(profile, 'first_name', null) || '';
      const lastName = getProp<string | null>(profile, 'last_name', null) || '';
      const deptName = getProp<string | null>(department, 'name', null);

      return {
        id: record.id.toString(),
        memberName: `${firstName} ${lastName}`.trim() || 'Unknown',
        status,
        checkInTime: record.actual_check_in,
        lateMinutes: record.late_minutes,
        department: deptName || null,
      };
    }))

    return NextResponse.json(
      { success: true, data: activities },
      {
        headers: {
          'Cache-Control': 'private, no-cache, must-revalidate',
          'Vary': 'Cookie'
        }
      }
    )
  } catch (err) {
    dashboardLogger.error('API /dashboard/recent-activity error', err)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch recent activity' },
      { status: 500 }
    )
  }
}
