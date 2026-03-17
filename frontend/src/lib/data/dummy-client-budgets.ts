
export interface ClientBudgetEntry {
    id: string
    clientName: string
    budgetType: 'hours' | 'cost'
    budgetTotal: number
    timeTracked: number
    costIncurred: number
    currency: string
    status: 'Within Budget' | 'Approaching Limit' | 'Exceeded'
}

export const DUMMY_CLIENT_BUDGETS: ClientBudgetEntry[] = [
    {
        id: 'cb-1',
        clientName: 'Patricia',
        budgetType: 'cost',
        budgetTotal: 50000,
        timeTracked: 365.5,
        costIncurred: 18275, // Aggregated from multiple projects
        currency: '$',
        status: 'Within Budget'
    },
    {
        id: 'cb-2',
        clientName: 'Tech Corp',
        budgetType: 'cost',
        budgetTotal: 30000,
        timeTracked: 480.2,
        costIncurred: 24010,
        currency: '$',
        status: 'Approaching Limit'
    },
    {
        id: 'cb-3',
        clientName: 'Internal',
        budgetType: 'hours',
        budgetTotal: 1000,
        timeTracked: 120,
        costIncurred: 0,
        currency: '$',
        status: 'Within Budget'
    },
    {
        id: 'cb-4',
        clientName: 'Old Client',
        budgetType: 'cost',
        budgetTotal: 5000,
        timeTracked: 110,
        costIncurred: 5500,
        currency: '$',
        status: 'Exceeded'
    }
]
