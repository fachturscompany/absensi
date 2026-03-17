import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getTrelloAccessToken } from "@/lib/applications/trello-oauth"
import { cookies } from "next/headers"
import { encrypt } from "@/lib/applications/oauth-helpers" // Re-use encryption

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const oauth_token = searchParams.get('oauth_token')
    const oauth_verifier = searchParams.get('oauth_verifier')

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://absensi-ubig.vercel.app')

    if (!oauth_token || !oauth_verifier) {
        return NextResponse.redirect(`${baseUrl}/organization/applications?error=trello_missing_params`)
    }

    try {
        // 1. Retrieve secrets from cookies
        const cookieStore = await cookies()
        const tokenSecret = cookieStore.get(`trello_secret_${oauth_token}`)?.value
        const orgId = cookieStore.get(`trello_org_${oauth_token}`)?.value

        if (!tokenSecret || !orgId) {
            return NextResponse.redirect(`${baseUrl}/organization/applications?error=trello_session_expired`)
        }

        // 2. Exchange for Access Token (OAuth 1.0a Step 3)
        const accessTokenData = await getTrelloAccessToken(oauth_token, oauth_verifier, tokenSecret)

        if (!accessTokenData.oauth_token || !accessTokenData.oauth_token_secret) {
            throw new Error("Failed to exchange access token")
        }

        // 3. Store in Database
        const supabase = await createClient()

        // 3a. Check for existing integration
        const { data: existing } = await supabase
            .from('applications')
            .select('id')
            .eq('organization_id', orgId)
            .eq('provider', 'trello')
            .maybeSingle()

        const integrationData = {
            organization_id: parseInt(orgId),
            provider: 'trello',
            name: 'Trello Integration',
            connected: true,
            status: 'ACTIVE',
            access_token: encrypt(accessTokenData.oauth_token),
            // Trello uses the "token secret" as a signing key for future requests, 
            // so we might need to store it. Mapping it to 'webhook_secret' or 'refresh_token' field 
            // or a config JSON might be better. 
            // Let's use 'refresh_token' field to store the secret for now (encrypted), 
            // since Trello tokens don't expire/refresh in the same way.
            refresh_token: encrypt(accessTokenData.oauth_token_secret),
            token_expires_at: null, // Trello tokens don't expire by default with 'expiration=never'
            permissions: ['read', 'write'],
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

        // 4. Cleanup cookies
        cookieStore.delete(`trello_secret_${oauth_token}`)
        cookieStore.delete(`trello_org_${oauth_token}`)

        return NextResponse.redirect(`${baseUrl}/organization/applications?success=trello_connected`)

    } catch (error) {
        console.error('[trello] Callback error:', error)
        return NextResponse.redirect(`${baseUrl}/organization/applications?error=trello_callback_failed`)
    }
}
