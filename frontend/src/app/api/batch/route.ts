import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Batch API - Combine multiple requests into one
 * Reduces network overhead from multiple separate calls
 * 
 * Usage:
 * POST /api/batch
 * Body: { requests: ['organization', 'profile', 'attendance'] }
 */

interface BatchResponse {
  organization?: any
  profile?: any
  attendance?: any
  errors?: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse requested data types
    const body = await request.json()
    const { requests = [] } = body as { requests: string[] }

    const response: BatchResponse = {}
    const errors: Record<string, string> = {}

    // 3. Fetch all data in parallel
    const promises: Promise<any>[] = []

    if (requests.includes('organization')) {
      promises.push(
        Promise.resolve(
          supabase
            .from('organization_members')
            .select(
              `
              organization_id,
              is_active,
              organizations(name, time_format, timezone, is_active)
            `
            )
            .eq('user_id', user.id)
            .single()
        )
          .then((result) => {
            if (result.error) {
              errors.organization = result.error.message
              return null
            }
            const org = result.data?.organizations as any
            return {
              id: result.data?.organization_id,
              name: org?.name,
              timeFormat: org?.time_format || '24h',
              timezone: org?.timezone || 'UTC',
              isActive: org?.is_active,
              memberIsActive: result.data?.is_active,
            }
          })
          .catch((err: Error) => {
            errors.organization = err.message
            return null
          })
      )
    }

    if (requests.includes('profile')) {
      promises.push(
        Promise.resolve(
          supabase
            .from('user_profiles')
            .select('first_name, last_name, display_name, profile_photo_url, employee_code')
            .eq('id', user.id)
            .single()
        )
          .then((result) => {
            if (result.error) {
              errors.profile = result.error.message
              return null
            }
            return result.data
          })
          .catch((err: Error) => {
            errors.profile = err.message
            return null
          })
      )
    }

    if (requests.includes('attendance')) {
      promises.push(
        (async () => {
          // Get org ID first
          const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single()

          if (!member) {
            errors.attendance = 'No organization found'
            return null
          }

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
                user_profiles!inner(first_name, last_name, profile_photo_url),
                departments(name)
              )
            `
            )
            .eq('attendance_date', today)
            .order('actual_check_in', { ascending: false })
            .limit(50)

          if (error) {
            errors.attendance = error.message
            return null
          }

          return records?.map((record) => {
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
        })()
      )
    }

    // 4. Wait for all promises
    const results = await Promise.all(promises)

    // 5. Map results back to response
    let resultIndex = 0
    if (requests.includes('organization')) {
      response.organization = results[resultIndex++]
    }
    if (requests.includes('profile')) {
      response.profile = results[resultIndex++]
    }
    if (requests.includes('attendance')) {
      response.attendance = results[resultIndex++]
    }

    if (Object.keys(errors).length > 0) {
      response.errors = errors
    }

    // 6. Cache response
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=60, s-maxage=60',
      },
    })
  } catch (error) {
    console.error('Batch API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
