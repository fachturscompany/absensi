import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface SetupWizardState {
  currentStep: number
  orgInfo: {
    name: string
    code: string
    country_code: string
    timezone: string
    address: string
  }
  basicSettings: {
    currency: string
    work_hours_start: string
    work_hours_end: string
    attendance_method: string
    leave_policy: string
  }
  importMembers: {
    file: File | null
    columnMapping: Record<string, number>
    previewData: any[]
    importedCount: number
  }
  roleAssignment: {
    default_role_id: number
    memberRoles: Record<number, number>
  }
  
  // Methods
  setCurrentStep: (step: number) => void
  setOrgInfo: (info: Partial<SetupWizardState["orgInfo"]>) => void
  setBasicSettings: (settings: Partial<SetupWizardState["basicSettings"]>) => void
  setImportMembers: (members: Partial<SetupWizardState["importMembers"]>) => void
  setRoleAssignment: (roles: Partial<SetupWizardState["roleAssignment"]>) => void
  reset: () => void
}

const initialOrgInfo = {
  name: "",
  code: "",
  country_code: "",
  timezone: "UTC",
  address: "",
}

const initialBasicSettings = {
  currency: "IDR",
  work_hours_start: "08:00",
  work_hours_end: "17:00",
  attendance_method: "manual",
  leave_policy: "standard",
}

const initialImportMembers = {
  file: null,
  columnMapping: {},
  previewData: [],
  importedCount: 0,
}

const initialRoleAssignment = {
  default_role_id: 0,
  memberRoles: {},
}

export const useSetupWizardStore = create<SetupWizardState>()(
  persist(
    (set) => ({
      currentStep: 1,
      orgInfo: initialOrgInfo,
      basicSettings: initialBasicSettings,
      importMembers: initialImportMembers,
      roleAssignment: initialRoleAssignment,

      setCurrentStep: (step) => set({ currentStep: step }),

      setOrgInfo: (info) =>
        set((state) => ({
          orgInfo: { ...state.orgInfo, ...info },
        })),

      setBasicSettings: (settings) =>
        set((state) => ({
          basicSettings: { ...state.basicSettings, ...settings },
        })),

      setImportMembers: (members) =>
        set((state) => ({
          importMembers: { ...state.importMembers, ...members },
        })),

      setRoleAssignment: (roles) =>
        set((state) => ({
          roleAssignment: { ...state.roleAssignment, ...roles },
        })),

      reset: () =>
        set({
          currentStep: 1,
          orgInfo: initialOrgInfo,
          basicSettings: initialBasicSettings,
          importMembers: initialImportMembers,
          roleAssignment: initialRoleAssignment,
        }),
    }),
    {
      name: "setup-wizard-store",
      partialize: (state) => ({
        currentStep: state.currentStep,
        orgInfo: state.orgInfo,
        basicSettings: state.basicSettings,
        roleAssignment: state.roleAssignment,
      }),
    }
  )
)
