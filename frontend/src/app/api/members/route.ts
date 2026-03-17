import { NextResponse } from 'next/server'
import { getAllOrganization_member } from '@/action/members'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { IOrganization_member } from '@/interface'
import { memberLogger } from '@/lib/logger'

// Constants
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 100
const ALLOWED_LIMITS = new Set([10, 50, 100])
const CACHE_TTL = 60 // seconds

export async function GET(req: Request) {
  const startTime = Date.now()

  try {
    // Read query params
    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const limitParam = searchParams.get('limit')
    const pageParam = searchParams.get('page')
    const search = searchParams.get('search') || ''
    const orgParam = searchParams.get('organizationId')
    const activeParam = searchParams.get('active') // 'true' | 'false' | 'all'
    const departmentParam = searchParams.get('departmentId')
    const countMode = (searchParams.get('countMode') as 'exact' | 'planned' | 'none') || null

    // Parse and validate limit
    let limit = DEFAULT_LIMIT
    if (limitParam) {
      const parsed = parseInt(limitParam, 10)
      if (!isNaN(parsed)) {
        const clamped = Math.min(Math.max(1, parsed), MAX_LIMIT)
        limit = ALLOWED_LIMITS.has(clamped) ? clamped : DEFAULT_LIMIT
      }
    }

    // Legacy behavior: no limit = return all
    if (!limitParam && !pageParam) {
      const response = await getAllOrganization_member(
        orgParam ? Number(orgParam) : undefined
      )

      if (!response.success) {
        return NextResponse.json(
          { success: false, message: response.message },
          {
            status: 400,
            headers: {
              'Cache-Control': 'private, no-cache, no-store, must-revalidate',
              'Vary': 'Cookie',
              'X-Response-Time': `${Date.now() - startTime}ms`
            }
          }
        )
      }

      return NextResponse.json(
        { success: true, data: response.data },
        {
          headers: {
            'Cache-Control': 'private, max-age=60, must-revalidate',
            'Vary': 'Cookie',
            'X-Response-Time': `${Date.now() - startTime}ms`
          }
        }
      )
    }

    // Initialize Supabase clients
    const supabase = await createClient()
    const admin = createAdminClient()

    // Resolve organization id
    let organizationId: number | null = orgParam ? Number(orgParam) : null

    if (!organizationId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: member } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (member?.organization_id) {
          organizationId = Number(member.organization_id)
        }
      }
    }

    // Return empty if no organization
    if (!organizationId) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          pagination: {
            cursor: null,
            limit,
            hasMore: false,
            total: 0
          }
        },
        {
          headers: {
            'Cache-Control': 'private, max-age=30',
            'Vary': 'Cookie',
            'X-Response-Time': `${Date.now() - startTime}ms`
          }
        }
      )
    }

    // OPTIMASI: Count bisa dinonaktifkan / dipermudah untuk percepatan
    let totalCount = 0
    if (pageParam && countMode !== 'none') {
      let countQuery = admin
        .from('organization_members')
        .select('id', { count: (countMode === 'planned' ? 'planned' : 'exact'), head: true })
        .eq('organization_id', organizationId)

      // Apply filters to count query
      if (activeParam !== 'all') {
        const active = activeParam === 'false' ? false : true
        countQuery = countQuery.eq('is_active', active)
      }
      if (departmentParam && departmentParam !== 'all') {
        countQuery = countQuery.eq('department_id', departmentParam)
      }
      // Note: Search di count query dihapus karena akan dilakukan di client-side
      // untuk mencakup semua field termasuk joined fields (nama, department)

      const { count } = await countQuery
      totalCount = count || 0
    }

    // Data query dengan joins
    let dataQuery = admin
      .from('organization_members')
      .select(`
        *,
        user:user_id (
          id,
          email,
          first_name,
          last_name,
          display_name,
          phone,
          mobile,
          date_of_birth,
          jenis_kelamin,
          nik,
          nisn,
          tempat_lahir,
          agama,
          jalan,
          rt,
          rw,
          dusun,
          kelurahan,
          kecamatan,
          profile_photo_url,
          search_name,
          is_active
        ),
        departments:department_id (
          id,
          name,
          code,
          organization_id
        ),
        positions:position_id (
          id,
          title,
          code
        ),
        role:role_id (
          id,
          code,
          name,
          description
        )
      `)
      .eq('organization_id', organizationId)

    // Apply filters
    if (activeParam !== 'all') {
      const active = activeParam === 'false' ? false : true
      dataQuery = dataQuery.eq('is_active', active)
    }
    if (departmentParam && departmentParam !== 'all') {
      dataQuery = dataQuery.eq('department_id', departmentParam)
    }

    // Note: Search dihapus dari API query karena akan dilakukan di client-side
    // untuk mencakup semua field termasuk joined fields (nama dari user_profiles, department name)
    // Ini memastikan search bekerja untuk semua field yang ditampilkan di UI

    // Branch: page-based (offset) vs cursor-based (legacy)
    let itemsRaw: IOrganization_member[] | null = null
    let execError: any = null

    if (pageParam) {
      // PAGE-BASED: hitung offset (range)
      const pageNum = Math.max(1, parseInt(pageParam, 10) || 1)

      const from = (pageNum - 1) * limit
      const to = from + limit - 1

      const exec = await dataQuery
        .order('id', { ascending: true })
        .range(from, to)
      itemsRaw = (exec.data || []) as IOrganization_member[]
      execError = exec.error
    } else {
      // CURSOR-BASED (legacy)
      if (cursor) {
        dataQuery = dataQuery.gt('id', cursor)
      }
      const pageLimit = limit + 1
      const exec = await dataQuery
        .order('id', { ascending: true })
        .limit(pageLimit)
      itemsRaw = (exec.data || []) as IOrganization_member[]
      execError = exec.error
    }

    if (execError) {
      memberLogger.error('Pagination query error:', execError)
      return NextResponse.json(
        { success: false, message: execError.message },
        { status: 400 }
      )
    }

    const raw = (itemsRaw || []) as IOrganization_member[]

    // Log raw query result for debugging
    if (raw && raw.length > 0) {
      memberLogger.debug(`[API /members] Query returned ${raw.length} members`);
      const firstMember = raw[0] as any;
      memberLogger.debug(`[API /members] First member keys:`, Object.keys(firstMember));
      memberLogger.debug(`[API /members] First member department_id:`, firstMember.department_id, `(type: ${typeof firstMember.department_id})`);
    }

    // Fix departments if join failed (similar to getAllOrganization_member)
    if (raw && raw.length > 0) {

      const membersWithDeptId = raw.filter((m: any) => m.department_id != null && m.department_id !== undefined);
      memberLogger.debug(`[API /members] Raw data: ${raw.length} members, ${membersWithDeptId.length} with department_id`);
      if (membersWithDeptId.length > 0 && membersWithDeptId[0]) {
        const sample = membersWithDeptId[0];
        memberLogger.debug(`[API /members] Sample member with department_id:`, {
          id: sample.id,
          department_id: sample.department_id,
          department_id_type: typeof sample.department_id,
          departments: sample.departments,
          departments_type: typeof sample.departments,
          is_departments_array: Array.isArray(sample.departments)
        });
      }

      // Normalize departments structure (Supabase might return array or object)
      raw.forEach((member: any) => {
        if (member.departments) {
          // If departments is an array, take the first element
          if (Array.isArray(member.departments) && member.departments.length > 0) {
            member.departments = member.departments[0];
          }
          // If departments is null or empty array, set to null
          else if (Array.isArray(member.departments) && member.departments.length === 0) {
            member.departments = null;
          }
        }
      });

      // Collect all department_ids that need to be fetched
      const deptIds = new Set<number>();
      raw.forEach((member: any) => {
        const hasValidDept = member.departments &&
          (typeof member.departments === 'object' && !Array.isArray(member.departments) && member.departments.name) ||
          (Array.isArray(member.departments) && member.departments.length > 0 && member.departments[0]?.name);

        if (member.department_id && !hasValidDept) {
          const deptId = typeof member.department_id === 'string' ? parseInt(member.department_id, 10) : member.department_id;
          if (!isNaN(deptId)) {
            deptIds.add(deptId);
          }
        }
      });

      memberLogger.debug(`[API /members] Found ${deptIds.size} department_ids to fetch:`, Array.from(deptIds));

      // Fetch departments if needed
      if (deptIds.size > 0) {
        const deptIdsArray = Array.from(deptIds);
        memberLogger.debug(`[API /members] Fetching ${deptIdsArray.length} departments...`);
        const { data: deptList, error: deptError } = await admin
          .from("departments")
          .select("id, name, code, organization_id")
          .in("id", deptIdsArray);

        if (deptError) {
          memberLogger.error(`[API /members] Error fetching departments:`, deptError);
        } else if (deptList) {
          memberLogger.debug(`[API /members] Fetched ${deptList.length} departments:`, deptList.map((d: any) => `${d.id}:${d.name}`));
          const departmentsMap = new Map();
          deptList.forEach((dept: any) => {
            const deptId = typeof dept.id === 'string' ? parseInt(dept.id, 10) : dept.id;
            if (!isNaN(deptId)) {
              departmentsMap.set(deptId, dept);
            }
          });
          memberLogger.debug(`[API /members] Departments map keys:`, Array.from(departmentsMap.keys()));

          // Set departments for all members that need it
          let fixedCount = 0;
          raw.forEach((member: any) => {
            const hasValidDept = member.departments &&
              (typeof member.departments === 'object' && !Array.isArray(member.departments) && member.departments.name) ||
              (Array.isArray(member.departments) && member.departments.length > 0 && member.departments[0]?.name);

            if (member.department_id && !hasValidDept) {
              const deptId = typeof member.department_id === 'string' ? parseInt(member.department_id, 10) : member.department_id;
              if (!isNaN(deptId)) {
                const dept = departmentsMap.get(deptId);
                if (dept) {
                  member.departments = dept;
                  fixedCount++;
                  memberLogger.debug(`[API /members] Set departments for member ${member.id} (dept_id: ${deptId}):`, dept.name);
                } else {
                  memberLogger.warn(`[API /members] Department ID ${deptId} not found in map for member ${member.id}`);
                }
              }
            }
          });
          memberLogger.info(`[API /members] Fixed departments for ${fixedCount} members`);
        } else {
          memberLogger.warn(`[API /members] No departments returned from query`);
        }
      } else {
        memberLogger.debug(`[API /members] No department_ids to fetch`);
      }
    }

    let items: IOrganization_member[] = raw
    let hasMore = false
    let nextCursor: string | null = null

    if (pageParam) {
      const pageNum = Math.max(1, parseInt(pageParam, 10) || 1)
      const endIdx = pageNum * limit
      hasMore = totalCount > 0 ? endIdx < totalCount : (raw.length >= limit)
    } else {
      hasMore = raw.length > limit
      items = hasMore ? raw.slice(0, limit) : raw
      const lastItem = items.length > 0 ? items[items.length - 1] : null
      nextCursor = lastItem?.id ? String(lastItem.id) : null
    }

    const baseParams = new URLSearchParams({
      limit: limit.toString(),
      organizationId: organizationId.toString(),
      ...(search && { search }),
      ...(activeParam && activeParam !== 'all' && { active: activeParam }),
      ...(departmentParam && departmentParam !== 'all' && { departmentId: departmentParam }),
      ...(countMode && { countMode })
    })

    const links: { self: string; next: string | null; first: string; prev?: string | null; last?: string | null } = {
      self: `/api/members?${baseParams.toString()}`,
      next: null,
      first: `/api/members?${baseParams.toString()}`
    }

    // Normalize/augment items for consistent client mapping using user_profiles schema
    {
      type UserProfile = {
        display_name?: string
        first_name?: string
        last_name?: string
        email?: string
        search_name?: string
      }
      type DepartmentObj = { name?: string }
      type BiodataObj = { nama?: string; nickname?: string; nik?: string }
      type MemberRow = IOrganization_member & {
        user?: UserProfile
        biodata?: BiodataObj
        departments?: DepartmentObj | DepartmentObj[]
        groupName?: string
        biodata_nik?: string
      }

      const normalizeName = (m: MemberRow) => {
        const displayName = (m.user?.display_name ?? '').trim()
        const firstName = (m.user?.first_name ?? '').trim()
        const lastName = (m.user?.last_name ?? '').trim()
        const email = (m.user?.email ?? '').trim()
        const searchName = (m.user?.search_name ?? '').trim()
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
        const biodataNama = (m.biodata?.nama ?? '').trim()
        const biodataNickname = (m.biodata?.nickname ?? '').trim()
        return displayName || fullName || email || searchName || biodataNama || biodataNickname || null
      }
      const firstDept = (d?: DepartmentObj | DepartmentObj[] | null) =>
        Array.isArray(d) ? (d[0] ?? undefined) : (d ?? undefined)

      items = (items as unknown as MemberRow[]).map((m) => {
        const computed_name = normalizeName(m)
        const deptObj = firstDept(m.departments)
        const groupName = deptObj?.name ?? m.groupName ?? null
        const biodata_nik = m.biodata_nik ?? m.biodata?.nik ?? null
        return { ...(m as object), computed_name, groupName, biodata_nik } as unknown as IOrganization_member
      })
    }

    if (pageParam) {
      const pageNum = Math.max(1, parseInt(pageParam, 10) || 1)
      const totalPages = Math.max(1, Math.ceil((totalCount || 0) / limit))
      links.self = `/api/members?${baseParams.toString()}&page=${pageNum}`
      links.first = `/api/members?${baseParams.toString()}&page=1`
      links.prev = pageNum > 1 ? `/api/members?${baseParams.toString()}&page=${pageNum - 1}` : null
      links.next = pageNum < totalPages ? `/api/members?${baseParams.toString()}&page=${pageNum + 1}` : null
      links.last = `/api/members?${baseParams.toString()}&page=${totalPages}`
    } else {
      links.self = `/api/members?${baseParams.toString()}${cursor ? `&cursor=${cursor}` : ''}`
      links.next = nextCursor ? `/api/members?${baseParams.toString()}&cursor=${nextCursor}` : null
      links.first = `/api/members?${baseParams.toString()}`
    }

    // Log final data before return
    if (items && items.length > 0) {
      const membersWithDept = items.filter((m: any) => m.departments &&
        ((typeof m.departments === 'object' && !Array.isArray(m.departments) && m.departments.name) ||
          (Array.isArray(m.departments) && m.departments.length > 0 && m.departments[0]?.name)));
      const membersWithDeptId = items.filter((m: any) => m.department_id != null && m.department_id !== undefined);
      memberLogger.debug(`[API /members] Final data: ${items.length} members, ${membersWithDeptId.length} with department_id, ${membersWithDept.length} with departments`);
      if (membersWithDept.length > 0 && membersWithDept[0]) {
        const sample = membersWithDept[0];
        memberLogger.debug(`[API /members] Sample member with departments:`, {
          id: sample.id,
          department_id: sample.department_id,
          departments: sample.departments
        });
      }
    }

    // Log performance
    const responseTime = Date.now() - startTime
    memberLogger.info('Members pagination', {
      orgId: organizationId,
      limit,
      cursor: cursor || 'none',
      itemCount: items.length,
      totalCount,
      responseTime: `${responseTime}ms`,
      hasMore
    })

    return NextResponse.json(
      {
        success: true,
        data: items,
        pagination: {
          cursor: nextCursor,
          limit,
          hasMore,
          total: totalCount || 0
        },
        links,
        meta: {
          responseTime: `${responseTime}ms`
        }
      },
      {
        headers: {
          'Cache-Control': `private, max-age=${CACHE_TTL}, stale-while-revalidate=300`,
          'Vary': 'Cookie, Authorization',
          'X-Response-Time': `${responseTime}ms`
        }
      }
    )

  } catch (error) {
    const responseTime = Date.now() - startTime
    memberLogger.error('API /members error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch members',
        error: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Vary': 'Cookie',
          'X-Response-Time': `${responseTime}ms`
        }
      }
    )
  }
}
