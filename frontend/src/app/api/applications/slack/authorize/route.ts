import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { generateOAuthState, buildAuthorizationUrl } from "@/lib/applications/oauth-helpers"

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()

        // 1. Authenticate user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // 2. Get active organization context from cookie
        // This ensures we connect the integration to the CORRECT organization
        // when user has multiple organizations
        const orgId = req.cookies.get('org_id')?.value

        if (!orgId) {
            return NextResponse.json(
                { error: "No active organization. Please select an organization first." },
                { status: 400 }
            )
        }

        // 3. Verify user is a member of the requested organization
        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id, role_id')
            .eq('user_id', user.id)
            .eq('organization_id', orgId)
            .limit(1)
            .maybeSingle()

        if (!member) {
            return NextResponse.json(
                { error: "Not a member of this organization" },
                { status: 403 }
            )
        }

        // Log organization context for debugging multi-tenancy
        console.log('[slack-oauth] Organization context:', {
            userId: user.id,
            organizationId: member.organization_id,
            roleId: member.role_id
        })

        // 4. Check if integration already exists
        const { data: existing } = await supabase
            .from('applications')
            .select('id')
            .eq('organization_id', member.organization_id)
            .eq('provider', 'slack')
            .maybeSingle()

        if (!existing) {
            // Create integration entry
            const { data: newIntegration, error: createError } = await supabase
                .from('applications')
                .insert({
                    organization_id: member.organization_id,
                    provider: 'slack',
                    name: 'Slack',
                    status: 'PENDING',
                    connected: false
                })
                .select('id')
                .maybeSingle()

            if (createError || !newIntegration) {
                console.error('[slack] Failed to create integration:', createError)
                return NextResponse.json(
                    { error: "Failed to initialize integration" },
                    { status: 500 }
                )
            }
        }

        // Generate OAuth state
        const state = generateOAuthState('slack', member.organization_id)

        // Dynamic base URL detection for flexible deployment
        // Priority: NEXT_PUBLIC_APP_URL (production) → VERCEL_URL (preview) → fallback
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://absensi-ubig.vercel.app')

        // Build authorization URL
        const authUrl = buildAuthorizationUrl(
            {
                clientId: process.env.SLACK_CLIENT_ID!,
                clientSecret: process.env.SLACK_CLIENT_SECRET!,
                redirectUri: `${baseUrl}/api/applications/slack/callback`,
                authorizationUrl: 'https://slack.com/oauth/v2/authorize',
                tokenUrl: 'https://slack.com/api/oauth.v2.access',
                scopes: ['chat:write', 'incoming-webhook', 'channels:read', 'users:read']
            },
            state
        )

        // Return URL for client to redirect
        return NextResponse.json({ redirectUrl: authUrl })

    } catch (error) {
        console.error('[slack] Authorization error:', error)
        return NextResponse.json(
            { error: "Failed to initiate authorization" },
            { status: 500 }
        )
    }
}
