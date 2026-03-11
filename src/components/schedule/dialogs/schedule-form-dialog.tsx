"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { toast } from "sonner"

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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { IWorkSchedule } from "@/interface"
import { createWorkSchedule, updateWorkSchedule } from "@/action/schedule"
import { SCHEDULE_TYPES } from "@/constants/attendance-status"

const scheduleSchema = z.object({
    organization_id: z.string().min(1, "Organization is required"),
    name: z.string().min(2, "min 2 characters"),
    description: z.string().optional(),
    schedule_type: z.string().optional(),
    is_active: z.boolean(),
})

type ScheduleForm = z.infer<typeof scheduleSchema>

interface ScheduleFormDialogProps {
    organizationId: string
    organizationName: string
    editingDetail: IWorkSchedule | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (data: IWorkSchedule, isEdit: boolean) => void
    trigger?: React.ReactNode
}

export default function ScheduleFormDialog({
    organizationId,
    organizationName,
    editingDetail,
    open,
    onOpenChange,
    onSuccess,
    trigger,
}: ScheduleFormDialogProps) {
    const form = useForm<ScheduleForm>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: {
            organization_id: organizationId,
            name: "",
            description: "",
            schedule_type: "",
            is_active: true,
        },
    })

    // Update form values when editingDetail changes or dialog opens
    React.useEffect(() => {
        if (open) {
            if (editingDetail) {
                form.reset({
                    organization_id: String(editingDetail.organization_id || organizationId),
                    name: editingDetail.name || "",
                    description: editingDetail.description || "",
                    schedule_type: editingDetail.schedule_type || "",
                    is_active: editingDetail.is_active ?? true,
                })
            } else {
                form.reset({
                    organization_id: organizationId,
                    name: "",
                    description: "",
                    schedule_type: "",
                    is_active: true,
                })
            }
        }
    }, [open, editingDetail, organizationId, form])

    const handleSubmit = async (values: ScheduleForm) => {
        try {
            let res: { success: boolean; message?: string; data?: any }

            if (editingDetail) {
                res = await updateWorkSchedule(editingDetail.id, {
                    ...values,
                    organization_id: Number(values.organization_id),
                } as Partial<IWorkSchedule>)

                if (res.success && res.data) {
                    toast.success(res.message || "Schedule updated successfully")
                    onSuccess(res.data, true)
                    onOpenChange(false)
                } else {
                    throw new Error(res.message || "Failed to update schedule")
                }
            } else {
                res = await createWorkSchedule({
                    ...values,
                    organization_id: Number(values.organization_id),
                } as Partial<IWorkSchedule>)

                if (res.success && res.data) {
                    toast.success("Schedule created successfully")
                    onSuccess(res.data, false)
                    onOpenChange(false)
                } else {
                    throw new Error(res.message || "Failed to create schedule")
                }
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Unknown error")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingDetail ? "Edit Schedule" : "Add Schedule"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 text-xs">
                        <FormField
                            control={form.control}
                            name="organization_id"
                            render={({ field }) => <input type="hidden" {...field} />}
                        />
                        <FormItem>
                            <FormLabel>Organization</FormLabel>
                            <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">
                                {organizationName || "(Organization name not loaded)"}
                            </div>
                        </FormItem>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input type="text" placeholder="e.g. Office Shift (Mon–Fri)" {...field} />
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
                                        <Input type="text" placeholder="Optional: brief description" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="schedule_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select schedule type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {SCHEDULE_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-md border p-3">
                                    <FormLabel className="text-sm">Active Status</FormLabel>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            className="w-full bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90"
                        >
                            {editingDetail ? "Update Schedule" : "Create Schedule"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
