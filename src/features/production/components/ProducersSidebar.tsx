
// Imports needed: useState, useRef, Project, ProductionService, Search, X, Badge, etc.
import { useEffect, useMemo, useState, useRef } from 'react';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useSectorStore } from '@/features/settings/stores/useSectorStore';
import { useProductionStore } from '../stores/useProductionStore';
import { ProductionService } from '../services/ProductionService';
import { Project } from '@/types/project.types';
import { Spinner, Badge } from '@/design-system';
import { User, ChevronRight, Search, X } from 'lucide-react';

// Helper for status colors/labels - duplicate from ProjectBoard or move to common utils?
// For now, I'll inline a simple version or just use text to keep it simple as Sidebar space is small.
// Actually, user wants "results show Producer Name".

const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
        'aguardando': 'Aguardando',
        'em-producao': 'Em Produção',
        'a-revisar': 'A Revisar',
        'revisado': 'Revisado',
        'alteracao': 'Em Alteração',
        'alteracao_interna': 'Alt. Interna',
        'alteracao_cliente': 'Alt. Cliente'
    };
    return labels[status] || status;
};

const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
        'aguardando': 'default',
        'em-producao': 'primary',
        'a-revisar': 'warning',
        'revisado': 'success',
        'alteracao': 'warning',
        'alteracao_interna': 'warning',
        'alteracao_cliente': 'danger'
    };
    return colors[status] || 'default';
};

export const ProducersSidebar = () => {
    const { collaborators, fetchCollaborators, isLoading: isLoadingCollabs } = useCollaboratorStore();
    const { sectors, fetchSectors, isLoading: isLoadingSectors } = useSectorStore();
    const { selectedProducerId, setSelectedProducerId, setHighlightedProjectId } = useProductionStore();

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Project[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (collaborators.length === 0) fetchCollaborators();
        if (sectors.length === 0) fetchSectors();

        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [fetchCollaborators, fetchSectors, collaborators.length, sectors.length]);

    const productionSectorId = useMemo(() => {
        const sector = sectors.find(s => s.name.toLowerCase() === 'produção' || s.name.toLowerCase() === 'production');
        return sector?.id;
    }, [sectors]);

    const producers = useMemo(() => {
        if (!productionSectorId) return [];
        return collaborators.filter(c => c.sectorId === productionSectorId && c.active);
    }, [collaborators, productionSectorId]);

    const getProducerName = (producerId: string) => {
        return collaborators.find(c => c.id === producerId)?.name || 'Desconhecido';
    };

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        setShowResults(true);
        try {
            const results = await ProductionService.searchAllProjects(term);
            setSearchResults(results);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectResult = (project: Project) => {
        setSelectedProducerId(project.producerId);
        setHighlightedProjectId(project.id);
        setShowResults(false);
        setSearchTerm('');
    };

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
            {/* Search Section */}
            <div className="p-4 border-b border-border pb-4" ref={searchRef}>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar projeto..."
                        className="w-full bg-surface-secondary border border-border rounded-md pl-9 pr-8 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
                    />
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    {searchTerm && (
                        <button
                            onClick={() => { setSearchTerm(''); setShowResults(false); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                        >
                            <X size={14} />
                        </button>
                    )}

                    {/* Dropdown Results */}
                    {showResults && (
                        <div className="absolute top-full left-0 w-[300px] mt-2 bg-surface-primary border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in max-h-96 overflow-y-auto">
                            {isSearching ? (
                                <div className="p-4 text-center text-text-muted">
                                    <Spinner size="sm" className="mx-auto mb-2" />
                                    Buscando...
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div>
                                    {searchResults.map(result => (
                                        <div
                                            key={result.id}
                                            className="p-3 border-b border-border/50 last:border-0 hover:bg-surface-secondary cursor-pointer transition-colors"
                                            onClick={() => handleSelectResult(result)}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-text-primary truncate text-sm">{result.name}</span>
                                                <Badge variant={getStatusColor(result.status)} content={getStatusLabel(result.status)} />
                                            </div>
                                            <div className="flex flex-col gap-1 text-xs text-text-muted">
                                                <span className="flex items-center gap-1">
                                                    <User size={10} />
                                                    {getProducerName(result.producerId)}
                                                </span>
                                                <span>Cliente: {result.leadName}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-text-muted text-sm">
                                    Nenhum projeto encontrado.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

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
                                        {(producer.profilePhotoUrl || producer.photoUrl) ? (
                                            <img src={producer.profilePhotoUrl || producer.photoUrl} alt={producer.name} className="w-full h-full object-cover" />
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
