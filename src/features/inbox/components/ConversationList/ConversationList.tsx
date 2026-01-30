/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONVERSATION LIST (REFACTORED)
 * Lista de conversas com filtros e busca
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { useInboxStore } from '../../stores/useInboxStore';
import { ConversationItem } from './ConversationItem';
import { Input } from '@/design-system';
import { Search, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import styles from './ConversationList.module.css';

type StatusFilter = 'all' | 'open' | 'closed' | 'unread';

export const ConversationList: React.FC = () => {
    const {
        conversations,
        selectedConversationId,
        filters,
        selectConversation,
        setFilter
    } = useInboxStore();

    const [tempSearch, setTempSearch] = useState(filters.query);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setTempSearch(query);
        setFilter({ query });
    };

    const handleStatusFilter = (status: StatusFilter) => {
        setStatusFilter(status);
        if (status === 'unread') {
            setFilter({ status: 'unread' });
        } else {
            setFilter({ status: 'all' });
        }
    };

    const filteredConversations = conversations.filter(c => {
        // Filter by Status
        if (statusFilter === 'unread' && c.unreadCount === 0) return false;
        if (statusFilter === 'open' && c.status === 'closed') return false;
        if (statusFilter === 'closed' && c.status !== 'closed') return false;

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

    // Count by status
    const openCount = conversations.filter(c => c.status !== 'closed').length;
    const unreadCount = conversations.filter(c => c.unreadCount > 0).length;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <h2 className={styles.title}>
                        <MessageSquare size={20} />
                        Inbox
                    </h2>
                    <span className={styles.counter}>{conversations.length}</span>
                </div>
            </div>

            {/* Search */}
            <div className={styles.search}>
                <div className={styles.inputWrapper}>
                    <Input
                        placeholder="Buscar conversa..."
                        value={tempSearch}
                        onChange={handleSearch}
                        leftIcon={<Search size={16} />}
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className={styles.filterTabs}>
                <button
                    className={`${styles.filterTab} ${statusFilter === 'all' ? styles.active : ''}`}
                    onClick={() => handleStatusFilter('all')}
                >
                    Todas
                </button>
                <button
                    className={`${styles.filterTab} ${statusFilter === 'open' ? styles.active : ''}`}
                    onClick={() => handleStatusFilter('open')}
                >
                    <Clock size={14} />
                    Abertas
                    {openCount > 0 && <span className={styles.filterCount}>{openCount}</span>}
                </button>
                <button
                    className={`${styles.filterTab} ${statusFilter === 'unread' ? styles.active : ''}`}
                    onClick={() => handleStatusFilter('unread')}
                >
                    Não lidas
                    {unreadCount > 0 && <span className={styles.filterCount}>{unreadCount}</span>}
                </button>
                <button
                    className={`${styles.filterTab} ${statusFilter === 'closed' ? styles.active : ''}`}
                    onClick={() => handleStatusFilter('closed')}
                >
                    <CheckCircle size={14} />
                    Fechadas
                </button>
            </div>

            {/* Conversation List */}
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
                        <MessageSquare size={32} strokeWidth={1.5} />
                        <span>Nenhuma conversa encontrada</span>
                    </div>
                )}
            </div>
        </div>
    );
};
