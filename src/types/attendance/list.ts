export interface QueryParams {
    orgId: number | null
    page: number
    limit: number
    dateFrom: string
    dateTo: string
    search: string
    status: string
    department: string
}

export interface TimeDisplay {
    date: string
    time: string
    method: string
}
