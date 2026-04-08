"use client"

import React from "react"
import { IOrganization_member } from "@/interface"
import { Button } from "@/components/ui/button"
import { Trash, Pencil } from "lucide-react"
import { UserAvatar } from "@/components/profile&image/user-avatar"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { 
  computeName, 
  computeGroupName, 
  computeNik, 
  MemberLike, 
  computeGender, 
  computeReligion 
} from "@/lib/members-mapping"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge" // Pastikan import Badge ada

interface MembersTableProps {
  members: IOrganization_member[]
  isLoading?: boolean
  onDelete?: () => void
  showPagination?: boolean 
}

export function MembersTable({ 
  members, 
  isLoading = false, 
  onDelete,
}: MembersTableProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteOrganization_member(id)
      if (result.success) {
        toast.success("Member deleted successfully")
        await queryClient.invalidateQueries({ queryKey: ["members"] })
        onDelete?.()
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      toast.error(errorMessage)
    }
  }

  return (
    <div className="w-full space-y-4">
      <div>
        <Table>
          <TableHeader>
            <TableRow>
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
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground py-6">
                  No members found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member: IOrganization_member) => {
                const mLike = member as unknown as MemberLike
                
                const fullName = computeName(mLike)
                const groupName = computeGroupName(mLike)
                const nik = computeNik(mLike)
                const gender = computeGender(mLike)
                const religion = computeReligion(mLike)

                return (
                  <TableRow
                    key={member.id}
                  >
                    <TableCell className="px-4 py-3">
                      <UserAvatar
                        name={fullName}
                        photoUrl={member.user?.profile_photo_url || null}
                        className="h-8 w-8 text-xs"
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      <span 
                        className="font-medium text-sm block truncate max-w-[200px] cursor-pointer hover:underline hover:text-primary transition-all decoration-primary/50 underline-offset-4"
                        onClick={() => router.push(`/members/${member.id}`)}
                      >
                        {fullName}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {nik}
                    </TableCell>
                    <TableCell>
                      {groupName !== '-' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                          {groupName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground capitalize">
                      {gender}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground capitalize">
                      {religion}
                    </TableCell>
                    
                    {/* --- BAGIAN STATUS BADGE YANG DISIPERBAIKI --- */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-medium",
                          member.is_active
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                            : "bg-red-50 text-red-600 border-red-200 hover:bg-red-50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                        )}
                      >
                        {member.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {/* -------------------------------------------- */}

                    <TableCell className="px-4 pr-6 text-right">
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
                              className="h-8 w-8 p-0 text-destructive hover:bg-red-50 hover:text-destructive"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete <span className="font-semibold text-foreground">{fullName}</span> from the organization.
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
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}