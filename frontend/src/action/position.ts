"use server";
import { IPositions } from "@/interface";
import { createClient } from "@/utils/supabase/server";

export const getAllPositions = async (organizationId?: number) => {
  const supabase = await createClient();

  // 1. Retrieve user from cookies
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "User not logged in", data: [] };
  }

  // 2. Determine which organization to fetch
  let targetOrgId = organizationId;
  
  if (!targetOrgId) {
    // If no organizationId provided, get user's first organization
    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) {
      return { success: true, message: "User not registered in any organization", data: [] };
    }
    targetOrgId = member.organization_id;
  }

  // 3. Fetch all positions for the organization
  const { data, error } = await supabase
    .from("positions")
    .select("id, code, title, description, is_active, created_at, organization_id")
    .eq("organization_id", targetOrgId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IPositions[] };
};

export async function createPositions(payload: Partial<IPositions>) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("positions")
        .insert(payload)
        .select()
        .single()

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IPositions[] };
}

export async function updatePositions(id: string, payload: Partial<IPositions>) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("positions")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IPositions[] };
}

export const getPositionById = async (positionId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("positions")
        .select("*")
        .eq("id", positionId)
        .single();

    if (error) {
        return { success: false, message: error.message, data: null };
    }

    return { success: true, data: data as IPositions };
};

export const deletePositions = async ( PositionsId: string | number) => {
    const supabase = await createClient();
    const id = String(PositionsId)
    const { data, error } = await supabase
        .from("positions").delete().eq("id", id)
        .select()
        .single();

    if (error) {
        return { success: false, message: error.message, data: null };
    }
    return { success: true, message: "Deleted successfully", data: data as IPositions };
};
