import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserOrganization } from "@/utils/get-user-org";
import { getMonthRange, getPreviousMonthRange } from "@/utils/date-range";

import { dashboardLogger } from '@/lib/logger';
export async function GET() {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options?: any) {
            // @ts-ignore
            cookieStore.set(name, value, options);
          },
          remove(name: string, options?: any) {
            // @ts-ignore
            cookieStore.set(name, "", options);
          },
        },
      }
    );

    // Get user's organization
    const organizationId = await getUserOrganization(supabase);
    if (!organizationId) {
      throw new Error('No organization found for user');
    }

    const currentRange = getMonthRange();
    const previousRange = getPreviousMonthRange();

    // Get member IDs for the organization
    const { data: members, error: memberError } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (memberError) throw memberError;

    const memberIds = members?.map(m => m.id) || [];
    if (memberIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          currentMonth: 0,
          previousMonth: 0,
          percentChange: 0
        }
      });
    }

    // Get current month lates (use status = 'late' to be consistent)
    const { count: currentCount, error: curError } = await supabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .in('organization_member_id', memberIds)
      .gte('attendance_date', currentRange.start)
      .lte('attendance_date', currentRange.end)
      .eq('status', 'late');

    if (curError) throw curError;

    // Get previous month lates (use status = 'late')
    const { count: previousCount, error: prevError } = await supabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .in('organization_member_id', memberIds)
      .gte('attendance_date', previousRange.start)
      .lte('attendance_date', previousRange.end)
      .eq('status', 'late');

    if (prevError) throw prevError;

    const current = currentCount ?? 0;
    const previous = previousCount ?? 0;

    let percentChange = 0;
    if (previous === 0 && current > 0) {
      percentChange = 100;
    } else if (previous === 0 && current === 0) {
      percentChange = 0;
    } else {
      percentChange = Math.round(((current - previous) / previous) * 100);
    }

    return NextResponse.json({
      success: true,
      data: {
        currentMonth: current,
        previousMonth: previous,
        percentChange
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
      }
    });
  } catch (e) {
    dashboardLogger.error('Error fetching monthly late stats:', e);
    return NextResponse.json({
      success: false,
      data: {
        currentMonth: 0,
        previousMonth: 0,
        percentChange: 0
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30'
      }
    });
  }
}
