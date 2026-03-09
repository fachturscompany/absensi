'use client';

import { useEffect, useState, memo } from 'react';
import { EllipsisVertical, CircleUser, LogOut } from 'lucide-react';
import { UserAvatar } from '@/components/profile&image/user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/store/user-store';

interface UserProfile {
  name: string;
  email: string;
  avatar: string | null;
}

export const NavUser = memo(function NavUser() {
  const { isMobile } = useSidebar();
  const storeUser = useAuthStore((state) => state.user);
  const [user, setUser] = useState<UserProfile>({
    name: 'Loading...',
    email: '',
    avatar: null,
  });
  const setStoreUser = useAuthStore((state) => state.setUser);
  const [isLoggingOut, setIsLoggingOut] = useState(false);


  // Sync with store user (already fetched server-side)
  useEffect(() => {
    if (storeUser) {
      const displayName = storeUser.display_name ||
        [storeUser.first_name, storeUser.last_name]
          .filter(Boolean)
          .join(' ') ||
        'User';

      setUser({
        name: displayName,
        email: storeUser.email || '',
        avatar: storeUser.profile_photo_url || null,
      });
    }
  }, [storeUser]);

  // Setup real-time subscription for profile changes only
  useEffect(() => {
    if (!storeUser?.id) return;

    const supabase = createClient();

    const channel = supabase
      .channel('user-profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${storeUser.id}`,
        },
        async (payload: any) => {
          if (payload.new) {
            const newProfile = payload.new as any;

            const { getUserDisplayName } = await import('@/utils/user-display-name');
            const displayName = getUserDisplayName(newProfile);

            // Update global store
            setStoreUser(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                ...newProfile,
                display_name: displayName,
              };
            });

            // Local state will be updated via the first useEffect when storeUser changes
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeUser?.id, storeUser?.email, setStoreUser]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    // Import complete logout handler
    const { handleCompleteLogout } = await import('@/utils/logout-handler');
    await handleCompleteLogout();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar
                name={user.name}
                photoUrl={user.avatar}
                userId={storeUser?.id}
                size={8}
                className="rounded-full"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
              </div>
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserAvatar
                  name={user.name}
                  photoUrl={user.avatar}
                  userId={storeUser?.id}
                  size={8}
                  className="rounded-full"
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/account">
                  <CircleUser />
                  Account
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
              <LogOut />
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
});
