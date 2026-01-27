// useRealtimeNotifications - Firebase Realtime DB hook for instant notifications
// Replaces Socket.io notification events

import { useEffect, useState, useCallback } from 'react';
import { ref, onValue, set, push, remove } from '../lib/firebase';
import { realtimeDb } from '../lib/firebase';

export interface RealtimeNotification {
    id: string;
    type: 'new_message' | 'new_lead' | 'assignment' | 'mention' | 'system';
    title: string;
    body: string;
    conversationId?: string;
    leadId?: string;
    read: boolean;
    timestamp: number;
}

/**
 * Hook to listen for and manage notifications for a user
 */
export function useRealtimeNotifications(userId: string | null) {
    const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!userId) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        console.log(`🔥 Firebase: Subscribing to notifications for user ${userId}`);

        const notificationsRef = ref(realtimeDb, `notifications/${userId}`);

        const unsubscribe = onValue(notificationsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const notificationsList: RealtimeNotification[] = Object.entries(data)
                    .map(([id, notif]: [string, any]) => ({
                        id,
                        ...notif
                    }))
                    .sort((a, b) => b.timestamp - a.timestamp);

                setNotifications(notificationsList);
                setUnreadCount(notificationsList.filter(n => !n.read).length);
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }
        });

        return () => {
            console.log(`🔥 Firebase: Unsubscribing from notifications for user ${userId}`);
            unsubscribe();
        };
    }, [userId]);

    // Mark a notification as read
    const markAsRead = useCallback((notificationId: string) => {
        if (!userId) return;

        const notifRef = ref(realtimeDb, `notifications/${userId}/${notificationId}/read`);
        set(notifRef, true);
    }, [userId]);

    // Mark all notifications as read
    const markAllAsRead = useCallback(() => {
        if (!userId) return;

        notifications.forEach(notif => {
            if (!notif.read) {
                const notifRef = ref(realtimeDb, `notifications/${userId}/${notif.id}/read`);
                set(notifRef, true);
            }
        });
    }, [userId, notifications]);

    // Delete a notification
    const deleteNotification = useCallback((notificationId: string) => {
        if (!userId) return;

        const notifRef = ref(realtimeDb, `notifications/${userId}/${notificationId}`);
        remove(notifRef);
    }, [userId]);

    // Clear all notifications
    const clearAll = useCallback(() => {
        if (!userId) return;

        const notificationsRef = ref(realtimeDb, `notifications/${userId}`);
        remove(notificationsRef);
    }, [userId]);

    return {
        notifications,
        unreadCount,
        hasUnread: unreadCount > 0,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll
    };
}
