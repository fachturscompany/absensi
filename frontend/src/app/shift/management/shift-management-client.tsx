"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { type Resolver, type SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { DataTable } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash } from "lucide-react"

import type { IShift } from "@/interface"
import { createShift, deleteShift, updateShift } from "@/action/shift"

const shiftSchema = z.object({
  organization_id: z.string().min(1, "Organization is required"),
  code: z.string().optional(),
  name: z.string().min(2, "Min 2 characters"),
  description: z.string().optional(),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  break_duration_minutes: z.coerce.number().int().min(0),
  color_code: z.string().optional(),
  overnight: z.coerce.boolean().default(false),
  is_active: z.coerce.boolean().default(true),
})

type ShiftForm = z.infer<typeof shiftSchema>

interface ShiftManagementClientProps {
  initialShifts: IShift[]
  organizationId: string
  organizationName: string
  isLoading?: boolean
  pageIndex?: number
  pageSize?: number
  totalRecords?: number
  onPageIndexChange?: (pageIndex: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onRefresh?: () => void
}

const toTimeHHMM = (t?: string | null) => {
  if (!t) return "-"
  const parts = t.split(":")
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`
  return t
}

export default function ShiftManagementClient({
  initialShifts,
  organizationId,
  organizationName: _organizationName,
  isLoading = false,
  pageIndex,
  pageSize,
  totalRecords,
  onPageIndexChange,
  onPageSizeChange,
  onRefresh,
}: ShiftManagementClientProps) {
  const [shifts, setShifts] = React.useState<IShift[]>(initialShifts)
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<IShift | null>(null)

  React.useEffect(() => {
    setShifts(initialShifts)
  }, [initialShifts, organizationId])

  const form = useForm<ShiftForm>({
    resolver: zodResolver(shiftSchema) as unknown as Resolver<ShiftForm>,
    defaultValues: {
      organization_id: organizationId,
      code: "",
      name: "",
      description: "",
      start_time: "08:00",
      end_time: "17:00",
      break_duration_minutes: 0,
      color_code: "#2563eb",
      overnight: false,
      is_active: true,
    },
  })

  const closeDialog = () => {
    setOpen(false)
    setEditing(null)
    form.reset({
      organization_id: organizationId,
      code: "",
      name: "",
      description: "",
      start_time: "08:00",
      end_time: "17:00",
      break_duration_minutes: 0,
      color_code: "#2563eb",
      overnight: false,
      is_active: true,
    })
  }

  const openDialog = (shift?: IShift) => {
    if (shift) {
      setEditing(shift)
      form.reset({
        organization_id: String(shift.organization_id || organizationId),
        code: shift.code || "",
        name: shift.name || "",
        description: shift.description || "",
        start_time: toTimeHHMM(shift.start_time),
        end_time: toTimeHHMM(shift.end_time),
        break_duration_minutes: Number(shift.break_duration_minutes || 0),
        color_code: (shift.color_code || "#2563eb") as any,
        overnight: !!shift.overnight,
        is_active: shift.is_active ?? true,
      })
    } else {
      setEditing(null)
      form.reset({
        organization_id: organizationId,
        code: "",
        name: "",
        description: "",
        start_time: "08:00",
        end_time: "17:00",
        break_duration_minutes: 0,
        color_code: "#2563eb",
        overnight: false,
        is_active: true,
      })
    }
    setOpen(true)
  }

  const handleSubmit: SubmitHandler<ShiftForm> = async (values) => {
    try {
      let res: { success: boolean; message?: string; data?: any }

      if (editing) {
        res = await updateShift(editing.id, values as any)
        if (!res.success || !res.data) throw new Error(res.message || "Failed to update shift")

        toast.success(res.message || "Shift updated")
        setShifts((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...res.data } : s)))
        onRefresh?.()
      } else {
        res = await createShift(values as any)
        if (!res.success || !res.data) throw new Error(res.message || "Failed to create shift")

        toast.success(res.message || "Shift created")
        setShifts((prev) => [res.data as IShift, ...prev])
        onRefresh?.()
      }

      closeDialog()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteShift(id)
      if (!res.success) throw new Error(res.message || "Failed to delete")

      toast.success(res.message || "Shift deleted")
      setShifts((prev) => prev.filter((s) => s.id !== id))
      onRefresh?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const columns: ColumnDef<IShift>[] = [
    { accessorKey: "code", header: "Code" },
    { accessorKey: "name", header: "Name" },
    {
      id: "time_range",
      header: "Time",
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="font-medium">
            {toTimeHHMM(s.start_time)} - {toTimeHHMM(s.end_time)}
            {s.overnight ? <span className="ml-2 text-xs text-muted-foreground">(overnight)</span> : null}
          </div>
        )
      },
    },
    {
      accessorKey: "break_duration_minutes",
      header: "Break (min)",
      cell: ({ row }) => {
        const v = row.original.break_duration_minutes
        return <div className="tabular-nums">{typeof v === "number" ? v : Number(v || 0)}</div>
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const active = row.original.is_active
        return (
          <Badge variant={active ? "default" : "secondary"} className={active ? "bg-green-500 hover:bg-green-600" : ""}>
            {active ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 cursor-pointer bg-secondary border-0 p-0"
              onClick={() => openDialog(s)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 text-red-500 cursor-pointer bg-secondary border-0 p-0"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Shift</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete shift <span className="font-medium">{s.name}</span>?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(s.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    },
  ]

  return (
    <div className="w-full h-full">
      <DataTable
        columns={columns}
        data={shifts}
        isLoading={isLoading}
        showGlobalFilter={true}
        showFilters={true}
        showColumnToggle={false}
        layout="card"
        globalFilterPlaceholder="Search shifts..."
        manualPagination={typeof pageIndex === "number" && typeof pageSize === "number"}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalRecords={totalRecords}
        onPageIndexChange={onPageIndexChange}
        onPageSizeChange={onPageSizeChange}
        toolbarRight={
          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              if (!isOpen) closeDialog()
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()} className="gap-2 whitespace-nowrap">
                <Plus className="h-4 w-4" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Shift" : "Add Shift"}</DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Morning Shift" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="MORNING" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="start_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="end_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="break_duration_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Break Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="color_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <FormControl>
                            <Input type="color" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea rows={3} placeholder="Optional description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col gap-3">
                    <FormField
                      control={form.control}
                      name="overnight"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Overnight</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              If shift ends on the next day.
                            </div>
                          </div>
                          <FormControl>
                            <Switch checked={!!field.value} onCheckedChange={field.onChange} />
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
                            <FormLabel>Status</FormLabel>
                            <div className="text-sm text-muted-foreground">Enable/disable this shift.</div>
                          </div>
                          <FormControl>
                            <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={closeDialog}>
                      Cancel
                    </Button>
                    <Button type="submit">{editing ? "Save Changes" : "Create"}</Button>
                  </div>

                  <input type="hidden" {...form.register("organization_id")} />
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />
    </div>
  )
}
