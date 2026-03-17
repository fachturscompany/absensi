import { NextResponse } from 'next/server'
import { getAllAttendance } from '@/action/attendance'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') ?? '1')
    const limit = Number(searchParams.get('limit') ?? '10')
    const dateFrom = searchParams.get('dateFrom') ?? undefined
    const dateTo = searchParams.get('dateTo') ?? undefined
    const rawStatus = searchParams.get('status')
    const rawDepartment = searchParams.get('department')
    const rawSearch = searchParams.get('search')
    const noCache = searchParams.get('_t') || searchParams.get('noCache') === '1' 
    void noCache

    const status = rawStatus && rawStatus.trim().toLowerCase() !== 'all' ? rawStatus.trim() : undefined
    const department = rawDepartment && rawDepartment.trim().toLowerCase() !== 'all' ? rawDepartment.trim() : undefined
    const search = rawSearch && rawSearch.trim() !== '' ? rawSearch.trim() : undefined
    const organizationId = Number(searchParams.get('organizationId') ?? '0') || undefined

    
    const result = await getAllAttendance({
      page,
      limit,
      dateFrom,
      dateTo,
      search,
      status,
      department,
      organizationId,
      noCache: true,
    })

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Vary': '*',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    })
  } catch (err) {
    console.error('API /attendance-records error', err)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch attendance records' },
      { status: 500 }
    )
  }
}
