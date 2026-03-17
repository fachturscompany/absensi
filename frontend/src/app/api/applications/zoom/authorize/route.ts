
import { NextResponse } from "next/server"

import { createClient } from "@/utils/supabase/server"
import { generateOAuthState, buildAuthorizationUrl } from "@/lib/applications/oauth-helpers"
import { ZOOM_CONFIG } from "@/lib/applications/zoom-oauth"

/**
 * GET /api/integrations/zoom/authorize
 * * Initiates the Zoom OAuth 2.0 flow (User OAuth)
 * * Redirects the user to Zoom's authorization page
 */

export async function POST() {
    try {
        const supabase = await createClient()

        // 1. Auth Check - Ensure user is logged in
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 2. Org Context - Get current organization ID
        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()

        if (!member) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 })
        }

        const orgId = member.organization_id.toString()

        // 3. Generate State param for CSRF protection
        const state = generateOAuthState('zoom', orgId)

        // 4. Build Authorization URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://absensi-ubig.vercel.app')

        // Override redirectUri dynamically based on current environment
        // Zoom requires an EXACT match with the whitelist
        const config = {
            ...ZOOM_CONFIG,
            redirectUri: `${baseUrl}/api/applications/zoom/callback`
        }

        const url = buildAuthorizationUrl(config, state)

        // 5. Return the URL to the client for redirection
        // The client-side loading overlay will handle the visual transition
        return NextResponse.json({
            redirectUrl: url
        })

    } catch (error) {
        console.error('[zoom-auth] Authorization init failed:', error)
        return NextResponse.json({ error: "Failed to initiate authorization" }, { status: 500 })
    }
}
