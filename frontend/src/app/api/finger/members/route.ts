import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(req: Request) {
    // const started = Date.now()
    try {
        const { searchParams } = new URL(req.url)
        const limitParam = searchParams.get('limit')
        const pageParam = searchParams.get('page')
        const orgParam = searchParams.get('organizationId')

        // Filters
        const searchParam = searchParams.get('search')
        const deptParam = searchParams.get('department')
        let statusParam = searchParams.get('status') // 'all', 'complete', 'partial', 'unregistered'

        // Normalize input
        if (statusParam) {
            statusParam = statusParam.toLowerCase().trim()
            if (statusParam === 'not_registered') statusParam = 'unregistered'
        }

        const limit = parseInt(limitParam || '10', 10) || 10
        const page = parseInt(pageParam || '1', 10) || 1

        const supabase = await createClient()
        const admin = createAdminClient()

        // 1. Resolve Organization
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
            return NextResponse.json({ success: true, data: [], pagination: { total: 0 } })
        }

        // --- FAST PATH: IF STATUS IS 'ALL', WE PAGINATE DIRECTLY IN DB ---
        if ((!statusParam || statusParam === 'all') && (!deptParam || deptParam === 'All Groups')) {
            // 1. Count Total
            let countQuery = admin
                .from('organization_members')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', organizationId)
                .eq('is_active', true)

            if (searchParam) {
                countQuery = countQuery.or(`display_name.ilike.%${searchParam}%,first_name.ilike.%${searchParam}%,last_name.ilike.%${searchParam}%`, { foreignTable: 'user_profiles' })
            }

            const { count } = await countQuery
            const totalItems = count || 0

            // Pagination Calc
            const totalPages = Math.max(1, Math.ceil(totalItems / limit))
            const safePage = Math.min(Math.max(1, page), totalPages)
            const from = (safePage - 1) * limit
            const to = from + limit - 1

            if (totalItems === 0) {
                return NextResponse.json({ success: true, data: [], pagination: { total: 0, page: safePage, limit, totalPages: 0 }, filters: { departments: [] } })
            }

            // 2. Fetch Page Data
            let query = admin
                .from('organization_members')
                .select(`
                    id,
                    user_id,
                    department_id,
                    organization_id,
                    is_active,
                    user_profiles!inner (
                        first_name,
                        last_name,
                        display_name,
                        phone,
                        email
                    )
                `)
                .eq('organization_id', organizationId)
                .eq('is_active', true)
                .order('id', { ascending: true })
                .range(from, to)

            if (searchParam) {
                query = query.or(`display_name.ilike.%${searchParam}%,first_name.ilike.%${searchParam}%,last_name.ilike.%${searchParam}%`, { foreignTable: 'user_profiles' })
            }

            const { data: members, error: fetchError } = await query

            if (fetchError) throw fetchError

            const pagedMembers = members || []
            const memberIds = pagedMembers.map(m => m.id)

            // 3. Fetch Biometric Data ONLY for these members
            const bioMap = new Map<number, Set<number>>()
            if (memberIds.length > 0) {
                const { data: bios } = await admin
                    .from('biometric_data')
                    .select('organization_member_id, finger_number, template_data, biometric_type, is_active, created_at, enrollment_date')
                    .in('organization_member_id', memberIds)
                    .eq('is_active', true)

                if (bios) {
                    const memberBios = new Map<number, typeof bios[0][]>()

                    bios.forEach(b => {
                        const type = b.biometric_type || ''
                        if (type.toLowerCase().includes('fingerprint') || type.toUpperCase() === 'FINGERPRINT') {
                            if (!memberBios.has(b.organization_member_id)) memberBios.set(b.organization_member_id, [])
                            memberBios.get(b.organization_member_id)!.push(b)
                        }
                    })

                    for (const [mid, rows] of memberBios.entries()) {
                        rows.sort((a, b) => {
                            const da = a.enrollment_date || a.created_at || ''
                            const db = b.enrollment_date || b.created_at || ''
                            return da.localeCompare(db)
                        })

                        const set = new Set<number>()
                        rows.forEach((row, idx) => {
                            let hasLocalId = false
                            try {
                                const t = typeof row.template_data === 'string' ? JSON.parse(row.template_data) : row.template_data
                                if (t && (t as any).local_id) hasLocalId = true
                            } catch { }

                            let fn = row.finger_number
                            if (hasLocalId || fn === 1 || fn === 2) {
                                if (fn !== 1 && fn !== 2) {
                                    const candidate = idx + 1
                                    if (candidate === 1 || candidate === 2) fn = candidate
                                }
                                if (fn === 1 || fn === 2) set.add(fn)
                            }
                        })
                        if (set.size > 0) bioMap.set(mid, set)
                    }
                }
            }

            // 4. Resolve Departments for this page (Optimization: Just fetch names for current IDs)
            const validDeptIds = Array.from(new Set(pagedMembers.map(m => m.department_id).filter(Boolean))) as number[]
            const deptNameMap = new Map<number, string>()
            if (validDeptIds.length > 0) {
                const { data: depts } = await admin.from('organization_departments').select('id, name').in('id', validDeptIds)
                depts?.forEach(d => deptNameMap.set(d.id, d.name))
            }

            // 5. Transform
            const data = pagedMembers.map(m => {
                const fingers = bioMap.get(m.id) || new Set<number>()
                const regCount = fingers.size
                let status = 'unregistered'
                if (regCount >= 2) status = 'complete'
                else if (regCount === 1) status = 'partial'

                const profile = Array.isArray(m.user_profiles) ? m.user_profiles[0] : m.user_profiles

                return {
                    id: m.id,
                    user_id: m.user_id,
                    display_name: profile?.display_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'No Name',
                    first_name: profile?.first_name,
                    last_name: profile?.last_name,
                    phone: profile?.phone,
                    email: profile?.email,
                    department_name: deptNameMap.get(m.department_id) || 'No Group',
                    finger1_registered: fingers.has(1),
                    finger2_registered: fingers.has(2),
                    _status: status
                }
            })

            return NextResponse.json(
                {
                    success: true,
                    data,
                    pagination: {
                        page: safePage,
                        limit,
                        total: totalItems,
                        totalPages
                    },
                    filters: {
                        departments: [] // Handled by separate API call now
                    }
                },
                { headers: { 'Cache-Control': 'private, no-cache', 'X-Strategy': 'FastPath' } }
            )
        }

        // --- OPTIMIZED SLOW PATH: BIO-FIRST FILTERING ---
        // Strategy: Fetch ALL Biometric Data for Organization (via JOIN) -> Identify Status -> DB Query

        // 1. Fetch ALL Biometric Data for Organization
        // We join with organization_members to filter by organization_id
        const { data: biosRaw, error: bioError } = await admin
            .from('biometric_data')
            .select('organization_member_id, finger_number, template_data, biometric_type, is_active, organization_members!inner(organization_id)')
            .eq('organization_members.organization_id', organizationId)
            .eq('is_active', true)

        if (bioError) throw bioError

        const bioMap = new Map<number, Set<number>>()

        if (biosRaw) {
            // Process bios to determine registered status
            type BioRow = typeof biosRaw[0]
            const memberBios = new Map<number, BioRow[]>()

            biosRaw.forEach((b: any) => { // Cast to any to avoid complex nested join typing issues in map
                const type = b.biometric_type || ''
                if (type.toLowerCase().includes('fingerprint') || type.toUpperCase() === 'FINGERPRINT') {
                    if (!memberBios.has(b.organization_member_id)) memberBios.set(b.organization_member_id, [])
                    memberBios.get(b.organization_member_id)!.push(b as BioRow)
                }
            })

            for (const [mid, rows] of memberBios.entries()) {
                // Sorting to be robust against simplified data
                rows.sort((a: any, b: any) => {
                    const da = a.enrollment_date || a.created_at || ''
                    const db = b.enrollment_date || b.created_at || ''
                    return da.localeCompare(db)
                })

                const set = new Set<number>()
                rows.forEach((row: any, idx) => {
                    let hasLocalId = false
                    try {
                        const t = typeof row.template_data === 'string' ? JSON.parse(row.template_data) : row.template_data
                        if (t && (t as any).local_id) hasLocalId = true
                    } catch { }

                    let fn = row.finger_number
                    if (hasLocalId || fn === 1 || fn === 2) {
                        if (fn !== 1 && fn !== 2) {
                            const candidate = idx + 1
                            if (candidate === 1 || candidate === 2) fn = candidate
                        }
                        if (fn === 1 || fn === 2) set.add(fn)
                    }
                })
                if (set.size > 0) bioMap.set(mid, set)
            }
        }

        // 2. Classify IDs
        const completeIds = new Set<number>()
        const partialIds = new Set<number>()
        const registeredIds = new Set<number>() // Union of complete + partial

        for (const [mid, fingers] of bioMap.entries()) {
            if (fingers.size >= 2) completeIds.add(mid)
            else if (fingers.size === 1) partialIds.add(mid)

            if (fingers.size > 0) registeredIds.add(mid)
        }

        let targetIds: number[] | null = null // null means "all" (but filtered by other things)
        let exclusionIds: number[] | null = null

        if (statusParam === 'complete') {
            targetIds = Array.from(completeIds)
        } else if (statusParam === 'partial') {
            targetIds = Array.from(partialIds)
        } else if (statusParam === 'unregistered') {
            // Exclusion strategy: WHERE id NOT IN (...)
            exclusionIds = Array.from(registeredIds)
        }

        // Optimization: If targetIds is empty for Complete/Partial, we can return early
        if ((statusParam === 'complete' || statusParam === 'partial') && targetIds && targetIds.length === 0) {
            return NextResponse.json({ success: true, data: [], pagination: { total: 0, page, limit, totalPages: 0 }, filters: { departments: [] } })
        }

        // 3. Main DB Query with Pagination
        let query = admin
            .from('organization_members')
            .select(`
                id,
                user_id,
                department_id,
                organization_id,
                is_active,
                user_profiles!inner (
                    first_name,
                    last_name,
                    display_name,
                    phone,
                    email
                )
            `, { count: 'exact' }) // Get count for pagination
            .eq('organization_id', organizationId)
            .eq('is_active', true)

        if (targetIds !== null) {
            query = query.in('id', targetIds)
        }
        if (exclusionIds !== null && exclusionIds.length > 0) {
            // Supabase 'not.in' expects comma separated string for values? No, array is supported usually.
            // Checking limits: if exclusion list is huge (1000+), might be an issue. 
            // But 'in' works. 'not.in' should work.
            query = query.not('id', 'in', `(${exclusionIds.join(',')})`)
        }

        // Apply other filters
        if (searchParam) {
            query = query.or(`display_name.ilike.%${searchParam}%,first_name.ilike.%${searchParam}%,last_name.ilike.%${searchParam}%`, { foreignTable: 'user_profiles' })
        }

        // Apply Department
        if (deptParam && deptParam !== 'All Groups') {
            // Resolve Dept ID first
            const { data: dept } = await admin
                .from('organization_departments')
                .select('id')
                .eq('organization_id', organizationId)
                .ilike('name', deptParam)
                .maybeSingle()
            if (dept) {
                query = query.eq('department_id', dept.id)
            } else {
                return NextResponse.json({ success: true, data: [], pagination: { total: 0 } })
            }
        }

        // Pagination
        const from = (page - 1) * limit
        const to = from + limit - 1

        query = query.order('id', { ascending: true }).range(from, to)

        const { data: members, count, error: fetchError } = await query
        if (fetchError) throw fetchError

        const totalItems = count || 0
        const totalPages = Math.max(1, Math.ceil(totalItems / limit))
        const pagedMembers = members || []

        // 4. Transform Results
        // Get Dept Names
        const validDeptIds = Array.from(new Set(pagedMembers.map(m => m.department_id).filter(Boolean))) as number[]
        const deptNameMap = new Map<number, string>()
        if (validDeptIds.length > 0) {
            const { data: depts } = await admin.from('organization_departments').select('id, name').in('id', validDeptIds)
            depts?.forEach(d => deptNameMap.set(d.id, d.name))
        }

        // Need Bio info for the Result ViewModel (Registered checkmarks)
        // We already        // Transform to ViewModel
        const allViewModels = pagedMembers.map((m: any) => { // Explicit any to simplify
            const fingers = bioMap.get(m.id) || new Set<number>()
            const regCount = fingers.size

            let status = 'unregistered'
            if (regCount >= 2) status = 'complete'
            else if (regCount === 1) status = 'partial'

            const profile = Array.isArray(m.user_profiles) ? m.user_profiles[0] : m.user_profiles

            return {
                id: m.id,
                user_id: m.user_id,
                display_name: profile?.display_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'No Name',
                first_name: profile?.first_name,
                last_name: profile?.last_name,
                phone: profile?.phone,
                email: profile?.email,
                department_name: deptNameMap.get(m.department_id) || 'No Group',
                finger1_registered: fingers.has(1),
                finger2_registered: fingers.has(2),
                _status: status // internal for filtering
            }
        })

        // Filter by Status (In Memory) - REMOVED (Redundant)

        // Restore pagination variables for response
        const safePage = Math.min(Math.max(1, page), totalPages)

        return NextResponse.json(
            {
                success: true,
                data: allViewModels,
                pagination: {
                    page: safePage,
                    limit,
                    total: totalItems,
                    totalPages
                },
                filters: {
                    departments: []
                }
            },
            { headers: { 'Cache-Control': 'private, no-cache', 'X-Strategy': 'OptimizedSlowPath', 'X-Debug-Status': statusParam || 'none' } }
        )

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json(
            { success: false, message: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
