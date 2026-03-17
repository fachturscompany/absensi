'use client';

import { usePathname } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebarNew } from './app-sidebar-new';
import { NavbarNew } from './navbar-new';

export function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Pages that should NOT have sidebar/navbar
  const publicPaths = [
    '/auth/login',
    '/auth/signup',
    '/auth/callback',
    '/auth/reset-password',
    '/auth/forgot-password',
    '/onboarding',
    '/accept-invite',
    '/invite',
    '/account-inactive',
    '/organization-inactive',
    '/subscription-expired',
    '/offline',
    '/role-selector',
  ];

  // Pages that should hide only the navbar (keep sidebar/layout)
  const hideNavbarPaths = [
    '/members/import-simple',
    '/members/import-simple-1',
    '/finger/import-simple',
    '/finger/import-simple/mapping',
  ];

  // Check if current path is public (no sidebar/navbar)
  const isPublicPath = publicPaths.some(path => pathname?.startsWith(path));

  // Check if navbar should be hidden
  const hideNavbar = hideNavbarPaths.some(path => pathname?.startsWith(path));

  // Check if current path is settings page (should have no padding)
  const isSettingsPage = pathname?.includes('/activity/screenshots/setting') || pathname?.includes('/activity/tracking') || pathname?.includes('/activity/settings') || pathname?.includes('/settings/');

  // If public path, render children without layout
  if (isPublicPath) {
    return <>{children}</>;
  }

  // Dashboard pages: render with sidebar/navbar
  // Always render NavbarNew to avoid hydration mismatch
  // NavbarNew handles its own hydration internally
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebarNew />
      <SidebarInset className="flex flex-col min-w-0">
        {!hideNavbar && <NavbarNew />}
        <div className={`flex flex-1 flex-col w-full min-w-0 ${isSettingsPage ? '' : 'gap-4 p-4 md:gap-6 md:p-6'}`}>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
