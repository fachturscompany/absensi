"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/tables/data-table"
import { useRouter } from "next/navigation"
import { Trash, Calendar, Plus } from "lucide-react"
import { UserAvatar } from "@/components/profile&image/user-avatar"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { IMemberSchedule } from "@/interface"

interface MemberScheduleTableProps {
  items: IMemberSchedule[]
  isLoading?: boolean
  pageIndex: number
  pageSize: number
  totalRecords: number
  onPageIndexChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
  onDelete: (id: string) => void
}

export default function MemberScheduleTable({
  items,
  isLoading = false,
  pageIndex,
  pageSize,
  totalRecords,
  onPageIndexChange,
  onPageSizeChange,
  onDelete,
}: MemberScheduleTableProps) {
  const router = useRouter()
  const getMemberName = (schedule: IMemberSchedule) => {
    const member = schedule.organization_member as {
      user?: {
        first_name?: string;
        last_name?: string; email?: string
      }
    }
    if (!member?.user) return "Unknown Member"
    const { first_name, last_name, email } = member.user
    const parts = [first_name, last_name].filter(Boolean)
    return parts.length > 0 ? parts.join(" ") : email || "Unknown"
  }

  const getScheduleName = (schedule: IMemberSchedule) => {
    const workSchedule = schedule.work_schedule as { name?: string }
    return workSchedule?.name || "Unknown Schedule"
  }

  const columns: ColumnDef<IMemberSchedule>[] = [
    {
      header: "Member",
      accessorFn: (row) => getMemberName(row),
      cell: ({ row }) => {
        const schedule = row.original
        const member = schedule.organization_member as any
        const user = member?.user
        const name = getMemberName(schedule)
        const memberId = String(schedule.organization_member_id || member?.id || "")

        return (
          <div className="flex gap-3 items-center">
            <UserAvatar
              name={name}
              photoUrl={user?.profile_photo_url}
              userId={user?.id}
              size={9}
            />
            <div className="flex flex-col">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (!memberId) return
                  router.push(`/members/${memberId}`)
                }}
                disabled={!memberId}
                className="text-left text-sm font-medium leading-none hover:underline disabled:no-underline disabled:cursor-default"
              >
                {name}
              </button>
            </div>
          </div>
        )
      },
    },
    {
      header: "Work Schedule",
      accessorFn: (row) => getScheduleName(row),
      cell: ({ row }) => getScheduleName(row.original),
    },
    {
      header: "Effective Date",
      accessorKey: "effective_date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("effective_date"))
        // Use browser locale for i18n instead of hardcoded "id-ID"
        return (
          <time dateTime={date.toISOString().split("T")[0]}>
            {date.toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        )
      },
    },
    {
      header: "End Date",
      accessorKey: "end_date",
      cell: ({ row }) => {
        const endDate = row.original.end_date
        if (!endDate) {
          return <span className="text-muted-foreground">Ongoing</span>
        }
        const date = new Date(endDate)
        return (
          <time dateTime={date.toISOString().split("T")[0]}>
            {date.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </time>
        )
      },
    },
    {
      header: "Status",
      accessorKey: "is_active",
      cell: ({ row }) => {
        const active = row.getValue("is_active") as boolean
        return (
          <Badge
            variant={active ? "default" : "secondary"}
            className={active ? "bg-green-500 hover:bg-green-600" : ""}
            role="status"
            aria-label={active ? "Schedule is active" : "Schedule is inactive"}
          >
            {active ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const schedule = row.original
        return (
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 text-red-500 cursor-pointer bg-secondary border-0 p-0"
                  aria-label={`Delete schedule assignment for ${getMemberName(schedule)}`}
                  title="Delete assignment"
                >
                  <Trash className="h-4 w-4" aria-hidden="true" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Schedule Assignment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this schedule assignment? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(schedule.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    },
  ]

  return (
    <div className="w-full h-full">
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        showGlobalFilter={false}
        showFilters={false}
        showColumnToggle={false}
        layout="card"
        manualPagination={true}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalRecords={totalRecords}
        onPageIndexChange={onPageIndexChange}
        onPageSizeChange={onPageSizeChange}
        emptyState={
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Calendar className="h-14 w-14 text-muted-foreground mx-auto" />
              </EmptyMedia>
              <EmptyTitle>No member schedules</EmptyTitle>
              <EmptyDescription>
                Get started by assigning a work schedule to a member.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                onClick={() => router.push("/schedule/member/assign")}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Assign
              </Button>
            </EmptyContent>
          </Empty>
        }
      />
    </div>
  )
}
