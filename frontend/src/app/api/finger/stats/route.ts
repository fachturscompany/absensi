import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(req: Request) {
    const started = Date.now()
    try {
        const { searchParams } = new URL(req.url)
        const orgParam = searchParams.get('organizationId')

        const supabase = await createClient()
        const admin = createAdminClient()

        // Resolve org
        let organizationId: number | null = orgParam ? Number(orgParam) : null
        if (!organizationId) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: member } = await supabase
                    .from('organization_members')
                    .select('organization_id')
                    .eq('user_id', user.id)
                    .maybeSingle()
                if (member?.organization_id) organizationId = Number(member.organization_id)
            }
        }

        if (!organizationId) {
            return NextResponse.json(
                { success: true, data: { total: 0, complete: 0, partial: 0, unregistered: 0 } },
                { headers: { 'Cache-Control': 'private, max-age=30', 'Vary': 'Cookie' } }
            )
        }

        // Get total active members
        const { count: total } = await admin
            .from('organization_members')
            .select('id', { count: 'planned', head: true })
            .eq('organization_id', organizationId)
            .eq('is_active', true)

        // Get all member IDs
        const { data: memberData } = await admin
            .from('organization_members')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('is_active', true)

        if (!memberData || memberData.length === 0) {
            return NextResponse.json(
                { success: true, data: { total: 0, complete: 0, partial: 0, unregistered: 0 } },
                { headers: { 'Cache-Control': 'private, max-age=30', 'Vary': 'Cookie' } }
            )
        }

        const memberIds = memberData.map((m: any) => m.id)

        // Get biometric data for these members - SAME AS MEMBERS API
        const { data: bioData } = await admin
            .from('biometric_data')
            .select('organization_member_id, finger_number, template_data, enrollment_date, created_at')
            .in('organization_member_id', memberIds)
            .eq('biometric_type', 'FINGERPRINT')
            .eq('is_active', true)

        // Count stats using SAME logic as members API
        let complete = 0
        let partial = 0
        let unregistered = (total || 0)

        type BioRow = {
            organization_member_id: number | null
            finger_number: number | null
            template_data: unknown
            enrollment_date?: string | null
            created_at?: string | null
        }

        // Group biometric data by member (same as members API)
        const memberBioMap = new Map<number, BioRow[]>()
        if (bioData) {
            for (const b of bioData as BioRow[]) {
                const mid = b.organization_member_id
                if (!mid) continue

                // Check if template_data contains local_id (means registered)
                let hasLocalId = false
                try {
                    const t = typeof b.template_data === 'string' ? JSON.parse(b.template_data) : b.template_data
                    if (t && typeof (t as Record<string, unknown>).local_id !== 'undefined') {
                        const lid = (t as Record<string, unknown>).local_id as unknown
                        if (typeof lid === 'number') {
                            hasLocalId = true
                        } else if (typeof lid === 'string') {
                            const trimmed = lid.trim()
                            if (/^\d+$/.test(trimmed)) {
                                hasLocalId = true
                            }
                        }
                    }
                } catch {
                    // ignore parse errors
                }

                if (hasLocalId || (b.finger_number === 1 || b.finger_number === 2)) {
                    const arr = memberBioMap.get(mid) || []
                    arr.push(b)
                    memberBioMap.set(mid, arr)
                }
            }

            // Sort per member and assign finger numbers (same as members API)
            const fingerMap = new Map<number, Set<number>>()
            for (const [mid, rows] of memberBioMap) {
                rows.sort((a, b) => {
                    const da = a.enrollment_date || a.created_at || ''
                    const db = b.enrollment_date || b.created_at || ''
                    return da.localeCompare(db)
                })
                const set = new Set<number>()
                rows.forEach((row, idx) => {
                    let fn = row.finger_number
                    if (fn !== 1 && fn !== 2) {
                        const candidate = idx + 1
                        if (candidate === 1 || candidate === 2) fn = candidate
                    }
                    if (fn === 1 || fn === 2) set.add(fn)
                })
                fingerMap.set(mid, set)
            }

            // Calculate stats
            for (const [,fingers] of fingerMap.entries()) {
                const count = fingers.size
                if (count === 2) {
                    complete++
                    unregistered--
                } else if (count === 1) {
                    partial++
                    unregistered--
                }
            }
        }

        console.log('[STATS] Complete:', complete, 'Partial:', partial, 'Unregistered:', unregistered, 'Total:', total)

        return NextResponse.json(
            {
                success: true,
                data: {
                    total: total || 0,
                    complete,
                    partial,
                    unregistered
                }
            },
            { headers: { 'Cache-Control': 'private, max-age=30', 'Vary': 'Cookie', 'X-Response-Time': `${Date.now() - started}ms` } }
        )
    } catch (err: any) {
        console.error('Stats error:', err)
        return NextResponse.json(
            { success: false, message: err?.message || 'Internal error' },
            { status: 500 }
        )
    }
}
