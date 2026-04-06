"use client"

import { useState, useMemo } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_EXPENSES, DUMMY_MEMBERS, DUMMY_TEAMS, EXPENSE_CATEGORIES, type ExpenseEntry } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { Download, Search, Plus, Upload, X } from "lucide-react"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { useTimezone } from "@/components/providers/timezone-provider"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)
}

export default function ExpensesPage() {
    const timezone = useTimezone()
    const [expenses, setExpenses] = useState<ExpenseEntry[]>(DUMMY_EXPENSES)
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 31)
    })
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [groupBy, setGroupBy] = useState("none") // none, member, project, category, status
    const [page, setPage] = useState(1)
    const pageSize = 10

    // Add Expense State
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newExpense, setNewExpense] = useState<Partial<ExpenseEntry>>({
        date: format(new Date(), 'yyyy-MM-dd'),
        currency: 'IDR',
        amount: 0,
        status: 'pending',
        category: 'other'
    })
    const [receiptFile, setReceiptFile] = useState<File | null>(null)

    const filteredData = useMemo(() => {
        let data = expenses

        if (dateRange.startDate && dateRange.endDate) {
            const startStr = format(dateRange.startDate, 'yyyy-MM-dd')
            const endStr = format(dateRange.endDate, 'yyyy-MM-dd')
            data = data.filter(item => item.date >= startStr && item.date <= endStr)
        }

        if (!selectedFilter.all && selectedFilter.id !== 'all') {
            if (selectedFilter.type === 'members') {
                data = data.filter(item => item.memberId === selectedFilter.id)
            }
        }

        if (statusFilter !== 'all') {
            data = data.filter(item => item.status === statusFilter)
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            data = data.filter(item =>
                item.memberName.toLowerCase().includes(query) ||
                (item.projectName && item.projectName.toLowerCase().includes(query)) ||
                item.description.toLowerCase().includes(query)
            )
        }

        return data
    }, [expenses, dateRange, selectedFilter, searchQuery, statusFilter])

    const summaryCards = useMemo(() => {
        const total = filteredData.reduce((sum, e) => sum + e.amount, 0)
        const approved = filteredData.filter(e => e.status === 'approved' || e.status === 'reimbursed')
            .reduce((sum, e) => sum + e.amount, 0)
        const pending = filteredData.filter(e => e.status === 'pending')
            .reduce((sum, e) => sum + e.amount, 0)
        const count = filteredData.length

        return [
            { label: "Total Expenses", value: formatCurrency(total) },
            { label: "Approved/Reimbursed", value: formatCurrency(approved) },
            { label: "Pending", value: formatCurrency(pending) },
            { label: "Total Claims", value: count },
        ]
    }, [filteredData])

    const paginatedItems = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredData.slice(start, start + pageSize)
    }, [filteredData, page])

    const displayGroups = useMemo(() => {
        if (groupBy === 'none') return null
        const groups: Record<string, typeof paginatedItems> = {}
        paginatedItems.forEach(item => {
            let key = ''
            if (groupBy === 'member') key = item.memberName
            else if (groupBy === 'project') key = item.projectName || 'No Project'
            else if (groupBy === 'category') key = EXPENSE_CATEGORIES[item.category] || item.category
            else if (groupBy === 'status') key = item.status.charAt(0).toUpperCase() + item.status.slice(1)

            if (!groups[key]) groups[key] = []
            groups[key]!.push(item)
        })
        return groups
    }, [paginatedItems, groupBy])

    const totalPages = Math.ceil(filteredData.length / pageSize)

    // Handlers
    const handleAddExpense = () => {
        if (!newExpense.memberId || !newExpense.amount || !newExpense.description || !newExpense.category) {
            toast.error("Please fill in all required fields")
            return
        }

        const member = DUMMY_MEMBERS.find(m => m.id === newExpense.memberId)

        const entry: ExpenseEntry = {
            id: `new-${Date.now()}`,
            memberId: newExpense.memberId,
            memberName: member ? member.name : 'Unknown',
            projectId: newExpense.projectId || '',
            projectName: newExpense.projectId ? 'Project ' + newExpense.projectId : '',
            category: newExpense.category as any,
            description: newExpense.description,
            amount: Number(newExpense.amount),
            currency: 'IDR',
            date: newExpense.date || format(new Date(), 'yyyy-MM-dd'),
            status: 'pending',
            receiptUrl: receiptFile ? URL.createObjectURL(receiptFile) : undefined
        }

        setExpenses(prev => [...prev, entry])
        setIsAddDialogOpen(false)
        setReceiptFile(null)
        setNewExpense({
            date: format(new Date(), 'yyyy-MM-dd'),
            currency: 'IDR',
            amount: 0,
            status: 'pending',
            category: 'other'
        })
        toast.success("Expense added successfully")
    }

    return (
        <div className="px-6 py-4">
            <h1 className="text-xl font-semibold mb-5">Expenses Report</h1>
            <InsightsHeader
                selectedFilter={selectedFilter}
                onSelectedFilterChange={setSelectedFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                members={DUMMY_MEMBERS}
                teams={DUMMY_TEAMS}
                timezone={timezone}
            >
                <div className="flex gap-2">
                    <Button onClick={() => setIsAddDialogOpen(true)} className="h-9 bg-gray-900 hover:cursor-pointer text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Expense
                    </Button>
                    <Button variant="outline" className="h-9">
                        <Download className="w-4 h-4 mr-2 hover:cursor-pointer" />
                        Export
                    </Button>
                </div>
            </InsightsHeader>

            <style jsx global>{`
                html body .custom-hover-row:hover,
                html body .custom-hover-row:hover > td {
                    background-color: #d1d5db !important;
                }
            `}</style>

            <div className="mt-6 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x border-b bg-gray-50/50">
                    {summaryCards.map((card, idx) => (
                        <div key={idx} className="p-4">
                            <p className="text-sm font-medium text-gray-500">{card.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-b flex gap-4 flex-wrap">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search member, project..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ps-9 pl-9"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 whitespace-nowrap">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border rounded-md px-3 py-2 text-sm bg-white"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="reimbursed">Reimbursed</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 whitespace-nowrap">Group by:</span>
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value)}
                            className="border rounded-md px-3 py-2 text-sm bg-white"
                        >
                            <option value="none">None</option>
                            <option value="member">Member</option>
                            <option value="project">Project</option>
                            <option value="category">Category</option>
                            <option value="status">Status</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="p-4">Member</th>
                                <th className="p-4">Project</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Description</th>
                                <th className="p-4">Date</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {groupBy === 'none' ? (
                                paginatedItems.map((expense, idx) => (
                                    <tr
                                        key={expense.id}
                                        style={{ backgroundColor: idx % 2 === 1 ? '#f1f5f9' : '#ffffff' }}
                                        className="transition-colors custom-hover-row"
                                    >
                                        <td className="p-4 font-medium text-gray-900">{expense.memberName}</td>
                                        <td className="p-4 text-gray-600">{expense.projectName || '-'}</td>
                                        <td className="p-4">
                                            <div className="px-2 py-1 font-medium text-gray-900">
                                                {EXPENSE_CATEGORIES[expense.category] || String(expense.category)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600 max-w-[200px] truncate" title={expense.description}>{expense.description}</td>
                                        <td className="p-4 text-gray-600 whitespace-nowrap">{expense.date}</td>
                                        <td className="p-4 text-right font-medium">{formatCurrency(expense.amount)}</td>
                                        <td className="p-4 text-center">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                expense.status === 'approved' && "bg-slate-100 text-green-800",
                                                expense.status === 'reimbursed' && "bg-slate-100 text-blue-800",
                                                expense.status === 'pending' && "bg-yellow-100 text-yellow-800",
                                                expense.status === 'rejected' && "bg-red-100 text-red-800",
                                            )}>
                                                {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {expense.receiptUrl ? (
                                                <a href={expense.receiptUrl} target="_blank" rel="noreferrer" className="text-slate-700 hover:text-blue-800 flex justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-paperclip"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                                </a>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                // Grouped View
                                displayGroups && Object.entries(displayGroups).flatMap(([groupKey, items]) => [
                                    <tr key={`header-${groupKey}`} className="bg-gray-100/80">
                                        <td colSpan={8} className="px-4 py-2 font-semibold text-gray-800 border-b border-t">
                                            {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}: {groupKey} <span className="text-xs font-normal text-gray-500 ml-2">({items.length} items)</span>
                                        </td>
                                    </tr>,
                                    ...items.map((expense) => (
                                        <tr
                                            key={expense.id}
                                            className="transition-colors hover:bg-gray-50 border-b"
                                        >
                                            <td className="p-4 font-medium text-gray-900">{expense.memberName}</td>
                                            <td className="p-4 text-gray-600">{expense.projectName || '-'}</td>
                                            <td className="p-4">
                                                <div className="px-2 py-1 font-medium text-gray-900">
                                                    {EXPENSE_CATEGORIES[expense.category] || String(expense.category)}
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-600 max-w-[200px] truncate" title={expense.description}>{expense.description}</td>
                                            <td className="p-4 text-gray-600 whitespace-nowrap">{expense.date}</td>
                                            <td className="p-4 text-right font-medium">{formatCurrency(expense.amount)}</td>
                                            <td className="p-4 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                    expense.status === 'approved' && "bg-slate-100 text-green-800",
                                                    expense.status === 'reimbursed' && "bg-slate-100 text-blue-800",
                                                    expense.status === 'pending' && "bg-yellow-100 text-yellow-800",
                                                    expense.status === 'rejected' && "bg-red-100 text-red-800",
                                                )}>
                                                    {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {expense.receiptUrl ? (
                                                    <a href={expense.receiptUrl} target="_blank" rel="noreferrer" className="text-slate-700 hover:text-blue-800 flex justify-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-paperclip"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ])
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            <div className="mt-4">
                <PaginationFooter
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    from={filteredData.length > 0 ? (page - 1) * pageSize + 1 : 0}
                    to={Math.min(page * pageSize, filteredData.length)}
                    total={filteredData.length}
                    pageSize={pageSize}
                    onPageSizeChange={() => { }}
                    className="bg-transparent shadow-none border-none p-0"
                />
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New Expense</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="member">Member</Label>
                            <Select
                                value={newExpense.memberId}
                                onValueChange={(val) => setNewExpense({ ...newExpense, memberId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DUMMY_MEMBERS.map(m => (
                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={newExpense.date}
                                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={newExpense.category}
                                onValueChange={(val) => setNewExpense({ ...newExpense, category: val as any })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (IDR)</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0"
                                value={newExpense.amount}
                                onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                placeholder="Expense description"
                                value={newExpense.description}
                                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="receipt">Receipt</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="receipt"
                                    type="file"
                                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById('receipt')?.click()}
                                    className="w-full"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {receiptFile ? receiptFile.name : "Upload Receipt"}
                                </Button>
                                {receiptFile && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500"
                                        onClick={() => setReceiptFile(null)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsAddDialogOpen(false)}
                            className="border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddExpense}
                            className="bg-black hover:bg-slate-900 text-white"
                        >
                            Save Expense
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
