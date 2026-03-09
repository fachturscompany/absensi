export type Member = {
  id: string
  name: string
  avatarUrl?: string | null
}

export type Project = {
  id: string
  name: string
  clientName?: string | null
  teams: string[]
  members: Member[]
  taskCount: number
  budgetLabel: string
  memberLimitLabel: string
  archived: boolean
}

export type MemberLimit = {
  members: string[]
  type: string
  basedOn: string
  cost: string
  resets: string
  startDate: string | null
}

export type NewProjectForm = {
  names: string
  billable: boolean
  disableActivity: boolean
  allowTracking: boolean
  disableIdle: boolean
  clientId: string | null
  members: string[]
  teams: string[]
  // Budget fields
  budgetType: string
  budgetBasedOn: string
  budgetCost: string
  budgetNotifyMembers: boolean
  budgetNotifyAt: string
  budgetNotifyWho: string
  budgetStopTimers: boolean
  budgetStopAt: string
  budgetResets: string
  budgetStartDate: string | null
  budgetIncludeNonBillable: boolean
  // Member limits
  memberLimits: MemberLimit[]
  memberLimitNotifyAt: string
  memberLimitNotifyMembers: boolean
}

export interface DuplicateProjectOptions {
  name: string
  keepTasks: boolean
  keepTasksAssignees: boolean
  keepTasksCompleted: boolean
  keepAllMembers: boolean
  keepBudget: boolean
  keepMemberLimits: boolean
  keepSameClient: boolean
}

export interface DuplicateProjectPayload extends DuplicateProjectOptions {
  sourceProjectId: string
}
