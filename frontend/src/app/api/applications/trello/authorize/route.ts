import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getTrelloRequestToken, getTrelloAuthUrl } from "@/lib/applications/trello-oauth"
import { cookies } from "next/headers"

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

        // 2. Get organization context
        const orgId = req.cookies.get('org_id')?.value
        if (!orgId) {
            return NextResponse.json(
                { error: "No active organization" },
                { status: 400 }
            )
        }

        // 3. Verify membership
        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .eq('organization_id', orgId)
            .single()

        if (!member) {
            return NextResponse.json(
                { error: "Not a member of this organization" },
                { status: 403 }
            )
        }

        // 4. Construct Callback URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://absensi-ubig.vercel.app')

        const callbackUrl = `${baseUrl}/api/applications/trello/callback`

        // 5. Get Request Token (OAuth 1.0a Step 1)
        const { oauth_token, oauth_token_secret } = await getTrelloRequestToken(callbackUrl)

        if (!oauth_token || !oauth_token_secret) {
            throw new Error("Failed to retrieve request token from Trello")
        }

        // 6. Store token secret in cookie (needed for Step 3)
        // We use the oauth_token as the key or part of the state
        // Since Trello doesn't support 'state' param in the same way as OAuth2, 
        // we rely on the oauth_token being returned in callback to look up the secret.

        const cookieStore = await cookies()

        cookieStore.set(`trello_secret_${oauth_token}`, oauth_token_secret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 10 // 10 minutes
        })

        // Also store orgId to know where to connect later
        cookieStore.set(`trello_org_${oauth_token}`, orgId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 10
        })

        // 7. Return Auth URL
        const authUrl = getTrelloAuthUrl(oauth_token)

        return NextResponse.json({ redirectUrl: authUrl })

    } catch (error) {
        console.error('[trello] Authorization error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to initiate Trello authorization" },
            { status: 500 }
        )
    }
}
