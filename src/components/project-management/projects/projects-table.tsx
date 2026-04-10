"use client"

import React from "react"
import Link from "next/link"
import { Lock, CalendarClock, Pencil } from "lucide-react"
import { 
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Tooltip, TooltipContent, TooltipTrigger
} from "@/components/ui/tooltip"
import { ProjectRow } from "@/app/projects/page"

const PriorityBadge = ({ priority }: { priority: string | null }) => {
  const colors: Record<string, string> = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${priority ? colors[priority] : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"}`}>
      {priority || "None"}
    </span>
  )
}

const StatusBadge = ({ status }: { status: string }) => {
  const isActive = status.toLowerCase() === "active"

  if (isActive) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-600 dark:bg-green-600 text-white capitalize">
        {status.replace("_", " ")}
      </span>
    )
  }

  // Fallback for inactive, archived, on_hold
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-300 dark:bg-gray-700 text-black dark:text-gray-200 capitalize">
      {status.replace("_", " ")}
    </span>
  )
}

const SortIcon = ({ field, current, dir }: { field: string; current: string; dir: string }) => {
  if (field !== current) return null
  return <span className="ml-1">{dir === "asc" ? "↑" : "↓"}</span>
}

// ─── Props Interface (Synced with page.tsx) ──────────────────────────────────

interface TableProjectsProps {
  isLoading: boolean
  fetchError: string | null
  data: ProjectRow[]
  selectedIds: string[]
  allSelected: boolean
  isAdmin: boolean
  sortField: string
  sortDir: string
  activeFilterCount: number
  onSort: (field: string) => void
  onToggleSelectAll: () => void
  onToggleSelect: (id: string) => void
  onClearFilters: () => void
  onRowClick: (p: ProjectRow) => void
  onEdit: (p: ProjectRow, tab: "general" | "members" | "budget" | "teams") => void
  onArchive: (id: string) => void
  onRestore: (id: string) => void
  onDelete: (p: ProjectRow) => void
  onTransfer: (p: ProjectRow) => void
}

export function ProjectsTable(props: TableProjectsProps) {
  const {
    isLoading, fetchError, data, selectedIds, allSelected,
    isAdmin, sortField, sortDir, activeFilterCount,
    onSort, onToggleSelectAll, onToggleSelect, onClearFilters, onRowClick,
    onEdit, onArchive, onRestore, onDelete, onTransfer
  } = props

  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("id-ID", { 
        day: "numeric", month: "short", year: "numeric" 
    })
  }

  const isBeforeStartDate = (date: string | null) => {
    if (!date) return false
    return new Date(date) > new Date()
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[1000px]">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-10">
              <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} className="rounded border-gray-300" />
            </TableHead>
            <TableHead>
              <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => onSort("name")}>
                Name <SortIcon field="name" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead>
              <span className="text-xs font-medium uppercase tracking-wide">Description</span>
            </TableHead>
            <TableHead>
              <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => onSort("priority")}>
                Priority <SortIcon field="priority" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead>
              <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => onSort("lifecycleStatus")}>
                Status <SortIcon field="lifecycleStatus" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead>
              <span className="text-xs font-medium uppercase tracking-wide">Billable</span>
            </TableHead>
            <TableHead>
              <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => onSort("budgetAmount")}>
                Budget <SortIcon field="budgetAmount" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead>
              <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => onSort("startDate")}>
                Start Date <SortIcon field="startDate" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead>
              <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => onSort("endDate")}>
                End Date <SortIcon field="endDate" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead>
              <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground" onClick={() => onSort("createdAt")}>
                Created At <SortIcon field="createdAt" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead className="w-16">
              <span className="text-xs font-medium uppercase tracking-wide">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
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
                      <button className="text-xs text-primary underline underline-offset-4" onClick={onClearFilters}>
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ) : (
            data.map(p => {
              const notStarted = isBeforeStartDate(p.startDate)
              const readOnly = notStarted && !isAdmin

              return (
                <TableRow
                  key={p.id}
                  className={`transition-colors ${
                    readOnly ? "opacity-60 cursor-not-allowed bg-muted/20" : "cursor-pointer hover:bg-muted/40"
                  }`}
                  onClick={() => onRowClick(p)}
                >
                  <TableCell onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => onToggleSelect(p.id)}
                      className="rounded border-gray-300"
                      disabled={readOnly}
                    />
                  </TableCell>

                  <TableCell className="max-w-[180px]">
                    <div className="flex items-center gap-1.5">
                      {readOnly ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="font-medium text-sm truncate block text-muted-foreground">
                              {p.name}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="flex items-center gap-1.5">
                            <Lock className="h-3 w-3" />
                            <span>Project starts on {formatDate(p.startDate)}</span>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Link
                          href={`/projects/${p.id}/tasks/list`}
                          className="font-medium text-sm hover:underline truncate block"
                          onClick={e => e.stopPropagation()}
                        >
                          {p.name}
                        </Link>
                      )}
                      {notStarted && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Badge variant="outline" className="text-[10px] gap-1 border-orange-300 text-orange-600 bg-orange-50 shrink-0">
                                <CalendarClock className="h-3 w-3" />
                                Not started
                              </Badge>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            Starts {formatDate(p.startDate)}
                            {isAdmin && " · You can access as admin"}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="max-w-[200px]">
                    {p.description ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm text-muted-foreground truncate block cursor-pointer">
                            {p.description}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm whitespace-pre-wrap">
                          {p.description}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-sm text-muted-foreground italic opacity-40 truncate block">
                        No description
                      </span>
                    )}
                  </TableCell>

                  <TableCell><PriorityBadge priority={p.priority} /></TableCell>
                  <TableCell><StatusBadge status={p.lifecycleStatus} /></TableCell>

                  <TableCell>
                    <span className={`text-xs font-medium ${p.isBillable ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {p.isBillable ? "Billable" : "Non-billable"}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm text-muted-foreground font-mono">{p.budgetLabel}</span>
                  </TableCell>

                  <TableCell>
                    <span className={`text-sm ${notStarted ? "text-orange-600 font-medium" : "text-muted-foreground"}`}>
                      {formatDate(p.startDate)}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm text-muted-foreground">{formatDate(p.endDate)}</span>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm text-muted-foreground">{formatDate(p.createdAt)}</span>
                  </TableCell>

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
                            <DropdownMenuItem onSelect={() => onEdit(p, "general")}>Edit project</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onEdit(p, "members")}>Manage members</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onEdit(p, "budget")}>Edit budget</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => onArchive(p.id)}>Archive project</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onTransfer(p)}>Transfer</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onDelete(p)}>Delete project</DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem disabled>Edit project</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onEdit(p, "members")}>Manage members</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onRestore(p.id)}>Restore project</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onDelete(p)}>Delete project</DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}