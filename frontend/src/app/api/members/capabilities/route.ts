import { NextResponse } from 'next/server'

export async function GET() {
  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  return NextResponse.json({ success: true, capabilities: { serviceRole: hasServiceRole } })
}
