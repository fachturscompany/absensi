import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ success: false, error: 'This endpoint has been removed. Use application user records for last seen.' }, { status: 410 })
}
