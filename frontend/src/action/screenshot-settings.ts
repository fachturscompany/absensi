'use server'

import { createClient } from '@/utils/supabase/server'

// ============================================================
// Types
// ============================================================

export interface IScreenshotSetting {
    id: number
    organization_id: number
    organization_member_id: number | null
    is_enabled: boolean
    frequency_seconds: number
    blur_screenshots: boolean
    allow_delete: boolean
    retention_days: number
    created_at: string
    updated_at: string
}

export interface ScreenshotSettingsData {
    global: IScreenshotSetting | null
    members: Record<number, IScreenshotSetting>
}

// ============================================================
// Fetch Settings
// ============================================================

export async function getScreenshotSettings(
    organizationId: string
): Promise<{ success: boolean; data?: ScreenshotSettingsData; message?: string }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('screenshot_settings')
            .select('*')
            .eq('organization_id', Number(organizationId))

        if (error) {
            throw error
        }

        const result: ScreenshotSettingsData = {
            global: null,
            members: {}
        }

        if (data && data.length > 0) {
            data.forEach((setting: IScreenshotSetting) => {
                if (setting.organization_member_id === null) {
                    result.global = setting
                } else {
                    result.members[setting.organization_member_id] = setting
                }
            })
        }

        return { success: true, data: result }
    } catch (err: any) {
        console.error('Error fetching screenshot settings:', err)
        return { success: false, message: err.message }
    }
}

// ============================================================
// Upsert Settings
// ============================================================

export interface UpsertScreenshotSettingParams {
    organization_id: number
    organization_member_id?: number | null // null for global
    is_enabled?: boolean
    frequency_seconds?: number
    blur_screenshots?: boolean
    allow_delete?: boolean
    retention_days?: number
}

export async function upsertScreenshotSetting(
    params: UpsertScreenshotSettingParams
): Promise<{ success: boolean; data?: IScreenshotSetting; message?: string }> {
    try {
        const supabase = await createClient()

        // Ambil default setting jika parameter ada yang tidak dikirim supaya tak ada nilai null saat update parsial kalau belum ada row
        // Lebih mudah jika kita pass semua data spesifik saat toggle

        // We will do a full upsert, relying on the unique constraint (organization_id, organization_member_id).
        // The DB will use defaults if it's an insert. If we pass undefined, standard Supabase client behavior omits it from update, but might complain on insert if required data is missing.
        // Fortunately only organization_id is required. The rest have DB defaults.

        // Explicitly handle member_id undefined -> null
        const payload = {
            ...params,
            organization_member_id: params.organization_member_id === undefined ? null : params.organization_member_id,
            updated_at: new Date().toISOString()
        }

        const { data, error } = await supabase
            .from('screenshot_settings')
            .upsert(payload, {
                onConflict: 'organization_id, organization_member_id',
                ignoreDuplicates: false
            })
            .select()
            .single()

        if (error) {
            throw error
        }

        return { success: true, data }
    } catch (err: any) {
        console.error('Error upserting screenshot setting:', err)
        return { success: false, message: err.message }
    }
}
