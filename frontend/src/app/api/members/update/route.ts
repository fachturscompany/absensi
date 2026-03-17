import { NextResponse } from 'next/server'
import { updateOrganizationMember } from '@/action/members'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, payload } = body

    if (!id || !payload) return NextResponse.json({ success: false, message: 'Missing id or payload' }, { status: 400 })

    const res = await updateOrganizationMember(id, payload)
    return NextResponse.json(res)
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message ?? String(err) }, { status: 500 })
  }
}
