'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface EmailTemplate {
    id?: number
    organization_id: number
    template_key: string
    name?: string // Added for custom templates
    subject: string
    body_html: string
    is_enabled: boolean
    created_at?: string
    updated_at?: string
}

export async function getEmailTemplates(organizationId: string): Promise<{ success: boolean, data: EmailTemplate[], message?: string }> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('organization_email_templates')
            .select('*')
            .eq('organization_id', Number(organizationId))

        if (error) throw error
        return { success: true, data: data || [] }
    } catch (err: any) {
        console.error('Error fetching email templates:', err)
        return { success: false, data: [], message: err.message }
    }
}

export async function upsertEmailTemplate(payload: EmailTemplate): Promise<{ success: boolean, data?: any, message?: string }> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('organization_email_templates')
            .upsert({
                ...payload,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'organization_id, template_key'
            })
            .select()
            .single()

        if (error) throw error
        revalidatePath('/settings/members/email-notifications/templates')
        return { success: true, data }
    } catch (err: any) {
        console.error('Error upserting email template:', err)
        return { success: false, message: err.message }
    }
}

export async function getTemplateByKey(organizationId: string, templateKey: string): Promise<{ success: boolean, data?: EmailTemplate, message?: string }> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('organization_email_templates')
            .select('*')
            .eq('organization_id', Number(organizationId))
            .eq('template_key', templateKey)
            .single()

        if (error && error.code !== 'PGRST116') throw error
        return { success: true, data: data || undefined }
    } catch (err: any) {
        console.error('Error fetching email template by key:', err)
        return { success: false, message: err.message }
    }
}
