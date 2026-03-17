"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/tables/data-table"
import { Check, X, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { IUser } from "@/interface"
import { toast } from "sonner"
import { deleteUsers } from "@/action/users"
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

interface UsersClientProps {
  initialUsers: IUser[]
}

export default function UsersClient({ initialUsers }: UsersClientProps) {
  const [users, setUsers] = React.useState(initialUsers)
  const router = useRouter()

  async function handleDelete(id: string) {
    try {
      const res = await deleteUsers(id)
      if (res.success) {
        toast.success("User deleted successfully")
        // Optimistic update
        setUsers((prev) => prev.filter((u) => u.id !== id))
      } else {
        toast.error(res.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    }
  }

  const columns: ColumnDef<IUser>[] = [
    {
      accessorKey: "first_name",
      header: "First Name",
    },
    {
      accessorKey: "last_name",
      header: "Last Name",
    },
    {
      accessorKey: "phone",
      header: "Phone Number",
    },
    {
      accessorKey: "gender",
      header: "Gender",
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const active = row.getValue("is_active") as boolean
        return active ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
            <Check className="w-3 h-3 mr-1" /> Active
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-300 text-black">
            <X className="w-3 h-3 mr-1" /> Inactive
          </span>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(`/users/edit/${user.id}`)}
              className="cursor-pointer bg-secondary border-0 shadow-0 p-0 m-0"
            >
              <Edit />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-red-500 cursor-pointer bg-secondary border-0 p-0 m-0"
                >
                  <Trash />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this user? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(user.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    },
  ]

  return (
    <div className="w-full max-w-6xl mx-auto">
      <DataTable columns={columns} data={users} />
    </div>
  )
}
