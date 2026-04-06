"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Briefcase, Search, RotateCcw, Pencil, Trash, X } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { IPositions } from "@/interface"
import { deletePositions } from "@/action/position"
import {
    createPositions,
    updatePositions,
} from "@/action/position"

import {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
    EmptyMedia,
} from "@/components/ui/empty"
import { TableSkeleton } from "@/components/skeleton/tables-loading"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getAllOrganization } from "@/action/organization"
import { useHydration } from "@/hooks/useHydration"
import { useDebounce } from "@/utils/debounce"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaginationFooter } from "@/components/customs/pagination-footer"

const positionSchema = z.object({
    organization_id: z.string().min(1, "Organization is required"),
    code: z.string().min(2, "min 2 characters"),
    title: z.string().min(2, "min 2 characters"),
    description: z.string().optional(),
    level: z.string().optional(),
    is_active: z.boolean(),
})

type PositionsForm = z.infer<typeof positionSchema>

export default function PositionsPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const { isHydrated, organizationId } = useHydration()

    const [open, setOpen] = React.useState(false)
    const [editingDetail, setEditingDetail] = React.useState<IPositions | null>(null)
    const [organizations, setOrganizations] = React.useState<{ id: string; name: string }[]>([])

    const [searchTerm, setSearchTerm] = React.useState("")
    const [filterStatus, setFilterStatus] = React.useState<'all' | 'active' | 'inactive'>('all')
    const [page, setPage] = React.useState(1)
    const [pageSize, setPageSize] = React.useState(10)

    const debouncedSearch = useDebounce(searchTerm, 400)

    // Reset page 1 saat search berubah
    React.useEffect(() => {
        setPage(1)
    }, [debouncedSearch, filterStatus])

    // Cleanup URL on mount
    React.useEffect(() => {
        if (typeof window !== "undefined" && window.location.search) {
            router.replace(window.location.pathname)
        }
    }, [router])

    interface PositionsApiPage {
        success: boolean
        data: IPositions[]
        pagination: { total: number }
    }

    const { data: pageData, isLoading: loading, isFetching, refetch } = useQuery<PositionsApiPage>({
        queryKey: ["positions", "paged", organizationId, debouncedSearch, filterStatus, page, pageSize],
        queryFn: async ({ signal }) => {
            const url = new URL("/api/positions", window.location.origin)
            url.searchParams.set("limit", String(pageSize))
            url.searchParams.set("active", filterStatus)
            url.searchParams.set("page", String(page))
            if (organizationId) url.searchParams.set("organizationId", String(organizationId))
            if (debouncedSearch) url.searchParams.set("search", debouncedSearch)

            const res = await fetch(url.toString(), { credentials: "same-origin", signal })
            const json = await res.json()
            if (!json?.success) throw new Error(json?.message || "Failed to fetch positions")
            return json as PositionsApiPage
        },
        enabled: isHydrated && !!organizationId,
        staleTime: 60_000,
    })

    const total = pageData?.pagination?.total ?? 0
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const positions = pageData?.data ?? []

    // Filter client-side untuk feedback instan
    const filteredPositions = React.useMemo(() => {
        if (!searchTerm || !searchTerm.trim()) return positions

        const query = searchTerm.toLowerCase().trim()
        return positions.filter((p) => {
            const code = (p.code || "").toLowerCase()
            const title = (p.title || "").toLowerCase()
            const desc = (p.description || "").toLowerCase()
            return code.includes(query) || title.includes(query) || desc.includes(query)
        })
    }, [positions, searchTerm])

    const fetchOrganizations = async () => {
        try {
            const response = await getAllOrganization()
            if (!response.success) throw new Error(response.message)
            setOrganizations(response.data)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unknown error")
        }
    }

    React.useEffect(() => {
        if (isHydrated && !organizationId) {
            fetchOrganizations()
        }
    }, [isHydrated, organizationId])

    const form = useForm<PositionsForm>({
        resolver: zodResolver(positionSchema),
        defaultValues: {
            organization_id: "",
            code: "",
            title: "",
            description: "",
            level: "",
            is_active: true,
        },
    })

    // sinkronkan orgId ke form setelah didapat dari store
    React.useEffect(() => {
        if (organizationId && !open) {
            form.reset({
                organization_id: String(organizationId),
                code: "",
                title: "",
                description: "",
                level: "",
                is_active: true,
            })
        }
    }, [organizationId, form, open])
    const onSubmit = async (values: PositionsForm) => {
        try {
            const payload = {
                ...values,
                level: values.level || "",
                description: values.description || ""
            }

            const result = editingDetail
                ? await updatePositions(editingDetail.id, payload)
                : await createPositions(payload)

            if (result.success) {
                toast.success(editingDetail ? "Position updated" : "Position created")
                setOpen(false)
                setEditingDetail(null)
                form.reset()
                await queryClient.invalidateQueries({ queryKey: ["positions"] })
                refetch()
            } else {
                toast.error(result.message || "Failed to save position")
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred")
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const result = await deletePositions(id)
            if (result.success) {
                toast.success("Position deleted successfully")
                await queryClient.invalidateQueries({ queryKey: ["positions"] })
                refetch()
            } else {
                toast.error(result.message || "Failed to delete position")
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred")
        }
    }

    const handleEdit = (position: IPositions) => {
        setEditingDetail(position)
        form.reset({
            organization_id: position.organization_id,
            code: position.code,
            title: position.title,
            description: position.description || "",
            level: position.level || "",
            is_active: position.is_active,
        })
        setOpen(true)
    }

    const handleRefresh = async () => {
        await queryClient.invalidateQueries({ queryKey: ["positions"] })
        refetch()
        toast.success("Data refreshed")
    }

    const handleDialogOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) {
            setEditingDetail(null)
            form.reset({
                organization_id: String(organizationId || ""),
                code: "",
                title: "",
                description: "",
                level: "",
                is_active: true,
            })
        }
    }

    return (
        <div className="flex flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Positions</h1>
                <Button size="sm" onClick={() => { setEditingDetail(null); form.reset({ organization_id: String(organizationId || ""), code: "", title: "", description: "", level: "", is_active: true }); setOpen(true); }}>
                    <Plus className="h-4 w-4" /> Add Position
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                    <Input
                        placeholder="Search positions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={loading}
                        className="pl-10 pr-8"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | 'active' | 'inactive')}>
                        <SelectTrigger className="w-[150px] h-9">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="h-9"
                    >
                        <RotateCcw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div>
                {(loading || (isFetching && filteredPositions.length === 0)) ? (
                    <TableSkeleton rows={8} columns={5} />
                ) : filteredPositions.length === 0 ? (
                    <div className="py-20">
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Briefcase className="h-14 w-14 text-muted-foreground mx-auto" />
                                </EmptyMedia>
                                <EmptyTitle>No positions</EmptyTitle>
                                <EmptyDescription>
                                    {searchTerm ? `No positions found matching "${searchTerm}"` : "No positions in this organization."}
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    </div>
                ) : (
                    <div className="relative overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-border">
                                    <TableHead className="font-medium text-xs uppercase tracking-wide py-3">Code</TableHead>
                                    <TableHead className="font-medium text-xs uppercase tracking-wide">Position Name</TableHead>
                                    <TableHead className="font-medium text-xs uppercase tracking-wide hidden md:table-cell">Description</TableHead>
                                    <TableHead className="font-medium text-xs uppercase tracking-wide">Status</TableHead>
                                    <TableHead className="w-20 text-right pr-6 font-medium text-xs uppercase tracking-wide">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPositions.map((position) => (
                                    <TableRow
                                        key={position.id}
                                        className="group cursor-pointer transition-colors w-full"
                                        onClick={() => router.push(`/position/${position.id}`)}
                                    >
                                        <TableCell className="py-3 font-medium text-sm">
                                            {position.code}
                                        </TableCell>
                                        <TableCell className="py-3 text-sm">
                                            {position.title}
                                        </TableCell>
                                        <TableCell className="py-3 text-sm text-muted-foreground hidden md:table-cell">
                                            {position.description || <span className="text-muted-foreground/30">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`h-2 w-2 rounded-full shrink-0 ${position.is_active ? "bg-slate-600" : "bg-gray-300"}`} />
                                                <span className="text-xs font-medium">
                                                    {position.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 pr-6 text-right" onClick={e => e.stopPropagation()}>
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => handleEdit(position)}
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-destructive hover:bg-red-50 hover:border-red-200"
                                                        >
                                                            <Trash className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Position</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete <span className="font-semibold text-foreground">{position.title}</span>? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(position.id)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            <PaginationFooter
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                isLoading={loading || isFetching}
                from={total > 0 ? (page - 1) * pageSize + 1 : 0}
                to={Math.min(page * pageSize, total)}
                total={total}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 50, 100]}
            />

            <Dialog open={open} onOpenChange={handleDialogOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingDetail ? 'Edit Position' : 'Add Position'}
                        </DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {!organizationId && (
                                <FormField
                                    control={form.control}
                                    name="organization_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Organization</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Organization" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {organizations.map((org) => (
                                                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Code</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="POS-01" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Project Manager" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Role details..." />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="is_active"
                                render={({ field }) => (
                                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="space-y-0.5">
                                            <FormLabel>Active Status</FormLabel>
                                            <div className="text-[0.8rem] text-muted-foreground">
                                                Position will be available for members
                                            </div>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button type="submit">{editingDetail ? 'Update' : 'Create'}</Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

