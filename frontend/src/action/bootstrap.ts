"use server";

import { getUserPermissions, getUserOrgRole } from "@/lib/rbac";
import { checkOrganizationStatus, OrganizationStatus } from "@/action/organization";

export interface BootstrapData {
    permissions: string[];
    role: { code: string | null; id: number | null };
    organizationId: number | null;
    organizationStatus: OrganizationStatus;
}

/**
 * Master Bootstrap Action
 * Fetches all initial user data in a single parallel server-side request.
 * - RBAC (Permissions & Role)
 * - Organization Status (Active/Expired)
 */
export async function getInitialUserData(userId: string): Promise<BootstrapData> {
    try {
        // Run independent server actions parallelly
        const [permissions, orgRoleData, orgStatus] = await Promise.all([
            getUserPermissions(userId),
            getUserOrgRole(userId),
            checkOrganizationStatus()
        ]);

        return {
            permissions,
            role: {
                code: orgRoleData.role?.code ?? null,
                id: orgRoleData.role?.id ? Number(orgRoleData.role.id) : null
            },
            organizationId: orgRoleData.organizationId ? Number(orgRoleData.organizationId) : null,
            organizationStatus: orgStatus
        };
    } catch (error) {
        console.error("Error in getInitialUserData:", error);
        // Return safe fallback data in case of partial error
        return {
            permissions: [],
            role: { code: null, id: null },
            organizationId: null,
            // Default to invalid status if check fails, to trigger re-check or safe mode
            organizationStatus: { isValid: false, reason: "not_found" }
        };
    }
}
