import { useEffect, useCallback, useRef } from 'react';

// Notification sound (base64 encoded short beep)
const NOTIFICATION_SOUND_URL = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleSlurA==';

interface NotificationOptions {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    onClick?: () => void;
}

export function useNotifications() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const permissionRef = useRef<NotificationPermission>('default');

    // Initialize audio element
    useEffect(() => {
        audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
        audioRef.current.volume = 0.5;

        // Check current permission
        if ('Notification' in window) {
            permissionRef.current = Notification.permission;
        }
    }, []);

    // Request permission
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            permissionRef.current = 'granted';
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            permissionRef.current = permission;
            return permission === 'granted';
        }

        return false;
    }, []);

    // Check if notifications are enabled
    const isEnabled = useCallback((): boolean => {
        return 'Notification' in window && Notification.permission === 'granted';
    }, []);

    // Play notification sound
    const playSound = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(err => {
                console.warn('Could not play notification sound:', err);
            });
        }
    }, []);

    // Show notification
    const showNotification = useCallback((options: NotificationOptions) => {
        console.log('🔔 showNotification called:', options);

        // Play sound always (unless page is focused and we want silence)
        playSound();

        // Show browser notification if permitted
        if (isEnabled()) {
            console.log('🔔 Creating browser notification...');
            try {
                const notification = new Notification(options.title, {
                    body: options.body,
                    icon: options.icon || '/vite.svg',
                    tag: options.tag || 'nobre-hub-notification',
                    requireInteraction: false,
                    silent: true // We handle sound ourselves
                });

                if (options.onClick) {
                    notification.onclick = () => {
                        window.focus();
                        options.onClick?.();
                        notification.close();
                    };
                }

                // Auto-close after 5 seconds
                setTimeout(() => notification.close(), 5000);
                console.log('🔔 Notification created successfully');
            } catch (err) {
                console.error('🔔 Failed to create notification:', err);
            }
        } else {
            console.log('🔔 Notifications not enabled, skipping browser notification');
        }
    }, [isEnabled, playSound]);

    // Show message notification (convenience method)
    const notifyNewMessage = useCallback((senderName: string, messagePreview: string, conversationId?: string) => {
        showNotification({
            title: `Nova mensagem de ${senderName}`,
            body: messagePreview.length > 50 ? messagePreview.substring(0, 50) + '...' : messagePreview,
            tag: `message-${conversationId || 'new'}`,
            onClick: () => {
                // Could navigate to conversation here
                console.log('Notification clicked, conversation:', conversationId);
            }
        });
    }, [showNotification]);

    return {
        requestPermission,
        isEnabled,
        showNotification,
        notifyNewMessage,
        playSound
    };
}

export default useNotifications;
