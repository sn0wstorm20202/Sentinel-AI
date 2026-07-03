import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical';

export type NotificationCategory =
  | 'case'
  | 'risk'
  | 'mlops'
  | 'assignment'
  | 'recommendation'
  | 'system';

export interface SentinelNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  createdAt: string;
  read: boolean;
  caseId?: string;
}

interface NotificationState {
  notifications: SentinelNotification[];
  addNotification: (notification: Omit<SentinelNotification, 'id' | 'createdAt' | 'read'> & Partial<Pick<SentinelNotification, 'id' | 'createdAt' | 'read'>>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearRead: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (notification) =>
        set((state) => {
          const id = notification.id ?? `${notification.category}-${Date.now()}`;
          if (state.notifications.some((item) => item.id === id)) {
            return state;
          }

          return {
            notifications: [
              {
                ...notification,
                id,
                createdAt: notification.createdAt ?? new Date().toISOString(),
                read: notification.read ?? false,
              },
              ...state.notifications,
            ].slice(0, 80),
          };
        }),
      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === id ? { ...item, read: true } : item
          ),
        })),
      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((item) => ({ ...item, read: true })),
        })),
      clearRead: () =>
        set((state) => ({
          notifications: state.notifications.filter((item) => !item.read),
        })),
    }),
    {
      name: 'sentinel-notifications',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
