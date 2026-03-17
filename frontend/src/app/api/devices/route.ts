import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getUserOrganization } from "@/utils/get-user-org"

interface DeviceType {
  id: number
  name: string | null
}

interface AttendanceDevice {
  id: number
  device_name: string
  serial_number: string | null
  is_active: boolean
  location: string | null
  created_at: string
  organization_id: number
  device_type_id: number | null
  device_types?: DeviceType | null
}

function toInt(value: string | null, fallback: number): number {
  if (!value) return fallback
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const page = toInt(url.searchParams.get("page"), 1)
    const limit = toInt(url.searchParams.get("limit"), 10)
    const search = url.searchParams.get("search")?.trim() ?? ""
    const statusParam = url.searchParams.get("status")?.trim() ?? ""
    const typeParam = url.searchParams.get("type")?.trim() ?? ""
    const orgIdParam = url.searchParams.get("orgId")?.trim() ?? ""

    const supabase = await createClient()
    let orgId: number
    if (orgIdParam) {
      const maybe = Number.parseInt(orgIdParam, 10)
      if (!Number.isFinite(maybe)) {
        return NextResponse.json({ success: false, message: 'Invalid orgId' }, { status: 400 })
      }
      // Validate that current user is active member of the provided org
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
      }
      const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('organization_id', maybe)
        .eq('is_active', true)
        .maybeSingle()
      if (memberError || !member?.organization_id) {
        return NextResponse.json({ success: false, message: 'No organization found' }, { status: 403 })
      }
      orgId = maybe
    } else {
      try {
        orgId = await getUserOrganization(supabase)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unauthorized'
        const status = msg === 'Unauthorized' ? 401 : (msg.includes('No organization') ? 403 : 400)
        return NextResponse.json({ success: false, message: msg }, { status })
      }
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from("attendance_devices")
      .select("*, device_types(*)", { count: "exact" })
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })

    // Filter status
    if (statusParam === "active") {
      query = query.eq("is_active", true)
    } else if (statusParam === "inactive") {
      query = query.eq("is_active", false)
    }

    // Filter device type
    if (typeParam) {
      const typeId = Number.parseInt(typeParam, 10)
      if (Number.isFinite(typeId)) {
        query = query.eq("device_type_id", typeId)
      }
    }

    // Search by name or serial number
    if (search) {
      const pattern = `%${search}%`
      query = query.or(
        `device_name.ilike.${pattern},serial_number.ilike.${pattern}`
      )
    }

    const { data, error, count } = await query.range(from, to)

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      )
    }

    const items: AttendanceDevice[] = (data as unknown as AttendanceDevice[]) ?? []
    const total = count ?? 0
    const totalPages = Math.max(1, Math.ceil(total / limit))

    return NextResponse.json(
  {
    success: true,
    page,
    limit,
    total,
    totalPages,
    from: total > 0 ? from + 1 : 0,
    to: Math.min(to + 1, total),
    items,
  },
  {
    headers: {
      'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
      'Vary': 'Cookie',
    },
  }
)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
