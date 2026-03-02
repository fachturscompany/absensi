'use server'

import { createClient } from '@/utils/supabase/server'
import type { AppActivityEntry } from '@/lib/data/dummy-data' // Assuming we keep the type for now

export async function getAppsActivityByMemberAndDate(
    organizationMemberId: string,
    startDate: string,
    endDate: string,
    projectId?: string
): Promise<{ success: boolean; data?: AppActivityEntry[]; message?: string }> {
    try {
        const supabase = await createClient()

        // First, let's fetch tool usages for the member in the date range
        let query = supabase
            .from('tool_usages')
            .select(`
        id,
        tool_name,
        tracked_seconds,
        activations,
        usage_date,
        project_id,
        parent_id,
        projects ( name )
      `)
            .eq('organization_member_id', Number(organizationMemberId))
            .gte('usage_date', startDate)
            .lte('usage_date', endDate)

        if (projectId && projectId !== 'all') {
            query = query.eq('project_id', Number(projectId))
        }

        const { data, error } = await query

        if (error) {
            throw error
        }

        if (!data || data.length === 0) {
            return { success: true, data: [] }
        }

        // Aggregate data grouped by: usage_date, project_id, tool_name
        const rowsMap = new Map<number, any>()
        data.forEach(row => rowsMap.set(row.id, row))

        const finalResultsMap = new Map<string, AppActivityEntry>()

        data.forEach((row: any) => {
            if (row.parent_id) {
                const parentRow = rowsMap.get(row.parent_id)
                if (parentRow) {
                    const dateKey = parentRow.usage_date
                    const pId = parentRow.project_id ? String(parentRow.project_id) : 'unassigned'
                    const toolName = parentRow.tool_name || 'Unknown App'
                    const key = `${dateKey}|${pId}|${toolName}`

                    if (!finalResultsMap.has(key)) {
                        finalResultsMap.set(key, {
                            id: String(parentRow.id),
                            projectId: pId,
                            projectName: parentRow.projects?.name || 'Unassigned',
                            appName: toolName,
                            timeSpent: (parentRow.tracked_seconds || 0) / 3600,
                            sessions: parentRow.activations || 0,
                            memberId: organizationMemberId,
                            date: dateKey,
                            details: []
                        })
                    }

                    const entry = finalResultsMap.get(key)!
                    if (entry.details) {
                        entry.details.push({
                            id: String(row.id),
                            appName: row.tool_name || 'Unknown App',
                            timeSpent: (row.tracked_seconds || 0) / 3600,
                            sessions: row.activations || 0
                        })
                    }
                }
            } else {
                const dateKey = row.usage_date
                const pId = row.project_id ? String(row.project_id) : 'unassigned'
                const toolName = row.tool_name || 'Unknown App'
                const key = `${dateKey}|${pId}|${toolName}`

                if (!finalResultsMap.has(key)) {
                    finalResultsMap.set(key, {
                        id: String(row.id),
                        projectId: pId,
                        projectName: row.projects?.name || 'Unassigned',
                        appName: toolName,
                        timeSpent: (row.tracked_seconds || 0) / 3600,
                        sessions: row.activations || 0,
                        memberId: organizationMemberId,
                        date: dateKey,
                        details: []
                    })
                }
            }
        })

        return {
            success: true,
            data: Array.from(finalResultsMap.values())
        }

    } catch (err: any) {
        console.error('Error in getAppsActivityByMemberAndDate:', err)
        return { success: false, message: err.message || 'Failed to fetch apps activity' }
    }
}
