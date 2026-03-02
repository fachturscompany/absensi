'use server'

import { createClient } from '@/utils/supabase/server'
import type { UrlActivityEntry } from '@/lib/data/dummy-data'

export async function getUrlsActivityByMemberAndDate(
    organizationMemberId: string,
    startDate: string,
    endDate: string,
    projectId?: string
): Promise<{ success: boolean; data?: UrlActivityEntry[]; message?: string }> {
    try {
        const supabase = await createClient()

        let query = supabase
            .from('url_visits')
            .select(`
        id,
        url,
        title,
        tracked_seconds,
        visit_date,
        project_id,
        parent_id,
        projects ( name )
      `)
            .eq('organization_member_id', Number(organizationMemberId))
            .gte('visit_date', startDate)
            .lte('visit_date', endDate)

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

        // Helper to extract base domain (site) from full URL
        const getBaseDomain = (fullUrl: string) => {
            try {
                let checkUrl = fullUrl
                if (!checkUrl.startsWith('http')) {
                    checkUrl = 'http://' + checkUrl
                }
                const urlObj = new URL(checkUrl)
                return urlObj.hostname.replace(/^www\./, '')
            } catch (e) {
                return fullUrl.split('/')[0] || fullUrl
            }
        }

        // Step 1: Map all rows by ID for easy lookup
        const rowsMap = new Map<number, any>()
        data.forEach(row => rowsMap.set(row.id, row))

        // Step 2: Build the hierarchy
        const finalResultsMap = new Map<string, UrlActivityEntry>()

        data.forEach((row: any) => {
            // IF it's a child record (has parent_id)
            if (row.parent_id) {
                const parentRow = rowsMap.get(row.parent_id)
                if (parentRow) {
                    const dateKey = parentRow.visit_date
                    const pId = parentRow.project_id ? String(parentRow.project_id) : 'unassigned'
                    const site = getBaseDomain(parentRow.url || '')
                    const key = `${dateKey}|${pId}|${site}`

                    if (!finalResultsMap.has(key)) {
                        finalResultsMap.set(key, {
                            id: String(parentRow.id),
                            projectId: pId,
                            projectName: parentRow.projects?.name || 'Unassigned',
                            memberId: organizationMemberId,
                            site: site,
                            timeSpent: (parentRow.tracked_seconds || 0) / 3600,
                            date: dateKey,
                            details: []
                        })
                    }

                    const entry = finalResultsMap.get(key)!
                    const timeInHours = (row.tracked_seconds || 0) / 3600

                    // Add this child as a detail
                    if (entry.details) {
                        entry.details.push({
                            id: String(row.id),
                            url: row.url || '',
                            title: row.title || row.url || '',
                            timeSpent: timeInHours
                        })
                    }
                }
            } else {
                // IF it's a parent record (no parent_id)
                const dateKey = row.visit_date
                const pId = row.project_id ? String(row.project_id) : 'unassigned'
                const site = getBaseDomain(row.url || '')
                const key = `${dateKey}|${pId}|${site}`

                if (!finalResultsMap.has(key)) {
                    finalResultsMap.set(key, {
                        id: String(row.id),
                        projectId: pId,
                        projectName: row.projects?.name || 'Unassigned',
                        memberId: organizationMemberId,
                        site: site,
                        timeSpent: (row.tracked_seconds || 0) / 3600,
                        date: dateKey,
                        details: []
                    })
                } else {
                    // Update parent time if already exists
                    // Only update if this specific row ID is the one representing the summary
                    // or if it was already created by a child. 
                    // To keep it simple: parent time is whatever is in the parent row's tracked_seconds.
                }
            }
        })

        return {
            success: true,
            data: Array.from(finalResultsMap.values())
        }

    } catch (err: any) {
        console.error('Error in getUrlsActivityByMemberAndDate:', err)
        return { success: false, message: err.message || 'Failed to fetch urls activity' }
    }
}
