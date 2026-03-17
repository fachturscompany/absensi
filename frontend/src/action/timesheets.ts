"use server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { format } from "date-fns";

export interface AddManualTimePayload {
    organization_member_id: number;
    timesheet_id: number;
    date: string;
    start_time: string;
    end_time: string;
    duration_seconds: number;
    notes?: string;
    activity_pct?: number;
    manual_pct?: number;
    source?: "desktop" | "web" | "manual" | "system";
    is_billable?: boolean;
    is_paid?: boolean;
    project_id?: string;
    task_id?: string;
}

export async function addManualTime(payload: AddManualTimePayload) {
    try {
        const supabase = await createClient();

        // Verify user authentication
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return { success: false, message: "User not authenticated", data: null };
        }

        // Prepare insert payload
        const insertPayload = {
            ...payload,
            source: payload.source || "manual",
        };

        // Insert into timesheet_entries
        const { data, error } = await supabase
            .from("timesheet_entries")
            .insert(insertPayload)
            .select()
            .single();

        if (error) {
            return { success: false, message: error.message, data: null };
        }

        return {
            success: true,
            message: "Manual time added successfully",
            data
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Unknown server error",
            data: null,
        };
    }
}

export interface GetTimeEntriesParams {
    startDate?: string;
    endDate?: string;
    status?: string[];
    paymentStatus?: string[];
    taskId?: number;
    projectId?: number;
    clientId?: number;
    source?: string;
    organizationId?: number;  // active org from Zustand store
}

export interface GetTimesheetApprovalsParams {
    startDate?: string;
    endDate?: string;
    status?: string;
    paymentStatus?: string;
    organizationId?: number;
}

export interface TimesheetApprovalRow {
    id: string;
    memberId: string;
    memberName: string;
    dateStart: string;
    dateEnd: string;
    status: string;
    totalHours: string;
    activityPct: number;
    paymentStatus: "paid" | "unpaid";
    submittedDate: string;
    comments?: string;
    screenshots: number;
}

export async function getTimesheetApprovals(params: GetTimesheetApprovalsParams) {
    try {
        const admin = createAdminClient();

        // Single join query: timesheets -> organization_members -> user_profiles
        let query = admin
            .from("timesheets")
            .select(`
                *,
                organization_members!inner (
                    id,
                    user_id,
                    organization_id,
                    user_profiles (
                        display_name,
                        first_name,
                        last_name,
                        email
                    )
                )
            `);

        if (params.organizationId) {
            query = query.eq("organization_members.organization_id", params.organizationId);
        }

        if (params.startDate && params.endDate) {
            query = query.gte("end_date", params.startDate).lte("start_date", params.endDate);
        } else if (params.startDate) {
            query = query.gte("end_date", params.startDate);
        } else if (params.endDate) {
            query = query.lte("start_date", params.endDate);
        }

        if (params.status && params.status !== "all") {
            query = query.eq("status", params.status);
        }

        if (params.paymentStatus && params.paymentStatus !== "all") {
            const isPaid = params.paymentStatus === "paid";
            if (params.paymentStatus === "paid" || params.paymentStatus === "unpaid") {
                query = query.eq("is_paid", isPaid);
            }
        }

        const { data, error } = await query.order("start_date", { ascending: false });

        if (error) {
            console.error("getTimesheetApprovals error:", error);
            return { success: false, message: error.message, data: [] };
        }

        const mapped: TimesheetApprovalRow[] = (data || []).map((ts: any) => {
            const om = ts.organization_members;
            const profile = om?.user_profiles;

            let memberName = `Member #${ts.organization_member_id}`;
            if (profile) {
                const dName = (profile.display_name || "").trim();
                const fName = (profile.first_name || "").trim();
                const lName = (profile.last_name || "").trim();

                if (dName) {
                    memberName = dName;
                } else if (fName || lName) {
                    memberName = `${fName} ${lName}`.trim();
                } else if (profile.email) {
                    memberName = profile.email;
                }
            }

            const totalSecs = (ts.total_tracked_seconds || 0) + (ts.total_manual_seconds || 0);
            const focusSecs = ts.focus_seconds || 0;
            const activityPct = totalSecs > 0 ? Math.round((focusSecs / totalSecs) * 100) : 0;

            const hours = Math.floor(totalSecs / 3600);
            const mins = Math.floor((totalSecs % 3600) / 60);
            const secs = totalSecs % 60;
            const totalHoursStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

            return {
                id: ts.id.toString(),
                memberId: ts.organization_member_id.toString(),
                memberName,
                dateStart: ts.start_date,
                dateEnd: ts.end_date,
                status: ts.status || "open",
                totalHours: totalHoursStr,
                activityPct,
                paymentStatus: ts.is_paid ? "paid" : "unpaid",
                submittedDate: ts.submitted_at || "",
                comments: ts.rejection_reason || undefined,
                screenshots: 0
            };
        });

        return { success: true, data: mapped };
    } catch (error: any) {
        console.error("Error getTimesheetApprovals exception:", error);
        return { success: false, message: error.message || "Failed to get approvals", data: [] };
    }
}

export async function updateTimesheetStatus(timesheetId: string | number, status: 'approved' | 'rejected', reason?: string) {
    try {
        const admin = createAdminClient();

        const supabase = await createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
            return { success: false, message: "Unauthorized" };
        }

        const updates: any = {
            status,
            updated_at: new Date().toISOString()
        };

        if (status === 'approved') {
            updates.approved_at = new Date().toISOString();
            updates.approved_by = userData.user.id;
        } else if (status === 'rejected') {
            updates.rejected_at = new Date().toISOString();
            updates.rejected_by = userData.user.id;
            updates.rejection_reason = reason || null;
        }

        const { error } = await admin
            .from("timesheets")
            .update(updates)
            .eq("id", timesheetId);

        if (error) return { success: false, message: error.message };

        return { success: true };
    } catch (error: any) {
        console.error("Error updateTimesheetStatus:", error);
        return { success: false, message: error.message || "Failed to update status" };
    }
}

export interface TimeEntryRow {
    id: string;
    memberId: string;
    memberName: string;
    projectId: string;
    projectName: string;
    clientName: string;
    taskId: string;
    taskName: string;
    date: string;
    startTime: string;
    endTime: string;
    duration: string;
    totalHours: number;
    source: 'desktop' | 'mobile' | 'web' | 'manual';
    notes: string;
    activityPct: number;
    isIdle: boolean;
    billable: boolean;
    durationSeconds?: number;
}

export interface TimesheetMember {
    id: string;
    name: string;
    email: string;
}

export interface TimesheetProject {
    id: string;
    name: string;
}

export interface TimesheetTask {
    id: string;
    title: string;
    projectId: string;
}

export async function getTimeEntries(params: GetTimeEntriesParams): Promise<{ success: boolean, data: TimeEntryRow[], message?: string }> {
    try {
        const admin = createAdminClient();

        let query = admin
            .from("time_entries")
            .select(`
                *,
                organization_members!inner (
                    id,
                    user_id,
                    user_profiles (
                        display_name,
                        first_name,
                        last_name,
                        email
                    )
                ),
                projects (
                    id,
                    name,
                    clients!client_id (
                        name
                    )
                ),
                tasks (
                    id,
                    name
                )
            `);

        if (params.organizationId) {
            query = query.eq("organization_members.organization_id", params.organizationId);
        }

        if (params.startDate) {
            query = query.gte("entry_date", params.startDate);
        }
        if (params.endDate) {
            query = query.lte("entry_date", params.endDate);
        }
        if (params.projectId) {
            query = query.eq("project_id", params.projectId);
        }

        const { data, error } = await query.order("entry_date", { ascending: false }).order("starts_at", { ascending: false });

        if (error) {
            console.error("getTimeEntries error:", error);
            return { success: false, data: [], message: error.message };
        }

        const mapped: TimeEntryRow[] = (data || []).map((row: any) => {
            const profile = row.organization_members?.user_profiles;
            const memberName = profile
                ? (profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email)
                : `Member #${row.organization_member_id}`;

            const durationSecs = row.duration_seconds || 0;
            const hours = Math.floor(durationSecs / 3600);
            const mins = Math.floor((durationSecs % 3600) / 60);
            const secs = durationSecs % 60;
            const durationStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

            // Formatting starts_at/stops_at to HH:mm:ss
            const startTime = row.starts_at ? format(new Date(row.starts_at), "HH:mm:ss") : "00:00:00";
            const endTime = row.stops_at ? format(new Date(row.stops_at), "HH:mm:ss") : "00:00:00";

            const focusSecs = row.focus_seconds || 0;
            const activityPct = durationSecs > 0 ? Math.round((focusSecs / durationSecs) * 100) : 0;

            return {
                id: row.id.toString(),
                memberId: row.organization_member_id.toString(),
                memberName,
                projectId: (row.project_id || "").toString(),
                projectName: row.projects?.name || "No Project",
                clientName: row.projects?.clients?.name || "No Client",
                taskId: (row.task_id || "").toString(),
                taskName: row.tasks?.name || "No Task",
                date: row.entry_date,
                startTime,
                endTime,
                duration: durationStr,
                totalHours: durationSecs / 3600,
                source: (row.source === 'desktop_app' ? 'desktop' : row.source) || 'manual',
                notes: row.notes || "",
                activityPct,
                isIdle: (row.idle_seconds || 0) > 0,
                billable: row.is_billable ?? true,
                durationSeconds: durationSecs
            };
        });

        return { success: true, data: mapped };
    } catch (error: any) {
        console.error("getTimeEntries exception:", error);
        return { success: false, data: [], message: error.message };
    }
}

export async function getTimesheetMembers(): Promise<{ success: boolean, data: TimesheetMember[] }> {
    try {
        const admin = createAdminClient();
        const { data, error } = await admin
            .from("organization_members")
            .select(`
                id,
                user_profiles (
                    display_name,
                    first_name,
                    last_name,
                    email
                )
            `);

        if (error) return { success: false, data: [] };

        const mapped: TimesheetMember[] = (data || []).map((m: any) => {
            const p = m.user_profiles;
            let name = `Member #${m.id}`;
            if (p) {
                const dName = (p.display_name || "").trim();
                const fName = (p.first_name || "").trim();
                const lName = (p.last_name || "").trim();

                if (dName) {
                    name = dName;
                } else if (fName || lName) {
                    name = `${fName} ${lName}`.trim();
                } else if (p.email) {
                    name = p.email;
                }
            }
            return {
                id: m.id.toString(),
                name,
                email: p?.email || ""
            };
        });

        return { success: true, data: mapped };
    } catch (e) {
        return { success: false, data: [] };
    }
}

export async function getTimesheetProjects(): Promise<{ success: boolean, data: TimesheetProject[] }> {
    try {
        const admin = createAdminClient();
        const { data, error } = await admin.from("projects").select("id, name");
        if (error) return { success: false, data: [] };
        return { success: true, data: (data || []).map((p: any) => ({ id: p.id.toString(), name: p.name })) };
    } catch (e) {
        return { success: false, data: [] };
    }
}

export async function getTimesheetTasks(): Promise<{ success: boolean, data: TimesheetTask[] }> {
    try {
        const admin = createAdminClient();
        const { data, error } = await admin.from("tasks").select("id, name, project_id");
        if (error) return { success: false, data: [] };
        return {
            success: true, data: (data || []).map((t: any) => ({
                id: t.id.toString(),
                title: t.name,
                projectId: (t.project_id || "").toString()
            }))
        };
    } catch (e) {
        return { success: false, data: [] };
    }
}

export async function addTimeEntry(payload: any): Promise<{ success: boolean, message?: string }> {
    try {
        const admin = createAdminClient();
        const { error } = await admin.from("time_entries").insert(payload);
        if (error) return { success: false, message: error.message };
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function updateTimeEntry(id: string | number, payload: any): Promise<{ success: boolean, message?: string }> {
    try {
        const admin = createAdminClient();
        const { error } = await admin.from("time_entries").update(payload).eq("id", id);
        if (error) return { success: false, message: error.message };
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function deleteTimeEntry(id: string | number): Promise<{ success: boolean, message?: string }> {
    try {
        const admin = createAdminClient();
        const { error } = await admin.from("time_entries").delete().eq("id", id);
        if (error) return { success: false, message: error.message };
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
