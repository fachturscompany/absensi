"use server";

import { createClient } from "@/utils/supabase/server";
import { ITeams, ITeamMember } from "@/interface";

// ─── GET TEAMS ──────────────────────────────────────────────────────────────
export const getTeams = async (
  organizationId?: number,
  includeInactive: boolean = true
) => {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, message: "User not logged in", data: [] as ITeams[] };
  }

  let targetOrgId = organizationId;

  if (!targetOrgId) {
    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) {
      return { success: true, message: "User not in any organization", data: [] as ITeams[] };
    }
    targetOrgId = member.organization_id;
  }

  let query = supabase
    .from("teams")
    .select("id, organization_id, code, name, description, is_active, created_at, updated_at, settings, metadata")
    .eq("organization_id", targetOrgId);

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query.order("name", { ascending: true });

  if (error) {
    console.error("getTeams error:", error);
    return { success: false, message: error.message, data: [] as ITeams[] };
  }

  return { success: true, data: data as ITeams[] };
};

// ─── GET TEAM BY SLUG ───────────────────────────────────────────────────────
export const getTeamBySlug = async (slug: string) => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "User not logged in", data: null };

  // Ambil org_id user
  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const orgId = member?.organization_id;

  let query = supabase.from("teams").select("*");
  if (orgId) {
    query = query.eq("organization_id", orgId);
  }

  // Coba cari berdasarkan code
  const { data: byCode } = await query.eq("code", slug).maybeSingle();
  if (byCode) return { success: true, data: byCode as ITeams };

  // Coba cari berdasarkan name
  const { data: byName } = await supabase.from("teams").select("*")
    .eq("organization_id", orgId)
    .eq("name", slug).maybeSingle();
  if (byName) return { success: true, data: byName as ITeams };

  // Coba cari berdasarkan ID jika slug berupa angka
  const numericId = Number(slug);
  if (!isNaN(numericId)) {
    const { data: byId } = await supabase.from("teams").select("*")
      .eq("organization_id", orgId)
      .eq("id", numericId).maybeSingle();
    if (byId) return { success: true, data: byId as ITeams };
  }

  return { success: false, message: "Team not found", data: null };
};

// ─── GET TEAM MEMBERS ───────────────────────────────────────────────────────
// Menggunakan multi-step query manual karena Supabase nested join
// untuk user_profiles via organization_members tidak reliable
// tanpa mengetahui nama FK constraint yang tepat.
export const getTeamMembers = async (teamId: number) => {
  const supabase = await createClient();

  if (!teamId || isNaN(teamId)) {
    return { success: false, message: "Invalid Team ID", data: [] as ITeamMember[] };
  }

  // Step 1: Fetch team_members + positions detail
  // Kita pisahkan penarikan kolom 'positions' (ID) dan alias joinnya
  const { data: teamMembers, error: tmError } = await supabase
    .from("team_members")
    .select(`
      id,
      team_id,
      organization_member_id,
      is_primary_team,
      joined_at,
      positions,
      positions_detail:positions (
        id,
        title
      )
    `)
    .eq("team_id", teamId);

  if (tmError) {
    console.error("getTeamMembers step1 error:", tmError);
    return { success: false, message: tmError.message, data: [] as ITeamMember[] };
  }

  if (!teamMembers || teamMembers.length === 0) {
    return { success: true, data: [] as ITeamMember[] };
  }

  // Step 2: Fetch organization_members untuk semua member_id
  const memberIds = teamMembers.map((tm) => tm.organization_member_id)

  const { data: orgMembers, error: omError } = await supabase
    .from("organization_members")
    .select("id, user_id, is_active")
    .in("id", memberIds);

  if (omError) {
    console.error("getTeamMembers step2 error:", omError);
    return { success: false, message: omError.message, data: [] as ITeamMember[] };
  }

  // Step 3: Fetch user_profiles untuk semua user_id
  const userIds = (orgMembers ?? []).map((om) => om.user_id).filter(Boolean)

  const { data: userProfiles, error: upError } = await supabase
    .from("user_profiles")
    .select("id, first_name, last_name, display_name, profile_photo_url, email")
    .in("id", userIds);

  if (upError) {
    console.error("getTeamMembers step3 error:", upError);
    return { success: false, message: upError.message, data: [] as ITeamMember[] };
  }

  // Step 4: Gabungkan semua data
  const orgMemberMap = new Map((orgMembers ?? []).map((om) => [om.id, om]))
  const userProfileMap = new Map((userProfiles ?? []).map((up) => [up.id, up]))

  const mapped: ITeamMember[] = (teamMembers ?? []).map((tm: any) => {
    const orgMember = orgMemberMap.get(tm.organization_member_id) ?? null
    const userProfile = orgMember ? (userProfileMap.get(orgMember.user_id) ?? null) : null

    return {
      id: tm.id,
      team_id: tm.team_id,
      organization_member_id: tm.organization_member_id,
      is_primary_team: tm.is_primary_team ?? false,
      joined_at: tm.joined_at,
      positions: tm.positions ?? null,
      positions_detail: tm.positions_detail ?? null,
      organization_members: orgMember
        ? {
            id: orgMember.id,
            is_active: orgMember.is_active,
            user: userProfile
              ? {
                  first_name: userProfile.first_name ?? null,
                  last_name: userProfile.last_name ?? null,
                  display_name: userProfile.display_name ?? null,
                  profile_photo_url: userProfile.profile_photo_url ?? null,
                  email: userProfile.email ?? null,
                }
              : null,
          }
        : { id: 0, is_active: false, user: null },
    }
  })

  return { success: true, data: mapped };
};

// ─── CREATE TEAM ────────────────────────────────────────────────────────────
export const createTeam = async (payload: Partial<ITeams>) => {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, message: "User not logged in" };
  }

  const { data, error } = await supabase
    .from("teams")
    .insert([{
      organization_id: payload.organization_id,
      code: null, // auto-generated by database trigger
      name: payload.name,
      description: payload.description || null,
      is_active: payload.is_active ?? true,
      settings: payload.settings || null,
      metadata: payload.metadata || null,
    }])
    .select()
    .single();

  if (error) {
    console.error("createTeam error:", error);
    return { success: false, message: error.message };
  }

  return { success: true, message: "Team created successfully", data };
};

// ─── UPDATE TEAM ────────────────────────────────────────────────────────────
export const updateTeam = async (id: number, payload: Partial<ITeams>) => {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, message: "User not logged in" };
  }

  const { data, error } = await supabase
    .from("teams")
    .update({
      name: payload.name,
      description: payload.description || null,
      is_active: payload.is_active,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("updateTeam error:", error);
    return { success: false, message: error.message };
  }

  return { success: true, message: "Team updated successfully", data };
};

// ─── DELETE TEAM ────────────────────────────────────────────────────────────
export const deleteTeam = async (id: number) => {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, message: "User not logged in" };
  }

  const { error } = await supabase.from("teams").delete().eq("id", id);

  if (error) {
    console.error("deleteTeam error:", error);
    return { success: false, message: error.message };
  }

  return { success: true, message: "Team deleted successfully" };
};