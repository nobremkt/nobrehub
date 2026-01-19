import React, { useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useNotifications } from '../hooks/useNotifications';

/**
 * Global notification handler component.
 * Listens to socket events and triggers browser notifications for incoming messages.
 * Should be placed inside SocketProvider but outside main content.
 */
const NotificationHandler: React.FC = () => {
    const { subscribeToLeadUpdates, subscribeToNewLeads, isConnected } = useSocket();
    const { requestPermission, notifyNewMessage } = useNotifications();
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

    // Subscribe to lead updates (fired when ANY message arrives for a lead)
    useEffect(() => {
        if (!isConnected) {
            console.log('🔔 NotificationHandler: Not connected yet');
            return;
        }

        console.log('🔔 NotificationHandler: Setting up listeners...');

        // New lead = new conversation from unknown contact
        const unsubscribeNewLead = subscribeToNewLeads((lead: any) => {
            console.log('🔔 NEW LEAD notification:', lead);
            notifyNewMessage(lead.name || 'Novo contato', lead.contactReason || 'Nova mensagem', lead.id);
        });

        // Lead updated = new message on existing lead (check if incoming)
        const unsubscribeLeadUpdated = subscribeToLeadUpdates((lead: any) => {
            console.log('🔔 LEAD UPDATED notification check:', lead);

            // Only notify for incoming messages
            if (lead.lastMessageFrom === 'in') {
                notifyNewMessage(
                    lead.name || 'Cliente',
                    lead.lastMessage || 'Nova mensagem',
                    lead.id
                );
            }
        });

        return () => {
            unsubscribeNewLead();
            unsubscribeLeadUpdated();
        };
    }, [isConnected, subscribeToNewLeads, subscribeToLeadUpdates, notifyNewMessage]);

    // This component doesn't render anything
    return null;
};

export default NotificationHandler;

