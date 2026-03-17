import { Metadata } from 'next';
import { getCachedOrganizationName } from '@/lib/data-cache';
import { createClient } from '@/utils/supabase/server';

/**
 * Generate dynamic metadata with organization name
 * @param pageTitle - The page-specific title (e.g., "Dashboard", "Members", "Attendance")
 * @param pageDescription - Optional page-specific description
 * @returns Metadata object with organization name included
 */
export async function generatePageMetadata(
  pageTitle: string,
  pageDescription?: string
): Promise<Metadata> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const organizationName = user ? await getCachedOrganizationName(user.id) : null;

    // Generate title with organization name: [Page] - [Organization]
    const fullTitle = organizationName
      ? `${pageTitle} - ${organizationName}`
      : pageTitle;

    const description = pageDescription
      ? pageDescription
      : `${pageTitle} - ${organizationName || 'Absensi'}`;

    return {
      title: fullTitle,
      description: description,
      openGraph: {
        title: fullTitle,
        description: description,
      },
      twitter: {
        card: 'summary',
        title: fullTitle,
        description: description,
      },
    };
  } catch (error) {
    // Fallback if there's an error
    return {
      title: pageTitle,
      description: pageDescription || pageTitle,
    };
  }
}

/**
 * Generate simple metadata without async (for client components or static pages)
 * @param pageTitle - The page title
 * @param pageDescription - Optional description
 */
export function generateSimpleMetadata(
  pageTitle: string,
  pageDescription?: string
): Metadata {
  return {
    title: pageTitle,
    description: pageDescription || pageTitle,
    openGraph: {
      title: pageTitle,
      description: pageDescription || pageTitle,
    },
    twitter: {
      card: 'summary',
      title: pageTitle,
      description: pageDescription || pageTitle,
    },
  };
}
