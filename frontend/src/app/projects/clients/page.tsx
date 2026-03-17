"use client"

import { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Plus, Search, Loader2 } from "lucide-react"
import { AddClientDialog, type ClientFormData } from "@/components/projects/clients/add-client-dilaog"
import { ClientsTable, type Client } from "@/components/projects/clients/clients-table"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { getClients, createClientAction, updateClientAction, updateClientStatus, deleteClientAction } from "@/action/client"
import { useSearchParams } from "next/navigation"
import { IClient } from "@/interface"
import { toast } from "sonner"

export default function ClientsPage() {
    const searchParams = useSearchParams()
    const urlQuery = searchParams.get("q") || ""

    const [activeTab, setActiveTab] = useState<"active" | "archived">("active")
    const [searchQuery, setSearchQuery] = useState(urlQuery)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingClient, setEditingClient] = useState<Client | null>(null)
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    // Archive confirmation dialog
    const [archiveOpen, setArchiveOpen] = useState(false)
    const [archiveTargets, setArchiveTargets] = useState<string[]>([])
    const [clientToDelete, setClientToDelete] = useState<string | null>(null)

    // Use real data from database
    const [clients, setClients] = useState<Client[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchData = async () => {
        setIsLoading(true)
        const response = await getClients()
        if (response.success) {
            // Map IClient to UI Client interface
            const mappedClients: Client[] = response.data.map((c: IClient) => ({
                id: c.id.toString(),
                name: c.name,
                budget: c.budget_amount ? `Budget: ${c.budget_amount}` : "Budget: none",
                autoInvoicing: !!c.auto_invoice_frequency,
                isArchived: c.status === 'archived',
                address: c.address || "",
                phone: c.phone || "",
                emails: c.email ? [c.email] : [],
                projectCount: c.project_count,
                taskCount: c.task_count,
                budgetType: c.budget_type || "",
                budgetAmount: c.budget_amount || 0,
                notifyPercentage: c.notify_percentage || 80,
                invoiceNotes: c.invoice_notes || "",
                netTermsDays: c.net_terms_days || 30,
                autoInvoiceFrequency: c.auto_invoice_frequency || "",
                projectIds: c.projects?.map(p => p.id.toString()) || [],
                createdAt: c.created_at
            }))
            setClients(mappedClients)
        } else {
            toast.error(response.message || "Failed to fetch clients")
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const activeClients = clients.filter((c) => !c.isArchived)
    const archivedClients = clients.filter((c) => c.isArchived)
    const displayedClients = activeTab === "active" ? activeClients : archivedClients

    const filteredClients = searchQuery
        ? displayedClients.filter((c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : displayedClients

    const paginatedClients = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        const end = start + pageSize
        return filteredClients.slice(start, end)
    }, [filteredClients, currentPage, pageSize])

    const totalPages = Math.ceil(filteredClients.length / pageSize) || 1

    const handleAddClient = async (formData: ClientFormData) => {
        const fd = new FormData()
        fd.append("name", formData.name)
        fd.append("address", formData.address)
        fd.append("phone", formData.phone)
        fd.append("email", formData.emails.split(",")[0]?.trim() || "")
        fd.append("status", 'active')
        fd.append("budget_type", formData.budgetType || "")
        fd.append("budget_amount", formData.budgetCost || "0")
        fd.append("notify_percentage", formData.budgetNotifyAt || "80")
        fd.append("invoice_notes", formData.invoiceNotes)
        fd.append("net_terms_days", formData.invoiceNetTerms || "30")
        fd.append("auto_invoice_frequency", formData.autoInvoicing === 'custom' ? formData.aiFrequency : "")

        const projectIds = formData.projects.map(id => parseInt(id))
        fd.append("project_ids", JSON.stringify(projectIds))

        const response = await createClientAction(fd)
        if (response.success) {
            toast.success("Client added successfully")
            fetchData()
            setDialogOpen(false)
            setSelectedIds([])
        } else {
            toast.error(response.message || "Failed to add client")
        }
    }

    const handleEditClient = (client: Client) => {
        setEditingClient(client)
        setDialogOpen(true)
    }

    const handleUpdateClient = async (formData: ClientFormData) => {
        if (!editingClient) return
        const fd = new FormData()
        fd.append("id", editingClient.id)
        fd.append("name", formData.name)
        fd.append("address", formData.address)
        fd.append("phone", formData.phone)
        fd.append("email", formData.emails.split(",")[0]?.trim() || "")
        fd.append("budget_type", formData.budgetType || "")
        fd.append("budget_amount", formData.budgetCost || "0")
        fd.append("notify_percentage", formData.budgetNotifyAt || "80")
        fd.append("invoice_notes", formData.invoiceNotes)
        fd.append("net_terms_days", formData.invoiceNetTerms || "30")
        fd.append("auto_invoice_frequency", formData.autoInvoicing === 'custom' ? formData.aiFrequency : "")

        const projectIds = formData.projects.map(id => parseInt(id))
        fd.append("project_ids", JSON.stringify(projectIds))

        const response = await updateClientAction(fd)
        if (response.success) {
            toast.success("Client updated successfully")
            fetchData()
            setDialogOpen(false)
            setEditingClient(null)
        } else {
            toast.error(response.message || "Failed to update client")
        }
    }

    const handleArchive = (id: string) => {
        setArchiveTargets([id])
        setArchiveOpen(true)
    }

    const handleRestore = (id: string) => {
        confirmArchiveWithTargets([id], 'active')
    }

    const handleBatchArchive = () => {
        if (selectedIds.length === 0) return
        setArchiveTargets(selectedIds)
        setArchiveOpen(true)
    }

    const handleBatchRestore = () => {
        if (selectedIds.length === 0) return
        confirmArchiveWithTargets(selectedIds, 'active')
    }

    const confirmArchiveWithTargets = async (targets: string[], status: 'active' | 'archived') => {
        const response = await Promise.all(targets.map(id => {
            const fd = new FormData()
            fd.append("id", id)
            fd.append("status", status)
            return updateClientStatus(fd)
        }))
        const successCount = response.filter(r => r.success).length
        if (successCount > 0) {
            toast.success(`${successCount} clients updated`)
            fetchData()
            setSelectedIds(prev => prev.filter(id => !targets.includes(id)))
        } else {
            toast.error("Failed to update clients")
        }
    }

    const handleDelete = (id: string) => {
        setClientToDelete(id)
    }

    const confirmDelete = async () => {
        if (clientToDelete) {
            const fd = new FormData()
            fd.append("id", clientToDelete)
            const response = await deleteClientAction(fd)
            if (response.success) {
                toast.success("Client deleted successfully")
                fetchData()
                setSelectedIds(selectedIds.filter(sid => sid !== clientToDelete))
            } else {
                toast.error(response.message || "Failed to delete client")
            }
            setClientToDelete(null)
        }
    }

    const confirmArchive = async () => {
        if (archiveTargets.length > 0) {
            const isRestore = activeTab === "archived";
            await confirmArchiveWithTargets(archiveTargets, isRestore ? 'active' : 'archived')
        }
        setArchiveOpen(false)
        setArchiveTargets([])
    }

    return (
        <div className="flex flex-col gap-4 p-4 pt-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Clients</h1>
            </div>

            {/* Custom Tabs */}
            <div className="flex items-center gap-6 text-sm">
                <button
                    className={`pb-2 border-b-2 ${activeTab === "active" ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    onClick={() => { setActiveTab("active"); setSelectedIds([]) }}
                >
                    ACTIVE ({activeClients.length})
                </button>
                <button
                    className={`pb-2 border-b-2 ${activeTab === "archived" ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    onClick={() => { setActiveTab("archived"); setSelectedIds([]) }}
                >
                    ARCHIVED ({archivedClients.length})
                </button>
            </div>

            <div>
                <div className="space-y-6">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between gap-3">
                        {/* Search */}
                        <div className="w-full sm:w-auto min-w-[260px] max-w-[360px] relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search clients"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="ps-10 pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button className="px-3" onClick={() => { setEditingClient(null); setDialogOpen(true) }}>
                                <Plus />Add
                            </Button>
                        </div>
                    </div>

                    {/* Batch Actions + Selected Count */}
                    <div className="flex items-center gap-3 text-sm">
                        <Button
                            variant="outline"
                            className="px-3"
                            disabled={selectedIds.length === 0}
                            onClick={activeTab === "active" ? handleBatchArchive : handleBatchRestore}
                        >
                            {activeTab === "active" ? "Archive" : "Restore"}
                        </Button>
                        <span className="text-sm text-muted-foreground min-w-[90px]">
                            {selectedIds.length} / {filteredClients.length} selected
                        </span>
                    </div>

                    <Separator className="my-4" />

                    {/* Table */}
                    <div className="overflow-x-auto w-full mt-4 md:mt-6 relative">
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        )}
                        <ClientsTable
                            clients={paginatedClients}
                            selectedIds={selectedIds}
                            onSelectClient={(id, selected) => {
                                setSelectedIds(
                                    selected ? [...selectedIds, id] : selectedIds.filter((sid) => sid !== id)
                                )
                            }}
                            onSelectAll={(selected) => {
                                setSelectedIds(selected ? paginatedClients.map((c) => c.id) : [])
                            }}
                            onEdit={handleEditClient}
                            onArchive={handleArchive}
                            onRestore={handleRestore}
                            onDelete={handleDelete}
                        />
                    </div>

                    <PaginationFooter
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={(p) => setCurrentPage(p)}
                        isLoading={isLoading}
                        from={paginatedClients.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                        to={Math.min(currentPage * pageSize, filteredClients.length)}
                        total={filteredClients.length}
                        pageSize={pageSize}
                        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
                    />
                </div>
            </div>

            {/* Add/Edit Client Dialog */}
            <AddClientDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open)
                    if (!open) setEditingClient(null)
                }}
                onSave={editingClient ? handleUpdateClient : handleAddClient}
                initialData={
                    editingClient
                        ? {
                            name: editingClient.name,
                            address: editingClient.address || "",
                            phone: editingClient.phone || "",
                            phoneCountry: "id",
                            emails: editingClient.emails?.join(", ") || "",
                            projects: editingClient.projectIds || [],
                            teams: [],
                            budgetType: editingClient.budgetType || "",
                            budgetBasedOn: editingClient.budgetType?.includes('hours') ? 'hours' : 'cost',
                            budgetCost: editingClient.budgetAmount?.toString() || "",
                            budgetNotifyAt: editingClient.notifyPercentage?.toString() || "80",
                            budgetResets: editingClient.budgetType?.includes('monthly') ? 'monthly' : 'never',
                            budgetStartDate: "",
                            budgetIncludeNonBillable: false,
                            invoiceNotesCustom: !!editingClient.invoiceNotes,
                            invoiceNotes: editingClient.invoiceNotes || "",
                            invoiceNetTermsCustom: editingClient.netTermsDays !== 30,
                            invoiceNetTerms: editingClient.netTermsDays?.toString() || "30",
                            invoiceTaxRateCustom: false,
                            invoiceTaxRate: "",
                            autoInvoicing: editingClient.autoInvoiceFrequency ? "custom" : "off",
                            aiAmountBasedOn: "hourly",
                            aiFixedPrice: "",
                            aiFrequency: editingClient.autoInvoiceFrequency || "monthly",
                            aiDelaySending: "0",
                            aiSendReminder: "0",
                            aiLineItems: "user-project-date",
                            aiIncludeNonBillable: false,
                            aiIncludeExpenses: false
                        }
                        : undefined
                }
            />

            {/* Archive Confirmation Dialog */}
            <Dialog open={archiveOpen} onOpenChange={(o) => { setArchiveOpen(o); if (!o) setArchiveTargets([]) }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {archiveTargets.length <= 1 ? "Archive client?" : `Archive ${archiveTargets.length} clients?`}
                        </DialogTitle>
                        <DialogDescription>
                            This will move {archiveTargets.length <= 1 ? "the client" : "the selected clients"} to Archived. You can restore later.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3">
                        <Button variant="outline" onClick={() => { setArchiveOpen(false); setArchiveTargets([]) }}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmArchive}>Archive</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete client</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this client? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3">
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
