/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - POST SALES SIDEBAR
 * ═══════════════════════════════════════════════════════════════════════════════
 * Lista de atendentes de pós-vendas com contagem de clientes por status
 * Similar à ProducersSidebar de Produção
 */

import { useEffect, useMemo, useState } from 'react';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useSectorStore } from '@/features/settings/stores/useSectorStore';
import { usePostSalesStore } from '../stores/usePostSalesStore';
import { PostSalesClientService } from '../services/PostSalesClientService';
import { Input, Spinner } from '@/design-system';
import { Search, User, Clock, CheckCircle, AlertTriangle, CreditCard } from 'lucide-react';
import styles from './PostSalesSidebar.module.css';

interface PostSalesStats {
    aguardando_projeto: number;
    aguardando_alteracao: number;
    entregue: number;
    aguardando_pagamento: number;
    total: number;
}

export const PostSalesSidebar = () => {
    const { collaborators, fetchCollaborators, isLoading } = useCollaboratorStore();
    const { sectors, fetchSectors } = useSectorStore();
    const { selectedPostSalesId, setSelectedPostSalesId } = usePostSalesStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [teamStats, setTeamStats] = useState<Record<string, PostSalesStats>>({});

    // Encontra o setor de pós-vendas
    const postSalesSectorId = useMemo(() => {
        const sector = sectors.find(s =>
            s.name.toLowerCase().includes('pós-venda') ||
            s.name.toLowerCase().includes('pos-venda') ||
            s.name.toLowerCase() === 'post-sales'
        );
        return sector?.id;
    }, [sectors]);

    // Lista de atendentes de pós-vendas
    const postSalesTeam = useMemo(() => {
        if (!postSalesSectorId) return [];
        return collaborators.filter(c => c.sectorId === postSalesSectorId && c.active);
    }, [collaborators, postSalesSectorId]);

    // Filtra por busca
    const filteredTeam = useMemo(() => {
        if (!searchTerm) return postSalesTeam;
        const lower = searchTerm.toLowerCase();
        return postSalesTeam.filter(p =>
            p.name.toLowerCase().includes(lower) ||
            p.email?.toLowerCase().includes(lower)
        );
    }, [postSalesTeam, searchTerm]);

    // Estatísticas por atendente (U3: usa dados reais do Supabase)
    const getStats = (attendantId: string): PostSalesStats => {
        return teamStats[attendantId] || {
            aguardando_projeto: 0,
            aguardando_alteracao: 0,
            entregue: 0,
            aguardando_pagamento: 0,
            total: 0
        };
    };

    // Gera iniciais do nome
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    // Carrega dados iniciais
    useEffect(() => {
        if (collaborators.length === 0) fetchCollaborators();
        if (sectors.length === 0) fetchSectors();
    }, [fetchCollaborators, fetchSectors, collaborators.length, sectors.length]);

    // U3: Fetch real stats for all team members from Supabase
    useEffect(() => {
        if (postSalesTeam.length === 0) return;
        const ids = postSalesTeam.map(m => m.id);
        PostSalesClientService.getClientCountsForTeam(ids).then(setTeamStats);
    }, [postSalesTeam]);

    if (isLoading) {
        return (
            <div className={styles.sidebar}>
                <div className={styles.loading}>
                    <Spinner size="md" />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.sidebar}>
            {/* Search */}
            <div className={styles.searchWrapper}>
                <Input
                    placeholder="Buscar atendente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search size={16} />}
                    fullWidth
                />
            </div>

            {/* Team List */}
            <div className={styles.list}>
                {filteredTeam.length === 0 ? (
                    <div className={styles.emptyState}>
                        <User size={32} />
                        <p>Nenhum atendente encontrado</p>
                    </div>
                ) : (
                    filteredTeam.map(member => {
                        const stats = getStats(member.id);
                        const isSelected = selectedPostSalesId === member.id;

                        return (
                            <div
                                key={member.id}
                                className={`${styles.memberCard} ${isSelected ? styles.selected : ''}`}
                                onClick={() => setSelectedPostSalesId(member.id)}
                            >
                                <div className={`${styles.avatar} ${isSelected ? styles.avatarSelected : ''}`}>
                                    {(member.profilePhotoUrl || member.photoUrl) ? (
                                        <img src={member.profilePhotoUrl || member.photoUrl} alt={member.name} className={styles.avatarImg} />
                                    ) : (
                                        getInitials(member.name)
                                    )}
                                </div>

                                <div className={styles.memberInfo}>
                                    <h4 className={styles.memberName}>{member.name}</h4>
                                    <div className={styles.statsRow}>
                                        <span className={styles.stat} title="Aguardando Vídeo">
                                            <Clock size={12} />
                                            {stats.aguardando_projeto}
                                        </span>
                                        <span className={styles.stat} title="Entregues">
                                            <CheckCircle size={12} />
                                            {stats.entregue}
                                        </span>
                                        <span className={styles.stat} title="Em Alteração">
                                            <AlertTriangle size={12} />
                                            {stats.aguardando_alteracao}
                                        </span>
                                        <span className={styles.stat} title="Aguardando Pagamento">
                                            <CreditCard size={12} />
                                            {stats.aguardando_pagamento}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.totalBadge}>
                                    {stats.total}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default PostSalesSidebar;
