import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Fetch all organizations where user is a member
        const { data: members, error: membersError } = await supabase
            .from('organization_members')
            .select(`
                organization_id,
                is_active,
                organizations (
                    id,
                    name,
                    is_active
                )
            `)
            .eq('user_id', user.id)
            .eq('is_active', true)

        if (membersError) {
            console.error('Error fetching organizations:', membersError)
            return NextResponse.json(
                { success: false, error: 'Failed to fetch organizations' },
                { status: 500 }
            )
        }

        // Transform data to simple format
        const organizations = members
            ?.filter(m => m.organizations)
            .map(m => {
                const org = m.organizations as any
                return {
                    id: String(org.id),
                    name: org.name,
                    plan: 'paid', // You can add this field to your database if needed
                    owner: user.id
                }
            }) || []

        return NextResponse.json(
            {
                success: true,
                data: organizations
            },
            {
                headers: {
                    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            }
        )
    } catch (error) {
        console.error('Server error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
