"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getUserOrganization } from "@/utils/get-user-org";
import type {
    IProject,
    IProjectTeamProject,
    IProjectTeamMember,
    IProjectWithMembers,
    IProjectMember,
    ISimpleMember,
    ISupabaseProjectTeamMember,
    CreateProjectPayload,
    UpdateProjectPayload,
} from "@/interface";

export const getAllProjects = async (organizationId?: number | string) => {
    const supabase = await createClient();

    let finalOrgId = organizationId;
    if (!finalOrgId) {
        try {
            finalOrgId = await getUserOrganization(supabase);
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Error fetching organization";
            return { success: false, message: msg, data: [] as IProject[] };
        }
    }

    const { data, error } = await supabase
        .from("projects")
        .select(`
            *,
            organizations(id, name),
            team_projects(team_id, teams(id, name)),
            tasks(count)
        `)
        .eq("organization_id", finalOrgId)
        .neq("lifecycle_status", "deleted")
        .order("name", { ascending: true });

    if (error) {
        console.error("[getAllProjects] error:", error.message);
        return { success: false, message: error.message, data: [] as IProject[] };
    }

    const allTeamIds: number[] = [];
    (data ?? []).forEach((proj) => {
        (proj.team_projects as IProjectTeamProject[] ?? []).forEach((tp) => {
            if (tp.team_id && !allTeamIds.includes(tp.team_id)) {
                allTeamIds.push(tp.team_id);
            }
        });
    });

    const adminClient = createAdminClient();
    const teamMembersByTeamId: Record<number, IProjectTeamMember[]> = {};

    if (allTeamIds.length > 0) {
        const { data: tmData, error: tmError } = await adminClient
            .from("team_members")
            .select(`
                team_id,
                organization_member_id,
                role,
                organization_members!team_members_organization_member_id_fkey(
                    id,
                    user_id,
                    user:user_id(
                        id,
                        first_name,
                        last_name,
                        profile_photo_url
                    )
                )
            `)
            .in("team_id", allTeamIds);

        if (tmError) {
            console.error("[getAllProjects] team_members error:", tmError);
        } else {
            (tmData as ISupabaseProjectTeamMember[]).forEach((raw) => {
                const tid = raw.team_id;
                const rawOrgMember = Array.isArray(raw.organization_members)
                    ? raw.organization_members[0] ?? null
                    : raw.organization_members ?? null;
                const rawUser = rawOrgMember
                    ? (Array.isArray(rawOrgMember.user) ? rawOrgMember.user[0] ?? null : rawOrgMember.user)
                    : null;
                const tm: IProjectTeamMember = {
                    team_id: raw.team_id,
                    organization_member_id: raw.organization_member_id,
                    role: raw.role,
                    organization_members: rawOrgMember
                        ? { id: rawOrgMember.id, user_id: rawOrgMember.user_id, user: rawUser }
                        : null,
                };
                if (!teamMembersByTeamId[tid]) teamMembersByTeamId[tid] = [];
                teamMembersByTeamId[tid].push(tm);
            });
        }
    }

    const enrichedData: IProject[] = (data ?? []).map((proj) => ({
        ...proj,
        team_projects: (proj.team_projects as IProjectTeamProject[] ?? []).map((tp) => ({
            ...tp,
            teams: tp.teams ? {
                ...tp.teams,
                team_members: teamMembersByTeamId[tp.team_id] ?? []
            } : null,
        })),
    }));

    return { success: true, data: enrichedData };
};

export const getProjectNames = async (organizationId: number | string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("organization_id", organizationId)
        .neq("lifecycle_status", "deleted")
        .order("name", { ascending: true });

    if (error) return { success: false, data: [] as { id: number; name: string }[] };
    return { success: true, data: (data ?? []) as { id: number; name: string }[] };
};

export const getProjectWithMembers = async (
    id: string | number
): Promise<{ success: boolean; message?: string; data: IProjectWithMembers | null }> => {
    const adminClient = createAdminClient();

    const { data: project, error: projectError } = await adminClient
        .from("projects")
        .select(`*, organizations(id, name)`)
        .eq("id", id)
        .single();

    if (projectError || !project) {
        return { success: false, message: projectError?.message ?? "Project not found", data: null };
    }

    const { data: tpData } = await adminClient
        .from("team_projects")
        .select("team_id")
        .eq("project_id", id);

    const teamIds = (tpData ?? []).map((tp: { team_id: number }) => tp.team_id);

    if (teamIds.length === 0) {
        return { success: true, data: { ...project, members: [] } };
    }

    const { data: teamMembers, error: tmError } = await adminClient
        .from("team_members")
        .select(`
            team_id,
            organization_members!team_members_organization_member_id_fkey(
                id,
                user_id,
                user:user_id(id, first_name, last_name, profile_photo_url)
            )
        `)
        .in("team_id", teamIds);

    if (tmError) console.error("[getProjectWithMembers] team_members error:", tmError);

    const memberMap = new Map<string, IProjectMember>();
    (teamMembers as ISupabaseProjectTeamMember[] ?? []).forEach((raw) => {
        const rawOrgMember = Array.isArray(raw.organization_members)
            ? raw.organization_members[0] ?? null
            : raw.organization_members ?? null;
        const profile = rawOrgMember
            ? (Array.isArray(rawOrgMember.user) ? rawOrgMember.user[0] ?? null : rawOrgMember.user)
            : null;
        if (rawOrgMember && profile) {
            const uid = profile.id ?? rawOrgMember.user_id;
            if (uid && !memberMap.has(uid)) {
                memberMap.set(uid, {
                    id: String(rawOrgMember.id),
                    userId: uid,
                    name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Unknown",
                    photoUrl: profile.profile_photo_url,
                });
            }
        }
    });

    return { success: true, data: { ...project, members: Array.from(memberMap.values()) } };
};

export const createProject = async (
    payload: CreateProjectPayload,
    organizationId?: number
) => {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthenticated" };

    let orgId = organizationId;
    if (!orgId) {
        try {
            orgId = await getUserOrganization(supabase);
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to get organization";
            return { success: false, message: msg };
        }
    }

    const { count } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId);

    const code = `PRJ-${orgId}-${count != null ? count + 1 : Date.now()}`;

    const { data, error } = await supabase
        .from("projects")
        .insert({
            organization_id: orgId,
            code,
            name: payload.name,
            description: payload.description ?? null,
            priority: payload.priority ?? "medium",
            is_billable: payload.is_billable !== false,
            start_date: payload.start_date ?? null,
            end_date: payload.end_date ?? null,
            lifecycle_status: payload.lifecycle_status ?? "active",
            metadata: payload.metadata ?? {},
        })
        .select()
        .single();

    if (error) return { success: false, message: error.message };

    if (payload.teams && payload.teams.length > 0) {
        await supabase.from("team_projects").insert(
            payload.teams.map((teamId) => ({ team_id: teamId, project_id: data.id }))
        );
    }

    return { success: true, data };
};

export const updateProject = async (id: number, payload: UpdateProjectPayload) => {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};
    if (payload.name !== undefined)             updateData.name             = payload.name;
    if (payload.description !== undefined)      updateData.description      = payload.description;
    if (payload.priority !== undefined)         updateData.priority         = payload.priority;
    if (payload.is_billable !== undefined)      updateData.is_billable      = payload.is_billable;
    if (payload.start_date !== undefined)       updateData.start_date       = payload.start_date;
    if (payload.end_date !== undefined)         updateData.end_date         = payload.end_date;
    if (payload.lifecycle_status !== undefined) updateData.lifecycle_status = payload.lifecycle_status;
    if (payload.metadata !== undefined)         updateData.metadata         = payload.metadata;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    if (error) return { success: false, message: error.message };

    if (payload.teams !== undefined) {
        await supabase.from("team_projects").delete().eq("project_id", id);
        if (payload.teams.length > 0) {
            await supabase.from("team_projects").insert(
                payload.teams.map((teamId) => ({ team_id: teamId, project_id: id }))
            );
        }
    }

    return { success: true, data };
};

export const archiveProject  = async (id: number) => updateProject(id, { lifecycle_status: "archived" });
export const unarchiveProject = async (id: number) => updateProject(id, { lifecycle_status: "active" });

export const deleteProject = async (id: number) => {
    const supabase = await createClient();
    const { error } = await supabase
        .from("projects")
        .update({ lifecycle_status: "deleted", deleted_at: new Date().toISOString() })
        .eq("id", id);

    if (error) return { success: false, message: error.message };
    return { success: true };
};

export const getSimpleMembersForDropdown = async (
    organizationId: number | string
): Promise<{ success: boolean; data: ISimpleMember[] }> => {
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
        .from("organization_members")
        .select(`
            id,
            department_id,
            user_profiles!organization_members_user_id_fkey(
                id,
                first_name,
                last_name,
                display_name,
                profile_photo_url
            )
        `)
        .eq("organization_id", organizationId)
        .eq("is_active", true);

    if (error) {
        console.error("[getSimpleMembersForDropdown] error:", error.message);
        return { success: false, data: [] };
    }

    const members: ISimpleMember[] = (data ?? [])
        .map((m) => {
            const profile = m.user_profiles as {
                first_name?: string | null;
                last_name?: string | null;
                display_name?: string | null;
                profile_photo_url?: string | null;
            } | null;
            const name = profile
                ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.display_name || "Unknown"
                : "Unknown";
            return {
                id: String(m.id),
                name,
                photoUrl: profile?.profile_photo_url ?? null,
                department_id: m.department_id ? String(m.department_id) : null,
            };
        })
        .filter((m) => m.name !== "Unknown");

    return { success: true, data: members };
};

// ─── Project Members ──────────────────────────────────────────────────────────

export interface ProjectMemberRow {
    id: number;
    organization_member_id: number;
    role: "manager" | "lead" | "member" | "viewer";
    hourly_rate: number | null;
    joined_at: string;
    name: string;
    photoUrl: string | null;
}

export const getProjectMembers = async (
    projectId: number | string
): Promise<{ success: boolean; data: ProjectMemberRow[] }> => {
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
        .from("project_members")
        .select(`
            id,
            organization_member_id,
            role,
            hourly_rate,
            joined_at,
            organization_members!project_members_organization_member_id_fkey(
                id,
                user_profiles!organization_members_user_id_fkey(
                    first_name,
                    last_name,
                    display_name,
                    profile_photo_url
                )
            )
        `)
        .eq("project_id", projectId);

    if (error) {
        console.error("[getProjectMembers] error:", error.message);
        return { success: false, data: [] };
    }

    const rows: ProjectMemberRow[] = (data ?? []).map((row: any) => {
        const om = Array.isArray(row.organization_members)
            ? row.organization_members[0]
            : row.organization_members;
        const profile = om
            ? Array.isArray(om.user_profiles)
                ? om.user_profiles[0]
                : om.user_profiles
            : null;
        const name = profile
            ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.display_name || "Unknown"
            : "Unknown";
        return {
            id: row.id,
            organization_member_id: row.organization_member_id,
            role: row.role ?? "member",
            hourly_rate: row.hourly_rate ?? null,
            joined_at: row.joined_at,
            name,
            photoUrl: profile?.profile_photo_url ?? null,
        };
    });

    return { success: true, data: rows };
};

export const addProjectMember = async (
    projectId: number,
    organizationMemberId: number,
    role: "manager" | "lead" | "member" | "viewer" = "member"
): Promise<{ success: boolean; message?: string }> => {
    const supabase = await createClient();

    const { error } = await supabase
        .from("project_members")
        .insert({ project_id: projectId, organization_member_id: organizationMemberId, role });

    if (error) return { success: false, message: error.message };
    return { success: true };
};

export const removeProjectMember = async (
    projectId: number,
    organizationMemberId: number
): Promise<{ success: boolean; message?: string }> => {
    const supabase = await createClient();

    const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("project_id", projectId)
        .eq("organization_member_id", organizationMemberId);

    if (error) return { success: false, message: error.message };
    return { success: true };
};

export const updateProjectMemberRole = async (
    projectId: number,
    organizationMemberId: number,
    role: "manager" | "lead" | "member" | "viewer"
): Promise<{ success: boolean; message?: string }> => {
    const supabase = await createClient();

    const { error } = await supabase
        .from("project_members")
        .update({ role })
        .eq("project_id", projectId)
        .eq("organization_member_id", organizationMemberId);

    if (error) return { success: false, message: error.message };
    return { success: true };
};

// ─── Project Teams ────────────────────────────────────────────────────────────

export interface ProjectTeamRow {
    team_id: number;
    name: string;
    description: string | null;
    member_count: number;
    assigned_at: string;
}

export const getProjectTeams = async (
    projectId: number | string
): Promise<{ success: boolean; data: ProjectTeamRow[] }> => {
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
        .from("team_projects")
        .select(`
            team_id,
            assigned_at,
            teams!team_projects_team_id_fkey(
                id,
                name,
                description
            )
        `)
        .eq("project_id", projectId);

    if (error) {
        console.error("[getProjectTeams] error:", error.message);
        return { success: false, data: [] };
    }

    const teamIds = (data ?? []).map((row: any) => {
        const t = Array.isArray(row.teams) ? row.teams[0] : row.teams;
        return t?.id as number;
    }).filter(Boolean);

    // count members per team
    const memberCounts: Record<number, number> = {};
    if (teamIds.length > 0) {
        const { data: countData } = await adminClient
            .from("team_members")
            .select("team_id")
            .in("team_id", teamIds);

        (countData ?? []).forEach((row: { team_id: number }) => {
            memberCounts[row.team_id] = (memberCounts[row.team_id] ?? 0) + 1;
        });
    }

    const rows: ProjectTeamRow[] = (data ?? []).map((row: any) => {
        const t = Array.isArray(row.teams) ? row.teams[0] : row.teams;
        return {
            team_id: row.team_id,
            name: t?.name ?? "Unknown",
            description: t?.description ?? null,
            member_count: memberCounts[row.team_id] ?? 0,
            assigned_at: row.assigned_at,
        };
    });

    return { success: true, data: rows };
};

export const addProjectTeam = async (
    projectId: number,
    teamId: number
): Promise<{ success: boolean; message?: string }> => {
    const supabase = await createClient();

    const { error } = await supabase
        .from("team_projects")
        .insert({ project_id: projectId, team_id: teamId });

    if (error) return { success: false, message: error.message };
    return { success: true };
};

export const removeProjectTeam = async (
    projectId: number,
    teamId: number
): Promise<{ success: boolean; message?: string }> => {
    const supabase = await createClient();

    const { error } = await supabase
        .from("team_projects")
        .delete()
        .eq("project_id", projectId)
        .eq("team_id", teamId);

    if (error) return { success: false, message: error.message };
    return { success: true };
};