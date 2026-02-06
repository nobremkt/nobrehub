import { useEffect, useState, useMemo } from 'react';
import { Card, Button, Badge, Spinner, Switch } from '@/design-system';
import { useCollaboratorStore } from '../stores/useCollaboratorStore';
import { useSectorStore } from '../stores/useSectorStore';
import { InboxService } from '@/features/inbox/services/InboxService';
import { Shuffle, Users, Check, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

interface DistributionSettings {
    enabled: boolean;
    mode: 'auto' | 'manual';
    participants: string[];
}

export const LeadDistributionPage = () => {
    const { collaborators, fetchCollaborators, isLoading: loadingCollaborators } = useCollaboratorStore();
    const { sectors, fetchSectors } = useSectorStore();

    const [settings, setSettings] = useState<DistributionSettings>({
        enabled: false,
        mode: 'manual',
        participants: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDistributing, setIsDistributing] = useState(false);
    const [leadCounts, setLeadCounts] = useState<Record<string, number>>({});

    // Load settings and collaborators on mount
    useEffect(() => {
        fetchCollaborators();
        fetchSectors();
        loadSettings();
    }, [fetchCollaborators, fetchSectors]);

    const loadSettings = async () => {
        try {
            const [distributionSettings, counts] = await Promise.all([
                InboxService.getDistributionSettings(),
                InboxService.getActiveLeadsCount()
            ]);
            setSettings(distributionSettings);
            setLeadCounts(counts);
        } catch (error) {
            console.error('Error loading distribution settings:', error);
            toast.error('Erro ao carregar configurações');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await InboxService.saveDistributionSettings(settings);
            toast.success('Configurações salvas!');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Erro ao salvar configurações');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDistributeNow = async () => {
        if (settings.participants.length === 0) {
            toast.error('Selecione pelo menos um participante');
            return;
        }

        setIsDistributing(true);
        try {
            // Temporarily enable for distribution if disabled
            const tempSettings = { ...settings, enabled: true };
            await InboxService.saveDistributionSettings(tempSettings);

            const result = await InboxService.distributeUnassignedLeads();

            // Restore original enabled state
            await InboxService.saveDistributionSettings(settings);

            if (result.distributed > 0) {
                toast.success(`${result.distributed} lead(s) distribuído(s)!`);
                // Refresh counts
                const counts = await InboxService.getActiveLeadsCount();
                setLeadCounts(counts);
            } else {
                toast.info('Nenhum lead para distribuir');
            }
        } catch (error) {
            console.error('Error distributing leads:', error);
            toast.error('Erro ao distribuir leads');
        } finally {
            setIsDistributing(false);
        }
    };

    const toggleParticipant = (collaboratorId: string) => {
        setSettings(prev => ({
            ...prev,
            participants: prev.participants.includes(collaboratorId)
                ? prev.participants.filter(id => id !== collaboratorId)
                : [...prev.participants, collaboratorId]
        }));
    };

    const selectAll = () => {
        const activeCollaboratorIds = collaborators
            .filter(c => c.active)
            .map(c => c.id);
        setSettings(prev => ({ ...prev, participants: activeCollaboratorIds }));
    };

    const deselectAll = () => {
        setSettings(prev => ({ ...prev, participants: [] }));
    };

    const getSectorName = (id?: string) => sectors.find(s => s.id === id)?.name || 'Sem setor';

    // Get sales sector IDs (Vendas HT, Vendas LT)
    const salesSectorIds = useMemo(() => {
        return sectors
            .filter(s => s.name.toLowerCase().includes('vendas'))
            .map(s => s.id);
    }, [sectors]);

    // Sort collaborators by lead count (least first) - ONLY sales sector
    const sortedCollaborators = useMemo(() => {
        return [...collaborators]
            .filter(c => c.active && salesSectorIds.includes(c.sectorId || ''))
            .sort((a, b) => (leadCounts[a.id] || 0) - (leadCounts[b.id] || 0));
    }, [collaborators, leadCounts, salesSectorIds]);

    if (isLoading || loadingCollaborators) {
        return (
            <div className="flex justify-center items-center p-12">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="w-full px-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary mb-1">Distribuição de Leads</h1>
                    <p className="text-text-muted">Configure a distribuição automática de leads para a equipe.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={handleDistributeNow}
                        leftIcon={<Shuffle size={18} />}
                        disabled={isDistributing || settings.participants.length === 0}
                        isLoading={isDistributing}
                    >
                        Distribuir Agora
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        isLoading={isSaving}
                    >
                        Salvar Configurações
                    </Button>
                </div>
            </div>

            {/* Settings Card */}
            <Card variant="elevated" className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-text-primary">Distribuição Automática</h2>
                        <p className="text-sm text-text-muted mt-1">
                            Quando ativado, novos leads serão automaticamente atribuídos aos participantes selecionados.
                        </p>
                    </div>
                    <Switch
                        checked={settings.enabled}
                        onChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                    />
                </div>

                {settings.enabled && (
                    <div className="flex items-center gap-2 p-3 bg-success-500/10 border border-success-500/20 rounded-lg mb-4">
                        <Check size={18} className="text-success-500" />
                        <span className="text-sm text-success-500">
                            Distribuição automática ativada - Novos leads serão distribuídos automaticamente.
                        </span>
                    </div>
                )}

                {!settings.enabled && settings.participants.length > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-warning-500/10 border border-warning-500/20 rounded-lg mb-4">
                        <AlertCircle size={18} className="text-warning-500" />
                        <span className="text-sm text-warning-500">
                            Distribuição manual - Use o botão "Distribuir Agora" para distribuir leads não atribuídos.
                        </span>
                    </div>
                )}
            </Card>

            {/* Participants Section */}
            <Card variant="elevated" className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Users size={20} className="text-primary-500" />
                        <div>
                            <h2 className="text-lg font-semibold text-text-primary">Vendedores</h2>
                            <p className="text-sm text-text-muted">
                                Colaboradores do setor de Vendas. A distribuição usa estratégia "Least Loaded" (quem tem menos recebe).
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={selectAll}>
                            Selecionar Todos
                        </Button>
                        <Button variant="ghost" size="sm" onClick={deselectAll}>
                            Limpar
                        </Button>
                    </div>
                </div>

                <div className="text-sm text-text-muted mb-4">
                    {settings.participants.length} de {sortedCollaborators.length} selecionados
                </div>

                {/* Collaborators Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sortedCollaborators.map(collaborator => {
                        const isSelected = settings.participants.includes(collaborator.id);
                        const leadCount = leadCounts[collaborator.id] || 0;

                        return (
                            <div
                                key={collaborator.id}
                                onClick={() => toggleParticipant(collaborator.id)}
                                className={`
                                    relative p-4 rounded-xl border-2 cursor-pointer transition-all
                                    ${isSelected
                                        ? 'border-primary-500 bg-primary-500/10'
                                        : 'border-border hover:border-border-hover bg-surface-card'
                                    }
                                `}
                            >
                                {/* Selection indicator */}
                                {isSelected && (
                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                                        <Check size={12} className="text-white" />
                                    </div>
                                )}

                                {/* Collaborator info */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-tertiary shrink-0">
                                        {(collaborator.profilePhotoUrl || collaborator.photoUrl) ? (
                                            <img
                                                src={collaborator.profilePhotoUrl || collaborator.photoUrl}
                                                alt={collaborator.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-text-muted text-sm font-medium">
                                                {collaborator.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-text-primary truncate">
                                            {collaborator.name}
                                        </p>
                                        <p className="text-xs text-text-muted truncate">
                                            {getSectorName(collaborator.sectorId)}
                                        </p>
                                    </div>
                                </div>

                                {/* Lead count badge */}
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-xs text-text-muted">Leads ativos</span>
                                    <Badge variant={leadCount === 0 ? 'success' : 'default'}>
                                        {leadCount}
                                    </Badge>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {sortedCollaborators.length === 0 && (
                    <div className="text-center py-12 text-text-muted">
                        Nenhum colaborador ativo encontrado.
                    </div>
                )}
            </Card>

            {/* Info Card */}
            <Card variant="default" className="p-4 bg-surface-secondary">
                <h3 className="font-medium text-text-primary mb-2">ℹ️ Como funciona</h3>
                <ul className="text-sm text-text-muted space-y-1">
                    <li>• <strong>Least Loaded:</strong> O colaborador com menos leads ativos recebe o próximo lead.</li>
                    <li>• <strong>Distribuir Agora:</strong> Distribui todos os leads não atribuídos imediatamente.</li>
                    <li>• <strong>Automático:</strong> Quando ativado, novos leads são atribuídos automaticamente ao chegar.</li>
                </ul>
            </Card>
        </div>
    );
};
