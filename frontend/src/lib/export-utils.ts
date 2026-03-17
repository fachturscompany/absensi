import Papa from 'papaparse'

export interface ExportColumn {
    key: string
    label: string
    format?: (value: any) => string
}

export interface ExportOptions {
    filename: string
    columns: ExportColumn[]
    data: any[]
    format?: 'csv' | 'excel' | 'pdf'
}

/**
 * Export data to CSV format
 */
export function exportToCSV(options: ExportOptions): void {
    const { filename, columns, data } = options

    // Transform data to match column structure
    const transformedData = data.map(row => {
        const newRow: Record<string, any> = {}
        columns.forEach(col => {
            const value = row[col.key]
            newRow[col.label] = col.format ? col.format(value) : value
        })
        return newRow
    })

    // Generate CSV
    const csv = Papa.unparse(transformedData, {
        quotes: true,
        header: true
    })

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
}

/**
 * Format date for export
 */
export function formatDateForExport(date: string | Date): string {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

/**
 * Format currency for export
 */
export function formatCurrencyForExport(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount)
}

/**
 * Format hours for export
 */
export function formatHoursForExport(hours: number): string {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string): string {
    const now = new Date()
    const timestamp = now.toISOString().split('T')[0] // YYYY-MM-DD
    return `${prefix}-${timestamp}`
}
