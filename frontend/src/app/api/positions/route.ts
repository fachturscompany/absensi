import { NextResponse, NextRequest } from 'next/server'
import { getAllPositions } from '@/action/position'

import { logger } from '@/lib/logger';
export async function GET(request: NextRequest) {
  try {
    // Get organizationId from query parameter if provided
    const organizationId = request.nextUrl.searchParams.get('organizationId');
    const orgId = organizationId ? parseInt(organizationId, 10) : undefined;
    
    const response = await getAllPositions(orgId)
    
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
    logger.error('API /positions error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch positions' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=15'
        }
      }
    )
  }
}
