"use client"

import { ITeams } from "@/interface"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface TeamDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: ITeams | null
  onConfirm: () => void
}

export function TeamDeleteDialog({
  open,
  onOpenChange,
  target,
  onConfirm,
}: TeamDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Team</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the team{" "}
            <strong>{target?.name}</strong>? This action cannot be undone and
            may affect members currently assigned to this team.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}