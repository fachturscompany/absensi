
export interface ProjectBudgetEntry {
    id: string
    projectId: string
    projectName: string
    clientName: string
    budgetType: 'hours' | 'cost'
    budgetTotal: number // hours or currency amount
    timeTracked: number // hours
    costIncurred: number // currency amount
    currency: string
    status: 'Within Budget' | 'Approaching Limit' | 'Exceeded'
}

export const DUMMY_PROJECT_BUDGETS: ProjectBudgetEntry[] = [
    {
        id: 'pb-1',
        projectId: '1',
        projectName: 'Website Redesign',
        clientName: 'Patricia',
        budgetType: 'cost',
        budgetTotal: 10000,
        timeTracked: 150.5,
        costIncurred: 7525,
        currency: '$',
        status: 'Within Budget'
    },
    {
        id: 'pb-2',
        projectId: '2',
        projectName: 'Mobile App Development',
        clientName: 'Tech Corp',
        budgetType: 'cost',
        budgetTotal: 25000,
        timeTracked: 480.2,
        costIncurred: 24010,
        currency: '$',
        status: 'Approaching Limit'
    },
    {
        id: 'pb-3',
        projectId: '3',
        projectName: 'Marketing Campaign',
        clientName: 'Patricia',
        budgetType: 'hours',
        budgetTotal: 200, // 200 hours budget
        timeTracked: 215,
        costIncurred: 0, // value not relevant for hours budget tracking usually, but internal cost exists
        currency: '$',
        status: 'Exceeded'
    },
    {
        id: 'pb-4',
        projectId: '4',
        projectName: 'Internal Tools',
        clientName: 'Internal',
        budgetType: 'hours',
        budgetTotal: 500,
        timeTracked: 120,
        costIncurred: 0,
        currency: '$',
        status: 'Within Budget'
    },
    {
        id: 'pb-5',
        projectId: '5',
        projectName: 'Legacy System Maintenance',
        clientName: 'Old Client',
        budgetType: 'cost',
        budgetTotal: 5000,
        timeTracked: 110,
        costIncurred: 5500,
        currency: '$',
        status: 'Exceeded'
    }
]
