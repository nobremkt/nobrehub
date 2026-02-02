
import { useEffect, useMemo } from 'react';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useSectorStore } from '@/features/settings/stores/useSectorStore';
import { useProductionStore } from '../stores/useProductionStore';
import { Spinner } from '@/design-system';
import { User, ChevronRight } from 'lucide-react';

export const ProducersSidebar = () => {
    const { collaborators, fetchCollaborators, isLoading: isLoadingCollabs } = useCollaboratorStore();
    const { sectors, fetchSectors, isLoading: isLoadingSectors } = useSectorStore();
    const { selectedProducerId, setSelectedProducerId } = useProductionStore();

    useEffect(() => {
        if (collaborators.length === 0) fetchCollaborators();
        if (sectors.length === 0) fetchSectors();
    }, [fetchCollaborators, fetchSectors, collaborators.length, sectors.length]);

    const productionSectorId = useMemo(() => {
        const sector = sectors.find(s => s.name.toLowerCase() === 'produção' || s.name.toLowerCase() === 'production');
        return sector?.id;
    }, [sectors]);

    const producers = useMemo(() => {
        if (!productionSectorId) return [];
        return collaborators.filter(c => c.sectorId === productionSectorId && c.active);
    }, [collaborators, productionSectorId]);

    const isLoading = isLoadingCollabs || isLoadingSectors;

    if (isLoading && producers.length === 0) {
        return (
            <div className="w-64 h-full border-r border-border bg-surface-primary flex items-center justify-center">
                <Spinner size="md" />
            </div>
        );
    }

    if (!productionSectorId) {
        return (
            <div className="w-64 h-full border-r border-border bg-surface-primary p-4 text-center text-text-muted text-sm">
                Setor "Produção" não encontrado.
            </div>
        );
    }

    return (
        <aside className="w-64 h-full border-r border-border bg-surface-primary flex flex-col">
            <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-text-primary">Equipe de Produção</h2>
                <p className="text-xs text-text-muted">{producers.length} produtores</p>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
                {producers.length > 0 ? (
                    <div className="space-y-1 px-2">
                        {producers.map(producer => {
                            const isSelected = selectedProducerId === producer.id;

                            return (
                                <button
                                    key={producer.id}
                                    onClick={() => setSelectedProducerId(producer.id)}
                                    className={`
                                        w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors
                                        ${isSelected
                                            ? 'bg-primary-500/10 text-primary-500'
                                            : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                                        }
                                    `}
                                >
                                    <div className={`
                                        w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0
                                        ${isSelected ? 'ring-2 ring-primary-500' : 'bg-surface-tertiary'}
                                    `}>
                                        {producer.photoUrl ? (
                                            <img src={producer.photoUrl} alt={producer.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={14} />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{producer.name}</p>
                                        <p className="text-xs opacity-70 truncate">{producer.email}</p>
                                    </div>

                                    {isSelected && <ChevronRight size={16} />}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-4 text-center text-text-muted text-sm">
                        Nenhum produtor encontrado neste setor.
                    </div>
                )}
            </div>
        </aside>
    );
};
