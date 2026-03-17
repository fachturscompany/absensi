import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOrgStore } from '@/store/org-store'
import { toast } from 'sonner'

/**
 * Hook untuk memastikan organizationId sudah dipilih
 * Redirect ke /organization jika belum ada
 * 
 * @param showError - Tampilkan error toast (default: true)
 * @returns organizationId atau null
 */
export function useOrgGuard(showError: boolean = true) {
  const router = useRouter()
  const orgStore = useOrgStore()

  useEffect(() => {
    if (!orgStore.organizationId) {
      if (showError) {
        toast.error('Please select an organization')
      }
      router.push('/organization')
    }
  }, [orgStore.organizationId, router, showError])

  return orgStore.organizationId
}
