import React, { useEffect } from 'react';
import { ConversationList } from '../components/ConversationList/ConversationList';
import { ChatView } from '../components/ChatView/ChatView';
import { LeadSidebar } from '../components/LeadSidebar/LeadSidebar';
import { AppLayout } from '@/design-system/layouts';
import { useInboxStore } from '../stores/useInboxStore';
import { InboxService } from '../services/InboxService';
import styles from './InboxPage.module.css';

import { DevToolbar } from '../components/DevToolbar';

export const InboxPage: React.FC = () => {
    const { init } = useInboxStore();

    useEffect(() => {
        init();
    }, [init]);

    return (
        <AppLayout fullWidth>
            <div className={styles.container}>
                <div className={styles.conversationListWrapper}>
                    <ConversationList />
                </div>

                <div className={styles.chatViewWrapper}>
                    <ChatView />
                </div>

                <div className={styles.sidebarWrapper}>
                    <LeadSidebar />
                </div>
            </div>
            <DevToolbar />
        </AppLayout>
    );
};
