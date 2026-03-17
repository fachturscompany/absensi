"use server"

import { createClient } from "@/utils/supabase/server"
import { Organization, Role } from "@/lib/types/organization"

interface LoginResponse {
  success: boolean
  message?: string
  user?: {
    id: string
    email: string
    first_name: string
    last_name: string
    avatar: string
  }
  organizations?: Organization[]
}

/**
 * Multi-Org Login
 * Fetch user's organizations and roles after login
 */
export async function loginMultiOrg(formData: FormData): Promise<LoginResponse> {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { success: false, message: "Email and password are required" }
  }

  // Sign in with email and password
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, message: error.message }
  }

  if (!data.user) {
    return { success: false, message: "Login failed. Please ensure your email is confirmed." }
  }

  const user = data.user

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, message: "User profile not found" }
  }

  // Get user's organizations with roles
  const { data: orgMembers, error: orgMembersError } = await supabase
    .from("organization_members")
    .select(`
      id,
      organization_id,
      is_active,
      organizations!inner (
        id,
        name,
        code,
        timezone,
        country_code,
        is_active,
        deleted_at
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
    .eq("organizations.is_active", true)
    .is("organizations.deleted_at", null)

  if (orgMembersError) {
    return { success: false, message: "Failed to fetch organizations" }
  }

  // Transform organizations data
  const organizations: Organization[] = []

  if (orgMembers && orgMembers.length > 0) {
    for (const member of orgMembers) {
      const org = member.organizations as any
      const roles: Role[] = []

      // Extract roles from organization_member_roles
      if (member.organization_member_roles && Array.isArray(member.organization_member_roles)) {
        for (const memberRole of member.organization_member_roles) {
          if (memberRole.system_roles && Array.isArray(memberRole.system_roles) && memberRole.system_roles.length > 0) {
            const role = memberRole.system_roles[0]
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
  }
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
  // Gunakan regular client untuk autentikasi user
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, message: "User not authenticated" }
  }

  console.log('🔍 getUserOrganizations: User authenticated:', user.id)

  // Gunakan admin client (service role) untuk bypass RLS pada tabel organization_members
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  const { createClient: createAdminClient } = await import("@supabase/supabase-js")
  const adminClient = serviceRoleKey
    ? createAdminClient(supabaseUrl, serviceRoleKey)
    : supabase

  // QUERY 1: Ambil semua organization_members untuk user ini
  const { data: orgMembers, error: orgMembersError } = await adminClient
    .from("organization_members")
    .select("id, organization_id, is_active")
    .eq("user_id", user.id)

  console.log('🔍 getUserOrganizations: orgMembers raw:', orgMembers)
  console.log('🔍 getUserOrganizations: orgMembers error:', orgMembersError)

  if (orgMembersError) {
    return { success: false, message: "Failed to fetch member records" }
  }

  if (!orgMembers || orgMembers.length === 0) {
    console.log('🔍 getUserOrganizations: No member records found')
    return { success: true, organizations: [] }
  }

  // Filter: hanya yang aktif (is_active tidak false)
  const activeMembers = orgMembers.filter(m => m.is_active !== false)
  if (activeMembers.length === 0) {
    return { success: true, organizations: [] }
  }

  const orgIds = activeMembers.map(m => m.organization_id).filter(Boolean)
  const memberIds = activeMembers.map(m => m.id)

  // QUERY 2: Ambil data organizations
  const { data: orgsData } = await adminClient
    .from("organizations")
    .select("id, name, code, timezone, country_code, is_active, deleted_at")
    .in("id", orgIds)

  const orgMap: Record<number, any> = {}
  if (orgsData) {
    for (const org of orgsData) {
      if (!org.deleted_at) {  // skip yang sudah dihapus
        orgMap[org.id] = org
      }
    }
  }

  // QUERY 3: Ambil roles untuk semua member
  const { data: rolesData } = await adminClient
    .from("organization_member_roles")
    .select(`
      organization_member_id,
      system_roles (
        id, code, name, description
      )
    `)
    .in("organization_member_id", memberIds)

  // Build roles map per member
  const rolesMap: Record<number, Role[]> = {}
  if (rolesData) {
    for (const r of rolesData) {
      const memberId = r.organization_member_id
      if (!rolesMap[memberId]) rolesMap[memberId] = []
      const sr = Array.isArray(r.system_roles) ? r.system_roles[0] : (r.system_roles as any)
      if (sr?.id) {
        rolesMap[memberId].push({
          id: sr.id,
          code: sr.code,
          name: sr.name,
          description: sr.description,
        })
      }
    }
  }

  // Build final organizations list
  const organizations: Organization[] = []
  for (const member of activeMembers) {
    const org = orgMap[member.organization_id]
    if (!org) continue  // org tidak ditemukan atau sudah dihapus

    organizations.push({
      id: org.id,
      name: org.name,
      code: org.code,
      timezone: org.timezone,
      country_code: org.country_code,
      roles: rolesMap[member.id] || [],
    })
  }

  console.log('🔍 getUserOrganizations: Returning', organizations.length, 'organizations:', organizations.map(o => o.name))
  return {
    success: true,
    organizations,
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
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, message: "User not authenticated" }
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
    return { success: false, message: "User is not a member of this organization" }
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
    return { success: false, message: "Failed to fetch roles" }
  }

  const roles: Role[] = []

  if (memberRoles && Array.isArray(memberRoles)) {
    for (const memberRole of memberRoles) {
      if (memberRole.role && Array.isArray(memberRole.role) && memberRole.role.length > 0) {
        const role = memberRole.role[0]!
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
  }
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
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, message: "User not authenticated" }
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
    return { success: false, message: "Failed to fetch permissions" }
  }

  const permissions: string[] = []

  if (rolePermissions && Array.isArray(rolePermissions)) {
    for (const rp of rolePermissions) {
      if (rp.permission && Array.isArray(rp.permission) && rp.permission.length > 0) {
        const permission = rp.permission[0]!
        if (permission && permission.code) {
          permissions.push(permission.code)
        }
      }
    }
  }

  return {
    success: true,
    permissions,
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
    return { success: false, message: error.message }
  }

  return { success: true }
}
