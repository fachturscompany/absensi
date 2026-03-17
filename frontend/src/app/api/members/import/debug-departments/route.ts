import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get user's organization
    const { data: member } = await adminClient
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!member) {
      return NextResponse.json(
        { success: false, message: 'User not member of any organization' },
        { status: 403 }
      )
    }

    // Get ALL departments (no filters)
    const { data: allDepartments, error: allError } = await adminClient
      .from('departments')
      .select('id, name, code, is_active, organization_id')
      .order('name', { ascending: true })

    // Get departments for user's organization
    const { data: orgDepartments, error: orgError } = await adminClient
      .from('departments')
      .select('id, name, code, is_active, organization_id')
      .eq('organization_id', member.organization_id)
      .order('name', { ascending: true })

    return NextResponse.json({
      success: true,
      user_id: user.id,
      organization_id: member.organization_id,
      all_departments: {
        count: allDepartments?.length || 0,
        data: allDepartments || [],
        error: allError?.message
      },
      org_departments: {
        count: orgDepartments?.length || 0,
        data: orgDepartments || [],
        error: orgError?.message
      },
      search_x_rpl: {
        by_name: allDepartments?.filter((d: any) => 
          d.name.toLowerCase().includes('rpl') || d.name.toLowerCase().includes('x rpl')
        ) || [],
        by_code: allDepartments?.filter((d: any) => 
          d.code.toLowerCase().includes('rpl') || d.code.toLowerCase().includes('x_rpl')
        ) || []
      }
    })
  } catch (error) {
    console.error('Debug departments error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}



