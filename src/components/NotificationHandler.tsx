import React, { useEffect, useRef } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { useNotifications } from '../hooks/useNotifications';

/**
 * Global notification handler component.
 * Listens to socket events and triggers browser notifications for incoming messages.
 * Should be placed inside SocketProvider but outside main content.
 */
const NotificationHandler: React.FC = () => {
    const { subscribeToLeadUpdates, subscribeToNewLeads, isConnected } = useFirebase();
    const { requestPermission, notifyNewMessage } = useNotifications();
    const hasRequestedPermission = useRef(false);

    // Request notification permission on first render
    useEffect(() => {
        if (!hasRequestedPermission.current) {
            hasRequestedPermission.current = true;
            requestPermission().then(granted => {
            });
        }
    }, [requestPermission]);

    // Subscribe to lead updates (fired when ANY message arrives for a lead)
    useEffect(() => {
        if (!isConnected) {
            return;
        }


        // New lead = new conversation from unknown contact
        const unsubscribeNewLead = subscribeToNewLeads((lead: any) => {
            notifyNewMessage(lead.name || 'Novo contato', lead.contactReason || 'Nova mensagem', lead.id);
        });

        // Lead updated = new message on existing lead
        const unsubscribeLeadUpdated = subscribeToLeadUpdates((lead: any) => {

            // Only notify for incoming messages (from client)
            if (lead.lastMessageFrom === 'in') {
                notifyNewMessage(
                    lead.name || 'Cliente',
                    lead.lastMessage || lead.contactReason || 'Nova mensagem',
                    lead.id
                );
            } else {
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

