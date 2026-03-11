"use server";
import { createClient } from "@/utils/supabase/server";
import { IMemberSchedule } from "@/interface";

export const getAllMemberSchedule = async (organizationId?: number | string) => {
  const supabase = await createClient();

  let finalOrgId = organizationId;

  // If no organizationId provided, get from current user
  if (!finalOrgId) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, message: "User not authenticated", data: [] };
    }

    // Get user's organization membership
    const { data: userMember, error: memberError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError || !userMember) {
      return { success: false, message: "User not in any organization", data: [] };
    }

    finalOrgId = userMember.organization_id;
  }

  // Get all member IDs in the same organization
  const { data: orgMembers, error: orgMembersError } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", finalOrgId);

  if (orgMembersError) {
    return { success: false, message: orgMembersError.message, data: [] };
  }

  const memberIds = orgMembers?.map(m => m.id) || [];
  if (memberIds.length === 0) {
    return { success: true, data: [] };
  }

  // Fetch member schedules with all related data
  const { data, error } = await supabase
    .from("member_schedules")
    .select(`
      id,
      organization_member_id,
      work_schedule_id,
      shift_id,
      effective_date,
      end_date,
      is_active,
      created_at,
      updated_at,
      organization_member:organization_member_id (
        id,
        employee_id,
        user:user_id (
          id,
          first_name,
          last_name,
          email
        )
      ),
      work_schedule:work_schedule_id (
        id,
        code,
        name,
        schedule_type,
        organization_id
      )
    `)
    .in("organization_member_id", memberIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error('[MEMBER-SCHEDULE] Error fetching schedules:', error);
    return { success: false, message: error.message, data: [] };
  }

  console.log('[MEMBER-SCHEDULE] Successfully fetched', data?.length || 0, 'schedules');
  return { success: true, data: data as unknown as IMemberSchedule[] };
};

export const getMemberSchedulesPage = async (
  organizationId: number | string | undefined,
  pageIndex = 0,
  pageSize = 10,
) => {
  try {
    const supabase = await createClient();

    let finalOrgId = organizationId;

    if (!finalOrgId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, message: "User not authenticated", data: [], total: 0 };
      }

      const { data: userMember, error: memberError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError || !userMember) {
        return { success: false, message: "User not in any organization", data: [], total: 0 };
      }

      finalOrgId = userMember.organization_id;
    }

    const safePageIndex = Math.max(0, Number(pageIndex) || 0);
    const safePageSize = Math.max(1, Number(pageSize) || 10);
    const from = safePageIndex * safePageSize;
    const to = from + safePageSize - 1;

    const { data, error, count } = await supabase
      .from("member_schedules")
      .select(
        `
        id,
        organization_member_id,
        work_schedule_id,
        shift_id,
        effective_date,
        end_date,
        is_active,
        created_at,
        updated_at,
        organization_member:organization_member_id!inner (
          id,
          employee_id,
          organization_id,
          user:user_id (
            id,
            first_name,
            last_name,
            email
          )
        ),
        work_schedule:work_schedule_id (
          id,
          code,
          name,
          schedule_type,
          organization_id
        )
      `,
        { count: "estimated" },
      )
      .eq("organization_member.organization_id", finalOrgId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[MEMBER-SCHEDULE] Error fetching schedules page:', error);
      return { success: false, message: error.message, data: [], total: 0 };
    }

    return {
      success: true,
      data: (data || []) as unknown as IMemberSchedule[],
      total: typeof count === "number" ? count : (data?.length || 0),
    };
  } catch (error) {
    console.error("[getMemberSchedulesPage] Unexpected error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown server error",
      data: [],
      total: 0,
    };
  }
};

export const getActiveMemberScheduleMemberIds = async (organizationId?: number | string) => {
  try {
    const supabase = await createClient();

    let finalOrgId = organizationId;

    if (!finalOrgId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, message: "User not authenticated", data: [] as string[] };
      }

      const { data: userMember, error: memberError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError || !userMember) {
        return { success: false, message: "User not in any organization", data: [] as string[] };
      }

      finalOrgId = userMember.organization_id;
    }

    const { data, error } = await supabase
      .from("member_schedules")
      .select(
        `
        organization_member_id,
        organization_member:organization_member_id!inner (
          organization_id
        )
      `,
      )
      .eq("organization_member.organization_id", finalOrgId)
      .eq("is_active", true);

    if (error) {
      return { success: false, message: error.message, data: [] as string[] };
    }

    const ids = Array.from(
      new Set((data || []).map((row: any) => String(row.organization_member_id)).filter(Boolean)),
    );

    return { success: true, data: ids };
  } catch (error) {
    console.error("[getActiveMemberScheduleMemberIds] Unexpected error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown server error",
      data: [] as string[],
    };
  }
};

export const getMemberScheduleById = async (id: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("member_schedules")
    .select(`
      id,
      organization_member_id,
      work_schedule_id,
      shift_id,
      effective_date,
      end_date,
      is_active,
      created_at,
      updated_at,
      organization_member:organization_member_id (
        id,
        employee_id,
        user:user_id (
          id,
          first_name,
          last_name,
          email
        )
      ),
      work_schedule:work_schedule_id (
        id,
        code,
        name,
        schedule_type,
        organization_id
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, data: data as unknown as IMemberSchedule };
};

export const createMemberSchedule = async (payload: Partial<IMemberSchedule>) => {
  const supabase = await createClient();

  // "Auto-Cutoff" Logic for Single Assignment
  if (payload.organization_member_id && payload.effective_date) {
    // 1. Calculate cutoff date (yesterday relative to effective_date)
    const effDate = new Date(payload.effective_date);
    const cutoffDate = new Date(effDate);
    cutoffDate.setDate(cutoffDate.getDate() - 1);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    // 2. Close existing active, open-ended schedules
    // We only close if they started BEFORE the new effective date (sanity check)
    const { error: updateErr } = await supabase
      .from("member_schedules")
      .update({ end_date: cutoffStr, updated_at: new Date().toISOString() })
      .eq("organization_member_id", payload.organization_member_id)
      .eq("is_active", true)
      .is("end_date", null)
      .lt("effective_date", payload.effective_date); // Sanity: don't close future schedules that haven't started? Or strict overlap? 
    // For "Auto-Cutoff", we assume we are replacing the *current* running schedule.

    if (updateErr) {
      console.error("Failed to auto-cutoff schedule:", updateErr);
      // Continue? Or Return error? Typically continue if it's just an update failure, 
      // but it might cause overlap constraint violation if db has triggers.
      // For now, proceed.
    }
  }

  const { data, error } = await supabase
    .from("member_schedules")
    .insert({
      organization_member_id: payload.organization_member_id,
      work_schedule_id: payload.work_schedule_id,
      shift_id: payload.shift_id || null,
      effective_date: payload.effective_date,
      end_date: payload.end_date || null,
      is_active: payload.is_active ?? true
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, message: "Member schedule created successfully", data: data as IMemberSchedule };
};

export const updateMemberSchedule = async (id: string, payload: Partial<IMemberSchedule>) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("member_schedules")
    .update({
      ...payload,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, message: "Member schedule updated successfully", data: data as IMemberSchedule };
};

export const deleteMemberSchedule = async (id: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("member_schedules")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, message: "Member schedule deleted successfully", data: data as IMemberSchedule };
};

export const getMembersBySchedule = async (scheduleId: number | string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member_schedules")
    .select(`
      id,
      organization_member_id,
      organization_member:organization_member_id (
        id,
        user:user_id (
            first_name, last_name, display_name, email, profile_photo_url
        )
      )
    `)
    .eq("work_schedule_id", scheduleId)
    .eq("is_active", true);

  if (error) return { success: false, message: error.message, data: [] };
  return { success: true, data };
};

export const bulkDeleteMemberSchedules = async (ids: string[]) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member_schedules")
    .delete()
    .in("id", ids)
    .select();

  if (error) return { success: false, message: error.message, data: null };
  return { success: true, message: `Successfully deleted ${data?.length || 0} schedules`, data };
};

/**
 * Bulk create member_schedules secara efisien dengan Auto-Cutoff.
 * - Mencari jadwal aktif yang open-ended.
 * - Update end_date = effectiveDate - 1 hari.
 * - Insert jadwal baru.
 */
export const createMemberSchedulesBulk = async (
  workScheduleId: string | number,
  memberIds: (string | number)[],
  effectiveDate: string,
  options?: { endDate?: string }
): Promise<{ success: boolean; message?: string; data?: { inserted: number; updated: number } }> => {
  try {
    const supabase = await createClient();
    const wsIdStr = String(workScheduleId);

    const ids = memberIds
      .map((v) => (typeof v === "string" ? Number(v) : v))
      .filter((v) => Number.isFinite(v)) as number[];

    if (!effectiveDate || ids.length === 0) {
      return { success: true, data: { inserted: 0, updated: 0 } };
    }

    // 1. Calculate Cutoff Date (Yesterday)
    const effDate = new Date(effectiveDate);
    const cutoffDate = new Date(effDate);
    cutoffDate.setDate(cutoffDate.getDate() - 1);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    // 2. Perform Auto-Cutoff Update
    // Update active, open-ended schedules for these members
    // Set end_date to yesterday.
    const { data: updatedRows, error: updateErr } = await supabase
      .from("member_schedules")
      .update({ end_date: cutoffStr, updated_at: new Date().toISOString() })
      .in("organization_member_id", ids)
      .eq("is_active", true)
      .is("end_date", null)
      .lt("effective_date", effectiveDate) // Only close if they started before the new one
      .select("id");

    if (updateErr) {
      console.error("[BulkAssign] Auto-cutoff update failed:", updateErr);
      // We proceed, but conflict might occur if DB has strict checks.
    }

    // 3. Insert New Schedules (For ALL ids, since we closed conflicts)
    const rows = ids.map((id) => ({
      organization_member_id: id,
      work_schedule_id: wsIdStr,
      shift_id: null,
      effective_date: effectiveDate,
      end_date: options?.endDate ?? null,
      is_active: true,
    }));

    const { error: insertErr } = await supabase
      .from("member_schedules")
      .insert(rows);

    if (insertErr) {
      return { success: false, message: insertErr.message };
    }

    return {
      success: true,
      data: {
        inserted: ids.length,
        updated: updatedRows?.length || 0
      },
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Unknown error",
    };
  }
};
