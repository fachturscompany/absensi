'use server'

import { createClient } from '@/utils/supabase/server'
import { getUserOrganization, updateOrganization as updateOrg, deleteOrganization as deleteOrg } from './organization'

export { updateOrg as updateOrganization, deleteOrg as deleteOrganization }

export async function getCurrentUserOrganization() {
  return getUserOrganization();
}

export async function regenerateInviteCode(orgId: string) {
  try {
    const supabase = await createClient()
    const newCode = Math.random().toString(36).substring(2, 10).toUpperCase()

    const { data, error } = await supabase
      .from('organizations')
      .update({ inv_code: newCode })
      .eq('id', orgId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}

import { IOrganization } from '@/interface'

export type OrganizationUpdateData = Partial<IOrganization>;


// ============================================================
// Types
// ============================================================

export interface IOrgSettingRow {
  id: number
  organization_id: number
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

export interface IMemberSettingRow {
  id: number
  organization_member_id: number
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

// ============================================================
// Organization Settings
// ============================================================

export async function getOrgSettings(
  organizationId: string
): Promise<{ success: boolean; data?: Record<string, any>; message?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('organization_settings')
      .select('settings')
      .eq('organization_id', Number(organizationId))
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found, return empty settings
        return { success: true, data: {} }
      }
      throw error
    }

    return { success: true, data: data.settings }
  } catch (err: any) {
    console.error('Error fetching org settings:', err)
    return { success: false, message: err.message }
  }
}

export async function upsertOrgSetting(
  organizationId: string,
  settings: Record<string, any>
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const supabase = await createClient()

    // Get current settings first to merge
    const currentRes = await getOrgSettings(organizationId)
    const currentSettings = currentRes.data || {}

    const mergedSettings = {
      ...currentSettings,
      ...settings
    }

    const { data, error } = await supabase
      .from('organization_settings')
      .upsert({
        organization_id: Number(organizationId),
        settings: mergedSettings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (err: any) {
    console.error('Error upserting org setting:', err)
    return { success: false, message: err.message }
  }
}

// ============================================================
// Member Settings
// ============================================================

export async function getMemberSettings(
  memberId: string
): Promise<{ success: boolean; data?: Record<string, any>; message?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('organization_member_settings')
      .select('settings')
      .eq('organization_member_id', Number(memberId))
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: true, data: {} }
      }
      throw error
    }

    return { success: true, data: data.settings }
  } catch (err: any) {
    console.error('Error fetching member settings:', err)
    return { success: false, message: err.message }
  }
}

/**
 * Fetch all member settings for an organization (for bulk loading)
 */
export async function getAllMemberSettings(
  organizationId: string
): Promise<{ success: boolean; data?: Record<number, Record<string, any>>; message?: string }> {
  try {
    const supabase = await createClient()

    // Join with organization_members to filter by organization_id
    const { data, error } = await supabase
      .from('organization_member_settings')
      .select(`
                organization_member_id,
                settings,
                organization_members!inner(organization_id)
            `)
      .eq('organization_members.organization_id', Number(organizationId))

    if (error) {
      throw error
    }

    const result: Record<number, Record<string, any>> = {}
    data.forEach((row: any) => {
      result[row.organization_member_id] = row.settings
    })

    return { success: true, data: result }
  } catch (err: any) {
    console.error('Error fetching all member settings:', err)
    return { success: false, message: err.message }
  }
}

export async function upsertMemberSetting(
  memberId: string,
  settings: Record<string, any>
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const supabase = await createClient()

    // Get current settings first to merge
    const currentRes = await getMemberSettings(memberId)
    const currentSettings = currentRes.data || {}

    const mergedSettings = {
      ...currentSettings,
      ...settings
    }

    const { data, error } = await supabase
      .from('organization_member_settings')
      .upsert({
        organization_member_id: Number(memberId),
        settings: mergedSettings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_member_id'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (err: any) {
    console.error('Error upserting member setting:', err)
    return { success: false, message: err.message }
  }
}
