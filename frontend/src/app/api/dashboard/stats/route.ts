import { NextResponse } from 'next/server'
import { getDashboardStats } from '@/action/dashboard'

import { dashboardLogger } from '@/lib/logger';
export async function GET() {
  try {
    const data = await getDashboardStats()
    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          // No HTTP caching - let React Query handle caching
          'Cache-Control': 'private, no-cache, must-revalidate',
          'Vary': 'Cookie'
        }
      }
    )
  } catch (err) {
    dashboardLogger.error('API /dashboard/stats error', err)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard stats' }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate'
        }
      }
    )
  }
}
