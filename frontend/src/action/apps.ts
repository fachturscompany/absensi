'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import type { AppActivityEntry } from '@/lib/data/dummy-data'
import fs from 'fs'

export async function getAppsActivityByMemberAndDate(
    organizationMemberId: string,
    startDate: string,
    endDate: string,
    projectId?: string
): Promise<{ success: boolean; data?: AppActivityEntry[]; message?: string }> {
    try {
        // Use admin client to ensure we can read tool_usages (often has RLS restrictions)
        const supabase = createAdminClient()

        let query = supabase
            .from('tool_usages')
            .select(`
                id,
                tool_name,
                tracked_seconds,
                activations,
                usage_date,
                project_id,
                projects ( name ),
                is_productive
            `)
            .eq('organization_member_id', Number(organizationMemberId))
            .gte('usage_date', startDate)
            .lte('usage_date', endDate)

        if (projectId && projectId !== 'all') {
            query = query.eq('project_id', Number(projectId))
        }

        const { data, error } = await query

        // DEBUG LOGGING TO ROOT FILE
        const debugLog = `
--- DEBUG ACTION ---
Time: ${new Date().toISOString()}
Params: memberId=${organizationMemberId}, start=${startDate}, end=${endDate}
Error: ${JSON.stringify(error)}
Data Length: ${data?.length ?? 0}
First Row: ${data && data.length > 0 ? JSON.stringify(data[0]) : 'NONE'}
`
        fs.appendFileSync('debug_apps.log', debugLog)

        if (error) {
            console.error('Supabase error:', error)
            return { success: false, message: error.message }
        }

        if (!data || data.length === 0) {
            return { success: true, data: [] }
        }

        // Extremely simple aggregation for debugging
        const results: AppActivityEntry[] = data.map((row: any) => ({
            id: String(row.id),
            appName: row.tool_name || 'Unknown',
            projectName: row.projects?.name || 'Unassigned',
            projectId: row.project_id ? String(row.project_id) : 'unassigned',
            memberId: organizationMemberId,
            timeSpent: (row.tracked_seconds || 0) / 3600,
            sessions: row.activations || 0,
            date: row.usage_date,
            isProductive: row.is_productive,
            details: []
        }))

        return { success: true, data: results }
    } catch (err: any) {
        console.error('Error in getAppsActivityByMemberAndDate:', err)
        fs.appendFileSync('debug_apps.log', `CATCH ERROR: ${err.message}\n`)
        return { success: false, message: err.message || 'Failed to fetch apps activity' }
    }
}
