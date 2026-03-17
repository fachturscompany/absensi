import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';

export async function POST() {
  logger.info('[API /organization/clear] Received request to clear organization cookie.');
  try {
    const response = NextResponse.json({ success: true, message: 'Organization cookie cleared.' });

    // Clear the organization ID cookie on the response
    response.cookies.set('org_id', '', { 
      path: '/', 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: -1 // Expire the cookie immediately
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to clear organization cookie.' },
      { status: 500 }
    );
  }
}
