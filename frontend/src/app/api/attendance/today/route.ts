import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// API Route to hide database structure from client
// Instead of exposing Supabase queries, we proxy through server

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user's organization (server-side, hidden from client)
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, is_active')
      .eq('user_id', user.id)
      .single()

    if (!member || !member.is_active) {
      return NextResponse.json({ error: 'Not a member of any organization' }, { status: 403 })
    }

    // 3. Get today's attendance (RLS will filter automatically)
    const today = new Date().toISOString().split('T')[0]

    const { data: records, error } = await supabase
      .from('attendance_records')
      .select(
        `
        id,
        status,
        actual_check_in,
        actual_check_out,
        work_duration_minutes,
        late_minutes,
        organization_members!inner(
          id,
          user_profiles!inner(
            first_name,
            last_name,
            profile_photo_url
          ),
          departments(name)
        )
      `
      )
      .eq('attendance_date', today)
      .order('actual_check_in', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    // 4. Return clean, formatted data (no database structure exposed)
    const formattedRecords = records.map((record) => {
      const member = record.organization_members as any
      const profile = member?.user_profiles as any
      const department = member?.departments as any

      return {
        id: record.id,
        status: record.status,
        checkIn: record.actual_check_in,
        checkOut: record.actual_check_out,
        duration: record.work_duration_minutes,
        lateMinutes: record.late_minutes,
        employee: {
          name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
          photo: profile?.profile_photo_url,
          department: department?.name,
        },
      }
    })

    // 5. Cache response for 30 seconds
    return NextResponse.json(
      { data: formattedRecords },
      {
        headers: {
          'Cache-Control': 'private, max-age=30, s-maxage=30',
        },
      }
    )
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
