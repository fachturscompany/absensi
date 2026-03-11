// accept-invite API has been disabled per request.
// This file intentionally returns a 410 Gone to indicate the endpoint is removed.
import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({
    success: false,
    message: 'This endpoint has been disabled',
    code: 'ENDPOINT_DISABLED'
  }, { status: 410 })
}

export async function GET() {
  return NextResponse.json({ ok: false, message: 'accept-invite endpoint removed' }, { status: 410 })
}
