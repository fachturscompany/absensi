
import { OAuthConfig } from './oauth-helpers'

export const ZOOM_CONFIG: OAuthConfig = {
    clientId: process.env.ZOOM_CLIENT_ID || '',
    clientSecret: process.env.ZOOM_CLIENT_SECRET || '',
    redirectUri: '', // Will be set dynamically based on request origin
    authorizationUrl: 'https://zoom.us/oauth/authorize',
    tokenUrl: 'https://zoom.us/oauth/token',
    scopes: ['meeting:write', 'user:read']
}

export function getZoomRedirectUri(baseUrl: string): string {
    return `${baseUrl}/api/applications/zoom/callback`
}
