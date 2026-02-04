/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONVERSATION LIST (REFACTORED)
 * Lista de conversas com filtros por atribuição e busca
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useInboxStore } from '../../stores/useInboxStore';
import { ConversationItem } from './ConversationItem';
import { Input } from '@/design-system';
import { Search, MessageSquare, User, Users, Star } from 'lucide-react';
import styles from './ConversationList.module.css';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';

type AssignmentFilter = 'all' | 'mine' | 'unassigned';

export const ConversationList: React.FC = () => {
    const {
        conversations,
        selectedConversationId,
        filters,
        selectConversation,
        setFilter
    } = useInboxStore();

    const { user } = useAuthStore();
    const { collaborators, fetchCollaborators } = useCollaboratorStore();

    const [tempSearch, setTempSearch] = useState(filters.query);
    const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>('all');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    // Load collaborators on mount (needed to find current user's collaborator ID)
    useEffect(() => {
        if (collaborators.length === 0) {
            fetchCollaborators();
        }
    }, [fetchCollaborators]);

    // Find current user's collaborator ID (user.id is Firebase Auth UID, need to find matching collaborator)
    const currentCollaboratorId = useMemo(() => {
        if (!user?.id) return null;
        const currentCollaborator = collaborators.find(c => c.authUid === user.id);
        return currentCollaborator?.id || null;
    }, [user?.id, collaborators]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setTempSearch(query);
        setFilter({ query });
    };

    // Sort conversations: pinned first, then by updatedAt
    const sortedConversations = useMemo(() => {
        return [...conversations].sort((a, b) => {
            // Pinned items first
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;

            // Then by updatedAt (most recent first)
            const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : a.updatedAt;
            const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : b.updatedAt;
            return bTime - aTime;
        });
    }, [conversations]);

    const filteredConversations = useMemo(() => {
        return sortedConversations.filter(c => {
            // Filter by assignment
            if (assignmentFilter === 'mine') {
                if (!currentCollaboratorId || c.assignedTo !== currentCollaboratorId) return false;
            } else if (assignmentFilter === 'unassigned') {
                if (c.assignedTo) return false;
            }

            // Filter by favorites (overlay - applies on top of assignment filter)
            if (showFavoritesOnly && !c.isFavorite) return false;

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
    }, [sortedConversations, assignmentFilter, currentCollaboratorId, showFavoritesOnly, filters.query]);

    // Separate pinned from unpinned for visual division
    const pinnedConversations = useMemo(() => {
        return filteredConversations.filter(c => c.isPinned);
    }, [filteredConversations]);

    const unpinnedConversations = useMemo(() => {
        return filteredConversations.filter(c => !c.isPinned);
    }, [filteredConversations]);

    // Count by assignment
    const mineCount = useMemo(() => {
        if (!currentCollaboratorId) return 0;
        return conversations.filter(c => c.assignedTo === currentCollaboratorId).length;
    }, [conversations, currentCollaboratorId]);

    const unassignedCount = useMemo(() => {
        return conversations.filter(c => !c.assignedTo).length;
    }, [conversations]);

    // Total favorites count - for badge display
    const totalFavoritesCount = useMemo(() => {
        return conversations.filter(c => c.isFavorite).length;
    }, [conversations]);

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
                    className={`${styles.filterTab} ${assignmentFilter === 'all' ? styles.active : ''}`}
                    onClick={() => setAssignmentFilter('all')}
                >
                    Todos
                </button>
                <button
                    className={`${styles.filterTab} ${assignmentFilter === 'mine' ? styles.active : ''}`}
                    onClick={() => setAssignmentFilter('mine')}
                >
                    <User size={14} />
                    Meus
                    {mineCount > 0 && <span className={styles.filterCount}>{mineCount}</span>}
                </button>
                <button
                    className={`${styles.filterTab} ${assignmentFilter === 'unassigned' ? styles.active : ''}`}
                    onClick={() => setAssignmentFilter('unassigned')}
                    title="Conversas sem atribuição"
                >
                    <Users size={14} />
                    Novos
                    {unassignedCount > 0 && <span className={styles.filterCount}>{unassignedCount}</span>}
                </button>

                {/* Favorites Toggle - overlay filter, doesn't change assignment tab */}
                <button
                    className={`${styles.filterTab} ${styles.favoriteToggle} ${showFavoritesOnly ? styles.favoriteActive : ''}`}
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    title={showFavoritesOnly ? 'Mostrar todos' : 'Filtrar favoritos'}
                >
                    <Star size={14} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
                    {totalFavoritesCount > 0 && <span className={styles.filterCount}>{totalFavoritesCount}</span>}
                </button>
            </div>

            {/* Conversation List */}
            <div className={styles.list}>
                {filteredConversations.length > 0 ? (
                    <>
                        {/* Pinned Section */}
                        {pinnedConversations.length > 0 && (
                            <>
                                <div className={styles.sectionHeader}>
                                    📌 Fixados
                                </div>
                                {pinnedConversations.map(conv => (
                                    <ConversationItem
                                        key={conv.id}
                                        conversation={conv}
                                        isActive={selectedConversationId === conv.id}
                                        onClick={() => selectConversation(conv.id)}
                                    />
                                ))}
                                {unpinnedConversations.length > 0 && (
                                    <div className={styles.sectionDivider} />
                                )}
                            </>
                        )}

                        {/* Regular Section */}
                        {unpinnedConversations.map(conv => (
                            <ConversationItem
                                key={conv.id}
                                conversation={conv}
                                isActive={selectedConversationId === conv.id}
                                onClick={() => selectConversation(conv.id)}
                            />
                        ))}
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <MessageSquare size={32} strokeWidth={1.5} />
                        <span>
                            {showFavoritesOnly
                                ? 'Nenhum favorito encontrado'
                                : assignmentFilter === 'mine'
                                    ? 'Nenhuma conversa atribuída a você'
                                    : assignmentFilter === 'unassigned'
                                        ? 'Nenhuma conversa nova'
                                        : 'Nenhuma conversa encontrada'
                            }
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
