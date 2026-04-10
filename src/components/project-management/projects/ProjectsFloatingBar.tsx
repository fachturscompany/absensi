"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Pencil, Archive, Trash2, X } from "lucide-react"

type ProjectsFloatingBarProps = {
  selectedCount: number
  onEditBatch: () => void
  onArchiveBatch: () => void
  onDeleteBatch: () => void
  onClearSelection: () => void
}

export function ProjectsFloatingBar({
  selectedCount,
  onEditBatch,
  onArchiveBatch,
  onDeleteBatch,
  onClearSelection,
}: ProjectsFloatingBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background border shadow-xl rounded-full px-6 py-3 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-4 ring-1 ring-black/5">
      <span className="text-sm font-semibold border-r pr-4">
        {selectedCount} selected
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={onEditBatch}>
          <Pencil className="w-3.5 h-3.5" />Edit
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={onArchiveBatch}>
          <Archive className="w-3.5 h-3.5" />Archive
        </Button>
        <Button size="sm" variant="destructive" className="h-8 gap-1.5" onClick={onDeleteBatch}>
          <Trash2 className="w-3.5 h-3.5" />Delete
        </Button>
      </div>
      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={onClearSelection}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}
