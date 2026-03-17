// Consolidated Dummy Data
import * as LucideIcons from 'lucide-react'

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

export const DUMMY_MY_STATS: DashboardStats = {
    totalStaff: 1, // Not applicable for 'me' view but needed for type compatibility
    present: 1,
    late: 2,
    permission: 0,
    earnedWeek: 'Rp 3.450.000',
    earnedToday: 'Rp 550.000',
    workedWeek: '38h 25m',
    workedToday: '8h 40m',
    projectsWorked: 5,
    activityToday: 'Normal',
    activityWeek: '↑ 12%'
}

export const DUMMY_MY_PERFORMANCE = {
    status: 'Hadir',
    attendanceRate: '95%',
    lateCount: 2
}

export function getDashboardActivitiesByDate(date: Date) {
    const dateStr = date.toISOString().split('T')[0]
    return DUMMY_DASHBOARD_ACTIVITIES.filter(a => a.date === dateStr)
}

export function getDashboardActivitiesByMember(memberId: string) {
    return DUMMY_DASHBOARD_ACTIVITIES.filter(a => a.memberId === memberId)
}


// ============================================================================
// REPORTS - TIME & ACTIVITY
// ============================================================================

export interface ReportActivityEntry {
    id: string
    date: string
    clientName: string
    projectName: string
    teamName: string
    memberName: string
    todoName: string
    regularHours: number
    totalHours: number
    activityPercent: number
    totalSpent: number
    regularSpent: number
    currency: string
}

export const DUMMY_REPORT_ACTIVITIES: ReportActivityEntry[] = [
    {
        id: 'ra1',
        date: '2026-01-21',
        clientName: 'Patricia',
        projectName: 'Website Redesign',
        teamName: 'Team Alpha',
        memberName: 'Antonio Galih',
        todoName: 'Homepage Layout',
        regularHours: 4.5,
        totalHours: 4.5,
        activityPercent: 82,
        totalSpent: 450000,
        regularSpent: 450000,
        currency: 'Rp'
    },
    {
        id: 'ra2',
        date: '2026-01-21',
        clientName: 'Tech Corp',
        projectName: 'Mobile App',
        teamName: 'Team Beta',
        memberName: 'Lave Lavael',
        todoName: 'API Integration',
        regularHours: 6.2,
        totalHours: 6.2,
        activityPercent: 91,
        totalSpent: 620000,
        regularSpent: 620000,
        currency: 'Rp'
    },
    {
        id: 'ra3',
        date: '2026-01-21',
        clientName: 'Creative Agency',
        projectName: 'Marketing Camp',
        teamName: 'Team Gamma',
        memberName: 'Sarah Johnson',
        todoName: 'Ad Creatives',
        regularHours: 3.5,
        totalHours: 3.5,
        activityPercent: 75,
        totalSpent: 350000,
        regularSpent: 350000,
        currency: 'Rp'
    },
    {
        id: 'ra4',
        date: '2026-01-20',
        clientName: 'Patricia',
        projectName: 'Website Redesign',
        teamName: 'Team Alpha',
        memberName: 'Michael Chen',
        todoName: 'Database Setup',
        regularHours: 5.0,
        totalHours: 8.0, // 3 hours overtime perhaps implied
        activityPercent: 88,
        totalSpent: 800000,
        regularSpent: 500000,
        currency: 'Rp'
    },
    {
        id: 'ra5',
        date: '2026-01-20',
        clientName: 'Startup Inc',
        projectName: 'MVP Build',
        teamName: 'Team Beta',
        memberName: 'Emma Rodriguez',
        todoName: 'User Auth',
        regularHours: 7.0,
        totalHours: 7.0,
        activityPercent: 94,
        totalSpent: 700000,
        regularSpent: 700000,
        currency: 'Rp'
    }
]

// Type aliases for backwards compatibility
export type { UnusualActivityEntry as UnusualActivity }
