"use client"

import React from "react"
import { IOrganization_member } from "@/interface"
import { Button } from "@/components/ui/button"
import { Trash, Pencil } from "lucide-react"
import { UserAvatar } from "@/components/profile&image/user-avatar"
import { useRouter } from "next/navigation"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteOrganization_member } from "@/action/members"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { PaginationFooter } from "../customs/pagination-footer"

interface MembersTableProps {
  members: IOrganization_member[]
  isLoading?: boolean
  onDelete?: () => void
  showPagination?: boolean
}

// ─── Helper: get full name ─────────────────────────────────────────────────────
// Sama dengan computeName di lib/members-mapping
function getFullName(member: any): string {
  const first = member.user?.first_name || ""
  const last = member.user?.last_name || ""
  const display = member.user?.display_name || member.user?.name || ""
  const full = `${first} ${last}`.trim()
  return full || display || ""
}

// Helper: apakah member ini valid (punya nama yang layak ditampilkan)
// Ini filter untuk skip row yang hanya punya initial seperti "H", "AS"
function hasValidName(member: any): boolean {
  return getFullName(member).length > 2
}

// Helper: get group name
function getGroupName(member: any): string {
  if (member.departments?.name) return member.departments.name
  if (Array.isArray(member.departments) && member.departments[0]?.name) return member.departments[0].name
  if (member.groupName) return member.groupName
  return ""
}

export function MembersTable({ members, isLoading = false, onDelete, showPagination = true }: MembersTableProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [pageSize, setPageSize] = React.useState("10")
  const [pageIndex, setPageIndex] = React.useState(0)

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteOrganization_member(id)
      if (result.success) {
        toast.success("Member deleted successfully")
        await queryClient.invalidateQueries({ queryKey: ["members"] })
        onDelete?.()
      }
    } catch {
      toast.error("An error occurred")
    }
  }

  // Filter out ghost rows — member dengan nama kosong atau hanya initial
  const validMembers = React.useMemo(
    () => members.filter(hasValidName),
    [members]
  )

  const pageSizeNum = parseInt(pageSize)
  const totalPages = Math.ceil(validMembers.length / pageSizeNum)
  const paginatedData = showPagination
    ? validMembers.slice(pageIndex * pageSizeNum, (pageIndex + 1) * pageSizeNum)
    : validMembers

  return (
    <div className="w-full space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border">
            <TableHead className="w-10 px-4" />
            <TableHead className="font-medium text-xs uppercase tracking-wide py-3">Name</TableHead>
            <TableHead className="font-medium text-xs uppercase tracking-wide">Identification</TableHead>
            <TableHead className="font-medium text-xs uppercase tracking-wide">Group</TableHead>
            <TableHead className="font-medium text-xs uppercase tracking-wide hidden md:table-cell">Gender</TableHead>
            <TableHead className="font-medium text-xs uppercase tracking-wide hidden md:table-cell">Religion</TableHead>
            <TableHead className="font-medium text-xs uppercase tracking-wide">Status</TableHead>
            <TableHead className="w-20 text-right pr-6 font-medium text-xs uppercase tracking-wide">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground italic text-sm">
                Loading members...
              </TableCell>
            </TableRow>
          ) : paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground py-6">
                No members found matching your criteria.
              </TableCell>
            </TableRow>
          ) : paginatedData.map((member) => {
            const fullName = getFullName(member)
            const groupName = getGroupName(member)
            const gender = (member as any).user?.jenis_kelamin || null
            const religion = (member as any).user?.agama || null
            const nik = (member as any).biodata?.nik || (member as any).biodata_nik || null

            return (
              <TableRow
                key={member.id}
                className="group cursor-pointer hover:bg-muted/50 transition-colors w-full"
                onClick={() => router.push(`/members/${member.id}`)}
              >
                {/* Avatar */}
                <TableCell className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <UserAvatar
                    name={fullName}
                    photoUrl={(member as any).user?.profile_photo_url}
                    className="h-8 w-8 text-xs"
                  />
                </TableCell>

                {/* Name */}
                <TableCell className="py-3">
                  <span className="font-medium text-sm block truncate max-w-[200px]">
                    {fullName}
                  </span>
                </TableCell>

                {/* Identification / NIK */}
                <TableCell className="text-sm text-muted-foreground">
                  {nik ?? <span className="text-muted-foreground/50">—</span>}
                </TableCell>

                {/* Group — mengikuti badge style projects table */}
                <TableCell>
                  {groupName ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                      {groupName}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50 text-sm">—</span>
                  )}
                </TableCell>

                {/* Gender */}
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground capitalize">
                  {gender ?? <span className="text-muted-foreground/50">—</span>}
                </TableCell>

                {/* Religion */}
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {religion ?? <span className="text-muted-foreground/50">—</span>}
                </TableCell>

                {/* Status */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${member.is_active ? "bg-green-500" : "bg-gray-300"}`} />
                    <span className="text-xs font-medium">
                      {member.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </TableCell>

                {/* Actions — mengikuti pola projects: visible on hover, outline button */}
                <TableCell className="px-4 pr-6 text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => router.push(`/members/edit/${member.id}`)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:bg-red-50 hover:border-red-200"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete <span className="font-semibold text-foreground">{fullName}</span> from the system.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(member.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {showPagination && (
        <PaginationFooter
          page={pageIndex + 1}
          totalPages={totalPages || 1}
          onPageChange={(p) => setPageIndex(p - 1)}
          isLoading={isLoading}
          from={validMembers.length > 0 ? pageIndex * pageSizeNum + 1 : 0}
          to={Math.min((pageIndex + 1) * pageSizeNum, validMembers.length)}
          total={validMembers.length}
          pageSize={pageSizeNum}
          onPageSizeChange={(size) => { setPageSize(String(size)); setPageIndex(0) }}
          pageSizeOptions={[5, 10, 20, 50]}
        />
      )}
    </div>
  )
}