"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import TransferProjectDialog from "@/components/project-management/projects/dialogs/transfer-project"
import type { Project } from "@/interface"

type ProjectRow = Project & { name: string }

type ProjectConfirmationDialogsProps = {
  // Batch Edit
  batchOpen: boolean
  setBatchOpen: (v: boolean) => void
  batchBillable: boolean
  setBatchBillable: (v: boolean) => void
  batchDisableActivity: boolean
  setBatchDisableActivity: (v: boolean) => void
  batchAllowTracking: boolean
  setBatchAllowTracking: (v: boolean) => void
  selectedCount: number

  // Archive
  archiveOpen: boolean
  setArchiveOpen: (v: boolean) => void
  archiveTargetsCount: number
  handleArchive: () => void

  // Delete
  deleteOpen: boolean
  setDeleteOpen: (v: boolean) => void
  deleteTargetName?: string
  handleDelete: () => void

  // Batch Delete
  batchDeleteOpen: boolean
  setBatchDeleteOpen: (v: boolean) => void
  handleBatchDelete: () => void

  // Import
  importOpen: boolean
  setImportOpen: (v: boolean) => void
  importFile: File | null
  setImportFile: (f: File | null) => void
  handleImport: () => void

  // Transfer
  transferOpen: boolean
  setTransferOpen: (v: boolean) => void
  transferProject: ProjectRow | null
  handleTransfer: () => void
}

export function ProjectConfirmationDialogs({
  batchOpen, setBatchOpen, batchBillable, setBatchBillable,
  batchDisableActivity, setBatchDisableActivity, batchAllowTracking, setBatchAllowTracking,
  selectedCount,
  archiveOpen, setArchiveOpen, archiveTargetsCount, handleArchive,
  deleteOpen, setDeleteOpen, deleteTargetName, handleDelete,
  batchDeleteOpen, setBatchDeleteOpen, handleBatchDelete,
  importOpen, setImportOpen, importFile, setImportFile, handleImport,
  transferOpen, setTransferOpen, transferProject, handleTransfer,
}: ProjectConfirmationDialogsProps) {
  return (
    <>
      {/* Batch Edit */}
      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {selectedCount} project{selectedCount !== 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>Editing will override the existing settings for selected projects.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Billable</span>
              <Switch checked={batchBillable} onCheckedChange={setBatchBillable} />
            </label>
            <label className="flex items-center justify-between gap-3 opacity-50 pointer-events-none">
              <span className="text-sm">Disable activity</span>
              <Switch checked={batchDisableActivity} onCheckedChange={setBatchDisableActivity} />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Allow project tracking</span>
              <Switch checked={batchAllowTracking} onCheckedChange={setBatchAllowTracking} />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchOpen(false)}>Cancel</Button>
            <Button onClick={() => setBatchOpen(false)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive */}
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{archiveTargetsCount <= 1 ? "Archive project?" : `Archive ${archiveTargetsCount} projects?`}</DialogTitle>
            <DialogDescription>This will move the project(s) to Archived. You can restore later.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleArchive}>Archive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Single */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete
              {deleteTargetName && <span className="font-semibold text-foreground"> {deleteTargetName}</span>} and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Batch */}
      <AlertDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} project{selectedCount !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. All selected projects and their data will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete {selectedCount} project{selectedCount !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Import projects</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="space-y-3">
            <div className="border-2 border-dashed rounded-lg p-8 grid place-items-center bg-muted/20">
              <div className="space-y-2 text-center">
                <input id="projects-file" type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={e => setImportFile(e.target.files?.[0] ?? null)} />
                <Button variant="outline" onClick={() => document.getElementById("projects-file")?.click()}>Browse files</Button>
                <div className="text-xs text-muted-foreground">Accepted: <span className="font-medium">.CSV, .XLS, .XLSX</span></div>
                {importFile && <div className="text-xs">Selected: <span className="font-medium">{importFile.name}</span></div>}
              </div>
            </div>
            <button type="button" className="text-sm text-primary hover:underline underline-offset-4">Download template</button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={!importFile}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer */}
      <TransferProjectDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        project={transferProject as any}
        onTransfer={handleTransfer}
      />
    </>
  )
}
