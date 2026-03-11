import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  createMemberSchedule,
  updateMemberSchedule,
  deleteMemberSchedule
} from "@/action/member-schedule"
import { IMemberSchedule } from "@/interface"
import { toast } from "sonner"

import { memberLogger } from '@/lib/logger';
// Hook untuk fetch member schedules dengan caching via API route (GET)
export function useMemberSchedules(organizationId?: string) {
  return useQuery({
    queryKey: ["memberSchedules", organizationId],
    queryFn: async () => {
      memberLogger.debug('[React Query] Fetching member schedules via API')
      const url = organizationId ? `/api/schedule/member?organizationId=${organizationId}` : '/api/schedule/member'
      const response = await fetch(url, { credentials: 'same-origin' })
      const json = await response.json()
      if (!json.success) {
        throw new Error(json.message || 'Failed to fetch member schedules')
      }
      return json.data as IMemberSchedule[]
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 menit (lebih sering update karena data penting)
  })
}

// Hook untuk create member schedule dengan optimistic update
export function useCreateMemberSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<IMemberSchedule>) => createMemberSchedule(payload),
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate queries untuk refresh data
        queryClient.invalidateQueries({ queryKey: ["memberSchedules"] })
        toast.success("Schedule assigned successfully")
      } else {
        toast.error(response.message)
      }
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// Hook untuk update member schedule
export function useUpdateMemberSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<IMemberSchedule> }) =>
      updateMemberSchedule(id, payload),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ["memberSchedules"] })
        toast.success("Schedule updated successfully")
      } else {
        toast.error(response.message)
      }
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// Hook untuk delete member schedule
export function useDeleteMemberSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteMemberSchedule(id),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ["memberSchedules"] })
        toast.success("Schedule deleted successfully")
      } else {
        toast.error(response.message)
      }
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
