/**
 * OAuth Helper Functions
 * 
 * Provides utilities for OAuth 2.0 flows, token management, and encryption.
 */

import crypto from 'crypto'
import { createClient } from '@/utils/supabase/server'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface OAuthTokens {
    access_token: string
    refresh_token?: string
    expires_in?: number
    token_type?: string
    scope?: string
}

export interface OAuthConfig {
    clientId: string
    clientSecret: string
    redirectUri: string
    authorizationUrl: string
    tokenUrl: string
    scopes: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Encryption/Decryption
// ─────────────────────────────────────────────────────────────────────────────

const ENCRYPTION_KEY = process.env.APPLICATION_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
const ALGORITHM = 'aes-256-gcm'

/**
 * Encrypt sensitive data (tokens, secrets)
 */
export function encrypt(text: string): string {
    if (!text) return ''

    const iv = crypto.randomBytes(16)
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex')
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Return: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
    if (!encryptedText) return ''

    const parts = encryptedText.split(':')
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
        throw new Error('Invalid encrypted text format')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]

    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted: string = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
}

// ─────────────────────────────────────────────────────────────────────────────
// OAuth State Management (CSRF Protection)
// ─────────────────────────────────────────────────────────────────────────────

const STATE_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes

interface OAuthState {
    provider: string
    organizationId: string
    timestamp: number
    nonce: string
}

/**
 * Generate a secure OAuth state parameter
 */
export function generateOAuthState(provider: string, organizationId: string): string {
    const state: OAuthState = {
        provider,
        organizationId,
        timestamp: Date.now(),
        nonce: crypto.randomBytes(16).toString('hex')
    }

    const stateJson = JSON.stringify(state)
    return Buffer.from(stateJson).toString('base64url')
}

/**
 * Verify and decode OAuth state parameter
 */
export function verifyOAuthState(stateParam: string): OAuthState {
    try {
        const stateJson = Buffer.from(stateParam, 'base64url').toString('utf8')
        const state: OAuthState = JSON.parse(stateJson)

        // Check timestamp to prevent replay attacks
        if (Date.now() - state.timestamp > STATE_TIMEOUT_MS) {
            throw new Error('OAuth state has expired')
        }

        return state
    } catch (error) {
        throw new Error('Invalid OAuth state parameter')
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// OAuth Flow Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build OAuth authorization URL
 */
export function buildAuthorizationUrl(
    config: OAuthConfig,
    state: string,
    additionalParams?: Record<string, string>
): string {
    const url = new URL(config.authorizationUrl)

    url.searchParams.set('client_id', config.clientId)
    url.searchParams.set('redirect_uri', config.redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', config.scopes.join(' '))
    url.searchParams.set('state', state)

    // Add provider-specific params
    if (additionalParams) {
        Object.entries(additionalParams).forEach(([key, value]) => {
            url.searchParams.set(key, value)
        })
    }

    return url.toString()
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
    config: OAuthConfig,
    code: string
): Promise<OAuthTokens> {
    const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            client_id: config.clientId,
            client_secret: config.clientSecret,
            redirect_uri: config.redirectUri
        })
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Token exchange failed: ${error}`)
    }

    return await response.json()
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(
    config: OAuthConfig,
    refreshToken: string
): Promise<OAuthTokens> {
    const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: config.clientId,
            client_secret: config.clientSecret
        })
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Token refresh failed: ${error}`)
    }

    return await response.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Storage Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Store OAuth tokens securely in the database
 */
export async function storeOAuthTokens(
    applicationId: string,
    tokens: OAuthTokens
): Promise<void> {
    const supabase = await createClient()

    const expiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null

    const { error } = await supabase
        .from('applications')
        .update({
            access_token: encrypt(tokens.access_token),
            refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
            token_expires_at: expiresAt,
            permissions: tokens.scope?.split(' ') || [],
            status: 'ACTIVE',
            connected: true,
            error_message: null,
            error_count: 0,
            updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)

    if (error) {
        throw new Error(`Failed to store tokens: ${error.message}`)
    }
}

/**
 * Retrieve and decrypt access token
 */
export async function getAccessToken(applicationId: string): Promise<string> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('applications')
        .select('access_token, token_expires_at, refresh_token')
        .eq('id', applicationId)
        .maybeSingle()

    if (error || !data) {
        throw new Error('Application not found')
    }

    // Check if token is expired and refresh if needed
    const now = new Date()
    const expiresAt = data.token_expires_at ? new Date(data.token_expires_at) : null

    if (expiresAt && now >= expiresAt && data.refresh_token) {
        // Token expired - need to refresh
        // This should trigger a background job to refresh the token
        throw new Error('Token expired - refresh required')
    }

    return decrypt(data.access_token)
}

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────────────────────────────────────────────

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Check if API call is within rate limit
 */
export function checkRateLimit(
    provider: string,
    organizationId: string,
    maxCalls: number,
    windowMs: number
): boolean {
    const key = `${provider}:${organizationId}`
    const now = Date.now()

    const current = rateLimitStore.get(key)

    if (!current || now > current.resetAt) {
        rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
        return true
    }

    if (current.count >= maxCalls) {
        return false
    }

    current.count++
    return true
}

/**
 * Record API call for metrics
 */
export async function recordApiCall(provider: string, organizationId: string): Promise<void> {
    const supabase = await createClient()

    await supabase.rpc('increment_application_metric', {
        p_provider: provider,
        p_organization_id: organizationId,
        p_metric_name: 'api_calls',
        p_increment: 1
    })
}
