/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - ADVANCED FILTERS MODAL
 * Modal expandido com filtros avançados seguindo análise do Clint CRM
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { useContactsStore } from '../../stores/useContactsStore';
import { Modal, Button, Dropdown } from '@/design-system';
import styles from './AdvancedFiltersModal.module.css';

interface AdvancedFiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ResponsavelFilter = 'todos' | 'com' | 'sem';
type TelefoneFilter = 'todos' | 'com' | 'sem';

export const AdvancedFiltersModal: React.FC<AdvancedFiltersModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { filters, setFilter, clearFilters } = useContactsStore();

    // State local para controlar seleção (já que o store não tem flag específica para 'com responsável')
    const [responsavelFilter, setResponsavelFilter] = React.useState<ResponsavelFilter>('todos');
    const [telefoneFilter, setTelefoneFilter] = React.useState<TelefoneFilter>(
        filters.comTelefone ? 'com' : filters.semTelefone ? 'sem' : 'todos'
    );

    const handleResponsavelChange = (value: ResponsavelFilter) => {
        setResponsavelFilter(value);
        // Atualiza o store
        setFilter('semDono', value === 'sem');
        // Nota: 'com' poderia filtrar por comDono !== undefined futuramente
    };

    const handleTelefoneChange = (value: TelefoneFilter) => {
        setTelefoneFilter(value);
        setFilter('comTelefone', value === 'com');
        setFilter('semTelefone', value === 'sem');
    };

    const handleApply = () => {
        onClose();
    };

    const handleClear = () => {
        clearFilters();
    };

    // Opções para os dropdowns
    const origemOptions = [
        { label: 'Todas as origens', value: '' },
        { label: 'Landing Page', value: 'landing-page' },
        { label: 'WhatsApp', value: 'whatsapp' },
        { label: 'Instagram', value: 'instagram' },
        { label: 'Indicação', value: 'indicacao' },
    ];

    const etapaOptions = [
        { label: 'Todas as etapas', value: '' },
        { label: 'Novo', value: 'novo' },
        { label: 'Qualificado', value: 'qualificado' },
        { label: 'Proposta', value: 'proposta' },
        { label: 'Negociação', value: 'negociacao' },
        { label: 'Fechamento', value: 'fechamento' },
    ];

    const statusOptions = [
        { label: 'Todos os status', value: '' },
        { label: 'Aberto', value: 'aberto' },
        { label: 'Ganho', value: 'ganho' },
        { label: 'Perdido', value: 'perdido' },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Mais Filtros"
            size="md"
        >
            <div className={styles.content}>
                {/* Data de Criação */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Filtrar por data de criação</h3>
                    <div className={styles.dateRange}>
                        <div className={styles.dateInput}>
                            <label>De</label>
                            <input
                                type="date"
                                value={filters.dataInicio?.toISOString().split('T')[0] || ''}
                                onChange={(e) => setFilter('dataInicio', e.target.value ? new Date(e.target.value) : undefined)}
                            />
                        </div>
                        <div className={styles.dateInput}>
                            <label>Até</label>
                            <input
                                type="date"
                                value={filters.dataFim?.toISOString().split('T')[0] || ''}
                                onChange={(e) => setFilter('dataFim', e.target.value ? new Date(e.target.value) : undefined)}
                            />
                        </div>
                    </div>
                </div>

                {/* Negócio */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Negócio</h3>

                    <div className={styles.filterRow}>
                        <label>Origem do negócio</label>
                        <Dropdown
                            options={origemOptions}
                            value={filters.comNegocioOrigem || ''}
                            onChange={(value) => setFilter('comNegocioOrigem', value as string || undefined)}
                            placeholder="Todas as origens"
                        />
                    </div>

                    <div className={styles.filterRow}>
                        <label>Etapa do negócio</label>
                        <Dropdown
                            options={etapaOptions}
                            value={filters.comNegocioEtapa || ''}
                            onChange={(value) => setFilter('comNegocioEtapa', value as string || undefined)}
                            placeholder="Todas as etapas"
                        />
                    </div>

                    <div className={styles.filterRow}>
                        <label>Status do negócio</label>
                        <Dropdown
                            options={statusOptions}
                            value={filters.comNegocioStatus || ''}
                            onChange={(value) => setFilter('comNegocioStatus', (value as 'ganho' | 'perdido' | 'aberto') || undefined)}
                            placeholder="Todos os status"
                        />
                    </div>
                </div>

                {/* Responsável - Segmented Control */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Responsável</h3>
                    <div className={styles.segmentedControl}>
                        <button
                            type="button"
                            className={`${styles.segmentButton} ${responsavelFilter === 'todos' ? styles.active : ''}`}
                            onClick={() => handleResponsavelChange('todos')}
                        >
                            Todos
                        </button>
                        <button
                            type="button"
                            className={`${styles.segmentButton} ${responsavelFilter === 'com' ? styles.active : ''}`}
                            onClick={() => handleResponsavelChange('com')}
                        >
                            Com responsável
                        </button>
                        <button
                            type="button"
                            className={`${styles.segmentButton} ${responsavelFilter === 'sem' ? styles.active : ''}`}
                            onClick={() => handleResponsavelChange('sem')}
                        >
                            Sem responsável
                        </button>
                    </div>
                </div>

                {/* Telefone - Segmented Control */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Telefone</h3>
                    <div className={styles.segmentedControl}>
                        <button
                            type="button"
                            className={`${styles.segmentButton} ${telefoneFilter === 'todos' ? styles.active : ''}`}
                            onClick={() => handleTelefoneChange('todos')}
                        >
                            Todos
                        </button>
                        <button
                            type="button"
                            className={`${styles.segmentButton} ${telefoneFilter === 'com' ? styles.active : ''}`}
                            onClick={() => handleTelefoneChange('com')}
                        >
                            Com telefone
                        </button>
                        <button
                            type="button"
                            className={`${styles.segmentButton} ${telefoneFilter === 'sem' ? styles.active : ''}`}
                            onClick={() => handleTelefoneChange('sem')}
                        >
                            Sem telefone
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
                <Button variant="ghost" onClick={handleClear}>
                    Limpar tudo
                </Button>
                <Button variant="primary" onClick={handleApply}>
                    Aplicar filtros
                </Button>
            </div>
        </Modal>
    );
};
