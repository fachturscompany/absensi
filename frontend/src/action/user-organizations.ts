"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { UserOrganization } from "@/store/user-store";

export async function getUserOrganizations(userId: string): Promise<UserOrganization[]> {
    try {
        // Gunakan admin client agar tidak terblokir RLS
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

        // Fallback ke regular client jika tidak ada service role key
        const supabase = serviceRoleKey
            ? createAdminClient(supabaseUrl, serviceRoleKey)
            : await createClient();

        const { data, error } = await supabase
            .from("organization_members")
            .select(`
        id,
        organization_id,
        organization:organizations (
          id,
          name
        ),
        organization_member_roles (
          system_roles (
            id,
            code,
            name
          )
        )
      `)
            .eq("user_id", userId)
            .eq("is_active", true);

        console.log("[getUserOrganizations] Fetching for userId:", userId);
        console.log("[getUserOrganizations] Raw DB Data:", JSON.stringify(data, null, 2));
        console.log("[getUserOrganizations] DB Error:", error);

        if (error) {
            console.error("Error fetching user organizations:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        // Kumpulkan semua organization_id yang join-nya gagal (name null)
        const missingOrgIds = data
            .filter((item: any) => {
                const org = Array.isArray(item.organization) ? item.organization[0] : item.organization;
                return !org?.name;
            })
            .map((item: any) => item.organization_id)
            .filter(Boolean);

        // Fallback: ambil langsung dari tabel organizations untuk yang missing
        const orgNameMap: Record<number, string> = {};
        if (missingOrgIds.length > 0) {
            const { data: orgsData } = await supabase
                .from("organizations")
                .select("id, name")
                .in("id", missingOrgIds);

            if (orgsData) {
                for (const org of orgsData) {
                    orgNameMap[org.id] = org.name;
                }
            }
        }

        // Transform the data to match UserOrganization interface
        return data.map((item: any) => {
            const memberRoles = item.organization_member_roles || [];
            const roles = memberRoles
                .flatMap((mr: any) =>
                    mr.system_roles
                        ? Array.isArray(mr.system_roles) ? mr.system_roles : [mr.system_roles]
                        : []
                )
                .filter(Boolean);

            // Handle both array and object response from Supabase join
            const org = Array.isArray(item.organization) ? item.organization[0] : item.organization;
            // Gunakan join result, fallback ke query langsung, fallback ke "Unknown Organization"
            const orgName = org?.name || orgNameMap[item.organization_id] || "Unknown Organization";

            return {
                id: item.id,
                organization_id: item.organization_id,
                organization_name: orgName,
                roles,
            };
        });
    } catch (error) {
        console.error("Error in getUserOrganizations:", error);
        return [];
    }
}
