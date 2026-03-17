"use server";

import { createClient } from "@/utils/supabase/server";
import { IRole, IPermission } from "@/interface";

import { logger } from '@/lib/logger';
/**
 * RBAC Helper Functions for Role-Based Access Control
 * Supports both Platform-level roles (user_roles) and Organization-level roles (organization_members.role_id)
 */

// ============================================
// 1. GET USER ROLES & PERMISSIONS
// ============================================

/**
 * Get user's platform-level role (Super Admin, Support, Billing)
 * These roles have global access across all organizations
 */
export async function getUserPlatformRole(userId: string): Promise<IRole | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("user_roles")
      .select(`
        role:system_roles (
          id,
          code,
          name,
          description
        )
      `)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;

    const roleData = data.role as IRole | IRole[] | null;
    
    // Handle if Supabase returns array
    if (Array.isArray(roleData)) {
      return roleData[0] || null;
    }
    
    return roleData;
  } catch (error) {
    logger.error("Error getting platform role:", error);
    return null;
  }
}

/**
 * Get user's organization-level role (Admin Org, User)
 * This is scoped to their organization membership
 */
export async function getUserOrgRole(userId: string): Promise<{
  role: IRole | null;
  organizationId: string | null;
  memberId: string | null;
}> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("organization_members")
      .select(`
        id,
        organization_id,
        role_id,
        role:system_roles (
          id,
          code,
          name,
          description
        )
      `)
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      return { role: null, organizationId: null, memberId: null };
    }

    const roleData = data.role as IRole | IRole[] | null;
    let role: IRole | null = null;

    if (Array.isArray(roleData)) {
      role = roleData[0] || null;
    } else {
      role = roleData;
    }

    return {
      role,
      organizationId: String(data.organization_id),
      memberId: String(data.id),
    };
  } catch (error) {
    logger.error("Error getting org role:", error);
    return { role: null, organizationId: null, memberId: null };
  }
}

/**
 * Get all permissions for a user (combines platform + org permissions)
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const supabase = await createClient();
    const permissions = new Set<string>();

    // 1. Get platform role permissions (if any)
    const platformRole = await getUserPlatformRole(userId);
    if (platformRole?.id) {
      const { data: platformPerms } = await supabase
        .from("role_permissions")
        .select("permissions (code)")
        .eq("role_id", platformRole.id);

      if (platformPerms) {
        platformPerms.forEach((item: any) => {
          const perm = item.permissions;
          if (perm?.code) permissions.add(perm.code);
        });
      }
    }

    // 2. Get org role permissions
    const { role: orgRole } = await getUserOrgRole(userId);
    if (orgRole?.id) {
      const { data: orgPerms } = await supabase
        .from("role_permissions")
        .select("permissions (code)")
        .eq("role_id", orgRole.id);

      if (orgPerms) {
        orgPerms.forEach((item: any) => {
          const perm = item.permissions;
          if (perm?.code) permissions.add(perm.code);
        });
      }
    }

    return Array.from(permissions);
  } catch (error) {
    logger.error("Error getting user permissions:", error);
    return [];
  }
}

// ============================================
// 2. PERMISSION CHECKS
// ============================================

/**
 * Check if user has a specific permission (platform or org level)
 */
export async function hasPermission(
  userId: string,
  permissionCode: string
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId);
    return permissions.includes(permissionCode);
  } catch (error) {
    logger.error("Error checking permission:", error);
    return false;
  }
}

/**
 * Check if user has ANY of the specified permissions
 */
export async function hasAnyPermission(
  userId: string,
  permissionCodes: string[]
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId);
    return permissionCodes.some((code) => permissions.includes(code));
  } catch (error) {
    logger.error("Error checking any permission:", error);
    return false;
  }
}

/**
 * Check if user has ALL of the specified permissions
 */
export async function hasAllPermissions(
  userId: string,
  permissionCodes: string[]
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId);
    return permissionCodes.every((code) => permissions.includes(code));
  } catch (error) {
    logger.error("Error checking all permissions:", error);
    return false;
  }
}

// ============================================
// 3. ROLE CHECKS
// ============================================

/**
 * Check if user has platform role (Super Admin, Support, Billing)
 */
export async function hasPlatformRole(
  userId: string,
  roleCode: string
): Promise<boolean> {
  try {
    const role = await getUserPlatformRole(userId);
    return role?.code === roleCode;
  } catch (error) {
    logger.error("Error checking platform role:", error);
    return false;
  }
}

/**
 * Check if user is Super Admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  return hasPlatformRole(userId, "SA001");
}

/**
 * Check if user is Support
 */
export async function isSupport(userId: string): Promise<boolean> {
  return hasPlatformRole(userId, "SP001");
}

/**
 * Check if user is Billing
 */
export async function isBilling(userId: string): Promise<boolean> {
  return hasPlatformRole(userId, "B001");
}

/**
 * Check if user is Admin Organisasi in their org
 */
export async function isOrgAdmin(userId: string): Promise<boolean> {
  try {
    const { role } = await getUserOrgRole(userId);
    return role?.code === "A001";
  } catch (error) {
    logger.error("Error checking org admin:", error);
    return false;
  }
}

/**
 * Check if user is regular User/Staff in their org
 */
export async function isOrgUser(userId: string): Promise<boolean> {
  try {
    const { role } = await getUserOrgRole(userId);
    return role?.code === "S001";
  } catch (error) {
    logger.error("Error checking org user:", error);
    return false;
  }
}

// ============================================
// 4. ROLE MANAGEMENT (Admin Only)
// ============================================

/**
 * Assign role to organization member
 * Only Admin Org or Platform Admin can do this
 */
export async function assignRoleToMember(
  memberId: string,
  roleId: string,
  assignedBy: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if assignedBy has permission
    const canAssign = await hasPermission(assignedBy, "assign_role");
    
    if (!canAssign) {
      return {
        success: false,
        message: "You don't have permission to assign roles",
      };
    }

    const supabase = await createClient();

    // Update member's role
    const { error } = await supabase
      .from("organization_members")
      .update({
        role_id: roleId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", memberId);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: "Role assigned successfully" };
  } catch (error) {
    logger.error("Error assigning role:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all available organization roles (non-system roles)
 */
export async function getOrgRoles(): Promise<IRole[]> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("system_roles")
      .select("*")
      .eq("is_system", false)
      .order("name");

    if (error) return [];

    return data as IRole[];
  } catch (error) {
    logger.error("Error getting org roles:", error);
    return [];
  }
}

/**
 * Get all permissions grouped by module
 */
export async function getAllPermissions(): Promise<IPermission[]> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("permissions")
      .select("*")
      .order("module, name");

    if (error) return [];

    return data as IPermission[];
  } catch (error) {
    logger.error("Error getting permissions:", error);
    return [];
  }
}

/**
 * Get permissions for a specific role
 */
export async function getRolePermissions(roleId: string): Promise<string[]> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permissions (code)")
      .eq("role_id", roleId);

    if (error || !data) return [];

    return data
      .map((item: any) => item.permissions?.code)
      .filter((code: string | undefined) => code) as string[];
  } catch (error) {
    logger.error("Error getting role permissions:", error);
    return [];
  }
}
