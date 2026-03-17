import { create } from "zustand";
import { persist } from "zustand/middleware";
import { OrganizationStatus } from "@/action/organization";

export interface Organization {
  id: number;
  name: string;
  code: string;
  timezone: string;
  country_code: string;
  roles: Role[];
}

export interface Role {
  id: number;
  code: string;
  name: string;
  description: string;
}

interface OrgState {
  // Current Organization
  organizationId: number | null;
  organizationName: string | null;
  timezone: string;
  organizationStatus: OrganizationStatus | null; // Added field

  // Current Role
  currentRole: string | null;
  currentRoleId: number | null;

  // User's Organizations
  organizations: Organization[];

  // Methods
  setOrganizationId: (id: number, name: string) => void;
  setOrganizationStatus: (status: OrganizationStatus) => void; // Added setter
  setCurrentRole: (roleCode: string, roleId: number) => void;
  setOrganizations: (orgs: Organization[]) => void;
  setTimezone: (tz: string) => void;
  getOrganizationById: (id: number) => Organization | undefined;
  getCurrentRolePermissions: () => string[];
  reset: () => void;
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set, get) => ({
      organizationId: null,
      organizationName: null,
      timezone: "UTC",
      organizationStatus: null,
      currentRole: null,
      currentRoleId: null,
      organizations: [],

      setOrganizationId: (id, name) =>
        set({ organizationId: id, organizationName: name }),

      setOrganizationStatus: (status) =>
        set({ organizationStatus: status }),

      setCurrentRole: (roleCode, roleId) =>
        set({ currentRole: roleCode, currentRoleId: roleId }),

      setOrganizations: (orgs) => set({ organizations: orgs }),

      setTimezone: (tz) => set({ timezone: tz }),

      getOrganizationById: (id) => {
        const { organizations } = get();
        return organizations.find((org) => org.id === id);
      },

      getCurrentRolePermissions: () => {
        const { organizations, organizationId, currentRoleId } = get();
        if (!organizationId || !currentRoleId) return [];

        const org = organizations.find((o) => o.id === organizationId);
        if (!org) return [];

        // This will be populated from API
        // For now, return empty array
        return [];
      },

      reset: () =>
        set({
          organizationId: null,
          organizationName: null,
          timezone: "UTC",
          organizationStatus: null,
          currentRole: null,
          currentRoleId: null,
          organizations: [],
        }),
    }),
    {
      name: "org-store",
      partialize: (state) => ({
        organizationId: state.organizationId,
        organizationName: state.organizationName,
        timezone: state.timezone,
        organizationStatus: state.organizationStatus, // Persist status
        currentRole: state.currentRole,
        currentRoleId: state.currentRoleId,
        organizations: state.organizations,
      }),
    }
  )
);

export default useOrgStore;
