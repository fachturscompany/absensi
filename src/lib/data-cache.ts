import { cache } from "react"
import { createSupabaseClient } from "@/config/supabase-config"

import { logger } from '@/lib/logger';
/**
 * Cached data fetching utilities using React cache()
 * Prevents duplicate requests within a single server render
 */

// Cache user profile fetch
export const getCachedUserProfile = cache(async (userId: string) => {
  const supabase = await createSupabaseClient()

  const { data } = await supabase
    .from("user_profiles")
    .select("first_name, last_name, display_name, profile_photo_url, employee_code")
    .eq("id", userId)
    .maybeSingle()

  return data ?? null
})

// Cache organization timezone fetch
export const getCachedOrganizationTimezone = cache(async (userId: string) => {
  const supabase = await createSupabaseClient()

  const { data } = await supabase
    .from("organization_members")
    .select("organization_id, organizations(timezone)")
    .eq("user_id", userId)

  if (!data || data.length === 0) return "UTC"

  // Prioritize finding a non-UTC timezone from user's organizations
  const memberWithTz = data.find((m: any) => {
    const tz = (m.organizations as any)?.timezone
    return tz && tz !== "UTC"
  })

  if (memberWithTz) {
    return (memberWithTz.organizations as any)?.timezone
  }

  // Fallback to first org's timezone or UTC
  return (data[0].organizations as any)?.timezone || "UTC"
})

// Cache organization name fetch
export const getCachedOrganizationName = cache(async (userId: string) => {
  const supabase = await createSupabaseClient()

  const { data } = await supabase
    .from("organization_members")
    .select("organization_id, organizations(name)")
    .eq("user_id", userId)
    .maybeSingle()

  if (!data) return null

  return (data.organizations as any)?.name || null
})

// Cache organization ID fetch
export const getCachedOrganizationId = cache(async (userId: string) => {
  const supabase = await createSupabaseClient()

  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .maybeSingle()

  return data ? String(data.organization_id) : ""
})

// Cache organization member check (for middleware)
export const getCachedOrganizationMember = cache(async (userId: string) => {
  const supabase = await createSupabaseClient()

  const { data } = await supabase
    .from("organization_members")
    .select(`
      is_active,
      organization:organizations(
        id,
        is_active
      )
    `)
    .eq("user_id", userId)
    .maybeSingle()

  return data
})

// Cache positions fetch - prevents duplicate requests within a render
export const getCachedPositions = cache(async (organizationId: string) => {
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from("positions")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("title", { ascending: true })

  if (error) {
    logger.error("Error fetching cached positions:", error)
    return []
  }

  return data || []
})

// Cache groups/departments fetch
export const getCachedGroups = cache(async (organizationId: string) => {
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (error) {
    logger.error("Error fetching cached groups:", error)
    return []
  }

  return data || []
})

// Cache work schedules fetch
export const getCachedWorkSchedules = cache(async (organizationId: string) => {
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from("work_schedules")
    .select("id, organization_id, code, name, description, schedule_type, is_default, is_active, created_at, updated_at")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (error) {
    logger.error("Error fetching cached work schedules:", error)
    return []
  }

  return data || []
})

// Cache members fetch
export const getCachedMembers = cache(async (organizationId: string) => {
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      *,
      user:user_id(*),
      departments:department_id(*),
      positions:position_id(*),
      rfid_cards(*)
    `)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })

  if (error) {
    logger.error("Error fetching cached members:", error)
    return []
  }

  return data || []
})
