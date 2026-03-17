
export interface DailyLimitEntry {
    id: string
    memberId: string
    memberName: string
    role: string
    dailyLimit: number // in hours
    hoursTracked: number // in hours
    date: string // YYYY-MM-DD
    status: 'Within Limit' | 'Approaching Limit' | 'Exceeded'
}

export const DUMMY_DAILY_LIMITS: DailyLimitEntry[] = [
    {
        id: 'dl-1',
        memberId: 'm1',
        memberName: 'Antonio Galih',
        role: 'Owner',
        dailyLimit: 8,
        hoursTracked: 7.5,
        date: '2026-02-04',
        status: 'Within Limit'
    },
    {
        id: 'dl-2',
        memberId: 'm2',
        memberName: 'Lave Lavael',
        role: 'Manager',
        dailyLimit: 8,
        hoursTracked: 8.5,
        date: '2026-02-04',
        status: 'Exceeded'
    },
    {
        id: 'dl-3',
        memberId: 'm3',
        memberName: 'Sarah Johnson',
        role: 'Member',
        dailyLimit: 6,
        hoursTracked: 5.8,
        date: '2026-02-04',
        status: 'Approaching Limit'
    },
    {
        id: 'dl-4',
        memberId: 'm4',
        memberName: 'Michael Chen',
        role: 'Member',
        dailyLimit: 8,
        hoursTracked: 4.2,
        date: '2026-02-04',
        status: 'Within Limit'
    },
    {
        id: 'dl-5',
        memberId: 'm5',
        memberName: 'Emma Rodriguez',
        role: 'Member',
        dailyLimit: 8,
        hoursTracked: 9.1,
        date: '2026-02-04',
        status: 'Exceeded'
    },
    // Previous Day
    {
        id: 'dl-6',
        memberId: 'm1',
        memberName: 'Antonio Galih',
        role: 'Owner',
        dailyLimit: 8,
        hoursTracked: 6.5,
        date: '2026-02-03',
        status: 'Within Limit'
    },
    {
        id: 'dl-7',
        memberId: 'm2',
        memberName: 'Lave Lavael',
        role: 'Manager',
        dailyLimit: 8,
        hoursTracked: 7.9,
        date: '2026-02-03',
        status: 'Approaching Limit'
    }
]
