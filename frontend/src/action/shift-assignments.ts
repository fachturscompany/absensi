"use server";

import { createClient } from "@/utils/supabase/server";
import { IShiftAssignment } from "@/interface";

const getPostgrestErrorExtras = (err: unknown) => {
  if (!err || typeof err !== "object") return { code: undefined, details: undefined, hint: undefined };
  const o = err as Record<string, unknown>;
  return {
    code: typeof o.code === "string" ? o.code : undefined,
    details: typeof o.details === "string" ? o.details : undefined,
    hint: typeof o.hint === "string" ? o.hint : undefined,
  };
};

export type ShiftAssignmentMemberOption = {
  id: string;
  employee_id?: string | null;
  user?: {
    id?: string;
    first_name?: string | null;
last_name?: string | null;
    display_name?: string | null;
    email?: string | null;
  } | null;
};

export type ShiftOption = {
  id: string;
  code?: string | null;
  name?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  color_code?: string | null;
  is_active?: boolean | null;
};

export const updateShiftColor = async (shiftId: string, color_code: string) => {
  try {
    const supabase = await createClient();
    const v = typeof color_code === "string" ? color_code.trim() : "";
    if (!/^#[0-9a-fA-F]{6}$/.test(v)) {
      return { success: false, message: "Invalid color code" };
    }

    const { error } = await supabase
      .from("shifts")
      .update({ color_code: v })
      .eq("id", shiftId);

    if (error) {
      const extra = getPostgrestErrorExtras(error);
      return {
        success: false,
        message: `${error.message}${extra.code ? ` (code: ${extra.code})` : ""}${extra.details ? `\n${extra.details}` : ""}${extra.hint ? `\nHint: ${extra.hint}` : ""}`,
      };
    }

    return { success: true, message: "Shift color updated" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown server error",
    };
  }
};

export const getShiftAssignmentMembersPage = async (
  organizationId: number | string | undefined,
  pageIndex = 0,
  pageSize = 10,
  search?: string,
) => {
  try {
    const supabase = await createClient();

    let finalOrgId = organizationId;

    if (!finalOrgId) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { success: false, message: "User not authenticated", data: [], total: 0 };
      }

      const { data: member, error: memberError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError || !member) {
        return { success: false, message: "User not in any organization", data: [], total: 0 };
      }

      finalOrgId = member.organization_id;
    }

    const safePageIndex = Math.max(0, Number(pageIndex) || 0);
    const safePageSize = Math.max(1, Math.min(200, Number(pageSize) || 10));
    const from = safePageIndex * safePageSize;
    const to = from + safePageSize - 1;

    let query = supabase
      .from("organization_members")
      .select(
        `id, employee_id, user:user_id (id, first_name, last_name, display_name, email)`,
        { count: "estimated" },
      )
      .eq("organization_id", finalOrgId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    const q = typeof search === "string" ? search.trim() : "";
    if (q) {
      // Filter by name only (requested): use foreignTable so PostgREST applies conditions to the joined user
      query = query.or(
        `first_name.ilike.%${q}%.ilike.%${q}%,last_name.ilike.%${q}%,display_name.ilike.%${q}%`,
        { foreignTable: "user" },
      ) as unknown as typeof query;
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      const extra = getPostgrestErrorExtras(error);
      return {
        success: false,
        message: `${error.message}${extra.code ? ` (code: ${extra.code})` : ""}${extra.details ? `\n${extra.details}` : ""}${extra.hint ? `\nHint: ${extra.hint}` : ""}`,
        data: [],
        total: 0,
      };
    }

    return {
      success: true,
      data: (data || []) as unknown as ShiftAssignmentMemberOption[],
      total: typeof count === "number" ? count : data?.length || 0,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown server error",
      data: [],
      total: 0,
    };
  }
};

export const getShiftAssignmentOptions = async (organizationId?: number | string) => {
  const supabase = await createClient();

  let finalOrgId = organizationId;

  if (!finalOrgId) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "User not authenticated", members: [], shifts: [] };
    }

    const { data: member, error: memberError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError || !member) {
      return { success: false, message: "User not in any organization", members: [], shifts: [] };
    }

    finalOrgId = member.organization_id;
  }

  const [membersRes, shiftsRes] = await Promise.all([
    supabase
      .from("organization_members")
      .select(
        `id, employee_id, user:user_id (id, first_name, last_name, display_name, email)`
      )
      .eq("organization_id", finalOrgId)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("shifts")
      .select("id, code, name, start_time, end_time, color_code, is_active")
      .eq("organization_id", finalOrgId)
      .order("created_at", { ascending: false }),
  ]);

  if (membersRes.error) {
    const extra = getPostgrestErrorExtras(membersRes.error);
    return {
      success: false,
      message: `${membersRes.error.message}${extra.code ? ` (code: ${extra.code})` : ""}${extra.details ? `\n${extra.details}` : ""}${extra.hint ? `\nHint: ${extra.hint}` : ""}`,
      members: [],
      shifts: [],
    };
  }

  if (shiftsRes.error) {
    const extra = getPostgrestErrorExtras(shiftsRes.error);
    return {
      success: false,
      message: `${shiftsRes.error.message}${extra.code ? ` (code: ${extra.code})` : ""}${extra.details ? `\n${extra.details}` : ""}${extra.hint ? `\nHint: ${extra.hint}` : ""}`,
      members: [],
      shifts: [],
    };
  }

  return {
    success: true,
    members: (membersRes.data || []) as unknown as ShiftAssignmentMemberOption[],
    shifts: (shiftsRes.data || []) as unknown as ShiftOption[],
  };
};

export const getShiftAssignmentsPage = async (
  organizationId: number | string | undefined,
  pageIndex = 0,
  pageSize = 10,
) => {
  try {
    const supabase = await createClient();

    let finalOrgId = organizationId;

    if (!finalOrgId) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { success: false, message: "User not authenticated", data: [], total: 0 };
      }

      const { data: member, error: memberError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError || !member) {
        return { success: false, message: "User not in any organization", data: [], total: 0 };
      }

      finalOrgId = member.organization_id;
    }

    const safePageIndex = Math.max(0, Number(pageIndex) || 0);
    const safePageSize = Math.max(1, Number(pageSize) || 10);
    const from = safePageIndex * safePageSize;
    const to = from + safePageSize - 1;

    const { data, error, count } = await supabase
      .from("shift_assignments")
      .select(
        `
        id,
        organization_member_id,
        shift_id,
        assignment_date,
        created_by,
        created_at,
        organization_member:organization_member_id!inner (
          id,
          employee_id,
          organization_id,
          user:user_id (id, first_name, last_name, display_name, email)
        ),
        shift:shift_id (id, code, name, start_time, end_time)
      `,
        { count: "estimated" },
      )
      .eq("organization_member.organization_id", finalOrgId)
      .order("assignment_date", { ascending: false })
      .range(from, to);

    if (error) {
      return { success: false, message: error.message, data: [], total: 0 };
    }

    return {
      success: true,
      data: (data || []) as unknown as IShiftAssignment[],
      total: typeof count === "number" ? count : data?.length || 0,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown server error",
      data: [],
      total: 0,
    };
  }
};

export const getShiftAssignmentsRange = async (
  organizationId: number | string | undefined,
  startDate: string,
  endDate: string,
) => {
  try {
    const supabase = await createClient();

    let finalOrgId = organizationId;

    if (!finalOrgId) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { success: false, message: "User not authenticated", data: [] };
      }

      const { data: member, error: memberError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError || !member) {
        return { success: false, message: "User not in any organization", data: [] };
      }

      finalOrgId = member.organization_id;
    }

    const { data, error } = await supabase
      .from("shift_assignments")
      .select(
        `
        id,
        organization_member_id,
        shift_id,
        assignment_date,
        created_by,
        created_at,
        organization_member:organization_member_id!inner (
          id,
          employee_id,
          organization_id,
          user:user_id (id, first_name, last_name, display_name, email)
        ),
        shift:shift_id (id, code, name, start_time, end_time)
      `,
      )
      .eq("organization_member.organization_id", finalOrgId)
      .gte("assignment_date", startDate)
      .lte("assignment_date", endDate)
      .order("assignment_date", { ascending: true });

    if (error) {
      const extra = getPostgrestErrorExtras(error);
      return {
        success: false,
        message: `${error.message}${extra.code ? ` (code: ${extra.code})` : ""}${extra.details ? `\n${extra.details}` : ""}${extra.hint ? `\nHint: ${extra.hint}` : ""}`,
        data: [],
      };
    }

    return { success: true, data: (data || []) as unknown as IShiftAssignment[] };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown server error",
      data: [],
    };
  }
};

export async function createShiftAssignment(payload: {
  organization_member_id: string;
  shift_id: string;
  assignment_date: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "User not authenticated", data: null };
  }

  const { data, error } = await supabase
    .from("shift_assignments")
    .insert({
      organization_member_id: payload.organization_member_id,
      shift_id: payload.shift_id,
      assignment_date: payload.assignment_date,
      created_by: user.id,
    })
    .select(
      `
      id,
      organization_member_id,
      shift_id,
      assignment_date,
      created_by,
      created_at,
      organization_member:organization_member_id (
        id,
        employee_id,
        user:user_id (id, first_name, last_name, display_name, email)
      ),
      shift:shift_id (id, code, name, start_time, end_time)
    `,
    )
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, message: "Shift assigned successfully", data: data as unknown as IShiftAssignment };
}

export async function deleteShiftAssignment(id: string | number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shift_assignments")
    .delete()
    .eq("id", String(id))
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, message: "Assignment deleted successfully", data: data as unknown as IShiftAssignment };
}
