"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export interface JoinOrganizationResult {
    success: boolean;
    message: string;
    data?: {
        organizationId: number;
        organizationName: string;
        requestId: number;
    };
}

// ─── Public Actions ───────────────────────────────────────────────────────────

/**
 * Look up an organization by its inv_code without joining.
 * Used to preview the org name before submitting the request.
 */
export async function lookupOrganizationByCode(
    code: string
): Promise<{ success: boolean; message?: string; data?: { id: number; name: string; code: string } }> {
    try {
        const admin = createAdminClient();
        const { data, error } = await admin
            .from("organizations")
            .select("id, name, code")
            .eq("inv_code", code.trim().toUpperCase())
            .eq("is_active", true)
            .maybeSingle();

        if (error) return { success: false, message: "Error looking up organization" };
        if (!data) return { success: false, message: "Organization not found. Please check the code." };

        return { success: true, data: { id: data.id, name: data.name, code: data.code } };
    } catch {
        return { success: false, message: "Unexpected error" };
    }
}

/**
 * Submit a join request for an organization using its inv_code.
 * Creates a record in member_join_requests.
 */
export async function requestToJoinOrganization(
    invCode: string
): Promise<JoinOrganizationResult> {
    try {
        const supabase = await createClient();
        const admin = createAdminClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { success: false, message: "You must be logged in to join an organization." };
        }

        const { data: org, error: orgError } = await admin
            .from("organizations")
            .select("id, name")
            .eq("inv_code", invCode.trim().toUpperCase())
            .eq("is_active", true)
            .maybeSingle();

        if (orgError || !org) {
            return { success: false, message: "Organization not found. Please check the code." };
        }

        // Check if user is already a member
        const { data: existingMember } = await admin
            .from("organization_members")
            .select("id")
            .eq("organization_id", org.id)
            .eq("user_id", user.id)
            .maybeSingle();

        if (existingMember) {
            return { success: false, message: `You are already a member of "${org.name}".` };
        }

        // Check for existing pending request
        const { data: existingRequest } = await admin
            .from("member_join_requests")
            .select("id, status, expires_at")
            .eq("organization_id", org.id)
            .eq("requested_by", user.id)
            .eq("status", "pending")
            .maybeSingle();

        if (existingRequest) {
            const expiresAt = new Date(existingRequest.expires_at);
            const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            return {
                success: false,
                message: `You already have a pending request for "${org.name}" (expires in ${daysLeft} days). Please wait for the admin to review it.`,
            };
        }

        console.log("[JOIN] Inserting join request:", { organization_id: org.id, requested_by: user.id });

        const { data: request, error: insertError } = await admin
            .from("member_join_requests")
            .insert({
                organization_id: org.id,
                requested_by: user.id,
                status: "pending",
            })
            .select("id")
            .single();

        if (insertError || !request) {
            console.error("[JOIN] Insert error:", insertError);
            return { success: false, message: insertError?.message || "Failed to submit join request." };
        }

        return {
            success: true,
            message: `Your request to join "${org.name}" has been submitted! Please wait for an admin to approve it.`,
            data: {
                organizationId: org.id,
                organizationName: org.name,
                requestId: request.id,
            },
        };
    } catch (err) {
        console.error("[JOIN] Unexpected error in requestToJoinOrganization:", err);
        return { success: false, message: err instanceof Error ? err.message : "Unexpected error" };
    }
}

/**
 * Get the status of the user's current join request for a specific org.
 */
export async function getMyJoinRequestStatus(
    organizationId: number
): Promise<{ status: string | null; message?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { status: null, message: "Not authenticated" };

        const admin = createAdminClient();
        const { data } = await admin
            .from("member_join_requests")
            .select("status, updated_at")
            .eq("organization_id", organizationId)
            .eq("requested_by", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        return { status: data?.status ?? null };
    } catch {
        return { status: null };
    }
}

// ─── Admin Actions ────────────────────────────────────────────────────────────

export interface JoinRequestItem {
    id: number;
    status: string;
    expires_at: string;
    created_at: string;
    requested_by: string;
    requester_name: string | null;
    requester_email: string | null;
    requester_avatar: string | null;
}

/**
 * Helper: get org member row + role code via organization_member_roles → system_roles.
 * reviewed_by in member_join_requests = organization_members.id (integer).
 */
async function getReviewerInfo(
    userId: string,
    organizationId: number,
    admin: ReturnType<typeof createAdminClient>
) {
    const { data: members, error } = await admin
        .from("organization_members")
        .select("id, organization_id")
        .eq("user_id", userId)
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .limit(1);

    if (error) {
        console.error("[JOIN] getReviewerInfo member fetch error:", error);
    }

    const member = members?.[0];
    if (!member) {
        console.warn("[JOIN] No active member found for user:", userId, "in org:", organizationId);
        return null;
    }

    const { data: roleRows, error: roleError } = await admin
        .from("organization_member_roles")
        .select("role:system_roles(code)")
        .eq("organization_member_id", member.id)
        .limit(1);

    if (roleError) {
        console.error("[JOIN] getReviewerInfo role fetch error:", roleError);
    }

    const roleCode = (roleRows?.[0]?.role as any)?.code ?? null;
    return { ...member, roleCode };
}

/**
 * Get all pending join requests for the current org.
 * Only admins (A001 / SA001) can call this.
 */
export async function getJoinRequests(
    organizationId: number
): Promise<{
    success: boolean;
    data?: JoinRequestItem[];
    message?: string;
}> {
    try {
        if (!organizationId) return { success: false, message: "Organization ID required" };
        const supabase = await createClient();
        const admin = createAdminClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return { success: false, message: "Not authenticated" };

        const reviewer = await getReviewerInfo(user.id, organizationId, admin);
        if (!reviewer) return { success: false, message: "You are not a member of any organization." };
        if (reviewer.roleCode !== "owner") {
            return { success: false, message: "Only owners can view join requests." };
        }

        const { data, error } = await admin
            .from("member_join_requests")
            .select("id, status, expires_at, created_at, requested_by")
            .eq("organization_id", reviewer.organization_id)
            .eq("status", "pending")
            .order("created_at", { ascending: false });

        if (error) return { success: false, message: error.message };
        if (!data || data.length === 0) return { success: true, data: [] };

        const userIds = [...new Set(data.map((r) => r.requested_by))];
        const { data: profiles } = await admin
            .from("user_profiles")
            .select("id, first_name, last_name, display_name, profile_photo_url, email")
            .in("id", userIds);

        const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

        const items: JoinRequestItem[] = data.map((row) => {
            const profile = profileMap.get(row.requested_by) as any;
            const firstName = profile?.first_name ?? "";
            const lastName = profile?.last_name ?? "";
            const name = profile?.display_name || `${firstName} ${lastName}`.trim() || null;
            return {
                id: row.id,
                status: row.status,
                expires_at: row.expires_at,
                created_at: row.created_at,
                requested_by: row.requested_by,
                requester_name: name,
                requester_email: profile?.email ?? null,
                requester_avatar: profile?.profile_photo_url ?? null,
            };
        });

        return { success: true, data: items };
    } catch (err) {
        console.error("[JOIN] getJoinRequests error:", err);
        return { success: false, message: "Unexpected error" };
    }
}

/**
 * Approve a join request.
 * Inserts into organization_members, then assigns role via organization_member_roles.
 * reviewed_by = organization_members.id (integer).
 */
export async function approveJoinRequest(
    requestId: number,
    roleId?: number
): Promise<{ success: boolean; message: string }> {
    try {
        const supabase = await createClient();
        const admin = createAdminClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return { success: false, message: "Not authenticated" };

        // 1. Fetch the request to know the organization_id
        const { data: req, error: reqError } = await admin
            .from("member_join_requests")
            .select("id, organization_id, requested_by, status")
            .eq("id", requestId)
            .maybeSingle();

        if (reqError || !req) return { success: false, message: "Join request not found." };
        if (req.status !== "pending") return { success: false, message: `Request is already ${req.status}.` };

        // 2. Fetch reviewer info for THAT organization
        const reviewer = await getReviewerInfo(user.id, req.organization_id, admin);
        if (!reviewer) return { success: false, message: "You are not a member of this organization." };
        if (reviewer.roleCode !== "owner") {
            return { success: false, message: "Only owners can approve requests." };
        }

        // Resolve role (default U001 = regular user)
        let targetRoleId = roleId;
        if (!targetRoleId) {
            const { data: defaultRole } = await admin
                .from("system_roles")
                .select("id")
                .eq("code", "member")
                .maybeSingle();
            targetRoleId = defaultRole?.id;
        }

        // Check for existing membership
        const { data: existingMember } = await admin
            .from("organization_members")
            .select("id")
            .eq("organization_id", req.organization_id)
            .eq("user_id", req.requested_by)
            .maybeSingle();

        let memberId: number;

        if (existingMember) {
            memberId = existingMember.id;
        } else {
            // Insert member — organization_members has NO role_id column
            const { data: newMember, error: insertError } = await admin
                .from("organization_members")
                .insert({
                    organization_id: req.organization_id,
                    user_id: req.requested_by,
                    is_active: true,
                })
                .select("id")
                .single();

            if (insertError || !newMember) {
                return { success: false, message: insertError?.message ?? "Failed to create member record." };
            }
            memberId = newMember.id;
        }

        // Assign role via organization_member_roles (separate table)
        if (targetRoleId) {
            const { error: roleErr } = await admin
                .from("organization_member_roles")
                .insert({
                    organization_member_id: memberId,
                    role_id: targetRoleId,
                    assigned_by: user.id,
                });
            if (roleErr) {
                console.error("[JOIN] Role assign error:", roleErr);
                // Return error since they wouldn't have a role
                return { success: false, message: "Failed to assign role: " + roleErr.message };
            }
        }

        // Mark accepted — reviewed_by = organization_members.id (integer)
        const { error: updateError } = await admin
            .from("member_join_requests")
            .update({
                status: "accepted",
                reviewed_by: reviewer.id,
                role_id: targetRoleId,
                updated_at: new Date().toISOString(),
            })
            .eq("id", requestId);

        if (updateError) {
            console.error("[JOIN] Update request error:", updateError);
            return { success: false, message: "Failed to update request: " + updateError.message };
        }

        return { success: true, message: "Join request approved successfully." };
    } catch (err) {
        console.error("[JOIN] approveJoinRequest error:", err);
        return { success: false, message: "Unexpected error" };
    }
}

/**
 * Reject a join request.
 * reviewed_by = organization_members.id (integer).
 */
export async function rejectJoinRequest(
    requestId: number,
    note?: string
): Promise<{ success: boolean; message: string }> {
    try {
        const supabase = await createClient();
        const admin = createAdminClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return { success: false, message: "Not authenticated" };

        // 1. Fetch request to get organization_id
        const { data: req, error: reqError } = await admin
            .from("member_join_requests")
            .select("id, organization_id, status")
            .eq("id", requestId)
            .maybeSingle();
            
        if (reqError || !req) return { success: false, message: "Join request not found." };
        if (req.status !== "pending") return { success: false, message: `Request is already ${req.status}.` };

        // 2. Fetch reviewer info for THAT organization
        const reviewer = await getReviewerInfo(user.id, req.organization_id, admin);
        if (!reviewer) return { success: false, message: "Not a member of this organization." };
        if (reviewer.roleCode !== "owner") {
            return { success: false, message: "Only owners can reject requests." };
        }

        const { error } = await admin
            .from("member_join_requests")
            .update({
                status: "rejected",
                reviewed_by: reviewer.id,
                note: note ?? null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", requestId)
            .eq("organization_id", reviewer.organization_id);

        if (error) return { success: false, message: error.message };

        return { success: true, message: "Join request rejected." };
    } catch (err) {
        console.error("[JOIN] rejectJoinRequest error:", err);
        return { success: false, message: "Unexpected error" };
    }
}
