import { useQuery } from "@tanstack/react-query"
import { IOrganization_member } from "@/interface"
import { useOrganizationId } from "../../use-organization-id"
import { memberLogger } from '@/lib/logger';
import { type MemberOption } from "@/types/attendance"

export function useMembers() {
  const { data: organizationId } = useOrganizationId()

  const query = useQuery({
    queryKey: ["members", organizationId],
    queryFn: async () => {
      memberLogger.debug('[React Query] Fetching members via API for org:', organizationId)
      const url = new URL('/api/members', window.location.origin)
      if (organizationId) {
        url.searchParams.append('organizationId', organizationId.toString())
        url.searchParams.set('limit', '1000')
        url.searchParams.set('page', '1')
        url.searchParams.set('active', 'all')
        url.searchParams.set('countMode', 'planned')
      }
      const response = await fetch(url.toString(), { credentials: 'same-origin' })
      const json = await response.json()
      if (!json.success) {
        throw new Error(json.message || 'Failed to fetch members')
      }
      return json.data as IOrganization_member[]
    },
    enabled: !!organizationId,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // ✅ TRANSFORM DATA:
  const members: MemberOption[] = query.data?.map((m: IOrganization_member) => ({
    id: m.id.toString(),
    userId: m.user_id,
    label: m.computed_name || `Member ${m.id}`,
    department: m.groupName || "General",
    avatar: m.user?.profile_photo_url || null
  })) || []

  const departments = Array.from(new Set(members.map(m => m.department))).sort()

  // ✅ RETURN INI:
  return {
    members,      // MemberOption[]
    departments,  // string[]
    loading: query.isLoading
  }
}
