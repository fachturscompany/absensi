"use client";

import { useMemo, useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { Avatar, AvatarFallback } from "@/components/profile&image/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";

type NotificationCategory = "attendance" | "leaves" | "schedule" | "invites";
type NotificationFilter = "all" | NotificationCategory;

type NotificationItem = {
  id: number;
  sender: string;
  subject: string;
  snippet: string;
  date: string;
  category: NotificationCategory;
  unread?: boolean;
  selected?: boolean;
  recipients?: string[];
};

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

const categoryTabs: { value: NotificationFilter; label: string }[] = [
  { value: "all", label: "All notif" },
  { value: "attendance", label: "Attendance" },
  { value: "schedule", label: "Schedule" },
  { value: "leaves", label: "Leaves" },
  { value: "invites", label: "Invites" },
];

const categoryBadgeMeta: Record<
  NotificationCategory,
  { label: string; className: string }
> = {
  attendance: {
    label: "Attendance",
    className:
      "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-400/10 dark:text-blue-200",
  },
  schedule: {
    label: "Schedule",
    className:
      "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-400/10 dark:text-purple-200",
  },
  leaves: {
    label: "Leave",
    className:
      "bg-green-50 text-green-800 border-green-200 dark:bg-green-400/10 dark:text-green-200",
  },
  invites: {
    label: "Invites",
    className:
      "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-400/10 dark:text-orange-200",
  },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<NotificationFilter>("all");
  const { data: apiNotifications = [], isLoading } = useNotifications(50);

  // Create a stable reference key from apiNotifications to avoid infinite loops
  const apiNotificationsKey = useMemo(() => {
    return JSON.stringify(apiNotifications.map(n => ({
      id: n.id,
      type: n.type,
      timestamp: n.timestamp,
    })));
  }, [apiNotifications]);

  // Transform API notifications to UI notifications
  const transformedNotifications = useMemo(() => {
    return apiNotifications.map((apiNotif, index) => {
      const relativeTime = formatRelativeTime(apiNotif.timestamp);

      let sender = "System";
      let subject = "";
      let snippet = "";
      let category: NotificationCategory = "attendance";

      if (apiNotif.type === 'attendance') {
        const checkInTime = formatTime(apiNotif.data?.checkInTime || apiNotif.timestamp);
        const lateText = apiNotif.lateMinutes && apiNotif.lateMinutes > 0
          ? ` (${apiNotif.lateMinutes} min late)`
          : '';
        subject = "New attendance record";
        snippet = `${apiNotif.memberName} checked in at ${checkInTime}${lateText}`;
        category = "attendance";
      } else if (apiNotif.type === 'leaves') {
        if (apiNotif.action === 'approved') {
          subject = "Leave approval";
          snippet = `${apiNotif.memberName}'s ${apiNotif.data?.leaveType || 'annual'} leave was approved`;
        } else if (apiNotif.action === 'rejected') {
          subject = "Leave rejection";
          snippet = `${apiNotif.memberName}'s ${apiNotif.data?.leaveType || 'leave'} request was rejected`;
        } else {
          subject = "Leave request";
          snippet = `${apiNotif.memberName} requested ${apiNotif.data?.totalDays || 1} day(s) of ${apiNotif.data?.leaveType || 'leave'}`;
        }
        category = "leaves";
      } else if (apiNotif.type === 'schedule') {
        subject = "Shift swap request";
        snippet = `${apiNotif.memberName} requested to swap shift`;
        category = "schedule";
      } else if (apiNotif.type === "invites") {
        const recipients =
          apiNotif.data?.recipients && apiNotif.data.recipients.length
            ? apiNotif.data.recipients
            : [apiNotif.memberName];
        const statusLabel = apiNotif.status === "accepted" ? "accepted" : "sent";
        sender = apiNotif.data?.inviterName || "System";
        subject = statusLabel === "accepted" ? "Invitation accepted" : "Invitation sent";
        snippet =
          statusLabel === "accepted"
            ? `${recipients.join(", ")} accepted the invitation`
            : `${recipients.join(", ")} received an invitation`;
        category = "invites";
      }

      return {
        id: index + 1,
        sender,
        subject,
        snippet,
        date: relativeTime,
        category,
        unread: true,
        selected: false,
        recipients: apiNotif.data?.recipients,
      };
    });
  }, [apiNotifications]);

  // Update notifications only when the actual content changes (using stable key)
  useEffect(() => {
    setNotifications((prev) => {
      // Preserve selection state when updating
      const selectionMap = new Map(prev.map(n => [n.id, n.selected]));
      return transformedNotifications.map(notif => ({
        ...notif,
        selected: selectionMap.get(notif.id) ?? false,
      }));
    });
  }, [apiNotificationsKey, transformedNotifications]);

  const filteredNotifications = useMemo(() => {
    if (activeCategory === "all") return notifications;
    return notifications.filter((notification) => notification.category === activeCategory);
  }, [activeCategory, notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.unread).length,
    [notifications],
  );

  const selectedCount = useMemo(
    () => filteredNotifications.filter((notification) => notification.selected).length,
    [filteredNotifications],
  );

  const selectAllState: CheckedState =
    filteredNotifications.length === 0
      ? false
      : filteredNotifications.every((notification) => notification.selected)
        ? true
        : filteredNotifications.some((notification) => notification.selected)
          ? "indeterminate"
          : false;

  const toggleSelection = (id: number, checked: CheckedState) => {
    const isChecked = checked === true;
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, selected: isChecked } : notification,
      ),
    );
  };

  const toggleSelectAll = (checked: CheckedState) => {
    const isChecked = checked === true;
    setNotifications((prev) =>
      prev.map((notification) =>
        activeCategory === "all" || notification.category === activeCategory
          ? { ...notification, selected: isChecked }
          : notification,
      ),
    );
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1 px-4 pt-6 sm:px-6 lg:px-10">
        <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          View every alert sent to your organization in a Gmail-inspired layout.
        </p>
      </div>

      <Card className="rounded-none border-x-0 shadow-sm sm:rounded-2xl sm:border sm:mx-4 lg:mx-10">
        <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectAllState}
              onCheckedChange={toggleSelectAll}
              className="size-4"
            />
            <span>{selectedCount > 0 ? `${selectedCount} selected` : "Select"}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{notifications.length}</span>
            <span>total</span>
            <span className="text-muted-foreground">•</span>
            <span className="font-medium text-foreground">{unreadCount}</span>
            <span>unread</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b px-4 py-3">
          {categoryTabs.map((tab) => (
            <Button
              key={tab.value}
              size="sm"
              variant={tab.value === activeCategory ? "secondary" : "ghost"}
              className={cn(
                "rounded-full px-4 text-xs font-medium",
                tab.value === activeCategory && "shadow-sm",
              )}
              onClick={() => setActiveCategory(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="divide-y">
          {isLoading ? (
            <div className="space-y-4 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4 shrink-0" />
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                  <Skeleton className="h-3 w-20 shrink-0" />
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No notifications in this category yet.
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-center gap-4 px-4 py-4 text-sm transition-colors hover:bg-muted/40",
                  notification.unread && "bg-muted/40 font-medium shadow-[inset_0_1px_0_var(--border)]",
                )}
              >
                <Checkbox
                  checked={notification.selected}
                  onCheckedChange={(value) => toggleSelection(notification.id, value)}
                  className="size-4 shrink-0"
                />
                <Avatar>
                  <AvatarFallback className="text-xs font-semibold uppercase">
                    {notification.sender.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold">{notification.sender}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-medium uppercase tracking-wide",
                        categoryBadgeMeta[notification.category]?.className,
                      )}
                    >
                      {categoryBadgeMeta[notification.category]?.label}
                    </Badge>
                  </div>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span className="truncate text-foreground">{notification.subject}</span>
                    <span className="text-muted-foreground">— {notification.snippet}</span>
                  </p>
                  {notification.recipients && notification.recipients.length > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">Recipients:</span>{" "}
                      {notification.recipients.join(", ")}
                    </p>
                  )}
                </div>

                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {notification.date}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>

    </div>
  );
}
