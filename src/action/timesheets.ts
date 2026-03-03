"use server";
import { createClient } from "@/utils/supabase/server";
import { createServerClient } from "@supabase/ssr";

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
        const supabase = await createClient();

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
            return { success: false, message: "Unauthorized", data: [] };
        }

        const { data: myMembers, error: myMembersErr } = await supabase
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", userData.user.id);

        if (myMembersErr || !myMembers || myMembers.length === 0) {
            return { success: false, message: "Member not found", data: [] };
        }

        let chosenOrgId = 0;
        if (params.organizationId) {
            const valid = myMembers.some((m: any) => m.organization_id === params.organizationId);
            chosenOrgId = valid ? params.organizationId : (myMembers[0]?.organization_id ?? 0);
        } else {
            const orgIds = myMembers.map((m: any) => m.organization_id);
            chosenOrgId = orgIds[0] ?? 0;
        }

        const admin = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    getAll() { return [] },
                    setAll() { }
                }
            }
        );

        const { data: orgMembers, error: orgMembersErr } = await admin
            .from("organization_members")
            .select("id, user_id, organization_id")
            .eq("organization_id", chosenOrgId);

        if (orgMembersErr) return { success: false, message: orgMembersErr.message, data: [] };
        const allMemberIds = (orgMembers || []).map((m: any) => m.id);
        if (allMemberIds.length === 0) return { success: true, data: [] };

        const memberUserMap = new Map<number, string>();
        for (const m of orgMembers || []) memberUserMap.set(m.id, m.user_id);

        const allUserIds = [...new Set(Array.from(memberUserMap.values()).filter(Boolean) as string[])];
        console.log(`[DEBUG] Fetching profiles for user IDs: ${JSON.stringify(allUserIds)}`);

        const { data: profiles, error: profileErr } = await supabase
            .from("user_profiles")
            .select("id, display_name, first_name, last_name, email")
            .in("id", allUserIds);

        if (profileErr) {
            console.error("[DEBUG] Profile Fetch Error Details:", JSON.stringify(profileErr));
        }
        console.log(`[DEBUG] Found ${profiles?.length || 0} profiles`);

        const profileMap = new Map<string, any>();
        for (const p of profiles || []) profileMap.set(p.id, p);

        let query = admin
            .from("timesheets")
            .select("*")
            .in("organization_member_id", allMemberIds)
            .order("start_date", { ascending: false });

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

        const { data: timesheets, error: tsError } = await query;
        if (tsError) return { success: false, message: tsError.message, data: [] };

        const mapped: TimesheetApprovalRow[] = (timesheets || []).map((ts: any) => {
            const userId = memberUserMap.get(ts.organization_member_id);
            const userProfile = userId ? profileMap.get(userId) : null;

            let memberName = `Member #${ts.organization_member_id}`;
            if (userProfile) {
                if (userProfile.display_name) memberName = userProfile.display_name;
                else if (userProfile.first_name || userProfile.last_name) memberName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
                else if (userProfile.email) memberName = userProfile.email;
            } else if (userId) {
                console.log(`[DEBUG] Profile NOT found for user ID ${userId} (member ${ts.organization_member_id})`);
            }

            const trackedSecs = ts.total_tracked_seconds || 0;
            const manualSecs = ts.total_manual_seconds || 0;
            const focusSecs = ts.focus_seconds || 0;
            const totalSecs = trackedSecs + manualSecs;
            const activityPct = totalSecs > 0 ? Math.round((focusSecs / totalSecs) * 100) : 0;

            let pStatus = "unpaid";
            if (ts.is_paid) pStatus = "paid";

            const hours = Math.floor(totalSecs / 3600);
            const mins = Math.floor((totalSecs % 3600) / 60);
            const secs = totalSecs % 60;
            const totalHoursStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

            return {
                id: ts.id.toString(),
                memberId: ts.organization_member_id.toString(),
                memberName: memberName,
                dateStart: ts.start_date,
                dateEnd: ts.end_date,
                status: ts.status || "open",
                totalHours: totalHoursStr,
                activityPct: activityPct,
                paymentStatus: pStatus as any,
                submittedDate: ts.submitted_at || "",
                comments: ts.rejection_reason || undefined,
                screenshots: 0
            };
        });

        return { success: true, data: mapped };
    } catch (error: any) {
        console.error("Error getTimesheetApprovals:", error);
        return { success: false, message: error.message || "Failed to get approvals", data: [] };
    }
}

export async function updateTimesheetStatus(timesheetId: string | number, status: 'approved' | 'rejected', reason?: string) {
    try {
        const admin = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    getAll() { return [] },
                    setAll() { }
                }
            }
        );

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

export async function getTimeEntries(_params: any): Promise<{ success: boolean, data: TimeEntryRow[], message?: string }> {
    return { success: true, data: [] }; // TODO: implement
}

export async function getTimesheetMembers(): Promise<{ success: boolean, data: TimesheetMember[] }> {
    return { success: true, data: [] }; // TODO: implement
}

export async function getTimesheetProjects(): Promise<{ success: boolean, data: TimesheetProject[] }> {
    return { success: true, data: [] }; // TODO: implement
}

export async function getTimesheetTasks(): Promise<{ success: boolean, data: TimesheetTask[] }> {
    return { success: true, data: [] }; // TODO: implement
}

export async function addTimeEntry(_payload: any): Promise<{ success: boolean, message?: string }> {
    return { success: true }; // TODO: implement
}

export async function updateTimeEntry(_id: string | number, _payload: any): Promise<{ success: boolean, message?: string }> {
    return { success: true }; // TODO: implement
}

export async function deleteTimeEntry(_id: string | number): Promise<{ success: boolean, message?: string }> {
    return { success: true }; // TODO: implement
}
