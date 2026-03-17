/**
 * Webhook Helper Functions
 * 
 * Provides utilities for webhook signature verification, event processing,
 * and retry logic for failed webhook events.
 */

import crypto from 'crypto'
import { createClient } from '@/utils/supabase/server'
import { decrypt } from './oauth-helpers'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface WebhookEvent {
    id: string
    integration_id: string
    event_type: string
    payload: any
    processed: boolean
    error_message?: string
    retry_count: number
    received_at: string
}

export interface WebhookVerificationResult {
    valid: boolean
    error?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook Signature Verification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verify Slack webhook signature
 * Slack uses HMAC SHA256 with timestamp
 */
export function verifySlackSignature(
    body: string,
    signature: string,
    timestamp: string,
    secret: string
): WebhookVerificationResult {
    // Prevent replay attacks - reject old timestamps
    const requestTimestamp = parseInt(timestamp, 10)
    const now = Math.floor(Date.now() / 1000)

    if (Math.abs(now - requestTimestamp) > 60 * 5) { // 5 minutes
        return { valid: false, error: 'Timestamp too old' }
    }

    const sigBasestring = `v0:${timestamp}:${body}`
    const expectedSignature = 'v0=' + crypto
        .createHmac('sha256', secret)
        .update(sigBasestring)
        .digest('hex')

    const valid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    )

    return { valid, error: valid ? undefined : 'Invalid signature' }
}

/**
 * Verify GitHub webhook signature
 * GitHub uses HMAC SHA256
 */
export function verifyGitHubSignature(
    body: string,
    signature: string,
    secret: string
): WebhookVerificationResult {
    const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex')

    try {
        const valid = crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        )

        return { valid, error: valid ? undefined : 'Invalid signature' }
    } catch {
        return { valid: false, error: 'Signature comparison failed' }
    }
}

/**
 * Verify Asana webhook signature
 * Asana uses HMAC SHA256
 */
export function verifyAsanaSignature(
    body: string,
    signature: string,
    secret: string
): WebhookVerificationResult {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex')

    try {
        const valid = crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        )

        return { valid, error: valid ? undefined : 'Invalid signature' }
    } catch {
        return { valid: false, error: 'Signature comparison failed' }
    }
}

/**
 * Verify Jira webhook signature
 * Jira uses HMAC SHA256 with specific headers
 */
export function verifyJiraSignature(
    _body: string,
    signature: string,
    secret: string
): WebhookVerificationResult {
    // Jira doesn't use signature verification by default
    // Instead, you can use IP whitelisting or secret token in header
    // For now, we'll verify a custom token
    const valid = signature === secret

    return { valid, error: valid ? undefined : 'Invalid token' }
}

/**
 * Main webhook verification dispatcher
 */
export async function verifyWebhookSignature(
    provider: string,
    body: string,
    headers: Record<string, string>,
    integrationId: string
): Promise<WebhookVerificationResult> {
    // Get webhook secret from database
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('applications')
        .select('webhook_secret')
        .eq('id', integrationId)
        .maybeSingle()

    if (error || !data?.webhook_secret) {
        return { valid: false, error: 'Webhook secret not found' }
    }

    const secret = decrypt(data.webhook_secret)

    switch (provider) {
        case 'slack':
            return verifySlackSignature(
                body,
                headers['x-slack-signature'] || '',
                headers['x-slack-request-timestamp'] || '',
                secret
            )

        case 'github':
        case 'gitlab':
            return verifyGitHubSignature(
                body,
                headers['x-hub-signature-256'] || headers['x-gitlab-token'] || '',
                secret
            )

        case 'asana':
            return verifyAsanaSignature(
                body,
                headers['x-hook-signature'] || '',
                secret
            )

        case 'jira':
            return verifyJiraSignature(
                body,
                headers['x-webhook-token'] || '',
                secret
            )

        default:
            return { valid: false, error: `Unsupported provider: ${provider}` }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook Event Processing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Store incoming webhook event for async processing
 */
export async function storeWebhookEvent(
    integrationId: string,
    eventType: string,
    payload: any,
    headers: Record<string, string>
): Promise<string> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('webhook_events')
        .insert({
            integration_id: integrationId,
            event_type: eventType,
            payload,
            headers,
            processed: false,
            received_at: new Date().toISOString()
        })
        .select('id')
        .maybeSingle()

    if (error) {
        throw new Error(`Failed to store webhook event: ${error.message}`)
    }

    // Record metric
    const { data: integration } = await supabase
        .from('applications')
        .select('provider, organization_id')
        .eq('id', integrationId)
        .maybeSingle()

    if (integration) {
        await supabase.rpc('increment_integration_metric', {
            p_provider: integration.provider,
            p_organization_id: integration.organization_id,
            p_metric_name: 'webhooks_received',
            p_increment: 1
        })
    }

    if (!data) {
        throw new Error('Failed to create webhook event record')
    }

    return data.id
}

/**
 * Mark webhook event as processed
 */
export async function markWebhookProcessed(
    eventId: string,
    success: boolean,
    errorMessage?: string
): Promise<void> {
    const supabase = await createClient()

    await supabase
        .from('webhook_events')
        .update({
            processed: success,
            processed_at: new Date().toISOString(),
            error_message: errorMessage || null
        })
        .eq('id', eventId)

    if (success) {
        // Get integration details for metrics
        const { data: event } = await supabase
            .from('webhook_events')
            .select('integration_id, applications(provider, organization_id)')
            .eq('id', eventId)
            .maybeSingle()

        if (event?.applications) {
            await supabase.rpc('increment_integration_metric', {
                p_provider: (event.applications as any).provider,
                p_organization_id: (event.applications as any).organization_id,
                p_metric_name: 'webhooks_processed',
                p_increment: 1
            })
        }
    }
}

/**
 * Get pending webhook events for processing
 */
export async function getPendingWebhookEvents(limit: number = 100): Promise<WebhookEvent[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .eq('processed', false)
        .lt('retry_count', 3) // Max 3 retries
        .order('received_at', { ascending: true })
        .limit(limit)

    if (error) {
        throw new Error(`Failed to fetch pending events: ${error.message}`)
    }

    return data || []
}

/**
 * Increment retry count for failed webhook processing
 */
export async function incrementWebhookRetry(
    eventId: string,
    errorMessage: string
): Promise<void> {
    const supabase = await createClient()

    const { data: event } = await supabase
        .from('webhook_events')
        .select('retry_count')
        .eq('id', eventId)
        .maybeSingle()

    if (event) {
        await supabase
            .from('webhook_events')
            .update({
                retry_count: event.retry_count + 1,
                error_message: errorMessage
            })
            .eq('id', eventId)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook Event Handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Process webhook event based on provider and event type
 */
export async function processWebhookEvent(event: WebhookEvent): Promise<void> {
    const supabase = await createClient()

    // Get integration details
    const { data: integration } = await supabase
        .from('applications')
        .select('provider, organization_id, config')
        .eq('id', event.integration_id)
        .maybeSingle()

    if (!integration) {
        throw new Error('Integration not found')
    }

    try {
        switch (integration.provider) {
            case 'slack':
                await handleSlackWebhook(event, integration)
                break

            case 'asana':
                await handleAsanaWebhook(event, integration)
                break

            case 'jira':
                await handleJiraWebhook(event, integration)
                break

            case 'github':
            case 'gitlab':
                await handleGitWebhook(event, integration)
                break

            default:
                console.log(`No handler for provider: ${integration.provider}`)
        }

        await markWebhookProcessed(event.id, true)
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        if (event.retry_count < 3) {
            await incrementWebhookRetry(event.id, errorMessage)
        } else {
            await markWebhookProcessed(event.id, false, errorMessage)
        }

        throw error
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider-specific webhook handlers
// ─────────────────────────────────────────────────────────────────────────────

async function handleSlackWebhook(event: WebhookEvent, _integration: any): Promise<void> {
    // Handle Slack events (message posted, reaction added, etc.)
    const { type, event: slackEvent } = event.payload

    console.log(`Slack webhook: ${type}`, slackEvent)

    // Implement Slack-specific logic here
    // For example: sync messages, reactions, or user status
}

async function handleAsanaWebhook(event: WebhookEvent, integration: any): Promise<void> {
    // Handle Asana events (task created, updated, completed, etc.)
    const { events } = event.payload

    for (const asanaEvent of events) {
        const { action, resource } = asanaEvent

        console.log(`Asana webhook: ${action}`, resource)

        // Sync task to external_tasks table
        if (action === 'added' || action === 'changed') {
            // Import or update task
            await syncAsanaTask(resource.gid, integration)
        } else if (action === 'removed') {
            // Delete task
            await deleteExternalTask(integration.id, resource.gid)
        }
    }
}

async function handleJiraWebhook(event: WebhookEvent, _integration: any): Promise<void> {
    // Handle Jira events (issue created, updated, etc.)
    const { webhookEvent, issue } = event.payload

    console.log(`Jira webhook: ${webhookEvent}`, issue?.key)

    // Implement Jira-specific logic here
    // Sync issues, worklogs, sprints
}

async function handleGitWebhook(event: WebhookEvent, _integration: any): Promise<void> {
    // Handle Git events (push, PR, commit, etc.)
    const eventType = event.event_type

    console.log(`Git webhook: ${eventType}`, event.payload)

    // Implement Git-specific logic here
    // Track commits, PRs, issues
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions for specific tasks
// ─────────────────────────────────────────────────────────────────────────────

async function syncAsanaTask(taskGid: string, _application: any): Promise<void> {
    console.log(`Syncing Asana task: ${taskGid}`)
}

async function deleteExternalTask(applicationId: string, externalId: string): Promise<void> {
    const supabase = await createClient()

    await supabase
        .from('external_tasks')
        .delete()
        .eq('application_id', applicationId)
        .eq('external_id', externalId)
}
