"use server";
import { createClient } from "@/utils/supabase/server";

import { IWorkSchedule, IWorkScheduleDetail } from "@/interface"



const toScheduleCode = (name?: string, code?: string) => {
    const existing = typeof code === "string" ? code.trim() : "";
    if (existing) return existing;

    const base = typeof name === "string" ? name.trim() : "";
    const slug = base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const safe = slug || "schedule";
    const suffix = Date.now().toString(36).slice(-6);
    return `${safe}-${suffix}`;
}



export const getAllWorkSchedules = async (organizationId?: number | string) => {
    const supabase = await createClient();

    let finalOrgId = organizationId;

    // If no organizationId provided, get from current user
    if (!finalOrgId) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { success: false, message: "User not authenticated", data: [] };
        }

        // Get user's organization membership
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

    // Fetch work schedules ONLY for user's organization
    const { data, error } = await supabase
        .from("work_schedules")
        .select(
            "id, organization_id, code, name, description, schedule_type, is_default, is_active, created_at, updated_at",
        )
        .eq("organization_id", finalOrgId)
        .order("created_at", { ascending: false });

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IWorkSchedule[] };
};

export const getWorkSchedulesPage = async (
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
            .from("work_schedules")
            .select(
                "id, organization_id, code, name, description, schedule_type, is_default, is_active, created_at, updated_at",
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
            data: (data || []) as IWorkSchedule[],
            total: typeof count === "number" ? count : (data?.length || 0),
        };
    } catch (error) {
        console.error("[getWorkSchedulesPage] Unexpected error:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Unknown server error",
            data: [],
            total: 0,
        };
    }
};
export async function getWorkScheduleById(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("work_schedules")
        .select("*, work_schedule_details(*)")
        .eq("id", id)
        .single()

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IWorkSchedule[] };
}
export async function getWorkScheduleDetails(workScheduleId: number) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("work_schedule_details")
        .select("*")
        .eq("work_schedule_id", workScheduleId)

    if (error) return { success: false, message: error.message }
    return { success: true, data }
}

function toMinutes(v?: string | null) {
    if (!v) return null
    // Support HH:mm or HH:mm:ss and ignore AM/PM if present
    const clean = String(v).split(/\s/)[0] || ""
    const parts = clean.split(":").map((x) => parseInt(x, 10))
    if (parts.some((n) => Number.isNaN(n))) return null
    const [hh = 0, mm = 0] = parts
    return hh * 60 + mm
}

function getDayNameLabel(day: number) {
    const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return names[day] || `Day ${day}`
}

function validateDetailInput(payload: Partial<IWorkScheduleDetail>) {
    const isWorking = Boolean(payload.is_working_day)
    if (!isWorking) return { ok: true as const }

    const dayLabel = getDayNameLabel(payload.day_of_week ?? -1)
    const s = toMinutes(payload.start_time as string | undefined)
    const e = toMinutes(payload.end_time as string | undefined)
    const bs = toMinutes(payload.break_start as string | undefined)
    const be = toMinutes(payload.break_end as string | undefined)
    const coreStart = toMinutes(payload.core_hours_start as string | undefined)
    const coreEnd = toMinutes(payload.core_hours_end as string | undefined)

    if (s == null) return { ok: false as const, message: `[${dayLabel}] Start time is required` }
    if (e == null) return { ok: false as const, message: `[${dayLabel}] End time is required` }
    if (e <= s) return { ok: false as const, message: `[${dayLabel}] End time must be later than start time` }

    // Core hours validation
    if (coreStart != null && coreEnd != null && coreEnd <= coreStart) {
        return { ok: false as const, message: `[${dayLabel}] Core hours end must be later than core hours start` }
    }
    if (s != null && coreStart != null && s > coreStart) {
        return { ok: false as const, message: `[${dayLabel}] Start time must be earlier than core hours start` }
    }
    if (e != null && coreEnd != null && e < coreEnd) {
        return { ok: false as const, message: `[${dayLabel}] End time must be later than core hours end` }
    }

    const hasBs = bs != null
    const hasBe = be != null
    if (hasBs !== hasBe) return { ok: false as const, message: `[${dayLabel}] Break start and break end must both be filled` }
    if (!hasBs || !hasBe) return { ok: true as const }
    if (be! <= bs!) return { ok: false as const, message: `[${dayLabel}] Break end must be later than break start` }
    if (bs! <= s) return { ok: false as const, message: `[${dayLabel}] Break start must be after start time` }
    if (be! >= e) return { ok: false as const, message: `[${dayLabel}] Break end must be before end time` }

    return { ok: true as const }
}

export async function createWorkSchedule(payload: Partial<IWorkSchedule>) {
    const supabase = await createClient();

    const insertPayload: Partial<IWorkSchedule> = {
        ...payload,
        code: toScheduleCode(payload.name, payload.code),
    }

    const { data, error } = await supabase
        .from("work_schedules")
        .insert(insertPayload)
        .select()
        .single()

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IWorkSchedule[] };
}

export async function updateWorkSchedule(id: string | number, payload: Partial<IWorkSchedule>) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("work_schedules")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", String(id))
        .select()
        .single()

    if (error) {
        console.error('❌ Update Work Schedule Error:', error);
        return { success: false, message: error.message, data: null };
    }

    return { success: true, data: data as IWorkSchedule, message: "Schedule updated successfully" };
}


export const deleteWorkSchedule = async (scheduleId: string | number) => {
    const id = String(scheduleId) // convert to string
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("work_schedules").delete().eq("id", id)
        .select()
        .single();

    if (error) {
        return { success: false, message: error.message, data: null };
    }
    return { success: true, message: "Deleted successfully", data: data as IWorkSchedule };
};

// ---------------- WorkScheduleDetail ----------------

export async function createWorkScheduleDetail(payload: Partial<IWorkScheduleDetail>) {
    const supabase = await createClient();
    const v = validateDetailInput(payload)
    if (!v.ok) {
        return { success: false, message: v.message, data: null };
    }
    const { data, error } = await supabase
        .from("work_schedule_details")
        .insert(payload)
        .select()
        .single()

    if (error) {
        return { success: false, message: error.message, data: null };
    }
    return { success: true, message: "Schedule added successfully", data: data as IWorkScheduleDetail };
};

export async function updateWorkScheduleDetail(id: string | number, payload: Partial<IWorkScheduleDetail>) {
    const supabase = await createClient();
    const v = validateDetailInput(payload)
    if (!v.ok) {
        return { success: false, message: v.message, data: null };
    }
    const { data, error } = await supabase
        .from("work_schedule_details")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", String(id))
        .select()
        .single()

    if (error) {
        console.error('❌ Update Work Schedule Detail Error:', error);
        return { success: false, message: error.message, data: null };
    }
    return { success: true, message: "Schedule detail updated successfully", data: data as IWorkScheduleDetail };
}

export const deleteWorkScheduleDetail = async (id: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("work_schedule_details").delete().eq("id", id)
        .select()
        .single();

    if (error) {
        return { success: false, message: error.message, data: null };
    }
    return { success: true, message: "deleted successfully", data: data as IWorkScheduleDetail };
};

export async function upsertWorkScheduleDetails(
    workScheduleId: number,
    items: Array<Partial<IWorkScheduleDetail>>,
) {
    const supabase = await createClient();

    for (const it of items) {
        const v = validateDetailInput(it)
        if (!v.ok) {
            return { success: false, message: v.message, data: [] as IWorkScheduleDetail[] }
        }
    }

    const rows = (items || []).map((it) => ({
        work_schedule_id: workScheduleId,
        day_of_week: it.day_of_week,
        is_working_day: Boolean(it.is_working_day),
        start_time: (it.start_time ?? null) as string | null,
        end_time: (it.end_time ?? null) as string | null,
        core_hours_start: (it.core_hours_start ?? null) as string | null,
        core_hours_end: (it.core_hours_end ?? null) as string | null,
        break_start: (it.break_start ?? null) as string | null,
        break_end: (it.break_end ?? null) as string | null,
        break_duration_minutes: (it.break_start && it.break_end)
            ? Math.round((new Date(`1970-01-01T${it.break_end}`).getTime() - new Date(`1970-01-01T${it.break_start}`).getTime()) / 60000)
            : (typeof it.break_duration_minutes === 'number' ? it.break_duration_minutes : null),
        flexible_hours: Boolean(it.flexible_hours),
    }))

    const { data, error } = await supabase
        .from("work_schedule_details")
        .upsert(rows, { onConflict: 'work_schedule_id,day_of_week' })
        .select()

    if (error) {
        return { success: false, message: error.message, data: [] as IWorkScheduleDetail[] }
    }
    return { success: true, data: (data || []) as IWorkScheduleDetail[] }
}

// Set a single default work schedule within an organization
export async function setDefaultWorkSchedule(id: string | number) {
    const supabase = await createClient();

    // Fetch the schedule to get its organization_id
    const { data: target, error: fetchErr } = await supabase
        .from('work_schedules')
        .select('id, organization_id')
        .eq('id', String(id))
        .maybeSingle();

    if (fetchErr || !target) {
        return { success: false as const, message: fetchErr?.message || 'Schedule not found', data: null };
    }

    const orgId = (target as { organization_id: number | string }).organization_id;

    // Unset default for all schedules in the same organization
    const { error: unsetErr } = await supabase
        .from('work_schedules')
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq('organization_id', orgId);

    if (unsetErr) {
        return { success: false as const, message: unsetErr.message, data: null };
    }

    // Set selected schedule as default (and active)
    const { data: updated, error: setErr } = await supabase
        .from('work_schedules')
        .update({ is_default: true, is_active: true, updated_at: new Date().toISOString() })
        .eq('id', String(id))
        .select('id, organization_id, code, name, description, schedule_type, is_default, is_active, created_at, updated_at')
        .single();

    if (setErr) {
        return { success: false as const, message: setErr.message, data: null };
    }

    return { success: true as const, message: 'Default schedule set successfully', data: updated as IWorkSchedule };
}

export const deleteMultipleWorkSchedules = async (ids: (string | number)[]) => {
    const supabase = await createClient();
    const stringIds = ids.map(id => String(id));

    const { data, error } = await supabase
        .from("work_schedules")
        .delete()
        .in("id", stringIds)
        .select();

    if (error) {
        return { success: false, message: error.message, data: null };
    }
    return { success: true, message: `Successfully deleted ${data?.length || 0} schedules`, data };
};

export const updateMultipleWorkSchedulesStatus = async (ids: (string | number)[], is_active: boolean) => {
    const supabase = await createClient();
    const stringIds = ids.map(id => String(id));

    const { data, error } = await supabase
        .from("work_schedules")
        .update({ is_active, updated_at: new Date().toISOString() })
        .in("id", stringIds)
        .select();

    if (error) {
        return { success: false, message: error.message, data: null };
    }
    return { success: true, message: `Successfully updated ${data?.length || 0} schedules`, data };
};

