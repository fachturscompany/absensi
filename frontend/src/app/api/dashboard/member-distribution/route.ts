import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserOrganization } from "@/utils/get-user-org";

export async function GET() {
  const defaultData = {
    status: [
      { name: "Active", value: 0, color: "#10b981" },
      { name: "Inactive", value: 0, color: "#ef4444" }
    ],
    employment: []
  };

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

    const organizationId = await getUserOrganization(supabase);
    if (!organizationId) {
      return NextResponse.json({ 
        success: true, 
        data: defaultData 
      }, {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=30'
        }
      });
    }

    // Get active members count
    const { count: activeCount } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    // Get inactive members count
    const { count: inactiveCount } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_active", false);

    // Get members by employment status
    const { data: employmentData } = await supabase
      .from("organization_members")
      .select("employment_status")
      .eq("organization_id", organizationId);

    const employmentDistribution = employmentData?.reduce((acc: Record<string, number>, member) => {
      const status = member.employment_status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}) || {};

    const result = {
      status: [
        { name: "Active", value: activeCount || 0, color: "#10b981" },
        { name: "Inactive", value: inactiveCount || 0, color: "#ef4444" }
      ],
      employment: Object.entries(employmentDistribution).map(([key, value], index) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: value as number,
        color: ["#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981"][index % 5]
      }))
    };

    return NextResponse.json({
      success: true,
      data: result
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Error fetching member distribution:', error);
    return NextResponse.json({
      success: true,
      data: defaultData
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30'
      }
    });
  }
}
