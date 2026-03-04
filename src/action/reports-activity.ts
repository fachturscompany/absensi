'use server'

import { createAdminClient } from '@/utils/supabase/admin'
export interface ReportQueryParams {
    organizationId: string
    startDate?: string
    endDate?: string
    memberId?: string
    projectId?: string
}

export async function getAppsReportData(params: ReportQueryParams): Promise<{ success: boolean; data: any[]; message?: string }> {
    try {
        const supabase = createAdminClient()
        console.log(`[getAppsReportData] Query for Org: ${params.organizationId}, Member: ${params.memberId}`)

        // 1. Get Member IDs for this organization
        let memberIds: number[] = []
        if (params.memberId && params.memberId !== 'all') {
            memberIds = [Number(params.memberId)]
        } else {
            const { data: members, error: mErr } = await supabase
                .from('organization_members')
                .select('id')
                .eq('organization_id', Number(params.organizationId))

            if (mErr) throw mErr
            memberIds = (members || []).map(m => m.id)
        }

        console.log(`[getAppsReportData] Found ${memberIds.length} members for this query`)
        if (memberIds.length === 0) {
            return { success: true, data: [], message: "No members found for this organization" }
        }

        // 2. Fetch tool_usages for these members
        let query = supabase
            .from('tool_usages')
            .select(`
                id,
                tool_name,
                tracked_seconds,
                usage_date,
                project_id,
                is_productive,
                organization_member_id,
                organization_members (
                    id,
                    user_profiles (
                        display_name,
                        first_name,
                        last_name,
                        email
                    )
                ),
                projects ( name )
            `)
            .in('organization_member_id', memberIds)

        if (params.startDate) query = query.gte('usage_date', params.startDate)
        if (params.endDate) query = query.lte('usage_date', params.endDate)

        const { data, error } = await query.order('usage_date', { ascending: false })

        console.log(`[getAppsReportData] tool_usages count: ${data?.length || 0}`)
        if (error) {
            console.error('getAppsReportData error:', error)
            return { success: false, data: [], message: error.message }
        }

        const mapped = (data || []).map((row: any) => {
            const profile = row.organization_members?.user_profiles;
            let memberName = `Member #${row.organization_members?.id}`;
            if (profile) {
                const dName = (profile.display_name || "").trim();
                const fName = (profile.first_name || "").trim();
                const lName = (profile.last_name || "").trim();
                if (dName) memberName = dName;
                else if (fName || lName) memberName = `${fName} ${lName}`.trim();
                else if (profile.email) memberName = profile.email;
            }

            return {
                id: String(row.id),
                name: row.tool_name || 'Unknown',
                category: row.is_productive ? 'Productive' : 'Neutral',
                projectName: row.projects?.name || 'Unassigned',
                memberId: String(row.organization_member_id),
                memberName: memberName,
                date: row.usage_date,
                timeSpent: (row.tracked_seconds || 0) / 60,
                isProductive: row.is_productive
            }
        })

        return { success: true, data: mapped }
    } catch (err: any) {
        console.error('getAppsReportData exception:', err)
        return { success: false, data: [], message: err.message }
    }
}

export async function getUrlsReportData(params: ReportQueryParams): Promise<{ success: boolean; data: any[]; message?: string }> {
    try {
        const supabase = createAdminClient()
        console.log(`[getUrlsReportData] Query for Org: ${params.organizationId}, Member: ${params.memberId}`)

        // 1. Get Member IDs
        let memberIds: number[] = []
        if (params.memberId && params.memberId !== 'all') {
            memberIds = [Number(params.memberId)]
        } else {
            const { data: members, error: mErr } = await supabase
                .from('organization_members')
                .select('id')
                .eq('organization_id', Number(params.organizationId))
            if (mErr) throw mErr
            memberIds = (members || []).map(m => m.id)
        }

        if (memberIds.length === 0) {
            return { success: true, data: [], message: "No members found" }
        }

        // 2. Fetch url_visits
        let query = supabase
            .from('url_visits')
            .select(`
                id,
                url,
                title,
                tracked_seconds,
                visit_date,
                project_id,
                organization_member_id,
                organization_members (
                    id,
                    user_profiles (
                        display_name,
                        first_name,
                        last_name,
                        email
                    )
                ),
                projects ( name )
            `)
            .in('organization_member_id', memberIds)

        if (params.startDate) query = query.gte('visit_date', params.startDate)
        if (params.endDate) query = query.lte('visit_date', params.endDate)

        const { data, error } = await query.order('visit_date', { ascending: false })

        if (error) {
            console.error('getUrlsReportData error:', error)
            return { success: false, data: [], message: error.message }
        }

        const getBaseDomain = (fullUrl: string) => {
            try {
                let checkUrl = fullUrl
                if (!checkUrl.startsWith('http')) checkUrl = 'http://' + checkUrl
                const urlObj = new URL(checkUrl)
                return urlObj.hostname.replace(/^www\./, '')
            } catch (e) {
                return fullUrl.split('/')[0] || fullUrl
            }
        }

        const mapped = (data || []).map((row: any) => {
            const profile = row.organization_members?.user_profiles;
            let memberName = `Member #${row.organization_members?.id}`;
            if (profile) {
                const dName = (profile.display_name || "").trim();
                const fName = (profile.first_name || "").trim();
                const lName = (profile.last_name || "").trim();
                if (dName) memberName = dName;
                else if (fName || lName) memberName = `${fName} ${lName}`.trim();
                else if (profile.email) memberName = profile.email;
            }

            return {
                id: String(row.id),
                site: getBaseDomain(row.url || ''),
                title: row.title || row.url || '',
                projectName: row.projects?.name || 'Unassigned',
                memberId: String(row.organization_member_id),
                memberName: memberName,
                date: row.visit_date,
                timeSpent: (row.tracked_seconds || 0) / 60
            }
        })

        return { success: true, data: mapped }
    } catch (err: any) {
        console.error('getUrlsReportData exception:', err)
        return { success: false, data: [], message: err.message }
    }
}
