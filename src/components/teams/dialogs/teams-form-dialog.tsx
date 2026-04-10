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
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"

// code dihapus dari schema form — di-generate otomatis oleh database trigger
export const teamSchema = z.object({
  organization_id: z.coerce.number().min(1, "Organization ID is required"),
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional().default(""),
  is_active: z.boolean().default(true),
})

export type TeamForm = z.infer<typeof teamSchema>

interface TeamFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingId: number | string | null
  editingCode?: string | null
  form: UseFormReturn<TeamForm, unknown, TeamForm>
  onSubmit: (values: TeamForm) => Promise<void>
  organizationId: string | number | null | undefined
}

export function TeamFormDialog({
  open,
  onOpenChange,
  editingId,
  editingCode,
  form,
  onSubmit,
  organizationId,
}: TeamFormDialogProps) {
  const isEditing = !!editingId

  React.useEffect(() => {
    if (open && organizationId) {
      const current = form.getValues("organization_id")
      if (!current || current === 0) {
        form.setValue("organization_id", Number(organizationId), {
          shouldValidate: false,
          shouldDirty: false,
        })
      }
    }
  }, [open, organizationId, form])

  const handleSubmit = (values: TeamForm) => {
    return onSubmit({
      ...values,
      organization_id: values.organization_id || Number(organizationId) || 0,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Team" : "Add Team"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update team details."
              : "Create a new team. Code will be generated automatically."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 pt-2"
            noValidate
          >
            {/* Team Code — readonly display saat edit, hidden saat add */}
            {isEditing && editingCode && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Team Code</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {editingCode}
                </Badge>
              </div>
            )}

            {!isEditing && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Team code will be auto-generated</span>
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Engineering" {...field} />
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
                    <Textarea
                      placeholder="What does this team do?"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
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
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Save changes"
                  : "Create team"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}