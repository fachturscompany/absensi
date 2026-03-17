'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useRecentActivity } from '@/hooks/use-recent-activity';
import { formatDistanceToNow } from 'date-fns';

function formatTime(timeString: string): string {
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return timeString;
  }
}

function formatRelativeTime(timeString: string): string {
  try {
    const date = new Date(timeString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'just now';
  }
}

export function NotificationDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: activities = [], isLoading } = useRecentActivity(5, { enabled: open, refetchIntervalMs: open ? 1000 * 60 * 3 : undefined });

  const notificationCount = activities.length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center"
            >
              {notificationCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : activities.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            activities.map((activity) => (
              <DropdownMenuItem
                key={activity.id}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
              >
                <p className="text-sm font-medium">New attendance record</p>
                <p className="text-xs text-muted-foreground">
                  {activity.memberName} checked in at {formatTime(activity.checkInTime)}
                  {activity.lateMinutes && activity.lateMinutes > 0 && (
                    <span className="text-amber-600 dark:text-amber-400">
                      {' '}({activity.lateMinutes} min late)
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(activity.checkInTime)}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-sm text-primary cursor-pointer"
          onClick={() => router.push('/notifications')}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
