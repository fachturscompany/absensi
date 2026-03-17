'use client';

import { useEffect } from 'react';

interface PageTitleUpdaterProps {
  title: string;
}

/**
 * Component to automatically update page title with organization name
 * Usage: <PageTitleUpdater title="Dashboard" />
 * 
 * This component fetches the organization name and updates the document title
 * Format: "{Page Title} - {Organization Name}" or "{Page Title} - Absensi" as fallback
 */
export function PageTitleUpdater({ title }: PageTitleUpdaterProps) {
  useEffect(() => {
    const updateTitle = async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data } = await supabase
            .from('organization_members')
            .select('organizations(name)')
            .eq('user_id', user.id)
            .maybeSingle();

          const orgName = (data?.organizations as any)?.name;
          document.title = orgName ? `${title} - ${orgName}` : `${title} - Absensi`;
        } else {
          document.title = `${title} - Absensi`;
        }
      } catch {
        document.title = `${title} - Absensi`;
      }
    };

    updateTitle();
  }, [title]);

  return null; // This component doesn't render anything
}
