"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Organization, Role } from "@/lib/types/organization";

interface LoginResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar: string;
  };
  organizations?: Organization[];
}

export interface CreateOrganizationInput {
  orgName: string;
  orgCode: string;
  timezone: string;
  industry?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  defaultRoleId: string;
}

export interface CreateOrganizationResult {
  success: boolean;
  message: string;
  data?: {
    organizationId: number;
    organizationName: string;
    organizationCode: string;
  };
  error?: string;
}

function generateInvitationCode(length: number = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Multi-Org Login
 * Fetch user's organizations and roles after login
 */
export async function loginMultiOrg(formData: FormData): Promise<LoginResponse> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, message: "Email and password are required" };
  }

  // Sign in with email and password
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, message: error.message };
  }

  if (!data.user) {
    return { success: false, message: "Login failed. Please ensure your email is confirmed." };
  }

  const user = data.user;

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, message: "User profile not found" };
  }

  // Get user's organizations with roles
  const { data: orgMembers, error: orgMembersError } = await supabase
    .from("organization_members")
    .select(`
      id,
      organization_id,
      is_active,
      organizations (
        id,
        name,
        code,
        timezone,
        country_code,
        is_active
      ),
      organization_member_roles (
        id,
        system_roles (
          id,
          code,
          name,
          description
        )
      )
    `)
    .eq("user_id", user.id)
    .eq("is_active", true)

  if (orgMembersError) {
    return { success: false, message: "Failed to fetch organizations" };
  }

  // Transform organizations data
  const organizations: Organization[] = [];

  if (orgMembers && orgMembers.length > 0) {
    for (const member of orgMembers) {
      const org = member.organizations as any;
      const roles: Role[] = [];

      // Extract roles from organization_member_roles
      if (member.organization_member_roles && Array.isArray(member.organization_member_roles)) {
        for (const memberRole of member.organization_member_roles) {
          if (memberRole.system_roles && Array.isArray(memberRole.system_roles) && memberRole.system_roles.length > 0) {
            const role = memberRole.system_roles[0];
            if (role) {
              roles.push({
                id: role.id,
                code: role.code,
                name: role.name,
                description: role.description,
              })
            }
          }
        }
      }

      if (org) {
        organizations.push({
          id: org.id,
          name: org.name,
          code: org.code,
          timezone: org.timezone,
          country_code: org.country_code,
          roles,
        })
      }
    }
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email || "",
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      avatar: profile.profile_photo_url || "",
    },
    organizations,
  };
}

/**
 * Get User Organizations
 * Fetch organizations for current logged-in user
 */
export async function getUserOrganizations(): Promise<{
  success: boolean
  message?: string
  organizations?: Organization[]
}> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, message: "User not authenticated" };
  }

  console.log('🔍 getUserOrganizations: User authenticated:', user.id)

  const { data: orgMembers, error: orgMembersError } = await supabase
    .from("organization_members")
    .select(`
      id,
      organization_id,
      organizations (
        id,
        name,
        code,
        timezone,
        country_code
      ),
      organization_member_roles (
        id,
        system_roles (
          id,
          code,
          name,
          description
        )
      )
    `)
    .eq("user_id", user.id)
    .eq("is_active", true)

  console.log('🔍 getUserOrganizations: Query result:', orgMembers)
  console.log('🔍 getUserOrganizations: Query error:', orgMembersError)
  if (orgMembersError) {
    return { success: false, message: "Failed to fetch organizations" };
  }

  const organizations: Organization[] = [];

  if (orgMembers && orgMembers.length > 0) {
    for (const member of orgMembers) {
      const org = member.organizations as any;
      const roles: Role[] = [];

      if (member.organization_member_roles && Array.isArray(member.organization_member_roles)) {
        for (const memberRole of member.organization_member_roles) {
          if (memberRole.system_roles && Array.isArray(memberRole.system_roles) && memberRole.system_roles.length > 0) {
            const role = memberRole.system_roles[0]!;
            roles.push({
              id: role.id,
              code: role.code,
              name: role.name,
              description: role.description,
            })
          }
        }
      }

      if (org) {
        organizations.push({
          id: org.id,
          name: org.name,
          code: org.code,
          timezone: org.timezone,
          country_code: org.country_code,
          roles,
        })
      }
    }
  }

  return {
    success: true,
    organizations,
  };
}

/**
 * Create Organization (server action)
 */
export async function createOrganization(
  input: CreateOrganizationInput
): Promise<CreateOrganizationResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Generate invitation code and ensure uniqueness (best-effort)
    let invCode = generateInvitationCode();
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: existing } = await supabase
        .from("organizations")
        .select("id")
        .eq("inv_code", invCode)
        .maybeSingle();
      if (!existing) break;
      invCode = generateInvitationCode();
    }

    // Create admin client with service role key for insert operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[CREATE-ORG] Missing environment variables:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceRoleKey,
      });
      return {
        success: false,
        message: "Server configuration error",
        error: "Missing Supabase credentials",
      };
    }

    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);

    // Insert organization
    const { data: organization, error: orgError } = await adminClient
      .from("organizations")
      .insert([
        {
          name: input.orgName,
          legal_name: input.orgName,
          code: input.orgCode,
          timezone: input.timezone,
          industry: input.industry || null,
          phone: input.phone || null,
          email: input.email || null,
          website: input.website || null,
          address: input.address || null,
          city: input.city || null,
          state_province: input.stateProvince || null,
          postal_code: input.postalCode || null,
          country_code: "ID",
          is_active: true,
          is_suspended: false,
          inv_code: invCode,
        },
      ])
      .select()
      .single();

    if (orgError || !organization) {
      console.error("[CREATE-ORG] Error creating organization:", {
        error: orgError,
        message: orgError?.message,
        details: orgError?.details,
        hint: orgError?.hint,
      });
      return {
        success: false,
        message: orgError?.message || "Failed to create organization",
        error: orgError?.message || "Database error",
      };
    }

    // Ensure user_profiles record exists BEFORE adding to organization_members
    // The FK organization_members_user_id_fkey references user_profiles(id), not auth.users(id)
    // New users may not have a user_profiles record if the trigger didn't fire
    const { error: profileCheckError } = await adminClient
      .from("user_profiles")
      .upsert(
        {
          id: user.id,
          email: user.email || "",
          first_name: user.user_metadata?.first_name || user.user_metadata?.name?.split(" ")[0] || "",
          last_name: user.user_metadata?.last_name || user.user_metadata?.name?.split(" ").slice(1).join(" ") || "",
        },
        { onConflict: "id", ignoreDuplicates: true }
      );

    if (profileCheckError) {
      console.error("[CREATE-ORG] Error ensuring user_profiles exists:", {
        message: profileCheckError.message,
        details: profileCheckError.details,
        code: profileCheckError.code,
      });
      // Log but continue — record might already exist (ignoreDuplicates handles it)
    }

    // Add user as organization member (without biodata, so they won't appear in export)
    // This is needed so creator can access the organization
    const { data: member, error: memberError } = await adminClient
      .from("organization_members")
      .insert([
        {
          user_id: user.id,
          organization_id: organization.id,
          hire_date: new Date().toISOString().split("T")[0],
          is_active: true,
          // No biodata_nik - creator won't appear in export (filtered out)
        },
      ])
      .select()
      .single();

    if (memberError || !member) {
      console.error("[CREATE-ORG] Error adding member:", {
        error: memberError,
        message: memberError?.message,
        details: memberError?.details,
        hint: memberError?.hint,
        code: memberError?.code,
      });
      // Rollback: delete organization
      await adminClient.from("organizations").delete().eq("id", organization.id);
      return {
        success: false,
        message: "Failed to add user to organization",
        error: memberError?.message || "Database error",
      };
    }

    // Assign default role to user
    const { data: selectedRole, error: roleError } = await adminClient
      .from("system_roles")
      .select("id")
      .eq("code", input.defaultRoleId)
      .single();

    if (roleError || !selectedRole) {
      console.error("[CREATE-ORG] Error fetching selected role:", {
        roleCode: input.defaultRoleId,
        error: roleError,
        message: roleError?.message,
        details: roleError?.details,
        hint: roleError?.hint,
        code: roleError?.code,
      });
      // Rollback: delete member and organization
      await adminClient.from("organization_members").delete().eq("id", member.id);
      await adminClient.from("organizations").delete().eq("id", organization.id);
      return {
        success: false,
        message: "Failed to assign role",
        error: roleError?.message || `Role ${input.defaultRoleId} not found`,
      };
    }

    const { error: memberRoleError } = await adminClient
      .from("organization_member_roles")
      .insert([
        {
          organization_member_id: member.id,
          role_id: selectedRole.id,
        },
      ]);

    if (memberRoleError) {
      console.error("[CREATE-ORG] Error assigning role:", {
        error: memberRoleError,
        message: memberRoleError?.message,
        details: memberRoleError?.details,
        hint: memberRoleError?.hint,
        code: memberRoleError?.code,
      });
      // Rollback: delete member and organization
      await adminClient.from("organization_members").delete().eq("id", member.id);
      await adminClient.from("organizations").delete().eq("id", organization.id);
      return {
        success: false,
        message: "Failed to assign role to member",
        error: memberRoleError?.message || "Database error",
      };
    }

    return {
      success: true,
      message: `Organization "${organization.name}" created successfully`,
      data: {
        organizationId: organization.id,
        organizationName: organization.name,
        organizationCode: organization.code,
      },
    };
  } catch (error) {
    console.error("[CREATE-ORG] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      message: "An unexpected error occurred",
      error: errorMessage,
    };
  }
}

/**
 * Get Organization Roles
 * Fetch available roles for a specific organization
 */
export async function getOrganizationRoles(organizationId: number): Promise<{
  success: boolean
  message?: string
  roles?: Role[]
}> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, message: "User not authenticated" };
  }

  // Verify user is member of this organization
  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .maybeSingle()

  if (memberError || !member) {
    return { success: false, message: "User is not a member of this organization" };
  }

  // Get roles for this member
  const { data: memberRoles, error: rolesError } = await supabase
    .from("organization_member_roles")
    .select(`
      role:system_roles (
        id,
        code,
        name,
        description
      )
    `)
    .eq("organization_member_id", member.id)

  if (rolesError) {
    return { success: false, message: "Failed to fetch roles" };
  }

  const roles: Role[] = [];

  if (memberRoles && Array.isArray(memberRoles)) {
    for (const memberRole of memberRoles) {
      if (memberRole.role && Array.isArray(memberRole.role) && memberRole.role.length > 0) {
        const role = memberRole.role[0]!;
        roles.push({
          id: role.id,
          code: role.code,
          name: role.name,
          description: role.description,
        })
      }
    }
  }

  return {
    success: true,
    roles,
  };
}

/**
 * Get Role Permissions
 * Fetch permissions for a specific role
 */
export async function getRolePermissions(roleId: number): Promise<{
  success: boolean
  message?: string
  permissions?: string[]
}> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, message: "User not authenticated" };
  }

  // Get permissions for this role
  const { data: rolePermissions, error: permError } = await supabase
    .from("role_permissions")
    .select(`
      permission:nfk_permissions (
        code
      )
    `)
    .eq("role_id", roleId)

  if (permError) {
    return { success: false, message: "Failed to fetch permissions" };
  }

  const permissions: string[] = [];

  if (rolePermissions && Array.isArray(rolePermissions)) {
    for (const rp of rolePermissions) {
      if (rp.permission && Array.isArray(rp.permission) && rp.permission.length > 0) {
        const permission = rp.permission[0]!;
        if (permission && permission.code) {
          permissions.push(permission.code)
        }
      }
    }
  }

  return {
    success: true,
    permissions,
  };
}

/**
 * Validate organization code uniqueness
 */
export async function validateOrganizationCode(
  code: string
): Promise<{ isValid: boolean; message?: string }> {
  try {
    const supabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    const { data, error } = await supabase
      .from("organizations")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      console.error("[VALIDATE-ORG] Validation error:", error);
      return { isValid: false, message: "Validation failed" };
    }

    if (data) {
      return { isValid: false, message: "Organization code already exists" };
    }

    return { isValid: true };
  } catch (err) {
    console.error("[VALIDATE-ORG] Unexpected error:", err);
    return { isValid: false, message: "Unexpected error validating code" };
  }
}

/**
 * Get available roles (system roles)
 */
export async function getAvailableRoles(): Promise<
  Array<{ id: string; code: string; name: string }>
> {
  try {
    const supabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    const { data, error } = await supabase
      .from("system_roles")
      .select("id, code, name")
      .order("name", { ascending: true });

    if (error) {
      console.error("[ROLES] Failed to fetch roles:", error);
      return [];
    }

    return (data || []).map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
    }));
  } catch (err) {
    console.error("[ROLES] Unexpected error:", err);
    return [];
  }
}

/**
 * Get available timezones
 */
export async function getAvailableTimezones(): Promise<string[]> {
  try {
    // Node 18 supports Intl.supportedValuesOf
    // Provide fallback to a minimal list if not available

    const intl: any = Intl as any;
    if (typeof intl.supportedValuesOf === "function") {
      return intl.supportedValuesOf("timeZone");
    }
    return ["UTC", "Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"];
  } catch {
    return ["UTC", "Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"];
  }
}

/**
 * Logout Multi-Org
 * Clear session and redirect
 */
export async function logoutMultiOrg(): Promise<{
  success: boolean
  message?: string
}> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
}
