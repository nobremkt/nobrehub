/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - ADVANCED FILTERS MODAL
 * Painel de filtros avançados para operação CRM
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { useContactsStore } from '../../stores/useContactsStore';
import { Modal, Button, Checkbox } from '@/design-system';
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

    // Estados locais para segmented controls
    const [responsavelFilter, setResponsavelFilter] = React.useState<ResponsavelFilter>('todos');
    const [telefoneFilter, setTelefoneFilter] = React.useState<TelefoneFilter>('todos');

    React.useEffect(() => {
        setResponsavelFilter(filters.comDono ? 'com' : filters.semDono ? 'sem' : 'todos');
    }, [filters.comDono, filters.semDono]);

    React.useEffect(() => {
        setTelefoneFilter(filters.comTelefone ? 'com' : filters.semTelefone ? 'sem' : 'todos');
    }, [filters.comTelefone, filters.semTelefone]);

    const handleResponsavelChange = (value: ResponsavelFilter) => {
        setResponsavelFilter(value);
        setFilter('comDono', value === 'com');
        setFilter('semDono', value === 'sem');
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

    const toggleTemperature = (temperature: 'cold' | 'warm' | 'hot') => {
        const current = filters.temperatures || [];
        const next = current.includes(temperature)
            ? current.filter(t => t !== temperature)
            : [...current, temperature];
        setFilter('temperatures', next);
    };

    const parseNumber = (value: string): number | undefined => {
        if (!value.trim()) return undefined;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    };

    const toDateInputValue = (date?: Date) => {
        if (!date) return '';
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().split('T')[0];
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Mais Filtros"
            size="md"
        >
            <div className={styles.content}>
                {/* Datas */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Períodos</h3>

                    <div className={styles.filterRow}>
                        <label>Data de criação</label>
                        <div className={styles.dateRange}>
                            <div className={styles.dateInput}>
                                <label>De</label>
                                <input
                                    type="date"
                                    value={toDateInputValue(filters.dataCriacaoInicio)}
                                    onChange={(e) => setFilter('dataCriacaoInicio', e.target.value ? new Date(`${e.target.value}T00:00:00`) : undefined)}
                                />
                            </div>
                            <div className={styles.dateInput}>
                                <label>Até</label>
                                <input
                                    type="date"
                                    value={toDateInputValue(filters.dataCriacaoFim)}
                                    onChange={(e) => setFilter('dataCriacaoFim', e.target.value ? new Date(`${e.target.value}T23:59:59`) : undefined)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.filterRow}>
                        <label>Última atualização</label>
                        <div className={styles.dateRange}>
                            <div className={styles.dateInput}>
                                <label>De</label>
                                <input
                                    type="date"
                                    value={toDateInputValue(filters.dataAtualizacaoInicio)}
                                    onChange={(e) => setFilter('dataAtualizacaoInicio', e.target.value ? new Date(`${e.target.value}T00:00:00`) : undefined)}
                                />
                            </div>
                            <div className={styles.dateInput}>
                                <label>Até</label>
                                <input
                                    type="date"
                                    value={toDateInputValue(filters.dataAtualizacaoFim)}
                                    onChange={(e) => setFilter('dataAtualizacaoFim', e.target.value ? new Date(`${e.target.value}T23:59:59`) : undefined)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Valor */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Faixa de valor do negócio</h3>
                    <div className={styles.inlineRow}>
                        <div className={styles.numberInput}>
                            <label>Mínimo</label>
                            <input
                                type="number"
                                min={0}
                                step={100}
                                value={filters.valorMin ?? ''}
                                onChange={(e) => setFilter('valorMin', parseNumber(e.target.value))}
                                placeholder="0"
                            />
                        </div>
                        <div className={styles.numberInput}>
                            <label>Máximo</label>
                            <input
                                type="number"
                                min={0}
                                step={100}
                                value={filters.valorMax ?? ''}
                                onChange={(e) => setFilter('valorMax', parseNumber(e.target.value))}
                                placeholder="Sem limite"
                            />
                        </div>
                    </div>
                </div>

                {/* Temperatura */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Temperatura do lead</h3>
                    <div className={styles.checkboxGrid}>
                        <Checkbox
                            checked={filters.temperatures.includes('hot')}
                            onChange={() => toggleTemperature('hot')}
                            label="Quente"
                        />
                        <Checkbox
                            checked={filters.temperatures.includes('warm')}
                            onChange={() => toggleTemperature('warm')}
                            label="Morno"
                        />
                        <Checkbox
                            checked={filters.temperatures.includes('cold')}
                            onChange={() => toggleTemperature('cold')}
                            label="Frio"
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
