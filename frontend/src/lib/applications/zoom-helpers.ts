/**
 * Zoom Server-to-Server OAuth Helper
 * 
 * Zoom uses account_credentials grant type for server-to-server apps.
 * No user authorization flow needed - just exchange credentials for access token.
 */

interface ZoomTokenResponse {
    access_token: string
    token_type: string
    expires_in: number
    scope: string
}

/**
 * Get Zoom Access Token using Server-to-Server OAuth
 * 
 * @returns Access token and expiration info
 * @throws Error if token request fails
 */
export async function getZoomAccessToken(): Promise<ZoomTokenResponse> {
    const accountId = process.env.ZOOM_ACCOUNT_ID
    const clientId = process.env.ZOOM_CLIENT_ID
    const clientSecret = process.env.ZOOM_CLIENT_SECRET

    if (!accountId || !clientId || !clientSecret) {
        throw new Error('Missing Zoom credentials in environment variables')
    }

    // Encode ClientID:ClientSecret to Base64 for Basic Auth
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const response = await fetch(
        `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    )

    if (!response.ok) {
        const error = await response.text()
        console.error('[zoom] Token request failed:', error)
        throw new Error(`Failed to get Zoom access token: ${response.statusText}`)
    }

    const data: ZoomTokenResponse = await response.json()

    console.log('[zoom] Access token retrieved successfully, expires in:', data.expires_in, 'seconds')

    return data
}

/**
 * Refresh Zoom Access Token
 * Note: Server-to-Server apps don't use refresh tokens.
 * Just call getZoomAccessToken() again when needed.
 */
export async function refreshZoomAccessToken(): Promise<ZoomTokenResponse> {
    // For Server-to-Server OAuth, just get a new token
    return getZoomAccessToken()
}

/**
 * Revoke Zoom Access Token
 * 
 * @param accessToken The access token to revoke
 */
export async function revokeZoomToken(accessToken: string): Promise<void> {
    const clientId = process.env.ZOOM_CLIENT_ID
    const clientSecret = process.env.ZOOM_CLIENT_SECRET

    if (!clientId || !clientSecret) {
        console.warn('[zoom] Cannot revoke token: Missing credentials')
        return
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    try {
        const response = await fetch('https://zoom.us/oauth/revoke', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                token: accessToken
            })
        })

        if (!response.ok) {
            const error = await response.text()
            console.error('[zoom] Token revocation failed:', error)
            // Don't throw, just log. We still want to delete from DB.
        } else {
            console.log('[zoom] Token revoked successfully')
        }
    } catch (error) {
        console.error('[zoom] Error revoking token:', error)
    }
}
