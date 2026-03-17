import { NextResponse } from 'next/server'
import {
  getAnalyticsKPIs,
  getHourlyAttendanceHeatmap,
  getDepartmentPerformance,
  getAttendanceTrends30Days,
  getStatusDistribution,
  getRecentActivities,
} from '@/action/analytics'

import { analyticsLogger } from '@/lib/logger';
// Cache duration: 2 minutes for analytics data
const CACHE_DURATION = 120

export async function GET() {
  try {
    // Fetch all data in parallel for faster response
    const [kpis, hourly, dept, trends, status, activities] = await Promise.all([
      getAnalyticsKPIs(),
      getHourlyAttendanceHeatmap(),
      getDepartmentPerformance(),
      getAttendanceTrends30Days(),
      getStatusDistribution(),
      getRecentActivities(10),
    ])

    const data = {
      kpis: kpis.data,
      hourlyData: hourly.data || [],
      departmentData: dept.data || [],
      trendsData: trends.data || [],
      statusData: status.data || { today: [], month: [] },
      activities: activities.data || [],
    }

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': `public, max-age=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
        },
      }
    )
  } catch (error) {
    analyticsLogger.error('Analytics API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch analytics' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache',
        },
      }
    )
  }
}
