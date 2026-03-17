/**
 * GET /api/integrations/slack/callback
 * 
 * Handle Slack OAuth callback and token exchange.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import {
    verifyOAuthState,
    exchangeCodeForToken,
    storeOAuthTokens,
    encrypt
} from "@/lib/applications/oauth-helpers"

export async function GET(req: NextRequest) {
    try {
        // Dynamic base URL detection (for redirects and token exchange)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://absensi-ubig.vercel.app')

        const searchParams = req.nextUrl.searchParams
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        // Check for OAuth errors
        if (error) {
            console.error('[slack] OAuth error:', error)
            return NextResponse.redirect(
                `${baseUrl}/organization/applications?error=${error}`
            )
        }

        if (!code || !state) {
            return NextResponse.redirect(
                `${baseUrl}/organization/applications?error=missing_params`
            )
        }

        // Verify state to prevent CSRF
        let stateData
        try {
            stateData = verifyOAuthState(state)
        } catch (err) {
            console.error('[slack] Invalid state:', err)
            return NextResponse.redirect(
                `${baseUrl}/organization/applications?error=invalid_state`
            )
        }

        // Exchange code for tokens
        const tokens = await exchangeCodeForToken(
            {
                clientId: process.env.SLACK_CLIENT_ID!,
                clientSecret: process.env.SLACK_CLIENT_SECRET!,
                redirectUri: `${baseUrl}/api/applications/slack/callback`,
                authorizationUrl: 'https://slack.com/oauth/v2/authorize',
                tokenUrl: 'https://slack.com/api/oauth.v2.access',
                scopes: []
            },
            code
        )

        // Get integration
        const supabase = await createClient()
        const { data: integration } = await supabase
            .from('applications')
            .select('id')
            .eq('organization_id', stateData.organizationId)
            .eq('provider', 'slack')
            .maybeSingle()

        let integrationId = integration?.id

        if (!integrationId) {
            // Create new application record if not exists
            const { data: newApp, error: createError } = await supabase
                .from('applications')
                .insert({
                    organization_id: stateData.organizationId,
                    provider: 'slack',
                    name: 'Slack Integration',
                    developer: 'Slack',
                    email: 'support@slack.com',
                    status: 'ACTIVE',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select('id')
                .single()

            if (createError) {
                console.error('[slack] Failed to create application:', createError)
                return NextResponse.redirect(
                    `${baseUrl}/organization/applications?error=creation_failed`
                )
            }
            integrationId = newApp.id
        }

        // Store tokens
        await storeOAuthTokens(integrationId, tokens)

        // Generate webhook secret for Slack
        const webhookSecret = crypto.randomUUID()

        await supabase
            .from('applications')
            .update({
                webhook_secret: encrypt(webhookSecret)
            })
            .eq('id', integrationId)

        // Redirect back to integrations page with success
        return NextResponse.redirect(
            `${baseUrl}/organization/applications?success=slack_connected`
        )

    } catch (error) {
        console.error('[slack] Callback error:', error)

        // Fallback base URL for error redirect
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://absensi-ubig.vercel.app')

        return NextResponse.redirect(
            `${baseUrl}/organization/applications?error=callback_failed`
        )
    }
}
