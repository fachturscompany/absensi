"use server";

import { createClient } from "@/utils/supabase/server";
import { ITeams, ITeamMember } from "@/interface";

// ─── GET TEAMS ──────────────────────────────────────────────────────────────
// FIX: includeInactive default diubah ke true agar filter di client side bisa
// menampilkan semua data (active & inactive). Page yg butuh active saja bisa
// pass includeInactive: false secara eksplisit.
export const getTeams = async (
  organizationId?: number,
  includeInactive: boolean = true
) => {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

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
      return {
        success: true,
        message: "User not in any organization",
        data: [] as ITeams[],
      };
    }
    targetOrgId = member.organization_id;
  }

  let query = supabase
    .from("teams")
    .select(
      "id, organization_id, code, name, description, is_active, created_at, updated_at, settings, metadata"
    )
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
// Coba match by `code` dulu, fallback ke `id` jika slug adalah angka.
export const getTeamBySlug = async (slug: string) => {
  const supabase = await createClient();

  // Coba match by code terlebih dahulu
  const { data: byCode, error: codeError } = await supabase
    .from("teams")
    .select("*")
    .eq("code", slug)
    .maybeSingle();

  if (codeError) {
    console.error("getTeamBySlug (by code) error:", codeError);
    return { success: false, message: codeError.message, data: null };
  }

  if (byCode) {
    return { success: true, data: byCode as ITeams };
  }

  // Fallback: coba match by name
  const { data: byName, error: nameError } = await supabase
    .from("teams")
    .select("*")
    .eq("name", slug)
    .maybeSingle();

  if (nameError) {
    console.error("getTeamBySlug (by name) error:", nameError);
    return { success: false, message: nameError.message, data: null };
  }

  if (byName) {
    return { success: true, data: byName as ITeams };
  }

  // Fallback terakhir: coba match by id (jika slug adalah angka)
  const numericId = Number(slug);
  if (!isNaN(numericId)) {
    const { data: byId, error: idError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", numericId)
      .maybeSingle();

    if (idError) {
      console.error("getTeamBySlug (by id) error:", idError);
      return { success: false, message: idError.message, data: null };
    }

    if (byId) {
      return { success: true, data: byId as ITeams };
    }
  }

  return { success: false, message: "Team not found", data: null };
};

// ─── GET TEAM MEMBERS ───────────────────────────────────────────────────────
export const getTeamMembers = async (teamId: number) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_members")
    .select(
      `
      *,
      organization_members (
        id,
        is_active,
        user:users (
          name,
          profile_photo_url,
          email
        )
      ),
      positions_detail:positions (
        id,
        title
      )
    `
    )
    .eq("team_id", teamId);

  if (error) {
    console.error("getTeamMembers error:", error);
    return { success: false, message: error.message, data: [] as ITeamMember[] };
  }

  return { success: true, data: data as unknown as ITeamMember[] };
};

// ─── CREATE TEAM ────────────────────────────────────────────────────────────
export const createTeam = async (payload: Partial<ITeams>) => {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "User not logged in" };
  }

  const { data, error } = await supabase
    .from("teams")
    .insert([
      {
        organization_id: payload.organization_id,
        code: payload.code || null,
        name: payload.name,
        description: payload.description || null,
        is_active: payload.is_active ?? true,
        settings: payload.settings || null,
        metadata: payload.metadata || null,
      },
    ])
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

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "User not logged in" };
  }

  const { data, error } = await supabase
    .from("teams")
    .update({
      code: payload.code || null,
      name: payload.name,
      description: payload.description || null,
      is_active: payload.is_active,
      settings: payload.settings || null,
      metadata: payload.metadata || null,
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

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

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