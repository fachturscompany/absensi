import { NextResponse } from 'next/server'
import { getAllWorkSchedules } from '@/action/schedule'

import { scheduleLogger } from '@/lib/logger';
export async function GET() {
  try {
    // getAllWorkSchedules now automatically filters by user's organization
    const response = await getAllWorkSchedules()
    
    if (!response.success) {
      return NextResponse.json(
        { success: false, message: response.message },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
            'Vary': 'Cookie'
          }
        }
      )
    }

    return NextResponse.json(
      { success: true, data: response.data },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, must-revalidate',
          'Vary': 'Cookie'
        }
      }
    )
  } catch (error) {
    scheduleLogger.error('API /work-schedules error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch work schedules' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Vary': 'Cookie'
        }
      }
    )
  }
}
