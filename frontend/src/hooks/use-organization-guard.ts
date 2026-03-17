// src/hooks/use-organization-guard.ts
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrgStore } from '@/store/org-store';
import { getUserOrganizationId } from '@/action/organization';

/**
 * Hook untuk memastikan user sudah memilih organization
 * Redirect ke organization jika belum ada organization
 */
export function useOrganizationGuard() {
  const router = useRouter();
  const { organizationId } = useOrgStore();
  const [hasOrganization, setHasOrganization] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkOrganization = async () => {
      try {
        console.log('🔍 useOrganizationGuard: Starting check');
        console.log('🔍 useOrganizationGuard: organizationId from store:', organizationId);
        
        setIsChecking(true);
        
        // Jika sudah ada organization di store, skip check
        if (organizationId) {
          console.log('✅ useOrganizationGuard: Organization found in store:', organizationId);
          setHasOrganization(true);
          setIsChecking(false);
          return;
        }

        console.log('🔍 useOrganizationGuard: Checking database...');
        
        // Check dari database - tanpa parameter karena getUserOrganizationId akan ambil current user
        const result = await getUserOrganizationId('');
        const orgId = result?.organizationId;
        
        console.log('🔍 useOrganizationGuard: Database result:', result);
        console.log('🔍 useOrganizationGuard: orgId:', orgId);
        
        if (!orgId) {
          console.log('🚨 useOrganizationGuard: No organization found, redirecting to organization');
          router.push('/organization');
          return;
        }

        console.log('✅ useOrganizationGuard: Organization found:', orgId);
        setHasOrganization(true);
      } catch (error) {
        console.error('❌ useOrganizationGuard: Error checking organization:', error);
        router.push('/organization');
      } finally {
        setIsChecking(false);
      }
    };

    checkOrganization();
  }, [organizationId, router]);

  return { 
    hasOrganization: !!organizationId || hasOrganization, 
    isChecking 
  };
}






























