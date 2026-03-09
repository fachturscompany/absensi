"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

import { attendanceLogger } from '@/lib/logger';
import { getJSON, setJSON } from '@/lib/cache';
import { calculateAttendanceStatus, getDayOfWeek, type ScheduleRule } from '@/lib/attendance-status-calculator';
async function getSupabase() {
  return await createClient();
}


// Resolve active schedule rule for a member on a given date.
// Returns null if no active rule or non-working day.
async function resolveScheduleRuleForMemberDate(
  supabase: Awaited<ReturnType<typeof getSupabase>>,
  organizationMemberId: number,
  dateISO: string,
): Promise<ScheduleRule | null> {
  // Find active member schedule effective for the date
  const { data: ms, error: msErr } = await supabase
    .from('member_schedules')
    .select('work_schedule_id, effective_date, end_date, is_active')
    .eq('organization_member_id', organizationMemberId)
    .eq('is_active', true)
    .lte('effective_date', dateISO)
    .or('end_date.is.null,end_date.gte.' + dateISO)
    .order('effective_date', { ascending: false })
    .limit(1);

  if (msErr || !ms || ms.length === 0) {
    return null;
  }

  const workScheduleId = ms[0]?.work_schedule_id as number | string | null;
  if (!workScheduleId) return null;

  // Fetch schedule detail for day of week
  const dayOfWeek = getDayOfWeek(dateISO);

  const { data: det, error: detErr } = await supabase
    .from('work_schedule_details')
    .select('day_of_week,is_working_day,start_time,end_time,core_hours_start,core_hours_end,grace_in_minutes,grace_out_minutes,is_active')
    .eq('work_schedule_id', workScheduleId)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle();

  if (detErr || !det) return null;
  if (!det.is_working_day) return null;
  if (!det.is_active) return null;

  const rule: ScheduleRule = {
    day_of_week: det.day_of_week,
    start_time: det.start_time || '',
    end_time: det.end_time || '',
    core_hours_start: det.core_hours_start || '',
    core_hours_end: det.core_hours_end || '',
    grace_in_minutes: det.grace_in_minutes ?? 0,
    grace_out_minutes: det.grace_out_minutes ?? 0,
  };
  // Basic guard: empty strings mean invalid rule
  if (!rule.start_time || !rule.end_time || !rule.core_hours_start || !rule.core_hours_end) {
    return null;
  }
  return rule;
}

// Update check-in/check-out times and remarks for a single attendance record
export async function updateAttendanceRecord(payload: {
  id: string;
  actual_check_in?: string | null;
  actual_check_out?: string | null;
  remarks?: string | null;
}) {
  try {
    const supabase = await getSupabase();

    try {
      const { data: recOrg } = await supabase
        .from('attendance_records')
        .select('organization_member_id, attendance_date, actual_check_in, actual_check_out')
        .eq('id', payload.id)
        .maybeSingle();

      // Recalculate status only if check-in/out provided
      const shouldRecalc = payload.actual_check_in !== undefined || payload.actual_check_out !== undefined;
      if (shouldRecalc && recOrg) {
        const memberId = (recOrg as unknown as { organization_member_id: number }).organization_member_id;
        const attendanceDate = (recOrg as unknown as { attendance_date: string }).attendance_date;
        const currentIn = (recOrg as unknown as { actual_check_in: string | null }).actual_check_in;
        const currentOut = (recOrg as unknown as { actual_check_out: string | null }).actual_check_out;
        const nextIn = payload.actual_check_in !== undefined ? payload.actual_check_in : currentIn;
        const nextOut = payload.actual_check_out !== undefined ? payload.actual_check_out : currentOut;

        const rule = await resolveScheduleRuleForMemberDate(supabase, Number(memberId), attendanceDate);
        if (rule) {
          const result = calculateAttendanceStatus(nextIn ?? null, nextOut ?? null, rule);
          // Include status in update
          if (result && result.status) {
            // updateData is declared below; stash computed status to apply later
            (payload as { _computedStatus?: string })._computedStatus = result.status;
          }
          // Stash computed minutes
          (payload as { _lateMinutes?: number | null })._lateMinutes = result.details.lateMinutes ?? null;
          (payload as { _earlyLeaveMinutes?: number | null })._earlyLeaveMinutes = result.details.earlyLeaveMinutes ?? null;
          (payload as { _overtimeMinutes?: number | null })._overtimeMinutes = result.details.overtimeMinutes ?? null;
        } else {
          (payload as { _computedStatus?: string })._computedStatus = 'absent';
          (payload as { _lateMinutes?: number | null })._lateMinutes = null;
          (payload as { _earlyLeaveMinutes?: number | null })._earlyLeaveMinutes = null;
          (payload as { _overtimeMinutes?: number | null })._overtimeMinutes = null;
        }
      }
    } catch (_) { }

    const updateData: Record<string, any> = {};
    if (payload.actual_check_in !== undefined) updateData.actual_check_in = payload.actual_check_in;
    if (payload.actual_check_out !== undefined) updateData.actual_check_out = payload.actual_check_out;
    if (payload.remarks !== undefined) updateData.remarks = payload.remarks;
    if ((payload as { _computedStatus?: string })._computedStatus) {
      updateData.status = (payload as { _computedStatus?: string })._computedStatus;
    }
    if ((payload as { _lateMinutes?: number | null })._lateMinutes !== undefined) {
      updateData.late_minutes = (payload as { _lateMinutes?: number | null })._lateMinutes;
    }
    if ((payload as { _earlyLeaveMinutes?: number | null })._earlyLeaveMinutes !== undefined) {
      updateData.early_leave_minutes = (payload as { _earlyLeaveMinutes?: number | null })._earlyLeaveMinutes;
    }
    if ((payload as { _overtimeMinutes?: number | null })._overtimeMinutes !== undefined) {
      updateData.overtime_minutes = (payload as { _overtimeMinutes?: number | null })._overtimeMinutes;
    }

    const { error } = await supabase
      .from('attendance_records')
      .update(updateData)
      .eq('id', payload.id);

    if (error) {
      attendanceLogger.error('❌ Error updating attendance record:', error);
      return { success: false, message: error.message } as const;
    }

    revalidatePath('/attendance', 'layout');

    return { success: true } as const;
  } catch (err) {
    attendanceLogger.error('❌ Exception updating attendance record:', err);
    return { success: false, message: err instanceof Error ? err.message : 'An error occurred' } as const;
  }
}

export type GetAttendanceParams = {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  status?: string;
  department?: string;
  organizationId?: number;  // Add organization ID parameter
  noCache?: boolean;
  cursor?: string; // base64 cursor for keyset pagination
};

export type AttendanceListItem = {
  id: string;
  member: {
    id: number;
    userId?: string;
    name: string;
    avatar?: string;
    position: string;
    department: string;
    email?: string | null;
  };
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: string;
  status: string;
  checkInMethod: string | null;
  checkOutMethod: string | null;
  checkInLocationName: string | null;
  checkOutLocationName: string | null;
  actualBreakStart: string | null;
  actualBreakEnd: string | null;
  breakInMethod: string | null;
  breakOutMethod: string | null;
  work_duration_minutes: number | null
  notes: string;
  timezone: string;
  time_format: string;
};

export type GetAttendanceResult = {
  success: boolean;
  data: AttendanceListItem[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    nextCursor?: string;
  };
  message?: string;
};

export const getAllAttendance = async (params: GetAttendanceParams = {}): Promise<GetAttendanceResult> => {
  const supabase = await getSupabase();

  const {
    page = 1,
    limit = 10,
    dateFrom,
    dateTo,
    search,
    status,
    department,
    organizationId,  // Get organization ID from params
  } = params;

  // Default date range to today in production to avoid full table scans
  const effDateFrom = dateFrom || undefined;
  const effDateTo = dateTo || undefined;

  // Resolve effective organization id: prefer param, else cookie, else fallback to user's active membership
  let effectiveOrgId: number | null = null;
  let memberIdForLog: number | null = null;

  if (organizationId) {
    effectiveOrgId = organizationId;
    attendanceLogger.info("🔑 Using organizationId from params:", organizationId);
  } else {
    // Try resolve from cookie first (works well on Vercel)
    try {
      const cookieStore = await cookies();
      const raw = cookieStore.get('org_id')?.value;
      const fromCookie = raw ? Number(raw) : NaN;
      if (!Number.isNaN(fromCookie)) {
        effectiveOrgId = fromCookie;
        attendanceLogger.info("🍪 Using organizationId from cookie:", fromCookie);
      }
    } catch { }

    // Fallback: resolve via authenticated user's active membership
    if (!effectiveOrgId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        attendanceLogger.error("❌ User not authenticated and no org cookie");
        return { success: false, data: [], message: "User not authenticated" };
      }

      const { data: userMembers, error: memberError } = await supabase
        .from("organization_members")
        .select("organization_id, id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1);

      if (memberError) {
        attendanceLogger.error("❌ Member query error:", memberError);
        return { success: false, data: [], message: memberError.message || "Member query error" };
      }

      const userMember = userMembers?.[0];
      if (!userMember) {
        attendanceLogger.error("❌ User not in any active organization");
        return { success: false, data: [], message: "User not registered in any active organization" };
      }

      effectiveOrgId = userMember.organization_id;
      memberIdForLog = userMember.id;
    }
  }

  if (!effectiveOrgId) {
    return { success: false, data: [], message: "Organization not resolved" };
  }
  attendanceLogger.info("✅ Effective org resolved:", effectiveOrgId, "member:", memberIdForLog);

  type AttendanceRow = {
    id: number;
    organization_member_id: number;
    attendance_date: string;
    actual_check_in: string | null;
    actual_check_out: string | null;
    status: string;
    created_at: string;
    work_duration_minutes: number | null;
    break_duration_minutes: number | null;
    actual_break_start: string | null;
    actual_break_end: string | null;
    remarks: string | null;
    check_in_method: string | null;
    check_out_method: string | null;
  };
  type MemberProfile = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    email: string | null;
    profile_photo_url: string | null;
    search_name: string | null;
  };
  type Biodata = {
    nama: string | null;
    nickname: string | null;
  };
  type MemberData = {
    id: number;
    user_profiles: MemberProfile | MemberProfile[] | null;
    biodata: Biodata | Biodata[] | null;
    departments: { name: string | null } | { name: string | null }[] | null;
  };

  // Inline filters below to avoid deep generic instantiation on Supabase types
  const hasSearch = Boolean(search && search.trim() !== '');
  const term = hasSearch ? search!.trim().toLowerCase() : '';
  const pattern = hasSearch ? `%${term}%` : '';

  const innerParts: string[] = ['id'];
  if (hasSearch) innerParts.push('user_profiles!organization_members_user_id_fkey!inner(search_name)');
  if (department && department !== 'all') innerParts.push('departments!organization_members_department_id_fkey(name)');
  const countRel = `organization_members!inner(${innerParts.join(',')})`;

  let totalCount: number | undefined = undefined;
  {
    let countQuery = supabase
      .from('attendance_records')
      .select(`id, ${countRel}`, { count: 'exact', head: true })
      .eq('organization_members.organization_id', effectiveOrgId);
    if (effDateFrom) countQuery = countQuery.gte('attendance_date', effDateFrom);
    if (effDateTo) countQuery = countQuery.lte('attendance_date', effDateTo);
    if (status && status !== 'all') countQuery = countQuery.eq('status', status);
    if (department && department !== 'all') countQuery = countQuery.eq('organization_members.departments.name', department);
    if (hasSearch) countQuery = countQuery.ilike('organization_members.user_profiles.search_name', pattern);
    const countResp = await countQuery;
    totalCount = (countResp as unknown as { count: number | null }).count ?? 0;
  }

  // LIST dengan join untuk mengambil profil/departemen/biodata
  // Specify exact FK for departments to avoid PostgREST ambiguous embed error
  const listRel = hasSearch
    ? 'organization_members!inner(id, is_active, user_profiles!organization_members_user_id_fkey!inner(id,first_name,last_name,display_name,email,profile_photo_url,search_name), departments!organization_members_department_id_fkey(name))'
    : 'organization_members!inner(id, is_active, user_profiles!organization_members_user_id_fkey(id,first_name,last_name,display_name,email,profile_photo_url,search_name), departments!organization_members_department_id_fkey(name))';
  const fromIdx = (page - 1) * limit;
  const toIdx = fromIdx + limit - 1;
  let listQuery = supabase
    .from('attendance_records')
    .select(`id, organization_member_id, attendance_date, actual_check_in, actual_check_out, actual_break_start, actual_break_end, status, created_at, work_duration_minutes, break_duration_minutes, check_in_method, check_out_method, ${listRel}`)
    .eq('organization_members.organization_id', effectiveOrgId)
  if (effDateFrom) listQuery = listQuery.gte('attendance_date', effDateFrom);
  if (effDateTo) listQuery = listQuery.lte('attendance_date', effDateTo);
  if (status && status !== 'all') listQuery = listQuery.eq('status', status);
  if (department && department !== 'all') listQuery = listQuery.eq('organization_members.departments.name', department);
  if (hasSearch) listQuery = listQuery.ilike('organization_members.user_profiles.search_name', pattern);
  listQuery = listQuery
    .order('attendance_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(fromIdx, toIdx);
  const listResp = await listQuery;
  type AttendanceRowWithRel = AttendanceRow & { organization_members: MemberData | MemberData[] | null };
  const rows = (listResp as unknown as { data: AttendanceRowWithRel[] | null }).data;
  const dataError = (listResp as unknown as { error: { message: string } | null }).error;
  if (dataError) {
    return { success: false, data: [], message: dataError.message };
  }

  // Defensive: if rows are empty but cached totalCount > 0, recompute count fresh
  if ((!rows || rows.length === 0) && typeof totalCount === 'number' && totalCount > 0) {
    let freshCount = supabase
      .from('attendance_records')
      .select(`id, ${countRel}`, { count: 'exact', head: true })
      .eq('organization_members.organization_id', effectiveOrgId)
    if (effDateFrom) freshCount = freshCount.gte('attendance_date', effDateFrom);
    if (effDateTo) freshCount = freshCount.lte('attendance_date', effDateTo);
    if (status && status !== 'all') freshCount = freshCount.eq('status', status);
    if (department && department !== 'all') freshCount = freshCount.eq('organization_members.departments.name', department);
    if (hasSearch) freshCount = freshCount.ilike('organization_members.user_profiles.search_name', pattern);
    const freshResp = await freshCount;
    totalCount = (freshResp as unknown as { count: number | null }).count ?? 0;

  }

  // If count somehow less than current page size, adjust to at least rows length
  if (typeof totalCount === 'number' && rows && totalCount < rows.length) {
    totalCount = rows.length;
  }

  // Fallback: if single-join returns no rows, try IN(memberIds) —
  // Guarded to avoid heavy scans on serverless. Enable only when searching.
  const FALLBACK_ON = process.env.ATTENDANCE_LIST_FALLBACK === '1';
  let effectiveRows = rows;
  if ((!effectiveRows || effectiveRows.length === 0) && FALLBACK_ON && hasSearch) {
    attendanceLogger.warn("⚠️ Single-join returned 0 rows. Trying fallback IN(memberIds)...");
    const { data: members, error: membersErr } = await supabase
      .from('organization_members')
      .select('id, user_profiles(search_name)')
      .eq('organization_id', effectiveOrgId)
      .eq('is_active', true);

    if (!membersErr && Array.isArray(members) && members.length > 0) {
      type MemberRow = { id: number; user_profiles: { search_name: string | null } | { search_name: string | null }[] | null };
      let memberIds = (members as MemberRow[]).map(m => m.id);

      if (hasSearch) {
        const match = (m: MemberRow) => {
          const up = m.user_profiles;
          const sn = Array.isArray(up) ? up[0]?.search_name : up?.search_name;
          return (sn || '').toLowerCase().includes(term);
        };
        memberIds = (members as MemberRow[]).filter(match).map(m => m.id);
      }

      if (memberIds.length > 0) {
        // Limit IN size to avoid timeouts
        const MAX_IDS = 500;
        if (memberIds.length > MAX_IDS) memberIds = memberIds.slice(0, MAX_IDS);
        let fbQuery = supabase
          .from('attendance_records')
          .select(`id, organization_member_id, attendance_date, actual_check_in, actual_check_out, status, created_at, work_duration_minutes, check_in_method, check_out_method, ${listRel}`)
          .in('organization_member_id', memberIds);

        if (status && status !== 'all') fbQuery = fbQuery.eq('status', status);

        const fbResp = await fbQuery
          .order('attendance_date', { ascending: false })
          .order('created_at', { ascending: false })
          .range(fromIdx, toIdx);

        const fbRows = (fbResp as unknown as { data: AttendanceRowWithRel[] | null }).data;
        if (fbRows && fbRows.length > 0) {
          attendanceLogger.info("✅ Fallback IN(memberIds) returned rows:", fbRows.length);
          effectiveRows = fbRows;
        }
      }
    }
  }

  // Small cache for org info to avoid repeated fetch on each page load
  const orgInfoCacheKey = `org:info:${effectiveOrgId}`;
  let orgInfo: { id: number; timezone: string | null; time_format: string | null } | null = null;
  try {
    orgInfo = await getJSON<{ id: number; timezone: string | null; time_format: string | null }>(orgInfoCacheKey);
  } catch (_) {
    attendanceLogger.warn(`⚠️ Org info cache read failed for key ${orgInfoCacheKey}, using DB fallback`);
  }
  if (!orgInfo) {
    const { data: orgInfoRaw } = await supabase
      .from('organizations')
      .select('id, timezone, time_format')
      .eq('id', effectiveOrgId)
      .maybeSingle();
    const fallbackInfo = { id: effectiveOrgId, timezone: 'Asia/Jakarta', time_format: '24h' }
    orgInfo = orgInfoRaw || fallbackInfo;
    try { await setJSON(orgInfoCacheKey, orgInfo, 600); } catch { }
  }

  const mapped = (effectiveRows || []).map((item: AttendanceRowWithRel) => {
    const m = item.organization_members as MemberData | MemberData[] | null;
    const mObj: MemberData | null = Array.isArray(m) ? (m[0] as MemberData) : (m as MemberData);
    const profileObj = mObj?.user_profiles;
    const profile: MemberProfile | null = Array.isArray(profileObj) ? (profileObj[0] ?? null) : (profileObj ?? null);
    const biodataObj = mObj?.biodata;
    const biodata: Biodata | null = Array.isArray(biodataObj) ? (biodataObj[0] ?? null) : (biodataObj ?? null);

    // Try user_profiles first
    const displayName = (profile?.display_name ?? '').trim();
    const firstName = profile?.first_name ?? '';
    const lastName = profile?.last_name ?? '';
    const email = (profile?.email ?? '').trim();
    const searchName = (profile?.search_name ?? '').trim();
    const fullName = `${firstName} ${lastName}`.trim();

    // Fallback to biodata if user_profiles has no name
    const biodataNama = (biodata?.nama ?? '').trim();
    const biodataNickname = (biodata?.nickname ?? '').trim();

    const effectiveName = displayName || fullName || email || searchName || biodataNama || biodataNickname;
    const deptObj = mObj?.departments;
    const departmentName = Array.isArray(deptObj) ? (deptObj[0]?.name ?? '') : (deptObj?.name ?? '');

    const inMethod = item.check_in_method ?? (item.actual_check_in ? 'manual' : null);
    const outMethod = item.check_out_method ?? (item.actual_check_out ? 'manual' : null);
    return {
      id: String(item.id),
      member: {
        id: item.organization_member_id,
        userId: profile?.id,
        name: effectiveName || `Member #${item.organization_member_id}`,
        avatar: profile?.profile_photo_url || undefined,
        position: '',
        department: departmentName,
        email: profile?.email || null,
      },
      date: item.attendance_date,
      checkIn: item.actual_check_in,
      checkOut: item.actual_check_out,
      workHours: item.work_duration_minutes ? `${Math.floor(item.work_duration_minutes / 60)}h ${item.work_duration_minutes % 60}m` : (item.actual_check_in ? '-' : '-'),
      status: item.status,
      checkInMethod: inMethod ? String(inMethod) : null,
      checkOutMethod: outMethod ? String(outMethod) : null,
      checkInLocationName: null,
      checkOutLocationName: null,
      actualBreakStart: item.actual_break_start,
      actualBreakEnd: item.actual_break_end,
      breakInMethod: inMethod ? String(inMethod) : null,
      breakOutMethod: inMethod ? String(inMethod) : null,
      notes: '',
      work_duration_minutes: item.work_duration_minutes,
      timezone: orgInfo?.timezone || 'Asia/Jakarta',
      time_format: orgInfo?.time_format || '24h',
    };
  });

  const total = typeof totalCount === 'number' ? totalCount : (effectiveRows?.length || 0);
  let nextCursor: string | undefined = undefined;
  if ((effectiveRows?.length || 0) === limit && effectiveRows && effectiveRows.length > 0) {
    const last = effectiveRows[effectiveRows.length - 1] as AttendanceRow | undefined;
    if (last) {
      const payload = { ad: last.attendance_date, cr: last.created_at, id: last.id };
      try { nextCursor = Buffer.from(JSON.stringify(payload)).toString('base64'); } catch { }
    }
  }
  const result: GetAttendanceResult = {
    success: true,
    data: mapped,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit), nextCursor }
  };

  return result;
};

export async function updateAttendanceStatus(id: string, status: string) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("attendance_records")
    .update({ status })
    .eq("id", id);
  if (error) return { success: false, message: error.message };
  return { success: true };
}

type ManualAttendancePayload = {
  organization_member_id: string;
  attendance_date: string;
  actual_check_in: string;
  actual_check_out: string | null;
  status: string;
  remarks?: string;
  check_in_method?: string;
  check_out_method?: string;
};

export async function checkExistingAttendance(
  organization_member_id: string,
  attendance_date: string
) {
  try {
    const supabase = await getSupabase();

    // Ensure organization_member_id is a number
    const memberId = Number(organization_member_id);
    if (isNaN(memberId)) {
      attendanceLogger.error("❌ Invalid organization_member_id:", organization_member_id);
      return { success: false, exists: false };
    }

    // Log for debugging
    attendanceLogger.debug(`🔍 Checking attendance for member ${memberId} on ${attendance_date}`);

    const { data, error } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("organization_member_id", memberId)
      .eq("attendance_date", attendance_date)
      .maybeSingle();

    if (error) {
      attendanceLogger.error("❌ Error checking attendance:", error);
      return { success: false, exists: false };
    }

    const exists = !!data;
    attendanceLogger.debug(`✓ Attendance check result: exists=${exists}`);
    return { success: true, exists };
  } catch (err) {
    attendanceLogger.error("❌ Exception checking attendance:", err);
    return { success: false, exists: false };
  }
}

export type AttendanceStatsResult = {
  total: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
  trend: any[]; // For chart
};

export const getAttendanceStats = async (params: GetAttendanceParams = {}): Promise<{ success: boolean; data?: AttendanceStatsResult }> => {
  const supabase = await getSupabase();
  const { dateFrom, dateTo, status } = params;

  // Get current user's organization (same auth check as getAllAttendance)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { data: userMembers } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1);

  const userMember = userMembers?.[0];
  if (!userMember) return { success: false };

  // Base query builder
  const buildQuery = (statusFilter?: string) => {
    // We use a single query construction to avoid type mismatches from reassignment
    let q = supabase
      .from("attendance_records")
      .select("id, organization_members!inner(organization_id)", { count: 'planned', head: true })
      .eq("organization_members.organization_id", userMember.organization_id);

    if (dateFrom) q = q.gte("attendance_date", dateFrom);
    if (dateTo) q = q.lte("attendance_date", dateTo);
    if (statusFilter) q = q.eq("status", statusFilter);

    return q;
  };

  try {
    const [totalRes, presentRes, lateRes, absentRes, leaveRes] = await Promise.all([
      buildQuery(status !== 'all' ? status : undefined), // Total (respecting status filter if set)
      buildQuery('present'),
      buildQuery('late'),
      buildQuery('absent'),
      buildQuery('leave') // Assuming 'leave' status exists or map it
    ]);

    // For Trend Chart (Daily counts in the range)
    // This requires a separate data fetch, not just head:true
    let trendData: any[] = [];
    if (dateFrom && dateTo) {
      const { data: trend } = await supabase
        .from("attendance_records")
        .select("attendance_date, status, organization_members!inner(organization_id)")
        .eq("organization_members.organization_id", userMember.organization_id)
        .gte("attendance_date", dateFrom)
        .lte("attendance_date", dateTo);

      if (trend) {
        // Group by date
        const grouped = trend.reduce((acc: any, curr: any) => {
          const date = curr.attendance_date;
          if (!acc[date]) acc[date] = { date, present: 0, late: 0, absent: 0, total: 0 };
          acc[date].total++;
          if (curr.status === 'present') acc[date].present++;
          if (curr.status === 'late') acc[date].late++;
          if (curr.status === 'absent') acc[date].absent++;
          return acc;
        }, {});
        trendData = Object.values(grouped).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
    }

    return {
      success: true,
      data: {
        total: totalRes.count || 0,
        present: presentRes.count || 0,
        late: lateRes.count || 0,
        absent: absentRes.count || 0,
        leave: leaveRes.count || 0,
        trend: trendData
      }
    };
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    return { success: false };
  }
};

export async function createManualAttendance(payload: ManualAttendancePayload) {
  try {
    const supabase = await getSupabase();

    // Log for debugging
    attendanceLogger.debug("📝 Creating attendance for:", {
      member_id: payload.organization_member_id,
      date: payload.attendance_date,
      check_in: payload.actual_check_in,
    });

    const insertPayload: ManualAttendancePayload & {
      late_minutes?: number | null;
      early_leave_minutes?: number | null;
      overtime_minutes?: number | null;
    } = {
      ...payload,
      // Use the status provided from the client payload instead of computing it
      status: payload.status,
      late_minutes: null,
      early_leave_minutes: null,
      overtime_minutes: null,
    };

    const { error } = await supabase.from("attendance_records").insert([insertPayload]);

    if (error) {
      attendanceLogger.error("❌ Error creating attendance:", error);

      // Check if duplicate key error
      if (error.code === "23505") {
        return {
          success: false,
          message: `Attendance already exists for this date. Please check existing records.`
        };
      }

      return { success: false, message: error.message };
    }

    attendanceLogger.debug("✓ Attendance created successfully");


    revalidatePath("/attendance", "layout");

    return { success: true };
  } catch (err) {
    attendanceLogger.error("❌ Exception creating attendance:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An error occurred"
    };
  }
}

export async function deleteAttendanceRecord(id: string) {
  try {
    const supabase = await getSupabase();

    attendanceLogger.info("🗑️ Deleting attendance record:", id);



    const { error } = await supabase
      .from("attendance_records")
      .delete()
      .eq("id", id);

    if (error) {
      attendanceLogger.error("❌ Error deleting attendance:", error);
      return { success: false, message: error.message };
    }

    attendanceLogger.info("✓ Attendance record deleted successfully");
    revalidatePath("/attendance", "layout");

    return { success: true };
  } catch (err) {
    attendanceLogger.error("❌ Exception deleting attendance:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An error occurred"
    };
  }
}

export async function deleteMultipleAttendanceRecords(ids: string[]) {
  try {
    const supabase = await getSupabase();

    attendanceLogger.info("🗑️ Deleting multiple attendance records:", ids);



    const { error } = await supabase
      .from("attendance_records")
      .delete()
      .in("id", ids);

    if (error) {
      attendanceLogger.error("❌ Error deleting attendance records:", error);
      return { success: false, message: error.message };
    }

    attendanceLogger.info("✓ Attendance records deleted successfully");
    // Invalidate caches for affected orgs
    revalidatePath("/attendance", "layout");

    return { success: true };
  } catch (err) {
    attendanceLogger.error("❌ Exception deleting attendance records:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An error occurred"
    };
  }
}
