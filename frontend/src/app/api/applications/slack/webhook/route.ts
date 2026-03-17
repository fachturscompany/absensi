/**
 * POST /api/integrations/slack/webhook
 * 
 * Handle incoming Slack webhook events.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import {
    verifyWebhookSignature,
    storeWebhookEvent
} from "@/lib/applications/webhook-helpers"

export async function POST(req: NextRequest) {
    try {
        const body = await req.text()
        const payload = JSON.parse(body)

        // Slack sends a challenge request for webhook verification
        if (payload.type === 'url_verification') {
            return NextResponse.json({ challenge: payload.challenge })
        }

        // Get integration for this Slack workspace
        const teamId = payload.team_id
        if (!teamId) {
            return NextResponse.json(
                { error: "Missing team_id" },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Find application by Slack team ID (stored in config)
        const { data: applications } = await supabase
            .from('applications')
            .select('id, webhook_secret, config')
            .eq('provider', 'slack')
            .eq('connected', true)

        const application = applications?.find(
            i => (i.config as any)?.team_id === teamId
        )

        if (!application) {
            console.error('[slack] Application not found for team:', teamId)
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404 }
            )
        }

        // Verify webhook signature
        const headers: Record<string, string> = {}
        req.headers.forEach((value, key) => {
            headers[key] = value
        })

        const verification = await verifyWebhookSignature(
            'slack',
            body,
            headers,
            application.id
        )

        if (!verification.valid) {
            console.error('[slack] Invalid signature:', verification.error)
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 }
            )
        }

        // Store webhook event for async processing
        const eventType = payload.event?.type || payload.type
        await storeWebhookEvent(
            application.id,
            eventType,
            payload,
            headers
        )

        // Respond quickly to Slack
        return NextResponse.json({ ok: true })

    } catch (error) {
        console.error('[slack] Webhook error:', error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
