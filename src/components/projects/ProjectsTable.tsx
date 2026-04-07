"use client"

import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip"
import { Pencil, ArrowUpDown, ArrowUp, ArrowDown, Lock, CalendarClock } from "lucide-react"

import type { Project } from "@/interface"

export interface ProjectRow extends Project {
  description: string | null
  priority: "high" | "medium" | "low" | null
  lifecycleStatus: string
  isBillable: boolean
  budgetAmount: number | null
  currencyCode: string
  startDate: string | null
  endDate: string | null
  createdAt: string | null
  budgetLabel: string
}

function isBeforeStartDate(startDate: string | null): boolean {
  if (!startDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  return today < start
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority) return <span className="text-muted-foreground text-xs">—</span>
  const styles: Record<string, string> = {
    high: "bg-red-50 text-red-700 border-red-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }
  return (
    <Badge variant="outline" className={`text-xs font-medium capitalize ${styles[priority] ?? ""}`}>
      {priority}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    on_hold: "bg-amber-50 text-amber-700 border-amber-200",
    completed: "bg-blue-50 text-blue-700 border-blue-200",
    archived: "bg-muted text-muted-foreground border-border",
    deleted: "bg-red-50 text-red-700 border-red-200",
  }
  const labels: Record<string, string> = {
    active: "Active", on_hold: "On Hold", completed: "Completed",
    archived: "Archived", deleted: "Deleted",
  }
  return (
    <Badge variant="outline" className={`text-xs font-medium ${styles[status] ?? ""}`}>
      {labels[status] ?? status}
    </Badge>
  )
}

type SortField = "name" | "priority" | "lifecycleStatus" | "budgetAmount" | "startDate" | "endDate" | "createdAt"
type SortDir = "asc" | "desc"

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) return <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" />
  return dir === "asc" ? <ArrowDown className="h-3 w-3 text-primary" /> : <ArrowUp className="h-3 w-3 text-primary" />
}

type ProjectsTableProps = {
  projects: ProjectRow[]
  filteredCount: number
  activeFilterCount: number
  fetchError: string | null
  isLoading: boolean
  isAdmin: boolean

  allSelected: boolean
  toggleSelectAll: () => void
  selectedIds: string[]
  toggleSelect: (id: string, e: React.MouseEvent) => void

  sortField: SortField
  sortDir: SortDir
  handleSort: (field: SortField) => void
  clearFilters: () => void

  onRowClick: (p: ProjectRow) => void
  onEditGeneral: (p: ProjectRow) => void
  onManageMembers: (p: ProjectRow) => void
  onEditBudget: (p: ProjectRow) => void
  onArchive: (p: ProjectRow) => void
  onTransfer: (p: ProjectRow) => void
  onDelete: (p: ProjectRow) => void
  onUnarchive: (p: ProjectRow) => Promise<void>
}

export function ProjectsTable({
  projects, filteredCount, activeFilterCount, fetchError, isLoading, isAdmin,
  allSelected, toggleSelectAll, selectedIds, toggleSelect,
  sortField, sortDir, handleSort, clearFilters,
  onRowClick, onEditGeneral, onManageMembers, onEditBudget,
  onArchive, onTransfer, onDelete, onUnarchive,
}: ProjectsTableProps) {
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-10">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="rounded border-gray-300" />
            </TableHead>
            <TableHead>
              <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => handleSort("name")}>
                Name <SortIcon field="name" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <span className="text-xs font-medium uppercase tracking-wide">Description</span>
            </TableHead>
            <TableHead>
              <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => handleSort("priority")}>
                Priority <SortIcon field="priority" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead>
              <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => handleSort("lifecycleStatus")}>
                Status <SortIcon field="lifecycleStatus" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead className="hidden sm:table-cell">
              <span className="text-xs font-medium uppercase tracking-wide">Billable</span>
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => handleSort("budgetAmount")}>
                Budget <SortIcon field="budgetAmount" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead className="hidden xl:table-cell">
              <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => handleSort("startDate")}>
                Start Date <SortIcon field="startDate" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead className="hidden xl:table-cell">
              <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => handleSort("endDate")}>
                End Date <SortIcon field="endDate" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead className="hidden xl:table-cell">
              <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => handleSort("createdAt")}>
                Created At <SortIcon field="createdAt" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead className="w-16">
              <span className="text-xs font-medium uppercase tracking-wide">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCount === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center text-muted-foreground py-16">
                {fetchError ? (
                  <div className="text-destructive font-medium">Error: {fetchError}</div>
                ) : isLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-sm">Loading projects...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-medium">No projects found</span>
                    {activeFilterCount > 0 && (
                      <button className="text-xs text-primary underline underline-offset-4" onClick={clearFilters}>
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ) : projects.map(p => {
            const notStarted = isBeforeStartDate(p.startDate)
            const readOnly = notStarted && !isAdmin
            const isSelected = selectedIds.includes(p.id)

            return (
              <TableRow
                key={p.id}
                className={`transition-colors ${
                  readOnly
                    ? "opacity-60 cursor-not-allowed bg-muted/20"
                    : "cursor-pointer hover:bg-muted/40"
                }`}
                onClick={() => onRowClick(p)}
              >
                {/* Checkbox */}
                <TableCell onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => toggleSelect(p.id, e as any)}
                    className="rounded border-gray-300"
                  />
                </TableCell>

                {/* Name */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    {readOnly && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Read-only. Project hasn't started yet.
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {notStarted && !readOnly && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CalendarClock className="h-3 w-3 text-orange-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Starts {formatDate(p.startDate)}
                          {isAdmin && " · You can access as admin"}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>

                {/* Description */}
                <TableCell className="hidden md:table-cell max-w-[200px]">
                  <span className="text-sm text-muted-foreground truncate block">
                    {p.description || <span className="italic opacity-40">No description</span>}
                  </span>
                </TableCell>

                {/* Priority */}
                <TableCell><PriorityBadge priority={p.priority} /></TableCell>

                {/* Status */}
                <TableCell><StatusBadge status={p.lifecycleStatus} /></TableCell>

                {/* Billable */}
                <TableCell className="hidden sm:table-cell">
                  <span className={`text-xs font-medium ${p.isBillable ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {p.isBillable ? "Billable" : "Non-billable"}
                  </span>
                </TableCell>

                {/* Budget */}
                <TableCell className="hidden lg:table-cell">
                  <span className="text-sm text-muted-foreground font-mono">{p.budgetLabel}</span>
                </TableCell>

                {/* Start Date */}
                <TableCell className="hidden xl:table-cell">
                  <span className={`text-sm ${notStarted ? "text-orange-600 font-medium" : "text-muted-foreground"}`}>
                    {formatDate(p.startDate)}
                  </span>
                </TableCell>

                {/* End Date */}
                <TableCell className="hidden xl:table-cell">
                  <span className="text-sm text-muted-foreground">{formatDate(p.endDate)}</span>
                </TableCell>

                {/* Created At */}
                <TableCell className="hidden xl:table-cell">
                  <span className="text-sm text-muted-foreground">{formatDate(p.createdAt)}</span>
                </TableCell>

                {/* Actions */}
                <TableCell onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={readOnly}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {!p.archived ? (
                        <>
                          <DropdownMenuItem onSelect={() => onEditGeneral(p)}>Edit project</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onManageMembers(p)}>Manage members</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onEditBudget(p)}>Edit budget</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled>Duplicate project</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onArchive(p)}>Archive project</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onTransfer(p)}>Transfer</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onDelete(p)}>Delete project</DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem disabled>Edit project</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onManageMembers(p)}>Manage members</DropdownMenuItem>
                          <DropdownMenuItem disabled>Duplicate project</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onUnarchive(p)}>Restore project</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onDelete(p)}>Delete project</DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}