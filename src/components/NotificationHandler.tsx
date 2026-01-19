import React, { useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useNotifications } from '../hooks/useNotifications';

/**
 * Global notification handler component.
 * Listens to socket events and triggers browser notifications for incoming messages.
 * Should be placed inside SocketProvider but outside main content.
 */
const NotificationHandler: React.FC = () => {
    const { subscribeToNewConversations, subscribeToConversationUpdates, isConnected } = useSocket();
    const { requestPermission, notifyNewMessage, isEnabled } = useNotifications();
    const hasRequestedPermission = useRef(false);

    // Request notification permission on first render
    useEffect(() => {
        if (!hasRequestedPermission.current) {
            hasRequestedPermission.current = true;
            requestPermission().then(granted => {
                console.log('🔔 Notification permission:', granted ? 'granted' : 'denied');
            });
        }
    }, [requestPermission]);

    // Subscribe to new conversations (new incoming messages from unknown contacts)
    useEffect(() => {
        if (!isConnected) return;

        const unsubscribeNew = subscribeToNewConversations((conversation: any) => {
            console.log('🔔 New conversation notification trigger:', conversation);

            const leadName = conversation.lead?.name || 'Novo contato';
            const lastMessage = conversation.messages?.[0]?.text || 'Nova conversa iniciada';

            notifyNewMessage(leadName, lastMessage, conversation.id);
        });

        const unsubscribeUpdated = subscribeToConversationUpdates((conversation: any) => {
            console.log('🔔 Conversation updated notification check:', conversation);

            // Only notify for incoming messages (direction: 'in')
            const lastMessage = conversation.messages?.[0];
            if (lastMessage?.direction === 'in') {
                const leadName = conversation.lead?.name || 'Cliente';
                const messageText = lastMessage.text || '[Mídia]';

                notifyNewMessage(leadName, messageText, conversation.id);
            }
        });

        return () => {
            unsubscribeNew();
            unsubscribeUpdated();
        };
    }, [isConnected, subscribeToNewConversations, subscribeToConversationUpdates, notifyNewMessage]);

    // This component doesn't render anything
    return null;
};

export default NotificationHandler;
