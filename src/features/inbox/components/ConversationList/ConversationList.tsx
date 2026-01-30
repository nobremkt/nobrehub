import React, { useState } from 'react';
import { useInboxStore } from '../../stores/useInboxStore';
import { ConversationItem } from './ConversationItem';
import { Input, Button } from '@/design-system';
import { Search, Filter } from 'lucide-react';
import styles from './ConversationList.module.css';

export const ConversationList: React.FC = () => {
    const {
        conversations,
        selectedConversationId,
        filters,
        selectConversation,
        setFilter
    } = useInboxStore();

    const [tempSearch, setTempSearch] = useState(filters.query);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setTempSearch(query);
        setFilter({ query });
    };

    const toggleUnreadFilter = () => {
        setFilter({
            status: filters.status === 'unread' ? 'all' : 'unread'
        });
    };

    const filteredConversations = conversations.filter(c => {
        // Filter by Status
        if (filters.status === 'unread' && c.unreadCount === 0) return false;

        // Filter by Query
        if (filters.query) {
            const q = filters.query.toLowerCase();
            return (
                c.leadName.toLowerCase().includes(q) ||
                c.leadPhone.includes(q)
            );
        }

        return true;
    });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Inbox</h2>
                <div className={styles.actions}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleUnreadFilter}
                        className={filters.status === 'unread' ? styles.filterActive : ''}
                        leftIcon={<Filter size={16} />}
                    >
                        Não lidos
                    </Button>
                </div>
            </div>

            <div className={styles.search}>
                <div className={styles.inputWrapper}>
                    <Input
                        placeholder="Buscar..."
                        value={tempSearch}
                        onChange={handleSearch}
                        leftIcon={<Search size={16} />}
                    />
                </div>
            </div>

            <div className={styles.list}>
                {filteredConversations.length > 0 ? (
                    filteredConversations.map(conv => (
                        <ConversationItem
                            key={conv.id}
                            conversation={conv}
                            isActive={selectedConversationId === conv.id}
                            onClick={() => selectConversation(conv.id)}
                        />
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        Nenhuma conversa encontrada
                    </div>
                )}
            </div>
        </div>
    );
};
