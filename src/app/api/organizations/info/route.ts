import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/organizations/info
 * Returns basic info about the requested organization (name, timezone, etc.)
 * authenticated via RLS.
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let organizationId = request.nextUrl.searchParams.get('organizationId')

        if (!organizationId) {
            const orgIdCookie = request.cookies.get('org_id')?.value
            if (orgIdCookie) organizationId = orgIdCookie
        }

        if (!organizationId) {
            return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
        }

        const { data: member } = await supabase
            .from('organization_members')
            .select(
                `
        organization_id,
        is_active,
        organizations(
          name,
          time_format,
          timezone,
          is_active
        )
      `
            )
            .eq('user_id', user.id)
            .eq('organization_id', parseInt(organizationId))
            .maybeSingle()

        if (!member || !member.organizations) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const org = member.organizations as any

        return NextResponse.json(
            {
                data: {
                    id: member.organization_id,
                    name: org.name,
                    timeFormat: org.time_format || '24h',
                    timezone: org.timezone || 'UTC',
                    isActive: org.is_active,
                    memberIsActive: member.is_active,
                },
            },
            {
                headers: {
                    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            }
        )
    } catch (error) {
        console.error('Server error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
