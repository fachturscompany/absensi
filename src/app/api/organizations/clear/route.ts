import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * POST /api/organizations/clear
 * Clears the org_id cookie (used on sign-out / org switch).
 */
export async function POST() {
    logger.info('[API /organizations/clear] Received request to clear organization cookie.')
    try {
        const response = NextResponse.json({ success: true, message: 'Organization cookie cleared.' })

        response.cookies.set('org_id', '', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: -1
        })

        return response
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Failed to clear organization cookie.' },
            { status: 500 }
        )
    }
}
