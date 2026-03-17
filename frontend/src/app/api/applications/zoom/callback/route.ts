
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import {
    verifyOAuthState,
    exchangeCodeForToken,

    encrypt
} from "@/lib/applications/oauth-helpers"
import { ZOOM_CONFIG } from "@/lib/applications/zoom-oauth"

/**
 * GET /api/integrations/zoom/callback
 * * Handles the OAuth 2.0 callback from Zoom
 * * Exchanges authorization code for access tokens
 * * Stores encrypted tokens in the database
 */
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://absensi-ubig.vercel.app')

    // Handle Zoom-side errors (e.g., user denied access)
    if (error) {
        console.error('[zoom-callback] Zoom returned error:', error)
        return NextResponse.redirect(`${baseUrl}/organization/applications?error=zoom_auth_denied`)
    }

    if (!code || !state) {
        return NextResponse.redirect(`${baseUrl}/organization/applications?error=zoom_missing_params`)
    }

    try {
        // 1. Verify State (CSRF Protection)
        const stateData = verifyOAuthState(state)

        if (stateData.provider !== 'zoom') {
            throw new Error('Invalid provider in state')
        }

        // 2. Exchange Code for Tokens
        // Ensure redirect URI matches exactly what was sent in authorize
        const config = {
            ...ZOOM_CONFIG,
            redirectUri: `${baseUrl}/api/applications/zoom/callback`
        }

        // Zoom requires Basic Auth header for token endpoint, unlike generic OAuth
        // Override exchange logic if needed, but generic helper might default to POST body.
        // Let's implement custom exchange here if generic doesn't support Basic Auth.
        // Checking oauth-helpers... it uses POST body. Zoom supports POST body client_id/secret.
        // https://developers.zoom.us/docs/internal-apps/oauth/
        // "You can verify your callback by ... passing your client_id and client_secret as query parameters"
        // actually standard OAuth 2.0 is supported.

        const tokens = await exchangeCodeForToken(config, code)

        // 3. Store Tokens
        // Need to create integration record. 
        // storeOAuthTokens helper updates existing record by ID.
        // Typically we need to find-or-create based on organization_id first.

        const supabase = await createClient()
        const orgId = stateData.organizationId

        // Check if integration already exists
        const { data: existing } = await supabase
            .from('applications')
            .select('id')
            .eq('organization_id', orgId)
            .eq('provider', 'zoom')
            .maybeSingle()

        const integrationData = {
            organization_id: parseInt(orgId),
            provider: 'zoom',
            name: 'Zoom Team',
            connected: true,
            status: 'ACTIVE',
            access_token: encrypt(tokens.access_token),
            refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
            token_expires_at: tokens.expires_in
                ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
                : null,
            permissions: (tokens.scope || ZOOM_CONFIG.scopes.join(' ')).split(' '),
            updated_at: new Date().toISOString()
        }

        if (existing) {
            await supabase
                .from('applications')
                .update(integrationData)
                .eq('id', existing.id)
        } else {
            await supabase
                .from('applications')
                .insert(integrationData)
        }

        // 4. Redirect Success
        return NextResponse.redirect(`${baseUrl}/organization/applications?success=zoom_connected`)

    } catch (error) {
        console.error('[zoom-callback] Integration failed:', error)
        return NextResponse.redirect(`${baseUrl}/organization/applications?error=zoom_connection_failed`)
    }
}
