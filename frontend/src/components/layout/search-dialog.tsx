'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMounted } from '@/hooks/use-mounted';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  MapPin,
  Building2,
  Briefcase,
  BarChart3,
  Settings,
  FileText,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

const searchItems = [
  { group: 'Home', icon: LayoutDashboard, label: 'Home', url: '/' },
  { group: 'Home', icon: BarChart3, label: 'Analytics', url: '/analytics' },
  { group: 'Management', icon: Users, label: 'Members', url: '/members' },
  { group: 'Management', icon: ClipboardList, label: 'Attendance', url: '/attendance' },
  { group: 'Management', icon: Calendar, label: 'Work Schedules', url: '/schedule' },
  { group: 'Management', icon: Calendar, label: 'Member Schedules', url: '/schedule/member' },
  { group: 'Management', icon: MapPin, label: 'Locations', url: '/attendance/locations' },
  { group: 'Management', icon: FileText, label: 'Leaves', url: '/leaves' },
  { group: 'Organization', icon: Building2, label: 'Groups', url: '/group' },
  { group: 'Organization', icon: Briefcase, label: 'Positions', url: '/position' },
  { group: 'Organization', icon: Settings, label: 'Settings', url: '/organization/settings' },
  { group: 'Quick Actions', icon: Users, label: 'Invite Member', url: '/members?action=invite' },
];

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const mounted = useMounted();

  React.useEffect(() => {
    if (!mounted) return;

    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [mounted]);

  const handleSelect = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  return (
    <>
      <Button
        variant="ghost"
        className="gap-2 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        <span className="hidden md:inline">Search</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      {mounted && (
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Search pages, members, and more..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {[...new Set(searchItems.map((item) => item.group))].map((group, i) => (
              <React.Fragment key={group}>
                {i !== 0 && <CommandSeparator />}
                <CommandGroup heading={group}>
                  {searchItems
                    .filter((item) => item.group === group)
                    .map((item) => (
                      <CommandItem
                        key={item.url}
                        onSelect={() => handleSelect(item.url)}
                        className="cursor-pointer"
                      >
                        {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                        <span>{item.label}</span>
                      </CommandItem>
                    ))}
                </CommandGroup>
              </React.Fragment>
            ))}
          </CommandList>
        </CommandDialog>
      )}
    </>
  );
}
