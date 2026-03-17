import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = createAdminClient()

    // 1. Raw Count
    const { count: rawCount, error: err1 } = await supabase.from('biometric_data').select('*', { count: 'exact', head: true })

    // 2. Filter Count Exact FINGERPRINT
    const { count: exactCount, error: err2 } = await supabase.from('biometric_data').select('*', { count: 'exact', head: true }).eq('biometric_type', 'FINGERPRINT')

    // 3. Filter ILIKE fingerprint
    const { data: ilikeParams, error: err3 } = await supabase.from('biometric_data').select('id, organization_member_id, biometric_type').ilike('biometric_type', '%fingerprint%').limit(20)

    return NextResponse.json({
        rawCount,
        exactCount,
        ilikeData: ilikeParams,
        errors: [err1, err2, err3]
    }, { status: 200 })
}
