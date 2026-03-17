'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface AlertRule {
    id?: number
    organization_id: number
    name: string
    trigger_type: string
    threshold_minutes?: number
    template_key: string
    notify_admin: boolean
    notify_member: boolean
    is_enabled: boolean
    created_at?: string
    updated_at?: string
}

export async function getAlertRules(organizationId: string): Promise<{ success: boolean, data: AlertRule[], message?: string }> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('organization_alert_rules')
            .select('*')
            .eq('organization_id', Number(organizationId))
            .order('created_at', { ascending: true })

        if (error) throw error
        return { success: true, data: data || [] }
    } catch (err: any) {
        console.error('Error fetching alert rules:', err)
        return { success: false, data: [], message: err.message }
    }
}

export async function upsertAlertRule(payload: AlertRule): Promise<{ success: boolean, data?: any, message?: string }> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('organization_alert_rules')
            .upsert({
                ...payload,
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) throw error
        revalidatePath('/settings/members/email-notifications/alerts')
        return { success: true, data }
    } catch (err: any) {
        console.error('Error upserting alert rule:', err)
        return { success: false, message: err.message }
    }
}

export async function deleteAlertRule(id: number): Promise<{ success: boolean, message?: string }> {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('organization_alert_rules')
            .delete()
            .eq('id', id)

        if (error) throw error
        revalidatePath('/settings/members/email-notifications/alerts')
        return { success: true }
    } catch (err: any) {
        console.error('Error deleting alert rule:', err)
        return { success: false, message: err.message }
    }
}

export async function toggleAlertRule(id: number, isEnabled: boolean): Promise<{ success: boolean, message?: string }> {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('organization_alert_rules')
            .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
            .eq('id', id)

        if (error) throw error
        revalidatePath('/settings/members/email-notifications/alerts')
        return { success: true }
    } catch (err: any) {
        console.error('Error toggling alert rule:', err)
        return { success: false, message: err.message }
    }
}
