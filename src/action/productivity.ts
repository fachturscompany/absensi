"use client"

import { createClient } from "@/utils/supabase/client"

export interface IProductivityCategory {
    id?: number
    organization_id: number
    name: string
    description?: string
    match_type: 'app_name' | 'domain' | 'url_pattern'
    match_pattern: string
    productivity_score: number
    is_productive: 'core-work' | 'non-core-work' | 'unproductive'
    created_at?: string
    updated_at?: string
}

export interface IUnclassifiedItem {
    name: string
    type: 'app_name' | 'domain'
}

/**
 * Fetch all classified items for an organization
 */
export async function getProductivityCategories(organizationId: string | number) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('productivity_categories')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching productivity categories:', error)
        return { success: false, message: error.message, data: [] }
    }

    return { success: true, data: data as IProductivityCategory[] }
}

/**
 * Fetch items from tool_usages and url_visits that haven't been classified yet
 */
export async function getUnclassifiedItems(organizationId: string | number) {
    const supabase = createClient()

    // 1. Get member IDs for this organization
    const { data: orgMembers, error: memError } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)

    if (memError || !orgMembers) {
        return { success: false, message: memError?.message || 'No members found', data: [] }
    }
    const memberIds = orgMembers.map((m: { id: string | number }) => m.id)

    // Fetch Apps
    const { data: apps, error: e1 } = await supabase
        .from('tool_usages')
        .select('tool_name')
        .in('organization_member_id', memberIds)

    // Fetch Domains
    const { data: domains, error: e2 } = await supabase
        .from('url_visits')
        .select('domain')
        .in('organization_member_id', memberIds)

    if (e1 || e2) {
        console.error('Error fetching unclassified items:', e1 || e2)
        return { success: false, message: (e1 || e2)?.message, data: [] }
    }

    // UNIQUE and Map
    const uniqueApps = Array.from(new Set((apps || []).map((a: { tool_name: string }) => a.tool_name)))
    const uniqueDomains = Array.from(new Set((domains || []).filter((d: { domain: string | null }) => d.domain).map((d: { domain: string }) => d.domain)))

    const unclassified: IUnclassifiedItem[] = [
        ...uniqueApps.map(name => ({ name: name as string, type: 'app_name' as const })),
        ...uniqueDomains.map(name => ({ name: name as string, type: 'domain' as const }))
    ]

    return { success: true, data: unclassified }
}

/**
 * Save or update a classification
 */
export async function upsertProductivityCategory(payload: IProductivityCategory) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('productivity_categories')
        .upsert({
            organization_id: payload.organization_id,
            name: payload.name,
            description: payload.description,
            match_type: payload.match_type,
            match_pattern: payload.match_pattern,
            productivity_score: payload.productivity_score,
            is_productive: payload.is_productive,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'organization_id,match_type,match_pattern'
        })
        .select()

    if (error) {
        console.error('Error upserting productivity category:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            payload
        })
        return { success: false, message: error.message }
    }

    return { success: true, data }
}

/**
 * Delete a classification
 */
export async function deleteProductivityCategory(id: number) {
    const supabase = createClient()

    const { error } = await supabase
        .from('productivity_categories')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting productivity category:', error)
        return { success: false, message: error.message }
    }

    return { success: true }
}
