"use client"

import React from "react"
import { toast } from "sonner"

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
import { deleteWorkSchedule } from "@/action/schedule"
import { IWorkSchedule } from "@/interface"

interface DeleteScheduleDialogProps {
    schedule: IWorkSchedule
    onSuccess: (id: string | number) => void
    trigger?: React.ReactNode
}

export default function DeleteScheduleDialog({
    schedule,
    onSuccess,
    trigger,
}: DeleteScheduleDialogProps) {
    const handleDelete = async () => {
        try {
            const response = await deleteWorkSchedule(schedule.id)
            if (response.success) {
                toast.success("Schedule deleted successfully")
                onSuccess(schedule.id)
            } else {
                throw new Error(response.message)
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Unknown error")
        }
    }

    return (
        <AlertDialog>
            {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete <strong>{schedule.name}</strong>? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
