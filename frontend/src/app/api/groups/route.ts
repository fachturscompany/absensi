import { NextResponse, NextRequest } from 'next/server'
import { getAllGroups } from '@/action/group'

import { logger } from '@/lib/logger';
export async function GET(request: NextRequest) {
  try {
    // Get organizationId from query parameter if provided
    const organizationId = request.nextUrl.searchParams.get('organizationId');
    const orgId = organizationId ? parseInt(organizationId, 10) : undefined;
    
    // Get includeInactive parameter (for import pages, we want all groups)
    const includeInactiveParam = request.nextUrl.searchParams.get('includeInactive');
    const includeInactive = includeInactiveParam === 'true' || includeInactiveParam === '1';
    
    const response = await getAllGroups(orgId, includeInactive)
    
    if (!response.success) {
      return NextResponse.json(
        { success: false, message: response.message },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=30'
          }
        }
      )
    }

    return NextResponse.json(
      { success: true, data: response.data },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
        }
      }
    )
  } catch (error) {
    logger.error('API /groups error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch groups' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=15'
        }
      }
    )
  }
}
