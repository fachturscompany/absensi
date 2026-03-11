"use client"
import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import type { DuplicateProjectOptions } from "./types"

interface Props {
  open: boolean
  projectName: string
  onOpenChange: (open: boolean) => void
  onConfirm: (options: DuplicateProjectOptions) => Promise<void> | void
  isSubmitting?: boolean
}

export default function DuplicateProjectDialog({ open, projectName, onOpenChange, onConfirm, isSubmitting }: Props) {
  const defaultName = useMemo(() => `Copy of ${projectName}`, [projectName])
  const [name, setName] = useState(defaultName)
  const [keepTodos, setKeepTodos] = useState(true)
  const [keepTodosAssignees, setKeepTodosAssignees] = useState(false)
  const [keepTodosCompleted, setKeepTodosCompleted] = useState(false)
  const [keepAllMembers, setKeepAllMembers] = useState(false)
  const [keepBudget, setKeepBudget] = useState(false)
  const [keepMemberLimits, setKeepMemberLimits] = useState(false)
  const [keepSameClient, setKeepSameClient] = useState(false)

  useEffect(() => {
    if (open) {
      setName(defaultName)
      setKeepTodos(true)
      setKeepTodosAssignees(false)
      setKeepTodosCompleted(false)
      setKeepAllMembers(false)
      setKeepBudget(false)
      setKeepMemberLimits(false)
      setKeepSameClient(false)
    }
  }, [open, defaultName])

  const submit = async () => {
    if (!name.trim()) return
    const payload: DuplicateProjectOptions = {
      name: name.trim(),
      keepTasks: keepTodos,
      keepTasksAssignees: keepTodosAssignees,
      keepTasksCompleted: keepTodosCompleted,
      keepAllMembers,
      keepBudget,
      keepMemberLimits,
      keepSameClient,
    }
    await onConfirm(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Duplicate project</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="dup-name">NAME<span className="text-red-500">*</span></Label>
            <Input
              id="dup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={defaultName}
            />
          </div>

          <div>
            <div className="mb-2 font-medium">Keep</div>

            <label className="flex items-start gap-3 py-1">
              <Checkbox checked={keepTodos} onCheckedChange={(v) => setKeepTodos(Boolean(v))} />
              <div>
                <div>Tasks (does not include global tasks)</div>
                <div className="pl-6 pt-1 space-y-2">
                  <label className="flex items-center gap-3">
                    <Checkbox
                      checked={keepTodosAssignees}
                      onCheckedChange={(v) => setKeepTodosAssignees(Boolean(v))}
                      disabled={!keepTodos}
                    />
                    <span>Assignees</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <Checkbox
                      checked={keepTodosCompleted}
                      onCheckedChange={(v) => setKeepTodosCompleted(Boolean(v))}
                      disabled={!keepTodos}
                    />
                    <span>Completed Tasks</span>
                  </label>
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 py-1">
              <Checkbox checked={keepAllMembers} onCheckedChange={(v) => setKeepAllMembers(Boolean(v))} />
              <span>All project members</span>
            </label>

            <label className="flex items-center gap-3 py-1">
              <Checkbox checked={keepBudget} onCheckedChange={(v) => setKeepBudget(Boolean(v))} />
              <span>Budget</span>
            </label>

            <label className="flex items-center gap-3 py-1">
              <Checkbox checked={keepMemberLimits} onCheckedChange={(v) => setKeepMemberLimits(Boolean(v))} />
              <span>Members limits</span>
            </label>

            <label className="flex items-center gap-3 py-1">
              <Checkbox checked={keepSameClient} onCheckedChange={(v) => setKeepSameClient(Boolean(v))} />
              <span>Belongs to same client</span>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={!!isSubmitting}>Cancel</Button>
          <Button onClick={submit} disabled={!name.trim() || !!isSubmitting}>
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
