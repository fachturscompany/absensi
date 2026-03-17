// src/app/api/projects/list/edge/route.ts
import { createClient } from '@/utils/supabase/server';
import { getUserOrganization } from '@/utils/get-user-org';

export const runtime = 'edge';

async function getSupabase() {
    return await createClient(); // SAME seperti action/projects.ts
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = 10;
    const search = searchParams.get('search') || '';
    const archived = searchParams.get('archived') === 'true';

    const supabase = await getSupabase();

    // RESOLVE ORG ID (SAMA PERSIS seperti action/projects.ts)
    let targetOrgId = searchParams.get('orgId');
    if (!targetOrgId) {
        try {
            targetOrgId = await getUserOrganization(supabase);
        } catch (error) {
            return Response.json(
                { success: false, message: "Unauthorized or no organization found" },
                { status: 401 }
            );
        }
    }

    // EXACT SAME QUERY + PAGINATION + FILTER
    let query = supabase
        .from("projects")
        .select(`
      *,
      clients (id, name),
      tasks (id),
      client_projects (clients:name),
      team_projects (team_id)
    `, {
            count: 'exact',
            head: false
        })
        .eq("organization_id", targetOrgId)
        .order("name", { ascending: true })
        .range((page - 1) * limit, page * limit - 1);

    // Server-side search & filter
    if (search) query = query.ilike('name', `%${search}%`);
    if (archived) query = query.eq('status', 'archived');

    const { data, error, count } = await query;

    if (error) {
        return Response.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }

    // SAME POST-PROCESSING seperti action/projects.ts
    const processedData = data?.map((p: any) => ({
        ...p,
        client_count: p.clients?.length || p.client_projects?.length || 0,
        task_count: p.tasks?.length || 0,
        clientName: p.clients?.[0]?.name || p.client_projects?.[0]?.clients?.name || null
    })) || [];

    return Response.json({
        success: true,
        data: processedData,
        meta: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
        }
    });
}
