"use server"

import { createClient } from "@/utils/supabase/server"
import { IUser } from "@/interface"

import { logger } from '@/lib/logger';
import { z } from "zod";

// Schemas for server-side validation
const signUpSchema = z.object({
  email: z.string().email({ message: "Email tidak valid. Pastikan menyertakan simbol '@'." }),
  password: z.string().min(6, { message: "Password minimal harus 6 karakter." }),
  first_name: z.string().min(1, { message: "Nama depan wajib diisi." }),
  last_name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email({ message: "Email tidak valid. Pastikan menyertakan simbol '@'." }),
  password: z.string().min(6, { message: "Password minimal harus 6 karakter." }),
});

const requestPasswordResetSchema = z.object({
  email: z.string().email({ message: "Email tidak valid. Pastikan menyertakan simbol '@'." }),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, { message: "Password baru minimal harus 8 karakter." }),
});
// Helper buat bikin client
async function getSupabase() {
  return await createClient()
}

// ======================
// SIGN UP
// ======================
export async function signUp(formData: FormData) {
  const supabase = await getSupabase()

  const rawEmail = formData.get("email") as string
  const rawPassword = formData.get("password") as string
  const rawFirstName = (formData.get("first_name") as string) || ""
  const rawLastName = (formData.get("last_name") as string) || ""

  // Server-side validation
  const validation = signUpSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
    first_name: rawFirstName,
    last_name: rawLastName,
  });

  if (!validation.success) {
    return { error: validation.error.issues[0]?.message || "Validation failed" };
  }

  const { email, password, first_name: firstName, last_name: lastName } = validation.data;

  const displayNameParts = [firstName, lastName].filter((part) => part && part.trim() !== "")
  const displayName = displayNameParts.join(" ") || firstName || email

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName || null,
        last_name: lastName || null,
        display_name: displayName,
      },
      // Ensure email confirmation is handled automatically
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://absensi-ubig.vercel.app'}/onboarding`,
    },
  })

  if (error) return { error: error.message }

  // If user is created and confirmed (auto-confirm is enabled in Supabase)
  if (data.user && data.session) {
    return { success: true, user: data.user, session: data.session }
  }

  // If user is created but not confirmed (email confirmation required)
  if (data.user && !data.session) {
    return { success: true, user: data.user, needsConfirmation: true }
  }

  return { success: true, user: data.user }
}

// ======================
// SIGN IN WITH GOOGLE
// ======================
export async function signInWithGoogle() {
  const supabase = await getSupabase()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://absensi-ubig.vercel.app'}/auth/callback`,
      skipBrowserRedirect: false,
      queryParams: {
        access_type: 'online',
        prompt: 'select_account',
      },
    },
  })

  if (error) {
    logger.error('Google OAuth error:', error)
    return { error: error.message, url: null }
  }

  return { url: data.url, error: null }
}

// ======================
// LOGIN
// ======================
export async function login(formData: FormData) {
  const supabase = await getSupabase()

  const rawEmail = formData.get("email") as string
  const rawPassword = formData.get("password") as string

  // Server-side validation
  const validation = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!validation.success) {
    return { success: false, message: validation.error.issues[0]?.message || "Validation failed" };
  }

  const { email, password } = validation.data;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) return { success: false, message: error.message }
  if (!data.user) {
    return { success: false, message: "Login failed. Please ensure your email is confirmed." }
  }

  const user = data.user

  const { data: profiles, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .limit(1)

  const profile = profiles?.[0]

  if (profileError) return { success: false, message: profileError.message }

  // Get organization role
  const { data: orgMemberships } = await supabase
    .from("organization_members")
    .select(`
      role:system_roles(code, name)
    `)
    .eq("user_id", user.id)
    .eq("is_active", true)

  const orgMember = orgMemberships?.[0]


  const orgRole = orgMember?.role ? (Array.isArray(orgMember.role) ? orgMember.role[0]?.code : (orgMember.role as any)?.code) : null

  const { data: rolesData, error: roleError } = await supabase
    .from("user_roles")
    .select("role:system_roles(id, name)")
    .eq("user_id", user.id)

  if (roleError) return { success: false, message: roleError.message }


  const roles = (rolesData as any)?.map((r: any) => ({
    id: r.role?.id || r.id,
    name: r.role?.name || r.name

  })).filter((role: any) => role.id && role.name) ?? []

  const roleIds = roles.map((r: any) => r.id)

  let permissions: { code: string; name: string }[] = []
  if (roleIds.length > 0) {
    const { data: permData, error: permError } = await supabase
      .from("role_permissions")
      .select("permission:permissions(code, name)")
      .in("role_id", roleIds)

    if (permError) return { success: false, message: permError.message }


    permissions = (permData as any)?.map((p: any) => ({
      code: p.permission?.code || p.code,
      name: p.permission?.name || p.name

    })).filter((perm: any) => perm.code && perm.name) ?? []
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      ...profile, // Spread all profile data including profile_photo_url
    },
    roles,
    permissions,
    orgRole, // Organization role code (e.g., 'ADMIN_ORG', 'SUPER_ADMIN')
  }
}

// ======================
// PASSWORD RESET
// ======================
export async function requestPasswordReset(formData: FormData) {
  const supabase = await getSupabase()

  const rawEmail = (formData.get('email') as string)?.trim()

  // Server-side validation
  const validation = requestPasswordResetSchema.safeParse({ email: rawEmail });

  if (!validation.success) {
    return { success: false, message: validation.error.issues[0]?.message || "Validation failed" };
  }

  const { email } = validation.data;

  const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://absensi-ubig.vercel.app'}/auth/callback?next=/auth/reset-password`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  })

  if (error) {
    return { success: false, message: error.message }
  }

  return {
    success: true,
    message: 'We have sent a password reset link to your email.',
  }
}

export async function resetPassword(formData: FormData) {
  const supabase = await getSupabase()

  const rawPassword = (formData.get('password') as string)?.trim()

  // Server-side validation
  const validation = resetPasswordSchema.safeParse({ password: rawPassword });

  if (!validation.success) {
    return { success: false, message: validation.error.issues[0]?.message || "Validation failed" };
  }

  const { password } = validation.data;

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { success: false, message: error.message }
  }

  // Optional: ensure recovery session is cleared so user logs in manually
  await supabase.auth.signOut()

  return {
    success: true,
    message: 'Password successfully updated. Please login again.',
  }
}

// ======================
// GET ALL USERS (ADMIN ONLY - USE WITH CAUTION)
// ======================
// WARNING: This function returns ALL users from ALL organizations
// Only use this for admin/system-level operations
// For regular user operations, use getOrganizationUsers() instead
export async function getAllUsers() {
  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return { success: false, message: error.message, data: [] }

  return { success: true, data: data as IUser[] }
}

// ======================
// GET ORGANIZATION USERS (SECURE - FILTERED BY ORGANIZATION)
// ======================
// This function returns only users from the current user's organization
export async function getOrganizationUsers() {
  const supabase = await getSupabase()

  // Get current user's organization
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, message: "User not authenticated", data: [] }
  }

  // Get user's organization membership
  const { data: memberships, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)

  if (memberError || !memberships || memberships.length === 0) {
    return { success: false, message: "User not in any organization", data: [] }
  }

  const member = memberships[0];
  if (!member || !member.organization_id) {
    return { success: false, message: "User organization data incomplete", data: [] }
  }

  // Get all members in the same organization
  const { data: orgMembers, error: orgMembersError } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", member.organization_id)

  if (orgMembersError) {
    return { success: false, message: orgMembersError.message, data: [] }
  }

  const userIds = orgMembers?.map(m => m.user_id) || []
  if (userIds.length === 0) {
    return { success: true, data: [] }
  }

  // Fetch user profiles ONLY for members in the same organization
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .in("id", userIds)
    .order("created_at", { ascending: false })

  if (error) return { success: false, message: error.message, data: [] }

  return { success: true, data: data as IUser[] }
}

export async function getAllUsersNotRegistered() {
  const supabase = await getSupabase()

  const { data: members, error: memberError } = await supabase
    .from("organization_members")
    .select("user_id")

  if (memberError) return { success: false, message: memberError.message, data: [] }

  const memberIds = members.map((m) => m.user_id)

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .not("id", "in", `(${memberIds.join(",") || 0})`)
    .order("created_at", { ascending: false })

  if (error) return { success: false, message: error.message, data: [] }

  return { success: true, data: data as IUser[] }
}

// ======================
// GET CURRENT USER PROFILE
// ======================
export async function getCurrentUserProfile() {
  const supabase = await getSupabase()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: "Not logged in", profile: null }

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error || !profile) return { error: error?.message || "Profile not found", profile: null }

  return { error: null, profile }
}

// ======================
// LOGOUT
// ======================
export async function logout() {
  const supabase = await getSupabase()
  const { error } = await supabase.auth.signOut()

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ======================
// DELETE USER
// ======================
export async function deleteUsers(id: string) {
  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from("user_profiles")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) return { success: false, message: error.message, data: null }
  return { success: true, message: "Users deleted successfully", data: data as IUser }
}

// ======================
// UPDATE USER
// ======================
export async function updateUsers(id: string, values: Record<string, unknown>) {
  const supabase = await getSupabase()

  const { role_id, ...profileData } = values

  const { error: profileError } = await supabase
    .from("user_profiles")
    .update(profileData)
    .eq("id", id)

  if (profileError) return { success: false, message: profileError.message }

  if (role_id) {
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert({ user_id: id, role_id })

    if (roleError) return { success: false, message: roleError.message }
  }

  return { success: true }
}

// ======================
// USER ROLES
// ======================
export async function getUserRoles(userId: string) {
  const supabase = await getSupabase()

  const { data: roles, error } = await supabase
    .from("user_roles")
    .select(`role:system_role(name, id)`)
    .eq("user_id", userId)

  if (error) return { success: false, message: error.message, data: [] }

  return { success: true, data: roles }
}

// ======================
// USER PERMISSIONS
// ======================
export async function getUserPermissions(userId: string) {
  const supabase = await getSupabase()

  const { data: roles, error: roleError } = await supabase
    .from("user_roles")
    .select(`role_id`)
    .eq("user_id", userId)

  if (roleError) return { success: false, message: roleError.message, data: [] }
  if (!roles || roles.length === 0) return { success: true, data: [] }

  const roleIds = roles.map((r) => r.role_id)

  const { data: permissions, error: permError } = await supabase
    .from("role_permissions")
    .select(`permission:permission(name, code), role:system_role(name)`)
    .in("role_id", roleIds)

  if (permError) return { success: false, message: permError.message, data: [] }

  return { success: true, data: permissions }
}
