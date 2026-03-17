"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { Plus, Briefcase, Search, RotateCcw, Pencil, Trash, ChevronRight, ChevronsLeft, ChevronLeft, ChevronsRight } from "lucide-react"
import Link from "next/link"
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
    DialogTrigger,
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
import { Switch } from "@/components/ui/switch"

import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { IPositions } from "@/interface"
import { deletePositions } from "@/action/position"
import {
    createPositions,
    getAllPositions,
    updatePositions,
} from "@/action/position"

import {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
    EmptyMedia,
} from "@/components/ui/empty"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getAllOrganization } from "@/action/organization"
import { Can } from "@/components/common/can"
import { useHydration } from "@/hooks/useHydration"
import { logger } from '@/lib/logger';
import { getCache, setCache } from "@/lib/local-cache"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
    const queryClient = useQueryClient()
    const { isHydrated, organizationId } = useHydration()
    const [open, setOpen] = React.useState(false)
    const [editingDetail, setEditingDetail] = React.useState<IPositions | null>(null)
    const [positions, setPositions] = React.useState<IPositions[]>([])
    const [organizations, setOrganizations] = React.useState<{ id: string; name: string }[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [filterStatus, setFilterStatus] = React.useState<'all' | 'active' | 'inactive'>('all')
    const [sortOrder] = React.useState("newest")
    const [pageIndex, setPageIndex] = React.useState(0)
    const [pageSize, setPageSize] = React.useState("10") // setPageSize akan digunakan nanti

    const handleDelete = async (id: string) => {
        try {
            const result = await deletePositions(id)
            if (result.success) {
                toast.success("Position deleted successfully")
                await queryClient.invalidateQueries({ queryKey: ['positions'] })
                fetchPositions()
            } else {
                toast.error(result.message || "Failed to delete position")
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred")
        }
    }

    const filteredData = React.useMemo(() => {
        let filtered = [...positions]
        if (searchTerm) {
            const lowercasedQuery = searchTerm.toLowerCase()
            filtered = filtered.filter((position) => {
                const code = (position.code || "").toLowerCase()
                const title = (position.title || "").toLowerCase()
                const description = (position.description || "").toLowerCase()
                const level = (position.level || "").toLowerCase()
                return (
                    code.includes(lowercasedQuery) ||
                    title.includes(lowercasedQuery) ||
                    description.includes(lowercasedQuery) ||
                    level.includes(lowercasedQuery)
                )
            })
        }
        if (filterStatus !== "all") {
            filtered = filtered.filter((position) => {
                if (filterStatus === "active") return position.is_active
                if (filterStatus === "inactive") return !position.is_active
                return true
            })
        }
        if (sortOrder === "newest") {
            filtered.sort((a, b) => new Date((b as any).created_at || 0).getTime() - new Date((a as any).created_at || 0).getTime())
        } else if (sortOrder === "oldest") {
            filtered.sort((a, b) => new Date((a as any).created_at || 0).getTime() - new Date((b as any).created_at || 0).getTime())
        } else if (sortOrder === "a-z") {
            filtered.sort((a, b) => (a.title || "").toLowerCase().localeCompare((b.title || "").toLowerCase()))
        } else if (sortOrder === "z-a") {
            filtered.sort((a, b) => (b.title || "").toLowerCase().localeCompare((a.title || "").toLowerCase()))
        }
        return filtered
    }, [searchTerm, filterStatus, sortOrder, positions])

    const pageSizeNum = parseInt(pageSize)
    const totalPages = Math.ceil(filteredData.length / pageSizeNum)
    const paginatedData = filteredData.slice(
        pageIndex * pageSizeNum,
        (pageIndex + 1) * pageSizeNum
    )

    React.useEffect(() => {
        setPageIndex(0)
    }, [searchTerm, filterStatus, sortOrder])

    React.useEffect(() => {
        if (pageIndex >= totalPages && totalPages > 0) {
            setPageIndex(totalPages - 1)
        }
    }, [totalPages, pageIndex])

    const fetchPositions = React.useCallback(async () => {
        try {
            setLoading(true)

            if (!organizationId) {
                toast.error('Please select an organization')
                setLoading(false)
                return
            }

            const result = await getAllPositions(organizationId)
            await queryClient.invalidateQueries({ queryKey: ['positions'] })
            const typedResponse = result as { success: boolean; data: IPositions[]; message: string }
            if (!typedResponse.success) throw new Error(typedResponse.message)

            setPositions(typedResponse.data)
            // cache 2 menit
            setCache<IPositions[]>(`positions:${organizationId}`, typedResponse.data, 1000 * 120)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }, [organizationId])

    const fetchOrganizations = async () => {
        try {
            const response: unknown = await getAllOrganization()
            await queryClient.invalidateQueries({ queryKey: ['organizations'] })
            const typedResponse = response as { success: boolean; data: { id: string; name: string }[]; message: string }
            if (!typedResponse.success) throw new Error(typedResponse.message)
            setOrganizations(typedResponse.data)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Unknown error')
        }
    }

    React.useEffect(() => {
        if (!organizationId) {
            fetchOrganizations()
        }
    }, [organizationId])

    React.useEffect(() => {
        if (isHydrated && organizationId) {
            console.log('[POSITION-PAGE] Hydration complete, fetching positions')
            const cached = getCache<IPositions[]>(`positions:${organizationId}`)
            if (cached && cached.length > 0) {
                setPositions(cached)
                setLoading(false)
                return
            }
            fetchPositions()
        }
    }, [isHydrated, organizationId, fetchPositions])

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



    const handleSubmit = async (values: PositionsForm) => {
        logger.debug("🚀 Submit values:", values)
        try {
            let res
            if (editingDetail) {
                res = await updatePositions(editingDetail.id, values)
            } else {
                res = await createPositions(values)
            }
            if (!res.success) throw new Error(res.message)
            await queryClient.invalidateQueries({ queryKey: ['positions'] })
            toast.success(editingDetail ? 'Saved successfully' : 'Position created successfully')
            setOpen(false)
            setEditingDetail(null)
            fetchPositions()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Unknown error')
        }
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
        <div className="flex flex-1 flex-col gap-4 w-full">
            <style jsx global>{`
                html body .custom-hover-row:nth-child(even) {
                    background-color: #f3f4f6;
                }
                html body.dark .custom-hover-row:nth-child(even) {
                    background-color: #1f2937;
                }
                html body .custom-hover-row:hover,
                html body .custom-hover-row:hover > td {
                    background-color: #d1d5db !important; /* dark gray hover */
                }
                html body.dark .custom-hover-row:hover,
                html body.dark .custom-hover-row:hover > td {
                    background-color: #374151 !important;
                }
            `}</style>
            <div className="w-full">
                <div className="w-full bg-card rounded-lg shadow-sm border">
                    <div className="p-4 md:p-6 space-y-4 overflow-x-auto">
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                            <div className="flex flex-1 items-center gap-3 relative">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search positions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="ps-10 pl-10"
                                />
                            </div>
                            <div className="flex items-center gap-3 sm:gap-2 flex-wrap">
                                <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | 'active' | 'inactive')}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" size="sm" onClick={fetchPositions} className="whitespace-nowrap">
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Dialog open={open} onOpenChange={handleDialogOpenChange}>
                                    <DialogTrigger asChild>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setEditingDetail(null)
                                                form.reset({
                                                    organization_id: String(organizationId || ""),
                                                    code: "",
                                                    title: "",
                                                    description: "",
                                                    level: "",
                                                    is_active: true,
                                                })
                                                setOpen(true)
                                            }}
                                            className="whitespace-nowrap"
                                        >
                                            Add<Plus className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent aria-describedby={undefined}>
                                        <DialogHeader>
                                            <DialogTitle>
                                                {editingDetail ? 'Edit' : 'Add'}
                                            </DialogTitle>
                                        </DialogHeader>
                                        <Form {...form}>
                                            <form
                                                onSubmit={form.handleSubmit(handleSubmit)}
                                                className="space-y-4"
                                            >
                                                {/* Organization field */}
                                                {organizationId ? (
                                                    <FormField
                                                        control={form.control}
                                                        name="organization_id"
                                                        render={({ field }) => (
                                                            <input
                                                                type="hidden"
                                                                value={String(organizationId)}
                                                                onChange={field.onChange}
                                                            />
                                                        )}
                                                    />
                                                ) : (
                                                    <Can permission="view_positions">
                                                        <FormField
                                                            control={form.control}
                                                            name="organization_id"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Organization</FormLabel>
                                                                    <Select
                                                                        onValueChange={field.onChange}
                                                                        value={field.value}
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Select..." />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {organizations.map((org) => (
                                                                                <SelectItem key={org.id} value={String(org.id)}>
                                                                                    {org.name}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </Can>
                                                )}

                                                <FormField
                                                    control={form.control}
                                                    name="code"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Code</FormLabel>
                                                            <FormControl>
                                                                <Input type="text" {...field} />
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
                                                                <Input type="text" {...field} />
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
                                                                <Input type="text" {...field ?? ""} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                {/* <FormField
                                        control={form.control}
                                        name="level"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Level</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field ?? ""} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    /> */}
                                                <FormField
                                                    control={form.control}
                                                    name="is_active"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Active</FormLabel>
                                                            <FormControl>
                                                                <Switch
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button type="submit" className="w-full">
                                                    {editingDetail ? 'Update' : 'Create'}
                                                </Button>
                                            </form>
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        <div className="mt-6">
                            {loading && positions.length === 0 ? (
                                <TableSkeleton rows={6} columns={5} />
                            ) : positions.length === 0 ? (
                                <div className="mt-20">
                                    <Empty>
                                        <EmptyHeader>
                                            <EmptyMedia variant="icon">
                                                <Briefcase className="h-14 w-14 text-muted-foreground mx-auto" />
                                            </EmptyMedia>
                                            <EmptyTitle>No positions yet</EmptyTitle>
                                            <EmptyDescription>
                                                There are no positions for this organization. Use the &quot;Add&quot; button to create a new position.
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                </div>
                            ) : (
                                <>
                                    <div className="border rounded-lg overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Code</TableHead>
                                                    <TableHead>Position Name</TableHead>
                                                    <TableHead>Description</TableHead>
                                                    {/* <TableHead>Level</TableHead> */}
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {loading ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center text-muted-foreground">Loading...</TableCell>
                                                    </TableRow>
                                                ) : paginatedData.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center text-muted-foreground">No positions found</TableCell>
                                                    </TableRow>
                                                ) : (
                                                    paginatedData.map((position) => (
                                                        <TableRow
                                                            key={position.id}
                                                            className="transition-colors custom-hover-row cursor-pointer"
                                                        >
                                                            <TableCell>{position.code}</TableCell>
                                                            <TableCell>{position.title}</TableCell>
                                                            <TableCell>{position.description || "-"}</TableCell>
                                                            {/* <TableCell>{position.level || "-"}</TableCell> */}
                                                            <TableCell>
                                                                {position.is_active ? (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-primary-foreground">Active</span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">Inactive</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingDetail(position); form.reset(position); setOpen(true); }} title="Edit position">
                                                                        <Pencil className="w-4 h-4" />
                                                                    </Button>
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete position">
                                                                                <Trash className="w-4 h-4" />
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>Delete Position</AlertDialogTitle>
                                                                                <AlertDialogDescription>Are you sure you want to delete {position.title}? This action cannot be undone.</AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                <AlertDialogAction onClick={() => handleDelete(position.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                        <Link href={`/position/${position.id}`}>
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8" title="View Members">
                                                                                <ChevronRight className="w-4 h-4" />
                                                                            </Button>
                                                                        </Link>
                                                                    </AlertDialog>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 px-4 bg-muted/50 rounded-md border mt-10">
                                        <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 flex-nowrap justify-center w-full md:w-auto">
                                            <Button variant="ghost" size="sm" onClick={() => setPageIndex(0)} disabled={pageIndex === 0 || loading} className="h-8 w-8 p-0" title="First page">
                                                <ChevronsLeft className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setPageIndex(pageIndex - 1)} disabled={pageIndex === 0 || loading} className="h-8 w-8 p-0" title="Previous page">
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap ml-1 sm:ml-2">Page</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max={totalPages}
                                                value={pageIndex + 1}
                                                onChange={(e) => {
                                                    const page = e.target.value ? Number(e.target.value) - 1 : 0;
                                                    setPageIndex(page);
                                                }}
                                                className="w-10 sm:w-12 h-8 px-2 border rounded text-xs sm:text-sm text-center mx-1 sm:mx-2 bg-background"
                                                disabled={loading || totalPages === 0}
                                            />
                                            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">/ {totalPages}</span>
                                            <Button variant="ghost" size="sm" onClick={() => setPageIndex(pageIndex + 1)} disabled={pageIndex >= totalPages - 1 || loading} className="h-8 w-8 p-0" title="Next page">
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setPageIndex(totalPages - 1)} disabled={pageIndex >= totalPages - 1 || loading} className="h-8 w-8 p-0" title="Last page">
                                                <ChevronsRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex flex-row items-center justify-center md:justify-end gap-2 md:gap-4 w-full md:w-auto">
                                            <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                                                {`Showing ${paginatedData.length > 0 ? pageIndex * parseInt(pageSize) + 1 : 0} to ${Math.min((pageIndex + 1) * parseInt(pageSize), filteredData.length)} of ${filteredData.length} total records`}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Select value={pageSize} onValueChange={(value) => { setPageSize(value); setPageIndex(0); }}>
                                                    <SelectTrigger className="h-8 w-[70px]">
                                                        <SelectValue placeholder={pageSize} />
                                                    </SelectTrigger>
                                                    <SelectContent side="top">
                                                        <SelectItem value="10">10</SelectItem>
                                                        <SelectItem value="50">50</SelectItem>
                                                        <SelectItem value="100">100</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

