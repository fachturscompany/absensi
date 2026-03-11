import { useAuthStore } from '@/store/user-store'
import { User } from '@supabase/supabase-js'

/**
 * Centralized session hook - single source of truth for current user
 * Uses auth store populated from server-side to avoid duplicate fetches
 */
export function useSession() {
  const storeUser = useAuthStore((state) => state.user)

  // Convert store user to Supabase User format
  const user: User | null = storeUser ? {
    id: storeUser.id,
    email: storeUser.email || '',
    app_metadata: {},
    user_metadata: {
      first_name: storeUser.first_name,
      last_name: storeUser.last_name,
      display_name: storeUser.display_name,
      profile_photo_url: storeUser.profile_photo_url,
    },
    aud: 'authenticated',
    created_at: '',
  } as User : null

  return {
    data: user,
    isLoading: false,
    isSuccess: !!user,
    isError: false,
    error: null,
  }
}
