"use server";

import { createClient } from "@/utils/supabase/server";
import { IShift } from "@/interface";

const toShiftCode = (name?: string, code?: string) => {
  const existing = typeof code === "string" ? code.trim() : "";
  if (existing) return existing;

  const base = typeof name === "string" ? name.trim() : "";
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const safe = slug || "shift";
  const suffix = Date.now().toString(36).slice(-6);
  return `${safe}-${suffix}`;
};

const normalizeTime = (value?: string | null) => {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  // Accept HH:MM or HH:MM:SS
  if (/^\d{2}:\d{2}:\d{2}$/.test(v)) return v;
  if (/^\d{2}:\d{2}$/.test(v)) return `${v}:00`;
  return v;
};

export const getAllShifts = async (organizationId?: number | string) => {
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
    .from("shifts")
    .select(
      "id, organization_id, code, name, description, start_time, end_time, overnight, break_duration_minutes, color_code, is_active, created_at, updated_at",
    )
    .eq("organization_id", finalOrgId)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: (data || []) as unknown as IShift[] };
};

export const getShiftsPage = async (
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
      .from("shifts")
      .select(
        "id, organization_id, code, name, description, start_time, end_time, overnight, break_duration_minutes, color_code, is_active, created_at, updated_at",
        { count: "estimated" },
      )
      .eq("organization_id", finalOrgId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return { success: false, message: error.message, data: [], total: 0 };
    }

    return {
      success: true,
      data: (data || []) as unknown as IShift[],
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

export async function createShift(payload: Partial<IShift>) {
  const supabase = await createClient();

  let finalOrgId = payload.organization_id;

  if (!finalOrgId) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "User not authenticated", data: null };
    }

    const { data: member, error: memberError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError || !member) {
      return { success: false, message: "User not in any organization", data: null };
    }

    finalOrgId = member.organization_id as any;
  }

  const insertPayload: Partial<IShift> = {
    ...payload,
    organization_id: String(finalOrgId),
    code: toShiftCode(payload.name, payload.code),
    start_time: normalizeTime((payload as any).start_time) as any,
    end_time: normalizeTime((payload as any).end_time) as any,
    break_duration_minutes: Number((payload as any).break_duration_minutes || 0) as any,
  };

  const { data, error } = await supabase
    .from("shifts")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, message: "Shift created successfully", data: data as unknown as IShift };
}

export async function updateShift(id: string | number, payload: Partial<IShift>) {
  const supabase = await createClient();

  const updatePayload: Partial<IShift> = {
    ...payload,
    start_time: normalizeTime((payload as any).start_time) as any,
    end_time: normalizeTime((payload as any).end_time) as any,
    break_duration_minutes: Number((payload as any).break_duration_minutes || 0) as any,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("shifts")
    .update(updatePayload)
    .eq("id", String(id))
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, message: "Shift updated successfully", data: data as unknown as IShift };
}

export async function deleteShift(id: string | number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shifts")
    .delete()
    .eq("id", String(id))
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, message: "Shift deleted successfully", data: data as unknown as IShift };
}
