'use server'

import { createClient } from '@/utils/supabase/server'

export type AchievementType = 'efficiency_pro' | 'productivity_champ' | 'time_hero'

export interface IAchievementSetting {
    id?: number
    organization_id: number
    organization_member_id: number | null
    achievement_type: AchievementType
    is_enabled: boolean
    goal_value: number
    created_at?: string
    updated_at?: string
}

/**
 * Fetch achievement settings for an organization and type
 */
export async function getAchievementSettings(
    organizationId: string,
    type: AchievementType
): Promise<{ success: boolean; data?: IAchievementSetting; message?: string }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('achievement_settings')
            .select('*')
            .eq('organization_id', Number(organizationId))
            .eq('achievement_type', type)
            .is('organization_member_id', null)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return { success: true, data: undefined }
            }
            throw error
        }

        return { success: true, data }
    } catch (err: any) {
        console.error(`Error fetching achievement settings (${type}):`, err)
        return { success: false, message: err.message }
    }
}

/**
 * Fetch all member overrides for a specific achievement type
 */
export async function getAllMemberAchievementSettings(
    organizationId: string,
    type: AchievementType
): Promise<{ success: boolean; data?: Record<number, IAchievementSetting>; message?: string }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('achievement_settings')
            .select('*')
            .eq('organization_id', Number(organizationId))
            .eq('achievement_type', type)
            .not('organization_member_id', 'is', null)

        if (error) throw error

        const result: Record<number, IAchievementSetting> = {}
        data.forEach((row: IAchievementSetting) => {
            if (row.organization_member_id) {
                result[row.organization_member_id] = row
            }
        })

        return { success: true, data: result }
    } catch (err: any) {
        console.error(`Error fetching member achievement settings (${type}):`, err)
        return { success: false, message: err.message }
    }
}

/**
 * Upsert achievement setting (global or member-specific)
 */
export async function upsertAchievementSetting(
    payload: Partial<IAchievementSetting> & { organization_id: number; achievement_type: AchievementType; goal_value: number }
): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('achievement_settings')
            .upsert({
                ...payload,
                organization_member_id: payload.organization_member_id || null,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'organization_id,organization_member_id,achievement_type'
            })
            .select()
            .single()

        if (error) throw error

        return { success: true, data }
    } catch (err: any) {
        console.error('Error upserting achievement setting:', err)
        return { success: false, message: err.message }
    }
}
