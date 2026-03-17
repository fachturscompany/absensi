"use server";

import { createClient } from "@/utils/supabase/server";
import { ITeams } from "@/interface";

export const getTeams = async (organizationId?: number, includeInactive: boolean = false) => {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return { success: false, message: "User not logged in", data: [] as ITeams[] };
    }

    let targetOrgId = organizationId;

    if (!targetOrgId) {
        const { data: member } = await supabase
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (!member) {
            return { success: true, message: "User not in any organization", data: [] as ITeams[] };
        }
        targetOrgId = member.organization_id;
    }

    let query = supabase
        .from("teams")
        .select("id, organization_id, code, name, description, is_active, created_at, updated_at, settings, metadata")
        .eq("organization_id", targetOrgId);

    if (!includeInactive) {
        query = query.eq("is_active", true);
    }

    const { data, error } = await query.order("name", { ascending: true });

    if (error) {
        console.error("getTeams error:", error);
        return { success: false, message: error.message, data: [] as ITeams[] };
    }

    return { success: true, data: data as ITeams[] };
};