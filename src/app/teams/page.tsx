"use client"

import React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Plus, Search, Users as TeamIcon } from "lucide-react"
import { useForm, Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { ITeams } from "@/interface"
import { getTeams, createTeam, updateTeam, deleteTeam } from "@/action/teams"
import { useHydration } from "@/hooks/useHydration"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Empty, EmptyHeader, EmptyTitle, EmptyMedia } from "@/components/ui/empty"
import { TableSkeleton, groupsColumns as teamsSkeletonColumns } from "@/components/skeleton/tables-loading"

import { TeamsTable } from "@/components/teams/teams-table"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { TeamFormDialog, TeamForm, teamSchema } from "@/components/teams/dialogs/teams-form-dialog"
import { TeamDeleteDialog } from "@/components/teams/dialogs/delete-dialog"

export default function TeamsPage() {
  const queryClient = useQueryClient()
  const { isHydrated, organizationId } = useHydration()

  const [teams, setTeams] = React.useState<ITeams[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingTeam, setEditingTeam] = React.useState<ITeams | null>(null)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<ITeams | null>(null)

  const form = useForm<TeamForm, unknown, TeamForm>({
    resolver: zodResolver(teamSchema) as Resolver<TeamForm>,
    defaultValues: {
      organization_id: 0,
      code: "",
      name: "",
      description: "",
      is_active: true,
      // settings & metadata dihapus
    },
  })

  const fetchTeamsData = React.useCallback(async () => {
    if (!organizationId) return
    try {
      setLoading(true)
      const result = await getTeams(Number(organizationId))
      if (result.success) setTeams(result.data)
    } catch {
      toast.error("Failed to fetch teams")
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  React.useEffect(() => {
    if (isHydrated && organizationId) fetchTeamsData()
  }, [isHydrated, organizationId, fetchTeamsData])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  const handleSubmit = async (values: TeamForm) => {
    if (values.organization_id === 0) {
      toast.error("Invalid Organization ID")
      return
    }
    try {
      const res = editingTeam
        ? await updateTeam(editingTeam.id, values)
        : await createTeam(values)

      if (res.success) {
        toast.success(res.message)
        setModalOpen(false)
        fetchTeamsData()
        queryClient.invalidateQueries({ queryKey: ["teams"] })
      } else {
        throw new Error(res.message)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred")
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await deleteTeam(deleteTarget.id)
      if (res.success) {
        toast.success(res.message)
        setDeleteOpen(false)
        fetchTeamsData()
        queryClient.invalidateQueries({ queryKey: ["teams"] })
      } else {
        throw new Error(res.message)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred")
    }
  }

  const openAdd = () => {
    setEditingTeam(null)
    form.reset({
      organization_id: Number(organizationId),
      code: "",
      name: "",
      description: "",
      is_active: true,
    })
    setModalOpen(true)
  }

  const openEdit = (team: ITeams) => {
    setEditingTeam(team)
    form.reset({
      organization_id: Number(team.organization_id),
      code: team.code || "",
      name: team.name,
      description: team.description || "",
      is_active: team.is_active,
      // settings & metadata tidak di-reset, tidak ditampilkan di form
    })
    setModalOpen(true)
  }

  const filteredTeams = teams.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.code?.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus =
      statusFilter === "all" ? true :
      statusFilter === "active" ? t.is_active : !t.is_active
    return matchesSearch && matchesStatus
  })

  const paginatedTeams = filteredTeams.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  if (!isHydrated) return (
    <div className="p-4">
      <TableSkeleton rows={6} columns={teamsSkeletonColumns} />
    </div>
  )

  return (
    <div className="flex flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Teams</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} columns={teamsSkeletonColumns} />
      ) : filteredTeams.length === 0 ? (
        <Empty className="py-20">
          <EmptyHeader>
            <EmptyMedia><TeamIcon className="h-12 w-12" /></EmptyMedia>
            <EmptyTitle>No teams found</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <TeamsTable
            data={paginatedTeams}
            organizationId={organizationId}
            onEdit={openEdit}
            onDelete={(t) => { setDeleteTarget(t); setDeleteOpen(true) }}
          />
          <PaginationFooter
            page={currentPage}
            totalPages={Math.ceil(filteredTeams.length / pageSize)}
            total={filteredTeams.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            from={filteredTeams.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            to={Math.min(currentPage * pageSize, filteredTeams.length)}
          />
        </>
      )}

      {modalOpen && (
        <TeamFormDialog
          open={modalOpen}
          onOpenChange={setModalOpen}
          editingId={editingTeam?.id ?? null}
          form={form}
          onSubmit={handleSubmit}
          organizationId={organizationId}
        />
      )}

      {deleteOpen && (
        <TeamDeleteDialog
          open={deleteOpen}
          onOpenChange={(o) => {
            setDeleteOpen(o)
            if (!o) setDeleteTarget(null)
          }}
          target={deleteTarget}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}