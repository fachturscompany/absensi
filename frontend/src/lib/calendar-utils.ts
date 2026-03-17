// Helper functions for the date range picker
export const generateCalendarDays = (month: Date) => {
    const year = month.getFullYear()
    const monthIndex = month.getMonth()
    const firstDay = new Date(year, monthIndex, 1)
    const lastDay = new Date(year, monthIndex + 1, 0)

    // Get day of week (0 = Sunday, adjust to Monday = 0)
    let startDay = firstDay.getDay() - 1
    if (startDay < 0) startDay = 6

    const days: { day: number, isCurrentMonth: boolean }[] = []

    // Add previous month days
    const prevMonthLastDay = new Date(year, monthIndex, 0).getDate()
    for (let i = startDay - 1; i >= 0; i--) {
        days.push({ day: prevMonthLastDay - i, isCurrentMonth: false })
    }

    // Add current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push({ day: i, isCurrentMonth: true })
    }

    // Add next month days to fill the grid
    const remainingDays = 42 - days.length // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
        days.push({ day: i, isCurrentMonth: false })
    }

    return days
}

export const isDateInRange = (day: number, month: Date, start: Date, end: Date) => {
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    date.setHours(0, 0, 0, 0)
    const startCompare = new Date(start)
    startCompare.setHours(0, 0, 0, 0)
    const endCompare = new Date(end)
    endCompare.setHours(0, 0, 0, 0)
    return date >= startCompare && date <= endCompare
}

export const isStartOrEndDate = (day: number, month: Date, start: Date, end: Date) => {
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    date.setHours(0, 0, 0, 0)
    const startCompare = new Date(start)
    startCompare.setHours(0, 0, 0, 0)
    const endCompare = new Date(end)
    endCompare.setHours(0, 0, 0, 0)
    return date.getTime() === startCompare.getTime() || date.getTime() === endCompare.getTime()
}
