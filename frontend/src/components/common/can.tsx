import { useAuthStore } from "@/store/user-store"

type CanProps = {
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Permission Guard Component
 * 
 * Usage:
 * <Can permission="edit_member">
 *   <EditButton />
 * </Can>
 * 
 * <Can permissions={["edit_member", "delete_member"]} requireAll={false}>
 *   <ActionButtons />
 * </Can>
 * 
 * <Can permission="delete_member" fallback={<p>No access</p>}>
 *   <DeleteButton />
 * </Can>
 */
export function Can({ 
  permission, 
  permissions, 
  requireAll = true, 
  fallback = null,
  children 
}: CanProps) {
  const userPermissions = useAuthStore((state) => state.permissions)

  // Single permission check
  if (permission) {
    const hasPermission = userPermissions.includes(permission)
    return hasPermission ? <>{children}</> : <>{fallback}</>
  }

  // Multiple permissions check
  if (permissions && permissions.length > 0) {
    const hasPermission = requireAll
      ? permissions.every((p) => userPermissions.includes(p))
      : permissions.some((p) => userPermissions.includes(p))
    
    return hasPermission ? <>{children}</> : <>{fallback}</>
  }

  // No permission specified, show children by default
  return <>{children}</>
}

