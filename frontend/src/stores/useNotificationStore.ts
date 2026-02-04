import { create } from 'zustand';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: Date;
    read: boolean;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    unreadCount: 0,
    addNotification: (notif) => set((state) => {
        const newNotif: Notification = {
            ...notif,
            id: Math.random().toString(36).substring(7),
            timestamp: new Date(),
            read: false,
        };
        return {
            notifications: [newNotif, ...state.notifications].slice(0, 20), // Keep last 20
            unreadCount: state.unreadCount + 1,
        };
    }),
    markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
    })),
    markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
    })),
    clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));
