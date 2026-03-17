import { create } from "zustand"
import { persist } from "zustand/middleware"
import { IUser } from "@/interface"
import { Role } from "@/lib/types/organization"

type UserUpdater = IUser | null | ((currentUser: IUser | null) => IUser | null)

export interface UserOrganization {
  id: number
  organization_id: number
  organization_name: string
  roles: Role[]
}

interface AuthState {
  user: IUser | null
  role: string | null
  roleId: number | null
  permissions: string[]
  userOrganizations: UserOrganization[]
  
  setUser: (updater: UserUpdater) => void
  setRole: (role: string | null, roleId?: number | null) => void
  setPermissions: (permissions: string[]) => void
  setUserOrganizations: (orgs: UserOrganization[]) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      roleId: null,
      permissions: [],
      userOrganizations: [],
      
      setUser: (updater) =>
        set((state) => ({
          user:
            typeof updater === "function"
              ? (updater as (u: IUser | null) => IUser | null)(state.user)
              : updater,
        })),
      
      setRole: (role, roleId) => set({ role, roleId: roleId || null }),
      
      setPermissions: (permissions) => set({ permissions }),
      
      setUserOrganizations: (orgs) => set({ userOrganizations: orgs }),
      
      reset: () =>
        set({
          user: null,
          role: null,
          roleId: null,
          permissions: [],
          userOrganizations: [],
        }),
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        roleId: state.roleId,
        permissions: state.permissions,
        userOrganizations: state.userOrganizations,
      }),
    }
  )
)

// Alias for backward compatibility
export const useUserStore = useAuthStore
