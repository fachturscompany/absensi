// Consolidated Dummy Data
import * as LucideIcons from 'lucide-react'

// ============================================================================
// ORGANIZATIONS
// ============================================================================

export interface TimeOffTransaction {
    id: string
    memberId: string
    memberName: string
    policyName: string
    date: string
    transactionType: 'accrual' | 'usage' | 'adjustment' | 'scheduled' | 'cancellation'
    amount: number
    balanceAfter: number
    notes?: string
}

export const DUMMY_TIME_OFF_TRANSACTIONS: TimeOffTransaction[] = [
    {
        id: "tx-001",
        memberId: "m1",
        memberName: "Antonio Galih",
        policyName: "Annual Leave",
        date: "2026-01-01T00:00:00Z",
        transactionType: "accrual",
        amount: 8,
        balanceAfter: 8,
        notes: "Monthly accrual"
    },
    {
        id: "tx-002",
        memberId: "m1",
        memberName: "Antonio Galih",
        policyName: "Annual Leave",
        date: "2026-01-15T00:00:00Z",
        transactionType: "usage",
        amount: -3,
        balanceAfter: 5,
        notes: "Vacation taken"
    },
    {
        id: "tx-003",
        memberId: "m2",
        memberName: "Lave Lavael",
        policyName: "Sick Leave",
        date: "2026-01-10T00:00:00Z",
        transactionType: "adjustment",
        amount: 4,
        balanceAfter: 14,
        notes: "Manual correction"
    },
    {
        id: "tx-004",
        memberId: "m2",
        memberName: "Lave Lavael",
        policyName: "Sick Leave",
        date: "2026-01-20T00:00:00Z",
        transactionType: "usage",
        amount: -2,
        balanceAfter: 12,
        notes: "Sick leave approved"
    },
    {
        id: "tx-005",
        memberId: "m3",
        memberName: "Sarah Johnson",
        policyName: "Annual Leave",
        date: "2026-01-05T00:00:00Z",
        transactionType: "scheduled",
        amount: -5,
        balanceAfter: 10,
        notes: "Upcoming vacation"
    },
    {
        id: "tx-006",
        memberId: "m4",
        memberName: "Michael Chen",
        policyName: "Annual Leave",
        date: "2026-02-01T00:00:00Z",
        transactionType: "accrual",
        amount: 8,
        balanceAfter: 20,
        notes: "Monthly accrual"
    },
    {
        id: "tx-007",
        memberId: "m1",
        memberName: "Antonio Galih",
        policyName: "Annual Leave",
        date: "2026-02-01T00:00:00Z",
        transactionType: "accrual",
        amount: 8,
        balanceAfter: 13,
        notes: "Monthly accrual"
    }
]

export interface Organization {
    id: string
    name: string
    plan: 'free' | 'paid'
    owner: string
}

export const DUMMY_ORGANIZATIONS: Organization[] = [
    { id: "org-1", name: "Main Organization", plan: "paid", owner: "current-user" },
    { id: "org-2", name: "Space Designs", plan: "paid", owner: "current-user" },
    { id: "org-3", name: "Creative Studio", plan: "paid", owner: "current-user" },
    { id: "org-4", name: "Tech Solutions", plan: "free", owner: "current-user" },
]

// ============================================================================
// CLIENTS
// ============================================================================

export interface Client {
    id: string
    name: string
    budget: string
    autoInvoicing: boolean
    isArchived: boolean
    address?: string
    phone?: string
    emails?: string[]
    website?: string
    createdAt: string
}

// ===== PROJECT TASKS (DUMMY) =====
export type TaskStatus = "todo" | "in_progress" | "done"

export interface ProjectTask {
    id: string
    title: string
    projectId: string
    assigneeId: string
    status: TaskStatus
}

export const DUMMY_PROJECT_TASKS: ProjectTask[] = [
    { id: "t-1", title: "Setup repository", projectId: "1", assigneeId: "m1", status: "done" },
    { id: "t-2", title: "Create design system", projectId: "1", assigneeId: "m2", status: "in_progress" },
    { id: "t-3", title: "Landing page hero", projectId: "1", assigneeId: "m3", status: "todo" },
    { id: "t-4", title: "API contracts", projectId: "2", assigneeId: "m4", status: "in_progress" },
    { id: "t-5", title: "Auth flow", projectId: "2", assigneeId: "m5", status: "todo" },
    { id: "t-6", title: "Campaign brief", projectId: "3", assigneeId: "m1", status: "done" },
    { id: "t-7", title: "Asset preparation", projectId: "3", assigneeId: "m5", status: "in_progress" },
    { id: "t-8", title: "Legacy audit", projectId: "4", assigneeId: "m2", status: "in_progress" },
    { id: "t-9", title: "Data migration", projectId: "5", assigneeId: "m3", status: "todo" },
    { id: "t-10", title: "Performance profiling", projectId: "5", assigneeId: "m4", status: "done" },
    { id: "t-11", title: "Accessibility fixes", projectId: "5", assigneeId: "m3", status: "in_progress" },
]

export function getTasksByProjectMembers(projectId: string): ProjectTask[] {
    const memberIds = PROJECT_MEMBER_MAP[projectId] ?? []
    return DUMMY_PROJECT_TASKS.filter(
        (t) => t.projectId === projectId && memberIds.includes(t.assigneeId)
    )
}

export function getTaskCountByProjectMembers(projectId: string): number {
    return getTasksByProjectMembers(projectId).length
}

// Hitung jumlah tasks dari halaman Tasks (berdasarkan nama project)
export function getTaskCountFromTasksPageByProjectName(projectName: string): number {
    return DUMMY_TASKS.filter((t) => t.project === projectName).length
}

// Versi by projectId: map id -> nama project, lalu gunakan helper di atas
export function getTaskCountFromTasksPageByProjectId(projectId: string): number {
    const p = DUMMY_PROJECTS.find((x) => x.id === projectId)
    if (!p) return 0
    return getTaskCountFromTasksPageByProjectName(p.name)
}

// Members assigned per project (dummy)
export const PROJECT_MEMBER_MAP: Record<string, string[]> = {
    "1": ["m1", "m2", "m3"],
    "2": ["m4", "m5"],
    "3": ["m1", "m5"],
    "4": ["m2"],
    "5": ["m3", "m4"],
}

export function getProjectMemberIds(projectId: string): string[] {
    return PROJECT_MEMBER_MAP[projectId] ?? []
}

// Teams by project (derived from project members)
// Explicit mapping: project -> team IDs
export const PROJECT_TEAM_MAP: Record<string, string[]> = {
    "1": ["t1"], // Website Redesign -> Team Alpha
    "2": ["t3"], // Mobile App Development -> Team Gamma
    "3": ["t2"], // Marketing Campaign -> Team Beta
    // Tambahkan mapping lain jika diperlukan
}

export function getTeamsByProjectId(projectId: string): Team[] {
    const explicitTeamIds = PROJECT_TEAM_MAP[projectId]
    if (explicitTeamIds && explicitTeamIds.length > 0) {
        const idSet = new Set(explicitTeamIds)
        return DUMMY_TEAMS.filter((t) => idSet.has(t.id))
    }

    // Fallback: turunkan dari irisan member (legacy behavior)
    const memberIds = PROJECT_MEMBER_MAP[projectId] ?? []
    const result: Team[] = []
    const seen = new Set<string>()
    for (const t of DUMMY_TEAMS) {
        if (t.members.some((m) => memberIds.includes(m)) && !seen.has(t.id)) {
            seen.add(t.id)
            result.push(t)
        }
    }
    return result
}

export function getTeamNamesByProjectId(projectId: string): string[] {
    return getTeamsByProjectId(projectId).map((t) => t.name)
}

// ============================================================================
// CLIENT-PROJECT-TASK INTEGRATION HELPERS
// ============================================================================

// Get all projects linked to a specific client
export function getProjectsByClientId(clientId: string): Project[] {
    return DUMMY_PROJECTS.filter((p) => p.clientId === clientId)
}

// Get project count for a client
export function getProjectCountByClientId(clientId: string): number {
    return getProjectsByClientId(clientId).length
}

// Get all tasks for a client (via their projects)
export function getTasksByClientId(clientId: string): TaskItem[] {
    const clientProjects = getProjectsByClientId(clientId)
    const projectNames = clientProjects.map((p) => p.name)
    return DUMMY_TASKS.filter((t) => projectNames.includes(t.project))
}

// Get task count for a client
export function getTaskCountByClientId(clientId: string): number {
    return getTasksByClientId(clientId).length
}

// Get client by project ID
export function getClientByProjectId(projectId: string): Client | null {
    const project = DUMMY_PROJECTS.find((p) => p.id === projectId)
    if (!project || !project.clientId) return null
    return DUMMY_CLIENTS.find((c) => c.id === project.clientId) ?? null
}

// Get client name by project name (for Tasks page)
export function getClientNameByProjectName(projectName: string): string | null {
    const project = DUMMY_PROJECTS.find((p) => p.name === projectName)
    if (!project || !project.clientName) return null
    return project.clientName
}

export const DUMMY_CLIENTS: Client[] = [
    {
        id: "client-1",
        name: "Patricia",
        budget: "Budget: none",
        autoInvoicing: false,
        isArchived: false,
        address: "123 Main St, Jakarta",
        phone: "+62 812-3456-7890",
        emails: ["patricia@example.com"],
        website: "https://patricia.com",
        createdAt: "2025-01-05"
    },
    {
        id: "client-2",
        name: "Tech Corp",
        budget: "Budget: $50,000/month",
        autoInvoicing: true,
        isArchived: false,
        address: "456 Technology Blvd, Surabaya",
        phone: "+62 821-9876-5432",
        emails: ["contact@techcorp.com", "billing@techcorp.com"],
        website: "https://techcorp.co.id",
        createdAt: "2025-01-10"
    },
    {
        id: "client-3",
        name: "Creative Agency",
        budget: "Budget: $15,000/month",
        autoInvoicing: false,
        isArchived: false,
        address: "789 Design Ave, Bandung",
        phone: "+62 813-5555-6666",
        emails: ["hello@creativeagency.com"],
        website: "https://creativeagency.studio",
        createdAt: "2025-01-12"
    },
    {
        id: "client-4",
        name: "Startup Inc",
        budget: "Budget: $5,000/month",
        autoInvoicing: true,
        isArchived: false,
        address: "321 Innovation Street, Bali",
        phone: "+62 814-7777-8888",
        emails: ["team@startup.inc"],
        createdAt: "2025-01-18"
    },
    {
        id: "client-5",
        name: "Old Client Ltd",
        budget: "Budget: none",
        autoInvoicing: false,
        isArchived: true,
        address: "999 Legacy Road, Yogyakarta",
        phone: "+62 815-1111-2222",
        emails: ["info@oldclient.com"],
        createdAt: "2024-11-20"
    }
]

// ============================================================================
// PROJECTS
// ============================================================================

export interface Project {
    id: string
    name: string
    clientId: string | null
    clientName: string | null
    billable: boolean
    disableActivity: boolean
    allowTracking: boolean
    disableIdle: boolean
    archived: boolean
    color: string
    budgetLabel: string
    memberLimitLabel: string
    todosLabel: string
    createdAt: string
}

export const DUMMY_PROJECTS: Project[] = [
    {
        id: "1",
        name: "Website Redesign",
        clientId: "client-1",
        clientName: "Patricia",
        billable: true,
        disableActivity: false,
        allowTracking: true,
        disableIdle: false,
        archived: false,
        color: "#3B82F6",
        budgetLabel: "$10,000",
        memberLimitLabel: "5 members",
        todosLabel: "12 tasks",
        createdAt: "2025-01-10"
    },
    {
        id: "2",
        name: "Mobile App Development",
        clientId: "client-2",
        clientName: "Tech Corp",
        billable: true,
        disableActivity: false,
        allowTracking: true,
        disableIdle: false,
        archived: false,
        color: "#10B981",
        budgetLabel: "$25,000",
        memberLimitLabel: "8 members",
        todosLabel: "24 tasks",
        createdAt: "2025-01-05"
    },
    {
        id: "3",
        name: "Marketing Campaign",
        clientId: "client-1",
        clientName: "Patricia",
        billable: false,
        disableActivity: false,
        allowTracking: true,
        disableIdle: false,
        archived: false,
        color: "#F59E0B",
        budgetLabel: "No budget",
        memberLimitLabel: "3 members",
        todosLabel: "8 tasks",
        createdAt: "2025-01-15"
    },
    {
        id: "4",
        name: "Old Website",
        clientId: null,
        clientName: null,
        billable: true,
        disableActivity: false,
        allowTracking: true,
        disableIdle: false,
        archived: true,
        color: "#6B7280",
        budgetLabel: "$5,000",
        memberLimitLabel: "2 members",
        todosLabel: "0 tasks",
        createdAt: "2024-12-01"
    },
    {
        id: "5",
        name: "Legacy System",
        clientId: "client-3",
        clientName: "Old Client",
        billable: false,
        disableActivity: false,
        allowTracking: true,
        disableIdle: false,
        archived: true,
        color: "#6B7280",
        budgetLabel: "No budget",
        memberLimitLabel: "1 member",
        todosLabel: "0 tasks",
        createdAt: "2024-11-15"
    }
]

// ============================================================================
// GLOBAL TASKS
// ============================================================================

export const DUMMY_GLOBAL_TASKS = [
    { id: "global-1", title: "Monthly Report" },
    { id: "global-2", title: "Weekly Sync" },
    { id: "global-3", title: "Client Feedback" },
    { id: "global-4", title: "Security Audit" },
]

// ============================================================================
// TASKS
// ============================================================================

export interface TaskItem {
    id: string
    title: string
    assignee: string
    type: string
    created: string
    project: string
    status: "task" | "todo" | "in_progress"
    completed: boolean
}

export const DUMMY_TASKS: TaskItem[] = [
    {
        id: "task-1",
        title: "Design Homepage Concept",
        assignee: "Antonio Galih",
        type: "Task",
        created: "Mon, Jan 19, 2026 9:16 am",
        project: "Website Redesign",
        status: "task",
        completed: false
    },
    {
        id: "task-2",
        title: "User Research Summary",
        assignee: "Sarah Johnson",
        type: "Task",
        created: "Mon, Jan 19, 2026 10:30 am",
        project: "Marketing Campaign",
        status: "task",
        completed: true
    },
    {
        id: "task-3",
        title: "Prototype Mobile Flow",
        assignee: "Lave Lavael",
        type: "Task",
        created: "Mon, Jan 19, 2026 1:15 pm",
        project: "Mobile App Development",
        status: "in_progress",
        completed: false
    },
    {
        id: "task-4",
        title: "Setup Analytics",
        assignee: "Michael Chen",
        type: "Task",
        created: "Tue, Jan 20, 2026 9:05 am",
        project: "Mobile App Development",
        status: "task",
        completed: false
    },
    {
        id: "task-5",
        title: "Review Sprint Backlog",
        assignee: "Emma Rodriguez",
        type: "Task",
        created: "Tue, Jan 20, 2026 11:45 am",
        project: "Marketing Campaign",
        status: "todo",
        completed: true
    },
    {
        id: "task-6",
        title: "QA Regression Testing",
        assignee: "Antonio Galih",
        type: "Task",
        created: "Wed, Jan 21, 2026 8:30 am",
        project: "Website Redesign",
        status: "task",
        completed: false
    }
]

// ============================================================================
// INSIGHTS - MEMBERS & TEAMS
// ============================================================================

export interface Member {
    id: string
    name: string
    email: string
    avatar?: string
    activityScore: number
}

export interface Team {
    id: string
    name: string
    engagement: number
    memberCount: number
    members: string[] // member IDs
}

export const DUMMY_MEMBERS: Member[] = [
    {
        id: "m1",
        name: "Antonio Galih",
        email: "antonio@example.com",
        activityScore: 85,
        avatar: "https://i.pravatar.cc/150?u=m1"
    },
    {
        id: "m2",
        name: "Lave Lavael",
        email: "lave@example.com",
        activityScore: 92,
        avatar: "https://i.pravatar.cc/150?u=m2"
    },
    {
        id: "m3",
        name: "Sarah Johnson",
        email: "sarah@example.com",
        activityScore: 78,
        avatar: "https://i.pravatar.cc/150?u=m3"
    },
    {
        id: "m4",
        name: "Michael Chen",
        email: "michael@example.com",
        activityScore: 88,
        avatar: "https://i.pravatar.cc/150?u=m4"
    },
    {
        id: "m5",
        name: "Emma Rodriguez",
        email: "emma@example.com",
        activityScore: 95,
        avatar: "https://i.pravatar.cc/150?u=m5"
    },
    {
        id: "m6",
        name: "Budi",
        email: "budi.manager@example.com",
        activityScore: 90,
        avatar: "https://i.pravatar.cc/150?u=m6"
    },
    {
        id: "m7",
        name: "Siti",
        email: "siti.admin@example.com",
        activityScore: 98,
        avatar: "https://i.pravatar.cc/150?u=m7"
    }
]

export const DUMMY_TEAMS: Team[] = [
    {
        id: "t1",
        name: "Team Alpha",
        engagement: 87,
        memberCount: 3,
        members: ["m1", "m2", "m3"]
    },
    {
        id: "t2",
        name: "Team Beta",
        engagement: 92,
        memberCount: 2,
        members: ["m4", "m5"]
    },
    {
        id: "t3",
        name: "Team Gamma",
        engagement: 75,
        memberCount: 4,
        members: ["m1", "m3", "m4", "m5"]
    }
]

export const DUMMY_ROLES = [
    { id: 'admin', name: 'Administrator' },
    { id: 'manager', name: 'Manager' },
    { id: 'lead', name: 'Team Lead' },
    { id: 'hr', name: 'Human Resources' },
    { id: 'employee', name: 'Employee' },
];

export const DUMMY_JOB_TYPES = [
    { id: 'full-time', name: 'Full-time' },
    { id: 'part-time', name: 'Part-time' },
    { id: 'contractor', name: 'Contractor' },
    { id: 'intern', name: 'Intern' },
];

// ============================================================================
// UNUSUAL ACTIVITY
// ============================================================================

export interface UnusualActivityEntry {
    id: string
    memberId: string
    memberName: string
    timestamp: string
    date: string
    severity: 'highly_unusual' | 'unusual' | 'slightly_unusual'
    activityType: string
    description: string
    duration: number // in minutes
    details: {
        expectedRange?: string
        actualValue?: string
        deviation?: string
    }
}

export const DUMMY_UNUSUAL_ACTIVITIES: UnusualActivityEntry[] = [
    // Antonio Galih (m1) - Highly Unusual
    {
        id: 'ua1',
        memberId: 'm1',
        memberName: 'Antonio Galih',
        timestamp: '2026-01-19T22:30:00',
        date: '2026-01-19',
        severity: 'highly_unusual',
        activityType: 'Late Night Activity',
        description: 'Working significantly outside normal hours',
        duration: 180,
        details: {
            expectedRange: '9:00 AM - 6:00 PM',
            actualValue: '10:30 PM - 1:30 AM',
            deviation: '+470%'
        }
    },
    {
        id: 'ua2',
        memberId: 'm1',
        memberName: 'Antonio Galih',
        timestamp: '2026-01-18T23:00:00',
        date: '2026-01-18',
        severity: 'highly_unusual',
        activityType: 'Weekend Work',
        description: 'Unusual weekend activity detected',
        duration: 240,
        details: {
            expectedRange: 'No weekend work',
            actualValue: '11:00 PM - 3:00 AM',
            deviation: 'Weekend activity'
        }
    },
    // Lave Lavael (m2) - Unusual
    {
        id: 'ua3',
        memberId: 'm2',
        memberName: 'Lave Lavael',
        timestamp: '2026-01-19T20:00:00',
        date: '2026-01-19',
        severity: 'unusual',
        activityType: 'Excessive App Switching',
        description: 'Switching between apps more frequently than usual',
        duration: 120,
        details: {
            expectedRange: '10-15 switches/hour',
            actualValue: '45 switches/hour',
            deviation: '+200%'
        }
    },
    {
        id: 'ua4',
        memberId: 'm2',
        memberName: 'Lave Lavael',
        timestamp: '2026-01-17T19:30:00',
        date: '2026-01-17',
        severity: 'unusual',
        activityType: 'Long Idle Period',
        description: 'Extended period of inactivity during work hours',
        duration: 90,
        details: {
            expectedRange: '< 15 minutes',
            actualValue: '90 minutes',
            deviation: '+500%'
        }
    },
    // Sarah Johnson (m3) - Slightly Unusual
    {
        id: 'ua5',
        memberId: 'm3',
        memberName: 'Sarah Johnson',
        timestamp: '2026-01-19T18:30:00',
        date: '2026-01-19',
        severity: 'slightly_unusual',
        activityType: 'Extended Work Hours',
        description: 'Working slightly beyond normal hours',
        duration: 60,
        details: {
            expectedRange: '8 hours',
            actualValue: '9.5 hours',
            deviation: '+18%'
        }
    },
    {
        id: 'ua6',
        memberId: 'm3',
        memberName: 'Sarah Johnson',
        timestamp: '2026-01-16T17:00:00',
        date: '2026-01-16',
        severity: 'slightly_unusual',
        activityType: 'Unusual App Usage',
        description: 'Using applications not typically accessed',
        duration: 45,
        details: {
            expectedRange: 'Design tools',
            actualValue: 'Database management tools',
            deviation: 'Different tools'
        }
    },
    // Michael Chen (m4) - Unusual
    {
        id: 'ua7',
        memberId: 'm4',
        memberName: 'Michael Chen',
        timestamp: '2026-01-18T21:00:00',
        date: '2026-01-18',
        severity: 'unusual',
        activityType: 'After Hours Burst',
        description: 'Intense activity after normal work hours',
        duration: 150,
        details: {
            expectedRange: 'Inactive after 6 PM',
            actualValue: '9:00 PM - 11:30 PM',
            deviation: 'After hours activity'
        }
    },
    // Emma Rodriguez (m5) - Slightly Unusual
    {
        id: 'ua8',
        memberId: 'm5',
        memberName: 'Emma Rodriguez',
        timestamp: '2026-01-19T12:00:00',
        date: '2026-01-19',
        severity: 'slightly_unusual',
        activityType: 'Low Productivity Period',
        description: 'Lower than average productivity during peak hours',
        duration: 120,
        details: {
            expectedRange: '75-85% productive',
            actualValue: '55% productive',
            deviation: '-30%'
        }
    },
    {
        id: 'ua9',
        memberId: 'm5',
        memberName: 'Emma Rodriguez',
        timestamp: '2026-01-15T16:00:00',
        date: '2026-01-15',
        severity: 'slightly_unusual',
        activityType: 'Unusual Meeting Pattern',
        description: 'More meetings than usual',
        duration: 180,
        details: {
            expectedRange: '2-3 meetings/day',
            actualValue: '7 meetings/day',
            deviation: '+230%'
        }
    }
]

export function getUnusualActivitiesByMember(memberId: string) {
    return DUMMY_UNUSUAL_ACTIVITIES.filter(activity => activity.memberId === memberId)
}

export function getUnusualActivitiesByDateRange(startDate: Date, endDate: Date) {
    return DUMMY_UNUSUAL_ACTIVITIES.filter(activity => {
        const activityDate = new Date(activity.date)
        return activityDate >= startDate && activityDate <= endDate
    })
}

export function getUnusualActivitiesBySeverity(severity: 'highly_unusual' | 'unusual' | 'slightly_unusual') {
    return DUMMY_UNUSUAL_ACTIVITIES.filter(activity => activity.severity === severity)
}

export function getActivityStats(activities: UnusualActivityEntry[]) {
    const uniqueMembers = new Set(activities.map(a => a.memberId))
    const totalTime = activities.reduce((sum, a) => sum + a.duration, 0)

    return {
        memberCount: uniqueMembers.size,
        instanceCount: activities.length,
        totalTime: totalTime, // in minutes
        bySeverity: {
            highly_unusual: activities.filter(a => a.severity === 'highly_unusual').length,
            unusual: activities.filter(a => a.severity === 'unusual').length,
            slightly_unusual: activities.filter(a => a.severity === 'slightly_unusual').length,
        }
    }
}

// ============================================================================
// SMART NOTIFICATIONS
// ============================================================================

export interface SmartNotification {
    id: string
    memberId: string
    memberName: string
    type: "late_start" | "early_end" | "low_activity" | "unusual_pattern"
    message: string
    timestamp: string
    severity: "low" | "medium" | "high"
}

export interface BehaviorChange {
    memberId: string
    memberName: string
    changeType: "productivity_increase" | "productivity_decrease" | "schedule_shift" | "pattern_change"
    description: string
    previousValue: number
    currentValue: number
    changePercent: number
    detectedAt: string
}

export const DUMMY_SMART_NOTIFICATIONS: SmartNotification[] = [
    {
        id: "n1",
        memberId: "m2",
        memberName: "Lave Lavael",
        type: "late_start",
        message: "Started work 2 hours later than usual",
        timestamp: "2026-01-19T11:00:00Z",
        severity: "medium"
    },
    {
        id: "n2",
        memberId: "m4",
        memberName: "Michael Chen",
        type: "low_activity",
        message: "Activity level 40% below normal",
        timestamp: "2026-01-18T15:30:00Z",
        severity: "high"
    }
]

export const DUMMY_BEHAVIOR_CHANGES: BehaviorChange[] = [
    {
        memberId: "m5",
        memberName: "Emma Rodriguez",
        changeType: "productivity_increase",
        description: "Productivity increased significantly over the past week",
        previousValue: 75,
        currentValue: 95,
        changePercent: 26.7,
        detectedAt: "2026-01-19"
    },
    {
        memberId: "m3",
        memberName: "Sarah Johnson",
        changeType: "schedule_shift",
        description: "Working hours shifted 2 hours earlier than usual pattern",
        previousValue: 9, // usual start hour
        currentValue: 7, // new start hour
        changePercent: -22.2,
        detectedAt: "2026-01-18"
    }
]

export interface NotificationTemplate {
    id: string
    name: string
    description: string
    frequency: 'hourly' | 'daily' | 'weekly'
    delivery: ('email' | 'insights' | 'slack')[]
    iconName: keyof typeof LucideIcons
    color: string
    metric: string
    condition: string
    value: number
    unit: string
}

export interface Notification {
    id: string
    name: string
    enabled: boolean
    createdBy: string
    createdByAvatar: string
    target: string
    frequency: 'hourly' | 'daily' | 'weekly'
    notifyVia: string[]
    metric: string
    condition: string
    value: number
    unit: string
    monitoredAudience: {
        type: 'members' | 'teams' | 'jobTypes'
        all: boolean
        ids: string[]
    }
    recipients: {
        type: 'roles' | 'members'
        ids: string[]
    }
    deliveryChannels: {
        highlights: boolean
        email: boolean
        slack: boolean
    }
}

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
    {
        id: 'tmpl-1',
        name: 'Suspiciously high activity',
        description: 'Average hourly activity levels exceed 90%',
        frequency: 'hourly',
        delivery: ['email'],
        iconName: 'TrendingUp',
        color: 'bg-zinc-100',
        metric: 'Activity rate',
        condition: 'above',
        value: 90,
        unit: '%'
    },
    {
        id: 'tmpl-2',
        name: 'Members overworking',
        description: 'Average daily work time exceeds 9.5 hours per week',
        frequency: 'weekly',
        delivery: ['email'],
        iconName: 'Clock',
        color: 'bg-zinc-100',
        metric: 'Daily work time',
        condition: 'above',
        value: 9.5,
        unit: 'hr/day'
    },
    {
        id: 'tmpl-3',
        name: 'Members underworking',
        description: 'Average daily work time falls below 5 hours',
        frequency: 'weekly',
        delivery: ['email'],
        iconName: 'TrendingDown',
        color: 'bg-zinc-100',
        metric: 'Daily work time',
        condition: 'below',
        value: 5,
        unit: 'hr/day'
    },
    {
        id: 'tmpl-4',
        name: 'Members with low activity level',
        description: 'Average weekly activity levels under 35%',
        frequency: 'weekly',
        delivery: ['email'],
        iconName: 'BarChart3',
        color: 'bg-zinc-100',
        metric: 'Activity rate',
        condition: 'below',
        value: 35,
        unit: '%'
    },
    {
        id: 'tmpl-5',
        name: 'Members with low core work',
        description: 'Average weekly core work under 25%',
        frequency: 'weekly',
        delivery: ['email'],
        iconName: 'Briefcase',
        color: 'bg-zinc-100',
        metric: 'Core work percentage',
        condition: 'below',
        value: 25,
        unit: '%'
    },
    {
        id: 'tmpl-6',
        name: 'Members with unproductive work time',
        description: 'Average daily unproductive work time exceeds 10% of all work time',
        frequency: 'daily',
        delivery: ['email'],
        iconName: 'AlertTriangle',
        color: 'bg-zinc-100',
        metric: 'Unproductive time',
        condition: 'above',
        value: 10,
        unit: '%'
    },
    {
        id: 'tmpl-7',
        name: 'Members using social media websites',
        description: 'Members spend over 30 minutes per day on social media websites',
        frequency: 'daily',
        delivery: ['email'],
        iconName: 'Share2',
        color: 'bg-zinc-100',
        metric: 'Social media time',
        condition: 'above',
        value: 30,
        unit: 'min/day'
    },
    {
        id: 'tmpl-8',
        name: 'Members not using required applications',
        description: 'Members spend under 30 mins per week on applications they are required to use',
        frequency: 'weekly',
        delivery: ['email'],
        iconName: 'Package',
        color: 'bg-zinc-100',
        metric: 'Required apps time',
        condition: 'below',
        value: 30,
        unit: 'min/week'
    },
    {
        id: 'tmpl-9',
        name: 'Members using AI websites',
        description: 'Members spend over 20 minutes per day on GPT chatbot websites',
        frequency: 'daily',
        delivery: ['email'],
        iconName: 'Bot',
        color: 'bg-zinc-100',
        metric: 'AI tools time',
        condition: 'above',
        value: 20,
        unit: 'min/day'
    },
    {
        id: 'tmpl-10',
        name: 'Members using entertainment websites',
        description: 'Members spend over 20 minutes per day on entertainment websites',
        frequency: 'daily',
        delivery: ['email'],
        iconName: 'Film',
        color: 'bg-zinc-100',
        metric: 'Entertainment time',
        condition: 'above',
        value: 20,
        unit: 'min/day'
    },
    {
        id: 'tmpl-11',
        name: 'Members with high idle time',
        description: 'Average weekly idle time above 15%',
        frequency: 'weekly',
        delivery: ['email'],
        iconName: 'Pause',
        color: 'bg-gray-50',
        metric: 'Idle time percentage',
        condition: 'above',
        value: 15,
        unit: '%'
    },
    {
        id: 'tmpl-12',
        name: 'Members with high manual time',
        description: 'Average weekly manual time above 15%',
        frequency: 'weekly',
        delivery: ['email'],
        iconName: 'Hand',
        color: 'bg-zinc-100',
        metric: 'Manual time percentage',
        condition: 'above',
        value: 15,
        unit: '%'
    }
]

export const DUMMY_NOTIFICATIONS: Notification[] = [
    {
        id: 'notif-1',
        name: 'Suspiciously High Activity',
        enabled: true,
        createdBy: 'Admin',
        createdByAvatar: '👤',
        target: 'All Members',
        frequency: 'hourly',
        notifyVia: ['Email', 'Insights'],
        metric: 'Activity rate',
        condition: 'above',
        value: 95,
        unit: '%',
        monitoredAudience: {
            type: 'members',
            all: true,
            ids: []
        },
        recipients: {
            type: 'roles',
            ids: ['owners', 'managers', 'team-leads']
        },
        deliveryChannels: {
            highlights: true,
            email: true,
            slack: false
        }
    },
    {
        id: 'notif-2',
        name: 'Members With Low Activity Level',
        enabled: true,
        createdBy: 'Admin',
        createdByAvatar: '👤',
        target: 'All Members',
        frequency: 'daily',
        notifyVia: ['Email', 'Insights'],
        metric: 'Activity rate',
        condition: 'below',
        value: 35,
        unit: '%',
        monitoredAudience: {
            type: 'members',
            all: true,
            ids: []
        },
        recipients: {
            type: 'roles',
            ids: ['owners']
        },
        deliveryChannels: {
            highlights: true,
            email: true,
            slack: false
        }
    },
    {
        id: 'notif-3',
        name: 'Time On Social Media Or AI Sites',
        enabled: true,
        createdBy: 'Admin',
        createdByAvatar: '👤',
        target: 'All Members',
        frequency: 'daily',
        notifyVia: ['Email', 'Insights'],
        metric: 'Social media + AI time',
        condition: 'above',
        value: 30,
        unit: 'min/day',
        monitoredAudience: {
            type: 'members',
            all: true,
            ids: []
        },
        recipients: {
            type: 'roles',
            ids: ['managers']
        },
        deliveryChannels: {
            highlights: true,
            email: true,
            slack: false
        }
    },
    {
        id: 'notif-4',
        name: 'Suspicious Applications',
        enabled: true,
        createdBy: 'Admin',
        createdByAvatar: '👤',
        target: 'All Members',
        frequency: 'hourly',
        notifyVia: ['Email', 'Insights'],
        metric: 'Suspicious app usage',
        condition: 'above',
        value: 0,
        unit: 'instances',
        monitoredAudience: {
            type: 'members',
            all: true,
            ids: []
        },
        recipients: {
            type: 'roles',
            ids: ['owners', 'managers']
        },
        deliveryChannels: {
            highlights: true,
            email: true,
            slack: false
        }
    },
    {
        id: 'notif-5',
        name: 'Late Start Detection',
        enabled: false,
        createdBy: 'Fauzan',
        createdByAvatar: '👨‍💻',
        target: 'Development Team',
        frequency: 'daily',
        notifyVia: ['Slack'],
        metric: 'Daily start time',
        condition: 'above',
        value: 9.5,
        unit: 'hr',
        monitoredAudience: {
            type: 'teams',
            all: false,
            ids: ['team-dev']
        },
        recipients: {
            type: 'members',
            ids: ['member-1']
        },
        deliveryChannels: {
            highlights: false,
            email: false,
            slack: true
        }
    },
    {
        id: 'notif-6',
        name: 'Idle Time Alert',
        enabled: true,
        createdBy: 'System',
        createdByAvatar: '🤖',
        target: 'All Members',
        frequency: 'weekly',
        notifyVia: ['Email'],
        metric: 'Idle time percentage',
        condition: 'above',
        value: 20,
        unit: '%',
        monitoredAudience: {
            type: 'members',
            all: true,
            ids: []
        },
        recipients: {
            type: 'roles',
            ids: ['managers']
        },
        deliveryChannels: {
            highlights: true,
            email: true,
            slack: false
        }
    }
]

export function getTemplateById(id: string) {
    return NOTIFICATION_TEMPLATES.find(t => t.id === id)
}

export function getNotificationById(id: string) {
    return DUMMY_NOTIFICATIONS.find(n => n.id === id)
}

export function getRecommendedTemplates(count: number = 3) {
    return NOTIFICATION_TEMPLATES.slice(0, count)
}

export function toggleNotification(id: string) {
    const notification = DUMMY_NOTIFICATIONS.find(n => n.id === id)
    if (notification) {
        notification.enabled = !notification.enabled
    }
    return notification
}

export function deleteNotification(id: string) {
    const index = DUMMY_NOTIFICATIONS.findIndex(n => n.id === id)
    if (index !== -1) {
        DUMMY_NOTIFICATIONS.splice(index, 1)
        return true
    }
    return false
}

// ============================================================================
// PERFORMANCE DATA
// ============================================================================

export interface UtilizationData {
    dailyWorkHours: number
    targetHours: number
    avgDailyTarget: number
    memberId?: string
    teamId?: string
    date: string
}

export interface WorkTimeClassification {
    category: string
    percentage: number
    color: string
    memberId?: string
    teamId?: string
    date?: string
}

export interface DailyFocusData {
    date: string
    focusHours: number
    distractionHours: number
    memberId?: string
    teamId?: string
}

export interface ActivityData {
    hour: string
    activeMinutes: number
    idleMinutes: number
    date: string
    memberId?: string
    teamId?: string
}

export interface MeetingData {
    title: string
    duration: number
    participants: number
    date: string
    memberId?: string
    teamId?: string
}

export interface TopApp {
    name: string
    timeSpent: number
    category: string
    memberId?: string
    teamId?: string
    date: string
}

export interface LeaderboardEntry {
    name: string
    hours: number
    rank: number
    avatar: string
    memberId: string
}

export interface CategoryData {
    name: string
    percentage: number
    hours: number
    color: string
    memberId?: string
    teamId?: string
    date: string
}

export const DUMMY_UTILIZATION_DATA: UtilizationData[] = [
    { dailyWorkHours: 8.0, targetHours: 8.0, avgDailyTarget: 8.0, memberId: 'm2', date: '2026-01-19' },
    { dailyWorkHours: 7.5, targetHours: 8.0, avgDailyTarget: 8.0, memberId: 'm1', date: '2026-01-19' },
    { dailyWorkHours: 8.2, targetHours: 8.0, avgDailyTarget: 8.0, memberId: 'm3', date: '2026-01-19' },
    { dailyWorkHours: 7.8, targetHours: 8.0, avgDailyTarget: 8.0, memberId: 'm4', date: '2026-01-19' },
    { dailyWorkHours: 7.3, targetHours: 8.0, avgDailyTarget: 8.0, memberId: 'm5', date: '2026-01-19' },
    { dailyWorkHours: 8.5, targetHours: 8.0, avgDailyTarget: 8.0, teamId: 't1', date: '2026-01-19' },
    { dailyWorkHours: 7.9, targetHours: 8.0, avgDailyTarget: 8.0, teamId: 't2', date: '2026-01-19' },
    { dailyWorkHours: 8.1, targetHours: 8.0, avgDailyTarget: 8.0, teamId: 't3', date: '2026-01-19' }
]

export const DUMMY_WORK_TIME_CLASSIFICATION: WorkTimeClassification[] = [
    { category: 'Productive', percentage: 65, color: '#10b981', memberId: 'm2', date: '2026-01-19' },
    { category: 'Neutral', percentage: 25, color: '#f59e0b', memberId: 'm2', date: '2026-01-19' },
    { category: 'Unproductive', percentage: 10, color: '#ef4444', memberId: 'm2', date: '2026-01-19' },
    { category: 'Productive', percentage: 70, color: '#10b981', memberId: 'm1', date: '2026-01-19' },
    { category: 'Neutral', percentage: 20, color: '#f59e0b', memberId: 'm1', date: '2026-01-19' },
    { category: 'Unproductive', percentage: 10, color: '#ef4444', memberId: 'm1', date: '2026-01-19' },
    { category: 'Productive', percentage: 75, color: '#10b981', memberId: 'm3', date: '2026-01-19' },
    { category: 'Neutral', percentage: 18, color: '#f59e0b', memberId: 'm3', date: '2026-01-19' },
    { category: 'Unproductive', percentage: 7, color: '#ef4444', memberId: 'm3', date: '2026-01-19' },
    { category: 'Productive', percentage: 68, color: '#10b981', memberId: 'm4', date: '2026-01-19' },
    { category: 'Neutral', percentage: 22, color: '#f59e0b', memberId: 'm4', date: '2026-01-19' },
    { category: 'Unproductive', percentage: 10, color: '#ef4444', memberId: 'm4', date: '2026-01-19' },
    { category: 'Productive', percentage: 62, color: '#10b981', memberId: 'm5', date: '2026-01-19' },
    { category: 'Neutral', percentage: 28, color: '#f59e0b', memberId: 'm5', date: '2026-01-19' },
    { category: 'Unproductive', percentage: 10, color: '#ef4444', memberId: 'm5', date: '2026-01-19' }
]

export const DUMMY_DAILY_FOCUS: DailyFocusData[] = [
    { date: '2026-01-13', focusHours: 6.5, distractionHours: 1.5, memberId: 'm2' },
    { date: '2026-01-14', focusHours: 5.8, distractionHours: 2.2, memberId: 'm2' },
    { date: '2026-01-15', focusHours: 7.2, distractionHours: 0.8, memberId: 'm2' },
    { date: '2026-01-16', focusHours: 6.0, distractionHours: 2.0, memberId: 'm2' },
    { date: '2026-01-17', focusHours: 6.8, distractionHours: 1.2, memberId: 'm2' },
    { date: '2026-01-18', focusHours: 5.5, distractionHours: 2.5, memberId: 'm2' },
    { date: '2026-01-19', focusHours: 7.5, distractionHours: 0.5, memberId: 'm2' },
    { date: '2026-01-13', focusHours: 5.5, distractionHours: 2.5, memberId: 'm1' },
    { date: '2026-01-14', focusHours: 6.8, distractionHours: 1.2, memberId: 'm1' },
    { date: '2026-01-15', focusHours: 6.2, distractionHours: 1.8, memberId: 'm1' },
    { date: '2026-01-16', focusHours: 7.0, distractionHours: 1.0, memberId: 'm1' },
    { date: '2026-01-17', focusHours: 5.8, distractionHours: 2.2, memberId: 'm1' },
    { date: '2026-01-18', focusHours: 6.5, distractionHours: 1.5, memberId: 'm1' },
    { date: '2026-01-19', focusHours: 7.2, distractionHours: 0.8, memberId: 'm1' },
    { date: '2026-01-13', focusHours: 7.0, distractionHours: 1.0, memberId: 'm3' },
    { date: '2026-01-14', focusHours: 6.5, distractionHours: 1.5, memberId: 'm3' },
    { date: '2026-01-15', focusHours: 7.5, distractionHours: 0.5, memberId: 'm3' },
    { date: '2026-01-16', focusHours: 6.8, distractionHours: 1.2, memberId: 'm3' },
    { date: '2026-01-17', focusHours: 7.2, distractionHours: 0.8, memberId: 'm3' },
    { date: '2026-01-18', focusHours: 6.3, distractionHours: 1.7, memberId: 'm3' },
    { date: '2026-01-19', focusHours: 7.8, distractionHours: 0.2, memberId: 'm3' },
    { date: '2026-01-13', focusHours: 6.2, distractionHours: 1.8, memberId: 'm4' },
    { date: '2026-01-14', focusHours: 6.0, distractionHours: 2.0, memberId: 'm4' },
    { date: '2026-01-15', focusHours: 6.8, distractionHours: 1.2, memberId: 'm4' },
    { date: '2026-01-16', focusHours: 6.5, distractionHours: 1.5, memberId: 'm4' },
    { date: '2026-01-17', focusHours: 7.0, distractionHours: 1.0, memberId: 'm4' },
    { date: '2026-01-18', focusHours: 6.2, distractionHours: 1.8, memberId: 'm4' },
    { date: '2026-01-19', focusHours: 7.3, distractionHours: 0.7, memberId: 'm4' },
    { date: '2026-01-13', focusHours: 5.8, distractionHours: 2.2, memberId: 'm5' },
    { date: '2026-01-14', focusHours: 6.2, distractionHours: 1.8, memberId: 'm5' },
    { date: '2026-01-15', focusHours: 6.5, distractionHours: 1.5, memberId: 'm5' },
    { date: '2026-01-16', focusHours: 6.0, distractionHours: 2.0, memberId: 'm5' },
    { date: '2026-01-17', focusHours: 6.8, distractionHours: 1.2, memberId: 'm5' },
    { date: '2026-01-18', focusHours: 5.5, distractionHours: 2.5, memberId: 'm5' },
    { date: '2026-01-19', focusHours: 7.0, distractionHours: 1.0, memberId: 'm5' }
]

export const DUMMY_ACTIVITY: ActivityData[] = [
    { hour: '08:00', activeMinutes: 45, idleMinutes: 15, date: '2026-01-19', memberId: 'm2' },
    { hour: '09:00', activeMinutes: 50, idleMinutes: 10, date: '2026-01-19', memberId: 'm2' },
    { hour: '10:00', activeMinutes: 40, idleMinutes: 20, date: '2026-01-19', memberId: 'm2' },
    { hour: '11:00', activeMinutes: 55, idleMinutes: 5, date: '2026-01-19', memberId: 'm2' },
    { hour: '12:00', activeMinutes: 15, idleMinutes: 45, date: '2026-01-19', memberId: 'm2' },
    { hour: '13:00', activeMinutes: 48, idleMinutes: 12, date: '2026-01-19', memberId: 'm2' },
    { hour: '14:00', activeMinutes: 52, idleMinutes: 8, date: '2026-01-19', memberId: 'm2' },
    { hour: '15:00', activeMinutes: 47, idleMinutes: 13, date: '2026-01-19', memberId: 'm2' },
    { hour: '16:00', activeMinutes: 43, idleMinutes: 17, date: '2026-01-19', memberId: 'm2' },
    { hour: '17:00', activeMinutes: 30, idleMinutes: 30, date: '2026-01-19', memberId: 'm2' },
    { hour: '08:00', activeMinutes: 50, idleMinutes: 10, date: '2026-01-19', memberId: 'm1' },
    { hour: '09:00', activeMinutes: 55, idleMinutes: 5, date: '2026-01-19', memberId: 'm1' },
    { hour: '10:00', activeMinutes: 48, idleMinutes: 12, date: '2026-01-19', memberId: 'm1' },
    { hour: '11:00', activeMinutes: 52, idleMinutes: 8, date: '2026-01-19', memberId: 'm1' },
    { hour: '12:00', activeMinutes: 20, idleMinutes: 40, date: '2026-01-19', memberId: 'm1' },
    { hour: '13:00', activeMinutes: 50, idleMinutes: 10, date: '2026-01-19', memberId: 'm1' },
    { hour: '14:00', activeMinutes: 48, idleMinutes: 12, date: '2026-01-19', memberId: 'm1' },
    { hour: '15:00', activeMinutes: 45, idleMinutes: 15, date: '2026-01-19', memberId: 'm1' },
    { hour: '16:00', activeMinutes: 42, idleMinutes: 18, date: '2026-01-19', memberId: 'm1' },
    { hour: '17:00', activeMinutes: 35, idleMinutes: 25, date: '2026-01-19', memberId: 'm1' },
    { hour: '08:00', activeMinutes: 52, idleMinutes: 8, date: '2026-01-19', memberId: 'm3' },
    { hour: '09:00', activeMinutes: 56, idleMinutes: 4, date: '2026-01-19', memberId: 'm3' },
    { hour: '10:00', activeMinutes: 50, idleMinutes: 10, date: '2026-01-19', memberId: 'm3' },
    { hour: '11:00', activeMinutes: 54, idleMinutes: 6, date: '2026-01-19', memberId: 'm3' },
    { hour: '12:00', activeMinutes: 18, idleMinutes: 42, date: '2026-01-19', memberId: 'm3' },
    { hour: '13:00', activeMinutes: 52, idleMinutes: 8, date: '2026-01-19', memberId: 'm3' },
    { hour: '14:00', activeMinutes: 55, idleMinutes: 5, date: '2026-01-19', memberId: 'm3' },
    { hour: '15:00', activeMinutes: 50, idleMinutes: 10, date: '2026-01-19', memberId: 'm3' },
    { hour: '16:00', activeMinutes: 48, idleMinutes: 12, date: '2026-01-19', memberId: 'm3' },
    { hour: '17:00', activeMinutes: 40, idleMinutes: 20, date: '2026-01-19', memberId: 'm3' }
]

export const DUMMY_MEETINGS: MeetingData[] = [
    { title: 'Daily Standup', duration: 15, participants: 8, date: '2026-01-19', memberId: 'm2' },
    { title: 'Sprint Planning', duration: 120, participants: 10, date: '2026-01-19', memberId: 'm2' },
    { title: 'Client Review', duration: 60, participants: 5, date: '2026-01-19', memberId: 'm2' },
    { title: 'Team Sync', duration: 30, participants: 6, date: '2026-01-18', memberId: 'm2' }
]

export const DUMMY_TOP_APPS: TopApp[] = [
    { name: 'VS Code', timeSpent: 180, category: 'Development', memberId: 'm2', date: '2026-01-19' },
    { name: 'Chrome', timeSpent: 120, category: 'Browser', memberId: 'm2', date: '2026-01-19' },
    { name: 'Slack', timeSpent: 60, category: 'Communication', memberId: 'm2', date: '2026-01-19' },
    { name: 'Figma', timeSpent: 90, category: 'Design', memberId: 'm2', date: '2026-01-19' },
    { name: 'Terminal', timeSpent: 45, category: 'Development', memberId: 'm2', date: '2026-01-19' },
    { name: 'IntelliJ IDEA', timeSpent: 200, category: 'Development', memberId: 'm1', date: '2026-01-19' },
    { name: 'Chrome', timeSpent: 90, category: 'Browser', memberId: 'm1', date: '2026-01-19' },
    { name: 'Slack', timeSpent: 45, category: 'Communication', memberId: 'm1', date: '2026-01-19' },
    { name: 'Postman', timeSpent: 60, category: 'Development', memberId: 'm1', date: '2026-01-19' },
    { name: 'Docker', timeSpent: 50, category: 'Development', memberId: 'm1', date: '2026-01-19' },
    { name: 'Figma', timeSpent: 220, category: 'Design', memberId: 'm3', date: '2026-01-19' },
    { name: 'Chrome', timeSpent: 100, category: 'Browser', memberId: 'm3', date: '2026-01-19' },
    { name: 'Slack', timeSpent: 50, category: 'Communication', memberId: 'm3', date: '2026-01-19' },
    { name: 'Photoshop', timeSpent: 80, category: 'Design', memberId: 'm3', date: '2026-01-19' },
    { name: 'Notion', timeSpent: 40, category: 'Productivity', memberId: 'm3', date: '2026-01-19' },
    { name: 'VS Code', timeSpent: 190, category: 'Development', memberId: 'm4', date: '2026-01-19' },
    { name: 'Chrome', timeSpent: 110, category: 'Browser', memberId: 'm4', date: '2026-01-19' },
    { name: 'Terminal', timeSpent: 70, category: 'Development', memberId: 'm4', date: '2026-01-19' },
    { name: 'Slack', timeSpent: 55, category: 'Communication', memberId: 'm4', date: '2026-01-19' },
    { name: 'GitHub Desktop', timeSpent: 35, category: 'Development', memberId: 'm4', date: '2026-01-19' },
    { name: 'Excel', timeSpent: 150, category: 'Productivity', memberId: 'm5', date: '2026-01-19' },
    { name: 'Chrome', timeSpent: 95, category: 'Browser', memberId: 'm5', date: '2026-01-19' },
    { name: 'Slack', timeSpent: 65, category: 'Communication', memberId: 'm5', date: '2026-01-19' },
    { name: 'PowerPoint', timeSpent: 75, category: 'Productivity', memberId: 'm5', date: '2026-01-19' },
    { name: 'Teams', timeSpent: 50, category: 'Communication', memberId: 'm5', date: '2026-01-19' }
]

export const DUMMY_LEADERBOARD: LeaderboardEntry[] = [
    { name: 'Sarah Johnson', hours: 42.5, rank: 1, avatar: 'SJ', memberId: 'm3' },
    { name: 'Michael Chen', hours: 41.2, rank: 2, avatar: 'MC', memberId: 'm4' },
    { name: 'Lave Lavael', hours: 40.8, rank: 3, avatar: 'LL', memberId: 'm2' },
    { name: 'Antonio Galih', hours: 39.5, rank: 4, avatar: 'AG', memberId: 'm1' },
    { name: 'Emma Rodriguez', hours: 38.9, rank: 5, avatar: 'ER', memberId: 'm5' }
]

export const DUMMY_CATEGORIES: CategoryData[] = [
    { name: 'Development', percentage: 45, hours: 18.0, color: '#3b82f6', memberId: 'm2', date: '2026-01-19' },
    { name: 'Communication', percentage: 20, hours: 8.0, color: '#10b981', memberId: 'm2', date: '2026-01-19' },
    { name: 'Design', percentage: 15, hours: 6.0, color: '#8b5cf6', memberId: 'm2', date: '2026-01-19' },
    { name: 'Documentation', percentage: 12, hours: 4.8, color: '#f59e0b', memberId: 'm2', date: '2026-01-19' },
    { name: 'Meetings', percentage: 8, hours: 3.2, color: '#ef4444', memberId: 'm2', date: '2026-01-19' },
    { name: 'Development', percentage: 50, hours: 20.0, color: '#3b82f6', memberId: 'm1', date: '2026-01-19' },
    { name: 'Communication', percentage: 15, hours: 6.0, color: '#10b981', memberId: 'm1', date: '2026-01-19' },
    { name: 'Testing', percentage: 20, hours: 8.0, color: '#8b5cf6', memberId: 'm1', date: '2026-01-19' },
    { name: 'Documentation', percentage: 10, hours: 4.0, color: '#f59e0b', memberId: 'm1', date: '2026-01-19' },
    { name: 'Meetings', percentage: 5, hours: 2.0, color: '#ef4444', memberId: 'm1', date: '2026-01-19' },
    { name: 'Design', percentage: 55, hours: 22.0, color: '#8b5cf6', memberId: 'm3', date: '2026-01-19' },
    { name: 'Communication', percentage: 18, hours: 7.2, color: '#10b981', memberId: 'm3', date: '2026-01-19' },
    { name: 'Research', percentage: 15, hours: 6.0, color: '#3b82f6', memberId: 'm3', date: '2026-01-19' },
    { name: 'Meetings', percentage: 7, hours: 2.8, color: '#ef4444', memberId: 'm3', date: '2026-01-19' },
    { name: 'Documentation', percentage: 5, hours: 2.0, color: '#f59e0b', memberId: 'm3', date: '2026-01-19' },
    { name: 'Development', percentage: 48, hours: 19.2, color: '#3b82f6', memberId: 'm4', date: '2026-01-19' },
    { name: 'Code Review', percentage: 22, hours: 8.8, color: '#8b5cf6', memberId: 'm4', date: '2026-01-19' },
    { name: 'Communication', percentage: 16, hours: 6.4, color: '#10b981', memberId: 'm4', date: '2026-01-19' },
    { name: 'Meetings', percentage: 9, hours: 3.6, color: '#ef4444', memberId: 'm4', date: '2026-01-19' },
    { name: 'Documentation', percentage: 5, hours: 2.0, color: '#f59e0b', memberId: 'm4', date: '2026-01-19' },
    { name: 'Analysis', percentage: 40, hours: 16.0, color: '#3b82f6', memberId: 'm5', date: '2026-01-19' },
    { name: 'Meetings', percentage: 25, hours: 10.0, color: '#ef4444', memberId: 'm5', date: '2026-01-19' },
    { name: 'Communication', percentage: 20, hours: 8.0, color: '#10b981', memberId: 'm5', date: '2026-01-19' },
    { name: 'Reporting', percentage: 10, hours: 4.0, color: '#f59e0b', memberId: 'm5', date: '2026-01-19' },
    { name: 'Research', percentage: 5, hours: 2.0, color: '#8b5cf6', memberId: 'm5', date: '2026-01-19' }
]

export function getMemberIdFromName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-')
}

// ============================================================================
// SCREENSHOTS
// ============================================================================

export interface Screenshot {
    id: string
    memberId: string
    timestamp: string
    date: string
    timeRange: string
    projectName: string
    todosLabel: string
    imageUrl: string
    screenCount: number
    activityProgress: number
    minutes: number
    seconds?: boolean
    noActivity?: boolean
}

export const DUMMY_SCREENSHOTS: Screenshot[] = [
    // Antonio Galih (m1) - Morning Sessions
    { id: 'ss1', memberId: 'm1', timestamp: '2026-01-21T09:00:00', date: '2026-01-21', timeRange: '9:00 AM - 9:10 AM', projectName: 'Mobile App Development', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2025-12-08 094631.png', screenCount: 1, activityProgress: 75, minutes: 10 },
    { id: 'ss2', memberId: 'm1', timestamp: '2026-01-21T09:10:00', date: '2026-01-21', timeRange: '9:10 AM - 9:20 AM', projectName: 'Mobile App Development', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-04 222401.png', screenCount: 1, activityProgress: 82, minutes: 10 },
    { id: 'ss3', memberId: 'm1', timestamp: '2026-01-21T09:20:00', date: '2026-01-21', timeRange: '9:20 AM - 9:30 AM', projectName: 'Mobile App Development', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-09 101315.png', screenCount: 1, activityProgress: 68, minutes: 10 },

    // Lave Lavael (m2) - Afternoon Sessions
    { id: 'ss4', memberId: 'm2', timestamp: '2026-01-21T14:00:00', date: '2026-01-21', timeRange: '2:00 PM - 2:10 PM', projectName: 'Website Redesign', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-12 222910.png', screenCount: 1, activityProgress: 91, minutes: 10 },
    { id: 'ss5', memberId: 'm2', timestamp: '2026-01-21T14:10:00', date: '2026-01-21', timeRange: '2:10 PM - 2:20 PM', projectName: 'Website Redesign', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-20 161303.png', screenCount: 1, activityProgress: 88, minutes: 10 },
    { id: 'ss6', memberId: 'm2', timestamp: '2026-01-21T14:20:00', date: '2026-01-21', timeRange: '2:20 PM - 2:30 PM', projectName: 'Website Redesign', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-20 161319.png', screenCount: 1, activityProgress: 95, minutes: 10 },

    // Sarah Johnson (m3) - Mixed Activity
    { id: 'ss7', memberId: 'm3', timestamp: '2026-01-21T10:00:00', date: '2026-01-21', timeRange: '10:00 AM - 10:10 AM', projectName: 'Marketing Campaign', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2025-12-08 094631.png', screenCount: 1, activityProgress: 45, minutes: 10 },
    { id: 'ss8', memberId: 'm3', timestamp: '2026-01-21T10:10:00', date: '2026-01-21', timeRange: '10:10 AM - 10:20 AM', projectName: 'Marketing Campaign', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-04 222401.png', screenCount: 1, activityProgress: 52, minutes: 10 },
    { id: 'ss9', memberId: 'm3', timestamp: '2026-01-21T10:20:00', date: '2026-01-21', timeRange: '10:20 AM - 10:30 AM', projectName: 'Marketing Campaign', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-09 101315.png', screenCount: 1, activityProgress: 38, minutes: 10 },

    // Michael Chen (m4) - Evening Work
    { id: 'ss11', memberId: 'm4', timestamp: '2026-01-21T16:00:00', date: '2026-01-21', timeRange: '4:00 PM - 4:10 PM', projectName: 'Mobile App Development', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-12 222910.png', screenCount: 1, activityProgress: 71, minutes: 10 },
    { id: 'ss12', memberId: 'm4', timestamp: '2026-01-21T16:10:00', date: '2026-01-21', timeRange: '4:10 PM - 4:20 PM', projectName: 'Mobile App Development', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-20 161303.png', screenCount: 1, activityProgress: 66, minutes: 10 },

    // Emma Rodriguez (m5) - Standard Day
    { id: 'ss13', memberId: 'm5', timestamp: '2026-01-21T11:00:00', date: '2026-01-21', timeRange: '11:00 AM - 11:10 AM', projectName: 'Website Redesign', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-09 101315.png', screenCount: 1, activityProgress: 79, minutes: 10 },
    { id: 'ss14', memberId: 'm5', timestamp: '2026-01-21T11:10:00', date: '2026-01-21', timeRange: '11:10 AM - 11:20 AM', projectName: 'Website Redesign', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-04 222401.png', screenCount: 1, activityProgress: 84, minutes: 10 },
    { id: 'ss15', memberId: 'm5', timestamp: '2026-01-21T11:20:00', date: '2026-01-21', timeRange: '11:20 AM - 11:30 AM', projectName: 'Website Redesign', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-12 222910.png', screenCount: 1, activityProgress: 72, minutes: 10 },
]

export interface MemberScreenshotItem {
    id: string
    time: string
    progress: number
    minutes: number
    image: string
    noActivity?: boolean
    seconds?: boolean
    screenCount?: number
}

export interface MemberInsightSummary {
    memberId: string
    totalWorkedTime: string
    focusTime: string
    focusDescription: string
    avgActivity: string
    unusualCount: number
    unusualMessage: string
    classificationLabel: string
    classificationSummary: string
    classificationPercent: number
}

export const DUMMY_MEMBER_SCREENSHOTS: Record<string, MemberScreenshotItem[]> = {
    m1: [
        { id: "m1-1", time: "9:00 am - 9:10 am", progress: 68, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-08 094631.png", screenCount: 1 },
        { id: "m1-2", time: "9:10 am - 9:20 am", progress: 72, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-11 204654.png", screenCount: 1 },
        { id: "m1-3", time: "9:20 am - 9:30 am", progress: 65, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-04 220750.png", screenCount: 1 },
        { id: "m1-4", time: "9:30 am - 9:40 am", progress: 58, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-25 191532.png", screenCount: 1 },
        { id: "m1-5", time: "9:40 am - 9:50 am", progress: 62, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-04 204028.png", screenCount: 1 },
        { id: "m1-6", time: "9:50 am - 10:00 am", progress: 77, minutes: 10, image: "/Screenshoot/Screenshot 2025-11-28 162344.png", screenCount: 1 },
        { id: "m1-7", time: "1:00 pm - 1:10 pm", progress: 44, minutes: 10, image: "/Screenshoot/Screenshot 2025-11-18 155809.png", screenCount: 1 },
        { id: "m1-8", time: "1:10 pm - 1:20 pm", progress: 0, minutes: 0, image: "", noActivity: true, screenCount: 0 },
    ],
    m2: [
        { id: "m2-1", time: "2:00 pm - 2:10 pm", progress: 53, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-12 222910.png", screenCount: 1 },
        { id: "m2-2", time: "2:10 pm - 2:20 pm", progress: 77, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-20 161303.png", screenCount: 1 },
        { id: "m2-3", time: "2:20 pm - 2:30 pm", progress: 81, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-20 161319.png", screenCount: 1 },
        { id: "m2-4", time: "2:30 pm - 2:40 pm", progress: 68, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-25 191532.png", screenCount: 1 },
        { id: "m2-5", time: "2:40 pm - 2:50 pm", progress: 59, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-04 220750.png", screenCount: 1 },
        { id: "m2-6", time: "2:50 pm - 3:00 pm", progress: 52, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-08 094631.png", screenCount: 1 },
        { id: "m2-7", time: "3:00 pm - 3:10 pm", progress: 44, minutes: 10, image: "/Screenshoot/Screenshot 2025-11-18 155809.png", screenCount: 1 },
        { id: "m2-8", time: "3:10 pm - 3:20 pm", progress: 0, minutes: 0, image: "", noActivity: true, screenCount: 0 },
    ],
    m3: [
        { id: "m3-1", time: "10:00 am - 10:10 am", progress: 45, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-08 094631.png", screenCount: 1 },
        { id: "m3-2", time: "10:10 am - 10:20 am", progress: 52, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-11 204654.png", screenCount: 1 },
        { id: "m3-3", time: "10:20 am - 10:30 am", progress: 38, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-09 101315.png", screenCount: 1 },
        { id: "m3-4", time: "10:30 am - 10:40 am", progress: 40, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-04 222401.png", screenCount: 1 },
        { id: "m3-5", time: "10:40 am - 10:50 am", progress: 60, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-04 204028.png", screenCount: 1 },
        { id: "m3-6", time: "10:50 am - 11:00 am", progress: 38, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-25 191532.png", screenCount: 1 },
        { id: "m3-7", time: "11:00 am - 11:10 am", progress: 34, minutes: 10, image: "/Screenshoot/Screenshot 2025-11-18 155809.png", screenCount: 1 },
        { id: "m3-8", time: "11:10 am - 11:20 am", progress: 0, minutes: 0, image: "", noActivity: true, screenCount: 0 },
    ],
    m4: [
        { id: "m4-1", time: "4:00 pm - 4:10 pm", progress: 71, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-12 222910.png", screenCount: 1 },
        { id: "m4-2", time: "4:10 pm - 4:20 pm", progress: 66, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-20 161303.png", screenCount: 1 },
        { id: "m4-3", time: "4:20 pm - 4:30 pm", progress: 58, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-20 161319.png", seconds: true, screenCount: 1 },
        { id: "m4-4", time: "4:30 pm - 4:40 pm", progress: 63, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-25 191532.png", screenCount: 1 },
        { id: "m4-5", time: "4:40 pm - 4:50 pm", progress: 45, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-04 220750.png", screenCount: 1 },
        { id: "m4-6", time: "4:50 pm - 5:00 pm", progress: 52, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-11 204654.png", screenCount: 1 },
        { id: "m4-7", time: "5:00 pm - 5:10 pm", progress: 47, minutes: 10, image: "/Screenshoot/Screenshot 2025-11-28 162344.png", screenCount: 1 },
        { id: "m4-8", time: "5:10 pm - 5:20 pm", progress: 0, minutes: 0, image: "", noActivity: true, screenCount: 0 },
    ],
    m5: [
        { id: "m5-1", time: "11:00 am - 11:10 am", progress: 79, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-20 161303.png", screenCount: 1 },
        { id: "m5-2", time: "11:10 am - 11:20 am", progress: 84, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-25 191532.png", screenCount: 1 },
        { id: "m5-3", time: "11:20 am - 11:30 am", progress: 72, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-04 204028.png", screenCount: 1 },
        { id: "m5-4", time: "11:30 am - 11:40 am", progress: 66, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-04 220750.png", screenCount: 1 },
        { id: "m5-5", time: "11:40 am - 11:50 am", progress: 58, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-11 204654.png", screenCount: 1 },
        { id: "m5-6", time: "11:50 am - 12:00 pm", progress: 66, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-25 191532.png", screenCount: 1 },
        { id: "m5-7", time: "12:00 pm - 12:10 pm", progress: 48, minutes: 10, image: "/Screenshoot/Screenshot 2025-11-18 155809.png", screenCount: 1 },
        { id: "m5-8", time: "12:10 pm - 12:20 pm", progress: 0, minutes: 0, image: "", noActivity: true, screenCount: 0 },
    ],
}

export const DUMMY_MEMBER_INSIGHTS: Record<string, MemberInsightSummary> = {
    m1: {
        memberId: "m1",
        totalWorkedTime: "3h 24m",
        focusTime: "1h 22m",
        focusDescription: "Stable focus with a fresh start before lunch.",
        avgActivity: "83%",
        unusualCount: 1,
        unusualMessage: "- Late-night spike after 10 pm.",
        classificationLabel: "Productive",
        classificationSummary: "Maintains high focus on the morning stretch.",
        classificationPercent: 78,
    },
    m2: {
        memberId: "m2",
        totalWorkedTime: "4h 05m",
        focusTime: "1h 40m",
        focusDescription: "Deep work streak right after lunch.",
        avgActivity: "76%",
        unusualCount: 2,
        unusualMessage: "- Two idle checks interrupted the flow.\n- The app switched quickly before returning to work.",
        classificationLabel: "Balanced",
        classificationSummary: "Punctuated focus with controlled rest.",
        classificationPercent: 64,
    },
    m3: {
        memberId: "m3",
        totalWorkedTime: "3h 48m",
        focusTime: "1h 10m",
        focusDescription: "Creative tasks keep the pace steady.",
        avgActivity: "69%",
        unusualCount: 1,
        unusualMessage: "- Weekend-style hours detected midweek.",
        classificationLabel: "Creative",
        classificationSummary: "Switches between design and research calmly.",
        classificationPercent: 71,
    },
    m4: {
        memberId: "m4",
        totalWorkedTime: "3h 10m",
        focusTime: "1h 05m",
        focusDescription: "Quick bursts of energy in the afternoon.",
        avgActivity: "71%",
        unusualCount: 3,
        unusualMessage: "- Idle stretch followed by a sprint.\n- Brief break before diving back into API fixes.\n- Finished with a quick review of the dashboard.",
        classificationLabel: "Recovery",
        classificationSummary: "Rebounds strong after a short lull.",
        classificationPercent: 59,
    },
    m5: {
        memberId: "m5",
        totalWorkedTime: "3h 55m",
        focusTime: "1h 25m",
        focusDescription: "Consistent energy with quick updates.",
        avgActivity: "80%",
        unusualCount: 0,
        unusualMessage: "- No unusual activity this session.",
        classificationLabel: "High focus",
        classificationSummary: "Keeps steady pace through late morning.",
        classificationPercent: 85,
    },
}

export function getScreenshotsByMember(memberId: string) {
    return DUMMY_SCREENSHOTS.filter(s => s.memberId === memberId)
}

export function getScreenshotsByDateRange(startDate: Date, endDate: Date) {
    return DUMMY_SCREENSHOTS.filter(s => {
        const screenshotDate = new Date(s.date)
        return screenshotDate >= startDate && screenshotDate <= endDate
    })
}

export function getScreenshotsByMemberAndDateRange(memberId: string, startDate: Date, endDate: Date) {
    return DUMMY_SCREENSHOTS.filter(s => {
        const screenshotDate = new Date(s.date)
        return s.memberId === memberId && screenshotDate >= startDate && screenshotDate <= endDate
    })
}

// ============================================================================
// DYNAMIC MEMBER DATA GENERATORS
// ============================================================================

// Template screenshot images that can be used for any member
const SCREENSHOT_IMAGES = [
    "/Screenshoot/Screenshot 2025-12-08 094631.png",
    "/Screenshoot/Screenshot 2025-12-11 204654.png",
    "/Screenshoot/Screenshot 2025-12-04 220750.png",
    "/Screenshoot/Screenshot 2025-12-25 191532.png",
    "/Screenshoot/Screenshot 2025-12-04 204028.png",
    "/Screenshoot/Screenshot 2025-11-28 162344.png",
    "/Screenshoot/Screenshot 2025-11-18 155809.png",
    "/Screenshoot/Screenshot 2026-01-12 222910.png",
    "/Screenshoot/Screenshot 2026-01-20 161303.png",
    "/Screenshoot/Screenshot 2026-01-20 161319.png",
    "/Screenshoot/Screenshot 2026-01-09 101315.png",
    "/Screenshoot/Screenshot 2026-01-04 222401.png",
]

// Time patterns for different variation indexes
const TIME_PATTERNS = [
    { start: 9, period: "am" },
    { start: 10, period: "am" },
    { start: 11, period: "am" },
    { start: 1, period: "pm" },
    { start: 2, period: "pm" },
    { start: 3, period: "pm" },
    { start: 4, period: "pm" },
]

// Generate screenshot data for any member ID
export function generateMemberScreenshots(memberId: string): MemberScreenshotItem[] {
    // If member is in existing dummy data, return that
    if (DUMMY_MEMBER_SCREENSHOTS[memberId]) {
        return DUMMY_MEMBER_SCREENSHOTS[memberId]
    }

    // Generate deterministic variation based on memberId hash
    // Improve hash spread for UUIDs
    const hash = memberId.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0)
    console.log(`[Generator] Generating screenshots for ${memberId}, hash: ${hash}`)

    const patternIndex = Math.abs(hash) % TIME_PATTERNS.length
    const pattern = TIME_PATTERNS[patternIndex] || TIME_PATTERNS[0]
    const startHour = pattern?.start ?? 9
    const period = pattern?.period ?? "am"

    const screenshots: MemberScreenshotItem[] = []

    for (let i = 0; i < 8; i++) {
        const minuteStart = i * 10
        const minuteEnd = (i + 1) * 10
        const hourStart = startHour + Math.floor(minuteStart / 60)
        const hourEnd = startHour + Math.floor(minuteEnd / 60)
        const actualMinuteStart = minuteStart % 60
        const actualMinuteEnd = minuteEnd % 60

        const formatHour = (h: number, p: string) => {
            if (p === "am" && h >= 12) return { hour: h - 12 || 12, period: h >= 12 ? "pm" : "am" }
            if (p === "pm" && h > 12) return { hour: h - 12, period: "pm" }
            if (p === "pm" && h === 12) return { hour: 12, period: "pm" }
            return { hour: h, period: p }
        }

        const startFormatted = formatHour(hourStart, period)
        const endFormatted = formatHour(hourEnd, period)

        const timeStr = `${startFormatted.hour}:${actualMinuteStart.toString().padStart(2, '0')} ${startFormatted.period} - ${endFormatted.hour}:${actualMinuteEnd.toString().padStart(2, '0')} ${endFormatted.period}`

        // Last item is always "no activity"
        if (i === 7) {
            screenshots.push({
                id: `${memberId}-${i + 1}`,
                time: timeStr,
                progress: 0,
                minutes: 0,
                image: "",
                noActivity: true,
                screenCount: 0
            })
        } else {
            // Use deterministic but varied progress and image index
            const progress = 40 + ((hash + i * 17) % 45)
            const imageIndex = (hash + i) % SCREENSHOT_IMAGES.length

            screenshots.push({
                id: `${memberId}-${i + 1}`,
                time: timeStr,
                progress,
                minutes: 10,
                image: SCREENSHOT_IMAGES[imageIndex] ?? SCREENSHOT_IMAGES[0] ?? "",
                screenCount: 1
            })
        }
    }

    return screenshots
}

// Generate insight summary for any member ID
export function generateMemberInsight(memberId: string): MemberInsightSummary {
    // If member is in existing dummy data, return that
    if (DUMMY_MEMBER_INSIGHTS[memberId]) {
        return DUMMY_MEMBER_INSIGHTS[memberId]
    }

    // Generate deterministic variation based on memberId hash
    const hash = memberId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

    const workedHours = 2 + (hash % 4)
    const workedMinutes = (hash * 7) % 60
    const focusHours = 1 + (hash % 2)
    const focusMinutes = (hash * 5) % 60
    const avgActivity = 60 + (hash % 30)
    const unusualCount = hash % 3

    const classificationsLabels = ["Productive", "Balanced", "Creative", "Recovery", "High focus"] as const
    const classificationSummaries = [
        "Maintains high focus on tasks.",
        "Punctuated focus with controlled rest.",
        "Switches between tasks calmly.",
        "Rebounds strong after a short lull.",
        "Keeps steady pace throughout the day."
    ] as const
    const focusDescriptions = [
        "Stable focus with a fresh start.",
        "Deep work streak in the morning.",
        "Creative tasks keep the pace steady.",
        "Quick bursts of energy in the afternoon.",
        "Consistent energy with quick updates."
    ] as const
    const unusualMessages = [
        "- No unusual activity detected.",
        "- Brief break before diving back into work.",
        "- Two idle checks interrupted the flow.\n- The app switched quickly before returning to work.",
        "- Idle stretch followed by a sprint.\n- Brief break before diving back into API fixes.\n- Finished with a quick review."
    ] as const

    const classIndex = hash % classificationsLabels.length

    return {
        memberId,
        totalWorkedTime: `${workedHours}h ${workedMinutes.toString().padStart(2, '0')}m`,
        focusTime: `${focusHours}h ${focusMinutes.toString().padStart(2, '0')}m`,
        focusDescription: focusDescriptions[hash % focusDescriptions.length] || focusDescriptions[0],
        avgActivity: `${avgActivity}%`,
        unusualCount,
        unusualMessage: unusualMessages[Math.min(unusualCount, unusualMessages.length - 1)] || unusualMessages[0],
        classificationLabel: classificationsLabels[classIndex] || classificationsLabels[0],
        classificationSummary: classificationSummaries[classIndex] || classificationSummaries[0],
        classificationPercent: 55 + (hash % 35),
    }
}

// ============================================================================
// ATTENDANCE DASHBOARD
// ============================================================================

export interface DashboardActivity {
    id: string
    memberId: string
    memberName: string
    division: string
    position: string
    activityType: 'check_in' | 'check_out' | 'break_start' | 'break_end'
    timestamp: string
    date: string
}

export interface StaffStatusData {
    type: 'permanent' | 'contract' | 'intern'
    count: number
    percentage: number
}

export interface PendingRequest {
    id: string
    memberId: string
    memberName: string
    requestType: 'annual_leave' | 'sick_leave' | 'overtime' | 'permission'
    requestDate: string
    status: 'pending' | 'approved' | 'rejected'
    notes?: string
}

export interface LateMissedShift {
    id: string
    memberId: string
    memberName: string
    shiftDate: string
    shiftTime: string
    issue: 'late' | 'missed'
    lateBy?: string
}

export interface ManualTimeEntry {
    id: string
    memberId: string
    memberName: string
    date: string
    timeChange: string
    note: string
}

export interface DashboardStats {
    totalStaff: number
    present: number
    late: number
    permission: number
    earnedWeek: string
    earnedToday: string
    workedWeek: string
    workedToday: string
    projectsWorked: number
    activityToday: string
    activityWeek: string
}

// Dashboard Activities (recent check-ins/outs)
export const DUMMY_DASHBOARD_ACTIVITIES: DashboardActivity[] = [
    { id: 'da1', memberId: 'm1', memberName: 'Antonio Galih', division: 'Engineering', position: 'Senior Developer', activityType: 'check_in', timestamp: '2026-01-21T08:05:21', date: '2026-01-21' },
    { id: 'da2', memberId: 'm2', memberName: 'Lave Lavael', division: 'Design', position: 'UI/UX Designer', activityType: 'check_in', timestamp: '2026-01-21T08:10:15', date: '2026-01-21' },
    { id: 'da3', memberId: 'm3', memberName: 'Sarah Johnson', division: 'Marketing', position: 'Marketing Manager', activityType: 'check_in', timestamp: '2026-01-21T08:02:30', date: '2026-01-21' },
    { id: 'da4', memberId: 'm4', memberName: 'Michael Chen', division: 'Engineering', position: 'Backend Developer', activityType: 'check_in', timestamp: '2026-01-21T08:15:45', date: '2026-01-21' },
    { id: 'da5', memberId: 'm5', memberName: 'Emma Rodriguez', division: 'HR', position: 'HR Manager', activityType: 'check_in', timestamp: '2026-01-21T08:00:00', date: '2026-01-21' },
    { id: 'da6', memberId: 'm1', memberName: 'Antonio Galih', division: 'Engineering', position: 'Senior Developer', activityType: 'check_out', timestamp: '2026-01-21T17:10:15', date: '2026-01-21' },
    { id: 'da7', memberId: 'm2', memberName: 'Lave Lavael', division: 'Design', position: 'UI/UX Designer', activityType: 'check_out', timestamp: '2026-01-21T17:05:30', date: '2026-01-21' },
]

// Staff Status Distribution
export const DUMMY_STAFF_STATUS: StaffStatusData[] = [
    { type: 'permanent', count: 10, percentage: 66.67 },
    { type: 'contract', count: 3, percentage: 20 },
    { type: 'intern', count: 2, percentage: 13.33 }
]

// Pending Requests
export const DUMMY_PENDING_REQUESTS: PendingRequest[] = [
    { id: 'pr1', memberId: 'm3', memberName: 'Sarah Johnson', requestType: 'annual_leave', requestDate: '2026-01-22', status: 'pending', notes: 'Family vacation' },
    { id: 'pr2', memberId: 'm4', memberName: 'Michael Chen', requestType: 'sick_leave', requestDate: '2026-01-21', status: 'pending', notes: 'Flu symptoms' },
    { id: 'pr3', memberId: 'm1', memberName: 'Antonio Galih', requestType: 'overtime', requestDate: '2026-01-20', status: 'pending', notes: 'Project deadline' },
]

// Late & Missed Shifts
export const DUMMY_LATE_MISSED_SHIFTS: LateMissedShift[] = [
    { id: 'lm1', memberId: 'm4', memberName: 'Michael Chen', shiftDate: '2026-01-21', shiftTime: '08:00–17:00', issue: 'late', lateBy: '15m' },
    { id: 'lm2', memberId: 'm3', memberName: 'Sarah Johnson', shiftDate: '2026-01-20', shiftTime: '08:00–17:00', issue: 'late', lateBy: '7m' },
    { id: 'lm3', memberId: 'm2', memberName: 'Lave Lavael', shiftDate: '2026-01-19', shiftTime: '08:00–17:00', issue: 'missed' },
]

// Manual Time Entries
export const DUMMY_MANUAL_TIME: ManualTimeEntry[] = [
    { id: 'mt1', memberId: 'm1', memberName: 'Antonio Galih', date: '2026-01-21', timeChange: '+0:30', note: 'Add meeting time' },
    { id: 'mt2', memberId: 'm5', memberName: 'Emma Rodriguez', date: '2026-01-21', timeChange: '-0:10', note: 'Trim break' },
]

// Dashboard Statistics
export const DUMMY_DASHBOARD_STATS: DashboardStats = {
    totalStaff: 156,
    present: 142,
    late: 8,
    permission: 4,
    earnedWeek: 'Rp 3.450.000',
    earnedToday: 'Rp 550.000',
    workedWeek: '38h 25m',
    workedToday: '6h 40m',
    projectsWorked: 5,
    activityToday: 'Normal',
    activityWeek: '↑ 12%'
}

// "Me" view data (for current user - Antonio Galih / m1)
export const DUMMY_MY_ACTIVITIES: DashboardActivity[] = DUMMY_DASHBOARD_ACTIVITIES.filter(a => a.memberId === 'm1')

export const DUMMY_MY_STATS = {
    status: 'Attend',
    workedToday: '8h 40m',
    workedWeek: '38h 25m',
    attendanceRate: '95%',
    lateCount: 2,
    earnedToday: 'Rp 550.000',
    earnedWeek: 'Rp 3.450.000',
    projectsWorked: 5,
    activityToday: 'Normal',
    activityWeek: '↑ 12%'
}

export function getDashboardActivitiesByDate(date: Date) {
    const dateStr = date.toISOString().split('T')[0]
    return DUMMY_DASHBOARD_ACTIVITIES.filter(a => a.date === dateStr)
}

export function getDashboardActivitiesByMember(memberId: string) {
    return DUMMY_DASHBOARD_ACTIVITIES.filter(a => a.memberId === memberId)
}

// Type aliases for backwards compatibility
export type { UnusualActivityEntry as UnusualActivity }

// ============================================================================
// APP ACTIVITIES
// ============================================================================

export interface AppActivityEntry {
    id: string
    projectId: string
    projectName: string
    memberId: string
    appName: string
    timeSpent: number // in hours
    sessions: number
    date: string
    details?: {
        id: string
        appName: string
        timeSpent: number
        sessions: number
    }[]
}

export const DUMMY_APP_ACTIVITIES: AppActivityEntry[] = [
    {
        id: "aa1",
        projectId: "1",
        projectName: "Website Redesign",
        memberId: "m1",
        appName: "VS Code",
        timeSpent: 4.5,
        sessions: 12,
        date: "2026-01-21"
    },
    {
        id: "aa2",
        projectId: "1",
        projectName: "Website Redesign",
        memberId: "m1",
        appName: "Chrome",
        timeSpent: 2.1,
        sessions: 25,
        date: "2026-01-21"
    },
    {
        id: "aa3",
        projectId: "2",
        projectName: "Mobile App Development",
        memberId: "m2",
        appName: "Android Studio",
        timeSpent: 6.0,
        sessions: 5,
        date: "2026-01-21"
    },
    {
        id: "aa4",
        projectId: "1",
        projectName: "hans",
        memberId: "m1",
        appName: "Hubstaff",
        timeSpent: 0.0214, // 0:01:17 in hours (77 seconds / 3600)
        sessions: 2,
        date: "2026-01-26"
    },
    {
        id: "aa5",
        projectId: "1",
        projectName: "hans",
        memberId: "m1",
        appName: "Microsoft Edge",
        timeSpent: 0.0169, // 0:01:01 in hours (61 seconds / 3600)
        sessions: 1,
        date: "2026-01-26"
    },
    {
        id: "aa6",
        projectId: "1",
        projectName: "Website Redesign",
        memberId: "m1",
        appName: "VS Code",
        timeSpent: 2.5,
        sessions: 8,
        date: "2026-01-26"
    },
    {
        id: "aa7",
        projectId: "1",
        projectName: "Website Redesign",
        memberId: "m1",
        appName: "Chrome",
        timeSpent: 1.8,
        sessions: 15,
        date: "2026-01-26"
    },
    {
        id: "aa8",
        projectId: "2",
        projectName: "Mobile App Development",
        memberId: "m2",
        appName: "Android Studio",
        timeSpent: 3.2,
        sessions: 6,
        date: "2026-01-26"
    },
    {
        id: "aa9",
        projectId: "3",
        projectName: "Marketing Campaign",
        memberId: "m3",
        appName: "Spotify",
        timeSpent: 4.5, // Listening to music while working
        sessions: 1,
        date: "2026-01-26"
    },
    {
        id: "aa10",
        projectId: "1",
        projectName: "Website Redesign",
        memberId: "m1",
        appName: "Figma",
        timeSpent: 3.8,
        sessions: 4,
        date: "2026-01-26"
    },
    {
        id: "aa11",
        projectId: "4",
        projectName: "Internal Tools",
        memberId: "m4",
        appName: "Slack",
        timeSpent: 1.5,
        sessions: 20,
        date: "2026-01-26"
    },
    {
        id: "aa12",
        projectId: "2",
        projectName: "Mobile App Development",
        memberId: "m2",
        appName: "Zoom",
        timeSpent: 2.0,
        sessions: 3,
        date: "2026-01-26"
    },
    {
        id: "aa13",
        projectId: "5",
        projectName: "Documentation",
        memberId: "m5",
        appName: "Notion",
        timeSpent: 2.5,
        sessions: 8,
        date: "2026-01-26"
    },
    {
        id: "aa38",
        projectId: "1",
        projectName: "hans",
        memberId: "m1",
        appName: "Hubstaff",
        timeSpent: 0.015, // 0:00:54
        sessions: 1,
        date: "2026-01-27"
    },
    {
        id: "aa39",
        projectId: "1",
        projectName: "hans",
        memberId: "m1",
        appName: "Microsoft Edge",
        timeSpent: 0.02, // 0:01:12
        sessions: 2,
        date: "2026-01-27"
    },
    // Sarah Johnson (m3) - Marketing Campaign
    {
        id: "aa40",
        projectId: "3",
        projectName: "Marketing Campaign",
        memberId: "m3",
        appName: "Canva",
        timeSpent: 2.5,
        sessions: 8,
        date: "2026-01-26"
    },
    {
        id: "aa41",
        projectId: "3",
        projectName: "Marketing Campaign",
        memberId: "m3",
        appName: "Chrome",
        timeSpent: 1.8,
        sessions: 12,
        date: "2026-01-26"
    },
    {
        id: "aa42",
        projectId: "3",
        projectName: "Marketing Campaign",
        memberId: "m3",
        appName: "Slack",
        timeSpent: 0.5,
        sessions: 5,
        date: "2026-01-26"
    },
    {
        id: "aa14",
        projectId: "1",
        projectName: "Website Redesign",
        memberId: "m3",
        appName: "Figma",
        timeSpent: 3.2,
        sessions: 6,
        date: "2026-01-27"
    },
    // Michael Chen (m4) - Mobile App Development
    {
        id: "aa15",
        projectId: "2",
        projectName: "Mobile App Development",
        memberId: "m4",
        appName: "Xcode",
        timeSpent: 5.5,
        sessions: 10,
        date: "2026-01-26"
    },
    {
        id: "aa16",
        projectId: "2",
        projectName: "Mobile App Development",
        memberId: "m4",
        appName: "VS Code",
        timeSpent: 2.3,
        sessions: 15,
        date: "2026-01-26"
    },
    {
        id: "aa17",
        projectId: "2",
        projectName: "Mobile App Development",
        memberId: "m4",
        appName: "Terminal",
        timeSpent: 1.2,
        sessions: 8,
        date: "2026-01-26"
    },
    {
        id: "aa18",
        projectId: "2",
        projectName: "Mobile App Development",
        memberId: "m4",
        appName: "Chrome",
        timeSpent: 0.8,
        sessions: 6,
        date: "2026-01-27"
    },
    // Emma Rodriguez (m5) - Website Redesign
    {
        id: "aa19",
        projectId: "1",
        projectName: "Website Redesign",
        memberId: "m5",
        appName: "Figma",
        timeSpent: 4.0,
        sessions: 7,
        date: "2026-01-26"
    },
    {
        id: "aa20",
        projectId: "1",
        projectName: "Website Redesign",
        memberId: "m5",
        appName: "VS Code",
        timeSpent: 3.5,
        sessions: 11,
        date: "2026-01-26"
    },
    {
        id: "aa21",
        projectId: "1",
        projectName: "Website Redesign",
        memberId: "m5",
        appName: "Chrome",
        timeSpent: 1.5,
        sessions: 9,
        date: "2026-01-26"
    },
    {
        id: "aa22",
        projectId: "1",
        projectName: "Website Redesign",
        memberId: "m5",
        appName: "Adobe Photoshop",
        timeSpent: 2.0,
        sessions: 4,
        date: "2026-01-27"
    },
    // Data untuk hari kemarin (25 Januari 2026)
    // Antonio Galih (m1) - Yesterday
    {
        id: "aa23",
        projectId: "1",
        projectName: "Website Redesign",
        memberId: "m1",
        appName: "VS Code",
        timeSpent: 5.0,
        sessions: 14,
        date: "2026-01-25"
    },
    {
        id: "aa24",
        projectId: "1",
        projectName: "Website Redesign",
        memberId: "m1",
        appName: "Chrome",
        timeSpent: 2.5,
        sessions: 20,
        date: "2026-01-25"
    },
    {
        id: "aa25",
        projectId: "1",
        projectName: "hans",
        memberId: "m1",
        appName: "Hubstaff",
        timeSpent: 0.03,
        sessions: 3,
        date: "2026-01-25"
    },
    // Lave Lavael (m2) - Yesterday
    {
        id: "aa26",
        projectId: "2",
        projectName: "Mobile App Development",
        memberId: "m2",
        appName: "Android Studio",
        timeSpent: 7.0,
        sessions: 6,
        date: "2026-01-25"
    },
    {
        id: "aa27",
        projectId: "2",
        projectName: "Mobile App Development",
        memberId: "m2",
        appName: "VS Code",
        timeSpent: 1.5,
        sessions: 8,
        date: "2026-01-25"
    },
    {
        id: "aa28",
        projectId: "2",
        projectName: "Mobile App Development",
        memberId: "m2",
        appName: "Chrome",
        timeSpent: 1.2,
        sessions: 10,
        date: "2026-01-25"
    },
    // Sarah Johnson (m3) - Yesterday
    {
        id: "aa29",
        projectId: "3",
        projectName: "Marketing Campaign",
        memberId: "m3",
        appName: "Canva",
        timeSpent: 3.0,
        sessions: 9,
        date: "2026-01-25"
    },
    {
        id: "aa30",
        projectId: "3",
        projectName: "Marketing Campaign",
        memberId: "m3",
        appName: "Chrome",
        timeSpent: 2.0,
        sessions: 15,
        date: "2026-01-25"
    },
    {
        id: "aa31",
        projectId: "3",
        projectName: "Marketing Campaign",
        memberId: "m3",
        appName: "Slack",
        timeSpent: 0.8,
        sessions: 7,
        date: "2026-01-25"
    },
    // Michael Chen (m4) - Yesterday
    {
        id: "aa32",
        projectId: "2",
        projectName: "Mobile App Development",
        memberId: "m4",
        appName: "Xcode",
        timeSpent: 6.0,
        sessions: 11,
        date: "2026-01-25"
    },
    {
        id: "aa33",
        projectId: "2",
        projectName: "Mobile App Development",
        memberId: "m4",
        appName: "VS Code",
        timeSpent: 2.8,
        sessions: 18,
        date: "2026-01-25"
    },
    {
        id: "aa34",
        projectId: "2",
        projectName: "Mobile App Development",
        memberId: "m4",
        appName: "Terminal",
        timeSpent: 1.5,
        sessions: 10,
        date: "2026-01-25"
    },
    // Emma Rodriguez (m5) - Yesterday
    {
        id: "aa35",
        projectId: "1",
        projectName: "Website Redesign",
        memberId: "m5",
        appName: "Figma",
        timeSpent: 4.5,
        sessions: 8,
        date: "2026-01-25"
    },
    {
        id: "aa36",
        projectId: "1",
        projectName: "Website Redesign",
        memberId: "m5",
        appName: "VS Code",
        timeSpent: 3.8,
        sessions: 13,
        date: "2026-01-25"
    },
    {
        id: "aa37",
        projectId: "1",
        projectName: "Website Redesign",
        memberId: "m5",
        appName: "Chrome",
        timeSpent: 1.8,
        sessions: 11,
        date: "2026-01-25"
    }
]

// ============================================================================
// URL ACTIVITIES
// ============================================================================

export interface UrlActivityDetail {
    id: string
    title?: string
    url: string
    timeSpent: number // in hours
}

export interface UrlActivityEntry {
    id: string
    projectId: string
    projectName: string
    memberId: string
    site: string // URL atau domain
    timeSpent: number // in hours (total dari semua details)
    date: string
    details?: UrlActivityDetail[] // Detail URLs untuk expand
}

// Helper function to get dynamic dates
function getDateString(daysAgo: number): string {
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    return date.toISOString().split('T')[0]!
}

// Generate dynamic URL activities data
function generateUrlActivities(): UrlActivityEntry[] {
    const today = getDateString(0)
    const yesterday = getDateString(1)
    const twoDaysAgo = getDateString(2)

    return [
        // Antonio Galih (m1) - Today
        {
            id: "ua1",
            projectId: "1",
            projectName: "hans",
            memberId: "m1",
            site: "app.hubstaff.com",
            timeSpent: 0.0158,
            date: today,
            details: [
                { id: "ua1-d1", title: "Dashboard - Hubstaff", url: "https://app.hubstaff.com/dashboard", timeSpent: 0.0104 },
                { id: "ua1-d2", title: "Reports - Hubstaff", url: "https://app.hubstaff.com/reports", timeSpent: 0.0054 }
            ]
        },
        {
            id: "ua1-support",
            projectId: "1",
            projectName: "hans",
            memberId: "m1",
            site: "support.hubstaff.com",
            timeSpent: 0.0656,
            date: today,
            details: [
                { id: "ua1-s1", title: "Hubstaff Insights Guide", url: "https://support.hubstaff.com/hubstaff-insights", timeSpent: 0.0431 },
                { id: "ua1-s2", title: "Getting Started", url: "https://support.hubstaff.com/hubstaff-insights/getting-started", timeSpent: 0.0225 }
            ]
        },
        {
            id: "ua2",
            projectId: "1",
            projectName: "Website Redesign",
            memberId: "m1",
            site: "github.com",
            timeSpent: 2.5,
            date: today,
            details: [
                { id: "ua2-d1", title: "Presensi-New Repository", url: "https://github.com/Presensi-New", timeSpent: 1.5 },
                { id: "ua2-d2", title: "Fauzan-Fz/Presensi-New", url: "https://github.com/Fauzan-Fz/Presensi-New", timeSpent: 1.0 }
            ]
        },
        {
            id: "ua3",
            projectId: "1",
            projectName: "Website Redesign",
            memberId: "m1",
            site: "stackoverflow.com",
            timeSpent: 0.5,
            date: today,
            details: [
                { id: "ua3-d1", title: "React useEffect question", url: "https://stackoverflow.com/questions/12345", timeSpent: 0.3 },
                { id: "ua3-d2", title: "TypeScript generics", url: "https://stackoverflow.com/questions/67890", timeSpent: 0.2 }
            ]
        },
        {
            id: "ua4",
            projectId: "1",
            projectName: "Website Redesign",
            memberId: "m1",
            site: "docs.google.com",
            timeSpent: 1.2,
            date: today,
            details: [
                { id: "ua4-d1", title: "Project Documentation", url: "https://docs.google.com/document/d/abc123", timeSpent: 0.8 },
                { id: "ua4-d2", title: "Sprint Planning Sheet", url: "https://docs.google.com/spreadsheets/d/def456", timeSpent: 0.4 }
            ]
        },
        {
            id: "ua10",
            projectId: "1",
            projectName: "Design System",
            memberId: "m1",
            site: "figma.com",
            timeSpent: 3.5,
            date: today,
            details: [
                { id: "ua10-d1", title: "UI Kit - v2.0", url: "https://figma.com/file/xyz789", timeSpent: 2.0 },
                { id: "ua10-d2", title: "Dashboard Prototypes", url: "https://figma.com/file/abc456", timeSpent: 1.5 }
            ]
        },
        {
            id: "ua11",
            projectId: "1",
            projectName: "Meetings",
            memberId: "m1",
            site: "zoom.us",
            timeSpent: 1.5,
            date: today,
            details: [
                { id: "ua11-d1", title: "Daily Standup", url: "https://zoom.us/j/123456789", timeSpent: 0.5 },
                { id: "ua11-d2", title: "Client Demo", url: "https://zoom.us/j/987654321", timeSpent: 1.0 }
            ]
        },
        {
            id: "ua12",
            projectId: "3",
            projectName: "Knowledge Base",
            memberId: "m1",
            site: "notion.so",
            timeSpent: 1.8,
            date: today,
            details: [
                { id: "ua12-d1", title: "Engineering Onboarding", url: "https://notion.so/eng/onboarding", timeSpent: 1.0 },
                { id: "ua12-d2", title: "API Specs", url: "https://notion.so/eng/api-specs", timeSpent: 0.8 }
            ]
        },
        {
            id: "ua13",
            projectId: "4",
            projectName: "Research",
            memberId: "m1",
            site: "youtube.com",
            timeSpent: 0.9,
            date: today,
            details: [
                { id: "ua13-d1", title: "Next.js 14 Tutorial", url: "https://youtube.com/watch?v=xyz", timeSpent: 0.9 }
            ]
        },
        {
            id: "ua14",
            projectId: "1",
            projectName: "Recruiting",
            memberId: "m1",
            site: "linkedin.com",
            timeSpent: 0.6,
            date: today,
            details: [
                { id: "ua14-d1", title: "Candidate Search", url: "https://linkedin.com/jobs", timeSpent: 0.6 }
            ]
        },
        // Lave Lavael (m2) - Today
        {
            id: "ua5",
            projectId: "2",
            projectName: "Mobile App Development",
            memberId: "m2",
            site: "developer.android.com",
            timeSpent: 3.0,
            date: today,
            details: [
                { id: "ua5-d1", title: "Android Developer Guide", url: "https://developer.android.com/guide", timeSpent: 2.0 },
                { id: "ua5-d2", title: "Android Training", url: "https://developer.android.com/training", timeSpent: 1.0 }
            ]
        },
        {
            id: "ua6",
            projectId: "2",
            projectName: "Mobile App Development",
            memberId: "m2",
            site: "github.com",
            timeSpent: 1.5,
            date: today,
            details: [
                { id: "ua6-d1", title: "Mobile App Repository", url: "https://github.com/user/mobile-app", timeSpent: 1.0 },
                { id: "ua6-d2", title: "Pull Requests", url: "https://github.com/user/mobile-app/pulls", timeSpent: 0.5 }
            ]
        },
        {
            id: "ua7",
            projectId: "2",
            projectName: "Mobile App Development",
            memberId: "m2",
            site: "stackoverflow.com",
            timeSpent: 0.8,
            date: today,
            details: [
                { id: "ua7-d1", title: "Android RecyclerView issue", url: "https://stackoverflow.com/questions/android-123", timeSpent: 0.5 },
                { id: "ua7-d2", title: "Kotlin coroutines", url: "https://stackoverflow.com/questions/android-456", timeSpent: 0.3 }
            ]
        },
        // Sarah Johnson (m3) - Today
        {
            id: "ua8",
            projectId: "3",
            projectName: "Marketing Campaign",
            memberId: "m3",
            site: "canva.com",
            timeSpent: 2.5,
            date: today,
            details: [
                { id: "ua8-d1", title: "Social Media Banner", url: "https://www.canva.com/design/abc123", timeSpent: 1.5 },
                { id: "ua8-d2", title: "Email Template", url: "https://www.canva.com/design/def456", timeSpent: 1.0 }
            ]
        },
        {
            id: "ua9",
            projectId: "3",
            projectName: "Marketing Campaign",
            memberId: "m3",
            site: "facebook.com",
            timeSpent: 1.0,
            date: today,
            details: [
                { id: "ua9-d1", title: "Facebook Business Suite", url: "https://www.facebook.com/business", timeSpent: 0.6 },
                { id: "ua9-d2", title: "Ads Manager", url: "https://www.facebook.com/ads/manager", timeSpent: 0.4 }
            ]
        },
        {
            id: "ua10",
            projectId: "3",
            projectName: "Marketing Campaign",
            memberId: "m3",
            site: "instagram.com",
            timeSpent: 0.5,
            date: today,
            details: [
                { id: "ua10-d1", title: "Instagram Business", url: "https://www.instagram.com/business", timeSpent: 0.3 },
                { id: "ua10-d2", title: "Account Manager", url: "https://www.instagram.com/accounts/manager", timeSpent: 0.2 }
            ]
        },
        // Michael Chen (m4) - Today
        {
            id: "ua11",
            projectId: "2",
            projectName: "Mobile App Development",
            memberId: "m4",
            site: "developer.apple.com",
            timeSpent: 4.0,
            date: today,
            details: [
                { id: "ua11-d1", title: "Apple Developer Documentation", url: "https://developer.apple.com/documentation", timeSpent: 2.5 },
                { id: "ua11-d2", title: "SwiftUI Tutorials", url: "https://developer.apple.com/tutorials", timeSpent: 1.5 }
            ]
        },
        {
            id: "ua12",
            projectId: "2",
            projectName: "Mobile App Development",
            memberId: "m4",
            site: "github.com",
            timeSpent: 2.0,
            date: today,
            details: [
                { id: "ua12-d1", title: "iOS App Repository", url: "https://github.com/user/ios-app", timeSpent: 1.2 },
                { id: "ua12-d2", title: "Issues & Bugs", url: "https://github.com/user/ios-app/issues", timeSpent: 0.8 }
            ]
        },
        // Emma Rodriguez (m5) - Today
        {
            id: "ua13",
            projectId: "1",
            projectName: "Website Redesign",
            memberId: "m5",
            site: "figma.com",
            timeSpent: 3.5,
            date: today,
            details: [
                { id: "ua13-d1", title: "Hubstaff Copy - Main Design", url: "https://www.figma.com/design/8zCDmfpE2Rg5EEAf9KXTfb/Copy-Hubstaff?node-id=218-171&p=f&t=1MZEA6TUTTRayQX6-0", timeSpent: 2.0 },
                { id: "ua13-d2", title: "Hubstaff Copy - Components", url: "https://www.figma.com/design/8zCDmfpE2Rg5EEAf9KXTfb/Copy-Hubstaff?node-id=218-171&p=f&t=1MZEA6TUTTRayQX6-0", timeSpent: 1.5 }
            ]
        },
        {
            id: "ua14",
            projectId: "1",
            projectName: "Website Redesign",
            memberId: "m5",
            site: "dribbble.com",
            timeSpent: 1.0,
            date: today,
            details: [
                { id: "ua14-d1", title: "UI Inspiration 1", url: "https://dribbble.com/shots/12345", timeSpent: 0.6 },
                { id: "ua14-d2", title: "Dashboard Designs", url: "https://dribbble.com/shots/67890", timeSpent: 0.4 }
            ]
        },
        // Data untuk hari kemarin (Yesterday)
        {
            id: "ua15",
            projectId: "1",
            projectName: "Website Redesign",
            memberId: "m1",
            site: "github.com",
            timeSpent: 4.0,
            date: yesterday,
            details: [
                { id: "ua15-d1", title: "Code Review", url: "https://github.com/Presensi-New/pull/123", timeSpent: 2.5 },
                { id: "ua15-d2", title: "Merge Conflicts", url: "https://github.com/Presensi-New/pull/124", timeSpent: 1.5 }
            ]
        },
        {
            id: "ua16",
            projectId: "1",
            projectName: "Website Redesign",
            memberId: "m1",
            site: "stackoverflow.com",
            timeSpent: 1.0,
            date: yesterday,
            details: [
                { id: "ua16-d1", title: "Next.js routing question", url: "https://stackoverflow.com/questions/nextjs-1", timeSpent: 0.6 },
                { id: "ua16-d2", title: "Tailwind CSS issue", url: "https://stackoverflow.com/questions/tailwind-2", timeSpent: 0.4 }
            ]
        },
        {
            id: "ua17",
            projectId: "2",
            projectName: "Mobile App Development",
            memberId: "m2",
            site: "developer.android.com",
            timeSpent: 5.0,
            date: yesterday,
            details: [
                { id: "ua17-d1", title: "Jetpack Compose", url: "https://developer.android.com/jetpack/compose", timeSpent: 3.0 },
                { id: "ua17-d2", title: "Material Design 3", url: "https://developer.android.com/develop/ui/compose/designsystems/material3", timeSpent: 2.0 }
            ]
        },
        {
            id: "ua18",
            projectId: "3",
            projectName: "Marketing Campaign",
            memberId: "m3",
            site: "canva.com",
            timeSpent: 3.0,
            date: yesterday,
            details: [
                { id: "ua18-d1", title: "Poster Design", url: "https://www.canva.com/design/poster123", timeSpent: 2.0 },
                { id: "ua18-d2", title: "Logo Variations", url: "https://www.canva.com/design/logo456", timeSpent: 1.0 }
            ]
        },
        {
            id: "ua19",
            projectId: "2",
            projectName: "Mobile App Development",
            memberId: "m4",
            site: "developer.apple.com",
            timeSpent: 5.5,
            date: yesterday,
            details: [
                { id: "ua19-d1", title: "Swift Concurrency", url: "https://developer.apple.com/documentation/swift/concurrency", timeSpent: 3.5 },
                { id: "ua19-d2", title: "App Store Guidelines", url: "https://developer.apple.com/app-store/review/guidelines", timeSpent: 2.0 }
            ]
        },
        {
            id: "ua20",
            projectId: "1",
            projectName: "Website Redesign",
            memberId: "m5",
            site: "figma.com",
            timeSpent: 4.5,
            date: yesterday,
            details: [
                { id: "ua20-d1", title: "Mobile Responsive Design", url: "https://www.figma.com/design/mobile-responsive", timeSpent: 2.5 },
                { id: "ua20-d2", title: "Icon Set", url: "https://www.figma.com/design/icons", timeSpent: 2.0 }
            ]
        },
        // Data untuk 2 hari yang lalu (Two Days Ago)
        {
            id: "ua21",
            projectId: "1",
            projectName: "hans",
            memberId: "m1",
            site: "app.hubstaff.com",
            timeSpent: 0.02,
            date: twoDaysAgo,
            details: [
                { id: "ua21-d1", title: "Time Tracking", url: "https://app.hubstaff.com/time", timeSpent: 0.012 },
                { id: "ua21-d2", title: "Activity Summary", url: "https://app.hubstaff.com/activity", timeSpent: 0.008 }
            ]
        },
        {
            id: "ua22",
            projectId: "1",
            projectName: "Website Redesign",
            memberId: "m1",
            site: "github.com",
            timeSpent: 3.0,
            date: twoDaysAgo,
            details: [
                { id: "ua22-d1", title: "Feature Branch", url: "https://github.com/Presensi-New/tree/feature", timeSpent: 2.0 },
                { id: "ua22-d2", title: "Actions Workflow", url: "https://github.com/Presensi-New/actions", timeSpent: 1.0 }
            ]
        },
        {
            id: "ua23",
            projectId: "2",
            projectName: "Mobile App Development",
            memberId: "m2",
            site: "developer.android.com",
            timeSpent: 4.5,
            date: twoDaysAgo,
            details: [
                { id: "ua23-d1", title: "Room Database", url: "https://developer.android.com/training/data-storage/room", timeSpent: 2.5 },
                { id: "ua23-d2", title: "WorkManager", url: "https://developer.android.com/topic/libraries/architecture/workmanager", timeSpent: 2.0 }
            ]
        },
        {
            id: "ua24",
            projectId: "3",
            projectName: "Marketing Campaign",
            memberId: "m3",
            site: "canva.com",
            timeSpent: 2.0,
            date: twoDaysAgo,
            details: [
                { id: "ua24-d1", title: "Newsletter Template", url: "https://www.canva.com/design/newsletter", timeSpent: 1.2 },
                { id: "ua24-d2", title: "Infographic", url: "https://www.canva.com/design/infographic", timeSpent: 0.8 }
            ]
        },
        {
            id: "ua25",
            projectId: "2",
            projectName: "Mobile App Development",
            memberId: "m4",
            site: "developer.apple.com",
            timeSpent: 4.5,
            date: twoDaysAgo,
            details: [
                { id: "ua25-d1", title: "Core Data", url: "https://developer.apple.com/documentation/coredata", timeSpent: 2.5 },
                { id: "ua25-d2", title: "CloudKit", url: "https://developer.apple.com/documentation/cloudkit", timeSpent: 2.0 }
            ]
        },
        {
            id: "ua26",
            projectId: "1",
            projectName: "Website Redesign",
            memberId: "m5",
            site: "figma.com",
            timeSpent: 3.0,
            date: twoDaysAgo,
            details: [
                { id: "ua26-d1", title: "Dark Mode Design", url: "https://www.figma.com/design/dark-mode", timeSpent: 1.8 },
                { id: "ua26-d2", title: "Color System", url: "https://www.figma.com/design/colors", timeSpent: 1.2 }
            ]
        }
    ]
}

export const DUMMY_URL_ACTIVITIES: UrlActivityEntry[] = generateUrlActivities()

// ============================================================================
// REPORT ACTIVITIES
// ============================================================================

export interface ReportActivityEntry {
    id: string
    date: string
    clientId: string
    clientName: string
    projectId: string
    projectName: string
    teamId: string
    teamName: string
    memberId: string
    memberName: string
    todoName: string
    regularHours: number
    totalHours: number
    activityPercent: number
    totalSpent: number
    regularSpent: number
    ptoHours: number
    holidayHours: number
}

// Helper to deterministically generate report data
function generateReportData(): ReportActivityEntry[] {
    const data: ReportActivityEntry[] = [];
    const startDate = new Date(2026, 0, 1); // Jan 1 2026
    const endDate = new Date(2026, 1, 28); // Feb 28 2026 (approx)

    // Seeded random for consistency across reloads (simple LCG)
    let seed = 12345;
    const random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    const projectRates: Record<string, number> = {
        "1": 150000, "2": 200000, "3": 175000, "4": 160000, "5": 190000
    };

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 0 || d.getDay() === 6) continue; // Skip weekends

        const dateStr = d.toISOString().split('T')[0];

        // Ensure every member has some data most days
        for (const member of DUMMY_MEMBERS) {
            // 10% chance of absence
            if (random() > 0.9) continue;

            const baseHours = 4 + random() * 5; // 4 to 9 hours
            const activityPct = 40 + Math.floor(random() * 55); // 40-95%

            // Assign to a primary project for this day (simplification)
            // Ideally could be multiple, but we'll create 1 entry per member/day/project to keep it simpler for now,
            // or maybe 2 entries if they split time.

            // Let's split time between 1 or 2 projects
            const numEntries = random() > 0.7 ? 2 : 1;

            for (let i = 0; i < numEntries; i++) {
                // Pick random project
                const proj = DUMMY_PROJECTS[Math.floor(random() * DUMMY_PROJECTS.length)];
                if (!proj) continue; // Should not happen

                // Get Client
                const client = DUMMY_CLIENTS.find(c => c.id === proj.clientId);
                if (!client) continue;

                // Get Team (first team found for project or member)
                // Fallback to "All Teams" or specific team logic if needed
                // For simplicity, pick a random team that the member belongs to, OR the project map.
                // We'll use DUMMY_TEAMS finding.
                const team = DUMMY_TEAMS.find(t => t.members.includes(member.id));
                const teamId = team ? team.id : "t1";
                const teamName = team ? team.name : "Team Alpha";

                const entryHours = (baseHours / numEntries) * (0.8 + random() * 0.4); // Add variance
                // We will just store the hours here. Aggregation logic handles OT.
                // But `ReportActivityEntry` has `regularHours` field. We'll approximate.

                const rate = projectRates[proj.id] || 100000;

                data.push({
                    id: `ra-${dateStr}-${member.id}-${i}`,
                    date: dateStr || "",
                    clientId: client.id,
                    clientName: client.name || "Client",
                    projectId: proj.id,
                    projectName: proj.name || "Project",
                    teamId: teamId,
                    teamName: teamName,
                    memberId: member.id,
                    memberName: member.name,

                    todoName: (() => {
                        // Find tasks for this project
                        const projTasks = DUMMY_PROJECT_TASKS.filter(t => t.projectId === proj.id);
                        if (projTasks.length > 0) {
                            // Pick predictable random task based on seed
                            const taskIndex = Math.floor(random() * projTasks.length);
                            return projTasks[taskIndex]?.title || "Task";
                        }
                        return i === 0 ? "Development" : "Meeting/Review";
                    })(),
                    regularHours: parseFloat(entryHours.toFixed(2)), // Approx
                    totalHours: parseFloat(entryHours.toFixed(2)),
                    activityPercent: activityPct,
                    totalSpent: Math.floor(entryHours * rate),
                    regularSpent: Math.floor(entryHours * rate),
                    ptoHours: random() > 0.95 ? 8 : 0, // 5% chance of PTO
                    holidayHours: 0 // Default to 0, could add specific dates if needed
                });
            }
        }
    }
    return data;
}

export const DUMMY_REPORT_ACTIVITIES: ReportActivityEntry[] = generateReportData();

// ============================================================================
// PERFORMANCE DASHBOARD
// ============================================================================

export const DUMMY_MY_PERFORMANCE = {
    status: "Present",
    workedToday: "08:30",
    workedWeek: "32:15",
    attendanceRate: "95%",
    lateCount: 1,
    earnedToday: "Rp 450.000",
    earnedWeek: "Rp 2.250.000",
    projectsWorked: 3,
    activityToday: "87%",
    activityWeek: "85%"
}

// ============================================================================
// CUSTOM REPORTS
// ============================================================================

// ============================================================================
// CUSTOM REPORTS
// ============================================================================

export interface CustomReport {
    id: string
    name: string
    type: string
    lastModified: string
    scheduleDetails: string
    scheduleMeta: string // e.g., "Weekly | Mon | PDF"
    nextSchedule: string // e.g., "Next: Mon, Feb 2, 2026 9:00 am"
    status: 'Active' | 'Paused'

    // Detailed Schedule Data
    emails: string
    message: string
    fileType: 'pdf' | 'csv' | 'xls'
    dateRange: 'last-week' | 'last-month' | 'custom'
    frequency: 'daily' | 'weekly' | 'monthly'
    deliveryTime: string
    deliveryDays: string[]
}

export const DUMMY_CUSTOM_REPORTS: CustomReport[] = [
    {
        id: "cr-1",
        name: "Time and Activity Report",
        type: "Time & Activity",
        lastModified: "Mon, Jan 26, 2026 11:51 am",
        scheduleDetails: "Weekly | Mon | PDF",
        scheduleMeta: "Weekly | Mon | PDF",
        nextSchedule: "Next: Mon, Feb 2, 2026 9:00 am",
        status: "Active",
        emails: "team@ubig.co.id",
        message: "Weekly time tracking report attached.",
        fileType: "pdf",
        dateRange: "last-week",
        frequency: "weekly",
        deliveryTime: "09:00",
        deliveryDays: ["Mo"]
    },
    {
        id: "cr-2",
        name: "Daily Totals Summary",
        type: "Daily Totals",
        lastModified: "Fri, Jan 23, 2026 4:30 pm",
        scheduleDetails: "Daily | Mon-Fri | CSV",
        scheduleMeta: "Daily | Mon-Fri | CSV",
        nextSchedule: "Next: Tue, Jan 27, 2026 8:00 am",
        status: "Active",
        emails: "finance@ubig.co.id",
        message: "Daily totals overview attached.",
        fileType: "csv",
        dateRange: "last-week",
        frequency: "daily",
        deliveryTime: "08:00",
        deliveryDays: ["Mo", "Tu", "We", "Th", "Fr"]
    },
    {
        id: "cr-3",
        name: "Monthly Payments Report",
        type: "Payments",
        lastModified: "Jan 1, 2026 10:00 am",
        scheduleDetails: "Monthly | 1st | PDF",
        scheduleMeta: "Monthly | 1st | PDF",
        nextSchedule: "Next: Sun, Feb 1, 2026 9:00 am",
        status: "Paused",
        emails: "hr@ubig.co.id",
        message: "Monthly payments report.",
        fileType: "pdf",
        dateRange: "last-month",
        frequency: "monthly",
        deliveryTime: "09:00",
        deliveryDays: ["Mo"]
    },
    {
        id: "cr-4",
        name: "Weekly Team Activity",
        type: "Time & Activity",
        lastModified: "Thu, Jan 22, 2026 2:15 pm",
        scheduleDetails: "Weekly | Fri | CSV",
        scheduleMeta: "Weekly | Fri | CSV",
        nextSchedule: "Next: Fri, Jan 30, 2026 5:00 pm",
        status: "Active",
        emails: "managers@ubig.co.id",
        message: "Weekly team activity breakdown.",
        fileType: "csv",
        dateRange: "last-week",
        frequency: "weekly",
        deliveryTime: "17:00",
        deliveryDays: ["Fr"]
    },
    {
        id: "cr-5",
        name: "Custom Project Hours",
        type: "Custom",
        lastModified: "Wed, Jan 21, 2026 9:30 am",
        scheduleDetails: "One-time | Jan 31 | PDF",
        scheduleMeta: "One-time | Jan 31 | PDF",
        nextSchedule: "Next: Fri, Jan 31, 2026 6:00 pm",
        status: "Active",
        emails: "client@example.com",
        message: "Custom project hours report for Q1.",
        fileType: "pdf",
        dateRange: "custom",
        frequency: "monthly",
        deliveryTime: "18:00",
        deliveryDays: ["Fr"]
    },
    {
        id: "cr-6",
        name: "Bi-weekly Payroll",
        type: "Payments",
        lastModified: "Mon, Jan 19, 2026 3:45 pm",
        scheduleDetails: "Weekly | Mon, Thu | CSV",
        scheduleMeta: "Weekly | Mon, Thu | CSV",
        nextSchedule: "Next: Thu, Jan 29, 2026 10:00 am",
        status: "Active",
        emails: "payroll@ubig.co.id",
        message: "Bi-weekly payroll summary.",
        fileType: "csv",
        dateRange: "last-week",
        frequency: "weekly",
        deliveryTime: "10:00",
        deliveryDays: ["Mo", "Th"]
    },
    {
        id: "cr-7",
        name: "Daily Attendance Check",
        type: "Daily Totals",
        lastModified: "Sun, Jan 18, 2026 11:20 am",
        scheduleDetails: "Daily | Every day | PDF",
        scheduleMeta: "Daily | Every day | PDF",
        nextSchedule: "Next: Tue, Jan 27, 2026 7:00 am",
        status: "Paused",
        emails: "attendance@ubig.co.id",
        message: "Daily attendance verification.",
        fileType: "pdf",
        dateRange: "last-week",
        frequency: "daily",
        deliveryTime: "07:00",
        deliveryDays: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
    },
    {
        id: "cr-8",
        name: "Monthly Performance Review",
        type: "Custom",
        lastModified: "Sat, Jan 17, 2026 8:00 am",
        scheduleDetails: "Monthly | Last day | PDF",
        scheduleMeta: "Monthly | Last day | PDF",
        nextSchedule: "Next: Fri, Jan 31, 2026 11:59 pm",
        status: "Active",
        emails: "hr@ubig.co.id, managers@ubig.co.id",
        message: "Monthly performance metrics and review.",
        fileType: "pdf",
        dateRange: "last-month",
        frequency: "monthly",
        deliveryTime: "23:59",
        deliveryDays: ["Fr"]
    }
]

// ============================================================================
// TIMESHEET APPROVALS
// ============================================================================



// ============================================================================
// EXPENSES
// ============================================================================

export const EXPENSE_CATEGORIES: Record<string, string> = {
    travel: 'Travel',
    equipment: 'Equipment',
    software: 'Software',
    meals: 'Meals',
    office: 'Office',
    other: 'Other'
}

export interface ExpenseEntry {
    id: string
    memberId: string
    memberName: string
    projectId: string
    projectName: string
    category: keyof typeof EXPENSE_CATEGORIES
    description: string
    amount: number
    currency: string
    date: string
    status: 'pending' | 'approved' | 'rejected' | 'reimbursed'
    receiptUrl?: string
}

export const DUMMY_EXPENSES: ExpenseEntry[] = [
    { id: 'exp-1', memberId: 'm1', memberName: 'Antonio Galih', projectId: '1', projectName: 'Website Redesign', category: 'software', description: 'Adobe Creative Cloud subscription', amount: 850000, currency: 'IDR', date: '2026-01-15', status: 'approved', receiptUrl: 'https://example.com/receipt1.pdf' },
    { id: 'exp-2', memberId: 'm2', memberName: 'Lave Lavael', projectId: '2', projectName: 'Mobile App Development', category: 'equipment', description: 'External monitor', amount: 3500000, currency: 'IDR', date: '2026-01-18', status: 'pending' },
    { id: 'exp-3', memberId: 'm3', memberName: 'Sarah Johnson', projectId: '1', projectName: 'Website Redesign', category: 'travel', description: 'Client meeting transportation', amount: 250000, currency: 'IDR', date: '2026-01-20', status: 'reimbursed', receiptUrl: 'https://example.com/receipt3.jpg' },
    { id: 'exp-4', memberId: 'm4', memberName: 'Michael Chen', projectId: '3', projectName: 'Marketing Campaign', category: 'meals', description: 'Team lunch meeting', amount: 450000, currency: 'IDR', date: '2026-01-19', status: 'approved', receiptUrl: 'https://example.com/receipt4.png' },
    { id: 'exp-5', memberId: 'm5', memberName: 'Emma Rodriguez', projectId: '2', projectName: 'Mobile App Development', category: 'software', description: 'Testing tools license', amount: 1200000, currency: 'IDR', date: '2026-01-22', status: 'pending' },
    { id: 'exp-6', memberId: 'm1', memberName: 'Antonio Galih', projectId: '4', projectName: 'API Integration', category: 'office', description: 'Office supplies', amount: 150000, currency: 'IDR', date: '2026-01-21', status: 'rejected' },
]


// ============================================================================
// WORK BREAKS
// ============================================================================

export interface BreakEntry {
    id: string
    memberId: string
    memberName: string
    projectId?: string
    projectName?: string
    startTime: string // HH:mm
    endTime: string // HH:mm
    duration: string // e.g. "30 mins", "1 hr" (This can act as Actual)
    date: string // YYYY-MM-DD
    type: 'Lunch' | 'Coffee' | 'Personal' | 'Other'
    policy: string
    status: 'Compliant' | 'Violation'
    allottedDuration: number // hours
    actualDuration: number // hours (derived from duration string usually, but explicit here for table)
    paidDuration: number // hours
}

export const DUMMY_BREAKS: BreakEntry[] = [
    { id: 'brk-1', memberId: 'm1', memberName: 'Antonio Galih', projectId: '1', projectName: 'Website Redesign', startTime: '12:00', endTime: '13:00', duration: '1 hr', date: '2026-01-20', type: 'Lunch', policy: 'Standard Lunch', status: 'Compliant', allottedDuration: 1, actualDuration: 1, paidDuration: 0 },
    { id: 'brk-2', memberId: 'm2', memberName: 'Lave Lavael', projectId: '2', projectName: 'Mobile App', startTime: '10:00', endTime: '10:15', duration: '15 mins', date: '2026-01-20', type: 'Coffee', policy: 'Morning Break', status: 'Compliant', allottedDuration: 0.25, actualDuration: 0.25, paidDuration: 0.25 },
    { id: 'brk-3', memberId: 'm3', memberName: 'Sarah Johnson', projectId: '1', projectName: 'Website Redesign', startTime: '12:30', endTime: '13:30', duration: '1 hr', date: '2026-01-20', type: 'Lunch', policy: 'Standard Lunch', status: 'Compliant', allottedDuration: 1, actualDuration: 1, paidDuration: 0 },
    { id: 'brk-4', memberId: 'm1', memberName: 'Antonio Galih', projectId: '1', projectName: 'Website Redesign', startTime: '15:30', endTime: '15:45', duration: '15 mins', date: '2026-01-20', type: 'Coffee', policy: 'Afternoon Break', status: 'Compliant', allottedDuration: 0.25, actualDuration: 0.25, paidDuration: 0.25 },
    { id: 'brk-5', memberId: 'm4', memberName: 'Michael Chen', projectId: '3', projectName: 'Marketing', startTime: '12:15', endTime: '13:15', duration: '1 hr', date: '2026-01-21', type: 'Lunch', policy: 'Standard Lunch', status: 'Compliant', allottedDuration: 1, actualDuration: 1, paidDuration: 0 },
    { id: 'brk-6', memberId: 'm5', memberName: 'Emma Rodriguez', projectId: '2', projectName: 'Mobile App', startTime: '11:00', endTime: '11:20', duration: '20 mins', date: '2026-01-21', type: 'Personal', policy: 'Flexible', status: 'Violation', allottedDuration: 0.25, actualDuration: 0.33, paidDuration: 0 },
]

// ============================================================================
// AUDIT LOG
// ============================================================================

export type AuditAction =
    | 'accepted invite' | 'added' | 'approved' | 'archived' | 'created'
    | 'deleted' | 'denied' | 'duplicated' | 'enabled' | 'merge failed'
    | 'merged' | 'opened' | 'removed' | 'restored' | 'send email'
    | 'submitted' | 'transfered' | 'unsubmit' | 'updated'

export interface AuditLogEntry {
    id: string
    date: string // ISO string "YYYY-MM-DD"
    time: string // "HH:mm:ss am/pm"
    author: {
        name: string
        avatar?: string
        initials: string
        color: string
    }
    action: AuditAction
    object: string
    members?: {
        name: string
        avatar?: string
        initials: string
        color: string
    }[]
    details: string
}

export const DUMMY_AUDIT_LOGS: AuditLogEntry[] = [
    {
        id: '#LOG-2026-001',
        date: '2026-01-30',
        time: '09:15:22 am',
        author: { name: 'Antonio Galih', initials: 'AG', color: 'bg-slate-500' },
        action: 'created',
        object: 'Client',
        details: 'New client "Tech Solutions Inc." registered',
    },
    {
        id: '#LOG-2026-002',
        date: '2026-01-30',
        time: '09:10:05 am',
        author: { name: 'Antonio Galih', initials: 'AG', color: 'bg-slate-500' },
        action: 'added',
        object: 'Project',
        details: 'Project "Mobile App Revamp" assigned to "Tech Solutions Inc."',
    },
    {
        id: '#LOG-2026-003',
        date: '2026-01-29',
        time: '4:45:10 pm',
        author: { name: 'Sarah Johnson', initials: 'SJ', color: 'bg-gray-500' },
        action: 'approved',
        object: 'Timesheet',
        details: 'Approved timesheet for week Jan 19-25',
    },
    {
        id: '#LOG-2026-004',
        date: '2026-01-29',
        time: '2:30:00 pm',
        author: { name: 'Lave Lavael', initials: 'LL', color: 'bg-slate-500' },
        action: 'deleted',
        object: 'Expense',
        details: 'Removed duplicate expense entry #EXP-2024-001',
    },
    {
        id: '#LOG-2026-005',
        date: '2026-01-28',
        time: '11:20:15 am',
        author: { name: 'Emma Rodriguez', initials: 'ER', color: 'bg-slate-500' },
        action: 'updated',
        object: 'Team',
        members: [
            { name: 'Michael Chen', initials: 'MC', color: 'bg-slate-500' }
        ],
        details: 'Role changed to "Team Lead" for "Marketing" squad',
    },
    {
        id: '#LOG-2026-006',
        date: '2026-01-28',
        time: '10:05:44 am',
        author: { name: 'Emma Rodriguez', initials: 'ER', color: 'bg-slate-500' },
        action: 'added',
        object: 'Team',
        members: [
            { name: 'Michael Chen', initials: 'MC', color: 'bg-slate-500' },
            { name: 'Lave Lavael', initials: 'LL', color: 'bg-slate-500' }
        ],
        details: 'Added members to "Marketing" squad',
    },
    {
        id: '#LOG-2026-007',
        date: '2026-01-27',
        time: '3:15:30 pm',
        author: { name: 'Michael Chen', initials: 'MC', color: 'bg-slate-500' },
        action: 'updated',
        object: 'Policy',
        details: 'Updated "Remote Work" policy description',
    },
    {
        id: '#LOG-2026-008',
        date: '2026-01-27',
        time: '1:00:00 pm',
        author: { name: 'Antonio Galih', initials: 'AG', color: 'bg-slate-500' },
        action: 'created',
        object: 'Report',
        details: 'Generated "Monthly Financial Summary" report',
    },
    {
        id: '#LOG-2026-009',
        date: '2026-01-26',
        time: '08:30:00 am',
        author: { name: 'Lave Lavael', initials: 'LL', color: 'bg-slate-500' },
        action: 'accepted invite',
        object: 'Organization',
        details: 'Accepted invitation to join "UBIG" organization',
    },
    {
        id: '#LOG-2026-010',
        date: '2026-01-26',
        time: '14:20:00 pm',
        author: { name: 'Antonio Galih', initials: 'AG', color: 'bg-slate-500' },
        action: 'denied',
        object: 'Timesheet',
        details: 'Denied overtime request for "Lave Lavael"',
    },
    {
        id: '#LOG-2026-011',
        date: '2026-01-25',
        time: '16:00:00 pm',
        author: { name: 'Sarah Johnson', initials: 'SJ', color: 'bg-gray-500' },
        action: 'submitted',
        object: 'Invoice',
        details: 'Submitted invoice #INV-2026-001 for approval',
    },
    {
        id: '#LOG-2026-012',
        date: '2026-01-25',
        time: '17:00:00 pm',
        author: { name: 'Sarah Johnson', initials: 'SJ', color: 'bg-gray-500' },
        action: 'unsubmit',
        object: 'Invoice',
        details: 'Unsubmitted invoice #INV-2026-001 for correction',
    },
    {
        id: '#LOG-2026-013',
        date: '2026-01-24',
        time: '10:00:00 am',
        author: { name: 'Antonio Galih', initials: 'AG', color: 'bg-slate-500' },
        action: 'archived',
        object: 'Project',
        details: 'Archived "Legacy Website" project',
    },
    {
        id: '#LOG-2026-014',
        date: '2026-01-24',
        time: '11:00:00 am',
        author: { name: 'Antonio Galih', initials: 'AG', color: 'bg-slate-500' },
        action: 'restored',
        object: 'Project',
        details: 'Restored "Legacy Website" project',
    },
    {
        id: '#LOG-2026-015',
        date: '2026-01-23',
        time: '09:00:00 am',
        author: { name: 'Antonio Galih', initials: 'AG', color: 'bg-slate-500' },
        action: 'enabled',
        object: 'Feature',
        details: 'Enabled "Insights" feature',
    },
    {
        id: '#LOG-2026-016',
        date: '2026-01-23',
        time: '09:05:00 am',
        author: { name: 'Antonio Galih', initials: 'AG', color: 'bg-slate-500' },
        action: 'transfered',
        object: 'Project',
        details: 'Transferred "Mobile App" project to "Tech Corp"',
    }
]





// ============================================================================
// WEEKLY/DAILY LIMITS
// ============================================================================

export interface MemberLimit {
    id: string
    memberId: string
    memberName: string
    weeklyLimit: number
    dailyLimit: number
    weeklyUsed: number
    dailyUsed: number
    date: string
}

export const DUMMY_MEMBER_LIMITS: MemberLimit[] = [
    { id: 'lim-1', memberId: 'm1', memberName: 'Antonio Galih', weeklyLimit: 40, dailyLimit: 8, weeklyUsed: 38.5, dailyUsed: 7.5, date: '2026-01-21' },
    { id: 'lim-2', memberId: 'm2', memberName: 'Lave Lavael', weeklyLimit: 40, dailyLimit: 8, weeklyUsed: 42.0, dailyUsed: 9.0, date: '2026-01-21' },
    { id: 'lim-3', memberId: 'm3', memberName: 'Sarah Johnson', weeklyLimit: 45, dailyLimit: 9, weeklyUsed: 44.0, dailyUsed: 8.5, date: '2026-01-21' },
    { id: 'lim-4', memberId: 'm4', memberName: 'Michael Chen', weeklyLimit: 40, dailyLimit: 8, weeklyUsed: 35.0, dailyUsed: 6.0, date: '2026-01-21' },
    { id: 'lim-5', memberId: 'm5', memberName: 'Emma Rodriguez', weeklyLimit: 35, dailyLimit: 7, weeklyUsed: 33.0, dailyUsed: 7.0, date: '2026-01-21' },
]

// ============================================================================
// TIME OFF BALANCES
// ============================================================================

export interface TimeOffBalance {
    id: string
    memberId: string
    memberName: string
    policyName: string
    accrued: number
    used: number
    pending: number
    balance: number
    unit: 'days' | 'hours'
}

export const DUMMY_TIME_OFF_BALANCES: TimeOffBalance[] = [
    { id: 'tob-1', memberId: 'm1', memberName: 'Antonio Galih', policyName: 'Annual Leave', accrued: 12, used: 3, pending: 1, balance: 8, unit: 'days' },
    { id: 'tob-2', memberId: 'm1', memberName: 'Antonio Galih', policyName: 'Sick Leave', accrued: 10, used: 1, pending: 0, balance: 9, unit: 'days' },
    { id: 'tob-3', memberId: 'm2', memberName: 'Lave Lavael', policyName: 'Annual Leave', accrued: 12, used: 5, pending: 0, balance: 7, unit: 'days' },
    { id: 'tob-4', memberId: 'm2', memberName: 'Lave Lavael', policyName: 'Sick Leave', accrued: 10, used: 2, pending: 0, balance: 8, unit: 'days' },
    { id: 'tob-5', memberId: 'm3', memberName: 'Sarah Johnson', policyName: 'Annual Leave', accrued: 15, used: 2, pending: 2, balance: 11, unit: 'days' },
    { id: 'tob-6', memberId: 'm4', memberName: 'Michael Chen', policyName: 'Annual Leave', accrued: 12, used: 0, pending: 0, balance: 12, unit: 'days' },
    { id: 'tob-7', memberId: 'm5', memberName: 'Emma Rodriguez', policyName: 'Annual Leave', accrued: 10, used: 4, pending: 1, balance: 5, unit: 'days' },
]

// ============================================================================
// INVOICES
// ============================================================================

export interface Invoice {
    id: string
    invoiceNumber: string
    type: 'client' | 'team'
    entityId: string
    entityName: string
    amount: number
    currency: string
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
    issueDate: string
    dueDate: string
    paidDate?: string
    items: { description: string; hours: number; rate: number; amount: number }[]
}

export const DUMMY_INVOICES: Invoice[] = [
    { id: 'inv-1', invoiceNumber: 'INV-2026-001', type: 'client', entityId: 'client-1', entityName: 'Patricia', amount: 15000000, currency: 'IDR', status: 'paid', issueDate: '2026-01-01', dueDate: '2026-01-15', paidDate: '2026-01-12', items: [{ description: 'Website Development', hours: 80, rate: 150000, amount: 12000000 }, { description: 'Design Services', hours: 20, rate: 150000, amount: 3000000 }] },
    { id: 'inv-2', invoiceNumber: 'INV-2026-002', type: 'client', entityId: 'client-2', entityName: 'Tech Corp', amount: 25000000, currency: 'IDR', status: 'sent', issueDate: '2026-01-15', dueDate: '2026-01-30', items: [{ description: 'Mobile App Development', hours: 120, rate: 180000, amount: 21600000 }, { description: 'QA Testing', hours: 20, rate: 170000, amount: 3400000 }] },
    { id: 'inv-3', invoiceNumber: 'INV-2026-003', type: 'client', entityId: 'client-3', entityName: 'Creative Agency', amount: 8500000, currency: 'IDR', status: 'overdue', issueDate: '2025-12-15', dueDate: '2025-12-30', items: [{ description: 'Marketing Campaign', hours: 50, rate: 170000, amount: 8500000 }] },
    { id: 'inv-4', invoiceNumber: 'TM-2026-001', type: 'team', entityId: 'm1', entityName: 'Antonio Galih', amount: 6500000, currency: 'IDR', status: 'paid', issueDate: '2026-01-01', dueDate: '2026-01-10', paidDate: '2026-01-08', items: [{ description: 'January Week 1', hours: 42, rate: 155000, amount: 6500000 }] },
    { id: 'inv-5', invoiceNumber: 'TM-2026-002', type: 'team', entityId: 'm2', entityName: 'Lave Lavael', amount: 5800000, currency: 'IDR', status: 'sent', issueDate: '2026-01-15', dueDate: '2026-01-25', items: [{ description: 'January Week 2', hours: 40, rate: 145000, amount: 5800000 }] },
    { id: 'inv-6', invoiceNumber: 'TM-2026-003', type: 'team', entityId: 'm3', entityName: 'Sarah Johnson', amount: 7200000, currency: 'IDR', status: 'draft', issueDate: '2026-01-20', dueDate: '2026-01-30', items: [{ description: 'January Week 3', hours: 45, rate: 160000, amount: 7200000 }] },
]

// ============================================================================
// SHIFT ATTENDANCE
// ============================================================================

export interface ShiftAttendance {
    id: string
    memberId: string
    memberName: string
    shiftDate: string
    scheduledStart: string
    scheduledEnd: string
    actualStart?: string
    actualEnd?: string
    status: 'completed' | 'late' | 'early_leave' | 'missed' | 'upcoming'
    lateMinutes?: number
    earlyLeaveMinutes?: number
}

export const DUMMY_SHIFT_ATTENDANCE: ShiftAttendance[] = [
    { id: 'shift-1', memberId: 'm1', memberName: 'Antonio Galih', shiftDate: '2026-01-21', scheduledStart: '08:00', scheduledEnd: '17:00', actualStart: '07:55', actualEnd: '17:05', status: 'completed' },
    { id: 'shift-2', memberId: 'm2', memberName: 'Lave Lavael', shiftDate: '2026-01-21', scheduledStart: '09:00', scheduledEnd: '18:00', actualStart: '09:25', actualEnd: '18:00', status: 'late', lateMinutes: 25 },
    { id: 'shift-3', memberId: 'm3', memberName: 'Sarah Johnson', shiftDate: '2026-01-21', scheduledStart: '08:00', scheduledEnd: '17:00', actualStart: '08:00', actualEnd: '16:30', status: 'early_leave', earlyLeaveMinutes: 30 },
    { id: 'shift-4', memberId: 'm4', memberName: 'Michael Chen', shiftDate: '2026-01-21', scheduledStart: '10:00', scheduledEnd: '19:00', status: 'missed' },
    { id: 'shift-5', memberId: 'm5', memberName: 'Emma Rodriguez', shiftDate: '2026-01-21', scheduledStart: '08:00', scheduledEnd: '17:00', actualStart: '08:02', actualEnd: '17:10', status: 'completed' },
    { id: 'shift-6', memberId: 'm1', memberName: 'Antonio Galih', shiftDate: '2026-01-22', scheduledStart: '08:00', scheduledEnd: '17:00', status: 'upcoming' },
]

// ============================================================================
// JOB SITE VISITS
// ============================================================================

export interface JobSiteVisit {
    id: string
    memberId: string
    memberName: string
    siteName: string
    siteAddress: string
    entryTime: string
    exitTime?: string
    duration?: number
    date: string
    projectId?: string
    projectName?: string
}

export const DUMMY_JOB_SITE_VISITS: JobSiteVisit[] = [
    { id: 'visit-1', memberId: 'm1', memberName: 'Antonio Galih', siteName: 'Client Office - Patricia', siteAddress: '123 Main St, Jakarta', entryTime: '09:00', exitTime: '12:30', duration: 210, date: '2026-01-21', projectId: '1', projectName: 'Website Redesign' },
    { id: 'visit-2', memberId: 'm3', memberName: 'Sarah Johnson', siteName: 'Tech Corp HQ', siteAddress: '456 Technology Blvd, Surabaya', entryTime: '10:00', exitTime: '15:00', duration: 300, date: '2026-01-21', projectId: '2', projectName: 'Mobile App Development' },
    { id: 'visit-3', memberId: 'm2', memberName: 'Lave Lavael', siteName: 'Creative Agency Studio', siteAddress: '789 Design Ave, Bandung', entryTime: '14:00', exitTime: '17:30', duration: 210, date: '2026-01-20', projectId: '3', projectName: 'Marketing Campaign' },
    { id: 'visit-4', memberId: 'm4', memberName: 'Michael Chen', siteName: 'Startup Inc Office', siteAddress: '321 Innovation Street, Bali', entryTime: '08:30', exitTime: '11:00', duration: 150, date: '2026-01-20' },
    { id: 'visit-5', memberId: 'm5', memberName: 'Emma Rodriguez', siteName: 'Client Office - Patricia', siteAddress: '123 Main St, Jakarta', entryTime: '13:00', date: '2026-01-21', projectId: '1', projectName: 'Website Redesign' },
]

// ============================================================================
// WORK BREAKS (derived from dashboard activities)
// ============================================================================

export interface WorkBreak {
    id: string
    memberId: string
    memberName: string
    date: string
    breakStart: string
    breakEnd: string
    duration: number
    breakType: 'lunch' | 'short' | 'other'
}

export const DUMMY_WORK_BREAKS: WorkBreak[] = [
    { id: 'break-1', memberId: 'm1', memberName: 'Antonio Galih', date: '2026-01-21', breakStart: '12:00', breakEnd: '13:00', duration: 60, breakType: 'lunch' },
    { id: 'break-2', memberId: 'm1', memberName: 'Antonio Galih', date: '2026-01-21', breakStart: '15:30', breakEnd: '15:45', duration: 15, breakType: 'short' },
    { id: 'break-3', memberId: 'm2', memberName: 'Lave Lavael', date: '2026-01-21', breakStart: '12:30', breakEnd: '13:30', duration: 60, breakType: 'lunch' },
    { id: 'break-4', memberId: 'm3', memberName: 'Sarah Johnson', date: '2026-01-21', breakStart: '12:00', breakEnd: '12:45', duration: 45, breakType: 'lunch' },
    { id: 'break-5', memberId: 'm4', memberName: 'Michael Chen', date: '2026-01-21', breakStart: '13:00', breakEnd: '14:00', duration: 60, breakType: 'lunch' },
    { id: 'break-6', memberId: 'm4', memberName: 'Michael Chen', date: '2026-01-21', breakStart: '16:00', breakEnd: '16:20', duration: 20, breakType: 'short' },
    { id: 'break-7', memberId: 'm5', memberName: 'Emma Rodriguez', date: '2026-01-21', breakStart: '12:15', breakEnd: '13:00', duration: 45, breakType: 'lunch' },
]

// ============================================================================
// WORK SESSIONS (derived from dashboard activities)
// ============================================================================

export interface WorkSession {
    id: string
    memberId: string
    memberName: string
    date: string
    startTime: string
    endTime: string
    duration: number
    session?: string
    projectId?: string
    projectName?: string
    clientName?: string
    todo?: string
    manualPercentage?: number
    activityPercentage?: number
}

export const DUMMY_WORK_SESSIONS: WorkSession[] = [
    { id: 'session-1', memberId: 'm1', memberName: 'Antonio Galih', date: '2026-01-21', startTime: '08:00', endTime: '12:00', duration: 240, session: 'Morning', projectId: '1', projectName: 'Website Redesign', clientName: 'TechCorp', todo: 'Design Review', manualPercentage: 0, activityPercentage: 85 },
    { id: 'session-2', memberId: 'm1', memberName: 'Antonio Galih', date: '2026-01-21', startTime: '13:00', endTime: '17:30', duration: 270, session: 'Afternoon', projectId: '1', projectName: 'Website Redesign', clientName: 'TechCorp', todo: 'Implementation', manualPercentage: 0, activityPercentage: 78 },
    { id: 'session-3', memberId: 'm2', memberName: 'Lave Lavael', date: '2026-01-21', startTime: '09:25', endTime: '12:30', duration: 185, session: 'Morning', projectId: '2', projectName: 'Mobile App Development', clientName: 'StartupInc', todo: 'API Integration', manualPercentage: 5, activityPercentage: 92 },
    { id: 'session-4', memberId: 'm2', memberName: 'Lave Lavael', date: '2026-01-21', startTime: '13:30', endTime: '18:00', duration: 270, session: 'Afternoon', projectId: '2', projectName: 'Mobile App Development', clientName: 'StartupInc', todo: 'Testing', manualPercentage: 0, activityPercentage: 88 },
    { id: 'session-5', memberId: 'm3', memberName: 'Sarah Johnson', date: '2026-01-21', startTime: '08:00', endTime: '12:00', duration: 240, session: 'Morning', projectId: '3', projectName: 'Marketing Campaign', clientName: 'GrowthLtd', todo: 'Content Strategy', manualPercentage: 0, activityPercentage: 65 },
    { id: 'session-6', memberId: 'm3', memberName: 'Sarah Johnson', date: '2026-01-21', startTime: '12:45', endTime: '16:30', duration: 225, session: 'Afternoon', projectId: '3', projectName: 'Marketing Campaign', clientName: 'GrowthLtd', todo: 'Ad Setup', manualPercentage: 10, activityPercentage: 70 },
    { id: 'session-7', memberId: 'm5', memberName: 'Emma Rodriguez', date: '2026-01-21', startTime: '08:02', endTime: '12:15', duration: 253, session: 'Morning', projectId: '4', projectName: 'API Integration', clientName: 'FinTech', todo: 'Documentation', manualPercentage: 0, activityPercentage: 95 },
    { id: 'session-8', memberId: 'm5', memberName: 'Emma Rodriguez', date: '2026-01-21', startTime: '13:00', endTime: '17:10', duration: 250, session: 'Afternoon', projectId: '4', projectName: 'API Integration', clientName: 'FinTech', todo: 'Debugging', manualPercentage: 0, activityPercentage: 91 },
]

// ============================================================================
// PROJECT BUDGETS
// ============================================================================

export interface ProjectBudget {
    id: string
    projectId: string
    projectName: string
    clientName: string
    totalBudget: number
    spentBudget: number
    remainingBudget: number
    currency: string
    status: 'on_track' | 'at_risk' | 'over_budget'
    progress: number
    lastUpdated: string
}

export const DUMMY_PROJECT_BUDGETS: ProjectBudget[] = [
    {
        id: 'pb-1',
        projectId: '1',
        projectName: 'Website Redesign',
        clientName: 'Patricia',
        totalBudget: 10000,
        spentBudget: 6500,
        remainingBudget: 3500,
        currency: 'USD',
        status: 'on_track',
        progress: 65,
        lastUpdated: '2026-01-21'
    },
    {
        id: 'pb-2',
        projectId: '2',
        projectName: 'Mobile App Development',
        clientName: 'Tech Corp',
        totalBudget: 25000,
        spentBudget: 15000,
        remainingBudget: 10000,
        currency: 'USD',
        status: 'on_track',
        progress: 60,
        lastUpdated: '2026-01-21'
    },
    {
        id: 'pb-3',
        projectId: '3',
        projectName: 'Marketing Campaign',
        clientName: 'Patricia',
        totalBudget: 5000,
        spentBudget: 4800,
        remainingBudget: 200,
        currency: 'USD',
        status: 'at_risk',
        progress: 96,
        lastUpdated: '2026-01-21'
    },
    {
        id: 'pb-4',
        projectId: '4',
        projectName: 'Old Website',
        clientName: 'Patricia',
        totalBudget: 5000,
        spentBudget: 5200,
        remainingBudget: -200,
        currency: 'USD',
        status: 'over_budget',
        progress: 104,
        lastUpdated: '2024-12-01'
    }
]

// ============================================================================
// CLIENT BUDGETS
// ============================================================================

export interface ClientBudget {
    id: string
    clientId: string
    clientName: string
    totalBudget: number
    spentBudget: number
    remainingBudget: number
    currency: string
    projectCount: number
    status: 'on_track' | 'at_risk' | 'over_budget'
    progress: number
    lastUpdated: string
}

export const DUMMY_CLIENT_BUDGETS: ClientBudget[] = [
    {
        id: 'cb-1',
        clientId: 'client-1',
        clientName: 'Patricia',
        totalBudget: 50000,
        spentBudget: 11300,
        remainingBudget: 38700,
        currency: 'USD',
        projectCount: 3,
        status: 'on_track',
        progress: 22.6,
        lastUpdated: '2026-01-21'
    },
    {
        id: 'cb-2',
        clientId: 'client-2',
        clientName: 'Tech Corp',
        totalBudget: 150000, // $50k/mo * 3 months projection
        spentBudget: 15000,
        remainingBudget: 135000,
        currency: 'USD',
        projectCount: 1,
        status: 'on_track',
        progress: 10,
        lastUpdated: '2026-01-21'
    },
    {
        id: 'cb-3',
        clientId: 'client-3',
        clientName: 'Creative Agency',
        totalBudget: 45000,
        spentBudget: 25000,
        remainingBudget: 20000,
        currency: 'USD',
        projectCount: 2,
        status: 'on_track',
        progress: 55.5,
        lastUpdated: '2026-01-21'
    },
    {
        id: 'cb-4',
        clientId: 'client-4',
        clientName: 'Startup Inc',
        totalBudget: 15000,
        spentBudget: 20000,
        remainingBudget: -5000,
        currency: 'USD',
        projectCount: 1,
        status: 'over_budget',
        progress: 133.3,
        lastUpdated: '2026-01-21'
    }
]

// ============================================================================
// AMOUNTS OWED
// ============================================================================

export interface AmountsOwedData {
    id: string
    memberId: string
    name: string
    email: string
    team: string
    hourlyRate: number
    currency: string
    regularHours: number
    overtimeHours: number
    totalHours: number
    amountOwed: number
    paymentStatus: 'Unpaid' | 'Paid' | 'Processing'
}

export const DUMMY_AMOUNTS_OWED: AmountsOwedData[] = [
    { id: 'ao-1', memberId: 'm1', name: 'Antonio Galih', email: 'antonio@example.com', team: 'Team Alpha', hourlyRate: 150000, currency: 'IDR', regularHours: 160, overtimeHours: 5, totalHours: 165, amountOwed: 25500000, paymentStatus: 'Unpaid' },
    { id: 'ao-2', memberId: 'm2', name: 'Lave Lavael', email: 'lave@example.com', team: 'Team Alpha', hourlyRate: 140000, currency: 'IDR', regularHours: 155, overtimeHours: 0, totalHours: 155, amountOwed: 21700000, paymentStatus: 'Processing' },
    { id: 'ao-3', memberId: 'm3', name: 'Sarah Johnson', email: 'sarah@example.com', team: 'Team Alpha', hourlyRate: 160000, currency: 'IDR', regularHours: 160, overtimeHours: 10, totalHours: 170, amountOwed: 28800000, paymentStatus: 'Paid' },
    { id: 'ao-4', memberId: 'm4', name: 'Michael Chen', email: 'michael@example.com', team: 'Team Beta', hourlyRate: 130000, currency: 'IDR', regularHours: 140, overtimeHours: 2, totalHours: 142, amountOwed: 18720000, paymentStatus: 'Unpaid' },
    { id: 'ao-5', memberId: 'm5', name: 'Emma Rodriguez', email: 'emma@example.com', team: 'Team Beta', hourlyRate: 135000, currency: 'IDR', regularHours: 150, overtimeHours: 0, totalHours: 150, amountOwed: 20250000, paymentStatus: 'Unpaid' },
]

// ============================================================================
// MANUAL TIME EDITS
// ============================================================================

export interface ManualEditEntry {
    id: string
    memberId: string
    memberName: string
    memberAvatar?: string
    projectId: string
    projectName: string
    taskId?: string
    taskName?: string // To-do designation
    action: 'Add' | 'Edit' | 'Delete'
    timeSpan?: string // e.g. "09:00 - 17:00"
    timeChange: string // "0:20:00"
    reason: string
    changedById: string
    changedByName: string
    changedAt: string // ISO string
    date: string // YYYY-MM-DD for grouping
}

export const DUMMY_MANUAL_EDITS: ManualEditEntry[] = [
    {
        id: 'me-1',
        memberId: 'm1',
        memberName: 'Antonio Galih',
        memberAvatar: 'https://i.pravatar.cc/150?u=m1',
        projectId: '1',
        projectName: 'Website Redesign',
        taskId: 't-1',
        taskName: 'Setup repository',
        action: 'Edit',
        timeSpan: '09:00 - 11:30',
        timeChange: '-0:30:00',
        reason: 'Correction of break time',
        changedById: 'm1',
        changedByName: 'Antonio Galih',
        changedAt: '2026-01-21T10:30:00',
        date: '2026-01-21'
    },
    {
        id: 'me-2',
        memberId: 'm2',
        memberName: 'Lave Lavael',
        memberAvatar: 'https://i.pravatar.cc/150?u=m2',
        projectId: '2',
        projectName: 'Mobile App',
        taskId: 't-4',
        taskName: 'API contracts',
        action: 'Add',
        timeSpan: '13:00 - 15:00',
        timeChange: '+2:00:00',
        reason: 'Forgot to track time',
        changedById: 'm2',
        changedByName: 'Lave Lavael',
        changedAt: '2026-01-20T16:00:00',
        date: '2026-01-20'
    },
    {
        id: 'me-3',
        memberId: 'm3',
        memberName: 'Sarah Johnson',
        memberAvatar: 'https://i.pravatar.cc/150?u=m3',
        projectId: '1',
        projectName: 'Website Redesign',
        taskId: 't-3',
        taskName: 'Landing page hero',
        action: 'Delete',
        timeSpan: '10:00 - 11:00',
        timeChange: '-1:00:00',
        reason: 'Duplicate entry',
        changedById: 'm1',
        changedByName: 'Antonio Galih',
        changedAt: '2026-01-19T11:15:00',
        date: '2026-01-19'
    },
    {
        id: 'me-4',
        memberId: 'm4',
        memberName: 'Michael Chen',
        memberAvatar: 'https://i.pravatar.cc/150?u=m4',
        projectId: '3',
        projectName: 'Marketing Campaign',
        taskId: 't-6',
        taskName: 'Campaign brief',
        action: 'Edit',
        timeSpan: '14:00 - 18:00',
        timeChange: '+0:15:00',
        reason: 'Extended work hours',
        changedById: 'm4',
        changedByName: 'Michael Chen',
        changedAt: '2026-01-19T18:30:00',
        date: '2026-01-19'
    },
    {
        id: 'me-5',
        memberId: 'm1',
        memberName: 'Antonio Galih',
        memberAvatar: 'https://i.pravatar.cc/150?u=m1',
        projectId: '1',
        projectName: 'Website Redesign',
        taskId: 't-2',
        taskName: 'Create design system',
        action: 'Add',
        timeSpan: '08:00 - 09:00',
        timeChange: '+1:00:00',
        reason: 'Early morning review',
        changedById: 'm1',
        changedByName: 'Antonio Galih',
        changedAt: '2026-01-18T09:05:00',
        date: '2026-01-18'
    },
    {
        id: 'me-6',
        memberId: 'm2',
        memberName: 'Lave Lavael',
        memberAvatar: 'https://i.pravatar.cc/150?u=m2',
        projectId: '2',
        projectName: 'Mobile App',
        taskId: 't-5',
        taskName: 'Auth flow',
        action: 'Delete',
        timeSpan: '16:00 - 17:00',
        timeChange: '-1:00:00',
        reason: 'Wrong project selected',
        changedById: 'm2',
        changedByName: 'Lave Lavael',
        changedAt: '2026-01-21T17:15:00',
        date: '2026-01-21'
    }
]

// ============================================================================
// PAYMENTS REPORT
// ============================================================================

export interface PaymentEntry {
    id: string;
    member: {
        name: string;
        avatar: string;
        initials: string;
        color: string;
    };
    amount: number;
    method: 'PayPal' | 'Wise' | 'Bank Transfer' | 'Manual';
    type: 'Automatic' | 'Manual';
    date: string; // ISO string
    hours: number;
    rate: number;
    fixedAmount: number;
    ptoAmount: number;
    additions: number;
    deductions: number;
    bonus: number;
    notes: string;
    status: 'Completed' | 'Pending' | 'Failed';
    project?: string;
    projectsBreakdown?: {
        name: string;
        hours: number;
        amount: number;
    }[];
}

export const DUMMY_PAYMENTS: PaymentEntry[] = [
    {
        id: 'pay-1',
        member: { name: 'Antonio Galih', avatar: 'https://i.pravatar.cc/150?u=m1', initials: 'AG', color: 'placeholder' },
        amount: 5000000,
        method: 'PayPal',
        type: 'Automatic',
        date: '2026-01-28T09:00:00Z',
        hours: 40,
        rate: 125000,
        fixedAmount: 0,
        ptoAmount: 0,
        additions: 0,
        deductions: 0,
        bonus: 0,
        notes: 'Weekly payment for Project Alpha',
        status: 'Completed',
        project: 'Website Redesign',
        projectsBreakdown: [
            { name: 'Website Redesign', hours: 25, amount: 3125000 },
            { name: 'Maintenance', hours: 15, amount: 1875000 }
        ]
    },
    {
        id: 'pay-2',
        member: { name: 'Lave Lavael', avatar: 'https://i.pravatar.cc/150?u=m2', initials: 'LL', color: 'placeholder' },
        amount: 3750000,
        method: 'Wise',
        type: 'Automatic',
        date: '2026-01-28T10:00:00Z',
        hours: 30,
        rate: 125000,
        fixedAmount: 0,
        ptoAmount: 0,
        additions: 0,
        deductions: 0,
        bonus: 0,
        notes: 'Mobile app development milestone',
        status: 'Completed',
        project: 'Mobile App',
        projectsBreakdown: [
            { name: 'Mobile App', hours: 30, amount: 3750000 }
        ]
    },
    {
        id: 'pay-3',
        member: { name: 'Sarah Johnson', avatar: 'https://i.pravatar.cc/150?u=m3', initials: 'SJ', color: 'placeholder' },
        amount: 2500000,
        method: 'Bank Transfer',
        type: 'Manual',
        date: '2026-01-27T11:00:00Z',
        hours: 20,
        rate: 125000,
        fixedAmount: 0,
        ptoAmount: 0,
        additions: 0,
        deductions: 0,
        bonus: 0,
        notes: 'Bug fixes and maintenance',
        status: 'Pending',
        project: 'API Integration',
        projectsBreakdown: [
            { name: 'API Integration', hours: 10, amount: 1250000 },
            { name: 'Documentation', hours: 10, amount: 1250000 }
        ]
    },
    {
        id: 'pay-4',
        member: { name: 'Michael Chen', avatar: 'https://i.pravatar.cc/150?u=m4', initials: 'MC', color: 'placeholder' },
        amount: 4500000,
        method: 'Manual',
        type: 'Manual',
        date: '2026-01-26T12:00:00Z',
        hours: 36,
        rate: 125000,
        fixedAmount: 0,
        ptoAmount: 0,
        additions: 0,
        deductions: 0,
        bonus: 0,
        notes: 'Backend refactor sprint',
        status: 'Completed',
        project: 'Backend Refactor',
    },
    {
        id: 'pay-5',
        member: { name: 'Emma Rodriguez', avatar: 'https://i.pravatar.cc/150?u=m5', initials: 'ER', color: 'placeholder' },
        amount: 1500000,
        method: 'PayPal',
        type: 'Automatic',
        date: '2026-01-25T13:00:00Z',
        hours: 12,
        rate: 125000,
        fixedAmount: 0,
        ptoAmount: 0,
        additions: 0,
        deductions: 0,
        bonus: 0,
        notes: 'Design system updates',
        status: 'Failed',
        project: 'Website Redesign',
    },
    {
        id: 'pay-6',
        member: { name: 'Antonio Galih', avatar: 'https://i.pravatar.cc/150?u=m1', initials: 'AG', color: 'placeholder' },
        amount: 2000000,
        method: 'Wise',
        type: 'Automatic',
        date: '2026-01-20T14:00:00Z',
        hours: 16,
        rate: 125000,
        fixedAmount: 0,
        ptoAmount: 0,
        additions: 0,
        deductions: 0,
        bonus: 0,
        notes: 'Consultation fees',
        status: 'Completed',
        project: 'Mobile App',
    },
    {
        id: 'pay-7',
        member: { name: 'Lave Lavael', avatar: 'https://i.pravatar.cc/150?u=m2', initials: 'LL', color: 'placeholder' },
        amount: 3000000,
        method: 'Bank Transfer',
        type: 'Manual',
        date: '2026-01-19T15:00:00Z',
        hours: 24,
        rate: 125000,
        fixedAmount: 0,
        ptoAmount: 0,
        additions: 0,
        deductions: 0,
        bonus: 0,
        notes: 'API documentation',
        status: 'Pending',
        project: 'API Integration',
    },
    {
        id: 'pay-8',
        member: { name: 'Michael Chen', avatar: 'https://i.pravatar.cc/150?u=m4', initials: 'MC', color: 'placeholder' },
        amount: 5000000,
        method: 'Manual',
        type: 'Manual',
        date: '2026-01-18T16:00:00Z',
        hours: 40,
        rate: 125000,
        fixedAmount: 0,
        ptoAmount: 0,
        additions: 0,
        deductions: 0,
        bonus: 0,
        notes: 'Database migration',
        status: 'Completed',
        project: 'Backend Refactor',
    },
    {
        id: 'pay-9',
        member: { name: 'Sarah Johnson', avatar: 'https://i.pravatar.cc/150?u=m3', initials: 'SJ', color: 'placeholder' },
        amount: 1800000,
        method: 'PayPal',
        type: 'Automatic',
        date: '2026-01-15T17:00:00Z',
        hours: 14.4,
        rate: 125000,
        fixedAmount: 0,
        ptoAmount: 0,
        additions: 0,
        deductions: 0,
        bonus: 0,
        notes: 'UI updates',
        status: 'Completed',
        project: 'Website Redesign',
    },
    {
        id: 'pay-10',
        member: { name: 'Emma Rodriguez', avatar: 'https://i.pravatar.cc/150?u=m5', initials: 'ER', color: 'placeholder' },
        amount: 2200000,
        method: 'Wise',
        type: 'Automatic',
        date: '2026-01-15T18:00:00Z',
        hours: 17.6,
        rate: 125000,
        fixedAmount: 0,
        ptoAmount: 0,
        additions: 0,
        deductions: 0,
        bonus: 0,
        notes: 'User testing sessions',
        status: 'Failed',
        project: 'Mobile App',
    },
    {
        id: 'pay-11',
        member: { name: 'Antonio Galih', avatar: 'https://i.pravatar.cc/150?u=m1', initials: 'AG', color: 'placeholder' },
        amount: 3200000,
        method: 'Bank Transfer',
        type: 'Manual',
        date: '2026-01-14T19:00:00Z',
        hours: 25.6,
        rate: 125000,
        fixedAmount: 0,
        ptoAmount: 0,
        additions: 0,
        deductions: 0,
        bonus: 0,
        notes: 'Redesign Phase 1',
        status: 'Completed',
        project: 'Website Redesign',
    },
    {
        id: 'pay-12',
        member: { name: 'Lave Lavael', avatar: 'https://i.pravatar.cc/150?u=m2', initials: 'LL', color: 'placeholder' },
        amount: 2800000,
        method: 'Manual',
        type: 'Manual',
        date: '2026-01-12T20:00:00Z',
        hours: 22.4,
        rate: 125000,
        fixedAmount: 0,
        ptoAmount: 0,
        additions: 0,
        deductions: 0,
        bonus: 0,
        notes: 'App optimization',
        status: 'Pending',
        project: 'Mobile App',
    },
    {
        id: 'pay-13',
        member: { name: 'Michael Chen', avatar: 'https://i.pravatar.cc/150?u=m4', initials: 'MC', color: 'placeholder' },
        amount: 1500000,
        method: 'PayPal',
        type: 'Automatic',
        date: '2026-01-11T21:00:00Z',
        hours: 12,
        rate: 125000,
        fixedAmount: 0,
        ptoAmount: 0,
        additions: 0,
        deductions: 0,
        bonus: 0,
        notes: 'Security patch',
        status: 'Completed',
        project: 'Backend Refactor',
    },
    {
        id: 'pay-14',
        member: { name: 'Sarah Johnson', avatar: 'https://i.pravatar.cc/150?u=m3', initials: 'SJ', color: 'placeholder' },
        amount: 4200000,
        method: 'Wise',
        type: 'Automatic',
        date: '2026-01-10T22:00:00Z',
        hours: 33.6,
        rate: 125000,
        fixedAmount: 0,
        ptoAmount: 0,
        additions: 0,
        deductions: 0,
        bonus: 0,
        notes: 'Frontend overhaul',
        status: 'Completed',
        project: 'Website Redesign',
    },
    {
        id: 'pay-15',
        member: { name: 'Antonio Galih', avatar: 'https://i.pravatar.cc/150?u=m1', initials: 'AG', color: 'placeholder' },
        amount: 3600000,
        method: 'Bank Transfer',
        type: 'Manual',
        date: '2026-01-09T23:00:00Z',
        hours: 28.8,
        rate: 125000,
        fixedAmount: 0,
        ptoAmount: 0,
        additions: 0,
        deductions: 0,
        bonus: 0,
        notes: 'Consultation',
        status: 'Completed',
        project: 'Design System',
    },
];

// ============================================================================
// EXPORT HELPERS FOR ACTIVITY PAGES
// ============================================================================


export function generateMemberAppActivities(memberId: string): AppActivityEntry[] {
    // Return all activities but override memberId to match the requested member
    // To create variety, we can slice different parts of the array based on memberId hash
    // But user asked to just randomize content per member.

    const allActivities = DUMMY_APP_ACTIVITIES;

    // Simple seeded randomization
    const seed = memberId.charCodeAt(memberId.length - 1) || 0;

    // Pick a subset of 5-8 items, wrapping around
    // Filter activities to ONLY use those belonging to this member (or generic ones)
    // This prevents "hans" (m1 project) appearing for "Lave" (m2)
    let memberActivities = allActivities.filter(a => a.memberId === memberId);

    // If no activities found for this member, fallback to all (or empty?)
    // But we added activities for m1-m5, so it should be fine.
    if (memberActivities.length === 0) {
        memberActivities = allActivities; // Fallback to avoid empty state if unknown member
    }

    const today = getDateString(0);
    const yesterday = getDateString(1);

    // We can duplicate the items to create more volume if needed, 
    // or just return the static items with dynamic dates.
    // Let's return the items (randomized order?)

    // Seeded shuffle/sort
    const sorted = [...memberActivities].sort((a, b) => {
        return (seed + a.id.charCodeAt(0)) - (seed + b.id.charCodeAt(0));
    });

    return sorted.map((a, idx) => ({
        ...a,
        memberId: memberId,
        // Keep dynamic date so it shows in default view
        date: (idx + seed) % 3 === 0 ? yesterday : today
    }));
}

export function generateMemberUrlActivities(memberId: string): UrlActivityEntry[] {
    const allActivities = generateUrlActivities();

    // Filter activities to ONLY use those belonging to this member (or generic ones)
    let memberActivities = allActivities.filter(a => a.memberId === memberId);

    // If no activities found for this member, fallback to all (or empty?)
    if (memberActivities.length === 0) {
        memberActivities = allActivities; // Fallback
    }

    // Simple seeded randomization
    const seed = memberId.charCodeAt(memberId.length - 1) || 0;

    // Seeded shuffle/sort
    const sorted = [...memberActivities].sort((a, b) => {
        return (seed + a.id.charCodeAt(0)) - (seed + b.id.charCodeAt(0));
    });

    // We don't need to override date here because generateUrlActivities already has dynamic dates.
    // However, if we fallback to ALL, we might get items for other members.
    // But generateUrlActivities has items for m1, m2, etc.

    return sorted.map(a => ({
        ...a,
        memberId: memberId // Override memberId just in case
    }));
}


// ============================================================================
// WEEKLY LIMITS (NEW)
// ============================================================================

export interface WeeklyLimitEntry {
    id: string
    memberId: string
    memberName: string
    role: string
    weeklyLimit: number
    hoursTracked: number
    weekStartDate: string
    weekEndDate: string
    status: 'Within Limit' | 'Approaching Limit' | 'Exceeded'
}

export const DUMMY_WEEKLY_LIMITS: WeeklyLimitEntry[] = [
    {
        id: 'wl-1',
        memberId: 'm1',
        memberName: 'Antonio Galih',
        role: 'Owner',
        weeklyLimit: 40,
        hoursTracked: 38.5,
        weekStartDate: '2026-02-01',
        weekEndDate: '2026-02-07',
        status: 'Approaching Limit'
    },
    {
        id: 'wl-2',
        memberId: 'm4',
        memberName: 'Michael Chen',
        role: 'Manager',
        weeklyLimit: 40,
        hoursTracked: 42.1,
        weekStartDate: '2026-02-01',
        weekEndDate: '2026-02-07',
        status: 'Exceeded'
    },
    {
        id: 'wl-3',
        memberId: 'm3',
        memberName: 'Sarah Johnson',
        role: 'Member',
        weeklyLimit: 30,
        hoursTracked: 12.4,
        weekStartDate: '2026-02-01',
        weekEndDate: '2026-02-07',
        status: 'Within Limit'
    },
    {
        id: 'wl-4',
        memberId: 'm2',
        memberName: 'Emily Davis',
        role: 'Member',
        weeklyLimit: 20,
        hoursTracked: 5.0,
        weekStartDate: '2026-02-01',
        weekEndDate: '2026-02-07',
        status: 'Within Limit'
    },
    {
        id: 'wl-5',
        memberId: 'm5',
        memberName: 'David Wilson',
        role: 'Member',
        weeklyLimit: 40,
        hoursTracked: 39.8,
        weekStartDate: '2026-02-01',
        weekEndDate: '2026-02-07',
        status: 'Approaching Limit'
    }
];

// ============================================================================
// CLIENT INVOICES
// ============================================================================

export interface ClientInvoice {
    id: string
    invoiceNumber: string
    clientId: string
    clientName: string
    issueDate: string // ISO string
    status: 'Open' | 'Closed' | 'Paid' | 'Void'
    total: number
    paidAmount: number
    amountDue: number
    currency: string
}

export const DUMMY_CLIENT_INVOICES: ClientInvoice[] = [
    {
        id: "inv-001",
        invoiceNumber: "INV-2026-001",
        clientId: "client-1",
        clientName: "Patricia",
        issueDate: "2026-01-05T00:00:00Z",
        status: "Paid",
        total: 5000,
        paidAmount: 5000,
        amountDue: 0,
        currency: "USD"
    },
    {
        id: "inv-002",
        invoiceNumber: "INV-2026-002",
        clientId: "client-2",
        clientName: "Tech Corp",
        issueDate: "2026-01-10T00:00:00Z",
        status: "Open",
        total: 12500,
        paidAmount: 5000,
        amountDue: 7500,
        currency: "USD"
    },
    {
        id: "inv-003",
        invoiceNumber: "INV-2026-003",
        clientId: "client-2",
        clientName: "Tech Corp",
        issueDate: "2026-01-25T00:00:00Z",
        status: "Open",
        total: 8000,
        paidAmount: 0,
        amountDue: 8000,
        currency: "USD"
    },
    {
        id: "inv-004",
        invoiceNumber: "INV-2026-004",
        clientId: "client-3",
        clientName: "Creative Agency",
        issueDate: "2026-01-15T00:00:00Z",
        status: "Closed",
        total: 2500,
        paidAmount: 2500,
        amountDue: 0,
        currency: "USD"
    },
    {
        id: "inv-005",
        invoiceNumber: "INV-2026-005",
        clientId: "client-4",
        clientName: "Startup Inc",
        issueDate: "2026-02-01T00:00:00Z",
        status: "Open",
        total: 1500,
        paidAmount: 0,
        amountDue: 1500,
        currency: "USD"
    },
    {
        id: "inv-006",
        invoiceNumber: "INV-2026-006",
        clientId: "client-1",
        clientName: "Patricia",
        issueDate: "2026-02-03T00:00:00Z",
        status: "Open",
        total: 4200,
        paidAmount: 1000,
        amountDue: 3200,
        currency: "USD"
    }
]

// ============================================================================
// TEAM INVOICES
// ============================================================================

export interface TeamInvoice {
    id: string
    invoiceNumber: string
    memberId: string
    memberName: string
    issueDate: string
    status: 'Open' | 'Closed'
    total: number
    paidAmount: number
    amountDue: number
    currency: string
}

export const DUMMY_TEAM_INVOICES: TeamInvoice[] = [
    {
        id: "tinv-001",
        invoiceNumber: "TINV-2026-001",
        memberId: "m1",
        memberName: "Antonio Galih",
        issueDate: "2026-01-15T00:00:00Z",
        status: "Closed",
        total: 2500,
        paidAmount: 2500,
        amountDue: 0,
        currency: "USD"
    },
    {
        id: "tinv-002",
        invoiceNumber: "TINV-2026-002",
        memberId: "m2",
        memberName: "Lave Lavael",
        issueDate: "2026-01-20T00:00:00Z",
        status: "Open",
        total: 1800,
        paidAmount: 1000,
        amountDue: 800,
        currency: "USD"
    },
    {
        id: "tinv-003",
        invoiceNumber: "TINV-2026-003",
        memberId: "m1",
        memberName: "Antonio Galih",
        issueDate: "2026-02-01T00:00:00Z",
        status: "Open",
        total: 2600,
        paidAmount: 0,
        amountDue: 2600,
        currency: "USD"
    },
    {
        id: "tinv-004",
        invoiceNumber: "TINV-2026-004",
        memberId: "m3",
        memberName: "Sarah Johnson",
        issueDate: "2026-01-25T00:00:00Z",
        status: "Closed",
        total: 3000,
        paidAmount: 3000,
        amountDue: 0,
        currency: "USD"
    },
    {
        id: "tinv-005",
        invoiceNumber: "TINV-2026-005",
        memberId: "m5",
        memberName: "Alex Morgan",
        issueDate: "2026-02-02T00:00:00Z",
        status: "Open",
        total: 1200,
        paidAmount: 0,
        amountDue: 1200,
        currency: "USD"
    },
    {
        id: "tinv-006",
        invoiceNumber: "TINV-2026-006",
        memberId: "m2",
        memberName: "Lave Lavael",
        issueDate: "2026-02-04T00:00:00Z",
        status: "Open",
        total: 1850,
        paidAmount: 500,
        amountDue: 1350,
        currency: "USD"
    }
]
// ============================================================================
// VISITS REPORT (NEW)
// ============================================================================

export interface VisitEntry {
    id: string
    memberId: string
    memberName: string
    date: string
    locationName: string
    address: string
    checkIn: string
    checkOut: string
    duration: string // formatted duration
    distance: number // km
    notes: string
    coordinates: {
        lat: number
        lng: number
    }
}

export const DUMMY_VISITS: VisitEntry[] = [
    {
        id: 'v-1',
        memberId: 'm1',
        memberName: 'Antonio Galih',
        date: '2026-01-15',
        locationName: 'Headquarters',
        coordinates: { lat: -6.2088, lng: 106.8456 },
        address: '123 Main St, Jakarta',
        checkIn: '09:00 AM',
        checkOut: '05:00 PM',
        duration: '08:00',
        distance: 12.5,
        notes: 'Regular office day'
    },
    {
        id: 'v-2',
        memberId: 'm2',
        memberName: 'Emily Davis',
        date: '2026-01-15',
        locationName: 'Client Site A',
        coordinates: { lat: -6.9175, lng: 107.6191 },
        address: '456 Business Rd, Bandung',
        checkIn: '10:00 AM',
        checkOut: '02:00 PM',
        duration: '04:00',
        distance: 45.2,
        notes: 'Monthly maintenance'
    },
    {
        id: 'v-3',
        memberId: 'm3',
        memberName: 'Sarah Johnson',
        date: '2026-01-16',
        locationName: 'Vendor Office',
        coordinates: { lat: -7.2575, lng: 112.7521 },
        address: '789 Supply St, Surabaya',
        checkIn: '01:00 PM',
        checkOut: '03:00 PM',
        duration: '02:00',
        distance: 5.0,
        notes: 'Contract negotiation'
    },
    {
        id: 'v-4',
        memberId: 'm4',
        memberName: 'Michael Chen',
        date: '2026-01-16',
        locationName: 'Data Center',
        coordinates: { lat: -6.1751, lng: 106.8650 },
        address: '101 Server Ave, Jakarta',
        checkIn: '08:00 AM',
        checkOut: '06:00 PM',
        duration: '10:00',
        distance: 18.0,
        notes: 'Server migration'
    },
    {
        id: 'v-5',
        memberId: 'm1',
        memberName: 'Antonio Galih',
        date: '2026-01-17',
        locationName: 'Branch Office',
        coordinates: { lat: -6.2383, lng: 106.9756 },
        address: '202 Branch Rd, Bekasi',
        checkIn: '09:30 AM',
        checkOut: '04:30 PM',
        duration: '07:00',
        distance: 12.0,
        notes: 'Inventory check'
    }
]

// ============================================================================
// MANUAL TIME EDIT REPORT
// ============================================================================

export interface ManualTimeEditEntry {
    id: string
    memberId: string
    memberName: string
    date: string
    project: string
    task?: string
    originalTime?: string
    editedTime?: string
    action: 'add' | 'edit' | 'delete'
    editedBy: string
    editDate: string
    reason: string
}

export const DUMMY_MANUAL_TIME_EDITS: ManualTimeEditEntry[] = [
    {
        id: 'edit-1',
        memberId: 'm1',
        memberName: 'Antonio Galih',
        date: '2026-01-15',
        project: 'Website Redesign',
        task: 'Homepage Layout',
        originalTime: '02:00',
        editedTime: '03:00',
        action: 'edit',
        editedBy: 'Siti',
        editDate: '2026-01-16T10:30:00',
        reason: 'Forgot to track brainstorming session'
    },
    {
        id: 'edit-2',
        memberId: 'm2',
        memberName: 'Emily Davis',
        date: '2026-01-14',
        project: 'Mobile App',
        originalTime: '00:00',
        editedTime: '04:00',
        action: 'add',
        editedBy: 'Emily Davis',
        editDate: '2026-01-14T18:00:00',
        reason: 'Manual entry for offline work'
    },
    {
        id: 'edit-3',
        memberId: 'm3',
        memberName: 'Sarah Johnson',
        date: '2026-01-13',
        project: 'Backend API',
        originalTime: '01:30',
        editedTime: '00:00',
        action: 'delete',
        editedBy: 'Budi',
        editDate: '2026-01-13T15:00:00',
        reason: 'Accidental timer start'
    },
    {
        id: 'edit-4',
        memberId: 'm1',
        memberName: 'Antonio Galih',
        date: '2026-01-12',
        project: 'Website Redesign',
        originalTime: '05:00',
        editedTime: '04:30',
        action: 'edit',
        editedBy: 'Siti',
        editDate: '2026-01-12T17:00:00',
        reason: 'Adjusted for lunch break'
    },
    {
        id: 'edit-5',
        memberId: 'm4',
        memberName: 'Michael Chen',
        date: '2026-01-15',
        project: 'Server Maintenance',
        task: 'Database Update',
        originalTime: '00:00',
        editedTime: '02:00',
        action: 'add',
        editedBy: 'Michael Chen',
        editDate: '2026-01-15T09:00:00',
        reason: 'Forgot to start timer'
    }
]

// ============================================================================
// TIMESHEET APPROVAL REPORT
// ============================================================================

export interface TimesheetApprovalEntry {
    id: string
    memberId: string
    memberName: string
    dateStart: string
    dateEnd: string
    totalHours: string
    status: 'open' | 'submitted' | 'approved' | 'rejected'
    approver?: string
    approvalDate?: string
    comments?: string
    activityPct?: number
    paymentStatus?: 'paid' | 'unpaid' | 'processing'
    submittedDate?: string
    screenshotCount?: number
}

export type TimesheetApproval = TimesheetApprovalEntry;

export const DUMMY_TIMESHEET_APPROVALS: TimesheetApprovalEntry[] = [
    {
        id: 'ts-1',
        memberId: 'm1',
        memberName: 'Antonio Galih',
        dateStart: '2026-01-01',
        dateEnd: '2026-01-07',
        totalHours: '40:00',
        status: 'approved',
        approver: 'Siti',
        approvalDate: '2026-01-08T09:00:00',
        comments: 'All looks good',
        activityPct: 92,
        paymentStatus: 'paid',
        submittedDate: '2026-01-07T17:00:00',
        screenshotCount: 0
    },
    {
        id: 'ts-2',
        memberId: 'm2',
        memberName: 'Lave Lavael',
        dateStart: '2026-01-01',
        dateEnd: '2026-01-07',
        totalHours: '38:30',
        status: 'approved',
        approver: 'Siti',
        approvalDate: '2026-01-08T09:05:00',
        activityPct: 85,
        paymentStatus: 'processing',
        submittedDate: '2026-01-07T17:30:00',
        screenshotCount: 0
    },
    {
        id: 'ts-3',
        memberId: 'm3',
        memberName: 'Sarah Johnson',
        dateStart: '2026-01-01',
        dateEnd: '2026-01-07',
        totalHours: '45:00',
        status: 'rejected',
        approver: 'Budi',
        approvalDate: '2026-01-08T10:00:00',
        comments: 'Overtime not authorized. Please review.',
        activityPct: 78,
        paymentStatus: 'unpaid',
        submittedDate: '2026-01-07T18:00:00',
        screenshotCount: 0
    },
    {
        id: 'ts-4',
        memberId: 'm4',
        memberName: 'Michael Chen',
        dateStart: '2026-01-08',
        dateEnd: '2026-01-14',
        totalHours: '40:00',
        status: 'submitted',
        activityPct: 95,
        paymentStatus: 'unpaid',
        submittedDate: '2026-01-14T17:00:00',
        screenshotCount: 0
    },
    {
        id: 'ts-5',
        memberId: 'm1',
        memberName: 'Antonio Galih',
        dateStart: '2026-01-08',
        dateEnd: '2026-01-14',
        totalHours: '41:15',
        status: 'submitted',
        activityPct: 88,
        paymentStatus: 'unpaid',
        submittedDate: '2026-01-14T17:15:00',
        screenshotCount: 0
    },
    {
        id: 'ts-6',
        memberId: 'm5',
        memberName: 'Emma Rodriguez',
        dateStart: '2026-01-15',
        dateEnd: '2026-01-21',
        totalHours: '32:00',
        status: 'open',
        comments: 'Draft in progress',
        activityPct: 60,
        paymentStatus: 'unpaid',
        screenshotCount: 3
    },
    {
        id: 'ts-7',
        memberId: 'm3',
        memberName: 'Sarah Johnson',
        dateStart: '2026-01-15',
        dateEnd: '2026-01-21',
        totalHours: '38:00',
        status: 'submitted',
        activityPct: 82,
        paymentStatus: 'unpaid',
        submittedDate: '2026-01-21T16:00:00',
        screenshotCount: 3
    },
    {
        id: 'ts-8',
        memberId: 'm2',
        memberName: 'Lave Lavael',
        dateStart: '2026-01-15',
        dateEnd: '2026-01-21',
        totalHours: '15:30',
        status: 'open',
        comments: 'Waiting for client confirmation',
        activityPct: 45,
        paymentStatus: 'unpaid',
        screenshotCount: 3
    },
    {
        id: 'ts-9',
        memberId: 'm4',
        memberName: 'Michael Chen',
        dateStart: '2026-01-15',
        dateEnd: '2026-01-21',
        totalHours: '42:00',
        status: 'submitted',
        activityPct: 91,
        paymentStatus: 'unpaid',
        submittedDate: '2026-01-21T17:00:00',
        screenshotCount: 2
    },
    {
        id: 'ts-10',
        memberId: 'm1',
        memberName: 'Antonio Galih',
        dateStart: '2026-01-15',
        dateEnd: '2026-01-21',
        totalHours: '40:00',
        status: 'open',
        comments: 'Incomplete',
        activityPct: 0,
        paymentStatus: 'unpaid',
        screenshotCount: 3
    },
    {
        id: 'ts-11',
        memberId: 'm5',
        memberName: 'Emma Rodriguez',
        dateStart: '2026-01-08',
        dateEnd: '2026-01-14',
        totalHours: '45:00',
        status: 'rejected',
        approver: 'Siti',
        approvalDate: '2026-01-15T10:00:00',
        comments: 'Please fix the overtime entries.',
        activityPct: 70,
        paymentStatus: 'unpaid',
        submittedDate: '2026-01-14T18:00:00',
        screenshotCount: 0
    }
];

export interface TimeEntry {
    id: string
    memberId: string
    memberName: string
    date: string
    startTime: string
    endTime: string
    duration: string // formatted HH:mm:ss for display or decimal
    totalHours: number
    projectId: string
    projectName: string
    taskId?: string
    taskName?: string
    source: 'desktop' | 'mobile' | 'web' | 'manual'
    activityPct: number
    notes?: string
    status?: 'approved' | 'pending' | 'rejected'
    isIdle?: boolean
    billable?: boolean
    reason?: string
    breaks?: Break[]
}

export interface Break {
    id: string
    startTime: string
    endTime: string
    notes?: string
}

export const DUMMY_TIME_ENTRIES: TimeEntry[] = [
    {
        id: 'te-1',
        memberId: 'm1',
        memberName: 'Antonio Galih',
        date: '2026-02-05',
        startTime: '09:00:00',
        endTime: '11:00:00',
        duration: '02:00:00',
        totalHours: 2,
        projectId: '1',
        projectName: 'Website Redesign',
        taskId: 'task-1',
        taskName: 'Design Homepage Concept',
        source: 'desktop',
        activityPct: 65,
        notes: 'Meeting with client',
        status: 'approved'
    },
    {
        id: 'te-2',
        memberId: 'm1',
        memberName: 'Antonio Galih',
        date: '2026-02-05',
        startTime: '13:00:00',
        endTime: '17:00:00',
        duration: '04:00:00',
        totalHours: 4,
        projectId: '2',
        projectName: 'Mobile App Development',
        source: 'mobile',
        activityPct: 0,
        notes: 'On-site visit',
        status: 'pending'
    },
    {
        id: 'te-3',
        memberId: 'm2',
        memberName: 'Emily Davis',
        date: '2026-02-05',
        startTime: '08:00:00',
        endTime: '12:00:00',
        duration: '04:00:00',
        totalHours: 4,
        projectId: '1',
        projectName: 'Website Redesign',
        source: 'manual',
        activityPct: 0,
        notes: 'Forgot to track',
        status: 'pending'
    },
    {
        id: 'te-4',
        memberId: 'm3',
        memberName: 'Sarah Johnson',
        date: '2026-02-04',
        startTime: '10:00:00',
        endTime: '12:00:00',
        duration: '02:00:00',
        totalHours: 2,
        projectId: '3',
        projectName: 'Marketing Campaign',
        source: 'desktop',
        activityPct: 82,
        isIdle: true
    },
    {
        id: 'te-5',
        memberId: 'm4',
        memberName: 'Michael Chen',
        date: '2026-02-04',
        startTime: '09:00:00',
        endTime: '17:00:00',
        duration: '08:00:00',
        totalHours: 8,
        projectId: '4',
        projectName: 'Old Website',
        source: 'web',
        activityPct: 45,
        status: 'approved'
    }
];
