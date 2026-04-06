"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Plus, CheckCircle2, Search, Smartphone, Edit2, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { toast } from "sonner"

import { IAttendanceDevice, IDeviceType } from "@/interface"
import { getDeviceTypes } from "@/action/attendance_device"
import { PageSkeleton, TableSkeleton } from "@/components/ui/loading-skeleton"
import {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
    EmptyMedia,
} from "@/components/ui/empty"
import { createClient } from "@/utils/supabase/client"
import { ActivateDeviceDialog } from "@/components/dialogs/activate-device-dialog"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { useOrgStore } from "@/store/org-store"
import { useDebounce } from "@/utils/debounce"
import { CardTable, CardTableHeader, CardTableBody, CardTableCell, CardTableHead, CardTableRow } from "@/components/tables/card-table"

const editDeviceSchema = z.object({
    deviceName: z.string().min(1, "Device name is required"),
    location: z.string().optional(),
})

type EditDeviceForm = z.infer<typeof editDeviceSchema>

export default function AttendanceDevicesPage() {
    const [devices, setDevices] = React.useState<IAttendanceDevice[]>([])
    const [deviceTypes, setDeviceTypes] = React.useState<IDeviceType[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)
    const [searchQuery, setSearchQuery] = React.useState<string>("")
    const [filterStatus, setFilterStatus] = React.useState<string>("active")
    const [filterDeviceType, setFilterDeviceType] = React.useState<string>("")
    const [currentPageIndex, setCurrentPageIndex] = React.useState<number>(0)
    const [currentPageSize, setCurrentPageSize] = React.useState<number>(10)
    const [editDialogOpen, setEditDialogOpen] = React.useState(false)
    const [selectedDevice, setSelectedDevice] = React.useState<IAttendanceDevice | null>(null)
    const [activateDialogOpen, setActivateDialogOpen] = React.useState(false)
    const orgId = useOrgStore((s) => s.organizationId)
    const deviceTypesLoadedRef = React.useRef(false)
    const lastFetchedOrgIdRef = React.useRef<number | null>(null)
    const devicesAbortRef = React.useRef<AbortController | null>(null)
    const [total, setTotal] = React.useState<number>(0)
    const [totalPages, setTotalPages] = React.useState<number>(1)
    const [from, setFrom] = React.useState<number>(0)
    const [to, setTo] = React.useState<number>(0)
    const debouncedSearch = useDebounce(searchQuery, 400)

    const editForm = useForm<EditDeviceForm>({
        resolver: zodResolver(editDeviceSchema),
        defaultValues: {
            deviceName: "",
            location: "",
        },
    })

    const fetchDevices = React.useCallback(async () => {
        if (!orgId) {
            console.log('⚠️ Organization ID not set, skipping fetch')
            return
        }
        try {
            if (devicesAbortRef.current) {
                devicesAbortRef.current.abort()
            }
            const controller = new AbortController()
            devicesAbortRef.current = controller

            setLoading(true)
            const page = currentPageIndex + 1
            const limit = currentPageSize
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
            })
            if (orgId) params.set('orgId', String(orgId))
            if (filterStatus) params.set('status', filterStatus)
            if (filterDeviceType) params.set('type', filterDeviceType)
            if (debouncedSearch) params.set('search', debouncedSearch)

            const res = await fetch(`/api/devices?${params.toString()}`, { signal: controller.signal })
            if (!res.ok) {
                let payload: unknown = null
                try { payload = await res.json() } catch { }
                const msg = (payload as { message?: string } | null)?.message || res.statusText
                if (res.status === 401) {
                    setDevices([]); setTotal(0); setTotalPages(1); setFrom(0); setTo(0)
                    toast.error('Unauthorized. Please login again.')
                    return
                }
                if (res.status === 403) {
                    setDevices([]); setTotal(0); setTotalPages(1); setFrom(0); setTo(0)
                    toast.message('No organization found. Join or create an organization first.')
                    return
                }
                throw new Error(msg || `Request failed: ${res.status}`)
            }
            const data = await res.json()
            if (!data?.success) {
                throw new Error(data?.message || 'Failed to fetch devices')
            }

            const items = (data.items ?? []) as IAttendanceDevice[]
            setDevices(items)
            setTotal(Number(data.total || 0))
            setTotalPages(Number(data.totalPages || 1))
            setFrom(Number(data.from || 0))
            setTo(Number(data.to || 0))

            const newTotalPages = Number(data.totalPages || 1)
            if (page > newTotalPages && newTotalPages > 0) {
                setCurrentPageIndex(newTotalPages - 1)
            }
        } catch (error: unknown) {
            if ((error as any)?.name === 'AbortError') return
            console.error('❌ Error fetching devices:', error)
            toast.error(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }, [orgId, currentPageIndex, currentPageSize, filterStatus, filterDeviceType, debouncedSearch])

    const fetchDeviceTypes = React.useCallback(async () => {
        try {
            const response = await getDeviceTypes()
            if (!response.success) throw new Error("Failed to fetch device types")
            setDeviceTypes(response.data)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'An error occurred')
        }
    }, [])

    React.useEffect(() => {
        if (deviceTypesLoadedRef.current) return
        deviceTypesLoadedRef.current = true
        fetchDeviceTypes()
    }, [fetchDeviceTypes])

    React.useEffect(() => {
        if (!orgId) return
        if (lastFetchedOrgIdRef.current !== orgId) {
            lastFetchedOrgIdRef.current = orgId
        }
        fetchDevices()
    }, [orgId, currentPageIndex, currentPageSize, filterStatus, filterDeviceType, debouncedSearch, fetchDevices])

    const handleEditDevice = async (data: EditDeviceForm) => {
        if (!selectedDevice) return
        try {
            setLoading(true)
            const supabase = createClient()
            const { error } = await supabase
                .from('attendance_devices')
                .update({
                    device_name: data.deviceName,
                    location: data.location,
                })
                .eq('id', selectedDevice.id)

            if (error) throw error
            toast.success('Device updated successfully')
            setEditDialogOpen(false)
            fetchDevices()
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to update device')
        } finally {
            setLoading(false)
        }
    }

    if (!orgId) return <PageSkeleton />

    const activeCount = devices.filter(d => d.is_active).length
    const totalCount = total

    return (
        <div className="flex flex-1 flex-col gap-4">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div>
                        <h1 className="text-xl font-semibold">Attendance Devices</h1>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border rounded-lg shadow-sm bg-white">
                    <div className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <Smartphone className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Devices</p>
                                <p className="text-2xl font-bold">{totalCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-600/10 rounded-lg">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Active Devices</p>
                                <p className="text-2xl font-bold">{activeCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-black/10 rounded-lg">
                                <Filter className="h-6 w-6 text-slate-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Device Types</p>
                                <p className="text-2xl font-bold">{deviceTypes.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                    <h2 className="font-semibold text-lg text-gray-700">Devices List</h2>

                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-[250px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search devices..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPageIndex(0) }}
                                className="pl-9 bg-white"
                            />
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={filterDeviceType}
                                onChange={(e) => { setFilterDeviceType(e.target.value); setCurrentPageIndex(0) }}
                                className="px-3 py-2 border rounded-md text-sm bg-white w-full md:w-auto"
                            >
                                <option value="">All Types</option>
                                {deviceTypes.map((dt) => (
                                    <option key={dt.id} value={dt.id}>
                                        {dt.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={filterStatus}
                                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPageIndex(0) }}
                                className="px-3 py-2 border rounded-md text-sm bg-white w-full md:w-auto"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>

                            <Button onClick={() => setActivateDialogOpen(true)} className="bg-black text-white hover:bg-black/90 shrink-0">
                                <Plus className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">Activate</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {/* Content */}
                {loading ? (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                        <TableSkeleton rows={5} columns={5} />
                    </div>
                ) : total === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12">
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Smartphone className="h-14 w-14 text-muted-foreground mx-auto" />
                                </EmptyMedia>
                                <EmptyTitle>No devices found</EmptyTitle>
                                <EmptyDescription>
                                    Try adjusting your filters or activate a new device.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    </div>
                ) : (
                    <CardTable>
                        <CardTableHeader>
                            <CardTableRow>
                                <CardTableHead>Device Name</CardTableHead>
                                <CardTableHead>Serial Number</CardTableHead>
                                <CardTableHead>Type</CardTableHead>
                                <CardTableHead>Location</CardTableHead>
                                <CardTableHead>Status</CardTableHead>
                                <CardTableHead>Created</CardTableHead>
                                <CardTableHead className="text-right">Actions</CardTableHead>
                            </CardTableRow>
                        </CardTableHeader>
                        <CardTableBody>
                            {devices.map((device: IAttendanceDevice) => (
                                <CardTableRow key={device.id}>
                                    <CardTableCell className="font-medium text-gray-900">{device.device_name}</CardTableCell>
                                    <CardTableCell className="font-mono text-xs text-gray-500">{device.serial_number || '-'}</CardTableCell>
                                    <CardTableCell>
                                        <div className="font-normal text-gray-600">
                                            {device.device_types?.name || '-'}
                                        </div>
                                    </CardTableCell>
                                    <CardTableCell>{device.location || '-'}</CardTableCell>
                                    <CardTableCell>
                                        <Badge variant={device.is_active ? "default" : "secondary"} className={device.is_active ? "bg-green-600 hover:bg-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}>
                                            {device.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </CardTableCell>
                                    <CardTableCell className="text-gray-500 text-xs whitespace-nowrap">
                                        {new Date(device.created_at).toLocaleDateString()}
                                    </CardTableCell>
                                    <CardTableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setSelectedDevice(device)
                                                editForm.reset({
                                                    deviceName: device.device_name,
                                                    location: device.location || "",
                                                })
                                                setEditDialogOpen(true)
                                            }}
                                            className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100 hover:cursor-pointer"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                    </CardTableCell>
                                </CardTableRow>
                            ))}
                        </CardTableBody>
                    </CardTable>
                )}

                <PaginationFooter
                    page={currentPageIndex + 1}
                    totalPages={totalPages}
                    onPageChange={(p) => setCurrentPageIndex(Math.max(0, Math.min(p - 1, Math.max(0, totalPages - 1))))}
                    isLoading={loading}
                    from={from}
                    to={to}
                    total={total}
                    pageSize={currentPageSize}
                    onPageSizeChange={(size) => { setCurrentPageSize(size); setCurrentPageIndex(0); }}
                    pageSizeOptions={[10, 20, 50]}
                    className="border-none shadow-none bg-transparent p-0"
                />

                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Device</DialogTitle>
                        </DialogHeader>
                        {selectedDevice && (
                            <Form {...editForm}>
                                <form onSubmit={editForm.handleSubmit(handleEditDevice)} className="space-y-4">
                                    <FormItem>
                                        <FormLabel>Serial Number</FormLabel>
                                        <FormControl>
                                            <Input
                                                value={selectedDevice.serial_number || '-'}
                                                disabled
                                                className="bg-muted"
                                            />
                                        </FormControl>
                                    </FormItem>
                                    <FormField
                                        control={editForm.control}
                                        name="deviceName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Device Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter device name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={editForm.control}
                                        name="location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Location</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter location" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={loading}>
                                            {loading ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        )}
                    </DialogContent>
                </Dialog>

                <ActivateDeviceDialog
                    open={activateDialogOpen}
                    onOpenChange={setActivateDialogOpen}
                    onSuccess={fetchDevices}
                />
            </div>
        </div>
    )
}
