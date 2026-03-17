import { NextResponse } from 'next/server'
import { getMonthlyAttendanceStats } from '@/action/dashboard'

import { dashboardLogger } from '@/lib/logger';
export async function GET() {
  try {
    const result = await getMonthlyAttendanceStats()
    if (result && result.success) {
      return NextResponse.json({ success: true, data: result.data }, {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
        }
      })
    }

    // Log and forward helpful non-sensitive error information to the client
    dashboardLogger.error('getMonthlyAttendanceStats returned no data', result)
    const safeError: any = {}
    if (result && typeof result === 'object') {
      if ((result as any).error) {
        safeError.message = (result as any).error.message || String((result as any).error)
        safeError.code = (result as any).error.code || null
      } else if ((result as any).message) {
        safeError.message = (result as any).message
      } else {
        safeError.message = 'No data available'
      }
    } else {
      safeError.message = 'No data available'
    }
    return NextResponse.json({ success: false, error: safeError, data: result?.data || null }, { status: 502 })
  } catch (err) {
    dashboardLogger.error('API /dashboard/monthly error', err)
    return NextResponse.json({ success: false, message: 'Failed to fetch monthly attendance stats' }, { status: 500 })
  }
}
