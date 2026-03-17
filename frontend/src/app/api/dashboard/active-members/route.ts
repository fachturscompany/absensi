import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserOrganization } from "@/utils/get-user-org";

import { dashboardLogger } from '@/lib/logger';
export async function GET() {
  try {
    // Await cookie store (avoid sync dynamic API usage)
    const cookieStore = await cookies();

    // Create Supabase server client with cookie bridge
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options?: any) {
            // set on the cookie store so response will include it
            // options may include path, maxAge, httpOnly, etc.
            // @ts-ignore - Next.js cookie typing in this project
            cookieStore.set(name, value, options);
          },
          remove(name: string, options?: any) {
            // remove by setting empty value (compat with earlier approach)
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

    // Get current active members for this organization
    const { data: currentMembers, error: currentError } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (currentError) throw currentError;

    // Get previous month's data for comparison
    const previousDate = new Date();
    previousDate.setMonth(previousDate.getMonth() - 1);
    
    const { data: previousMembers, error: previousError } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .lte('hire_date', previousDate.toISOString().split('T')[0]);

    if (previousError) throw previousError;

    const currentMonthCount = currentMembers?.length ?? 0;
    const previousMonthCount = previousMembers?.length ?? 0;
    
    // Calculate percentage change
    let percentChange = 0;
    if (previousMonthCount === 0 && currentMonthCount > 0) {
      percentChange = 100;
    } else if (previousMonthCount === 0 && currentMonthCount === 0) {
      percentChange = 0;
    } else {
      percentChange = Math.round(((currentMonthCount - previousMonthCount) / previousMonthCount) * 100);
    }

    return NextResponse.json({
      success: true,
      data: {
        currentMonth: currentMonthCount,
        previousMonth: previousMonthCount,
        percentChange
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
      }
    });

  } catch (error) {
    dashboardLogger.error('Error fetching active members stats:', error);
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
