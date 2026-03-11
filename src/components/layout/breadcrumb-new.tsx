'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

// Path mapping untuk breadcrumb labels
const pathMapping: Record<string, string> = {
  'settings': 'Settings',
  'members': 'Members',
  'attendance': 'Dashboard',
  'schedule': 'Schedules',
  'member': 'Member Schedules',
  'leaves': 'Leaves',
  'group': 'Groups',
  'department': 'Groups',
  'position': 'Positions',
  'role': 'Roles',
  'permission': 'Permissions',
  'analytics': 'Analytics',
  'account': 'Account',
  'users': 'Users',
  'locations': 'Locations',
  'add': 'Add',
  'new': 'New Request',
  'edit': 'Edit',
  'types': 'Manage Types',
  'invitations': 'Invitations',
  'check-in': 'Check In',
  'accept-invite': 'Accept Invitation',
  'detail': 'Detail',
  'list': 'Attendance List',
  'dashboard': 'Dashboard',
  'devices': 'Devices',
  'attendance/devices': 'Devices',
  'finger': 'Fingerprint',
  'organization': 'Organization',
  'applications': 'Applications', // New
};

// Combined paths - paths yang tidak perlu dipisah
const combinedPaths: Record<string, string> = {
  '/organization': 'Organization',
  '/organization/settings': 'Settings',
  '/organization/finger': 'Fingerprint',
  '/organization/applications': 'Applications', // New
  '/settings': 'Settings',
  '/settings/invitations': 'Invitations',
};

// Parent mapping untuk breadcrumb hierarchy
const parentMapping: Record<string, string> = {
  '/attendance/list': '/attendance',
  '/attendance/locations': '/attendance',
  '/attendance/devices': '/attendance',
  '/analytics': '/attendance',
  '/schedule/member': '/schedule',
  '/leaves/new': '/leaves',
  '/leaves/types': '/leaves',
  '/group': '/members',
  '/position': '/members',
  '/organization/finger': '/organization',
};

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrentPage: boolean;
}

function isId(segment: string): boolean {
  return /^\d+$/.test(segment) || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(segment);
}

export function DynamicBreadcrumb() {
  const pathname = usePathname();

  const breadcrumbs = React.useMemo((): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean);

    if (paths.length === 0) {
      return [{ label: 'Home', href: '/', isCurrentPage: true }];
    }

    // Check if current path is a combined path
    if (combinedPaths[pathname]) {
      return [
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: combinedPaths[pathname], href: pathname, isCurrentPage: true },
      ];
    }

    const items: BreadcrumbItem[] = [{ label: 'Home', href: '/', isCurrentPage: false }];

    // Check if current path has a parent in parentMapping
    const parent = parentMapping[pathname];
    if (parent) {
      const parentSegments = parent.split('/').filter(Boolean);
      const lastSegment = parentSegments[parentSegments.length - 1];
      const parentLabel = lastSegment ? (pathMapping[lastSegment] || lastSegment) : parent;

      items.push({
        label: parentLabel,
        href: parent,
        isCurrentPage: false,
      });
    }

    let currentPath = '';
    const pathsToSkip = new Set<number>();

    paths.forEach((segment, index) => {
      if (pathsToSkip.has(index)) return;

      // Check if this and next segment form a combined path
      if (index < paths.length - 1) {
        const nextSegment = paths[index + 1];
        if (nextSegment) {
          const combinedPath = `/${segment}/${nextSegment}`;
          if (combinedPaths[combinedPath]) {
            pathsToSkip.add(index + 1);
            const isLast = index === paths.length - 2 || (index === paths.length - 3 && isId(paths[paths.length - 1] ?? ''));
            items.push({
              label: combinedPaths[combinedPath],
              href: combinedPath,
              isCurrentPage: isLast,
            });
            currentPath = combinedPath;
            return;
          }
        }
      }

      // Skip IDs
      if (isId(segment)) return;

      currentPath += `/${segment}`;
      const isLast = index === paths.length - 1;
      const label = pathMapping[segment] || segment.split('-').map(word =>
        word ? word.charAt(0).toUpperCase() + word.slice(1) : ''
      ).join(' ');

      items.push({
        label,
        href: currentPath,
        isCurrentPage: isLast,
      });
    });

    return items;
  }, [pathname]);

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.href}>
          {index > 0 && <span className="mx-1">/</span>}
          {crumb.isCurrentPage ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <a href={crumb.href} className="hover:text-foreground transition-colors cursor-pointer">
              {crumb.label}
            </a>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
