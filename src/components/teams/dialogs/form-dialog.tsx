"use client"

import React from "react"
import { z } from "zod"
import { UseFormReturn } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export const teamSchema = z.object({
  organization_id: z.number().min(1, "Organization ID is required"),
  code: z.string().optional().or(z.literal("")),
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional().or(z.literal("")),
  is_active: z.boolean(),
  settings: z.string().optional().or(z.literal("")),
  metadata: z.string().optional().or(z.literal("")),
})

export type TeamForm = z.infer<typeof teamSchema>

interface TeamFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingId: number | string | null
  form: UseFormReturn<TeamForm>
  onSubmit: (values: TeamForm) => void
  organizationId: string | number | null | undefined
}

export function TeamFormDialog({
  open,
  onOpenChange,
  editingId,
  form,
  onSubmit,
  organizationId,
}: TeamFormDialogProps) {
  const isEditing = !!editingId

  // Pastikan ID organisasi masuk ke form state saat modal dibuka
  React.useEffect(() => {
    if (open && organizationId) {
      form.setValue("organization_id", Number(organizationId))
    }
  }, [open, organizationId, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Team" : "Add Team"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update team details." : "Create a new team."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
            noValidate
          >
            {/* Hidden field agar validasi organization_id (number) terpenuhi */}
            <FormField
              control={form.control}
              name="organization_id"
              render={({ field }) => (
                <input type="hidden" {...field} value={field.value || ""} />
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. DEV-01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Engineering" {...field} />
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
                    <Textarea placeholder="Team description..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Create team"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}