'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Bell, CheckCheck, Filter, HeartPulse, Inbox, ShieldAlert, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLayoutStore } from '@/store/layout-store';
import {
  NotificationCategory,
  SentinelNotification,
  useNotificationStore,
} from '@/store/notification-store';
import { cn } from '@/lib/utils';

const filters: Array<NotificationCategory | 'all' | 'unread'> = [
  'all',
  'unread',
  'case',
  'risk',
  'mlops',
  'assignment',
  'recommendation',
  'system',
];

const severityStyles: Record<SentinelNotification['severity'], string> = {
  info: 'text-muted-foreground border-border bg-muted/30',
  success: 'text-emerald-600 border-emerald-500/30 bg-emerald-500/10',
  warning: 'text-amber-600 border-amber-500/30 bg-amber-500/10',
  critical: 'text-destructive border-destructive/30 bg-destructive/10',
};

function NotificationIcon({ notification }: { notification: SentinelNotification }) {
  if (notification.category === 'mlops') return <HeartPulse className="h-4 w-4" />;
  if (notification.severity === 'critical') return <ShieldAlert className="h-4 w-4" />;
  if (notification.severity === 'warning') return <AlertTriangle className="h-4 w-4" />;
  return <Bell className="h-4 w-4" />;
}

export function NotificationCenter() {
  const open = useLayoutStore((state) => state.notificationCenterOpen);
  const setOpen = useLayoutStore((state) => state.setNotificationCenterOpen);
  const notifications = useNotificationStore((state) => state.notifications);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const clearRead = useNotificationStore((state) => state.clearRead);
  const [filter, setFilter] = useState<(typeof filters)[number]>('all');

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter((item) => !item.read);
    return notifications.filter((item) => item.category === filter);
  }, [filter, notifications]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-full max-w-md gap-0 p-0 sm:max-w-md" aria-describedby="notification-center-description">
        <SheetHeader className="border-b">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notification Center
              </SheetTitle>
              <SheetDescription id="notification-center-description">
                Real-time operational events from Sentinel backend streams.
              </SheetDescription>
            </div>
            {unreadCount > 0 && (
              <Badge variant="destructive">
                {unreadCount} unread
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="flex flex-wrap gap-1">
            {filters.map((item) => (
              <Button
                key={item}
                variant={filter === item ? 'default' : 'ghost'}
                size="xs"
                onClick={() => setFilter(item)}
                className="capitalize"
              >
                {item}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-b bg-muted/20 px-3 py-2">
          <Button variant="ghost" size="xs" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="h-3 w-3" />
            Mark read
          </Button>
          <Button variant="ghost" size="xs" onClick={clearRead}>
            <X className="h-3 w-3" />
            Clear read
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length > 0 ? (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => markRead(notification.id)}
                  className={cn(
                    'flex w-full gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50',
                    !notification.read && 'bg-muted/25'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
                      severityStyles[notification.severity]
                    )}
                  >
                    <NotificationIcon notification={notification} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{notification.title}</span>
                      {!notification.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {notification.message}
                    </span>
                    <span className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <span>{notification.category}</span>
                      <span>{new Date(notification.createdAt).toLocaleString()}</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-80 flex-col items-center justify-center gap-3 px-8 text-center text-muted-foreground">
              <Inbox className="h-8 w-8" />
              <div>
                <p className="text-sm font-medium text-foreground">No notifications</p>
                <p className="mt-1 text-xs">
                  Alerts will appear here as the backend stream emits cases, drift, assignments, recommendations, and health events.
                </p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
