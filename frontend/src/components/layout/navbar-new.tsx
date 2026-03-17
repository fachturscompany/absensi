'use client';

import { useEffect} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Sun,
  Moon,
  Monitor,
  UserPlus,
  Clock,
  MapPin,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';

import { useOrgStore } from '@/store/org-store';
import { useAuthStore } from '@/store/user-store';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';

export function NavbarNew() {
  const router = useRouter();
  const pathname = usePathname();

  // We want to hide search and new buttons on the organization selection page
  const showActions = pathname !== '/organization';
  const { theme, setTheme } = useTheme();
  const { organizationName, organizationId, setOrganizationId } = useOrgStore();
  // @ts-ignore
  const user = useAuthStore((state: any) => state.user);
  // @ts-ignore
  const userOrganizations = useAuthStore((state: any) => state.userOrganizations);

  // Keyboard shortcuts - Only for Quick Actions
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if Cmd/Ctrl is pressed
      if (!(event.metaKey || event.ctrlKey)) return;

      switch (event.key.toLowerCase()) {
        case 'n':
          event.preventDefault();
          router.push('/members?action=invite');
          break;
        case 'i':
          event.preventDefault();
          router.push('/attendance/add');
          break;
        case 'l':
          event.preventDefault();
          router.push('/attendance/locations/new');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Hydrate org store from localStorage (and Supabase if needed) so OrgBreadcrumb can immediately show org name
  useEffect(() => {
    const hydrate = async () => {
      try {
        const raw = localStorage.getItem('org-store');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const state = (parsed?.state ?? parsed) as {
          organizationId?: number | null;
          organizationName?: string | null;
          organizations?: Array<{ id?: number; name?: string }>;
        };
        const storedId = state?.organizationId ?? null;
        const derivedName = state?.organizationName
          || (Array.isArray(state?.organizations)
            ? state.organizations.find(o => Number(o?.id) === Number(storedId))?.name
            : undefined);

        if (storedId && derivedName) {
          setOrganizationId(storedId, derivedName);
          return;
        }

        // As a last resort, fetch the organization name by ID
        if (storedId && !organizationName) {
          try {
            const supabase = createClient();
            const { data, error } = await supabase
              .from('organizations')
              .select('id, name, logo_url')
              .eq('id', storedId)
              .maybeSingle();
            if (!error && data?.name) {
              setOrganizationId(storedId, data.name);
            }
          } catch { }
        }
      } catch { }
    };

    if (!organizationId || !organizationName) {
      void hydrate();
    }
  }, [organizationName, organizationId, setOrganizationId]);

  // Auto-select first organization if none selected
  useEffect(() => {
    if (!organizationId && userOrganizations && userOrganizations.length > 0) {
      const firstOrg = userOrganizations[0];
      if (firstOrg?.organization_id && firstOrg?.organization_name) {
        setOrganizationId(firstOrg.organization_id, firstOrg.organization_name);
      }
    }
  }, [organizationId, userOrganizations, setOrganizationId]);

  const quickActions = [
    { icon: UserPlus, label: 'Invite Member', href: '/members?action=invite', kbd: '⌘N' },
    { icon: Clock, label: 'Manual Attendance', href: '/attendance/add', kbd: '⌘I' },
    { icon: MapPin, label: 'Add Location', href: '/attendance/locations/new', kbd: '⌘L' },
  ];

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />

      </div>

      {/* Right Side Actions */}
      <div className="ml-auto flex items-center gap-2">
        {showActions && (
          <>
            <DropdownMenu>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {quickActions.map((action) => (
                  <DropdownMenuItem
                    key={action.href}
                    onClick={() => router.push(action.href)}
                    className="cursor-pointer"
                  >
                    <action.icon className="mr-2 h-4 w-4" />
                    {action.label}
                    <DropdownMenuShortcut>{action.kbd}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {/* Notifications */}
        <NotificationDropdown />

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
