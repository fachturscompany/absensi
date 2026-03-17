"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/user-store"
import { useOrgStore } from "@/store/org-store"
import { getInitialUserData } from "@/action/bootstrap"
import { getUserOrganizations } from "@/action/user-organizations"

import { logger } from '@/lib/logger';

// Module-level variable for request deduplication
let globalLoadPromise: Promise<void> | null = null;

/**
 * Permission Initializer Component
 * Loads user permissions and role on mount and stores them in Zustand
 * Should be placed in layout or root component
 */
export function PermissionInitializer({ userId }: { userId: string }) {
  const setPermissions = useAuthStore((state) => state.setPermissions)
  const setRole = useAuthStore((state) => state.setRole)
  const setUserOrganizations = useAuthStore((state) => state.setUserOrganizations)
  const setOrganizationId = useOrgStore((state) => state.setOrganizationId)

  // Module-level variable to deduplicate across multiple mounts
  // This must be outside the component/effect scope

  useEffect(() => {

    const loadPermissionsAndRole = async () => {

      // 1. Check in-memory store (FASTEST)
      let currentPermissions = useAuthStore.getState().permissions
      let currentRole = useAuthStore.getState().role
      const cachedOrgs = useAuthStore.getState().userOrganizations

      // Jika cache ada tapi semua orgnya "Unknown Organization", paksa re-fetch
      const hasStaleOrgNames = cachedOrgs.length > 0 && cachedOrgs.every(o => o.organization_name === "Unknown Organization")

      if (currentPermissions && currentPermissions.length > 0 && currentRole && !hasStaleOrgNames) {
        logger.debug("✅ Using cached permissions/role, skipping server fetch")
        return
      }

      // If a load is already in progress, wait for it to finish instead of starting a new one.
      if (globalLoadPromise) {
        logger.debug("⏳ Another fetch is already in progress, joining it...");
        await globalLoadPromise;
        return;
      }

      // 2. Hydration Wait: Wait for persisted state
      await new Promise(resolve => setTimeout(resolve, 500));

      currentPermissions = useAuthStore.getState().permissions
      currentRole = useAuthStore.getState().role

      const cachedOrgsAfterHydration = useAuthStore.getState().userOrganizations
      const hasStaleOrgsAfterHydration = cachedOrgsAfterHydration.length > 0 && cachedOrgsAfterHydration.every(o => o.organization_name === "Unknown Organization")

      if (currentPermissions && currentPermissions.length > 0 && currentRole && !hasStaleOrgsAfterHydration) {
        logger.debug("✅ Using cached permissions/role (after hydration wait), skipping server fetch")
        return
      }

      // Double-check if another instance started fetching while we were sleeping
      if (globalLoadPromise) {
        logger.debug("⏳ Another fetch started during hydration wait, joining it...");
        await globalLoadPromise;
        return;
      }

      // 3. Start Server Fetch (wrapped in a shared promise)
      globalLoadPromise = (async () => {
        try {
          console.log("[PermissionInitializer] Starting bootstrap for userId:", userId);
          // CALL MASTER BOOTSTRAP ACTION
          const [bootstrapData, userOrgs] = await Promise.all([
            getInitialUserData(userId),
            getUserOrganizations(userId)
          ])

          // 1. Set Permissions
          setPermissions(bootstrapData.permissions)
          logger.debug("✅ Permissions loaded:", bootstrapData.permissions)

          // 2. Set Role
          if (bootstrapData.role.code) {
            setRole(bootstrapData.role.code)
            logger.debug("✅ Role loaded:", bootstrapData.role.code)
          } else {
            setRole(null)
          }

          // 3. Set Organization ID (with actual org name from userOrgs)
          if (bootstrapData.organizationId) {
            const matchedOrg = userOrgs.find(o => o.organization_id === bootstrapData.organizationId);
            const orgName = matchedOrg?.organization_name
              || userOrgs[0]?.organization_name
              || "";
            if (orgName) {
              setOrganizationId(bootstrapData.organizationId, orgName);
            } else {
              // Set ID saja tanpa nama (akan di-update oleh organization-switcher)
              setOrganizationId(bootstrapData.organizationId, "");
            }
          }

          // 4. Set Organization Status (Prevent OrgStatusChecker from refetching)
          useOrgStore.getState().setOrganizationStatus(bootstrapData.organizationStatus)
          logger.debug("✅ Organization Status loaded:", bootstrapData.organizationStatus)

          // 5. Set User Organizations
          setUserOrganizations(userOrgs)
          logger.debug("✅ User Organizations loaded:", userOrgs)

        } catch (error) {
          logger.error("❌ Failed to load bootstrap data:", error)
          setPermissions([])
          setRole(null)
        } finally {
          // Clear promise so future retries can happen if needed
          globalLoadPromise = null;
        }
      })();

      await globalLoadPromise;
    }

    if (userId) {
      loadPermissionsAndRole()
    }
  }, [userId, setPermissions, setRole, setUserOrganizations, setOrganizationId])

  return null
}
