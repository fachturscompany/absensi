import { NextResponse } from 'next/server'
import { getAllMemberSchedule } from '@/action/member-schedule'

import { memberLogger } from '@/lib/logger';
export async function GET() {
  try {
    // getAllMemberSchedule now automatically filters by user's organization
    const response = await getAllMemberSchedule()

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
    memberLogger.error('API /member-schedules error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch member schedules' },
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
