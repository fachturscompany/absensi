import { useEffect } from 'react';

/**
 * Custom hook to dynamically update page title
 * @param pageTitle - The page-specific title (e.g., "Dashboard", "Members")
 * @param organizationName - Optional organization name
 */
export function usePageTitle(pageTitle: string, organizationName?: string | null) {
  useEffect(() => {
    const fullTitle = organizationName
      ? `${pageTitle} - ${organizationName}`
      : `${pageTitle} - Absensi`;

    document.title = fullTitle;

    // Cleanup: restore to default on unmount
    return () => {
      document.title = 'Absensi - Sistem Kehadiran Digital';
    };
  }, [pageTitle, organizationName]);
}
