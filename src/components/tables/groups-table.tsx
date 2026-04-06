"use client"

import React from "react"
import { IGroup } from "@/interface"
import { Button } from "@/components/ui/button"
import { Trash, Pencil, Filter, Columns3Cog } from "lucide-react"
import { SearchBar } from "@/components/toolbar/search-bar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { deleteGroup } from "@/action/groups/group"
import { toast } from "sonner"

interface GroupsTableProps {
  groups: IGroup[]
  isLoading?: boolean
  onDelete?: () => void
  onEdit?: (group: IGroup) => void
}

export function GroupsTable({ groups, isLoading = false, onDelete, onEdit }: GroupsTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [sortOrder, setSortOrder] = React.useState("newest")
  const [pageSize, setPageSize] = React.useState("10")
  const [pageIndex, setPageIndex] = React.useState(0)
  const [visibleColumns, setVisibleColumns] = React.useState({
    code: true,
    name: true,
    description: true,
    status: true,
    actions: true,
  })

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteGroup(id)
      if (result.success) {
        toast.success("Group deleted successfully")
        onDelete?.()
      } else {
        toast.error(result.message || "Failed to delete group")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    }
  }

  // Filter and sort data
  const filteredData = React.useMemo(() => {
    let filtered = [...groups]

    // Apply global search filter
    if (globalFilter) {
      const searchTerm = globalFilter.toLowerCase()
      filtered = filtered.filter((group) => {
        const code = (group.code || "").toLowerCase()
        const name = (group.name || "").toLowerCase()
        const description = (group.description || "").toLowerCase()
        return (
          code.includes(searchTerm) ||
          name.includes(searchTerm) ||
          description.includes(searchTerm)
        )
      })
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((group) => {
        if (statusFilter === "active") return group.is_active
        if (statusFilter === "inactive") return !group.is_active
        return true
      })
    }

    // Apply sorting
    if (sortOrder === "newest") {
      filtered.sort((a, b) => {
        const dateA = new Date((a as any).created_at || 0).getTime()
        const dateB = new Date((b as any).created_at || 0).getTime()
        return dateB - dateA
      })
    } else if (sortOrder === "oldest") {
      filtered.sort((a, b) => {
        const dateA = new Date((a as any).created_at || 0).getTime()
        const dateB = new Date((b as any).created_at || 0).getTime()
        return dateA - dateB
      })
    } else if (sortOrder === "a-z") {
      filtered.sort((a, b) => {
        const nameA = (a.name || "").toLowerCase()
        const nameB = (b.name || "").toLowerCase()
        return nameA.localeCompare(nameB)
      })
    } else if (sortOrder === "z-a") {
      filtered.sort((a, b) => {
        const nameA = (a.name || "").toLowerCase()
        const nameB = (b.name || "").toLowerCase()
        return nameB.localeCompare(nameA)
      })
    }

    return filtered
  }, [globalFilter, statusFilter, sortOrder, groups])

  // Pagination
  const pageSizeNum = parseInt(pageSize)
  const totalPages = Math.ceil(filteredData.length / pageSizeNum)
  const paginatedData = filteredData.slice(
    pageIndex * pageSizeNum,
    (pageIndex + 1) * pageSizeNum
  )

  // Reset page index when filters change
  React.useEffect(() => {
    setPageIndex(0)
  }, [globalFilter, statusFilter, sortOrder])

  // Clamp page index if it exceeds total pages
  React.useEffect(() => {
    if (pageIndex >= totalPages && totalPages > 0) {
      setPageIndex(totalPages - 1)
    }
  }, [totalPages, pageIndex])

  return (
    <div className="w-full space-y-4">
      <style jsx global>{`
        /* Zebra striping */
        html body .custom-hover-row:nth-child(even) {
          background-color: #f3f4f6;
        }
        html body.dark .custom-hover-row:nth-child(even) {
          background-color: #1f2937; /* dark mode muted */
        }

        /* Hover effect */
        html body .custom-hover-row:hover,
        html body .custom-hover-row:hover > td {
          background-color: #d1d5db !important; /* dark gray hover */
        }
        html body.dark .custom-hover-row:hover,
        html body.dark .custom-hover-row:hover > td {
          background-color: #374151 !important;
        }
      `}</style>
      {/* Search Bar */}
      <div className="relative w-full">
        <SearchBar
          placeholder="Search groups..."
          initialQuery={globalFilter}
          onSearch={setGlobalFilter}
        />
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        <div className="flex flex-wrap items-center gap-2 w-full">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="a-z">A-Z</SelectItem>
              <SelectItem value="z-a">Z-A</SelectItem>
            </SelectContent>
          </Select>

          {/* Show Items */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Show:</span>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Toggle Columns */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <Columns3Cog className="h-4 w-4" /> Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={visibleColumns.code}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, code: checked }))
              }
            >
              Code
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.name}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, name: checked }))
              }
            >
              Name
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.description}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, description: checked }))
              }
            >
              Description
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.status}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, status: checked }))
              }
            >
              Status
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.actions}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, actions: checked }))
              }
            >
              Actions
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-950">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <tr>
              {visibleColumns.code && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Code</th>
              )}
              {visibleColumns.name && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Name</th>
              )}
              {visibleColumns.description && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Description</th>
              )}
              {visibleColumns.status && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
              )}
              {visibleColumns.actions && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-4 py-8 text-center text-muted-foreground">
                  No groups found
                </td>
              </tr>
            ) : (
              paginatedData.map((group) => (
                <tr
                  key={group.id}
                  className="border-b transition-colors custom-hover-row cursor-pointer"
                >
                  {visibleColumns.code && (
                    <td className="px-4 py-3 text-sm">{group.code}</td>
                  )}

                  {visibleColumns.name && (
                    <td className="px-4 py-3 text-sm">{group.name}</td>
                  )}

                  {visibleColumns.description && (
                    <td className="px-4 py-3 text-sm">{group.description || "-"}</td>
                  )}

                  {visibleColumns.status && (
                    <td className="px-4 py-3 text-sm">
                      {group.is_active ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-600 dark:bg-green-600 text-white">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-300 dark:bg-gray-700 text-black dark:text-gray-200">
                          Inactive
                        </span>
                      )}
                    </td>
                  )}

                  {visibleColumns.actions && (
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit?.(group)}
                          title="Edit group"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title="Delete group"
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Group</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {group.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(group.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-4">
        {/* Page Info - Left */}
        <div className="text-sm text-muted-foreground">
          Page {pageIndex + 1} of {totalPages || 1} ({filteredData.length} total)
        </div>

        {/* Pagination Navigation - Right */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
            disabled={pageIndex === 0 || isLoading}
          >
            Previous
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                size="sm"
                variant={pageIndex + 1 === page ? "default" : "outline"}
                onClick={() => setPageIndex(page - 1)}
                className="w-8 h-8 p-0"
                disabled={isLoading}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setPageIndex(Math.min(totalPages - 1, pageIndex + 1))}
            disabled={pageIndex >= totalPages - 1 || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </div >
  )
}
