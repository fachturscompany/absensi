"use server";
import { IGroup } from "@/interface";
import { createClient } from "@/utils/supabase/server";

export const getAllGroups = async (organizationId?: number, includeInactive: boolean = false) => {
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

  // 3. Fetch all groups for the organization
  let query = supabase
    .from("departments")
    .select("id, code, name, description, is_active, created_at, organization_id")
    .eq("organization_id", targetOrgId);

  // Only filter by is_active if includeInactive is false
  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query.order("created_at", { ascending: true });

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IGroup[] };
};

export async function createGroup(payload: Partial<IGroup>) {
  const supabase = await createClient();

  // 1. Retrieve logged-in user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, message: "User not logged in", data: null };
  }

  // 2. Validate organization_id is provided
  if (!payload.organization_id) {
    return { success: false, message: "Organization ID is required", data: null };
  }

  // Convert organization_id to number if it's a string
  const orgId = typeof payload.organization_id === 'string'
    ? parseInt(payload.organization_id, 10)
    : payload.organization_id;

  // 3. Verify user is a member of the organization
  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (memberError) {
    return { success: false, message: memberError.message, data: null };
  }

  if (!member) {
    return { success: false, message: "User not authorized for this organization", data: null };
  }

  // 4. Insert group
  const { data, error } = await supabase
    .from("departments")
    .insert({
      code: payload.code,
      name: payload.name,
      description: payload.description || null,
      is_active: payload.is_active ?? true,
      organization_id: orgId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, data: data as IGroup };
}


export async function updateGroup(id: string, payload: Partial<IGroup>) {
  const supabase = await createClient();

  // 1. Retrieve logged-in user for authorization
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, message: "User not logged in", data: null };
  }

  if (id === 'no-group') {
    return { success: false, message: "Cannot update virtual 'No Group'", data: null };
  }

  // 2. Convert organization_id if it's a string
  const updateData: Record<string, unknown> = {
    code: payload.code,
    name: payload.name,
    description: payload.description || null,
    is_active: payload.is_active,
    updated_at: new Date().toISOString(),
  };

  // Only include organization_id if it's being updated
  if (payload.organization_id) {
    const orgId = typeof payload.organization_id === 'string'
      ? parseInt(payload.organization_id, 10)
      : payload.organization_id;
    updateData.organization_id = orgId;
  }

  // 3. Update the group
  const { data, error } = await supabase
    .from("departments")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, data: data as IGroup };
}

export const getGroupById = async (groupId: string) => {
  if (groupId === 'no-group') {
    return { success: false, message: "Invalid group ID: 'no-group'", data: null };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("id", groupId)
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, data: data as IGroup };
};

export const deleteGroup = async (groupId: string | number) => {
  const id = String(groupId)
  if (id === 'no-group') {
    return { success: false, message: "Cannot delete virtual 'No Group'", data: null };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments").delete().eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Deleted successfully", data: data as IGroup };
};
