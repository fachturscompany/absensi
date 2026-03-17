"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { DataTable } from "@/components/tables/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import { Input } from "@/components/ui/input"
import { Search } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { getPositionById } from '@/action/position'
import { getMembersByPositionId } from '@/action/members'
import { IPositions, IOrganization_member } from '@/interface'
import { toast } from 'sonner'

export default function PositionDetailPage() {
  const pathname = usePathname()
  const positionId = pathname.split('/').pop()

  const [position, setPosition] = useState<IPositions | null>(null)
  const [members, setMembers] = useState<IOrganization_member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      if (!positionId) {
        toast.error('Position ID is missing')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const positionRes = await getPositionById(positionId)
        if (!positionRes.success || !positionRes.data) throw new Error(positionRes.message)
        setPosition(positionRes.data)

        const membersRes = await getMembersByPositionId(positionId)
        if (!membersRes.success || !membersRes.data) throw new Error(membersRes.message)
        setMembers(membersRes.data)

      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [positionId])

  const filteredMembers = useMemo(() => {
    let result = [...members]
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase()
      result = result.filter(
        (member) => {
          const displayName = member.user?.display_name || `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim()
          return (
            displayName.toLowerCase().includes(lowercasedQuery) ||
            (member.user?.email?.toLowerCase() || "").includes(lowercasedQuery)
          )
        }
      )
    }
    return result
  }, [members, searchQuery])

  const columns = useMemo<ColumnDef<IOrganization_member>[]>(
    () => [
      {
        accessorKey: "nickname",
        header: "Nickname",
        cell: ({ row }) => (
          <div className="text-primary hover:underline cursor-pointer">
            {row.original.user?.first_name || '-'}
          </div>
        ),
      },
      {
        id: "fullName",
        header: "Full Name",
        cell: ({ row }) => {
          const fullName = `${row.original.user?.first_name || ''} ${row.original.user?.last_name || ''}`.trim()
          return (
            <div className="text-primary hover:underline cursor-pointer">
              {fullName || '-'}
            </div>
          )
        },
      },
    ],
    []
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 md:p-6 bg-white rounded-lg shadow-sm border border-gray-200 space-y-4">
        <h1 className="text-2xl font-bold">{position?.title || 'Position'} Members</h1>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="mt-2">
          {loading ? (
            <TableSkeleton rows={5} columns={3} />
          ) : (
            <DataTable columns={columns} data={filteredMembers} showPagination={false} />
          )}
        </div>
      </div>
    </div>
  )
}
