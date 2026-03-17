import { useAuthStore } from '@/store/user-store'

interface UserProfile {
  first_name?: string
  last_name?: string
  display_name?: string | null
  profile_photo_url?: string | null
  employee_code?: string
}

/**
 * Centralized user profile hook
 * Uses auth store populated from server-side to avoid duplicate fetches
 */
export function useUserProfile() {
  const storeUser = useAuthStore((state) => state.user)

  const profile: UserProfile | null = storeUser ? {
    first_name: storeUser.first_name,
    last_name: storeUser.last_name,
    display_name: storeUser.display_name,
    profile_photo_url: storeUser.profile_photo_url,
    employee_code: storeUser.employee_code,
  } : null

  return {
    data: profile,
    isLoading: false,
    isSuccess: !!profile,
    isError: false,
    error: null,
  }
}
