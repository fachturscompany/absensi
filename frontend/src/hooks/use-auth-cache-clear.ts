import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/user-store'
import { useOrganizationId } from './use-organization-id'

import { authLogger } from '@/lib/logger';
/**
 * Hook to clear React Query cache when user OR organization changes
 * This prevents data leakage between different users/organizations
 */
export function useAuthCacheClear() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const setPermissions = useAuthStore((state) => state.setPermissions)
  const { data: organizationId } = useOrganizationId()
  
  const previousUserId = useRef<string | null>(null)
  const previousOrgId = useRef<number | null>(null)

  useEffect(() => {
    const currentUserId = user?.id ?? null
    const currentOrgId = organizationId ?? null

    // If user changed (login/logout/switch), clear all caches
    if (previousUserId.current !== null && previousUserId.current !== currentUserId) {
      authLogger.info('[Auth Cache Clear] User changed, clearing ALL React Query cache')
      queryClient.clear()
      setPermissions([]) // Clear permissions too
      previousUserId.current = currentUserId
      previousOrgId.current = currentOrgId
      return
    }

    // If organization changed (same user, different org), invalidate organization-specific data
    if (previousOrgId.current !== null && previousOrgId.current !== currentOrgId && currentOrgId !== null) {
      authLogger.info('[Auth Cache Clear] Organization changed, invalidating organization-specific cache', {
        from: previousOrgId.current,
        to: currentOrgId
      })
      
      // Clear permissions as they are organization-specific
      setPermissions([])
      
      // Invalidate all queries that should be organization-specific
      queryClient.invalidateQueries({ queryKey: ['organization'] }) // ✅ CRITICAL: Clear organization data query
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['positions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['workSchedules'] })
      queryClient.invalidateQueries({ queryKey: ['memberSchedules'] })
      queryClient.invalidateQueries({ queryKey: ['departmentMembers'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      queryClient.invalidateQueries({ queryKey: ['member-recent-attendance'] })
    }

    previousUserId.current = currentUserId
    previousOrgId.current = currentOrgId
  }, [user?.id, organizationId, queryClient, setPermissions])
}
