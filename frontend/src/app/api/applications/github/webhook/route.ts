
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

        const eventType = req.headers.get('x-github-event')
        const signature = req.headers.get('x-hub-signature-256')

        if (!eventType || !signature) {
            return NextResponse.json(
                { error: "Missing required headers" },
                { status: 400 }
            )
        }

        if (eventType === 'ping') {
            return NextResponse.json({ message: 'pong' })
        }

        const url = new URL(req.url)
        const orgIdFromParam = url.searchParams.get('orgId')

        const supabase = await createClient()

        let candidateApplications: any[] = []

        if (orgIdFromParam) {
            const res = await supabase
                .from('applications')
                .select('id, webhook_secret')
                .eq('provider', 'github')
                .eq('organization_id', orgIdFromParam)
                .eq('connected', true)
            candidateApplications = res.data || []
        } else {
            const applicationId = url.searchParams.get('id')
            if (applicationId) {
                const res = await supabase
                    .from('applications')
                    .select('id, webhook_secret')
                    .eq('id', applicationId)
                    .maybeSingle()
                if (res.data) candidateApplications = [res.data]
            } else {
                const res = await supabase
                    .from('applications')
                    .select('id, webhook_secret')
                    .eq('provider', 'github')
                    .eq('connected', true)
                candidateApplications = res.data || []
            }
        }

        let verifiedApplication = null

        const headers: Record<string, string> = {}
        req.headers.forEach((value, key) => {
            headers[key] = value
        })
        for (const application of candidateApplications) {
            const verification = await verifyWebhookSignature(
                'github',
                body,
                headers,
                application.id
            )
            if (verification.valid) {
                verifiedApplication = application
                break
            }
        }

        if (!verifiedApplication) {
            console.error('[github] Could not verify signature for any application')
            return NextResponse.json(
                { error: "Invalid signature or unknown application" },
                { status: 401 }
            )
        }

        await storeWebhookEvent(
            verifiedApplication.id,
            eventType,
            payload,
            headers
        )

        return NextResponse.json({ ok: true })

    } catch (error) {
        console.error('[github] Webhook error:', error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
