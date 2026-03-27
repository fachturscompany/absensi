"use server";

import { createClient } from "@/utils/supabase/server";
import { createSupabaseClient } from "@/config/supabase-config";
import { createAdminClient } from "@/utils/supabase/admin";
import { IOrganization } from "@/interface";

import { organizationLogger } from '@/lib/logger';
export interface OrganizationStatus {
  isValid: boolean;
  reason?: "inactive" | "expired" | "not_found";
  expirationDate?: string;
  organizationId?: number;
  organizationName?: string;
}

/**
 * Check if user's organization is active and subscription is valid
 */
export async function checkOrganizationStatus(): Promise<OrganizationStatus> {
  try {
    const supabase = await createClient();

    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        isValid: false,
        reason: "not_found"
      };
    }

    // 2. Get user's organization membership
    const { data: member, error: memberError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError || !member) {
      return {
        isValid: false,
        reason: "not_found"
      };
    }

    // 3. Get organization details
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, is_active, is_suspended, subscription_expires_at")
      .eq("id", member.organization_id)
      .maybeSingle();

    if (orgError || !organization) {
      return {
        isValid: false,
        reason: "not_found"
      };
    }

    // 4. Check if organization is suspended (takes priority over other checks)
    if (organization.is_suspended) {
      return {
        isValid: false,
        reason: "inactive",
        organizationId: organization.id,
        organizationName: organization.name
      };
    }

    // 5. Check if organization is active (for onboarding - only relevant if not suspended)
    // Note: We allow access even if is_active=false during onboarding
    // The onboarding page will handle this separately

    // 6. Check if subscription is expired
    if (organization.subscription_expires_at) {
      const expirationDate = new Date(organization.subscription_expires_at);
      const now = new Date();

      if (expirationDate < now) {
        return {
          isValid: false,
          reason: "expired",
          expirationDate: organization.subscription_expires_at,
          organizationId: organization.id,
          organizationName: organization.name
        };
      }
    }

    // Organization is valid
    return {
      isValid: true,
      organizationId: organization.id,
      organizationName: organization.name
    };

  } catch (error) {
    organizationLogger.error("Error checking organization status:", error);
    return {
      isValid: false,
      reason: "not_found"
    };
  }
}

/**
 * Get user's organization ID
 */
export async function getUserOrganizationId(userId: string) {
  try {
    console.log(`[getUserOrganizationId] Fetching for userId: ${userId}`);
    const supabase = createAdminClient();

    const { data: member, error } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error(`[getUserOrganizationId] DB Error: ${error.message}`);
      return { organizationId: null };
    }

    if (!member) {
      console.warn(`[getUserOrganizationId] No membership found for userId: ${userId}`);
      return { organizationId: null };
    }

    console.log(`[getUserOrganizationId] Found organizationId: ${member.organization_id}`);
    return { organizationId: String(member.organization_id) };
  } catch (error) {
    organizationLogger.error("Error getting organization ID:", error);
    return { organizationId: null };
  }
}

// ➕ Add Organization
export const addOrganization = async (organization: Partial<IOrganization>) => {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("organizations")
    .insert([organization])
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Organization added successfully", data: data as IOrganization };
};

// ✏️ Update Organization
export const updateOrganization = async (id: string, organization: Partial<IOrganization>) => {
  const supabase = createAdminClient(); // ✅ Ganti ini — bypass RLS
  const { data, error } = await supabase
    .from("organizations")
    .update(organization)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Organization updated successfully", data: data as IOrganization };
};

// 📂 Get All Organizations (ADMIN ONLY - USE WITH CAUTION)
// WARNING: This function returns ALL organizations
// Only use this for admin/system-level operations
// For regular user operations, use getUserOrganization() instead
export const getAllOrganization = async () => {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IOrganization[] };
};

// 📂 Get User's Organization (SECURE - FILTERED BY USER)
// This function returns only the organization that the current user belongs to
export const getUserOrganization = async (targetOrgId?: string | number) => {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const orgIdFromCookie = cookieStore.get('org_id')?.value;

  // Get current user via regular client (to verify session)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, message: "User not authenticated", data: null };
  }

  // Get user's organization membership using ADMIN CLIENT to bypass RLS
  let query = adminClient
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id);

  // If a specific target is requested, use it, otherwise fallback to cookie
  if (targetOrgId) {
    query = query.eq("organization_id", targetOrgId);
  } else if (orgIdFromCookie && orgIdFromCookie !== "undefined") {
    const numericOrgId = parseInt(orgIdFromCookie, 10);
    if (!isNaN(numericOrgId)) {
      query = query.eq("organization_id", numericOrgId);
    }
  }

  const { data: members, error: memberError } = await query.limit(1);

  if (memberError || !members || members.length === 0) {
    // If targeted fetch or cookie failed, fallback to ANY active membership
    const { data: fallbackMembers, error: fallbackError } = await adminClient
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1);

    if (fallbackError) {
      console.error("[getUserOrganization] Fallback query error:", fallbackError);
    }

    if (fallbackMembers && fallbackMembers.length > 0 && fallbackMembers[0]) {
      console.log(`[getUserOrganization] Using fallback org: ${fallbackMembers[0].organization_id}`);
      return fetchOrganization(adminClient, fallbackMembers[0].organization_id);
    }

    return { success: false, message: "User not in any organization", data: null };
  }

  if (!members[0]) {
    return { success: false, message: "User organization data not found", data: null };
  }

  return fetchOrganization(adminClient, members[0].organization_id);
};

// Helper to fetch organization by ID
async function fetchOrganization(supabase: any, orgId: any) {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, data: data as IOrganization };
}

export const uploadLogo = async (
  file: File,
  oldFilePath?: string
): Promise<string | null> => {
  try {
    const supabase = await createSupabaseClient();
    if (oldFilePath) {
      await deleteLogo(oldFilePath);
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `organization/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("logo")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      organizationLogger.error("Supabase upload error:", error.message);
      throw error;
    }

    const { data } = supabase.storage.from("logo").getPublicUrl(fileName);
    return data.publicUrl;
  } catch (err: unknown) {
    organizationLogger.error("Upload logo error:", err);
    return null;
  }
};

export const deleteLogo = async (fileUrl: string | null): Promise<boolean> => {
  if (!fileUrl) return true;
  try {
    const supabase = await createSupabaseClient();
    const url = new URL(fileUrl);
    const path = url.pathname.split("/object/public/logo/")[1];

    if (!path) {
      organizationLogger.error("Invalid logo URL:", fileUrl);
      return false;
    }

    const { error } = await supabase.storage.from("logo").remove([path]);

    if (error) {
      organizationLogger.error("Delete logo error:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    organizationLogger.error("Delete logo exception:", err);
    return false;
  }
};

export const deleteOrganization = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const supabase = await createSupabaseClient();
    const { data: org, error: fetchError } = await supabase
      .from("organizations")
      .select("id, logo_url")
      .eq("id", id)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (org?.logo_url) {
      await deleteLogo(org.logo_url);
    }

    const { error } = await supabase.from("organizations").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, message: "Organization deleted successfully" };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to delete organization",
    };
  }
};

export const getOrganizationById = async (id: string) => {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, data };
};

export const getUserOrganizationName = async (userId: string) => {
  const supabase = await createSupabaseClient();
  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (memberError || !member) {
    return { success: true, name: "E-Attendance" };
  }

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", member.organization_id)
    .maybeSingle();

  if (orgError || !org) {
    return { success: true, name: "E-Attendance" };
  }

  return { success: true, name: org.name };
};

export async function getOrganizationTimezoneByUserId(userId: string) {
  if (!userId) return "UTC";

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_members")
    .select("organizations(timezone)")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    organizationLogger.error("Error fetching organization timezone:", error);
    return "UTC";
  }

  if (!data) return "UTC";

  const organizations = data.organizations as { timezone?: string } | { timezone?: string }[] | null | undefined;

  if (Array.isArray(organizations)) {
    return organizations[0]?.timezone ?? "UTC";
  }

  return organizations?.timezone ?? "UTC";
}

/**
 * Get the count of organizations for the current user.
 */
export async function getOrganizationCount(): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const supabase = await createClient();

    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, count: 0, message: "User not authenticated" };
    }

    // 2. Get the count of user's organization memberships
    const { count, error: countError } = await supabase
      .from("organization_members")
      .select("organization_id", { count: 'exact', head: true })
      .eq("user_id", user.id);

    if (countError) {
      organizationLogger.error("Error counting organizations:", countError);
      return { success: false, count: 0, message: "Failed to count organizations." };
    }

    return { success: true, count: count ?? 0, message: "Organization count fetched successfully." };

  } catch (error) {
    organizationLogger.error("Unexpected error in getOrganizationCount:", error);
    return { success: false, count: 0, message: "An unexpected error occurred." };
  }
}
