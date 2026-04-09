"use client"

import React from "react"
import { useParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { RefreshCw, Search, X, ChevronLeft, User } from "lucide-react"
import { useHydration } from "@/hooks/useHydration"
import { useDebounce } from "@/utils/debounce"
import { getTeamBySlug, getTeamMembers } from "@/action/teams"
import { ITeamMember } from "@/interface"
import { Button } from "@/components/ui/button"
import {
  Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia,
} from "@/components/ui/empty"
import { TableSkeleton, membersColumns } from "@/components/skeleton/tables-loading"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { TeamMembersTable } from "@/components/teams/team-members-table"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"

export default function TeamMembersPage() {
  const params = useParams()
  const queryClient = useQueryClient()
  const { isHydrated, organizationId } = useHydration()
  const slug = decodeURIComponent(params.slug as string)

  // ── Local state ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const debouncedSearch = useDebounce(searchQuery, 400)

  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  // ── Team Identity Resolve ───────────────────────────────────────────────
  const { data: teamResult, isLoading: teamLoading } = useQuery({
    queryKey: ["team-by-slug", slug, organizationId],
    queryFn: () => getTeamBySlug(slug),
    enabled: isHydrated && !!organizationId,
    staleTime: 5 * 60_000,
  })

  const team = teamResult?.data ?? null
  const teamId = team?.id ?? null
  const teamName = team?.name ?? slug

  // ── Fetch Members ───────────────────────────────────────────────────────
  const {
    data: membersData,
    isLoading: membersLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["team-members", teamId, organizationId],
    queryFn: () => getTeamMembers(Number(teamId)),
    enabled: !!teamId,
    staleTime: 60_000,
  })

  // ── Filter Logic ────────────────────────────────────────────────────────
  const filteredMembers = React.useMemo(() => {
    const rawMembers = membersData?.data ?? []
    if (!debouncedSearch.trim()) return rawMembers

    const s = debouncedSearch.toLowerCase().trim()
    return rawMembers.filter((m: ITeamMember) => {
      const name = (m.organization_members?.user?.name || "").toLowerCase()
      const email = (m.organization_members?.user?.email || "").toLowerCase()
      const role = (m.positions_detail?.title || "").toLowerCase()
      return name.includes(s) || email.includes(s) || role.includes(s)
    })
  }, [membersData, debouncedSearch])

  // ── Pagination Logic (FIXED: filteredMembers.slice) ─────────────────────
  const total = filteredMembers.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const paginatedMembers = React.useMemo(() => {
    return filteredMembers.slice((page - 1) * pageSize, page * pageSize)
  }, [filteredMembers, page, pageSize])

  const handleRefresh = React.useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ["team-members", teamId] })
      await refetch()
      toast.success("Data refreshed!")
    } catch {
      toast.error("Failed to refresh data")
    }
  }, [queryClient, teamId, refetch])

  if (!isHydrated || teamLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 pt-0 mt-6">
        <div className="h-6 w-48 animate-pulse bg-muted rounded" />
        <TableSkeleton rows={8} columns={membersColumns} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pt-0">
      <div className="flex flex-col gap-1">
        <Link 
          href="/teams" 
          className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors mb-1"
        >
          <ChevronLeft className="h-3 w-3 mr-1" /> Back to Teams
        </Link>
        <h1 className="text-xl font-semibold">{teamName} — Members</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
          <Input
            placeholder="Search members in team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={membersLoading}
            className="pl-10 pr-8"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={membersLoading || isFetching}
          className="h-9"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${(membersLoading || isFetching) ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="min-h-[400px]">
        {membersLoading ? (
          <TableSkeleton rows={8} columns={membersColumns} />
        ) : filteredMembers.length === 0 ? (
          <div className="py-20">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <User className="h-14 w-14 text-muted-foreground mx-auto" />
                </EmptyMedia>
                <EmptyTitle>No members</EmptyTitle>
                <EmptyDescription>
                  {searchQuery ? `No members found matching "${searchQuery}"` : "This team doesn't have any members yet."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <TeamMembersTable 
              members={paginatedMembers} 
              isLoading={isFetching} 
            />
          </div>
        )}
      </div>

      <PaginationFooter
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={membersLoading || isFetching}
        from={total > 0 ? (page - 1) * pageSize + 1 : 0}
        to={Math.min(page * pageSize, total)}
        total={total}
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        pageSizeOptions={[10, 50, 100]}
      />
    </div>
  )
}