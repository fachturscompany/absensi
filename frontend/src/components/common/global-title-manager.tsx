'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

/**
 * Global Title Manager
 * 
 * This component runs once at the root level and manages all title updates.
 * It prevents flickering by immediately setting the title on mount and
 * updating it whenever the route changes.
 */
export function GlobalTitleManager() {
  const pathname = usePathname();
  const orgNameRef = useRef<string | null>(null);
  const hasInitialized = useRef(false);

  // Fetch organization name once and cache it
  useEffect(() => {
    const fetchOrgName = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data } = await supabase
            .from('organization_members')
            .select('organizations(name)')
            .eq('user_id', user.id)
            .maybeSingle();

          orgNameRef.current = (data?.organizations as any)?.name || null;
        }
      } catch (error) {
        console.error('Error fetching organization name:', error);
        orgNameRef.current = null;
      }

      hasInitialized.current = true;
    };

    if (!hasInitialized.current) {
      fetchOrgName();
    }
  }, []);

  // Update title based on pathname
  useEffect(() => {
    const updateTitle = () => {
      // Force consistent title across pages
      document.title = "Absensi";
    };

    updateTitle();
  }, [pathname]);

  return null; // This component doesn't render anything
}
