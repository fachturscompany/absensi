import OAuth from 'oauth-1.0a'
import crypto from 'crypto'

// Initialize OAuth 1.0a helper
const oauth = new OAuth({
    consumer: {
        key: process.env.TRELLO_API_KEY!,
        secret: process.env.TRELLO_API_SECRET!,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string: string, key: string) {
        return crypto
            .createHmac('sha1', key)
            .update(base_string)
            .digest('base64')
    },
})

export async function getTrelloRequestToken(callbackUrl: string) {
    const requestData = {
        url: 'https://trello.com/1/OAuthGetRequestToken',
        method: 'POST',
        data: {
            oauth_callback: callbackUrl,
            scope: 'read,write',
            expiration: 'never',
            name: 'Absensi Application',
        },
    }

    const authHeader = oauth.toHeader(oauth.authorize(requestData))

    const response = await fetch(requestData.url, {
        method: requestData.method,
        headers: {
            ...authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(requestData.data as any).toString()
    })

    if (!response.ok) {
        const text = await response.text()
        throw new Error(`Failed to get request token: ${response.status} ${text}`)
    }

    const text = await response.text()
    const params = new URLSearchParams(text)

    return {
        oauth_token: params.get('oauth_token'),
        oauth_token_secret: params.get('oauth_token_secret')
    }
}

export async function getTrelloAccessToken(oauthToken: string, oauthVerifier: string, tokenSecret: string) {
    const requestData = {
        url: 'https://trello.com/1/OAuthGetAccessToken',
        method: 'POST',
        data: {
            oauth_verifier: oauthVerifier,
            oauth_token: oauthToken
        },
    }

    // For the access token step, we need the token secret from the previous step
    const token = {
        key: oauthToken,
        secret: tokenSecret,
    }

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token))

    const response = await fetch(requestData.url, {
        method: requestData.method,
        headers: {
            ...authHeader,
        },
    })

    if (!response.ok) {
        const text = await response.text()
        throw new Error(`Failed to get access token: ${response.status} ${text}`)
    }

    const text = await response.text()
    const params = new URLSearchParams(text)

    return {
        oauth_token: params.get('oauth_token'),
        oauth_token_secret: params.get('oauth_token_secret')
    }
}

export function getTrelloAuthUrl(oauthToken: string) {
    return `https://trello.com/1/OAuthAuthorizeToken?oauth_token=${oauthToken}&name=${encodeURIComponent('Absensi Application')}&scope=read,write&expiration=never`
}
