import { NextResponse } from 'next/server'
import { getAttendanceByGroup } from '@/action/attendance_group'

import { attendanceLogger } from '@/lib/logger';
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const org = url.searchParams.get('organizationId') || undefined
    const res = await getAttendanceByGroup(org)
    return NextResponse.json({ success: true, data: res.data }, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
      }
    })
  } catch (err) {
    attendanceLogger.error('API /attendance/group error', err)
    return NextResponse.json({ success: false, data: [] }, { 
      status: 500,
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30'
      }
    })
  }
}
