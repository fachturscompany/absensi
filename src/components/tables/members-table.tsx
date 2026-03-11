"use client"

import React from "react"
import { IOrganization_member } from "@/interface"
import { Button } from "@/components/ui/button"
import { Trash, Pencil, Eye, Check, X } from "lucide-react"
import { UserAvatar } from "@/components/profile&image/user-avatar"
import { useRouter } from "next/navigation"

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
import { deleteOrganization_member } from "@/action/members"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { PaginationFooter } from "./pagination-footer"

interface MembersTableProps {
  members: IOrganization_member[]
  isLoading?: boolean
  onDelete?: () => void
  showPagination?: boolean
}

export function MembersTable({ members, isLoading = false, onDelete, showPagination = true }: MembersTableProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [sortOrder] = React.useState("newest")
  const [pageSize, setPageSize] = React.useState("10")
  const [pageIndex, setPageIndex] = React.useState(0)
  const [globalFilter] = React.useState("")
  const [statusFilter] = React.useState("all")
  const [visibleColumns] = React.useState({
    avatar: true,
    members: true,
    // phone: true,
    nik: true,
    group: true,
    gender: true,
    religion: true,
    status: true,
    actions: true,
  })

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteOrganization_member(id)
      if (result.success) {
        toast.success("Member deleted successfully")
        await queryClient.invalidateQueries({ queryKey: ["members"] })
        onDelete?.()
      } else {
        toast.error(result.message || "Failed to delete member")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    }
  }

  type MemberUser = {
    id?: string
    email?: string
    first_name?: string
    last_name?: string
    display_name?: string
    phone?: string
    mobile?: string
    profile_photo_url?: string
    search_name?: string
    jenis_kelamin?: string
    agama?: string
    is_active?: boolean
  }
  type MemberBiodata = { nik?: string; nama?: string; nickname?: string; jenis_kelamin?: string; agama?: string }
  type MemberExtended = IOrganization_member & {
    user?: MemberUser
    biodata?: MemberBiodata
    departments?: { name?: string } | Array<{ name?: string }>
    groupName?: string
    positions?: { title?: string }
  }

  const getFullName = (member: IOrganization_member) => {
    const m = member as MemberExtended
    const displayName = (m.user?.display_name ?? '').trim()
    const firstName = m.user?.first_name ?? ''
    const lastName = m.user?.last_name ?? ''
    const rawEmail = (m.user?.email ?? '').trim()
    const email = rawEmail && !rawEmail.toLowerCase().endsWith('@dummy.local') ? rawEmail : ''
    const searchName = (m.user?.search_name ?? '').trim()
    const fullName = [firstName, lastName].filter((p) => p && p.trim() !== '').join(' ').trim()
    const biodataNama = (m.biodata?.nama ?? '').trim()
    const biodataNickname = (m.biodata?.nickname ?? '').trim()
    return displayName || fullName || email || searchName || biodataNama || biodataNickname || "No Name"
  }

  const getNik = (member: IOrganization_member): string => {
    const m = member as MemberExtended
    const nik = (m.biodata?.nik ?? '')
    const nikAlt = ((member as unknown as { biodata_nik?: string }).biodata_nik ?? '')
    return String(nik || nikAlt || '-')
  }

  const getGroupName = (member: IOrganization_member): string => {
    const m = member as MemberExtended
    if (m.groupName) return m.groupName
    const dep = Array.isArray(m.departments) ? (m.departments[0] ?? undefined) : m.departments
    return String(dep?.name || '-')
  }

  const getGender = (member: IOrganization_member): string => {
    const m = member as MemberExtended
    const gender = m.user?.jenis_kelamin || m.user?.gender
    if (gender === 'male') return 'Male'
    if (gender === 'female') return 'Female'
    return String(gender || m.biodata?.jenis_kelamin || '-')
  }

  const getReligion = (member: IOrganization_member): string => {
    const m = member as MemberExtended
    return String(m.user?.agama || m.biodata?.agama || '-')
  }


  const MemberAvatar = ({ member }: { member: IOrganization_member }) => {
    const m = member as MemberExtended
    const user = m.user
    const name = getFullName(member)

    return (
      <UserAvatar name={name} photoUrl={user?.profile_photo_url} userId={user?.id} />
    )
  }

  // Filter and sort data
  const filteredData = React.useMemo(() => {
    let filtered = [...members]

    // Apply global search filter
    if (globalFilter) {
      const searchTerm = globalFilter.toLowerCase()
      filtered = filtered.filter((member) => {
        const m = member as MemberExtended
        const fullName = getFullName(member).toLowerCase()
        const phone = ((m.user?.phone || m.user?.mobile || "")).toLowerCase()
        const group = getGroupName(member).toLowerCase()
        const nik = getNik(member).toLowerCase()
        return (
          fullName.includes(searchTerm) ||
          phone.includes(searchTerm) ||
          group.includes(searchTerm) ||
          nik.includes(searchTerm)
        )
      })
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((member) => {
        if (statusFilter === "active") return member.is_active
        if (statusFilter === "inactive") return !member.is_active
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
        const nameA = getFullName(a).toLowerCase()
        const nameB = getFullName(b).toLowerCase()
        return nameA.localeCompare(nameB)
      })
    } else if (sortOrder === "z-a") {
      filtered.sort((a, b) => {
        const nameA = getFullName(a).toLowerCase()
        const nameB = getFullName(b).toLowerCase()
        return nameB.localeCompare(nameA)
      })
    }

    return filtered
  }, [globalFilter, statusFilter, sortOrder, members])

  // Pagination
  const pageSizeNum = parseInt(pageSize)
  const totalPages = Math.ceil(filteredData.length / pageSizeNum)
  const paginatedData = showPagination
    ? filteredData.slice(
      pageIndex * pageSizeNum,
      (pageIndex + 1) * pageSizeNum
    )
    : filteredData

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
    <div className="w-full">
      <style jsx global>{`
        html body .custom-hover-row:hover,
        html body .custom-hover-row:hover > td {
          background-color: #d1d5db !important; /* dark gray hover */
        }
        html body.dark .custom-hover-row:hover,
        html body.dark .custom-hover-row:hover > td {
          background-color: #374151 !important;
        }
      `}</style>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800">
        <table className="w-full min-w-[880px]">
          {/* Header */}
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <tr>
              {visibleColumns.avatar && (
                <th className="p-3 text-left text-xs font-medium text-foreground w-10"></th>
              )}
              {visibleColumns.members && (
                <th className="p-3 text-left text-xs font-medium text-foreground">Name</th>
              )}
              {visibleColumns.nik && (
                <th className="p-3 text-left text-xs font-medium text-foreground">Identification</th>
              )}
              {/* {visibleColumns.phone && (
              <th className="p-3 text-left text-xs font-medium text-foreground">Phone Number</th>
            )} */}
              {visibleColumns.group && (
                <th className="p-3 text-left text-xs font-medium text-foreground">Group</th>
              )}
              {visibleColumns.gender && (
                <th className="p-3 text-left text-xs font-medium text-foreground">Gender</th>
              )}
              {visibleColumns.religion && (
                <th className="p-3 text-left text-xs font-medium text-foreground">Religion</th>
              )}
              {visibleColumns.status && (
                <th className="p-3 text-left text-xs font-medium text-foreground">Status</th>
              )}
              {visibleColumns.actions && (
                <th className="p-3 text-left text-xs font-medium text-foreground">Actions</th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-3 py-6 text-center text-muted-foreground text-sm">
                  Loading...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-3 py-6 text-center text-muted-foreground text-sm">
                  No members found
                </td>
              </tr>
            ) : (
              paginatedData.map((member) => {
                return (
                  <tr
                    key={member.id}
                    style={{}}
                    className="border-b border-gray-100 dark:border-gray-800 transition-colors custom-hover-row even:bg-gray-50 dark:even:bg-gray-900/50"
                  >
                    {visibleColumns.avatar && (
                      <td className="p-3">
                        <MemberAvatar member={member} />
                      </td>
                    )}
                    {visibleColumns.members && (
                      <td className="p-3 text-xs">
                        <button
                          type="button"
                          onClick={() => router.push(`/members/${member.id}`)}
                          className="truncate text-primary hover:underline cursor-pointer"
                          title="View profile"
                        >
                          {getFullName(member)}
                        </button>
                      </td>
                    )}
                    {visibleColumns.nik && (
                      <td className="p-3 text-xs">
                        {getNik(member)}
                      </td>
                    )}
                    {/* {visibleColumns.phone && (
                    <td className="p-3 text-xs">
                      {user?.phone || "No Phone"}
                    </td>
                  )} */}

                    {visibleColumns.group && (
                      <td className="p-3 text-xs">
                        {getGroupName(member)}
                      </td>
                    )}

                    {visibleColumns.gender && (
                      <td className="p-3 text-xs">
                        {getGender(member)}
                      </td>
                    )}

                    {visibleColumns.religion && (
                      <td className="p-3 text-xs">
                        {getReligion(member)}
                      </td>
                    )}


                    {visibleColumns.status && (
                      <td className="p-3 text-xs">
                        {member.is_active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500 text-primary-foreground">
                            <Check className="w-3 h-3 mr-1" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            <X className="w-3 h-3 mr-1" /> Inactive
                          </span>
                        )}
                      </td>
                    )}

                    {visibleColumns.actions && (
                      <td className="p-3 text-xs">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => router.push(`/members/edit/${member.id}`)}
                            title="Edit member"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => router.push(`/members/${member.id}`)}
                            title="View member"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Delete member"
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {getFullName(member)}? This action cannot be undone.
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
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {showPagination && (
        <PaginationFooter
          page={pageIndex + 1}
          totalPages={totalPages || 1}
          onPageChange={(p) => setPageIndex(Math.max(0, Math.min((p - 1), Math.max(0, totalPages - 1))))}
          isLoading={isLoading}
          from={filteredData.length > 0 ? pageIndex * pageSizeNum + 1 : 0}
          to={Math.min((pageIndex + 1) * pageSizeNum, filteredData.length)}
          total={filteredData.length}
          pageSize={pageSizeNum}
          onPageSizeChange={(size) => { setPageSize(String(size)); setPageIndex(0); }}
          pageSizeOptions={[5, 10, 20, 50]}
        />
      )}
    </div>
  )
}
