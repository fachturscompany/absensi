"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserOrganization } from "@/utils/get-user-org";
import { IProject } from "@/interface";

async function getSupabase() {
    return await createClient();
}

/**
 * Fetch all projects for the current organization
 */
export const getProjects = async (organizationId?: string | number) => {
    const supabase = await getSupabase();

    let targetOrgId = organizationId;

    if (!targetOrgId) {
        try {
            targetOrgId = await getUserOrganization(supabase);
            console.log("getProjects: resolved via getUserOrganization:", targetOrgId);
        } catch (error) {
            console.error("getProjects: org resolution failed:", error);
            return { success: false, message: "Unauthorized or no organization found", data: [] };
        }
    }

    console.log("getProjects: fetching for org:", targetOrgId);

    const { data, error } = await supabase
        .from("projects")
        .select(`
            *,
            clients:clients!projects_client_id_fkey (id, name),
            tasks (id)
        `)
        .eq("organization_id", targetOrgId)
        .order("name", { ascending: true });

    if (error) {
        console.error("getProjects error:", error);
        return { success: false, message: error.message, data: [] };
    }

    return {
        success: true,
        data: data?.map((p: any) => ({
            ...p,
            client_count: p.clients?.length || 0,
            task_count: p.tasks?.length || 0,
            clientName: p.clients?.[0]?.name || null
        })) as IProject[]
    };
};
